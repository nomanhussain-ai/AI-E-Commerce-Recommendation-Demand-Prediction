from fastapi import APIRouter, Query, status

from app.dependencies import AdminUser, CurrentUser, OrderServiceDep
from app.models.order import OrderStatus
from app.repositories.order_repo import OrderFilters
from app.schemas.order import (
    OrderCreate,
    OrderListMeta,
    OrderListOut,
    OrderOut,
    OrderStatusUpdate,
    Pagination,
)

router = APIRouter(prefix="/orders", tags=["orders"])
admin_router = APIRouter(prefix="/admin/orders", tags=["admin", "orders"])


def _paginate(data: list[OrderOut], total: int, page: int, page_size: int) -> OrderListOut:
    total_pages = max(1, (total + page_size - 1) // page_size)
    pagination = Pagination(page=page, page_size=page_size, total=total, total_pages=total_pages)
    return OrderListOut(data=data, meta=OrderListMeta(pagination=pagination))


@router.post("", response_model=OrderOut, status_code=status.HTTP_201_CREATED)
async def place_order(body: OrderCreate, user: CurrentUser, orders: OrderServiceDep) -> OrderOut:
    return await orders.place_order(user, body)


@router.get("", response_model=OrderListOut)
async def my_orders(
    user: CurrentUser,
    orders: OrderServiceDep,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> OrderListOut:
    data, total = await orders.list_my_orders(user, page=page, page_size=page_size)
    return _paginate(data, total, page, page_size)


@router.get("/{order_id}", response_model=OrderOut)
async def get_order(order_id: str, user: CurrentUser, orders: OrderServiceDep) -> OrderOut:
    return await orders.get_my_order(user, order_id)


@admin_router.get("", response_model=OrderListOut)
async def admin_list_orders(
    orders: OrderServiceDep,
    _admin: AdminUser,
    q: str | None = None,
    status_: OrderStatus | None = Query(default=None, alias="status"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> OrderListOut:
    data, total = await orders.admin_search(
        OrderFilters(q=q, status=status_), page=page, page_size=page_size
    )
    return _paginate(data, total, page, page_size)


@admin_router.patch("/{order_id}", response_model=OrderOut)
async def admin_update_order_status(
    order_id: str, body: OrderStatusUpdate, orders: OrderServiceDep, _admin: AdminUser
) -> OrderOut:
    return await orders.update_status(order_id, body.status)
