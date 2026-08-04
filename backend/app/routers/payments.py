from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.core.dependencies import get_current_user, get_db
from app.models.payment import Payment
from app.models.student import Student
from app.models.user import User
from app.services.receipt_pdf import generate_receipt_pdf

router = APIRouter(prefix="/api/payments", tags=["payments"])


@router.get("/{payment_id}/receipt")
async def get_receipt(
    payment_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    result = await db.execute(
        select(Payment).options(joinedload(Payment.fee_record)).where(Payment.id == payment_id)
    )
    payment = result.unique().scalar_one_or_none()
    if payment is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Payment not found")

    student = await db.get(Student, payment.fee_record.student_id)
    if student is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Student not found for this payment")

    if current_user.role == "student" and student.user_id != current_user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "This receipt does not belong to you")

    pdf_bytes = generate_receipt_pdf(payment, student)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="{payment.receipt_number}.pdf"'},
    )
