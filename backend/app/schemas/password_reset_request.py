from datetime import datetime

from pydantic import BaseModel


class PasswordResetRequestCreate(BaseModel):
    role: str  # "coordinator" | "student"
    login_id: str


class PasswordResetRequestReject(BaseModel):
    reason: str | None = None


class PasswordResetSendEmail(BaseModel):
    temporary_password: str


class PasswordResetRequestResponse(BaseModel):
    id: int
    user_id: int
    full_name: str
    login_id: str
    email: str | None
    requested_role: str
    status: str
    reviewed_at: datetime | None
    notes: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class PasswordResetRequestListResponse(BaseModel):
    items: list[PasswordResetRequestResponse]
    total: int


class PasswordResetApprovedResponse(BaseModel):
    temporary_password: str
