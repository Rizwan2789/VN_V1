import secrets

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.models.fee_record import FeeRecord
from app.models.student import Student
from app.models.user import User
from app.schemas.student import StudentCreate


def generate_temporary_password() -> str:
    return secrets.token_urlsafe(6)


async def create_student_with_user(db: AsyncSession, payload: StudentCreate) -> tuple[Student, str]:
    temporary_password = generate_temporary_password()

    user = User(
        login_id=payload.roll_no,
        email=payload.email,
        hashed_password=hash_password(temporary_password),
        role="student",
        full_name=payload.full_name,
    )
    db.add(user)
    await db.flush()

    student = Student(
        user_id=user.id,
        roll_no=payload.roll_no,
        batch_id=payload.batch_id,
        phone=payload.phone,
        guardian_name=payload.guardian_name,
        guardian_phone=payload.guardian_phone,
        address=payload.address,
        monthly_fee_amount=payload.monthly_fee_amount,
        **({"admission_date": payload.admission_date} if payload.admission_date else {}),
    )
    db.add(student)
    await db.flush()

    return student, temporary_password


async def get_current_status_map(
    db: AsyncSession, student_ids: list[int], period_month: int, period_year: int
) -> dict[int, str]:
    if not student_ids:
        return {}

    result = await db.execute(
        select(FeeRecord.student_id, FeeRecord.status).where(
            FeeRecord.student_id.in_(student_ids),
            FeeRecord.period_month == period_month,
            FeeRecord.period_year == period_year,
        )
    )
    return dict(result.all())
