from sqlalchemy import delete, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.email_log import EmailLog
from app.models.fee_record import FeeRecord
from app.models.password_reset_request import PasswordResetRequest
from app.models.payment import Payment
from app.models.signup_request import SignupRequest
from app.models.student import Student
from app.models.user import User


async def permanently_delete_user(db: AsyncSession, user: User) -> None:
    """Hard-deletes an already-deactivated user and their own records.

    Their own fee/payment/reset-request history goes with them. Records that
    belong to *other* people but merely reference this user (a request they
    reviewed, an email log entry about them) are detached instead of deleted,
    so unrelated data survives intact. Payments this user recorded for
    someone else can't be reassigned or silently dropped, so those block the
    delete entirely — the caller should tell the admin to keep them
    deactivated instead.
    """
    recorded_count = await db.scalar(
        select(func.count()).select_from(Payment).where(Payment.recorded_by_user_id == user.id)
    )
    if recorded_count:
        raise ValueError(
            "This user has recorded payments and cannot be permanently deleted. "
            "Deactivation keeps that history intact."
        )

    student = await db.scalar(select(Student).where(Student.user_id == user.id))
    if student is not None:
        fee_record_ids = select(FeeRecord.id).where(FeeRecord.student_id == student.id)
        await db.execute(delete(Payment).where(Payment.fee_record_id.in_(fee_record_ids)))
        await db.execute(delete(FeeRecord).where(FeeRecord.student_id == student.id))
        await db.execute(
            update(SignupRequest)
            .where(SignupRequest.resulting_student_id == student.id)
            .values(resulting_student_id=None)
        )
        await db.delete(student)

    await db.execute(delete(PasswordResetRequest).where(PasswordResetRequest.user_id == user.id))
    await db.execute(
        update(SignupRequest).where(SignupRequest.reviewed_by_user_id == user.id).values(reviewed_by_user_id=None)
    )
    await db.execute(
        update(PasswordResetRequest)
        .where(PasswordResetRequest.reviewed_by_user_id == user.id)
        .values(reviewed_by_user_id=None)
    )
    await db.execute(update(EmailLog).where(EmailLog.related_user_id == user.id).values(related_user_id=None))

    await db.delete(user)
