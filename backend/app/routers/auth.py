import secrets

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user
from app.core.security import create_access_token, verify_password
from app.db.session import get_db
from app.models.security_question import SecurityQuestion
from app.models.student import Student
from app.models.user import User
from app.schemas.auth import CurrentUserResponse, LoginRequest, LoginResponse
from app.schemas.security_question import (
    AdminForgotPasswordStartRequest,
    AdminForgotPasswordStartResponse,
    AdminForgotPasswordVerifyRequest,
)
from app.services.security_question_service import (
    ChallengeAnswerIncorrect,
    ChallengeInvalid,
    create_reset_challenge,
    get_random_answered_question,
    set_password_after_verification,
    verify_challenge,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])

_INVALID_CREDENTIALS = HTTPException(
    status.HTTP_401_UNAUTHORIZED, "Invalid credentials for the selected role"
)
_NO_QUESTION_CONFIGURED = HTTPException(
    status.HTTP_409_CONFLICT,
    "Admin recovery is not available for this account yet — no security questions have been answered.",
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


@router.post("/admin/forgot-password/start", response_model=AdminForgotPasswordStartResponse)
async def admin_forgot_password_start(
    payload: AdminForgotPasswordStartRequest,
    db: AsyncSession = Depends(get_db),
) -> AdminForgotPasswordStartResponse:
    """Public. Always returns a real question + a token, whether or not
    `login_id` matches a real admin with configured answers — avoids leaking
    account existence, same as login's role/credential ambiguity above. A
    fake case's token is never persisted, so /verify fails for it exactly
    like any other unknown token."""
    user = await db.scalar(
        select(User).where(User.login_id == payload.login_id, User.role == "admin", User.is_active.is_(True))
    )
    question = await get_random_answered_question(db, user.id) if user is not None else None

    if user is not None and question is not None:
        challenge = await create_reset_challenge(db, user_id=user.id, question_id=question.id)
        await db.commit()
        return AdminForgotPasswordStartResponse(
            challenge_token=challenge.token, question_text=question.question_text
        )

    fallback_question = await db.scalar(
        select(SecurityQuestion).where(SecurityQuestion.is_active.is_(True)).order_by(func.random()).limit(1)
    )
    if fallback_question is None:
        raise _NO_QUESTION_CONFIGURED
    return AdminForgotPasswordStartResponse(
        challenge_token=secrets.token_urlsafe(32), question_text=fallback_question.question_text
    )


@router.post("/admin/forgot-password/verify")
async def admin_forgot_password_verify(
    payload: AdminForgotPasswordVerifyRequest,
    db: AsyncSession = Depends(get_db),
) -> dict:
    try:
        user = await verify_challenge(db, token=payload.challenge_token, submitted_answer=payload.answer)
    except ChallengeAnswerIncorrect as exc:
        await db.commit()  # persist the incremented attempt count
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc)) from exc
    except ChallengeInvalid as exc:
        await db.commit()  # persist deletion of the expired/exhausted challenge
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED, "This recovery session is no longer valid — please start over."
        ) from exc

    set_password_after_verification(user, payload.new_password)
    await db.commit()
    return {"message": "Password updated. You can now sign in with your new password."}
