import io
from typing import Annotated, Literal

from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status

from app.dependencies import CurrentUser
from app.schemas.media import MediaUploadOut
from app.services.media_service import MediaNotConfiguredError, upload_image

router = APIRouter(prefix="/media", tags=["media"])
MAX_IMAGE_SIZE = 10 * 1024 * 1024


@router.post("/upload", response_model=MediaUploadOut, status_code=status.HTTP_201_CREATED)
async def upload_media(
    user: CurrentUser,
    file: Annotated[UploadFile, File(description="Image file, up to 10 MB")],
    folder: Annotated[Literal["products", "profiles"], Form()] = "profiles",
) -> MediaUploadOut:
    if folder == "products" and user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required.")
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
        key, url = upload_image(
            file=io.BytesIO(contents),
            filename=file.filename,
            folder=folder,
        )
    except MediaNotConfiguredError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)
        ) from exc
    return MediaUploadOut(key=key, url=url)