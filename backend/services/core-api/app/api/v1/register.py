from fastapi import APIRouter, Depends, Request, status

from app.core.rate_limit import auth_rate_limiter
from app.dependencies import UserServiceDep
from app.schemas.auth import TokenPair, UserOut
from app.schemas.userRegister import RegisterIn
from app.services.media_service import media_url

router = APIRouter(prefix="/auth", tags=["user register"])

# Fixed-window IP limiter on the credential endpoints; degrades open if Redis is down.
_limited = [Depends(auth_rate_limiter())]


@router.post(
    "/register",
    response_model=TokenPair,
    status_code=status.HTTP_201_CREATED,
    summary="Create an account and return a token pair",
    dependencies=_limited,
)
async def register(body: RegisterIn, request: Request, users: UserServiceDep) -> TokenPair:
    user, access, refresh = await users.register(
        email=body.email,
        password=body.password,
        full_name=body.full_name,
        user_agent=request.headers.get("user-agent"),
    )
    result = UserOut.model_validate(user)
    result.avatar_url = media_url(result.avatar_url)
    result.cover_image_url = media_url(result.cover_image_url)
    return TokenPair(user=result, access_token=access, refresh_token=refresh)
