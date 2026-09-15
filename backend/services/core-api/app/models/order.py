from enum import StrEnum

from sqlalchemy import Enum as SAEnum
from sqlmodel import Field

from app.core.ids import new_id
from app.models.base import TimestampMixin


class OrderStatus(StrEnum):
    pending = "pending"
    paid = "paid"
    shipped = "shipped"
    delivered = "delivered"
    cancelled = "cancelled"
    refunded = "refunded"


class Order(TimestampMixin, table=True):
    __tablename__ = "orders"

    id: str = Field(default_factory=lambda: new_id("ord_"), primary_key=True)
    user_id: str = Field(foreign_key="users.id", index=True, nullable=False)
    status: OrderStatus = Field(
        default=OrderStatus.pending,
        sa_type=SAEnum(OrderStatus, name="order_status"),
        nullable=False,
    )
    subtotal: int = Field(nullable=False)
    shipping_total: int = Field(default=0, nullable=False)
    grand_total: int = Field(nullable=False)
    currency: str = Field(default="PKR", nullable=False)
    payment_method: str = Field(default="cod", nullable=False)
    shipping_address: str = Field(nullable=False)


class OrderItem(TimestampMixin, table=True):
    __tablename__ = "order_items"

    id: str = Field(default_factory=lambda: new_id("oit_"), primary_key=True)
    order_id: str = Field(foreign_key="orders.id", index=True, nullable=False)
    product_id: str = Field(foreign_key="products.id", nullable=False)
    title_snapshot: str = Field(nullable=False)
    quantity: int = Field(nullable=False)
    unit_price: int = Field(nullable=False)
    line_total: int = Field(nullable=False)
