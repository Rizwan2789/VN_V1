from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, Field

from app.schemas.payment import PaymentResponse


class FeeRecordGenerateRequest(BaseModel):
    period_month: int = Field(ge=1, le=12)
    period_year: int = Field(ge=2000, le=2100)
    batch_id: int | None = None  # omit to generate for every active student


class FeeRecordUpdate(BaseModel):
    amount_due: Decimal | None = Field(default=None, gt=0)
    due_date: date | None = None
    notes: str | None = None


class FeeRecordResponse(BaseModel):
    id: int
    student_id: int
    period_month: int
    period_year: int
    amount_due: Decimal
    amount_paid: Decimal
    due_date: date
    status: str
    last_paid_date: date | None
    notes: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class FeeRecordWithPaymentsResponse(FeeRecordResponse):
    payments: list[PaymentResponse]
