"""
ProfileGuard — X (Twitter) API v2 Connector
=============================================

Provides read-only access to the X API v2 for user lookups and recent
tweet searches.  Tracks per-request costs against a configurable monthly
budget cap.

Environment variables
---------------------
X_BEARER_TOKEN, X_API_BASE (default ``https://api.x.com/2``),
X_MONTHLY_CREDIT_BUDGET (in USD, default unlimited)
"""

from __future__ import annotations

import asyncio
import logging
import os
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import httpx

from app.connectors import BaseConnector
from app.connectors.rate_limiter import BudgetTracker, RateLimiter

logger = logging.getLogger(__name__)

# Approximate per-request costs for the Basic tier ($100/mo for 10 k reads)
_COST_USER_LOOKUP: float = 0.01
_COST_TWEET_SEARCH: float = 0.01


class XApiConnector(BaseConnector):
    """Connector for the X (Twitter) API v2.

    Parameters
    ----------
    rate_limiter : RateLimiter | None
        Shared rate limiter (optional).
    """

    PLATFORM = "x_twitter"

    def __init__(self, rate_limiter: Optional[RateLimiter] = None) -> None:
        self._bearer_token: str = os.getenv("X_BEARER_TOKEN", "")
        self._base_url: str = os.getenv("X_API_BASE", "https://api.x.com/2").rstrip("/")
        budget_str = os.getenv("X_MONTHLY_CREDIT_BUDGET", "")
        budget_usd = float(budget_str) if budget_str else None

        self._budget = BudgetTracker(budget_usd=budget_usd)
        self._rate_limiter = rate_limiter

        # Rate-limit header tracking
        self._rate_remaining: Optional[int] = None
        self._rate_limit: Optional[int] = None
        self._rate_reset: Optional[str] = None

        logger.info(
            "XApiConnector initialised (token=%s, base=%s, budget=$%s)",
            self._mask_secret(self._bearer_token),
            self._base_url,
            budget_usd if budget_usd is not None else "unlimited",
        )

    # ------------------------------------------------------------------ #
    #  BaseConnector interface                                            #
    # ------------------------------------------------------------------ #

    async def fetch_profile(self, handle: str) -> Dict[str, Any]:
        """Convenience wrapper — delegates to :meth:`fetch_user_by_username`."""
        return await self.fetch_user_by_username(handle)

    def check_rate_limit(self) -> Dict[str, Any]:
        """Return the most recently observed rate-limit headers."""
        return {
            "remaining": self._rate_remaining,
            "limit": self._rate_limit,
            "resets_at": self._rate_reset,
            "ok": self._rate_remaining is None or self._rate_remaining > 0,
        }

    def get_remaining_budget(self) -> Dict[str, Any]:
        """Return the budget tracker status."""
        return self._budget.status()

    # ------------------------------------------------------------------ #
    #  User lookup                                                        #
    # ------------------------------------------------------------------ #

    async def fetch_user_by_username(self, username: str) -> Dict[str, Any]:
        """Look up a single X user by username.

        Parameters
        ----------
        username : str
            Twitter / X handle **without** the ``@`` prefix.

        Returns
        -------
        dict
            ``{"platform": "x_twitter", "handle": str, "raw": dict}``

        Raises
        ------
        RuntimeError
            If the monthly budget is exhausted.
        """
        if not self._budget.record(_COST_USER_LOOKUP):
            raise RuntimeError(
                "X API monthly budget exhausted — cannot make further requests"
            )

        if self._is_mock_mode(self._bearer_token):
            return self._mock_user(username)

        url = f"{self._base_url}/users/by/username/{username}"
        params = {
            "user.fields": "created_at,public_metrics,description,profile_image_url,verified",
        }

        logger.info("XApiConnector.fetch_user_by_username: GET %s", url)
        data = await self._request("GET", url, params=params)

        return {"platform": "x_twitter", "handle": username, "raw": data.get("data", data)}

    # ------------------------------------------------------------------ #
    #  Tweet search                                                       #
    # ------------------------------------------------------------------ #

    async def search_recent_tweets(
        self,
        query: str,
        max_results: int = 10,
    ) -> Dict[str, Any]:
        """Search recent tweets (last 7 days) matching *query*.

        Parameters
        ----------
        query : str
            X search query string.
        max_results : int
            Number of results (10–100).

        Returns
        -------
        dict
            ``{"platform": "x_twitter", "query": str, "tweets": list}``
        """
        if not self._budget.record(_COST_TWEET_SEARCH):
            raise RuntimeError(
                "X API monthly budget exhausted — cannot make further requests"
            )

        if self._is_mock_mode(self._bearer_token):
            return self._mock_tweets(query, max_results)

        url = f"{self._base_url}/tweets/search/recent"
        params = {
            "query": query,
            "max_results": str(max(10, min(max_results, 100))),
            "tweet.fields": "created_at,author_id,public_metrics,text",
        }

        logger.info("XApiConnector.search_recent_tweets: GET %s (query=%s)", url, query)
        data = await self._request("GET", url, params=params)

        return {
            "platform": "x_twitter",
            "query": query,
            "tweets": data.get("data", []),
            "meta": data.get("meta", {}),
        }

    # ------------------------------------------------------------------ #
    #  HTTP helper with exponential backoff                               #
    # ------------------------------------------------------------------ #

    async def _request(
        self,
        method: str,
        url: str,
        *,
        params: Optional[Dict[str, str]] = None,
        retries: int = 4,
    ) -> Dict[str, Any]:
        """Issue an HTTP request with retry + exponential backoff."""
        if self._rate_limiter and not self._rate_limiter.allow(self.PLATFORM):
            raise RuntimeError("Rate limit reached for X API")

        headers = {"Authorization": f"Bearer {self._bearer_token}"}
        last_exc: Optional[Exception] = None

        for attempt in range(1, retries + 1):
            try:
                async with httpx.AsyncClient(timeout=30.0) as client:
                    resp = await client.request(
                        method, url, params=params, headers=headers
                    )

                # Track rate-limit headers
                self._update_rate_headers(resp)

                if resp.status_code == 429:
                    reset_after = self._backoff_from_headers(resp, attempt)
                    logger.warning(
                        "X API 429 — retrying in %.1fs (attempt %d/%d)",
                        reset_after,
                        attempt,
                        retries,
                    )
                    await asyncio.sleep(reset_after)
                    continue

                if resp.status_code in (401, 403):
                    logger.error(
                        "X API auth error %d — bearer token may be invalid",
                        resp.status_code,
                    )
                    raise PermissionError(
                        f"X API auth error ({resp.status_code}): re-authenticate"
                    )

                if resp.status_code >= 500:
                    wait = 2 ** attempt
                    logger.warning(
                        "X API %d — retrying in %ds (attempt %d/%d)",
                        resp.status_code,
                        wait,
                        attempt,
                        retries,
                    )
                    await asyncio.sleep(wait)
                    continue

                resp.raise_for_status()
                return resp.json()

            except httpx.HTTPStatusError:
                raise
            except httpx.RequestError as exc:
                last_exc = exc
                wait = 2 ** attempt
                logger.warning(
                    "X API request error (attempt %d/%d): %s", attempt, retries, exc
                )
                await asyncio.sleep(wait)

        raise ConnectionError(
            f"X API request failed after {retries} attempts"
        ) from last_exc

    # ------------------------------------------------------------------ #
    #  Rate-limit header helpers                                          #
    # ------------------------------------------------------------------ #

    def _update_rate_headers(self, resp: httpx.Response) -> None:
        """Parse X-Rate-Limit-* headers from the response."""
        remaining = resp.headers.get("x-rate-limit-remaining")
        limit = resp.headers.get("x-rate-limit-limit")
        reset_ts = resp.headers.get("x-rate-limit-reset")

        if remaining is not None:
            self._rate_remaining = int(remaining)
        if limit is not None:
            self._rate_limit = int(limit)
        if reset_ts is not None:
            try:
                dt = datetime.fromtimestamp(int(reset_ts), tz=timezone.utc)
                self._rate_reset = dt.isoformat()
            except (ValueError, OSError):
                self._rate_reset = reset_ts

    @staticmethod
    def _backoff_from_headers(resp: httpx.Response, attempt: int) -> float:
        """Compute backoff using the reset header, falling back to exp."""
        reset_ts = resp.headers.get("x-rate-limit-reset")
        if reset_ts:
            try:
                reset_dt = datetime.fromtimestamp(int(reset_ts), tz=timezone.utc)
                delta = (reset_dt - datetime.now(tz=timezone.utc)).total_seconds()
                if delta > 0:
                    return min(delta + 1, 120)
            except (ValueError, OSError):
                pass
        return float(2 ** attempt)

    # ------------------------------------------------------------------ #
    #  Mock responses                                                     #
    # ------------------------------------------------------------------ #

    @staticmethod
    def _mock_user(username: str) -> Dict[str, Any]:
        logger.info("MOCK MODE — returning synthetic X user for %s", username)
        return {
            "platform": "x_twitter",
            "handle": username,
            "raw": {
                "id": "1234567890",
                "name": f"Mock {username}",
                "username": username,
                "created_at": "2020-01-15T12:00:00.000Z",
                "description": "This is a mock X/Twitter profile for testing.",
                "profile_image_url": "https://pbs.twimg.com/mock_pic.jpg",
                "verified": False,
                "public_metrics": {
                    "followers_count": 2500,
                    "following_count": 300,
                    "tweet_count": 1800,
                    "listed_count": 42,
                },
            },
        }

    @staticmethod
    def _mock_tweets(query: str, max_results: int) -> Dict[str, Any]:
        logger.info("MOCK MODE — returning synthetic tweets for query=%s", query)
        tweets: List[Dict[str, Any]] = [
            {
                "id": f"mock_tweet_{i}",
                "text": f"Mock tweet #{i} matching '{query}'",
                "author_id": "1234567890",
                "created_at": "2024-06-01T10:00:00.000Z",
                "public_metrics": {
                    "retweet_count": i * 2,
                    "reply_count": i,
                    "like_count": i * 5,
                    "quote_count": 0,
                },
            }
            for i in range(1, min(max_results, 5) + 1)
        ]
        return {
            "platform": "x_twitter",
            "query": query,
            "tweets": tweets,
            "meta": {"result_count": len(tweets)},
        }
