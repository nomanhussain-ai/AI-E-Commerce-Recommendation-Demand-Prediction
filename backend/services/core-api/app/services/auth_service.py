"""Auth service — email/password login and logout (refresh-token revocation)."""

import jwt

from app.core.security import decode_token, hash_password, needs_rehash, verify_password
from app.exceptions import ForbiddenError, UnauthenticatedError
from app.models.user import User
from app.repositories.user_repo import UserRepository
from app.services.token_servise import TokenService


class AuthService:
    def __init__(self, repo: UserRepository, token_service: TokenService) -> None:
        self.repo = repo
        self.token_service = token_service

    async def login(
        self, *, email: str, password: str, user_agent: str | None = None
    ) -> tuple[User, str, str]:
        user = await self.repo.get_by_email(email)
        if user is None or not verify_password(password, user.password_hash):
            raise UnauthenticatedError("Invalid email or password.")
        if not user.is_active:
            raise ForbiddenError("This account is disabled.")
        if needs_rehash(user.password_hash):
            await self.repo.set_password(user, hash_password(password))
        access, refresh = await self.token_service.issue_pair(user, user_agent)
        return user, access, refresh

    async def logout(self, *, refresh_token: str | None) -> None:
        if not refresh_token:
            return
        try:
            payload = decode_token(refresh_token, expected_type="refresh")
        except jwt.PyJWTError:
            return
        stored = await self.repo.get_refresh(payload.get("jti", ""))
        if stored is not None and stored.is_valid:
            await self.repo.revoke_refresh(stored)

