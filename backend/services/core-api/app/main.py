from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.config import settings
from app.core.logging import configure_logging, log
from app.database import engine, init_models
from app.exceptions import register_exception_handlers
from app.middleware import RequestContextMiddleware


@asynccontextmanager
async def lifespan(_: FastAPI):
    configure_logging()
    await init_models()
    log.info("core-api starting", env=settings.app_env)
    yield
    await engine.dispose()
    log.info("core-api stopped")


tags_metadata = [
    {"name": "user register", "description": "Registration"},
    {"name": "login", "description": "login"},
    {"name": "auth", "description": "Session token refresh, logout, and the current-user lookup"},
    {"name": "email verification", "description": "OTP-based email verification"},
    {"name": "password recovery", "description": "Forgot/reset password"},
    {"name": "health", "description": "Liveness / readiness probes."},
]

app = FastAPI(
    title="core-api",
    version="0.1.0",
    description=(
        "Business API for the AI-powered e-commerce platform.\n\n"
        "Use **Authorize** (top right) with a `Bearer <access_token>` from "
        "`/auth/login` or `/auth/register` to call protected endpoints."
    ),
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    openapi_tags=tags_metadata,
)

app.add_middleware(RequestContextMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_exception_handlers(app)
app.include_router(api_router)


@app.get("/", include_in_schema=False)
async def root() -> dict[str, str]:
    return {"service": "core-api", "docs": "/docs", "health": f"{settings.api_v1_prefix}/health"}
