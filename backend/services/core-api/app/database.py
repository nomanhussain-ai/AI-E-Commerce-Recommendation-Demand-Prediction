from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.pool import StaticPool

from app.config import settings

_is_sqlite = settings.is_sqlite

if _is_sqlite:
    # Local / test fallback so the API (and Swagger) run without PostgreSQL.
    engine: AsyncEngine = create_async_engine(
        settings.database_url,
        echo=settings.db_echo,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
else:
    engine = create_async_engine(
        settings.database_url,
        echo=settings.db_echo,
        pool_size=settings.db_pool_size,
        max_overflow=settings.db_max_overflow,
        pool_pre_ping=True,
    )

SessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


async def get_session() -> AsyncGenerator[AsyncSession]:
    """FastAPI dependency — one transaction-scoped session per request."""
    async with SessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


async def init_models() -> None:
    """Create tables directly from the models — only used on the SQLite fallback.

    With PostgreSQL, schema is owned by Alembic migrations and this is a no-op.
    """
    if not _is_sqlite:
        return

    from sqlmodel import SQLModel

    import app.models  # noqa: F401 — register every table on the metadata

    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
