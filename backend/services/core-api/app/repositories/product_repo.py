from dataclasses import dataclass

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.category import Category
from app.models.product import Product
from app.repositories.base import BaseRepository

SORT_COLUMNS = {
    "price": Product.price.asc(),
    "-price": Product.price.desc(),
    "created": Product.created_at.asc(),
    "-created": Product.created_at.desc(),
    "title": Product.title.asc(),
    "stock": Product.stock.asc(),
    "-stock": Product.stock.desc(),
}


@dataclass
class ProductFilters:
    q: str | None = None
    category_id: str | None = None
    brand: str | None = None
    is_active: bool | None = None
    min_price: int | None = None
    max_price: int | None = None
    low_stock: bool = False
    sort: str = "-created"


class ProductRepository(BaseRepository[Product]):
    model = Product

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)

    def _filtered(self, f: ProductFilters):
        stmt = select(Product)
        if f.q:
            like = f"%{f.q.lower()}%"
            stmt = stmt.where(
                or_(
                    func.lower(Product.title).like(like),
                    func.lower(Product.sku).like(like),
                    func.lower(func.coalesce(Product.brand, "")).like(like),
                )
            )
        if f.category_id:
            stmt = stmt.where(Product.category_id == f.category_id)
        if f.brand:
            stmt = stmt.where(Product.brand == f.brand)
        if f.is_active is not None:
            stmt = stmt.where(Product.is_active == f.is_active)
        if f.min_price is not None:
            stmt = stmt.where(Product.price >= f.min_price)
        if f.max_price is not None:
            stmt = stmt.where(Product.price <= f.max_price)
        if f.low_stock:
            stmt = stmt.where(Product.stock <= 15)
        return stmt

    async def search(
        self, f: ProductFilters, *, page: int, page_size: int
    ) -> tuple[list[Product], int]:
        base = self._filtered(f)

        count_result = await self.session.execute(
            select(func.count()).select_from(base.subquery())
        )
        total = int(count_result.scalar_one())

        order = SORT_COLUMNS.get(f.sort, SORT_COLUMNS["-created"])
        stmt = base.order_by(order).limit(page_size).offset((page - 1) * page_size)
        result = await self.session.execute(stmt)
        return list(result.scalars().all()), total

    async def get_for_update(self, product_id: str) -> Product | None:
        """Row-locked read — serializes concurrent stock decrements for the same product."""
        result = await self.session.execute(
            select(Product).where(Product.id == product_id).with_for_update()
        )
        return result.scalar_one_or_none()

    async def get_by_sku(self, sku: str) -> Product | None:
        result = await self.session.execute(select(Product).where(Product.sku == sku))
        return result.scalar_one_or_none()

    async def get_by_slug(self, slug: str) -> Product | None:
        result = await self.session.execute(select(Product).where(Product.slug == slug))
        return result.scalar_one_or_none()

    async def category_names(self, category_ids: set[str]) -> dict[str, str]:
        if not category_ids:
            return {}
        result = await self.session.execute(
            select(Category.id, Category.name).where(Category.id.in_(category_ids))
        )
        return {row[0]: row[1] for row in result.all()}

    async def update(self, product: Product, **fields: object) -> Product:
        for key, value in fields.items():
            setattr(product, key, value)
        self.session.add(product)
        await self.session.flush()
        return product
