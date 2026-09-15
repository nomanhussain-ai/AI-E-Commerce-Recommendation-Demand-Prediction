import os

# Force the SQLite fallback for the whole test session — no PostgreSQL required.
# Must run before anything imports app.config / app.database.
os.environ.setdefault("APP_ENV", "test")  # no .env.test file → only .env is read
os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///:memory:")
os.environ.setdefault("DEBUG", "true")
# Cheap argon2 params so the suite isn't dominated by password hashing.
os.environ.setdefault("ARGON2_TIME_COST", "1")
os.environ.setdefault("ARGON2_MEMORY_COST_KIB", "8192")
os.environ.setdefault("ARGON2_PARALLELISM", "1")
os.environ.setdefault("RATE_LIMIT_ENABLED", "false")

import httpx
import pytest
from asgi_lifespan import LifespanManager
from httpx import ASGITransport

from app.main import app


@pytest.fixture
async def client():
    async with LifespanManager(app):
        transport = ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as c:
            yield c
