from sqlmodel import Field

from app.core.ids import new_id
from app.models.base import TimestampMixin


class Cart(TimestampMixin, table=True):
    __tablename__ = "carts"

    id: str = Field(default_factory=lambda: new_id("crt_"), primary_key=True)
    user_id: str = Field(foreign_key="users.id", index=True, unique=True, nullable=False)
    status: str = Field(default="active", nullable=False)


class CartItem(TimestampMixin, table=True):
    __tablename__ = "cart_items"

    id: str = Field(default_factory=lambda: new_id("cit_"), primary_key=True)
    cart_id: str = Field(foreign_key="carts.id", index=True, nullable=False)
    product_id: str = Field(foreign_key="products.id", nullable=False)
    quantity: int = Field(nullable=False)
    unit_price: int = Field(nullable=False)
