from datetime import date, datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import Date, DateTime, ForeignKey, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.batch import Batch
    from app.models.user import User


class Student(Base):
    __tablename__ = "students"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True, nullable=False)
    roll_no: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    batch_id: Mapped[int] = mapped_column(ForeignKey("batches.id"), nullable=False)

    batch: Mapped["Batch"] = relationship(lazy="joined")
    user: Mapped["User"] = relationship(lazy="joined")

    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    guardian_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    guardian_phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)

    monthly_fee_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    admission_date: Mapped[date] = mapped_column(Date, server_default=func.current_date())
    is_active: Mapped[bool] = mapped_column(default=True, server_default="true")

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
