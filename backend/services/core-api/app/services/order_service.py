from app.core.logging import log
from app.exceptions import ConflictError, ForbiddenError, NotFoundError
from app.models.order import Order, OrderItem, OrderStatus
from app.models.user import User
from app.repositories.cart_repo import CartRepository
from app.repositories.notification_repo import NotificationRepository
from app.repositories.order_repo import OrderFilters, OrderRepository
from app.repositories.product_repo import ProductRepository
from app.schemas.order import OrderCreate, OrderItemIn, OrderItemOut, OrderOut


class OrderService:
    def __init__(
        self,
        repo: OrderRepository,
        products: ProductRepository,
        notifications: NotificationRepository,
        carts: CartRepository,
    ) -> None:
        self.repo = repo
        self.products = products
        self.notifications = notifications
        self.carts = carts

    def _to_out(
        self, order: Order, items: list[OrderItem], customer_name: str, customer_email: str
    ) -> OrderOut:
        return OrderOut(
            id=order.id,
            user_id=order.user_id,
            customer_name=customer_name,
            customer_email=customer_email,
            status=order.status,
            subtotal=order.subtotal,
            shipping_total=order.shipping_total,
            grand_total=order.grand_total,
            currency=order.currency,
            payment_method=order.payment_method,
            shipping_address=order.shipping_address,
            placed_at=order.created_at,
            items=[OrderItemOut.model_validate(i) for i in items],
        )

    async def place_order(self, user: User, body: OrderCreate) -> OrderOut:
        items_in = body.items
        checkout_cart_id: str | None = None

        if items_in is None:
            cart = await self.carts.get_or_create(user.id)
            cart_items = await self.carts.get_items(cart.id)
            if not cart_items:
                raise ConflictError("Your cart is empty.", code="CART_EMPTY")
            items_in = [
                OrderItemIn(product_id=ci.product_id, quantity=ci.quantity) for ci in cart_items
            ]
            checkout_cart_id = cart.id

        # (product_id, title, qty, unit_price, line_total)
        line_plans: list[tuple[str, str, int, int, int]] = []
        subtotal = 0

        for item_in in items_in:
            product = await self.products.get_for_update(item_in.product_id)
            if product is None or not product.is_active:
                raise NotFoundError(f"Product {item_in.product_id} not found.")
            if product.stock < item_in.quantity:
                raise ConflictError(
                    f'"{product.title}" only has {product.stock} left in stock.',
                    code="OUT_OF_STOCK",
                    details={"product_id": product.id, "available": product.stock},
                )
            unit_price = product.discount_price or product.price
            line_total = unit_price * item_in.quantity
            subtotal += line_total
            line_plans.append((product.id, product.title, item_in.quantity, unit_price, line_total))
            product.stock -= item_in.quantity
            self.repo.session.add(product)

        order = Order(
            user_id=user.id,
            subtotal=subtotal,
            grand_total=subtotal,
            payment_method=body.payment_method,
            shipping_address=body.shipping_address,
        )
        order = await self.repo.add(order)

        items: list[OrderItem] = []
        for product_id, title, qty, unit_price, line_total in line_plans:
            item = OrderItem(
                order_id=order.id,
                product_id=product_id,
                title_snapshot=title,
                quantity=qty,
                unit_price=unit_price,
                line_total=line_total,
            )
            self.repo.session.add(item)
            items.append(item)
        await self.repo.session.flush()

        if checkout_cart_id is not None:
            await self.carts.clear(checkout_cart_id)

        await self._send_order_confirmation(user, order, items)

        return self._to_out(order, items, user.full_name, user.email)

    async def _send_order_confirmation(
        self, user: User, order: Order, items: list[OrderItem]
    ) -> None:
        """No SMTP provider configured — persist a Notification (real, queryable)
        and log what would be emailed, same convention as the OTP/reset-password
        flows use for the missing email transport."""
        payload = {
            "order_id": order.id,
            "grand_total": order.grand_total,
            "currency": order.currency,
            "item_count": sum(i.quantity for i in items),
        }
        await self.notifications.create(
            user_id=user.id, kind="order_confirmation", payload=payload
        )
        log.info(
            "order_confirmation_email",
            to=user.email,
            order_id=order.id,
            grand_total=order.grand_total,
        )

    async def list_my_orders(
        self, user: User, *, page: int, page_size: int
    ) -> tuple[list[OrderOut], int]:
        orders, total = await self.repo.list_for_user(user.id, page=page, page_size=page_size)
        items_by_order = await self.repo.get_items_for_many([o.id for o in orders])
        return [
            self._to_out(o, items_by_order.get(o.id, []), user.full_name, user.email)
            for o in orders
        ], total

    async def get_my_order(self, user: User, order_id: str) -> OrderOut:
        order = await self.repo.get(order_id)
        if order is None:
            raise NotFoundError("Order not found.")
        if order.user_id != user.id and user.role != "admin":
            raise ForbiddenError("You do not have access to this order.")
        items = await self.repo.get_items(order_id)
        names = await self.repo.customer_names({order.user_id})
        name, email = names.get(order.user_id, ("", ""))
        return self._to_out(order, items, name, email)

    async def admin_search(
        self, f: OrderFilters, *, page: int, page_size: int
    ) -> tuple[list[OrderOut], int]:
        orders, total = await self.repo.search_admin(f, page=page, page_size=page_size)
        items_by_order = await self.repo.get_items_for_many([o.id for o in orders])
        names = await self.repo.customer_names({o.user_id for o in orders})
        out = []
        for o in orders:
            name, email = names.get(o.user_id, ("", ""))
            out.append(self._to_out(o, items_by_order.get(o.id, []), name, email))
        return out, total

    async def update_status(self, order_id: str, status: OrderStatus) -> OrderOut:
        order = await self.repo.get(order_id)
        if order is None:
            raise NotFoundError("Order not found.")
        order = await self.repo.update_status(order, status)
        items = await self.repo.get_items(order_id)
        names = await self.repo.customer_names({order.user_id})
        name, email = names.get(order.user_id, ("", ""))
        return self._to_out(order, items, name, email)
