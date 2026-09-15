from fastapi import APIRouter, status

from app.dependencies import AdminUser, CategoryServiceDep
from app.schemas.category import CategoryCreate, CategoryOut, CategoryUpdate

router = APIRouter(tags=["categories"])
admin_router = APIRouter(prefix="/admin/categories", tags=["admin", "categories"])


@router.get("/categories", response_model=list[CategoryOut])
async def list_categories(categories: CategoryServiceDep) -> list[CategoryOut]:
    return await categories.list_with_counts()


@admin_router.post("", response_model=CategoryOut, status_code=status.HTTP_201_CREATED)
async def create_category(
    body: CategoryCreate, categories: CategoryServiceDep, _admin: AdminUser
) -> CategoryOut:
    category = await categories.create(body)
    return CategoryOut.model_validate(category)


@admin_router.put("/{category_id}", response_model=CategoryOut)
async def update_category(
    category_id: str, body: CategoryUpdate, categories: CategoryServiceDep, _admin: AdminUser
) -> CategoryOut:
    category = await categories.update(category_id, body)
    return CategoryOut.model_validate(category)


@admin_router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: str, categories: CategoryServiceDep, _admin: AdminUser
) -> None:
    await categories.delete(category_id)
