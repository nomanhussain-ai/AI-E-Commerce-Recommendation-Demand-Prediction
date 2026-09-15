from pydantic import BaseModel, EmailStr, Field

from app.models.user import UserRole


class UserOut(BaseModel):
    id: str
    email: EmailStr
    full_name: str
    phone: str | None = None
    address: str | None = None
    avatar_url: str | None = None
    cover_image_url: str | None = None
    role: UserRole
    is_email_verified: bool = False

    model_config = {"from_attributes": True}

class RefreshIn(BaseModel):
    refresh_token: str | None = None

class TokenPair(BaseModel):
    user: UserOut
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class AccessPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class VerifyEmailIn(BaseModel):
    code: str = Field(min_length=6, max_length=6, pattern=r"^\d{6}$")
