"""Registration email verification — 6-digit OTP issue + consumption."""

from datetime import timedelta

from app.config import settings
from app.core.security import generate_otp, hash_token
from app.exceptions import APIError
from app.models.base import utcnow
from app.models.user import User
from app.repositories.user_repo import UserRepository


class EmailVerificationService:
    def __init__(self, repo: UserRepository) -> None:
        self.repo = repo

    async def send_otp(self, user: User) -> str:
        """Issue a fresh code and return it raw (caller decides whether to leak it in dev)."""
        code = generate_otp()
        ttl = timedelta(minutes=settings.otp_ttl_minutes)
        await self.repo.store_otp(user_id=user.id, code=code, expires_at=utcnow() + ttl)
        return code

    async def verify(self, user: User, code: str) -> User:
        if user.is_email_verified:
            return user

        otp = await self.repo.get_latest_otp(user.id)
        if otp is None or not otp.is_valid:
            raise APIError(
                "No active verification code. Request a new one.",
                code="OTP_EXPIRED",
                status_code=410,
            )
        if otp.attempts >= settings.otp_max_attempts:
            raise APIError(
                "Too many incorrect attempts. Request a new code.",
                code="OTP_LOCKED",
                status_code=429,
            )

        if hash_token(code) != otp.code_hash:
            await self.repo.increment_otp_attempts(otp)
            raise APIError("Incorrect verification code.", code="INVALID_OTP", status_code=400)

        await self.repo.mark_otp_used(otp)
        return await self.repo.mark_email_verified(user)
