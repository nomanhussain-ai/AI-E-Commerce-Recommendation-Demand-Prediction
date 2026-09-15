from fastapi import APIRouter, Depends, Request, Response, status

from app.core.rate_limit import auth_rate_limiter
from app.dependencies import AuthServiceDep, CurrentUser, TokenServiceDep
from app.exceptions import UnauthenticatedError
from app.schemas.auth import AccessPair, RefreshIn, UserOut
from app.services.media_service import media_url

router = APIRouter(prefix="/auth", tags=["auth"])

# Fixed-window IP limiter on the credential endpoints; degrades open if Redis is down.
_limited = [Depends(auth_rate_limiter())]


@router.get(
    "/me",
    response_model=UserOut,
    summary="Return the authenticated user",
)
async def me(user: CurrentUser) -> UserOut:
    result = UserOut.model_validate(user)
    result.avatar_url = media_url(result.avatar_url)
    result.cover_image_url = media_url(result.cover_image_url)
    return result


@router.post(
    "/refresh",
    response_model=AccessPair,
    summary="Rotate a refresh token for a fresh pair",
    dependencies=_limited,
)
async def refresh(body: RefreshIn, request: Request, tokens: TokenServiceDep) -> AccessPair:
    if not body.refresh_token:
        raise UnauthenticatedError("refresh_token is required.")
    access, new_refresh = await tokens.refresh(
        refresh_token=body.refresh_token,
        user_agent=request.headers.get("user-agent"),
    )
    return AccessPair(access_token=access, refresh_token=new_refresh)


@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Revoke a refresh token",
)
async def logout(body: RefreshIn, auth: AuthServiceDep) -> Response:
    await auth.logout(refresh_token=body.refresh_token)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
