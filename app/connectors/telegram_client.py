"""
ProfileGuard — Telegram Bot API Connector
==========================================

Uses the **Telegram Bot API** to query public channel / group info and
member counts.  Only works for public chats or chats the bot has joined.

Environment variables
---------------------
TELEGRAM_BOT_TOKEN — token obtained from @BotFather
"""

from __future__ import annotations

import asyncio
import logging
import os
from typing import Any, Dict, Optional

import httpx

from app.connectors import BaseConnector
from app.connectors.rate_limiter import RateLimiter

logger = logging.getLogger(__name__)


class TelegramConnector(BaseConnector):
    """Connector for the Telegram Bot API.

    Parameters
    ----------
    rate_limiter : RateLimiter | None
        Shared rate limiter (optional).
    """

    PLATFORM = "telegram"

    def __init__(self, rate_limiter: Optional[RateLimiter] = None) -> None:
        self._token: str = os.getenv("TELEGRAM_BOT_TOKEN", "")
        self._base_url: str = f"https://api.telegram.org/bot{self._token}/"
        self._rate_limiter = rate_limiter

        logger.info(
            "TelegramConnector initialised (token=%s)",
            self._mask_secret(self._token),
        )

    # ------------------------------------------------------------------ #
    #  BaseConnector interface                                            #
    # ------------------------------------------------------------------ #

    async def fetch_profile(self, handle: str) -> Dict[str, Any]:
        """Convenience wrapper — delegates to :meth:`get_chat`."""
        return await self.get_chat(handle)

    def check_rate_limit(self) -> Dict[str, Any]:
        """Telegram Bot API does not expose rate-limit headers.

        The practical limit is ~30 messages/second (or 1/sec per chat
        for the same chat).  We return a simple "ok" flag.
        """
        return {
            "remaining": None,
            "limit": None,
            "resets_at": None,
            "ok": True,
        }

    def get_remaining_budget(self) -> Dict[str, Any]:
        """Telegram Bot API is free — no budget concept."""
        return {"spent_usd": 0.0, "budget_usd": None, "remaining_usd": None}

    # ------------------------------------------------------------------ #
    #  Chat lookup                                                        #
    # ------------------------------------------------------------------ #

    async def get_chat(self, chat_id: str) -> Dict[str, Any]:
        """Retrieve chat info for a public channel, group, or supergroup.

        Parameters
        ----------
        chat_id : str
            Numeric ID or ``@username`` of the chat.

        Returns
        -------
        dict
            ``{"platform": "telegram", "handle": str, "raw": dict}``
        """
        if self._is_mock_mode(self._token):
            return self._mock_chat(chat_id)

        # Ensure public usernames are prefixed with @
        if not chat_id.startswith("@") and not chat_id.lstrip("-").isdigit():
            chat_id = f"@{chat_id}"

        url = f"{self._base_url}getChat"
        params = {"chat_id": chat_id}

        logger.info("TelegramConnector.get_chat: %s (chat_id=%s)", url, chat_id)
        data = await self._request("GET", url, params=params)

        return {
            "platform": "telegram",
            "handle": chat_id,
            "raw": data.get("result", data),
        }

    async def get_chat_member_count(self, chat_id: str) -> Dict[str, Any]:
        """Return the number of members in a chat.

        Parameters
        ----------
        chat_id : str
            Numeric ID or ``@username``.

        Returns
        -------
        dict
            ``{"platform": "telegram", "chat_id": str, "member_count": int}``
        """
        if self._is_mock_mode(self._token):
            return self._mock_member_count(chat_id)

        if not chat_id.startswith("@") and not chat_id.lstrip("-").isdigit():
            chat_id = f"@{chat_id}"

        url = f"{self._base_url}getChatMemberCount"
        params = {"chat_id": chat_id}

        logger.info(
            "TelegramConnector.get_chat_member_count: %s (chat_id=%s)", url, chat_id
        )
        data = await self._request("GET", url, params=params)

        return {
            "platform": "telegram",
            "chat_id": chat_id,
            "member_count": data.get("result", 0),
        }

    # ------------------------------------------------------------------ #
    #  HTTP helper                                                        #
    # ------------------------------------------------------------------ #

    async def _request(
        self,
        method: str,
        url: str,
        *,
        params: Optional[Dict[str, str]] = None,
        retries: int = 3,
    ) -> Dict[str, Any]:
        """Issue a Telegram Bot API request with retry."""
        if self._rate_limiter and not self._rate_limiter.allow(self.PLATFORM):
            raise RuntimeError("Rate limit reached for Telegram API")

        last_exc: Optional[Exception] = None
        for attempt in range(1, retries + 1):
            try:
                async with httpx.AsyncClient(timeout=30.0) as client:
                    resp = await client.request(method, url, params=params)

                if resp.status_code == 429:
                    retry_after = int(
                        resp.headers.get("Retry-After", str(2 ** attempt))
                    )
                    logger.warning(
                        "Telegram 429 — retrying in %ds (attempt %d/%d)",
                        retry_after,
                        attempt,
                        retries,
                    )
                    await asyncio.sleep(retry_after)
                    continue

                if resp.status_code in (401, 403):
                    logger.error(
                        "Telegram auth error %d — bot token may be invalid",
                        resp.status_code,
                    )
                    raise PermissionError(
                        f"Telegram API auth error ({resp.status_code}): "
                        "check TELEGRAM_BOT_TOKEN"
                    )

                if resp.status_code >= 500:
                    wait = 2 ** attempt
                    logger.warning(
                        "Telegram %d server error — retrying in %ds",
                        resp.status_code,
                        wait,
                    )
                    await asyncio.sleep(wait)
                    continue

                resp.raise_for_status()
                body = resp.json()

                # Telegram wraps responses in {"ok": true, "result": ...}
                if not body.get("ok", False):
                    desc = body.get("description", "Unknown Telegram API error")
                    logger.error("Telegram API error: %s", desc)
                    raise RuntimeError(f"Telegram API error: {desc}")

                return body

            except httpx.HTTPStatusError:
                raise
            except httpx.RequestError as exc:
                last_exc = exc
                wait = 2 ** attempt
                logger.warning(
                    "Telegram request error (attempt %d/%d): %s",
                    attempt,
                    retries,
                    exc,
                )
                await asyncio.sleep(wait)

        raise ConnectionError(
            f"Telegram API request failed after {retries} attempts"
        ) from last_exc

    # ------------------------------------------------------------------ #
    #  Mock responses                                                     #
    # ------------------------------------------------------------------ #

    @staticmethod
    def _mock_chat(chat_id: str) -> Dict[str, Any]:
        logger.info("MOCK MODE — returning synthetic Telegram chat for %s", chat_id)
        return {
            "platform": "telegram",
            "handle": chat_id,
            "raw": {
                "id": -1001234567890,
                "title": f"Mock Channel ({chat_id})",
                "username": chat_id.lstrip("@"),
                "type": "channel",
                "description": "This is a mock Telegram channel for testing.",
                "invite_link": "https://t.me/mock_channel",
                "photo": None,
            },
        }

    @staticmethod
    def _mock_member_count(chat_id: str) -> Dict[str, Any]:
        logger.info(
            "MOCK MODE — returning synthetic member count for %s", chat_id
        )
        return {
            "platform": "telegram",
            "chat_id": chat_id,
            "member_count": 8765,
        }
