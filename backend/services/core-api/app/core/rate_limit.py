from fastapi import Request

from app.config import settings
from app.core.logging import log
from app.core.redis import get_redis
from app.exceptions import RateLimitedError


def _client_ip(request: Request) -> str:
    fwd = request.headers.get("x-forwarded-for")
    if fwd:
        return fwd.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


class RateLimiter:
    """Fixed-window limiter keyed by IP (+ optional bucket). Fails open if Redis is down."""

    def __init__(self, *, limit: int, window_seconds: int = 60, bucket: str = "default") -> None:
        self.limit = limit
        self.window = window_seconds
        self.bucket = bucket

    async def __call__(self, request: Request) -> None:
        if not settings.rate_limit_enabled:
            return
        ip = _client_ip(request)
        key = f"rl:{self.bucket}:{ip}"
        try:
            redis = get_redis()
            current = await redis.incr(key)
            if current == 1:
                await redis.expire(key, self.window)
            if current > self.limit:
                raise RateLimitedError(
                    "Too many requests. Please slow down.",
                    details={"limit": self.limit, "window_seconds": self.window},
                )
        except RateLimitedError:
            raise
        except Exception as exc:  # noqa: BLE001 — degrade open, don't 500 on a Redis blip
            log.warning("rate_limit_unavailable", error=str(exc), bucket=self.bucket)


def auth_rate_limiter() -> RateLimiter:
    return RateLimiter(limit=settings.rate_limit_auth_per_min, window_seconds=60, bucket="auth")
