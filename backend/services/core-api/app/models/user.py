from datetime import UTC, datetime
from enum import StrEnum

from sqlalchemy import DateTime
from sqlalchemy import Enum as SAEnum
from sqlmodel import Field, SQLModel

from app.core.ids import new_id
from app.models.base import TimestampMixin, as_utc, utcnow
from app.models.types import CIText


class UserRole(StrEnum):
    customer = "customer"
    admin = "admin"


class User(TimestampMixin, table=True):
    __tablename__ = "users"

    id: str = Field(default_factory=lambda: new_id("usr_"), primary_key=True)
    email: str = Field(sa_type=CIText, index=True, unique=True, nullable=False)
    password_hash: str = Field(nullable=False)
    full_name: str = Field(nullable=False)
    phone: str | None = Field(default=None, nullable=True)
    address: str | None = Field(default=None, nullable=True)
    avatar_url: str | None = Field(default=None, nullable=True)
    cover_image_url: str | None = Field(default=None, nullable=True)
    # `name="user_role"` must match the enum type created in migration 0001
    # (SQLModel would otherwise derive "userrole" from the class name).
    role: UserRole = Field(
        default=UserRole.customer,
        sa_type=SAEnum(UserRole, name="user_role"),
        nullable=False,
    )
    is_active: bool = Field(default=True, nullable=False)
    is_email_verified: bool = Field(default=False, nullable=False)


class RefreshToken(SQLModel, table=True):
    __tablename__ = "refresh_tokens"

    id: str = Field(default_factory=lambda: new_id("rt_"), primary_key=True)
    user_id: str = Field(foreign_key="users.id", index=True, nullable=False)
    token_hash: str = Field(nullable=False)  # sha256 of the refresh JWT id
    expires_at: datetime = Field(sa_type=DateTime(timezone=True), nullable=False)
    revoked_at: datetime | None = Field(default=None, sa_type=DateTime(timezone=True))
    user_agent: str | None = Field(default=None)
    created_at: datetime = Field(
        default_factory=utcnow, sa_type=DateTime(timezone=True), nullable=False
    )

    @property
    def is_valid(self) -> bool:
        return self.revoked_at is None and as_utc(self.expires_at) > datetime.now(UTC)



