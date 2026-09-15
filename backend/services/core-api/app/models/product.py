from sqlmodel import Field

from app.core.ids import new_id
from app.models.base import TimestampMixin


class Product(TimestampMixin, table=True):
    __tablename__ = "products"

    id: str = Field(default_factory=lambda: new_id("prd_"), primary_key=True)
    sku: str = Field(unique=True, index=True, nullable=False)
    slug: str = Field(unique=True, index=True, nullable=False)
    title: str = Field(nullable=False)
    description: str = Field(default="", nullable=False)
    category_id: str = Field(foreign_key="categories.id", index=True, nullable=False)
    brand: str | None = Field(default=None, index=True)
    # Whole PKR units (not minor units) — keeps admin forms and display simple at FYP scale.
    price: int = Field(nullable=False)
    discount_price: int | None = Field(default=None)
    currency: str = Field(default="PKR", nullable=False)
    image_url: str | None = Field(default=None)
    stock: int = Field(default=0, nullable=False)
    rating_avg: float = Field(default=0, nullable=False)
    rating_count: int = Field(default=0, nullable=False)
    is_active: bool = Field(default=True, nullable=False, index=True)
