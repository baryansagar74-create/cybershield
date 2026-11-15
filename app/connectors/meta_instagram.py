"""
ProfileGuard — Meta / Instagram Business Discovery Connector
=============================================================

Uses the **Instagram Business Discovery API** (via the Facebook Graph
API) to retrieve public profile information for a target Instagram
account, and optionally fetch Facebook Page data.

Environment variables
---------------------
META_APP_ID, META_APP_SECRET, META_LONG_LIVED_TOKEN,
META_GRAPH_VERSION (e.g. ``v19.0``), IG_VIEWER_BUSINESS_ID
"""

from __future__ import annotations

import logging
import os
from datetime import datetime, timezone
from typing import Any, Dict, Optional

import httpx

from app.connectors import BaseConnector
from app.connectors.rate_limiter import RateLimiter

logger = logging.getLogger(__name__)

# Default fields requested via Business Discovery
_BIZ_DISCOVERY_FIELDS = (
    "username,name,biography,followers_count,follows_count,"
    "media_count,profile_picture_url,website,ig_id"
)

# Default fields for a Facebook Page lookup
_PAGE_FIELDS = "name,about,fan_count,link,verification_status,picture"


class MetaInstagramConnector(BaseConnector):
    """Connector for the Meta (Facebook + Instagram) Graph API.

    Parameters
    ----------
    rate_limiter : RateLimiter | None
        Optional shared rate limiter instance.
    """

    PLATFORM = "meta_instagram"

    def __init__(self, rate_limiter: Optional[RateLimiter] = None) -> None:
        # Config from env — never hardcoded
        self._app_id: str = os.getenv("META_APP_ID", "")
        self._app_secret: str = os.getenv("META_APP_SECRET", "")
        self._token: str = os.getenv("META_LONG_LIVED_TOKEN", "")
        self._graph_version: str = os.getenv("META_GRAPH_VERSION", "v19.0")
        self._viewer_id: str = os.getenv("IG_VIEWER_BUSINESS_ID", "")

        self._base_url: str = f"https://graph.facebook.com/{self._graph_version}/"

        # Rate limit / usage tracking (populated from X-App-Usage header)
        self._app_usage: Dict[str, float] = {}
        self._rate_limiter = rate_limiter

        # Token expiry tracking (Meta long-lived tokens last ~60 days)
        self._token_issued_at: Optional[datetime] = None
        self._token_expires_at: Optional[datetime] = None

        logger.info(
            "MetaInstagramConnector initialised (token=%s, viewer_id=%s)",
            self._mask_secret(self._token),
            self._viewer_id or "<not set>",
        )

    # ------------------------------------------------------------------ #
    #  BaseConnector interface                                            #
    # ------------------------------------------------------------------ #

    async def fetch_profile(self, handle: str) -> Dict[str, Any]:
        """Convenience wrapper — delegates to :meth:`fetch_business_profile`."""
        return await self.fetch_business_profile(handle)

    def check_rate_limit(self) -> Dict[str, Any]:
        """Return current App-Usage percentages reported by Meta."""
        call_pct = self._app_usage.get("call_count", 0.0)
        cpu_pct = self._app_usage.get("total_cputime", 0.0)
        time_pct = self._app_usage.get("total_time", 0.0)
        ok = all(v < 80.0 for v in (call_pct, cpu_pct, time_pct))
        return {
            "remaining": None,  # Meta uses percentage-based usage
            "limit": None,
            "resets_at": None,
            "ok": ok,
            "app_usage": self._app_usage,
        }

    def get_remaining_budget(self) -> Dict[str, Any]:
        """Meta Graph API is not billed per-call (no budget concept)."""
        return {"spent_usd": 0.0, "budget_usd": None, "remaining_usd": None}

    # ------------------------------------------------------------------ #
    #  Instagram Business Discovery                                       #
    # ------------------------------------------------------------------ #

    async def fetch_business_profile(
        self,
        target_username: str,
        fields: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Fetch an Instagram Business / Creator profile via Business Discovery.

        Parameters
        ----------
        target_username : str
            Instagram username of the target account.
        fields : str | None
            Comma-separated list of fields.  Defaults to
            ``_BIZ_DISCOVERY_FIELDS``.

        Returns
        -------
        dict
            ``{"platform": "instagram", "handle": str, "raw": dict}``
        """
        if self._is_mock_mode(self._token):
            return self._mock_business_profile(target_username)

        self._warn_if_token_expiring()

        if not self._viewer_id:
            raise ValueError("IG_VIEWER_BUSINESS_ID is not configured")

        fields = fields or _BIZ_DISCOVERY_FIELDS
        bd_field = f"business_discovery.username({target_username}){{{fields}}}"

        url = f"{self._base_url}{self._viewer_id}"
        params = {"fields": bd_field, "access_token": self._token}

        logger.info(
            "MetaInstagramConnector.fetch_business_profile: GET %s (target=%s)",
            url,
            target_username,
        )

        data = await self._request("GET", url, params=params)
        raw = data.get("business_discovery", data)

        return {"platform": "instagram", "handle": target_username, "raw": raw}

    # ------------------------------------------------------------------ #
    #  Facebook Page lookup                                               #
    # ------------------------------------------------------------------ #

    async def fetch_page_info(
        self,
        page_id: str,
        fields: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Fetch public info about a Facebook Page.

        Parameters
        ----------
        page_id : str
            Numeric Page ID.
        fields : str | None
            Comma-separated field list (defaults to ``_PAGE_FIELDS``).

        Returns
        -------
        dict
            ``{"platform": "facebook_page", "handle": str, "raw": dict}``
        """
        if self._is_mock_mode(self._token):
            return self._mock_page_info(page_id)

        self._warn_if_token_expiring()

        fields = fields or _PAGE_FIELDS
        url = f"{self._base_url}{page_id}"
        params = {"fields": fields, "access_token": self._token}

        logger.info(
            "MetaInstagramConnector.fetch_page_info: GET %s (page_id=%s)",
            url,
            page_id,
        )

        data = await self._request("GET", url, params=params)
        return {"platform": "facebook_page", "handle": page_id, "raw": data}

    # ------------------------------------------------------------------ #
    #  Token expiry tracking                                              #
    # ------------------------------------------------------------------ #

    def set_token_expiry(self, expires_at: datetime) -> None:
        """Manually set the token expiry so the connector can warn early."""
        self._token_expires_at = expires_at

    def _warn_if_token_expiring(self) -> None:
        if self._token_expires_at is None:
            return
        remaining = self._token_expires_at - datetime.now(tz=timezone.utc)
        days = remaining.total_seconds() / 86400
        if days < 7:
            logger.warning(
                "META_LONG_LIVED_TOKEN expires in %.1f days — renew soon!", days
            )

    # ------------------------------------------------------------------ #
    #  HTTP helper                                                        #
    # ------------------------------------------------------------------ #

    async def _request(
        self,
        method: str,
        url: str,
        *,
        params: Optional[Dict[str, str]] = None,
        json_body: Optional[Dict[str, Any]] = None,
        retries: int = 3,
    ) -> Dict[str, Any]:
        """Make an HTTP request with retry and error handling."""
        if self._rate_limiter and not self._rate_limiter.allow(self.PLATFORM):
            raise RuntimeError("Rate limit reached for Meta Graph API")

        last_exc: Optional[Exception] = None
        for attempt in range(1, retries + 1):
            try:
                async with httpx.AsyncClient(timeout=30.0) as client:
                    resp = await client.request(
                        method, url, params=params, json=json_body
                    )

                # Track X-App-Usage header
                usage_header = resp.headers.get("x-app-usage")
                if usage_header:
                    import json as _json

                    try:
                        self._app_usage = _json.loads(usage_header)
                    except Exception:
                        pass

                if resp.status_code == 429:
                    wait = 2 ** attempt
                    logger.warning(
                        "Meta 429 rate-limited — retrying in %ds (attempt %d/%d)",
                        wait,
                        attempt,
                        retries,
                    )
                    import asyncio

                    await asyncio.sleep(wait)
                    continue

                if resp.status_code in (401, 403):
                    logger.error(
                        "Meta auth error %d — token may be invalid or expired",
                        resp.status_code,
                    )
                    raise PermissionError(
                        f"Meta API auth error ({resp.status_code}): re-authenticate"
                    )

                if resp.status_code >= 500:
                    wait = 2 ** attempt
                    logger.warning(
                        "Meta %d server error — retrying in %ds", resp.status_code, wait
                    )
                    import asyncio

                    await asyncio.sleep(wait)
                    continue

                resp.raise_for_status()
                return resp.json()

            except httpx.HTTPStatusError:
                raise
            except httpx.RequestError as exc:
                last_exc = exc
                logger.warning(
                    "Meta request error (attempt %d/%d): %s",
                    attempt,
                    retries,
                    exc,
                )
                import asyncio

                await asyncio.sleep(2 ** attempt)

        raise ConnectionError(
            f"Meta API request failed after {retries} attempts"
        ) from last_exc

    # ------------------------------------------------------------------ #
    #  Mock responses                                                     #
    # ------------------------------------------------------------------ #

    @staticmethod
    def _mock_business_profile(target_username: str) -> Dict[str, Any]:
        """Return a synthetic Instagram business profile (for dev/test)."""
        logger.info("MOCK MODE — returning synthetic Instagram profile for %s", target_username)
        return {
            "platform": "instagram",
            "handle": target_username,
            "raw": {
                "username": target_username,
                "name": f"Mock User ({target_username})",
                "biography": "This is a mock biography for testing.",
                "followers_count": 12345,
                "follows_count": 678,
                "media_count": 90,
                "profile_picture_url": "https://example.com/mock_pic.jpg",
                "website": "https://example.com",
                "ig_id": "99999999",
            },
        }

    @staticmethod
    def _mock_page_info(page_id: str) -> Dict[str, Any]:
        """Return a synthetic Facebook Page response (for dev/test)."""
        logger.info("MOCK MODE — returning synthetic Facebook Page for %s", page_id)
        return {
            "platform": "facebook_page",
            "handle": page_id,
            "raw": {
                "id": page_id,
                "name": f"Mock Page ({page_id})",
                "about": "This is a mock Facebook page.",
                "fan_count": 5432,
                "link": f"https://facebook.com/{page_id}",
                "verification_status": "not_verified",
            },
        }
