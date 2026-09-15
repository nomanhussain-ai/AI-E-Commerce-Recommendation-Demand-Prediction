from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_token
from app.models.base import utcnow
from app.models.email_otp import EmailOtp
from app.models.password_reset_tokens import PasswordResetToken
from app.models.user import RefreshToken, User


class UserRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    # ── users ──
    async def get_by_id(self, user_id: str) -> User | None:
        return await self.session.get(User, user_id)

    async def get_by_email(self, email: str) -> User | None:
        result = await self.session.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    async def list_users(
        self, *, offset: int, limit: int, q: str | None = None
    ) -> tuple[list[User], int]:
        query = select(User)
        count_query = select(func.count()).select_from(User)
        if q:
            pattern = f"%{q}%"
            condition = (User.email.ilike(pattern)) | (User.full_name.ilike(pattern))
            query = query.where(condition)
            count_query = count_query.where(condition)
        rows = await self.session.execute(
            query.order_by(User.created_at.desc()).offset(offset).limit(limit)
        )
        total = await self.session.scalar(count_query)
        return list(rows.scalars().all()), int(total or 0)

    async def create(self, *, email: str, password_hash: str, full_name: str) -> User:
        user = User(email=email, password_hash=password_hash, full_name=full_name)
        self.session.add(user)
        await self.session.flush()
        return user

    async def set_password(self, user: User, password_hash: str) -> None:
        user.password_hash = password_hash
        self.session.add(user)
        await self.session.flush()

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
        user.full_name = full_name
        user.phone = phone
        user.address = address
        user.avatar_url = avatar_url
        user.cover_image_url = cover_image_url
        self.session.add(user)
        await self.session.flush()
        return user

    async def update(self, user: User, **fields: object) -> User:
        for field, value in fields.items():
            setattr(user, field, value)
        self.session.add(user)
        await self.session.flush()
        return user

    # ── refresh tokens ──
    async def store_refresh(
        self, *, user_id: str, jti: str, expires_at: datetime, user_agent: str | None
    ) -> RefreshToken:
        token = RefreshToken(
            user_id=user_id,
            token_hash=hash_token(jti),
            expires_at=expires_at,
            user_agent=user_agent,
        )
        self.session.add(token)
        await self.session.flush()
        return token

    async def get_refresh(self, jti: str) -> RefreshToken | None:
        result = await self.session.execute(
            select(RefreshToken).where(RefreshToken.token_hash == hash_token(jti))
        )
        return result.scalar_one_or_none()

    async def revoke_refresh(self, token: RefreshToken) -> None:
        token.revoked_at = utcnow()
        self.session.add(token)
        await self.session.flush()

    async def revoke_all_refresh(self, user_id: str) -> None:
        result = await self.session.execute(
            select(RefreshToken).where(
                RefreshToken.user_id == user_id, RefreshToken.revoked_at.is_(None)
            )
        )
        for token in result.scalars():
            token.revoked_at = utcnow()
            self.session.add(token)
        await self.session.flush()

    # ── password reset tokens ──
    async def store_reset(
        self, *, user_id: str, raw_token: str, expires_at: datetime
    ) -> PasswordResetToken:
        token = PasswordResetToken(
            user_id=user_id, token_hash=hash_token(raw_token), expires_at=expires_at
        )
        self.session.add(token)
        await self.session.flush()
        return token

    async def get_reset(self, raw_token: str) -> PasswordResetToken | None:
        result = await self.session.execute(
            select(PasswordResetToken).where(
                PasswordResetToken.token_hash == hash_token(raw_token)
            )
        )
        return result.scalar_one_or_none()

    async def mark_reset_used(self, token: PasswordResetToken) -> None:
        token.used_at = utcnow()
        self.session.add(token)
        await self.session.flush()

    # ── email verification OTP ──
    async def store_otp(self, *, user_id: str, code: str, expires_at: datetime) -> EmailOtp:
        otp = EmailOtp(user_id=user_id, code_hash=hash_token(code), expires_at=expires_at)
        self.session.add(otp)
        await self.session.flush()
        return otp

    async def get_latest_otp(self, user_id: str) -> EmailOtp | None:
        result = await self.session.execute(
            select(EmailOtp)
            .where(EmailOtp.user_id == user_id, EmailOtp.used_at.is_(None))
            .order_by(EmailOtp.created_at.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def increment_otp_attempts(self, otp: EmailOtp) -> None:
        otp.attempts += 1
        self.session.add(otp)
        await self.session.flush()

    async def mark_otp_used(self, otp: EmailOtp) -> None:
        otp.used_at = utcnow()
        self.session.add(otp)
        await self.session.flush()

    async def mark_email_verified(self, user: User) -> User:
        user.is_email_verified = True
        self.session.add(user)
        await self.session.flush()
        return user
