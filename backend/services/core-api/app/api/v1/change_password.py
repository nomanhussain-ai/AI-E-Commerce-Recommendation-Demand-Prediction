from fastapi import APIRouter, Depends, Response, status

from app.config import settings
from app.core.email import send_email
from app.core.rate_limit import auth_rate_limiter
from app.dependencies import ResetPasswordServiceDep
from app.schemas.recoveryPassword import ForgotPasswordIn, ResetPasswordIn

router = APIRouter(prefix="/auth", tags=["password recovery"])

# Fixed-window IP limiter on the credential endpoints; degrades open if Redis is down.
_limited = [Depends(auth_rate_limiter())]


@router.post(
    "/forgot-password",
    summary="Start a password reset (always 200 to avoid account enumeration)",
    dependencies=_limited,
)
async def forgot_password(
    body: ForgotPasswordIn, passwords: ResetPasswordServiceDep
) -> dict[str, str]:
    token = await passwords.forgot_password(email=body.email)
    result = {"message": "If that email exists, a reset link has been sent."}
    sent = False
    if token is not None:
        sent = await send_email(
            to=body.email,
            subject="ShopIQ password reset OTP",
            text=f"Your ShopIQ password reset OTP is {token}. It expires in 1 hour.",
        )
    if settings.debug and token is not None:
        # Dev convenience only — real deployments email this.
        result["debug_reset_token"] = token
        result["debug_reset_otp"] = token
    return result


@router.post(
    "/reset-password",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Complete a password reset and revoke existing sessions",
    dependencies=_limited,
)
async def reset_password(
    body: ResetPasswordIn, passwords: ResetPasswordServiceDep
) -> Response:
    await passwords.reset_password(token=body.token, password=body.password)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
