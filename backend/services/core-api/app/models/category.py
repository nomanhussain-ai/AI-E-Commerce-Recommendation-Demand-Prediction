from sqlmodel import Field, SQLModel

from app.core.ids import new_id


class Category(SQLModel, table=True):
    __tablename__ = "categories"

    id: str = Field(default_factory=lambda: new_id("cat_"), primary_key=True)
    parent_id: str | None = Field(default=None, foreign_key="categories.id", index=True)
    name: str = Field(nullable=False)
    slug: str = Field(unique=True, index=True, nullable=False)
    is_active: bool = Field(default=True, nullable=False)
