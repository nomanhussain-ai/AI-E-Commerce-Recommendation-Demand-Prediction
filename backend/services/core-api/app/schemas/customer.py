from datetime import datetime

from pydantic import BaseModel


class CustomerOut(BaseModel):
    id: str
    full_name: str
    email: str
    joined_at: datetime
    orders_count: int
    total_spent: int
    # Simple orders/spend threshold — a stand-in for the real M3 RFM
    # segmentation (user_profiles.segment), which needs behaviour event
    # history that isn't collected yet.
    segment: str


class Pagination(BaseModel):
    page: int
    page_size: int
    total: int
    total_pages: int


class CustomerListMeta(BaseModel):
    pagination: Pagination


class CustomerListOut(BaseModel):
    data: list[CustomerOut]
    meta: CustomerListMeta
