from decimal import Decimal

from pydantic import BaseModel


class BatchBreakdown(BaseModel):
    batch_id: int
    batch_name: str
    student_count: int


class DashboardMetrics(BaseModel):
    total_collected_this_month: Decimal
    pending_count: int
    overdue_count: int
    active_students_count: int
    batch_breakdown: list[BatchBreakdown]
