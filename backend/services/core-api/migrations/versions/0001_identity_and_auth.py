"""identity and auth: extensions, user_role enum, users, refresh_tokens, addresses

Revision ID: 0001
Revises:
Create Date: 2026-08-28
"""
from collections.abc import Sequence

import sqlalchemy as sa
import sqlmodel
from alembic import op
from sqlalchemy.dialects.postgresql import CITEXT, ENUM

revision: str = "0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

_STR = sqlmodel.sql.sqltypes.AutoString


def upgrade() -> None:
    # ── extensions (also created by deployment/postgres/init.sql; idempotent here) ──
    for ext in ("citext", "pg_trgm", "unaccent"):
        op.execute(f"CREATE EXTENSION IF NOT EXISTS {ext}")

    # pgvector is only needed once the ML / recommendation tables land. A stock
    # local PostgreSQL install may not ship it yet, so don't fail the migration.
    op.execute(
        "DO $$ BEGIN "
        "  BEGIN CREATE EXTENSION IF NOT EXISTS vector; "
        "  EXCEPTION WHEN OTHERS THEN "
        "    RAISE NOTICE 'pgvector (vector) not available - skipping; install it before Phase ML'; "
        "  END; "
        "END $$;"
    )

    # Create the enum type once, guarded so a re-run (or a partial earlier run)
    # doesn't blow up. The table columns below use create_type=False so they
    # never try to emit CREATE TYPE again.
    op.execute(
        "DO $$ BEGIN "
        "  CREATE TYPE user_role AS ENUM ('customer', 'admin'); "
        "  EXCEPTION WHEN duplicate_object THEN NULL; "
        "END $$;"
    )
    role = ENUM("customer", "admin", name="user_role", create_type=False)

    op.create_table(
        "users",
        sa.Column("id", _STR(), primary_key=True),
        sa.Column("email", CITEXT(), nullable=False),
        sa.Column("password_hash", _STR(), nullable=False),
        sa.Column("full_name", _STR(), nullable=False),
        sa.Column("role", role, nullable=False, server_default="customer"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "refresh_tokens",
        sa.Column("id", _STR(), primary_key=True),
        sa.Column("user_id", _STR(), nullable=False),
        sa.Column("token_hash", _STR(), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("user_agent", _STR(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index(
        "ix_refresh_tokens_user_active",
        "refresh_tokens",
        ["user_id"],
        postgresql_where=sa.text("revoked_at IS NULL"),
    )

    op.create_table(
        "password_reset_tokens",
        sa.Column("id", _STR(), primary_key=True),
        sa.Column("user_id", _STR(), nullable=False),
        sa.Column("token_hash", _STR(), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("used_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_password_reset_tokens_user_id", "password_reset_tokens", ["user_id"])

    op.create_table(
        "addresses",
        sa.Column("id", _STR(), primary_key=True),
        sa.Column("user_id", _STR(), nullable=False),
        sa.Column("line1", _STR(), nullable=False),
        sa.Column("line2", _STR(), nullable=True),
        sa.Column("city", _STR(), nullable=False),
        sa.Column("region", _STR(), nullable=True),
        sa.Column("postal_code", _STR(), nullable=True),
        sa.Column("country", _STR(), nullable=False, server_default="PK"),
        sa.Column("is_default", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_addresses_user_id", "addresses", ["user_id"])


def downgrade() -> None:
    op.drop_table("addresses")
    op.drop_table("password_reset_tokens")
    op.drop_table("refresh_tokens")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")
    op.execute("DROP TYPE IF EXISTS user_role")
