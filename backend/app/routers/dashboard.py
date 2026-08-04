from datetime import date
from decimal import Decimal

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db, require_role
from app.models.batch import Batch
from app.models.fee_record import FeeRecord
from app.models.student import Student
from app.schemas.dashboard import BatchBreakdown, DashboardMetrics

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
