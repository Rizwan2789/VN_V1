import asyncio
import logging
import smtplib
from abc import ABC, abstractmethod
from email.message import EmailMessage

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


class SmtpEmailService(EmailService):
    """Sends for real over SMTP (e.g. Gmail), and still logs an EmailLog row
    in the same transaction as the caller — same audit trail as the "log"
    backend, just with an actual send attempted alongside it.

    smtplib is blocking, so the network call runs in a thread via
    asyncio.to_thread to avoid stalling the event loop.
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
        settings = get_settings()
        status = "SENT"
        try:
            await asyncio.to_thread(self._send_sync, to_email, subject, body)
        except Exception:
            status = "FAILED"
            logger.exception("SMTP send failed: to=%s subject=%r", to_email, subject)

        db.add(
            EmailLog(
                to_email=to_email,
                subject=subject,
                body=body,
                template_key=template_key,
                related_user_id=related_user_id,
                status=status,
            )
        )

    def _send_sync(self, to_email: str, subject: str, body: str) -> None:
        settings = get_settings()
        message = EmailMessage()
        message["From"] = settings.email_from_address
        message["To"] = to_email
        message["Subject"] = subject
        message.set_content(body)

        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=10) as smtp:
            if settings.smtp_use_tls:
                smtp.starttls()
            if settings.smtp_username:
                smtp.login(settings.smtp_username, settings.smtp_password)
            smtp.send_message(message)


def get_email_service() -> EmailService:
    """The one seam an EmailService backend gets wired in behind — swapping
    it is a new class + a new branch here, no call-site changes needed.
    """
    settings = get_settings()
    if settings.email_backend == "log":
        return LoggingEmailService()
    if settings.email_backend == "smtp":
        return SmtpEmailService()
    raise NotImplementedError(f"Unknown email backend: {settings.email_backend!r}")
