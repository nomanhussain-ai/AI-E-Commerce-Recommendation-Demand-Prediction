"""Shared FastAPI dependencies — injected into route handlers across the API."""

from typing import Annotated

import jwt
from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import decode_token
from app.database import get_session
from app.exceptions import ForbiddenError, UnauthenticatedError
from app.models.user import User
from app.repositories.cart_repo import CartRepository
from app.repositories.category_repo import CategoryRepository
from app.repositories.customer_repo import CustomerRepository
from app.repositories.notification_repo import NotificationRepository
from app.repositories.order_repo import OrderRepository
from app.repositories.product_repo import ProductRepository
from app.repositories.user_repo import UserRepository
from app.services.auth_service import AuthService
from app.services.cart_service import CartService
from app.services.category_service import CategoryService
from app.services.change_password_servise import ResetPasswordService
from app.services.email_verification_service import EmailVerificationService
from app.services.order_service import OrderService
from app.services.product_service import ProductService
from app.services.token_servise import TokenService
from app.services.user_servise import UserService

SessionDep = Annotated[AsyncSession, Depends(get_session)]


def get_user_repository(session: SessionDep) -> UserRepository:
    return UserRepository(session)


UserRepositoryDep = Annotated[UserRepository, Depends(get_user_repository)]


def get_category_repository(session: SessionDep) -> CategoryRepository:
    return CategoryRepository(session)


CategoryRepositoryDep = Annotated[CategoryRepository, Depends(get_category_repository)]


def get_product_repository(session: SessionDep) -> ProductRepository:
    return ProductRepository(session)


ProductRepositoryDep = Annotated[ProductRepository, Depends(get_product_repository)]


def get_category_service(repo: CategoryRepositoryDep) -> CategoryService:
    return CategoryService(repo)


CategoryServiceDep = Annotated[CategoryService, Depends(get_category_service)]


def get_product_service(
    repo: ProductRepositoryDep, categories: CategoryRepositoryDep
) -> ProductService:
    return ProductService(repo, categories)


ProductServiceDep = Annotated[ProductService, Depends(get_product_service)]


def get_order_repository(session: SessionDep) -> OrderRepository:
    return OrderRepository(session)


OrderRepositoryDep = Annotated[OrderRepository, Depends(get_order_repository)]


def get_notification_repository(session: SessionDep) -> NotificationRepository:
    return NotificationRepository(session)


NotificationRepositoryDep = Annotated[
    NotificationRepository, Depends(get_notification_repository)
]


def get_customer_repository(session: SessionDep) -> CustomerRepository:
    return CustomerRepository(session)


CustomerRepositoryDep = Annotated[CustomerRepository, Depends(get_customer_repository)]


def get_cart_repository(session: SessionDep) -> CartRepository:
    return CartRepository(session)


CartRepositoryDep = Annotated[CartRepository, Depends(get_cart_repository)]


def get_cart_service(repo: CartRepositoryDep, products: ProductRepositoryDep) -> CartService:
    return CartService(repo, products)


CartServiceDep = Annotated[CartService, Depends(get_cart_service)]


def get_order_service(
    repo: OrderRepositoryDep,
    products: ProductRepositoryDep,
    notifications: NotificationRepositoryDep,
    carts: CartRepositoryDep,
) -> OrderService:
    return OrderService(repo, products, notifications, carts)


OrderServiceDep = Annotated[OrderService, Depends(get_order_service)]


# ── service providers ────────────────────────────────────────────────────────
def get_token_service(repo: UserRepositoryDep) -> TokenService:
    return TokenService(repo)


TokenServiceDep = Annotated[TokenService, Depends(get_token_service)]


def get_auth_service(repo: UserRepositoryDep, tokens: TokenServiceDep) -> AuthService:
    return AuthService(repo, tokens)


AuthServiceDep = Annotated[AuthService, Depends(get_auth_service)]


def get_user_service(repo: UserRepositoryDep, tokens: TokenServiceDep) -> UserService:
    return UserService(repo, tokens)


UserServiceDep = Annotated[UserService, Depends(get_user_service)]


def get_reset_password_service(repo: UserRepositoryDep) -> ResetPasswordService:
    return ResetPasswordService(repo)


ResetPasswordServiceDep = Annotated[ResetPasswordService, Depends(get_reset_password_service)]


def get_email_verification_service(repo: UserRepositoryDep) -> EmailVerificationService:
    return EmailVerificationService(repo)


EmailVerificationServiceDep = Annotated[
    EmailVerificationService, Depends(get_email_verification_service)
]


# ── current user ─────────────────────────────────────────────────────────────
# `auto_error=False` so a missing/blank header yields our standard error envelope
# instead of FastAPI's bare 403.
_bearer = HTTPBearer(auto_error=False, description="Paste the access_token from /auth/login")


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)],
    repo: UserRepositoryDep,
) -> User:
    if credentials is None:
        raise UnauthenticatedError("Authentication required.")
    try:
        payload = decode_token(credentials.credentials, expected_type="access")
    except jwt.PyJWTError as exc:
        raise UnauthenticatedError("Invalid or expired access token.") from exc

    user = await repo.get_by_id(str(payload.get("sub", "")))
    if user is None or not user.is_active:
        raise UnauthenticatedError("Account no longer active.")
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


async def require_admin(user: CurrentUser) -> User:
    if user.role != "admin":
        raise ForbiddenError("Admin access required.")
    return user


AdminUser = Annotated[User, Depends(require_admin)]
