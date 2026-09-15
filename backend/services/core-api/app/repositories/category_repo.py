from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.category import Category
from app.models.product import Product
from app.repositories.base import BaseRepository


class CategoryRepository(BaseRepository[Category]):
    model = Category

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)

    async def get_by_slug(self, slug: str) -> Category | None:
        result = await self.session.execute(select(Category).where(Category.slug == slug))
        return result.scalar_one_or_none()

    async def list_all(self) -> list[Category]:
        result = await self.session.execute(select(Category).order_by(Category.name))
        return list(result.scalars().all())

    async def product_counts(self) -> dict[str, int]:
        result = await self.session.execute(
            select(Product.category_id, func.count()).group_by(Product.category_id)
        )
        return {row[0]: row[1] for row in result.all()}

    async def update(self, category: Category, **fields: object) -> Category:
        for key, value in fields.items():
            setattr(category, key, value)
        self.session.add(category)
        await self.session.flush()
        return category
