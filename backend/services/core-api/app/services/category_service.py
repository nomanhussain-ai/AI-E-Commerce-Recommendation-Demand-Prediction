from app.core.slug import slugify
from app.exceptions import ConflictError, NotFoundError
from app.models.category import Category
from app.repositories.category_repo import CategoryRepository
from app.schemas.category import CategoryCreate, CategoryOut, CategoryUpdate


class CategoryService:
    def __init__(self, repo: CategoryRepository) -> None:
        self.repo = repo

    async def _unique_slug(self, base: str, *, exclude_id: str | None = None) -> str:
        slug = slugify(base)
        candidate = slug
        n = 2
        while True:
            existing = await self.repo.get_by_slug(candidate)
            if existing is None or existing.id == exclude_id:
                return candidate
            candidate = f"{slug}-{n}"
            n += 1

    async def list_with_counts(self) -> list[CategoryOut]:
        categories = await self.repo.list_all()
        counts = await self.repo.product_counts()
        return [
            CategoryOut(
                id=c.id,
                parent_id=c.parent_id,
                name=c.name,
                slug=c.slug,
                is_active=c.is_active,
                product_count=counts.get(c.id, 0),
            )
            for c in categories
        ]

    async def get(self, category_id: str) -> Category:
        category = await self.repo.get(category_id)
        if category is None:
            raise NotFoundError("Category not found.")
        return category

    async def create(self, body: CategoryCreate) -> Category:
        slug = await self._unique_slug(body.slug or body.name)
        if body.parent_id:
            await self.get(body.parent_id)
        category = Category(
            name=body.name, slug=slug, parent_id=body.parent_id, is_active=body.is_active
        )
        return await self.repo.add(category)

    async def update(self, category_id: str, body: CategoryUpdate) -> Category:
        category = await self.get(category_id)
        fields = body.model_dump(exclude_unset=True)

        if "name" in fields and "slug" not in fields:
            fields["slug"] = await self._unique_slug(fields["name"], exclude_id=category_id)
        elif "slug" in fields and fields["slug"]:
            fields["slug"] = await self._unique_slug(fields["slug"], exclude_id=category_id)

        if fields.get("parent_id") == category_id:
            raise ConflictError("A category cannot be its own parent.")
        if fields.get("parent_id"):
            await self.get(fields["parent_id"])

        return await self.repo.update(category, **fields)

    async def delete(self, category_id: str) -> None:
        category = await self.get(category_id)
        counts = await self.repo.product_counts()
        if counts.get(category_id, 0) > 0:
            raise ConflictError(
                "Category still has products assigned.",
                code="CONFLICT",
                details={"product_count": counts[category_id]},
            )
        await self.repo.delete(category)
