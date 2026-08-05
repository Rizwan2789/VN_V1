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


class ClassDefaulter(BaseModel):
    student_id: int
    full_name: str
    phone: str | None
    pending_amount: Decimal


class ClassBreakdown(BaseModel):
    batch_id: int
    batch_name: str
    total_students: int
    paid_count: int
    pending_count: int  # PENDING + PARTIAL + OVERDUE
    overdue_count: int  # subset of pending_count, for a warning badge
    no_record_count: int  # active students with no FeeRecord generated this period yet
    pending_amount: Decimal
    collected_amount: Decimal
    defaulters: list[ClassDefaulter]  # sorted by pending_amount desc
