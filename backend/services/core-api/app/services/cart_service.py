from app.exceptions import ConflictError, NotFoundError
from app.models.cart import Cart, CartItem
from app.models.user import User
from app.repositories.cart_repo import CartRepository
from app.repositories.product_repo import ProductRepository
from app.schemas.cart import CartItemOut, CartOut


class CartService:
    def __init__(self, repo: CartRepository, products: ProductRepository) -> None:
        self.repo = repo
        self.products = products

    async def _to_out(self, cart: Cart) -> CartOut:
        items = await self.repo.get_items(cart.id)
        product_ids = {i.product_id for i in items}
        products = {pid: await self.products.get(pid) for pid in product_ids}

        out_items: list[CartItemOut] = []
        subtotal = 0
        for item in items:
            product = products.get(item.product_id)
            if product is None:
                continue
            line_total = item.unit_price * item.quantity
            subtotal += line_total
            out_items.append(
                CartItemOut(
                    product_id=product.id,
                    title=product.title,
                    slug=product.slug,
                    image_url=product.image_url,
                    unit_price=item.unit_price,
                    quantity=item.quantity,
                    line_total=line_total,
                    stock=product.stock,
                    is_active=product.is_active,
                )
            )

        return CartOut(
            id=cart.id,
            items=out_items,
            item_count=sum(i.quantity for i in out_items),
            subtotal=subtotal,
        )

    async def get_cart(self, user: User) -> CartOut:
        cart = await self.repo.get_or_create(user.id)
        return await self._to_out(cart)

    async def add_item(self, user: User, *, product_id: str, quantity: int) -> CartOut:
        product = await self.products.get(product_id)
        if product is None or not product.is_active:
            raise NotFoundError("Product not found.")
        if product.stock <= 0:
            raise ConflictError(
                f'"{product.title}" is out of stock.',
                code="OUT_OF_STOCK",
                details={"product_id": product.id, "available": 0},
            )

        cart = await self.repo.get_or_create(user.id)
        unit_price = product.discount_price or product.price
        existing = await self.repo.get_item(cart.id, product_id)

        if existing is not None:
            new_qty = min(existing.quantity + quantity, product.stock)
            await self.repo.update_item(existing, quantity=new_qty, unit_price=unit_price)
        else:
            qty = min(quantity, product.stock)
            item = CartItem(
                cart_id=cart.id, product_id=product_id, quantity=qty, unit_price=unit_price
            )
            await self.repo.add_item(item)

        return await self._to_out(cart)

    async def update_item(self, user: User, *, product_id: str, quantity: int) -> CartOut:
        cart = await self.repo.get_or_create(user.id)
        existing = await self.repo.get_item(cart.id, product_id)
        if existing is None:
            raise NotFoundError("Item not in cart.")

        if quantity == 0:
            await self.repo.remove_item(existing)
        else:
            product = await self.products.get(product_id)
            capped = min(quantity, product.stock) if product else quantity
            await self.repo.update_item(existing, quantity=capped, unit_price=existing.unit_price)

        return await self._to_out(cart)

    async def remove_item(self, user: User, *, product_id: str) -> CartOut:
        cart = await self.repo.get_or_create(user.id)
        existing = await self.repo.get_item(cart.id, product_id)
        if existing is not None:
            await self.repo.remove_item(existing)
        return await self._to_out(cart)

    async def clear(self, user: User) -> None:
        cart = await self.repo.get_or_create(user.id)
        await self.repo.clear(cart.id)
