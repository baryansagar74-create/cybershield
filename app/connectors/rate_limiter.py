"""
ProfileGuard — Generic Rate Limiter
====================================

Provides a **sliding-window** rate limiter with optional Redis backing.
Falls back to an in-memory implementation when Redis is not available.

Also includes a simple **BudgetTracker** for connectors that need to
enforce a monthly spend cap (e.g. X API credits).
"""

from __future__ import annotations

import logging
import time
from dataclasses import dataclass, field
from typing import Dict, Optional

logger = logging.getLogger(__name__)


# ------------------------------------------------------------------ #
#  Rate-limiter data structures                                       #
# ------------------------------------------------------------------ #

@dataclass
class PlatformLimit:
    """Configuration for a single platform's rate limit."""

    platform: str
    max_requests: int
    window_seconds: int


@dataclass
class _SlidingWindow:
    """Internal sliding-window state for a single platform."""

    timestamps: list[float] = field(default_factory=list)


class RateLimiter:
    """Sliding-window rate limiter (in-memory, with optional Redis).

    Parameters
    ----------
    limits : dict[str, PlatformLimit]
        Platform name → limit config.
    redis_url : str | None
        If provided, rate-limit state is persisted in Redis so it
        survives restarts and works across workers.
    """

    def __init__(
        self,
        limits: Optional[Dict[str, PlatformLimit]] = None,
        redis_url: Optional[str] = None,
    ) -> None:
        self._limits: Dict[str, PlatformLimit] = limits or {}
        self._windows: Dict[str, _SlidingWindow] = {}
        self._redis: Optional[object] = None

        if redis_url:
            try:
                import redis as _redis  # type: ignore[import-untyped]

                self._redis = _redis.Redis.from_url(redis_url)
                self._redis.ping()  # type: ignore[union-attr]
                logger.info("RateLimiter: connected to Redis (%s****)", redis_url[:20])
            except Exception:
                logger.warning(
                    "RateLimiter: Redis unavailable — falling back to in-memory"
                )
                self._redis = None

    # ------------------------------------------------------------------ #
    #  Public API                                                         #
    # ------------------------------------------------------------------ #

    def register_platform(self, platform: str, max_requests: int, window_seconds: int) -> None:
        """Register or update the rate-limit config for *platform*."""
        self._limits[platform] = PlatformLimit(
            platform=platform,
            max_requests=max_requests,
            window_seconds=window_seconds,
        )
        logger.info(
            "RateLimiter: registered %s — %d req / %ds",
            platform,
            max_requests,
            window_seconds,
        )

    def allow(self, platform: str) -> bool:
        """Return ``True`` if a request to *platform* is allowed **now**.

        Also records the current timestamp as a new request if allowed.
        """
        limit = self._limits.get(platform)
        if limit is None:
            # No limit configured → always allow
            return True

        now = time.monotonic()

        if self._redis is not None:
            return self._allow_redis(platform, limit, now)

        return self._allow_memory(platform, limit, now)

    def remaining(self, platform: str) -> Optional[int]:
        """Return how many requests remain in the current window, or None."""
        limit = self._limits.get(platform)
        if limit is None:
            return None

        now = time.monotonic()
        window = self._get_memory_window(platform)
        self._prune(window, limit.window_seconds, now)
        return max(0, limit.max_requests - len(window.timestamps))

    def status(self, platform: str) -> Dict[str, object]:
        """Return a status dict for *platform*."""
        limit = self._limits.get(platform)
        rem = self.remaining(platform)
        return {
            "platform": platform,
            "configured": limit is not None,
            "max_requests": limit.max_requests if limit else None,
            "window_seconds": limit.window_seconds if limit else None,
            "remaining": rem,
            "ok": rem is None or rem > 0,
        }

    # ------------------------------------------------------------------ #
    #  In-memory implementation                                           #
    # ------------------------------------------------------------------ #

    def _get_memory_window(self, platform: str) -> _SlidingWindow:
        if platform not in self._windows:
            self._windows[platform] = _SlidingWindow()
        return self._windows[platform]

    @staticmethod
    def _prune(window: _SlidingWindow, window_seconds: int, now: float) -> None:
        cutoff = now - window_seconds
        window.timestamps = [t for t in window.timestamps if t > cutoff]

    def _allow_memory(self, platform: str, limit: PlatformLimit, now: float) -> bool:
        window = self._get_memory_window(platform)
        self._prune(window, limit.window_seconds, now)
        if len(window.timestamps) >= limit.max_requests:
            logger.warning("RateLimiter: %s hit rate limit (%d/%d)", platform, len(window.timestamps), limit.max_requests)
            return False
        window.timestamps.append(now)
        return True

    # ------------------------------------------------------------------ #
    #  Redis-backed implementation                                        #
    # ------------------------------------------------------------------ #

    def _allow_redis(self, platform: str, limit: PlatformLimit, now: float) -> bool:
        """Sliding-window via a Redis sorted set."""
        try:
            import redis as _redis  # type: ignore[import-untyped]

            r: _redis.Redis = self._redis  # type: ignore[assignment]
            key = f"profileguard:ratelimit:{platform}"
            cutoff = now - limit.window_seconds

            pipe = r.pipeline()
            pipe.zremrangebyscore(key, "-inf", cutoff)
            pipe.zcard(key)
            pipe.zadd(key, {str(now): now})
            pipe.expire(key, limit.window_seconds + 1)
            results = pipe.execute()

            current_count: int = results[1]
            if current_count >= limit.max_requests:
                logger.warning("RateLimiter [Redis]: %s hit rate limit", platform)
                # Remove the just-added entry
                r.zrem(key, str(now))
                return False
            return True
        except Exception:
            logger.exception("RateLimiter: Redis error — falling back to in-memory")
            self._redis = None
            return self._allow_memory(platform, limit, now)


