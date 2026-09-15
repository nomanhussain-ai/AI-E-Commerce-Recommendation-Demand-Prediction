"""SMTP email transport used by authentication notifications."""

import asyncio
import smtplib
from email.message import EmailMessage

import structlog

from app.config import settings

log = structlog.get_logger(__name__)


def _send_message(message: EmailMessage) -> None:
    if settings.smtp_starttls:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=20) as server:
            server.starttls()
            server.login(settings.smtp_user, settings.smtp_password)
            server.send_message(message)
    else:
        with smtplib.SMTP_SSL(settings.smtp_host, settings.smtp_port, timeout=20) as server:
            server.login(settings.smtp_user, settings.smtp_password)
            server.send_message(message)


async def send_email(*, to: str, subject: str, text: str) -> bool:
    if not settings.smtp_configured:
        return False

    message = EmailMessage()
    message["From"] = settings.smtp_from
    message["To"] = to
    message["Subject"] = subject
    message.set_content(text)
    try:
        await asyncio.to_thread(_send_message, message)
    except (OSError, smtplib.SMTPException) as exc:
        log.error("smtp_delivery_failed", recipient=to, error=str(exc))
        return False
    return True