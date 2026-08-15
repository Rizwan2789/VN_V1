from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_db, require_role
from app.models.password_reset_request import PasswordResetRequest
from app.models.user import User
from app.schemas.password_reset_request import (
    PasswordResetApprovedResponse,
    PasswordResetRequestCreate,
    PasswordResetRequestListResponse,
    PasswordResetRequestReject,
    PasswordResetRequestResponse,
)
from app.services.email_service import get_email_service
from app.services.password_reset_service import (
    approve_reset_request,
    create_reset_request,
    reject_reset_request,
)

router = APIRouter(prefix="/api/password-reset-requests", tags=["password-reset-requests"])

_GENERIC_SUBMITTED_MESSAGE = {"message": "If that account exists, your request has been submitted for review."}


@router.post("", status_code=status.HTTP_202_ACCEPTED)
async def submit_password_reset_request(
    payload: PasswordResetRequestCreate,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Public. Always returns the same generic response regardless of whether
    login_id/role matched a real account — avoids leaking account existence,
    same as auth.py's login handler."""
    await create_reset_request(db, role=payload.role, login_id=payload.login_id)
    await db.commit()
    return _GENERIC_SUBMITTED_MESSAGE


@router.get("", response_model=PasswordResetRequestListResponse)
async def list_password_reset_requests(
    status_filter: str | None = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _=Depends(require_role("admin")),
) -> PasswordResetRequestListResponse:
    query = select(PasswordResetRequest)
    if status_filter:
        query = query.where(PasswordResetRequest.status == status_filter)

    count_query = select(func.count()).select_from(query.with_only_columns(PasswordResetRequest.id).subquery())
    total = (await db.execute(count_query)).scalar_one()

    query = (
        query.order_by(PasswordResetRequest.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    )
    items = list((await db.execute(query)).scalars().all())

    return PasswordResetRequestListResponse(items=items, total=total)


async def _get_reset_request_or_404(db: AsyncSession, request_id: int) -> PasswordResetRequest:
    request = await db.get(PasswordResetRequest, request_id)
    if request is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Password reset request not found")
    return request


@router.post("/{request_id}/approve", response_model=PasswordResetApprovedResponse)
async def approve_password_reset_request(
    request_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _=Depends(require_role("admin")),
) -> PasswordResetApprovedResponse:
    request = await _get_reset_request_or_404(db, request_id)
    if request.status != "PENDING":
        raise HTTPException(status.HTTP_409_CONFLICT, "This request has already been reviewed")

    temporary_password = await approve_reset_request(
        db, request, reviewer=current_user, email_service=get_email_service()
    )
    await db.commit()
    return PasswordResetApprovedResponse(temporary_password=temporary_password)


@router.post("/{request_id}/reject", response_model=PasswordResetRequestResponse)
async def reject_password_reset_request(
    request_id: int,
    payload: PasswordResetRequestReject,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _=Depends(require_role("admin")),
) -> PasswordResetRequest:
    request = await _get_reset_request_or_404(db, request_id)
    if request.status != "PENDING":
        raise HTTPException(status.HTTP_409_CONFLICT, "This request has already been reviewed")

    request = await reject_reset_request(
        db, request, reviewer=current_user, reason=payload.reason, email_service=get_email_service()
    )
    await db.commit()
    return request
