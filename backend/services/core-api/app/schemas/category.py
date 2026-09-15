from pydantic import BaseModel, Field


class CategoryOut(BaseModel):
    id: str
    parent_id: str | None
    name: str
    slug: str
    is_active: bool
    product_count: int = 0

    model_config = {"from_attributes": True}


class CategoryCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    slug: str | None = Field(default=None, max_length=140)
    parent_id: str | None = None
    is_active: bool = True


class CategoryUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    slug: str | None = Field(default=None, max_length=140)
    parent_id: str | None = None
    is_active: bool | None = None
