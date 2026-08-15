from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_db, require_role
from app.core.security import hash_password
from app.models.admin_security_answer import AdminSecurityAnswer
from app.models.password_reset_request import PasswordResetRequest
from app.models.security_question import SecurityQuestion
from app.models.signup_request import SignupRequest
from app.models.student import Student
from app.models.user import User
from app.schemas.admin import (
    AdminDashboardCounts,
    AdminResetPasswordResponse,
    AdminUserListResponse,
)
from app.schemas.security_question import SecurityAnswersUpdate, SecurityQuestionStatus
from app.services.email_service import get_email_service
from app.services.email_templates import password_reset_approved_email
from app.services.security_question_service import upsert_security_answers
from app.services.student_service import generate_temporary_password

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/users", response_model=AdminUserListResponse)
async def list_users(
    role: str | None = None,
    search: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _=Depends(require_role("admin")),
) -> AdminUserListResponse:
    query = select(User).where(User.role != "admin")
    if role:
        query = query.where(User.role == role)
    if search:
        like = f"%{search}%"
        query = query.where(or_(User.full_name.ilike(like), User.login_id.ilike(like), User.email.ilike(like)))

    count_query = select(func.count()).select_from(query.with_only_columns(User.id).subquery())
    total = (await db.execute(count_query)).scalar_one()

    query = query.order_by(User.full_name).offset((page - 1) * page_size).limit(page_size)
    items = list((await db.execute(query)).scalars().all())

    return AdminUserListResponse(items=items, total=total)


@router.post("/users/{user_id}/reset-password", response_model=AdminResetPasswordResponse)
async def reset_user_password(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_role("admin")),
) -> AdminResetPasswordResponse:
    """Direct reset — no approval loop, since admin *is* the approver here.
    Always generates a brand-new password; never reveals the previous one."""
    user = await db.get(User, user_id)
    if user is None or user.role == "admin":
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")

    temporary_password = generate_temporary_password()
    user.hashed_password = hash_password(temporary_password)

    if user.email:
        subject, body = password_reset_approved_email(user.full_name, user.login_id, temporary_password)
        await get_email_service().send(
            db,
            to_email=user.email,
            subject=subject,
            body=body,
            template_key="password_reset_approved",
            related_user_id=user.id,
        )

    await db.commit()
    return AdminResetPasswordResponse(temporary_password=temporary_password)


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def deactivate_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_role("admin")),
) -> None:
    """Deactivating, not deleting — same convention as the coordinator's
    student deactivation (DELETE /api/students/{id}): flips is_active off
    rather than removing the row, so fee/audit history stays intact."""
    user = await db.get(User, user_id)
    if user is None or user.role == "admin":
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")

    user.is_active = False

    student = await db.scalar(select(Student).where(Student.user_id == user_id))
    if student is not None:
        student.is_active = False

    await db.commit()


@router.get("/dashboard", response_model=AdminDashboardCounts)
async def get_admin_dashboard(
    db: AsyncSession = Depends(get_db),
    _=Depends(require_role("admin")),
) -> AdminDashboardCounts:
    coordinator_count = await db.scalar(select(func.count()).select_from(User).where(User.role == "coordinator"))
    student_count = await db.scalar(select(func.count()).select_from(User).where(User.role == "student"))
    pending_signup_count = await db.scalar(
        select(func.count()).select_from(SignupRequest).where(SignupRequest.status == "PENDING")
    )
    pending_reset_count = await db.scalar(
        select(func.count()).select_from(PasswordResetRequest).where(PasswordResetRequest.status == "PENDING")
    )

    return AdminDashboardCounts(
        coordinator_count=coordinator_count or 0,
        student_count=student_count or 0,
        pending_signup_count=pending_signup_count or 0,
        pending_reset_count=pending_reset_count or 0,
    )


@router.get("/me/security-questions", response_model=list[SecurityQuestionStatus])
async def get_my_security_questions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _=Depends(require_role("admin")),
) -> list[SecurityQuestionStatus]:
    questions = (
        (await db.execute(select(SecurityQuestion).where(SecurityQuestion.is_active.is_(True))))
        .scalars()
        .all()
    )
    answered_ids = set(
        (
            await db.execute(
                select(AdminSecurityAnswer.security_question_id).where(
                    AdminSecurityAnswer.user_id == current_user.id
                )
            )
        )
        .scalars()
        .all()
    )

    return [
        SecurityQuestionStatus(
            id=q.id,
            question_text=q.question_text,
            display_order=q.display_order,
            is_answered=q.id in answered_ids,
        )
        for q in sorted(questions, key=lambda q: q.display_order)
    ]


@router.put("/me/security-questions", status_code=status.HTTP_204_NO_CONTENT)
async def update_my_security_questions(
    payload: SecurityAnswersUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _=Depends(require_role("admin")),
) -> None:
    answers = [(a.question_id, a.answer) for a in payload.answers if a.answer.strip()]
    await upsert_security_answers(db, current_user.id, answers)
    await db.commit()
