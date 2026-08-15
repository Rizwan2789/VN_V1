from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.models.password_reset_request import PasswordResetRequest
from app.models.user import User
from app.services.admin_notification_service import notify_admins
from app.services.email_service import EmailService
from app.services.email_templates import (
    new_password_reset_request_notification,
    password_reset_approved_email,
    password_reset_rejected_email,
)
from app.services.student_service import generate_temporary_password


async def create_reset_request(db: AsyncSession, *, role: str, login_id: str, email_service: EmailService) -> None:
    """Always completes without signaling whether a matching account exists —
    continues the same anti-enumeration pattern as auth.py's login handler.
    """
    user = await db.scalar(
        select(User).where(User.login_id == login_id, User.role == role, User.is_active.is_(True))
    )
    if user is None:
        return

    existing = await db.scalar(
        select(PasswordResetRequest).where(
            PasswordResetRequest.user_id == user.id, PasswordResetRequest.status == "PENDING"
        )
    )
    if existing is not None:
        return

    db.add(PasswordResetRequest(user_id=user.id, requested_role=role))

    subject, body = new_password_reset_request_notification(user.full_name, user.login_id, role)
    await notify_admins(db, email_service, subject=subject, body=body, template_key="new_password_reset_request")


async def approve_reset_request(
    db: AsyncSession,
    request: PasswordResetRequest,
    *,
    reviewer: User,
) -> str:
    user = await db.get(User, request.user_id)
    temporary_password = generate_temporary_password()
    user.hashed_password = hash_password(temporary_password)

    request.status = "APPROVED"
    request.reviewed_by_user_id = reviewer.id
    request.reviewed_at = datetime.now(timezone.utc)

    return temporary_password


async def send_reset_credentials_email(
    db: AsyncSession,
    request: PasswordResetRequest,
    *,
    temporary_password: str,
    email_service: EmailService,
) -> None:
    """Fired only when the admin explicitly clicks "Send Email" after
    reviewing the generated password — approval itself no longer emails
    automatically. Caller must have already checked user.email is set."""
    user = await db.get(User, request.user_id)
    subject, body = password_reset_approved_email(user.full_name, user.login_id, temporary_password)
    await email_service.send(
        db,
        to_email=user.email,
        subject=subject,
        body=body,
        template_key="password_reset_approved",
        related_user_id=user.id,
    )


async def reject_reset_request(
    db: AsyncSession,
    request: PasswordResetRequest,
    *,
    reviewer: User,
    reason: str | None,
    email_service: EmailService,
) -> PasswordResetRequest:
    user = await db.get(User, request.user_id)

    request.status = "REJECTED"
    request.reviewed_by_user_id = reviewer.id
    request.reviewed_at = datetime.now(timezone.utc)
    request.notes = reason

    if user is not None and user.email:
        subject, body = password_reset_rejected_email(user.full_name, reason)
        await email_service.send(
            db,
            to_email=user.email,
            subject=subject,
            body=body,
            template_key="password_reset_rejected",
            related_user_id=user.id,
        )

    return request
