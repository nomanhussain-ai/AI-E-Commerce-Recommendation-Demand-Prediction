"""catalog: categories, products

Revision ID: 0002
Revises: 0001
Create Date: 2026-09-08
"""
from collections.abc import Sequence

import sqlalchemy as sa
import sqlmodel
from alembic import op

revision: str = "0002"
down_revision: str | None = "0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

_STR = sqlmodel.sql.sqltypes.AutoString


def upgrade() -> None:
    op.create_table(
        "categories",
        sa.Column("id", _STR(), primary_key=True),
        sa.Column("parent_id", _STR(), nullable=True),
        sa.Column("name", _STR(), nullable=False),
        sa.Column("slug", _STR(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.ForeignKeyConstraint(["parent_id"], ["categories.id"], ondelete="SET NULL"),
    )
    op.create_index("ix_categories_slug", "categories", ["slug"], unique=True)
    op.create_index("ix_categories_parent_id", "categories", ["parent_id"])

    op.create_table(
        "products",
        sa.Column("id", _STR(), primary_key=True),
        sa.Column("sku", _STR(), nullable=False),
        sa.Column("slug", _STR(), nullable=False),
        sa.Column("title", _STR(), nullable=False),
        sa.Column("description", _STR(), nullable=False, server_default=""),
        sa.Column("category_id", _STR(), nullable=False),
        sa.Column("brand", _STR(), nullable=True),
        sa.Column("price", sa.Integer(), nullable=False),
        sa.Column("discount_price", sa.Integer(), nullable=True),
        sa.Column("currency", _STR(), nullable=False, server_default="PKR"),
        sa.Column("image_url", _STR(), nullable=True),
        sa.Column("stock", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("rating_avg", sa.Float(), nullable=False, server_default="0"),
        sa.Column("rating_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["category_id"], ["categories.id"]),
    )
    op.create_index("ix_products_sku", "products", ["sku"], unique=True)
    op.create_index("ix_products_slug", "products", ["slug"], unique=True)
    op.create_index("ix_products_category_id", "products", ["category_id"])
    op.create_index("ix_products_brand", "products", ["brand"])
    op.create_index("ix_products_is_active", "products", ["is_active"])


def downgrade() -> None:
    op.drop_table("products")
    op.drop_table("categories")
