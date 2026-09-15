"""add profile avatar and cover image URLs

Revision ID: 0006
Revises: 0005
Create Date: 2026-09-09
"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0006"
down_revision: str | None = "0005"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("users", sa.Column("avatar_url", sa.String(), nullable=True))
    op.add_column("users", sa.Column("cover_image_url", sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "cover_image_url")
    op.drop_column("users", "avatar_url")
