from pydantic import BaseModel, Field


class CartItemAddIn(BaseModel):
    product_id: str
    quantity: int = Field(default=1, gt=0, le=50)


class CartItemUpdateIn(BaseModel):
    quantity: int = Field(ge=0, le=50)  # 0 = remove


class CartItemOut(BaseModel):
    product_id: str
    title: str
    slug: str
    image_url: str | None
    unit_price: int
    quantity: int
    line_total: int
    stock: int
    is_active: bool


class CartOut(BaseModel):
    id: str
    items: list[CartItemOut]
    item_count: int
    subtotal: int
    currency: str = "PKR"
