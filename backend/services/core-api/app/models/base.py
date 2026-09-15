from datetime import UTC, datetime

from sqlalchemy import DateTime
from sqlmodel import Field, SQLModel


def utcnow() -> datetime:
    return datetime.now(UTC)


def as_utc(value: datetime) -> datetime:
    """Coerce a possibly-naive datetime to tz-aware UTC.

    PostgreSQL round-trips ``DateTime(timezone=True)`` as aware; SQLite (the local
    fallback) drops the tzinfo, so comparisons need to re-attach it.
    """
    return value if value.tzinfo is not None else value.replace(tzinfo=UTC)


class TimestampMixin(SQLModel):
    created_at: datetime = Field(
        default_factory=utcnow,
        sa_type=DateTime(timezone=True),
        nullable=False,
    )
    updated_at: datetime = Field(
        default_factory=utcnow,
        sa_type=DateTime(timezone=True),
        nullable=False,
        sa_column_kwargs={"onupdate": utcnow},
    )
