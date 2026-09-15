from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.cart import router as cart_router
from app.api.v1.categories import admin_router as admin_categories_router
from app.api.v1.categories import router as categories_router
from app.api.v1.change_password import router as change_password_router
from app.api.v1.customers import router as customers_router
from app.api.v1.health import router as health_router
from app.api.v1.login import router as login_router
from app.api.v1.media import router as media_router
from app.api.v1.orders import admin_router as admin_orders_router
from app.api.v1.orders import router as orders_router
from app.api.v1.products import admin_router as admin_products_router
from app.api.v1.products import router as products_router
from app.api.v1.register import router as register_router
from app.api.v1.users import admin_router as admin_users_router
from app.api.v1.users import router as users_router
from app.api.v1.verify_email import router as verify_email_router

router = APIRouter()
router.include_router(register_router)
router.include_router(login_router)
router.include_router(media_router)
router.include_router(auth_router)
router.include_router(change_password_router)
router.include_router(verify_email_router)
router.include_router(health_router)
router.include_router(users_router)
router.include_router(admin_users_router)
router.include_router(categories_router)
router.include_router(admin_categories_router)
router.include_router(products_router)
router.include_router(admin_products_router)
router.include_router(orders_router)
router.include_router(admin_orders_router)
router.include_router(customers_router)
router.include_router(cart_router)

# Later phases register their routers here:
#   search, wishlist, events, analytics, chat, calendar
