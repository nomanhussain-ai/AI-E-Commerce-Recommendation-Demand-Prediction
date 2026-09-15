from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.base import utcnow
from app.models.notification import Notification
from app.repositories.base import BaseRepository


class NotificationRepository(BaseRepository[Notification]):
    model = Notification

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)

    async def create(self, *, user_id: str | None, kind: str, payload: dict) -> Notification:
        notification = Notification(user_id=user_id, kind=kind, payload=payload)
        return await self.add(notification)

    async def list_for_user(self, user_id: str, *, limit: int = 20) -> list[Notification]:
        result = await self.session.execute(
            select(Notification)
            .where(Notification.user_id == user_id)
            .order_by(Notification.created_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())

    async def mark_read(self, notification: Notification) -> Notification:
        notification.read_at = utcnow()
        self.session.add(notification)
        await self.session.flush()
        return notification
