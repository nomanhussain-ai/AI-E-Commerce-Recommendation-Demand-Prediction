from sqlalchemy import String
from sqlalchemy.dialects.postgresql import CITEXT
from sqlalchemy.types import TypeDecorator


class CIText(TypeDecorator):
    """Case-insensitive text: ``CITEXT`` on PostgreSQL, plain ``String`` elsewhere (tests)."""

    impl = String
    cache_ok = True

    def load_dialect_impl(self, dialect):  # type: ignore[no-untyped-def]
        if dialect.name == "postgresql":
            return dialect.type_descriptor(CITEXT())
        return dialect.type_descriptor(String())
