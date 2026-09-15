from fastapi import APIRouter, Query

from app.dependencies import AdminUser, CustomerRepositoryDep
from app.repositories.customer_repo import CustomerFilters, CustomerRow
from app.schemas.customer import CustomerListMeta, CustomerListOut, CustomerOut, Pagination

router = APIRouter(prefix="/admin/customers", tags=["admin", "customers"])


def _segment_for(row: CustomerRow) -> str:
    """Orders/spend threshold — see schemas/customer.py for why this isn't M3 yet."""
    if row.orders_count == 0:
        return "new"
    if row.orders_count >= 10 or row.total_spent >= 200_000:
        return "loyal"
    if row.orders_count >= 3:
        return "high_intent"
    return "window_shopper"


@router.get("", response_model=CustomerListOut)
async def list_customers(
    customers: CustomerRepositoryDep,
    _admin: AdminUser,
    q: str | None = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> CustomerListOut:
    rows, total = await customers.search(CustomerFilters(q=q), page=page, page_size=page_size)
    data = [
        CustomerOut(
            id=r.id,
            full_name=r.full_name,
            email=r.email,
            joined_at=r.joined_at,
            orders_count=r.orders_count,
            total_spent=r.total_spent,
            segment=_segment_for(r),
        )
        for r in rows
    ]
    total_pages = max(1, (total + page_size - 1) // page_size)
    pagination = Pagination(page=page, page_size=page_size, total=total, total_pages=total_pages)
    return CustomerListOut(data=data, meta=CustomerListMeta(pagination=pagination))
