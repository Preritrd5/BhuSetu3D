"""
BhuSetu 3D In-Memory Sliding Window Rate Limiter
Team: TANTRAKATHA | SIH 2026 (SIH26011)
Phase 14: Production Deployment + Security + Performance Hardening

Protects sensitive endpoints against brute-force, uncontrolled AI spend,
and Denial-of-Service with HTTP 429 and Retry-After response headers.
"""
import time
from typing import Dict, List, Optional
from fastapi import Request, HTTPException, status
from app.core.config import settings
from app.core.logging import logger


class SlidingWindowRateLimiter:
    """
    Thread-safe in-memory sliding window rate limiter.
    Tracks client IP request timestamps and prunes expired intervals automatically.
    """

    def __init__(self):
        # Maps key -> list of float timestamps
        self._records: Dict[str, List[float]] = {}
        self._last_cleanup: float = time.time()

    def _cleanup_old_records(self, now: float, max_window: float = 300.0) -> None:
        """Periodically purges inactive IP buckets to prevent unbounded memory growth."""
        if now - self._last_cleanup < 60.0:
            return
        self._last_cleanup = now
        stale_keys = []
        for key, timestamps in self._records.items():
            valid_ts = [t for t in timestamps if now - t < max_window]
            if valid_ts:
                self._records[key] = valid_ts
            else:
                stale_keys.append(key)
        for sk in stale_keys:
            del self._records[sk]

    def check_rate_limit(
        self,
        identifier: str,
        max_requests: int,
        window_seconds: int = 60
    ) -> Optional[int]:
        """
        Evaluates whether an identifier has exceeded max_requests in the window.
        Returns None if permitted, or the remaining Retry-After seconds if blocked.
        """
        if not settings.RATE_LIMIT_ENABLED:
            return None

        now = time.time()
        self._cleanup_old_records(now, max_window=float(window_seconds * 2))

        timestamps = self._records.setdefault(identifier, [])
        # Filter timestamps within current sliding window
        window_start = now - window_seconds
        active_timestamps = [t for t in timestamps if t > window_start]
        self._records[identifier] = active_timestamps

        if len(active_timestamps) >= max_requests:
            # Exceeded limit. Calculate time until oldest request rolls off window
            oldest = active_timestamps[0]
            retry_after = max(1, int(oldest + window_seconds - now))
            return retry_after

        # Record this request
        active_timestamps.append(now)
        return None

    def reset(self) -> None:
        """Clears all tracking state (used in testing)."""
        self._records.clear()


limiter = SlidingWindowRateLimiter()


def rate_limit(max_requests: int, window_seconds: int = 60, tier_name: str = "default"):
    """
    FastAPI dependency / decorator to enforce sliding window rate limiting per client IP.
    """
    async def dependency(request: Request):
        client_ip = request.client.host if request.client else "unknown_client"
        # Forwarded IP header support for reverse-proxy deployment
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            client_ip = forwarded.split(",")[0].strip()

        key = f"{tier_name}:{client_ip}"
        retry_after = limiter.check_rate_limit(key, max_requests, window_seconds)

        if retry_after is not None:
            logger.warning(
                f"[RATE_LIMIT] Client {client_ip} exceeded {max_requests} reqs/{window_seconds}s on tier '{tier_name}'."
            )
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit exceeded. Too many requests. Please wait {retry_after} seconds.",
                headers={"Retry-After": str(retry_after)},
            )

    return dependency
