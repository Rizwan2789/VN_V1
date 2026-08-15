from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Index, Numeric, String, Text, func, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.batch import Batch


class SignupRequest(Base):
    """A prospective student's self-submitted application, pending coordinator/admin review.

    Approval builds a StudentCreate-shaped payload (batch + fee set by the
    reviewer, not the applicant) and reuses create_student_with_user as-is.
    """

    __tablename__ = "signup_requests"
    __table_args__ = (
        CheckConstraint("status IN ('PENDING', 'APPROVED', 'REJECTED')", name="ck_signup_requests_status"),
        # Blocks duplicate outstanding submissions for the same email while
        # allowing resubmission once a prior request is approved/rejected.
        Index(
            "uq_signup_requests_pending_email",
            "email",
            unique=True,
            postgresql_where=text("status = 'PENDING'"),
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)

    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    guardian_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    guardian_phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)

    requested_batch_id: Mapped[int] = mapped_column(ForeignKey("batches.id"), nullable=False)
    requested_batch: Mapped["Batch"] = relationship(lazy="joined")
    monthly_fee_amount: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)

    status: Mapped[str] = mapped_column(String(20), nullable=False, default="PENDING", server_default="PENDING")
    reviewed_by_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    rejection_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    resulting_student_id: Mapped[int | None] = mapped_column(ForeignKey("students.id"), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
