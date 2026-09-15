from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.cart import Cart, CartItem


class CartRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_by_user(self, user_id: str) -> Cart | None:
        result = await self.session.execute(select(Cart).where(Cart.user_id == user_id))
        return result.scalar_one_or_none()

    async def create(self, user_id: str) -> Cart:
        cart = Cart(user_id=user_id)
        self.session.add(cart)
        await self.session.flush()
        return cart

    async def get_or_create(self, user_id: str) -> Cart:
        cart = await self.get_by_user(user_id)
        return cart if cart is not None else await self.create(user_id)

    async def get_items(self, cart_id: str) -> list[CartItem]:
        result = await self.session.execute(
            select(CartItem).where(CartItem.cart_id == cart_id)
        )
        return list(result.scalars().all())

    async def get_item(self, cart_id: str, product_id: str) -> CartItem | None:
        result = await self.session.execute(
            select(CartItem).where(
                CartItem.cart_id == cart_id, CartItem.product_id == product_id
            )
        )
        return result.scalar_one_or_none()

    async def add_item(self, item: CartItem) -> CartItem:
        self.session.add(item)
        await self.session.flush()
        return item

    async def update_item(self, item: CartItem, *, quantity: int, unit_price: int) -> CartItem:
        item.quantity = quantity
        item.unit_price = unit_price
        self.session.add(item)
        await self.session.flush()
        return item

    async def remove_item(self, item: CartItem) -> None:
        await self.session.delete(item)
        await self.session.flush()

    async def clear(self, cart_id: str) -> None:
        for item in await self.get_items(cart_id):
            await self.session.delete(item)
        await self.session.flush()
