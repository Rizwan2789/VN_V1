from datetime import date
from decimal import Decimal

from pydantic import BaseModel, Field

from app.schemas.batch import BatchResponse


class StudentCreate(BaseModel):
    full_name: str
    roll_no: str
    batch_id: int
    email: str | None = None
    phone: str | None = None
    guardian_name: str | None = None
    guardian_phone: str | None = None
    address: str | None = None
    monthly_fee_amount: Decimal = Field(gt=0)
    admission_date: date | None = None


class StudentUpdate(BaseModel):
    full_name: str
    batch_id: int
    email: str | None = None
    phone: str | None = None
    guardian_name: str | None = None
    guardian_phone: str | None = None
    address: str | None = None
    monthly_fee_amount: Decimal = Field(gt=0)


class StudentResponse(BaseModel):
    id: int
    user_id: int
    roll_no: str
    full_name: str
    email: str | None
    batch: BatchResponse
    phone: str | None
    guardian_name: str | None
    guardian_phone: str | None
    address: str | None
    monthly_fee_amount: Decimal
    admission_date: date
    is_active: bool

    model_config = {"from_attributes": True}


class StudentListItem(BaseModel):
    id: int
    roll_no: str
    full_name: str
    batch: BatchResponse
    monthly_fee_amount: Decimal
    current_status: str | None
    is_active: bool

    model_config = {"from_attributes": True}


class StudentListResponse(BaseModel):
    items: list[StudentListItem]
    total: int


class StudentCreatedResponse(BaseModel):
    student: StudentResponse
    temporary_password: str
