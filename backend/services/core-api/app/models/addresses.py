from sqlmodel import Field

from app.core.ids import new_id
from app.models.base import TimestampMixin


class Address(TimestampMixin, table=True):
    __tablename__ = "addresses"

    id: str = Field(default_factory=lambda: new_id("adr_"), primary_key=True)
    user_id: str = Field(foreign_key="users.id", index=True, nullable=False)
    line1: str = Field(nullable=False)
    line2: str | None = Field(default=None)
    city: str = Field(nullable=False)
    region: str | None = Field(default=None)
    postal_code: str | None = Field(default=None)
    country: str = Field(default="PK", nullable=False)
    is_default: bool = Field(default=False, nullable=False)
