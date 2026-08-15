from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_db, require_role
from app.models.signup_request import SignupRequest
from app.models.user import User
from app.schemas.signup_request import (
    SignupRequestApprove,
    SignupRequestCreate,
    SignupRequestListResponse,
    SignupRequestReject,
    SignupRequestResponse,
)
from app.schemas.student import StudentCreatedResponse, StudentResponse
from app.services.email_service import get_email_service
from app.services.signup_request_service import (
    approve_signup_request,
    create_signup_request,
    reject_signup_request,
)

router = APIRouter(prefix="/api/signup-requests", tags=["signup-requests"])


@router.post("", response_model=SignupRequestResponse, status_code=status.HTTP_201_CREATED)
async def submit_signup_request(
    payload: SignupRequestCreate,
    db: AsyncSession = Depends(get_db),
) -> SignupRequest:
    """Public — a prospective student applies before any account exists."""
    try:
        request = await create_signup_request(db, payload)
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status.HTTP_409_CONFLICT, "An application with this email is already pending review"
        )
    await db.refresh(request, attribute_names=["requested_batch"])
    return request


@router.get("", response_model=SignupRequestListResponse)
async def list_signup_requests(
    status_filter: str | None = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _=Depends(require_role("coordinator", "admin")),
) -> SignupRequestListResponse:
    query = select(SignupRequest)
    if status_filter:
        query = query.where(SignupRequest.status == status_filter)

    count_query = select(func.count()).select_from(query.with_only_columns(SignupRequest.id).subquery())
    total = (await db.execute(count_query)).scalar_one()

    query = query.order_by(SignupRequest.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    items = list((await db.execute(query)).scalars().all())

    return SignupRequestListResponse(items=items, total=total)


async def _get_signup_request_or_404(db: AsyncSession, request_id: int) -> SignupRequest:
    request = await db.get(SignupRequest, request_id)
    if request is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Signup request not found")
    return request


@router.get("/{request_id}", response_model=SignupRequestResponse)
async def get_signup_request(
    request_id: int,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_role("coordinator", "admin")),
) -> SignupRequest:
    return await _get_signup_request_or_404(db, request_id)


@router.post("/{request_id}/approve", response_model=StudentCreatedResponse)
async def approve_signup_request_endpoint(
    request_id: int,
    payload: SignupRequestApprove,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _=Depends(require_role("coordinator", "admin")),
) -> StudentCreatedResponse:
    request = await _get_signup_request_or_404(db, request_id)
    if request.status != "PENDING":
        raise HTTPException(status.HTTP_409_CONFLICT, "This request has already been reviewed")

    try:
        student, temporary_password = await approve_signup_request(
            db,
            request,
            batch_id=payload.batch_id,
            monthly_fee_amount=payload.monthly_fee_amount,
            admission_date=payload.admission_date,
            reviewer=current_user,
            email_service=get_email_service(),
        )
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, "A student with that roll number already exists")
    await db.refresh(student, attribute_names=["batch", "user"])

    return StudentCreatedResponse(
        student=StudentResponse(
            id=student.id,
            user_id=student.user_id,
            roll_no=student.roll_no,
            full_name=student.user.full_name,
            email=student.user.email,
            batch=student.batch,
            phone=student.phone,
            guardian_name=student.guardian_name,
            guardian_phone=student.guardian_phone,
            address=student.address,
            monthly_fee_amount=student.monthly_fee_amount,
            admission_date=student.admission_date,
            is_active=student.is_active,
        ),
        temporary_password=temporary_password,
    )


@router.post("/{request_id}/reject", response_model=SignupRequestResponse)
async def reject_signup_request_endpoint(
    request_id: int,
    payload: SignupRequestReject,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _=Depends(require_role("coordinator", "admin")),
) -> SignupRequest:
    request = await _get_signup_request_or_404(db, request_id)
    if request.status != "PENDING":
        raise HTTPException(status.HTTP_409_CONFLICT, "This request has already been reviewed")

    request = await reject_signup_request(
        db, request, reviewer=current_user, reason=payload.reason, email_service=get_email_service()
    )
    await db.commit()
    await db.refresh(request, attribute_names=["requested_batch"])
    return request
