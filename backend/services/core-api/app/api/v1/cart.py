from fastapi import APIRouter, status

from app.dependencies import CartServiceDep, CurrentUser
from app.schemas.cart import CartItemAddIn, CartItemUpdateIn, CartOut

router = APIRouter(prefix="/cart", tags=["cart"])


@router.get("", response_model=CartOut)
async def get_cart(user: CurrentUser, cart: CartServiceDep) -> CartOut:
    return await cart.get_cart(user)


@router.post("/items", response_model=CartOut)
async def add_item(body: CartItemAddIn, user: CurrentUser, cart: CartServiceDep) -> CartOut:
    return await cart.add_item(user, product_id=body.product_id, quantity=body.quantity)


@router.patch("/items/{product_id}", response_model=CartOut)
async def update_item(
    product_id: str, body: CartItemUpdateIn, user: CurrentUser, cart: CartServiceDep
) -> CartOut:
    return await cart.update_item(user, product_id=product_id, quantity=body.quantity)


@router.delete("/items/{product_id}", response_model=CartOut)
async def remove_item(product_id: str, user: CurrentUser, cart: CartServiceDep) -> CartOut:
    return await cart.remove_item(user, product_id=product_id)


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
async def clear_cart(user: CurrentUser, cart: CartServiceDep) -> None:
    await cart.clear(user)
