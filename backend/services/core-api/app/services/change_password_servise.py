"""Password-reset service — forgot-password token issue + reset consumption."""

from datetime import timedelta

from app.core.security import generate_otp, hash_password
from app.exceptions import UnauthenticatedError
from app.models.base import utcnow
from app.repositories.user_repo import UserRepository

RESET_TOKEN_TTL = timedelta(hours=1)


class ResetPasswordService:
    def __init__(self, repo: UserRepository) -> None:
        self.repo = repo

    async def forgot_password(self, *, email: str) -> str | None:
        """Return the raw reset token, or None if the email is unknown.

        The caller must not leak which case occurred.
        """
        user = await self.repo.get_by_email(email)
        if user is None:
            return None
        raw = generate_otp()
        await self.repo.store_reset(
            user_id=user.id, raw_token=raw, expires_at=utcnow() + RESET_TOKEN_TTL
        )
        return raw

    async def reset_password(self, *, token: str, password: str) -> None:
        stored = await self.repo.get_reset(token)
        if stored is None or not stored.is_valid:
            raise UnauthenticatedError("Invalid or expired reset token.")
        user = await self.repo.get_by_id(stored.user_id)
        if user is None:
            raise UnauthenticatedError("Account not found.")
        await self.repo.set_password(user, hash_password(password))
        await self.repo.mark_reset_used(stored)
        await self.repo.revoke_all_refresh(user.id)  # force re-login everywhere
