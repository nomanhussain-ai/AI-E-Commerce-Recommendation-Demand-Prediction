from fastapi import APIRouter, Depends, Request

from app.core.rate_limit import auth_rate_limiter
from app.dependencies import AuthServiceDep
from app.schemas.auth import TokenPair, UserOut
from app.schemas.login import LoginIn
from app.services.media_service import media_url

router = APIRouter(prefix="/auth", tags=["login"])

# Fixed-window IP limiter on the credential endpoints; degrades open if Redis is down.
_limited = [Depends(auth_rate_limiter())]


@router.post(
    "/login",
    response_model=TokenPair,
    summary="Exchange email + password for a token pair",
    dependencies=_limited,
)
async def login(body: LoginIn, request: Request, auth: AuthServiceDep) -> TokenPair:
    user, access, refresh = await auth.login(
        email=body.email,
        password=body.password,
        user_agent=request.headers.get("user-agent"),
    )
    result = UserOut.model_validate(user)
    result.avatar_url = media_url(result.avatar_url)
    result.cover_image_url = media_url(result.cover_image_url)
    return TokenPair(user=result, access_token=access, refresh_token=refresh)
