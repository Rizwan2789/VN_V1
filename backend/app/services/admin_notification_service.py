from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.services.email_service import EmailService


async def notify_admins(
    db: AsyncSession,
    email_service: EmailService,
    *,
    subject: str,
    body: str,
    template_key: str,
) -> None:
    """Emails every active admin with an email on file — generalizes cleanly
    if more admins are added later instead of hardcoding a single recipient."""
    admins = (
        await db.execute(select(User).where(User.role == "admin", User.is_active.is_(True), User.email.is_not(None)))
    ).scalars().all()

    for admin in admins:
        await email_service.send(
            db,
            to_email=admin.email,
            subject=subject,
            body=body,
            template_key=template_key,
            related_user_id=admin.id,
        )
