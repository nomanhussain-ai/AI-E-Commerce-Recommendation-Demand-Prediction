from pydantic import BaseModel, Field


class ProductOut(BaseModel):
    id: str
    sku: str
    slug: str
    title: str
    description: str
    category_id: str
    category_name: str | None = None
    brand: str | None
    price: int
    discount_price: int | None
    currency: str
    image_url: str | None
    stock: int
    rating_avg: float
    rating_count: int
    is_active: bool

    model_config = {"from_attributes": True}


class ProductCreate(BaseModel):
    sku: str | None = Field(default=None, max_length=64)
    slug: str | None = Field(default=None, max_length=180)
    title: str = Field(min_length=1, max_length=200)
    description: str = Field(default="", max_length=5000)
    category_id: str
    brand: str | None = Field(default=None, max_length=100)
    price: int = Field(ge=0)
    discount_price: int | None = Field(default=None, ge=0)
    currency: str = Field(default="PKR", max_length=8)
    image_url: str | None = None
    stock: int = Field(default=0, ge=0)
    is_active: bool = True


class ProductUpdate(BaseModel):
    sku: str | None = Field(default=None, max_length=64)
    slug: str | None = Field(default=None, max_length=180)
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=5000)
    category_id: str | None = None
    brand: str | None = Field(default=None, max_length=100)
    price: int | None = Field(default=None, ge=0)
    discount_price: int | None = Field(default=None, ge=0)
    currency: str | None = Field(default=None, max_length=8)
    image_url: str | None = None
    stock: int | None = Field(default=None, ge=0)
    is_active: bool | None = None


class Pagination(BaseModel):
    page: int
    page_size: int
    total: int
    total_pages: int


class ProductListMeta(BaseModel):
    pagination: Pagination


class ProductListOut(BaseModel):
    data: list[ProductOut]
    meta: ProductListMeta
