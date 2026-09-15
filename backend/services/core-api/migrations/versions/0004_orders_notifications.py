"""orders, order_items, notifications

Revision ID: 0004
Revises: 0003
Create Date: 2026-09-09
"""
from collections.abc import Sequence

import sqlalchemy as sa
import sqlmodel
from alembic import op
from sqlalchemy.dialects.postgresql import ENUM

revision: str = "0004"
down_revision: str | None = "0003"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

_STR = sqlmodel.sql.sqltypes.AutoString


def upgrade() -> None:
    op.execute(
        "DO $$ BEGIN "
        "  CREATE TYPE order_status AS ENUM "
        "    ('pending','paid','shipped','delivered','cancelled','refunded'); "
        "  EXCEPTION WHEN duplicate_object THEN NULL; "
        "END $$;"
    )
    status_enum = ENUM(
        "pending", "paid", "shipped", "delivered", "cancelled", "refunded",
        name="order_status", create_type=False,
    )

    op.create_table(
        "orders",
        sa.Column("id", _STR(), primary_key=True),
        sa.Column("user_id", _STR(), nullable=False),
        sa.Column("status", status_enum, nullable=False, server_default="pending"),
        sa.Column("subtotal", sa.Integer(), nullable=False),
        sa.Column("shipping_total", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("grand_total", sa.Integer(), nullable=False),
        sa.Column("currency", _STR(), nullable=False, server_default="PKR"),
        sa.Column("payment_method", _STR(), nullable=False, server_default="cod"),
        sa.Column("shipping_address", _STR(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
    )
    op.create_index("ix_orders_user_id", "orders", ["user_id"])
    op.create_index("ix_orders_created_at", "orders", ["created_at"])

    op.create_table(
        "order_items",
        sa.Column("id", _STR(), primary_key=True),
        sa.Column("order_id", _STR(), nullable=False),
        sa.Column("product_id", _STR(), nullable=False),
        sa.Column("title_snapshot", _STR(), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("unit_price", sa.Integer(), nullable=False),
        sa.Column("line_total", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["order_id"], ["orders.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"]),
    )
    op.create_index("ix_order_items_order_id", "order_items", ["order_id"])

    op.create_table(
        "notifications",
        sa.Column("id", _STR(), primary_key=True),
        sa.Column("user_id", _STR(), nullable=True),
        sa.Column("kind", _STR(), nullable=False),
        sa.Column("payload", sa.JSON(), nullable=False, server_default="{}"),
        sa.Column("read_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="SET NULL"),
    )
    op.create_index("ix_notifications_user_id", "notifications", ["user_id"])


def downgrade() -> None:
    op.drop_table("notifications")
    op.drop_table("order_items")
    op.drop_table("orders")
    op.execute("DROP TYPE IF EXISTS order_status")
