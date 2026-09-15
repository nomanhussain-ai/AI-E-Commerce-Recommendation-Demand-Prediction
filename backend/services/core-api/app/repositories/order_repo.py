from dataclasses import dataclass

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.order import Order, OrderItem, OrderStatus
from app.models.user import User
from app.repositories.base import BaseRepository


@dataclass
class OrderFilters:
    q: str | None = None
    status: OrderStatus | None = None


class OrderRepository(BaseRepository[Order]):
    model = Order

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)

    async def get_items(self, order_id: str) -> list[OrderItem]:
        result = await self.session.execute(
            select(OrderItem).where(OrderItem.order_id == order_id)
        )
        return list(result.scalars().all())

    async def get_items_for_many(self, order_ids: list[str]) -> dict[str, list[OrderItem]]:
        if not order_ids:
            return {}
        result = await self.session.execute(
            select(OrderItem).where(OrderItem.order_id.in_(order_ids))
        )
        grouped: dict[str, list[OrderItem]] = {oid: [] for oid in order_ids}
        for item in result.scalars():
            grouped.setdefault(item.order_id, []).append(item)
        return grouped

    async def list_for_user(
        self, user_id: str, *, page: int, page_size: int
    ) -> tuple[list[Order], int]:
        base = select(Order).where(Order.user_id == user_id)
        total = await self._count(base)
        offset = (page - 1) * page_size
        stmt = base.order_by(Order.created_at.desc()).limit(page_size).offset(offset)
        result = await self.session.execute(stmt)
        return list(result.scalars().all()), total

    async def search_admin(
        self, f: OrderFilters, *, page: int, page_size: int
    ) -> tuple[list[Order], int]:
        base = select(Order).join(User, User.id == Order.user_id)
        if f.q:
            like = f"%{f.q.lower()}%"
            base = base.where(
                or_(
                    func.lower(Order.id).like(like),
                    func.lower(User.full_name).like(like),
                    func.lower(User.email).like(like),
                )
            )
        if f.status:
            base = base.where(Order.status == f.status)

        total = await self._count(base)
        offset = (page - 1) * page_size
        stmt = base.order_by(Order.created_at.desc()).limit(page_size).offset(offset)
        result = await self.session.execute(stmt)
        return list(result.scalars().all()), total

    async def _count(self, stmt) -> int:  # type: ignore[no-untyped-def]
        result = await self.session.execute(select(func.count()).select_from(stmt.subquery()))
        return int(result.scalar_one())

    async def customer_names(self, user_ids: set[str]) -> dict[str, tuple[str, str]]:
        if not user_ids:
            return {}
        result = await self.session.execute(
            select(User.id, User.full_name, User.email).where(User.id.in_(user_ids))
        )
        return {row[0]: (row[1], row[2]) for row in result.all()}

    async def update_status(self, order: Order, status: OrderStatus) -> Order:
        order.status = status
        self.session.add(order)
        await self.session.flush()
        return order
