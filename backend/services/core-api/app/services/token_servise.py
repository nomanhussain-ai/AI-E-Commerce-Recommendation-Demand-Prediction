"""Token service — issues, rotates and decodes the access / refresh JWT pair."""

from typing import Any

import jwt

from app.core.security import create_token, decode_token
from app.exceptions import UnauthenticatedError
from app.models.user import User
from app.repositories.user_repo import UserRepository


class TokenService:
    def __init__(self, repo: UserRepository) -> None:
        self.repo = repo

    async def refresh(
        self, *, refresh_token: str, user_agent: str | None = None
    ) -> tuple[str, str]:
        payload = self._decode(refresh_token, "refresh")
        stored = await self.repo.get_refresh(payload["jti"])
        if stored is None or not stored.is_valid:
            raise UnauthenticatedError("Refresh token is no longer valid.")

        await self.repo.revoke_refresh(stored)  # rotate: one-time use
        user = await self.repo.get_by_id(str(payload["sub"]))
        if user is None or not user.is_active:
            raise UnauthenticatedError("Account no longer active.")
        return await self.issue_pair(user, user_agent)

    async def issue_pair(self, user: User, user_agent: str | None) -> tuple[str, str]:
        """Mint a fresh access + refresh token and persist the refresh side."""
        access, _, _ = create_token(user.id, "access", extra={"role": str(user.role)})
        refresh, jti, expires_at = create_token(user.id, "refresh")
        await self.repo.store_refresh(
            user_id=user.id, jti=jti, expires_at=expires_at, user_agent=user_agent
        )
        return access, refresh

    @staticmethod
    def _decode(token: str, expected: str) -> dict[str, Any]:
        try:
            return decode_token(token, expected_type=expected)  # type: ignore[arg-type]
        except jwt.PyJWTError as exc:
            raise UnauthenticatedError(f"Invalid or expired {expected} token.") from exc
