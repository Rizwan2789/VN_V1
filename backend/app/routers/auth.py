from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user
from app.core.security import create_access_token, verify_password
from app.db.session import get_db
from app.models.student import Student
from app.models.user import User
from app.schemas.auth import CurrentUserResponse, LoginRequest, LoginResponse

router = APIRouter(prefix="/api/auth", tags=["auth"])

_INVALID_CREDENTIALS = HTTPException(
    status.HTTP_401_UNAUTHORIZED, "Invalid credentials for the selected role"
)


@router.post("/login", response_model=LoginResponse)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)) -> LoginResponse:
    result = await db.execute(select(User).where(User.login_id == payload.login_id))
    user = result.scalar_one_or_none()

    if user is None or not user.is_active or not verify_password(payload.password, user.hashed_password):
        raise _INVALID_CREDENTIALS

    if user.role != payload.role:
        # Deliberately the same error as bad credentials — avoids leaking which
        # accounts exist under the other role.
        raise _INVALID_CREDENTIALS

    student_id: int | None = None
    if user.role == "student":
        student_result = await db.execute(select(Student.id).where(Student.user_id == user.id))
        student_id = student_result.scalar_one_or_none()

    token_claims = {"sub": str(user.id), "role": user.role}
    if student_id is not None:
        token_claims["student_id"] = student_id

    return LoginResponse(
        access_token=create_access_token(token_claims),
        role=user.role,
        full_name=user.full_name,
        student_id=student_id,
    )


@router.get("/me", response_model=CurrentUserResponse)
async def get_me(current_user: User = Depends(get_current_user)) -> CurrentUserResponse:
    return CurrentUserResponse.model_validate(current_user)
