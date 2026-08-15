from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, Field

from app.schemas.batch import BatchResponse


class SignupRequestCreate(BaseModel):
    full_name: str
    requested_batch_id: int
    email: str
    phone: str | None = None
    guardian_name: str | None = None
    guardian_phone: str | None = None
    address: str | None = None


class SignupRequestApprove(BaseModel):
    batch_id: int
    monthly_fee_amount: Decimal = Field(gt=0)
    admission_date: date | None = None


class SignupRequestReject(BaseModel):
    reason: str | None = None


class SignupRequestResponse(BaseModel):
    id: int
    full_name: str
    email: str
    phone: str | None
    guardian_name: str | None
    guardian_phone: str | None
    address: str | None
    requested_batch: BatchResponse
    monthly_fee_amount: Decimal | None
    status: str
    reviewed_at: datetime | None
    rejection_reason: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class SignupRequestListResponse(BaseModel):
    items: list[SignupRequestResponse]
    total: int
