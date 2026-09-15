from pydantic import BaseModel, EmailStr, Field

from app.models.user import UserRole
from app.schemas.auth import UserOut


class ProfileUpdateIn(BaseModel):
    full_name: str = Field(min_length=1, max_length=120)
    phone: str | None = Field(default=None, max_length=40)
    address: str | None = Field(default=None, max_length=500)
    avatar_url: str | None = None
    cover_image_url: str | None = None


class UserCreateIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(min_length=1, max_length=120)
    phone: str | None = Field(default=None, max_length=40)
    address: str | None = Field(default=None, max_length=500)
    avatar_url: str | None = Field(default=None, max_length=1000)
    cover_image_url: str | None = Field(default=None, max_length=1000)
    role: UserRole = UserRole.customer


class UserUpdateIn(BaseModel):
    email: EmailStr | None = None
    full_name: str | None = Field(default=None, min_length=1, max_length=120)
    phone: str | None = Field(default=None, max_length=40)
    address: str | None = Field(default=None, max_length=500)
    avatar_url: str | None = Field(default=None, max_length=1000)
    cover_image_url: str | None = Field(default=None, max_length=1000)
    role: UserRole | None = None
    is_active: bool | None = None
    password: str | None = Field(default=None, min_length=8, max_length=128)


class UserListOut(BaseModel):
    data: list[UserOut]
    total: int
