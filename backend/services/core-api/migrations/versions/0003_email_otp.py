"""email verification: users.is_email_verified, email_otps

Revision ID: 0003
Revises: 0002
Create Date: 2026-09-09
"""
from collections.abc import Sequence

import sqlalchemy as sa
import sqlmodel
from alembic import op

revision: str = "0003"
down_revision: str | None = "0002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

_STR = sqlmodel.sql.sqltypes.AutoString


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column(
            "is_email_verified", sa.Boolean(), nullable=False, server_default=sa.false()
        ),
    )

    op.create_table(
        "email_otps",
        sa.Column("id", _STR(), primary_key=True),
        sa.Column("user_id", _STR(), nullable=False),
        sa.Column("code_hash", _STR(), nullable=False),
        sa.Column("attempts", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("used_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_email_otps_user_id", "email_otps", ["user_id"])


def downgrade() -> None:
    op.drop_table("email_otps")
    op.drop_column("users", "is_email_verified")
