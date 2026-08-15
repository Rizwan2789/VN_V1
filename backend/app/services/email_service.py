import logging
from abc import ABC, abstractmethod

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.models.email_log import EmailLog

logger = logging.getLogger(__name__)


class EmailService(ABC):
    @abstractmethod
    async def send(
        self,
        db: AsyncSession,
        *,
        to_email: str,
        subject: str,
        body: str,
        template_key: str | None = None,
        related_user_id: int | None = None,
    ) -> None: ...


class LoggingEmailService(EmailService):
    """Records the email instead of really sending it — the only EmailService
    implementation today, since no SMTP/provider credentials exist yet.

    Writes into the same DB session/transaction as the caller, so e.g. a
    signup approval and its email log entry commit or roll back together
    instead of the "email" appearing sent even if the surrounding write fails.
    """

    async def send(
        self,
        db: AsyncSession,
        *,
        to_email: str,
        subject: str,
        body: str,
        template_key: str | None = None,
        related_user_id: int | None = None,
    ) -> None:
        db.add(
            EmailLog(
                to_email=to_email,
                subject=subject,
                body=body,
                template_key=template_key,
                related_user_id=related_user_id,
                status="SENT",
            )
        )
        logger.info("email (logged, not sent): to=%s subject=%r", to_email, subject)


def get_email_service() -> EmailService:
    """The one seam a real SmtpEmailService gets wired in behind — swapping the
    backend is a new class + a new branch here, no call-site changes needed.
    """
    settings = get_settings()
    if settings.email_backend == "log":
        return LoggingEmailService()
    raise NotImplementedError(f"Unknown email backend: {settings.email_backend!r}")