# ------------------------------------------------------------------ #
#  Budget Tracker                                                      #
# ------------------------------------------------------------------ #

class BudgetTracker:
    """Track cumulative API spend against a monthly budget cap.

    Parameters
    ----------
    budget_usd : float | None
        Monthly cap in USD.  ``None`` means unlimited.
    alert_threshold : float
        Fraction (0–1) at which a warning is logged (default 0.80 = 80 %).
    """

    def __init__(
        self,
        budget_usd: Optional[float] = None,
        alert_threshold: float = 0.80,
    ) -> None:
        self.budget_usd = budget_usd
        self.alert_threshold = alert_threshold
        self._spent_usd: float = 0.0
        self._alerted: bool = False

    @property
    def spent_usd(self) -> float:
        """Total amount spent so far (current billing cycle)."""
        return self._spent_usd

    @property
    def remaining_usd(self) -> Optional[float]:
        """Remaining budget in USD, or ``None`` if unlimited."""
        if self.budget_usd is None:
            return None
        return max(0.0, self.budget_usd - self._spent_usd)

    def record(self, cost_usd: float) -> bool:
        """Record a spend of *cost_usd*.

        Returns ``True`` if the request is within budget, ``False`` if the
        budget has been exhausted (caller should **not** proceed).
        """
        if self.budget_usd is not None and self._spent_usd + cost_usd > self.budget_usd:
            logger.error(
                "BudgetTracker: budget exhausted ($%.4f / $%.2f)",
                self._spent_usd,
                self.budget_usd,
            )
            return False

        self._spent_usd += cost_usd

        # Alert when approaching threshold
        if (
            self.budget_usd is not None
            and not self._alerted
            and self._spent_usd >= self.budget_usd * self.alert_threshold
        ):
            logger.warning(
                "BudgetTracker: approaching budget limit ($%.4f / $%.2f — %.0f %%)",
                self._spent_usd,
                self.budget_usd,
                (self._spent_usd / self.budget_usd) * 100,
            )
            self._alerted = True

        return True

    def status(self) -> Dict[str, object]:
        """Return a status dict."""
        return {
            "spent_usd": self._spent_usd,
            "budget_usd": self.budget_usd,
            "remaining_usd": self.remaining_usd,
        }

    def reset(self) -> None:
        """Reset spend for a new billing cycle."""
        self._spent_usd = 0.0
        self._alerted = False
        logger.info("BudgetTracker: spend counter reset")
