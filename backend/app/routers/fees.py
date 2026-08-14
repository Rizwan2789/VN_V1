from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_db, require_role
from app.models.fee_record import FeeRecord
from app.models.payment import Payment
from app.models.student import Student
from app.models.user import User
from app.schemas.fee_record import FeeRecordGenerateRequest, FeeRecordResponse, FeeRecordUpdate
from app.schemas.payment import PaymentCreate, PaymentResponse
from app.services.fee_status import compute_status
from app.services.receipt import format_receipt_number

router = APIRouter(prefix="/api/fees", tags=["fees"])

DUE_DAY_OF_MONTH = 10


@router.post("/generate", response_model=list[FeeRecordResponse], status_code=status.HTTP_201_CREATED)
async def generate_fee_records(
    payload: FeeRecordGenerateRequest,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_role("coordinator")),
) -> list[FeeRecord]:
    students_query = select(Student).where(Student.is_active.is_(True))
    if payload.batch_id is not None:
        students_query = students_query.where(Student.batch_id == payload.batch_id)
    students = list((await db.execute(students_query)).scalars().all())
    if not students:
        return []

    existing_query = select(FeeRecord.student_id).where(
        FeeRecord.period_month == payload.period_month,
        FeeRecord.period_year == payload.period_year,
        FeeRecord.student_id.in_([s.id for s in students]),
    )
    existing_student_ids = {row for row in (await db.execute(existing_query)).scalars().all()}

    due_date = date(payload.period_year, payload.period_month, DUE_DAY_OF_MONTH)
    created: list[FeeRecord] = []
    for student in students:
        if student.id in existing_student_ids:
            continue
        record = FeeRecord(
            student_id=student.id,
            period_month=payload.period_month,
            period_year=payload.period_year,
            amount_due=student.monthly_fee_amount,
            due_date=due_date,
            status=compute_status(student.monthly_fee_amount, 0, due_date, date.today()),
        )
        db.add(record)
        created.append(record)

    await db.commit()
    for record in created:
        await db.refresh(record)
    return created


async def _get_fee_record_or_404(db: AsyncSession, fee_record_id: int) -> FeeRecord:
    record = await db.get(FeeRecord, fee_record_id)
    if record is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Fee record not found")
    return record


@router.patch("/{fee_record_id}", response_model=FeeRecordResponse)
async def update_fee_record(
    fee_record_id: int,
    payload: FeeRecordUpdate,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_role("coordinator")),
) -> FeeRecord:
    record = await _get_fee_record_or_404(db, fee_record_id)

    if payload.amount_due is not None:
        record.amount_due = payload.amount_due
    if payload.due_date is not None:
        record.due_date = payload.due_date
    if payload.notes is not None:
        record.notes = payload.notes

    record.status = compute_status(record.amount_due, record.amount_paid, record.due_date, date.today())

    await db.commit()
    await db.refresh(record)
    return record


@router.post(
    "/{fee_record_id}/payments", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED
)
async def record_payment(
    fee_record_id: int,
    payload: PaymentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _=Depends(require_role("coordinator")),
) -> Payment:
    record = await _get_fee_record_or_404(db, fee_record_id)

    payment_date = payload.payment_date or date.today()

    # One receipt per month: a second payment against the same fee record
    # tops up the existing receipt instead of minting a new one, so a
    # student who pays in installments still sees a single receipt for
    # that month once it's fully paid.
    payment = await db.scalar(select(Payment).where(Payment.fee_record_id == record.id))
    if payment is not None:
        payment.amount = payment.amount + payload.amount
        payment.payment_date = payment_date
        if payload.payment_method is not None:
            payment.payment_method = payload.payment_method
        if payload.transaction_notes is not None:
            payment.transaction_notes = payload.transaction_notes
    else:
        payment = Payment(
            fee_record_id=record.id,
            amount=payload.amount,
            payment_date=payment_date,
            payment_method=payload.payment_method,
            transaction_notes=payload.transaction_notes,
            receipt_number="",  # filled in below once we have an id
            recorded_by_user_id=current_user.id,
        )
        db.add(payment)
        await db.flush()
        payment.receipt_number = format_receipt_number(payment.id, payment_date)

    record.amount_paid = record.amount_paid + payload.amount
    record.last_paid_date = payment_date
    record.status = compute_status(record.amount_due, record.amount_paid, record.due_date, date.today())

    await db.commit()
    await db.refresh(payment)
    return payment
