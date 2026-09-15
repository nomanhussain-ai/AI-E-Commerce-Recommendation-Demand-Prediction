from pydantic import BaseModel


class MediaUploadOut(BaseModel):
    key: str
    url: str