from datetime import UTC, datetime

from sqlalchemy import DateTime
from sqlmodel import Field, SQLModel

from app.core.ids import new_id
from app.models.base import as_utc, utcnow


class EmailOtp(SQLModel, table=True):
    __tablename__ = "email_otps"

    id: str = Field(default_factory=lambda: new_id("otp_"), primary_key=True)
    user_id: str = Field(foreign_key="users.id", index=True, nullable=False)
    code_hash: str = Field(nullable=False)  # sha256 of the 6-digit code
    attempts: int = Field(default=0, nullable=False)
    expires_at: datetime = Field(sa_type=DateTime(timezone=True), nullable=False)
    used_at: datetime | None = Field(default=None, sa_type=DateTime(timezone=True))
    created_at: datetime = Field(
        default_factory=utcnow, sa_type=DateTime(timezone=True), nullable=False
    )

    @property
    def is_valid(self) -> bool:
        return self.used_at is None and as_utc(self.expires_at) > datetime.now(UTC)
