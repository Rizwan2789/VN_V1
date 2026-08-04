from pydantic import BaseModel


class LoginRequest(BaseModel):
    role: str  # "coordinator" | "student"
    login_id: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    full_name: str
    student_id: int | None = None


class CurrentUserResponse(BaseModel):
    id: int
    login_id: str
    email: str | None
    full_name: str
    role: str

    model_config = {"from_attributes": True}
