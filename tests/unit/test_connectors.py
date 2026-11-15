"""
ProfileGuard — Unit Tests for Platform Connectors
===================================================

All external HTTP calls are mocked via ``httpx``'s transport layer so
that tests run entirely offline.
"""

from __future__ import annotations

import asyncio
import json
import os
from typing import Any, Dict
from unittest.mock import patch

import httpx
import pytest

# ---------------------------------------------------------------------------
# Helpers — fake httpx transport that returns canned responses
# ---------------------------------------------------------------------------


class _MockTransport(httpx.AsyncBaseTransport):
    """Return pre-configured responses for any request."""

    def __init__(self, responses: Dict[str, httpx.Response] | None = None, default_json: Any = None, status_code: int = 200, headers: Dict[str, str] | None = None) -> None:
        self._responses = responses or {}
        self._default_json = default_json or {}
        self._status_code = status_code
        self._headers = headers or {}

    async def handle_async_request(self, request: httpx.Request) -> httpx.Response:
        url = str(request.url)
        for key, resp in self._responses.items():
            if key in url:
                return resp
        return httpx.Response(
            status_code=self._status_code,
            json=self._default_json,
            headers=self._headers,
        )


def _env(**overrides: str):
    """Context manager to temporarily set env vars."""
    return patch.dict(os.environ, overrides, clear=False)


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture(autouse=True)
def _clear_env(monkeypatch):
    """Ensure no real tokens leak into tests."""
    for var in (
        "META_APP_ID",
        "META_APP_SECRET",
        "META_LONG_LIVED_TOKEN",
        "META_GRAPH_VERSION",
        "IG_VIEWER_BUSINESS_ID",
        "X_BEARER_TOKEN",
        "X_API_BASE",
        "X_MONTHLY_CREDIT_BUDGET",
        "TELEGRAM_BOT_TOKEN",
        "GOOGLE_SAFE_BROWSING_KEY",
        "VIRUSTOTAL_API_KEY",
    ):
        monkeypatch.delenv(var, raising=False)


# =========================================================================
# 1. BaseConnector
# =========================================================================


class TestBaseConnector:
    """Tests for the abstract base class helpers."""

    def test_mask_secret_normal(self):
        from app.connectors import BaseConnector

        assert BaseConnector._mask_secret("abcdef1234567890") == "abcd****"

    def test_mask_secret_short(self):
        from app.connectors import BaseConnector

        assert BaseConnector._mask_secret("ab") == "****"

    def test_mask_secret_none(self):
        from app.connectors import BaseConnector

        assert BaseConnector._mask_secret(None) == "****"

    def test_is_mock_mode_true(self):
        from app.connectors import BaseConnector

        # Cannot instantiate ABC, so test via a concrete subclass
        assert BaseConnector._is_mock_mode(None, "MOCK_abc123") is True  # type: ignore[arg-type]

    def test_is_mock_mode_false(self):
        from app.connectors import BaseConnector

        assert BaseConnector._is_mock_mode(None, "real_token") is False  # type: ignore[arg-type]


# =========================================================================
# 2. MetaInstagramConnector
# =========================================================================


class TestMetaInstagramConnector:
    """Tests for MetaInstagramConnector."""

    @pytest.mark.asyncio
    async def test_fetch_business_profile_mock(self):
        with _env(META_LONG_LIVED_TOKEN="MOCK_token", IG_VIEWER_BUSINESS_ID="123"):
            from app.connectors.meta_instagram import MetaInstagramConnector

            connector = MetaInstagramConnector()
            result = await connector.fetch_business_profile("testuser")

        assert result["platform"] == "instagram"
        assert result["handle"] == "testuser"
        assert result["raw"]["username"] == "testuser"
        assert result["raw"]["followers_count"] == 12345

    @pytest.mark.asyncio
    async def test_fetch_page_info_mock(self):
        with _env(META_LONG_LIVED_TOKEN="MOCK_token"):
            from app.connectors.meta_instagram import MetaInstagramConnector

            connector = MetaInstagramConnector()
            result = await connector.fetch_page_info("page123")

        assert result["platform"] == "facebook_page"
        assert result["raw"]["id"] == "page123"

    @pytest.mark.asyncio
    async def test_fetch_business_profile_live(self):
        """Test with a mocked HTTP response (non-mock-mode)."""
        canned = {
            "business_discovery": {
                "username": "liveuser",
                "followers_count": 999,
            }
        }
        transport = _MockTransport(default_json=canned, headers={"x-app-usage": json.dumps({"call_count": 5.0, "total_cputime": 2.0, "total_time": 3.0})})

        with _env(
            META_LONG_LIVED_TOKEN="real_token",
            IG_VIEWER_BUSINESS_ID="12345",
            META_GRAPH_VERSION="v19.0",
        ):
            from app.connectors.meta_instagram import MetaInstagramConnector

            connector = MetaInstagramConnector()

            # Patch httpx.AsyncClient to use our transport
            with patch("httpx.AsyncClient", return_value=httpx.AsyncClient(transport=transport)):
                result = await connector.fetch_business_profile("liveuser")

        assert result["platform"] == "instagram"
        assert result["raw"]["username"] == "liveuser"

    def test_check_rate_limit(self):
        with _env(META_LONG_LIVED_TOKEN="MOCK_token"):
            from app.connectors.meta_instagram import MetaInstagramConnector

            connector = MetaInstagramConnector()
            rl = connector.check_rate_limit()

        assert rl["ok"] is True

    def test_get_remaining_budget(self):
        with _env(META_LONG_LIVED_TOKEN="MOCK_token"):
            from app.connectors.meta_instagram import MetaInstagramConnector

            connector = MetaInstagramConnector()
            b = connector.get_remaining_budget()

        assert b["budget_usd"] is None


