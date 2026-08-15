from datetime import date, datetime, timezone
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.signup_request import SignupRequest
from app.models.student import Student
from app.models.user import User
from app.schemas.signup_request import SignupRequestCreate
from app.schemas.student import StudentCreate
from app.services.admin_notification_service import notify_admins
from app.services.email_service import EmailService
from app.services.email_templates import (
    credentials_email,
    new_signup_request_notification,
    signup_rejected_email,
)
from app.services.student_service import create_student_with_user


async def create_signup_request(
    db: AsyncSession, payload: SignupRequestCreate, *, email_service: EmailService
) -> SignupRequest:
    request = SignupRequest(
        full_name=payload.full_name,
        email=payload.email,
        phone=payload.phone,
        guardian_name=payload.guardian_name,
        guardian_phone=payload.guardian_phone,
        address=payload.address,
        requested_batch_id=payload.requested_batch_id,
    )
    db.add(request)
    await db.flush()

    subject, body = new_signup_request_notification(request.full_name, request.email)
    await notify_admins(db, email_service, subject=subject, body=body, template_key="new_signup_request")

    return request


async def approve_signup_request(
    db: AsyncSession,
    request: SignupRequest,
    *,
    batch_id: int,
    monthly_fee_amount: Decimal,
    admission_date: date | None,
    reviewer: User,
) -> tuple[Student, str]:
    student_payload = StudentCreate(
        full_name=request.full_name,
        batch_id=batch_id,
        email=request.email,
        phone=request.phone,
        guardian_name=request.guardian_name,
        guardian_phone=request.guardian_phone,
        address=request.address,
        monthly_fee_amount=monthly_fee_amount,
        admission_date=admission_date,
    )
    student, temporary_password = await create_student_with_user(db, student_payload)

    request.status = "APPROVED"
    request.reviewed_by_user_id = reviewer.id
    request.reviewed_at = datetime.now(timezone.utc)
    request.resulting_student_id = student.id
    request.monthly_fee_amount = monthly_fee_amount
    request.requested_batch_id = batch_id

    return student, temporary_password


async def send_signup_credentials_email(
    db: AsyncSession,
    request: SignupRequest,
    *,
    student: Student,
    temporary_password: str,
    email_service: EmailService,
) -> None:
    """Fired only when the admin/coordinator explicitly clicks "Send Email"
    after reviewing the generated credentials — approval itself no longer
    emails automatically."""
    subject, body = credentials_email(request.full_name, student.roll_no, temporary_password)
    await email_service.send(
        db,
        to_email=request.email,
        subject=subject,
        body=body,
        template_key="signup_approved_credentials",
        related_user_id=student.user_id,
    )


async def reject_signup_request(
    db: AsyncSession,
    request: SignupRequest,
    *,
    reviewer: User,
    reason: str | None,
    email_service: EmailService,
) -> SignupRequest:
    request.status = "REJECTED"
    request.reviewed_by_user_id = reviewer.id
    request.reviewed_at = datetime.now(timezone.utc)
    request.rejection_reason = reason

    subject, body = signup_rejected_email(request.full_name, reason)
    await email_service.send(
        db,
        to_email=request.email,
        subject=subject,
        body=body,
        template_key="signup_rejected",
    )

    return request
