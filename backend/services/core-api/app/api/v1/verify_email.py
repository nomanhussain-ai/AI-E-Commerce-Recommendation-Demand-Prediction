from fastapi import APIRouter, Depends

from app.config import settings
from app.core.email import send_email
from app.core.logging import log
from app.core.rate_limit import auth_rate_limiter
from app.dependencies import CurrentUser, EmailVerificationServiceDep
from app.schemas.auth import UserOut, VerifyEmailIn
from app.services.media_service import media_url

router = APIRouter(prefix="/auth", tags=["email verification"])

_limited = [Depends(auth_rate_limiter())]


@router.post(
    "/send-otp",
    summary="Email a 6-digit verification code (dev: logged, and echoed if DEBUG=true)",
    dependencies=_limited,
)
async def send_otp(user: CurrentUser, verification: EmailVerificationServiceDep) -> dict[str, str]:
    if user.is_email_verified:
        return {"message": "Email already verified."}

    code = await verification.send_otp(user)
    sent = await send_email(
        to=user.email,
        subject="ShopIQ email verification code",
        text=(
            f"Your ShopIQ verification code is {code}. "
            f"It expires in {settings.otp_ttl_minutes} minutes."
        ),
    )
    log.info("email_otp_issued", email=user.email, code=code)

    result = {"message": "Verification code sent. It expires in 10 minutes."}
    if settings.debug and not sent:
        result["debug_otp"] = code
    return result


@router.post("/verify-email", response_model=UserOut, summary="Confirm the emailed OTP code")
async def verify_email(
    body: VerifyEmailIn, user: CurrentUser, verification: EmailVerificationServiceDep
) -> UserOut:
    verified = await verification.verify(user, body.code)
    result = UserOut.model_validate(verified)
    result.avatar_url = media_url(result.avatar_url)
    result.cover_image_url = media_url(result.cover_image_url)
    return result