# =========================================================================
# 3. XApiConnector
# =========================================================================


class TestXApiConnector:
    """Tests for XApiConnector."""

    @pytest.mark.asyncio
    async def test_fetch_user_mock(self):
        with _env(X_BEARER_TOKEN="MOCK_token"):
            from app.connectors.x_api import XApiConnector

            connector = XApiConnector()
            result = await connector.fetch_user_by_username("mockhandle")

        assert result["platform"] == "x_twitter"
        assert result["raw"]["username"] == "mockhandle"
        assert result["raw"]["public_metrics"]["followers_count"] == 2500

    @pytest.mark.asyncio
    async def test_search_recent_tweets_mock(self):
        with _env(X_BEARER_TOKEN="MOCK_token"):
            from app.connectors.x_api import XApiConnector

            connector = XApiConnector()
            result = await connector.search_recent_tweets("python", max_results=3)

        assert result["platform"] == "x_twitter"
        assert len(result["tweets"]) == 3

    @pytest.mark.asyncio
    async def test_budget_exhaustion(self):
        with _env(X_BEARER_TOKEN="MOCK_token", X_MONTHLY_CREDIT_BUDGET="0.005"):
            from app.connectors.x_api import XApiConnector

            connector = XApiConnector()
            # First call should succeed (budget is $0.005, cost is $0.01) — should fail
            with pytest.raises(RuntimeError, match="budget exhausted"):
                await connector.fetch_user_by_username("user1")

    @pytest.mark.asyncio
    async def test_fetch_user_live(self):
        """Mocked HTTP (non-mock-mode)."""
        canned = {"data": {"id": "42", "username": "realuser", "verified": True}}
        transport = _MockTransport(
            default_json=canned,
            headers={
                "x-rate-limit-remaining": "14",
                "x-rate-limit-limit": "15",
                "x-rate-limit-reset": "1700000000",
            },
        )

        with _env(X_BEARER_TOKEN="real_token"):
            from app.connectors.x_api import XApiConnector

            connector = XApiConnector()
            with patch("httpx.AsyncClient", return_value=httpx.AsyncClient(transport=transport)):
                result = await connector.fetch_user_by_username("realuser")

        assert result["raw"]["username"] == "realuser"
        rl = connector.check_rate_limit()
        assert rl["remaining"] == 14

    def test_check_rate_limit_initial(self):
        with _env(X_BEARER_TOKEN="MOCK_token"):
            from app.connectors.x_api import XApiConnector

            connector = XApiConnector()
            rl = connector.check_rate_limit()

        assert rl["ok"] is True

    def test_get_remaining_budget_limited(self):
        with _env(X_BEARER_TOKEN="MOCK_token", X_MONTHLY_CREDIT_BUDGET="100.0"):
            from app.connectors.x_api import XApiConnector

            connector = XApiConnector()
            b = connector.get_remaining_budget()

        assert b["budget_usd"] == 100.0
        assert b["remaining_usd"] == 100.0


# =========================================================================
# 4. TelegramConnector
# =========================================================================


class TestTelegramConnector:
    """Tests for TelegramConnector."""

    @pytest.mark.asyncio
    async def test_get_chat_mock(self):
        with _env(TELEGRAM_BOT_TOKEN="MOCK_token"):
            from app.connectors.telegram_client import TelegramConnector

            connector = TelegramConnector()
            result = await connector.get_chat("testchannel")

        assert result["platform"] == "telegram"
        assert result["raw"]["type"] == "channel"

    @pytest.mark.asyncio
    async def test_get_chat_member_count_mock(self):
        with _env(TELEGRAM_BOT_TOKEN="MOCK_token"):
            from app.connectors.telegram_client import TelegramConnector

            connector = TelegramConnector()
            result = await connector.get_chat_member_count("testchannel")

        assert result["member_count"] == 8765

    @pytest.mark.asyncio
    async def test_get_chat_live(self):
        """Mocked HTTP (non-mock-mode)."""
        canned = {
            "ok": True,
            "result": {
                "id": -1009999,
                "title": "Real Channel",
                "type": "channel",
            },
        }
        transport = _MockTransport(default_json=canned)

        with _env(TELEGRAM_BOT_TOKEN="real_token_abc"):
            from app.connectors.telegram_client import TelegramConnector

            connector = TelegramConnector()
            with patch("httpx.AsyncClient", return_value=httpx.AsyncClient(transport=transport)):
                result = await connector.get_chat("@realchannel")

        assert result["raw"]["title"] == "Real Channel"

    def test_check_rate_limit(self):
        with _env(TELEGRAM_BOT_TOKEN="MOCK_token"):
            from app.connectors.telegram_client import TelegramConnector

            connector = TelegramConnector()
            assert connector.check_rate_limit()["ok"] is True

    def test_get_remaining_budget(self):
        with _env(TELEGRAM_BOT_TOKEN="MOCK_token"):
            from app.connectors.telegram_client import TelegramConnector

            connector = TelegramConnector()
            assert connector.get_remaining_budget()["budget_usd"] is None


