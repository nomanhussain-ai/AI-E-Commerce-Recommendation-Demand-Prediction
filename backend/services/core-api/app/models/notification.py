from datetime import datetime

from sqlalchemy import JSON, DateTime
from sqlalchemy import Column as SAColumn
from sqlmodel import Field

from app.core.ids import new_id
from app.models.base import TimestampMixin


class Notification(TimestampMixin, table=True):
    __tablename__ = "notifications"

    id: str = Field(default_factory=lambda: new_id("ntf_"), primary_key=True)
    user_id: str | None = Field(default=None, foreign_key="users.id", index=True)
    kind: str = Field(nullable=False)
    # Generic JSON (not JSONB) so this also works against the SQLite test fallback.
    payload: dict = Field(default_factory=dict, sa_column=SAColumn(JSON, nullable=False))
    read_at: datetime | None = Field(default=None, sa_type=DateTime(timezone=True))
