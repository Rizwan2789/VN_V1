from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.dependencies import get_current_user, get_db, require_role
from app.models.fee_record import FeeRecord
from app.models.student import Student
from app.models.user import User
from app.schemas.fee_record import FeeRecordWithPaymentsResponse
from app.schemas.student import (
    StudentCreate,
    StudentCreatedResponse,
    StudentListItem,
    StudentListResponse,
    StudentResponse,
    StudentUpdate,
)
from app.services.student_service import create_student_with_user, get_current_status_map

router = APIRouter(prefix="/api/students", tags=["students"])


@router.get("", response_model=StudentListResponse)
async def list_students(
    batch_id: int | None = None,
    status_filter: str | None = Query(None, alias="status"),
    search: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _=Depends(require_role("coordinator")),
) -> StudentListResponse:
    today = date.today()

    query = select(Student).join(Student.user).where(Student.is_active.is_(True))
    if batch_id is not None:
        query = query.where(Student.batch_id == batch_id)
    if search:
        like = f"%{search}%"
        query = query.where(or_(User.full_name.ilike(like), Student.roll_no.ilike(like)))

    count_query = select(func.count()).select_from(query.with_only_columns(Student.id).subquery())
    total = (await db.execute(count_query)).scalar_one()

    query = query.order_by(User.full_name).offset((page - 1) * page_size).limit(page_size)
    students = list((await db.execute(query)).scalars().all())

    status_map = await get_current_status_map(db, [s.id for s in students], today.month, today.year)

    items = [
        StudentListItem(
            id=s.id,
            roll_no=s.roll_no,
            full_name=s.user.full_name,
            batch=s.batch,
            monthly_fee_amount=s.monthly_fee_amount,
            current_status=status_map.get(s.id),
            is_active=s.is_active,
        )
        for s in students
    ]

    if status_filter:
        items = [i for i in items if i.current_status == status_filter]

    return StudentListResponse(items=items, total=total)


@router.post("", response_model=StudentCreatedResponse, status_code=status.HTTP_201_CREATED)
async def create_student(
    payload: StudentCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_role("coordinator")),
) -> StudentCreatedResponse:
    try:
        student, temporary_password = await create_student_with_user(db, payload)
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, "A student with that roll number already exists")

    await db.refresh(student, attribute_names=["batch", "user"])
    return StudentCreatedResponse(
        student=StudentResponse(
            id=student.id,
            user_id=student.user_id,
            roll_no=student.roll_no,
            full_name=student.user.full_name,
            email=student.user.email,
            batch=student.batch,
            phone=student.phone,
            guardian_name=student.guardian_name,
            guardian_phone=student.guardian_phone,
            address=student.address,
            monthly_fee_amount=student.monthly_fee_amount,
            admission_date=student.admission_date,
            is_active=student.is_active,
        ),
        temporary_password=temporary_password,
    )


async def _get_student_or_404(db: AsyncSession, student_id: int) -> Student:
    student = await db.get(Student, student_id)
    if student is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Student not found")
    return student


def _to_student_response(student: Student) -> StudentResponse:
    return StudentResponse(
        id=student.id,
        user_id=student.user_id,
        roll_no=student.roll_no,
        full_name=student.user.full_name,
        email=student.user.email,
        batch=student.batch,
        phone=student.phone,
        guardian_name=student.guardian_name,
        guardian_phone=student.guardian_phone,
        address=student.address,
        monthly_fee_amount=student.monthly_fee_amount,
        admission_date=student.admission_date,
        is_active=student.is_active,
    )


@router.get("/me", response_model=StudentResponse)
async def get_my_profile(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _=Depends(require_role("student")),
) -> StudentResponse:
    result = await db.execute(select(Student).where(Student.user_id == current_user.id))
    student = result.scalar_one_or_none()
    if student is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Student profile not found")
    return _to_student_response(student)


@router.get("/me/fees", response_model=list[FeeRecordWithPaymentsResponse])
async def get_my_fees(
    year: int = Query(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _=Depends(require_role("student")),
) -> list[FeeRecord]:
    student_id = await db.scalar(select(Student.id).where(Student.user_id == current_user.id))
    if student_id is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Student profile not found")

    result = await db.execute(
        select(FeeRecord)
        .options(selectinload(FeeRecord.payments))
        .where(FeeRecord.student_id == student_id, FeeRecord.period_year == year)
        .order_by(FeeRecord.period_month)
    )
    return list(result.scalars().all())


@router.get("/{student_id}", response_model=StudentResponse)
async def get_student(
    student_id: int,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_role("coordinator")),
) -> StudentResponse:
    student = await _get_student_or_404(db, student_id)
    return _to_student_response(student)


@router.put("/{student_id}", response_model=StudentResponse)
async def update_student(
    student_id: int,
    payload: StudentUpdate,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_role("coordinator")),
) -> StudentResponse:
    student = await _get_student_or_404(db, student_id)

    student.batch_id = payload.batch_id
    student.phone = payload.phone
    student.guardian_name = payload.guardian_name
    student.guardian_phone = payload.guardian_phone
    student.address = payload.address
    student.monthly_fee_amount = payload.monthly_fee_amount
    student.user.full_name = payload.full_name
    student.user.email = payload.email

    await db.commit()
    await db.refresh(student, attribute_names=["batch", "user"])
    return _to_student_response(student)


@router.delete("/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
async def deactivate_student(
    student_id: int,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_role("coordinator")),
) -> None:
    student = await _get_student_or_404(db, student_id)
    student.is_active = False
    student.user.is_active = False
    await db.commit()


@router.get("/{student_id}/fees", response_model=list[FeeRecordWithPaymentsResponse])
async def get_student_fees(
    student_id: int,
    year: int = Query(...),
    db: AsyncSession = Depends(get_db),
    _=Depends(require_role("coordinator")),
) -> list[FeeRecord]:
    await _get_student_or_404(db, student_id)
    result = await db.execute(
        select(FeeRecord)
        .options(selectinload(FeeRecord.payments))
        .where(FeeRecord.student_id == student_id, FeeRecord.period_year == year)
        .order_by(FeeRecord.period_month)
    )
    return list(result.scalars().all())
