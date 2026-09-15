from datetime import datetime

from pydantic import BaseModel, Field

from app.models.order import OrderStatus


class OrderItemIn(BaseModel):
    product_id: str
    quantity: int = Field(gt=0, le=50)


class OrderCreate(BaseModel):
    # Omit to check out the caller's current cart; pass explicit items to
    # place an order without going through the cart (e.g. admin tooling).
    items: list[OrderItemIn] | None = Field(default=None, max_length=50)
    shipping_address: str = Field(min_length=1, max_length=500)
    payment_method: str = Field(default="cod", max_length=20)


class OrderStatusUpdate(BaseModel):
    status: OrderStatus


class OrderItemOut(BaseModel):
    id: str
    product_id: str
    title_snapshot: str
    quantity: int
    unit_price: int
    line_total: int

    model_config = {"from_attributes": True}


class OrderOut(BaseModel):
    id: str
    user_id: str
    customer_name: str | None = None
    customer_email: str | None = None
    status: OrderStatus
    subtotal: int
    shipping_total: int
    grand_total: int
    currency: str
    payment_method: str
    shipping_address: str
    placed_at: datetime
    items: list[OrderItemOut] = []


class Pagination(BaseModel):
    page: int
    page_size: int
    total: int
    total_pages: int


class OrderListMeta(BaseModel):
    pagination: Pagination


class OrderListOut(BaseModel):
    data: list[OrderOut]
    meta: OrderListMeta
