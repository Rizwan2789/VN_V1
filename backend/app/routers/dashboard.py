from datetime import date
from decimal import Decimal

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db, require_role
from app.models.batch import Batch
from app.models.fee_record import FeeRecord
from app.models.student import Student
from app.models.user import User
from app.schemas.dashboard import BatchBreakdown, ClassBreakdown, ClassDefaulter, DashboardMetrics

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/metrics", response_model=DashboardMetrics)
async def get_dashboard_metrics(
    db: AsyncSession = Depends(get_db),
    _=Depends(require_role("coordinator")),
) -> DashboardMetrics:
    today = date.today()

    total_collected = await db.scalar(
        select(func.coalesce(func.sum(FeeRecord.amount_paid), 0)).where(
            FeeRecord.period_month == today.month, FeeRecord.period_year == today.year
        )
    )

    pending_count = await db.scalar(
        select(func.count()).select_from(FeeRecord).where(FeeRecord.status == "PENDING")
    )
    overdue_count = await db.scalar(
        select(func.count()).select_from(FeeRecord).where(FeeRecord.status == "OVERDUE")
    )
    active_students_count = await db.scalar(
        select(func.count()).select_from(Student).where(Student.is_active.is_(True))
    )

    breakdown_rows = await db.execute(
        select(Batch.id, Batch.name, func.count(Student.id))
        .outerjoin(Student, (Student.batch_id == Batch.id) & (Student.is_active.is_(True)))
        .group_by(Batch.id, Batch.name)
        .order_by(Batch.grade_level)
    )

    return DashboardMetrics(
        total_collected_this_month=Decimal(total_collected or 0),
        pending_count=pending_count or 0,
        overdue_count=overdue_count or 0,
        active_students_count=active_students_count or 0,
        batch_breakdown=[
            BatchBreakdown(batch_id=row[0], batch_name=row[1], student_count=row[2])
            for row in breakdown_rows.all()
        ],
    )


@router.get("/class-breakdown", response_model=list[ClassBreakdown])
async def get_class_breakdown(
    batch_id: int | None = None,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_role("coordinator")),
) -> list[ClassBreakdown]:
    """Per-batch fee stats + defaulters for the current calendar month.

    Reuses the same "current status = this month's FeeRecord" convention as
    get_current_status_map (used by /api/students and /metrics above) so the
    numbers here stay consistent with the rest of the dashboard, rather than
    a "most recent record ever" interpretation.
    """
    today = date.today()

    query = (
        select(
            Batch.id,
            Batch.name,
            Student.id,
            User.full_name,
            Student.phone,
            FeeRecord.status,
            FeeRecord.amount_due,
            FeeRecord.amount_paid,
        )
        .select_from(Batch)
        .outerjoin(Student, (Student.batch_id == Batch.id) & (Student.is_active.is_(True)))
        .outerjoin(User, User.id == Student.user_id)
        .outerjoin(
            FeeRecord,
            (FeeRecord.student_id == Student.id)
            & (FeeRecord.period_month == today.month)
            & (FeeRecord.period_year == today.year),
        )
        .order_by(Batch.grade_level)
    )
    if batch_id is not None:
        query = query.where(Batch.id == batch_id)

    rows = (await db.execute(query)).all()

    accumulators: dict[int, dict] = {}
    order: list[int] = []

    for b_id, b_name, s_id, full_name, phone, fee_status, amount_due, amount_paid in rows:
        if b_id not in accumulators:
            accumulators[b_id] = {
                "batch_name": b_name,
                "total_students": 0,
                "paid_count": 0,
                "pending_count": 0,
                "overdue_count": 0,
                "no_record_count": 0,
                "pending_amount": Decimal(0),
                "collected_amount": Decimal(0),
                "defaulters": [],
            }
            order.append(b_id)

        acc = accumulators[b_id]

        if s_id is None:
            continue  # batch has zero active students

        acc["total_students"] += 1

        if fee_status is None:
            acc["no_record_count"] += 1
            continue

        acc["collected_amount"] += amount_paid or Decimal(0)

        if fee_status == "PAID":
            acc["paid_count"] += 1
            continue

        acc["pending_count"] += 1
        if fee_status == "OVERDUE":
            acc["overdue_count"] += 1

        pending = max(Decimal(0), (amount_due or Decimal(0)) - (amount_paid or Decimal(0)))
        acc["pending_amount"] += pending
        acc["defaulters"].append(
            ClassDefaulter(student_id=s_id, full_name=full_name, phone=phone, pending_amount=pending)
        )

    result: list[ClassBreakdown] = []
    for b_id in order:
        acc = accumulators[b_id]
        acc["defaulters"].sort(key=lambda d: d.pending_amount, reverse=True)
        result.append(ClassBreakdown(batch_id=b_id, **acc))

    return result
