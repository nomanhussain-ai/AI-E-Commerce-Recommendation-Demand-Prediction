import os
from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

# ─────────────────────────────────────────────────────────────────────────────
#  WHICH ENVIRONMENT THIS PROCESS RUNS AS.  Change this ONE line to switch.
#
#    "local" → PostgreSQL on your own machine   → reads .env + .env.local
#    "dev"   → the shared development server     → reads .env + .env.dev
#
#  (or set the APP_ENV environment variable to override without editing code)
# ─────────────────────────────────────────────────────────────────────────────
APP_ENV = os.getenv("APP_ENV", "local")
# ─────────────────────────────────────────────────────────────────────────────

_DB_PARTS = ("db_driver", "db_host", "db_port", "db_user", "db_password", "db_name")


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        # `.env`          → values shared by every environment
        # `.env.<APP_ENV>`→ this environment's own values (wins on a conflict)
        env_file=(".env", f".env.{APP_ENV}"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # ── app ──
    app_env: str = APP_ENV
    debug: bool = True
    api_v1_prefix: str = "/api/v1"

    # ── database ─────────────────────────────────────────────────────────────
    # No defaults here on purpose: these MUST come from .env.<APP_ENV>
    # (or a full DATABASE_URL). The URL itself is assembled in `database_url`.
    db_driver: str | None = None
    db_host: str | None = None
    db_port: int | None = None
    db_user: str | None = None
    db_password: str | None = None
    db_name: str | None = None
    db_echo: bool = False
    db_pool_size: int = 10
    db_max_overflow: int = 5

    # Full-URL escape hatch. Normally empty — the test-suite sets DATABASE_URL
    # to a SQLite URL, and that's the only place it's expected.
    database_url_override: str | None = Field(default=None, validation_alias="DATABASE_URL")

    # ── redis ──
    redis_url: str = Field(default="redis://localhost:6379/0")

    # ── auth ──
    jwt_secret: str = Field(default="dev-insecure-jwt-secret-change-me-0123456789abcdef")
    jwt_algorithm: str = "HS256"
    jwt_access_ttl_min: int = 15
    jwt_refresh_ttl_days: int = 7

    # ── password hashing (argon2id) ──
    argon2_time_cost: int = 3
    argon2_memory_cost_kib: int = 65536
    argon2_parallelism: int = 4

    # ── email verification (OTP) ──
    otp_ttl_minutes: int = 10
    otp_max_attempts: int = 5

    # ── SMTP email ──
    smtp_host: str | None = None
    smtp_port: int = 587
    smtp_user: str | None = None
    smtp_password: str | None = None
    smtp_from: str | None = None
    smtp_starttls: bool = True

    # ── cloudinary media storage ──
    cloudinary_cloud_name: str | None = None
    cloudinary_api_key: str | None = None
    cloudinary_api_secret: str | None = None

    @property
    def smtp_configured(self) -> bool:
        return bool(self.smtp_host and self.smtp_user and self.smtp_password and self.smtp_from)

    @property
    def cloudinary_configured(self) -> bool:
        return bool(
            self.cloudinary_cloud_name
            and self.cloudinary_api_key
            and self.cloudinary_api_secret
        )

    # ── rate limits (per minute) ──
    rate_limit_enabled: bool = True
    rate_limit_auth_per_min: int = 10
    rate_limit_assistant_per_min: int = 20

    # ── cors ──
    cors_origins: str = Field(default="http://localhost:3000")

    # ── downstream services (wired in later phases) ──
    ml_service_url: str = Field(default="http://localhost:8001")
    internal_api_key: str = Field(default="devInternalKey")
    meili_url: str = Field(default="http://localhost:7700")
    meili_master_key: str = Field(default="devMasterKey_change_me")

    # ── derived ──────────────────────────────────────────────────────────────
    @property
    def database_url(self) -> str:
        if self.database_url_override:
            return self.database_url_override

        missing = [p.upper() for p in _DB_PARTS if getattr(self, p) in (None, "")]
        if missing:
            raise RuntimeError(
                f"Database is not configured. Set {', '.join(missing)} in "
                f".env.{self.app_env} (or set a full DATABASE_URL)."
            )
        return (
            f"{self.db_driver}://{self.db_user}:{self.db_password}"
            f"@{self.db_host}:{self.db_port}/{self.db_name}"
        )

    @property
    def is_sqlite(self) -> bool:
        return self.database_url.startswith("sqlite")

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