# =========================================================================
# 5. UrlReputationChecker
# =========================================================================


class TestUrlReputationChecker:
    """Tests for UrlReputationChecker."""

    @pytest.mark.asyncio
    async def test_check_safe_browsing_mock(self):
        with _env(GOOGLE_SAFE_BROWSING_KEY="MOCK_key"):
            from app.connectors.url_reputation import UrlReputationChecker

            checker = UrlReputationChecker()
            result = await checker.check_safe_browsing("https://example.com")

        assert result["safe"] is True
        assert result["threats"] == []

    @pytest.mark.asyncio
    async def test_check_virustotal_mock(self):
        with _env(VIRUSTOTAL_API_KEY="MOCK_key"):
            from app.connectors.url_reputation import UrlReputationChecker

            checker = UrlReputationChecker()
            result = await checker.check_virustotal("https://example.com")

        assert result["malicious"] == 0
        assert result["scan_id"] == "mock_scan_id_12345"

    @pytest.mark.asyncio
    async def test_assess_mock(self):
        with _env(GOOGLE_SAFE_BROWSING_KEY="MOCK_gsb", VIRUSTOTAL_API_KEY="MOCK_vt"):
            from app.connectors.url_reputation import UrlReputationChecker

            checker = UrlReputationChecker()
            result = await checker.assess("https://example.com")

        assert result["threat_level"] == "low"
        assert result["is_malicious"] is False
        assert result["platform"] == "url_reputation"

    @pytest.mark.asyncio
    async def test_skips_when_no_key(self):
        """When keys are absent, results should be skipped gracefully."""
        from app.connectors.url_reputation import UrlReputationChecker

        checker = UrlReputationChecker()
        sb = await checker.check_safe_browsing("https://example.com")
        assert sb.get("skipped") is True

        vt = await checker.check_virustotal("https://example.com")
        assert vt.get("skipped") is True


# =========================================================================
# 6. RateLimiter & BudgetTracker
# =========================================================================


class TestRateLimiter:
    """Tests for the generic rate limiter."""

    def test_allow_within_limit(self):
        from app.connectors.rate_limiter import RateLimiter

        rl = RateLimiter()
        rl.register_platform("test", max_requests=5, window_seconds=60)

        for _ in range(5):
            assert rl.allow("test") is True

        # 6th should be denied
        assert rl.allow("test") is False

    def test_allow_unregistered_platform(self):
        from app.connectors.rate_limiter import RateLimiter

        rl = RateLimiter()
        assert rl.allow("unknown") is True

    def test_remaining(self):
        from app.connectors.rate_limiter import RateLimiter

        rl = RateLimiter()
        rl.register_platform("test", max_requests=10, window_seconds=60)
        rl.allow("test")
        rl.allow("test")
        assert rl.remaining("test") == 8

    def test_status(self):
        from app.connectors.rate_limiter import RateLimiter

        rl = RateLimiter()
        rl.register_platform("test", max_requests=3, window_seconds=60)
        s = rl.status("test")
        assert s["configured"] is True
        assert s["remaining"] == 3
        assert s["ok"] is True


class TestBudgetTracker:
    """Tests for the budget tracker."""

    def test_record_within_budget(self):
        from app.connectors.rate_limiter import BudgetTracker

        bt = BudgetTracker(budget_usd=1.0)
        assert bt.record(0.50) is True
        assert bt.remaining_usd == 0.50

    def test_record_exceeds_budget(self):
        from app.connectors.rate_limiter import BudgetTracker

        bt = BudgetTracker(budget_usd=0.10)
        assert bt.record(0.05) is True
        assert bt.record(0.10) is False  # would exceed

    def test_unlimited_budget(self):
        from app.connectors.rate_limiter import BudgetTracker

        bt = BudgetTracker(budget_usd=None)
        assert bt.record(9999.0) is True
        assert bt.remaining_usd is None

    def test_reset(self):
        from app.connectors.rate_limiter import BudgetTracker

        bt = BudgetTracker(budget_usd=10.0)
        bt.record(5.0)
        bt.reset()
        assert bt.spent_usd == 0.0
        assert bt.remaining_usd == 10.0

    def test_status(self):
        from app.connectors.rate_limiter import BudgetTracker

        bt = BudgetTracker(budget_usd=50.0)
        bt.record(12.5)
        s = bt.status()
        assert s["spent_usd"] == 12.5
        assert s["remaining_usd"] == 37.5
