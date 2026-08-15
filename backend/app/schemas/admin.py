from datetime import datetime

from pydantic import BaseModel


class AdminUserListItem(BaseModel):
    id: int
    login_id: str
    email: str | None
    full_name: str
    role: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class AdminUserListResponse(BaseModel):
    items: list[AdminUserListItem]
    total: int


class AdminResetPasswordResponse(BaseModel):
    temporary_password: str


class AdminDashboardCounts(BaseModel):
    coordinator_count: int
    student_count: int
    pending_signup_count: int
    pending_reset_count: int
