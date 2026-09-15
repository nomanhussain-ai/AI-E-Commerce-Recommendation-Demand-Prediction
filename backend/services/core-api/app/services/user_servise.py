"""User service — account registration and lookup."""

from app.core.security import hash_password
from app.exceptions import ConflictError, UnauthenticatedError
from app.models.user import User
from app.repositories.user_repo import UserRepository
from app.schemas.profile import UserCreateIn, UserUpdateIn
from app.services.token_servise import TokenService


class UserService:
    def __init__(self, repo: UserRepository, token_service: TokenService) -> None:
        self.repo = repo
        self.token_service = token_service

    async def register(
        self, *, email: str, password: str, full_name: str, user_agent: str | None = None
    ) -> tuple[User, str, str]:
        if await self.repo.get_by_email(email) is not None:
            raise ConflictError("An account with this email already exists.")
        user = await self.repo.create(
            email=email, password_hash=hash_password(password), full_name=full_name
        )
        access, refresh = await self.token_service.issue_pair(user, user_agent)
        return user, access, refresh

    async def current_user(self, user_id: str) -> User:
        user = await self.repo.get_by_id(user_id)
        if user is None:
            raise UnauthenticatedError("Account not found.")
        return user

    async def update_profile(
        self,
        user: User,
        *,
        full_name: str,
        phone: str | None,
        address: str | None,
        avatar_url: str | None,
        cover_image_url: str | None,
    ) -> User:
        return await self.repo.update_profile(
            user,
            full_name=full_name,
            phone=phone,
            address=address,
            avatar_url=avatar_url,
            cover_image_url=cover_image_url,
        )

    async def create_user(self, body: UserCreateIn) -> User:
        if await self.repo.get_by_email(body.email) is not None:
            raise ConflictError("An account with this email already exists.")
        user = await self.repo.create(
            email=body.email,
            password_hash=hash_password(body.password),
            full_name=body.full_name,
        )
        return await self.repo.update(
            user,
            phone=body.phone,
            address=body.address,
            avatar_url=body.avatar_url,
            cover_image_url=body.cover_image_url,
            role=body.role,
        )

    async def update_user(self, user: User, body: UserUpdateIn) -> User:
        fields = body.model_dump(exclude_unset=True, exclude={"password"})
        if body.email is not None and body.email != user.email:
            existing = await self.repo.get_by_email(body.email)
            if existing is not None and existing.id != user.id:
                raise ConflictError("An account with this email already exists.")
            fields["email"] = body.email
        if body.password is not None:
            fields["password_hash"] = hash_password(body.password)
        return await self.repo.update(user, **fields)

    async def deactivate(self, user: User) -> User:
        return await self.repo.update(user, is_active=False)
