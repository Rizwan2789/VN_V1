from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Index, String, Text, func, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.user import User


class PasswordResetRequest(Base):
    """A coordinator's or student's forgotten-password request, pending admin review."""

    __tablename__ = "password_reset_requests"
    __table_args__ = (
        CheckConstraint("status IN ('PENDING', 'APPROVED', 'REJECTED')", name="ck_password_reset_requests_status"),
        CheckConstraint("requested_role IN ('coordinator', 'student')", name="ck_password_reset_requests_role"),
        # One outstanding request per account at a time.
        Index(
            "uq_password_reset_requests_pending_user",
            "user_id",
            unique=True,
            postgresql_where=text("status = 'PENDING'"),
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    user: Mapped["User"] = relationship(lazy="joined", foreign_keys=[user_id])
    requested_role: Mapped[str] = mapped_column(String(20), nullable=False)

    status: Mapped[str] = mapped_column(String(20), nullable=False, default="PENDING", server_default="PENDING")
    reviewed_by_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Flattened onto the response schema via from_attributes — the admin
    # queue needs to show who's asking, not just a bare user_id.
    @property
    def full_name(self) -> str:
        return self.user.full_name

    @property
    def login_id(self) -> str:
        return self.user.login_id
