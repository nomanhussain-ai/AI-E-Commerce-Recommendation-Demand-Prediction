from typing import BinaryIO

import cloudinary
import cloudinary.uploader
from cloudinary import CloudinaryImage

from app.config import settings


class MediaNotConfiguredError(RuntimeError):
    pass


def _configure() -> None:
    if not settings.cloudinary_configured:
        raise MediaNotConfiguredError(
            "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, "
            "CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET."
        )
    cloudinary.config(
        cloud_name=settings.cloudinary_cloud_name,
        api_key=settings.cloudinary_api_key,
        api_secret=settings.cloudinary_api_secret,
        secure=True,
    )


def upload_image(file: BinaryIO, *, filename: str | None, folder: str) -> tuple[str, str]:
    _configure()
    result = cloudinary.uploader.upload(
        file,
        folder=f"ecommerce-ai/{folder}",
        resource_type="image",
        use_filename=True,
        unique_filename=True,
        filename_override=filename,
        overwrite=False,
    )
    public_id = str(result["public_id"])
    return public_id, str(result["secure_url"])


def media_url(value: str | None) -> str | None:
    if not value or value.startswith(("http://", "https://", "data:")):
        return value
    if not settings.cloudinary_configured:
        return value
    _configure()
    return CloudinaryImage(value).build_url(secure=True)