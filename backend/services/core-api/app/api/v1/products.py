from fastapi import APIRouter, Query, status

from app.dependencies import AdminUser, ProductServiceDep
from app.repositories.product_repo import ProductFilters
from app.schemas.product import (
    Pagination,
    ProductCreate,
    ProductListMeta,
    ProductListOut,
    ProductOut,
    ProductUpdate,
)

router = APIRouter(tags=["products"])
admin_router = APIRouter(prefix="/admin/products", tags=["admin", "products"])


@router.get("/products", response_model=ProductListOut)
async def list_products(
    products: ProductServiceDep,
    q: str | None = None,
    category_id: str | None = None,
    brand: str | None = None,
    is_active: bool | None = None,
    min_price: int | None = Query(default=None, ge=0),
    max_price: int | None = Query(default=None, ge=0),
    low_stock: bool = False,
    sort: str = "-created",
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=24, ge=1, le=100),
) -> ProductListOut:
    filters = ProductFilters(
        q=q,
        category_id=category_id,
        brand=brand,
        is_active=is_active,
        min_price=min_price,
        max_price=max_price,
        low_stock=low_stock,
        sort=sort,
    )
    data, total = await products.search(filters, page=page, page_size=page_size)
    total_pages = max(1, (total + page_size - 1) // page_size)
    pagination = Pagination(page=page, page_size=page_size, total=total, total_pages=total_pages)
    return ProductListOut(data=data, meta=ProductListMeta(pagination=pagination))


@router.get("/products/{product_id}", response_model=ProductOut)
async def get_product(product_id: str, products: ProductServiceDep) -> ProductOut:
    return await products.get_out(product_id)


@admin_router.post("", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
async def create_product(
    body: ProductCreate, products: ProductServiceDep, _admin: AdminUser
) -> ProductOut:
    return await products.create(body)


@admin_router.put("/{product_id}", response_model=ProductOut)
async def update_product(
    product_id: str, body: ProductUpdate, products: ProductServiceDep, _admin: AdminUser
) -> ProductOut:
    return await products.update(product_id, body)


@admin_router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(product_id: str, products: ProductServiceDep, _admin: AdminUser) -> None:
    await products.delete(product_id)
