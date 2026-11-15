"""
ProfileGuard — Platform API Connectors
=======================================

Base connector interface and public re-exports for every platform
connector used by the scanning pipeline.
"""

from __future__ import annotations

import abc
import logging
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)


class BaseConnector(abc.ABC):
    """Abstract base class for all platform connectors.

    Every concrete connector **must** implement the three abstract methods
    below.  Shared behaviour (mock-mode detection, masked logging) lives
    here so subclasses stay DRY.
    """

    # Subclasses should set this to identify the platform in logs/metrics
    PLATFORM: str = "unknown"

    # ------------------------------------------------------------------ #
    #  Abstract interface                                                 #
    # ------------------------------------------------------------------ #

    @abc.abstractmethod
    async def fetch_profile(self, handle: str) -> Dict[str, Any]:
        """Retrieve a public profile by *handle* (username or ID).

        Returns a dict whose shape is platform-specific but **always**
        contains at minimum::

            {"platform": str, "handle": str, "raw": dict}
        """
        ...

    @abc.abstractmethod
    def check_rate_limit(self) -> Dict[str, Any]:
        """Return the current rate-limit state for this connector.

        Returns::

            {
                "remaining": int | None,
                "limit": int | None,
                "resets_at": str | None,   # ISO-8601
                "ok": bool,
            }
        """
        ...

    @abc.abstractmethod
    def get_remaining_budget(self) -> Dict[str, Any]:
        """Return the remaining API spend budget (if applicable).

        Returns::

            {
                "spent_usd": float,
                "budget_usd": float | None,
                "remaining_usd": float | None,
            }
        """
        ...

    # ------------------------------------------------------------------ #
    #  Helpers available to all connectors                                #
    # ------------------------------------------------------------------ #

    @staticmethod
    def _mask_secret(secret: Optional[str], visible: int = 4) -> str:
        """Return a masked version of *secret* suitable for logging.

        Never log raw tokens — use this helper instead.
        """
        if not secret:
            return "****"
        if len(secret) <= visible:
            return "****"
        return secret[:visible] + "****"

    def _is_mock_mode(self, token: Optional[str]) -> bool:
        """Return ``True`` when *token* starts with ``MOCK_``.

        Connectors check this and return synthetic / canned responses
        instead of hitting the real API.
        """
        return bool(token and token.startswith("MOCK_"))
