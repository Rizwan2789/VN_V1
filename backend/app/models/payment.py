from datetime import date, datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import Date, DateTime, ForeignKey, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.fee_record import FeeRecord


class Payment(Base):
    """Audit trail row — supports partial payments and receipt generation."""

    __tablename__ = "payments"

    id: Mapped[int] = mapped_column(primary_key=True)
    fee_record_id: Mapped[int] = mapped_column(ForeignKey("fee_records.id"), nullable=False)

    amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    payment_date: Mapped[date] = mapped_column(Date, server_default=func.current_date())
    payment_method: Mapped[str | None] = mapped_column(String(30), nullable=True)
    transaction_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    receipt_number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    recorded_by_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    fee_record: Mapped["FeeRecord"] = relationship(back_populates="payments")
