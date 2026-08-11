from datetime import date, datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field


class PaymentCreate(BaseModel):
    amount: Decimal = Field(gt=0)
    payment_date: date | None = None
    payment_method: Literal["CASH", "BANK_TRANSFER", "ONLINE"] | None = None
    transaction_notes: str | None = None


class PaymentResponse(BaseModel):
    id: int
    fee_record_id: int
    amount: Decimal
    payment_date: date
    payment_method: str | None
    transaction_notes: str | None
    receipt_number: str
    created_at: datetime

    model_config = {"from_attributes": True}
