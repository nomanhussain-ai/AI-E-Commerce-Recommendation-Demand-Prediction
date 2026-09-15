from dataclasses import dataclass

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.order import Order
from app.models.user import User, UserRole


@dataclass
class CustomerRow:
    id: str
    full_name: str
    email: str
    joined_at: object
    orders_count: int
    total_spent: int


@dataclass
class CustomerFilters:
    q: str | None = None


class CustomerRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def search(
        self, f: CustomerFilters, *, page: int, page_size: int
    ) -> tuple[list[CustomerRow], int]:
        base = (
            select(
                User.id,
                User.full_name,
                User.email,
                User.created_at,
                func.count(Order.id).label("orders_count"),
                func.coalesce(func.sum(Order.grand_total), 0).label("total_spent"),
            )
            .select_from(User)
            .outerjoin(Order, Order.user_id == User.id)
            .where(User.role == UserRole.customer)
            .group_by(User.id, User.full_name, User.email, User.created_at)
        )
        if f.q:
            like = f"%{f.q.lower()}%"
            base = base.where(
                or_(func.lower(User.full_name).like(like), func.lower(User.email).like(like))
            )

        count_result = await self.session.execute(select(func.count()).select_from(base.subquery()))
        total = int(count_result.scalar_one())

        stmt = (
            base.order_by(func.coalesce(func.sum(Order.grand_total), 0).desc())
            .limit(page_size)
            .offset((page - 1) * page_size)
        )
        result = await self.session.execute(stmt)
        rows = [
            CustomerRow(
                id=r.id,
                full_name=r.full_name,
                email=r.email,
                joined_at=r.created_at,
                orders_count=r.orders_count,
                total_spent=r.total_spent,
            )
            for r in result.all()
        ]
        return rows, total
