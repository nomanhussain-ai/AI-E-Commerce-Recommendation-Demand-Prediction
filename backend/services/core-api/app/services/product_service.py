import secrets

from app.core.slug import slugify
from app.exceptions import NotFoundError
from app.models.product import Product
from app.repositories.category_repo import CategoryRepository
from app.repositories.product_repo import ProductFilters, ProductRepository
from app.schemas.product import ProductCreate, ProductOut, ProductUpdate
from app.services.media_service import media_url


def _auto_sku() -> str:
    return f"SKU-{secrets.token_hex(4).upper()}"


class ProductService:
    def __init__(self, repo: ProductRepository, categories: CategoryRepository) -> None:
        self.repo = repo
        self.categories = categories

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

    async def _unique_sku(self, base: str | None) -> str:
        candidate = base or _auto_sku()
        while await self.repo.get_by_sku(candidate) is not None:
            candidate = _auto_sku()
        return candidate

    @staticmethod
    def _build_out(product: Product, category_name: str | None) -> ProductOut:
        return ProductOut(
            id=product.id,
            sku=product.sku,
            slug=product.slug,
            title=product.title,
            description=product.description,
            category_id=product.category_id,
            category_name=category_name,
            brand=product.brand,
            price=product.price,
            discount_price=product.discount_price,
            currency=product.currency,
            image_url=media_url(product.image_url),
            stock=product.stock,
            rating_avg=product.rating_avg,
            rating_count=product.rating_count,
            is_active=product.is_active,
        )

    async def _to_out(self, product: Product) -> ProductOut:
        names = await self.repo.category_names({product.category_id})
        return self._build_out(product, names.get(product.category_id))

    async def _many_to_out(self, products: list[Product]) -> list[ProductOut]:
        names = await self.repo.category_names({p.category_id for p in products})
        return [self._build_out(p, names.get(p.category_id)) for p in products]

    async def get(self, product_id: str) -> Product:
        product = await self.repo.get(product_id)
        if product is None:
            raise NotFoundError("Product not found.")
        return product

    async def get_by_id_or_slug(self, id_or_slug: str) -> Product:
        product = await self.repo.get(id_or_slug) or await self.repo.get_by_slug(id_or_slug)
        if product is None:
            raise NotFoundError("Product not found.")
        return product

    async def get_out(self, id_or_slug: str) -> ProductOut:
        return await self._to_out(await self.get_by_id_or_slug(id_or_slug))

    async def search(
        self, f: ProductFilters, *, page: int, page_size: int
    ) -> tuple[list[ProductOut], int]:
        products, total = await self.repo.search(f, page=page, page_size=page_size)
        return await self._many_to_out(products), total

    async def create(self, body: ProductCreate) -> ProductOut:
        category = await self.categories.get(body.category_id)
        if category is None:
            raise NotFoundError("Category not found.")

        slug = await self._unique_slug(body.slug or body.title)
        sku = await self._unique_sku(body.sku)

        product = Product(
            sku=sku,
            slug=slug,
            title=body.title,
            description=body.description,
            category_id=body.category_id,
            brand=body.brand,
            price=body.price,
            discount_price=body.discount_price,
            currency=body.currency,
            image_url=body.image_url,
            stock=body.stock,
            is_active=body.is_active,
        )
        product = await self.repo.add(product)
        return await self._to_out(product)

    async def update(self, product_id: str, body: ProductUpdate) -> ProductOut:
        product = await self.get(product_id)
        fields = body.model_dump(exclude_unset=True)

        if fields.get("category_id") and await self.categories.get(fields["category_id"]) is None:
            raise NotFoundError("Category not found.")

        if "title" in fields and "slug" not in fields:
            fields["slug"] = await self._unique_slug(fields["title"], exclude_id=product_id)
        elif fields.get("slug"):
            fields["slug"] = await self._unique_slug(fields["slug"], exclude_id=product_id)

        if fields.get("sku"):
            existing = await self.repo.get_by_sku(fields["sku"])
            if existing is not None and existing.id != product_id:
                fields["sku"] = await self._unique_sku(None)

        product = await self.repo.update(product, **fields)
        return await self._to_out(product)

    async def delete(self, product_id: str) -> None:
        product = await self.get(product_id)
        await self.repo.delete(product)
