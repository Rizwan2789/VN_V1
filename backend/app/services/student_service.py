import secrets
from datetime import date

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.models.fee_record import FeeRecord
from app.models.student import Student
from app.models.user import User
from app.schemas.student import StudentCreate

ROLL_NO_PREFIX = "VN"


def generate_temporary_password() -> str:
    return secrets.token_urlsafe(6)


async def generate_next_roll_no(db: AsyncSession, year: int) -> str:
    """Next VN-<year>-<seq> roll number, sequence resetting each year.

    Scans matching roll numbers rather than sorting by string so a 4+ digit
    sequence (>999 admissions in a year) can't sort before a 3-digit one.
    """
    prefix = f"{ROLL_NO_PREFIX}-{year}-"
    result = await db.execute(select(Student.roll_no).where(Student.roll_no.like(f"{prefix}%")))

    max_seq = 0
    for (roll_no,) in result.all():
        suffix = roll_no[len(prefix) :]
        if suffix.isdigit():
            max_seq = max(max_seq, int(suffix))

    return f"{prefix}{max_seq + 1:03d}"


async def create_student_with_user(db: AsyncSession, payload: StudentCreate) -> tuple[Student, str]:
    temporary_password = generate_temporary_password()
    roll_no_year = payload.admission_date.year if payload.admission_date else date.today().year
    roll_no = await generate_next_roll_no(db, roll_no_year)

    user = User(
        login_id=roll_no,
        email=payload.email,
        hashed_password=hash_password(temporary_password),
        role="student",
        full_name=payload.full_name,
    )
    db.add(user)
    await db.flush()

    student = Student(
        user_id=user.id,
        roll_no=roll_no,
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
