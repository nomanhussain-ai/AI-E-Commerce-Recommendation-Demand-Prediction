import io
from typing import Annotated

from fastapi import APIRouter, File, Form, HTTPException, Query, UploadFile, status
from pydantic import EmailStr

from app.dependencies import AdminUser, CurrentUser, UserRepositoryDep, UserServiceDep
from app.exceptions import NotFoundError
from app.models.user import UserRole
from app.schemas.auth import UserOut
from app.schemas.profile import ProfileUpdateIn, UserCreateIn, UserListOut, UserUpdateIn
from app.services.media_service import MediaNotConfiguredError, media_url, upload_image

router = APIRouter(prefix="/users", tags=["users"])
admin_router = APIRouter(prefix="/admin/users", tags=["admin", "users"])

MAX_IMAGE_SIZE = 10 * 1024 * 1024


def _out(user) -> UserOut:
    result = UserOut.model_validate(user)
    result.avatar_url = media_url(result.avatar_url)
    result.cover_image_url = media_url(result.cover_image_url)
    return result


async def _upload_avatar(file: UploadFile | None) -> str | None:
    """Validate and store a profile/cover image upload, returning its storage key."""
    if file is None:
        return None
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Only image files are supported.",
        )
    contents = await file.read(MAX_IMAGE_SIZE + 1)
    if len(contents) > MAX_IMAGE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Image must be 10 MB or smaller.",
        )
    try:
        key, _ = upload_image(file=io.BytesIO(contents), filename=file.filename, folder="profiles")
    except MediaNotConfiguredError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)
        ) from exc
    return key


@router.get("/me", response_model=UserOut)
async def get_me(user: CurrentUser) -> UserOut:
    return _out(user)

# /////////////////
@router.patch("/me", response_model=UserOut, summary="Update the authenticated users profile")
async def update_me(
    body: ProfileUpdateIn, user: CurrentUser, users: UserServiceDep
) -> UserOut:
    updated = await users.update_profile(
        user,
        full_name=body.full_name,
        phone=body.phone,
        address=body.address,
        avatar_url=body.avatar_url,
        cover_image_url=body.cover_image_url,
    )
    return _out(updated)


@router.delete("/me", response_model=UserOut)
async def deactivate_me(user: CurrentUser, users: UserServiceDep) -> UserOut:
    return _out(await users.deactivate(user))


@admin_router.get("", response_model=UserListOut)
async def list_users(
    repo: UserRepositoryDep,
    _admin: AdminUser,
    q: str | None = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> UserListOut:
    users, total = await repo.list_users(offset=(page - 1) * page_size, limit=page_size, q=q)
    return UserListOut(data=[_out(user) for user in users], total=total)


@admin_router.post("", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def create_user(
    users: UserServiceDep,
    _admin: AdminUser,
    email: Annotated[EmailStr, Form()],
    password: Annotated[str, Form(min_length=8, max_length=128)],
    full_name: Annotated[str, Form(min_length=1, max_length=120)],
    phone: Annotated[str | None, Form(max_length=40)] = None,
    address: Annotated[str | None, Form(max_length=500)] = None,
    role: Annotated[UserRole, Form()] = UserRole.customer,
    avatar: Annotated[UploadFile | None, File(description="Profile image, up to 10 MB")] = None,
    cover_image: Annotated[UploadFile | None, File(description="Cover image, up to 10 MB")] = None,
) -> UserOut:
    body = UserCreateIn(
        email=email,
        password=password,
        full_name=full_name,
        phone=phone,
        address=address,
        avatar_url=await _upload_avatar(avatar),
        cover_image_url=await _upload_avatar(cover_image),
        role=role,
    )
    return _out(await users.create_user(body))


@admin_router.get("/{user_id}", response_model=UserOut)
async def get_user(user_id: str, repo: UserRepositoryDep, _admin: AdminUser) -> UserOut:
    user = await repo.get_by_id(user_id)
    if user is None:
        raise NotFoundError("User not found.")
    return _out(user)


@admin_router.patch("/{user_id}", response_model=UserOut)
async def update_user(
    user_id: str,
    repo: UserRepositoryDep,
    users: UserServiceDep,
    _admin: AdminUser,
    email: Annotated[EmailStr | None, Form()] = None,
    full_name: Annotated[str | None, Form(min_length=1, max_length=120)] = None,
    phone: Annotated[str | None, Form(max_length=40)] = None,
    address: Annotated[str | None, Form(max_length=500)] = None,
    role: Annotated[UserRole | None, Form()] = None,
    is_active: Annotated[bool | None, Form()] = None,
    password: Annotated[str | None, Form(min_length=8, max_length=128)] = None,
    avatar: Annotated[UploadFile | None, File(description="Profile image, up to 10 MB")] = None,
    remove_avatar: Annotated[bool, Form()] = False,
    cover_image: Annotated[UploadFile | None, File(description="Cover image, up to 10 MB")] = None,
    remove_cover_image: Annotated[bool, Form()] = False,
) -> UserOut:
    user = await repo.get_by_id(user_id)
    if user is None:
        raise NotFoundError("User not found.")

    fields: dict[str, object] = {}
    if email is not None:
        fields["email"] = email
    if full_name is not None:
        fields["full_name"] = full_name
    if phone is not None:
        fields["phone"] = phone
    if address is not None:
        fields["address"] = address
    if role is not None:
        fields["role"] = role
    if is_active is not None:
        fields["is_active"] = is_active
    if password is not None:
        fields["password"] = password
    if avatar is not None:
        fields["avatar_url"] = await _upload_avatar(avatar)
    elif remove_avatar:
        fields["avatar_url"] = None
    if cover_image is not None:
        fields["cover_image_url"] = await _upload_avatar(cover_image)
    elif remove_cover_image:
        fields["cover_image_url"] = None

    body = UserUpdateIn(**fields)
    return _out(await users.update_user(user, body))


@admin_router.delete("/{user_id}", response_model=UserOut)
async def delete_user(
    user_id: str, repo: UserRepositoryDep, users: UserServiceDep, _admin: AdminUser
) -> UserOut:
    user = await repo.get_by_id(user_id)
    if user is None:
        raise NotFoundError("User not found.")
    return _out(await users.deactivate(user))
