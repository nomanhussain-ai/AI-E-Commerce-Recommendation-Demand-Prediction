"""SQLModel table classes. Import every model here so Alembic autogenerate sees them."""

from app.models.addresses import (
    Address,
)
from app.models.cart import Cart, CartItem
from app.models.category import Category
from app.models.email_otp import EmailOtp
from app.models.notification import Notification
from app.models.order import Order, OrderItem, OrderStatus
from app.models.password_reset_tokens import PasswordResetToken
from app.models.product import Product
from app.models.user import (
    RefreshToken,
    User,
    UserRole,
)

__all__ = [
    "Address",
    "Cart",
    "CartItem",
    "Category",
    "EmailOtp",
    "Notification",
    "Order",
    "OrderItem",
    "OrderStatus",
    "PasswordResetToken",
    "Product",
    "RefreshToken",
    "User",
    "UserRole",
]
