from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class EmailLog(Base):
    """Record of an email the app "sent" — the stub EmailService's storage today,
    and the audit trail once a real provider is wired in behind the same interface.
    """

    __tablename__ = "email_log"
    __table_args__ = (CheckConstraint("status IN ('SENT', 'FAILED')", name="ck_email_log_status"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    to_email: Mapped[str] = mapped_column(String(255), nullable=False)
    subject: Mapped[str] = mapped_column(String(255), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    template_key: Mapped[str | None] = mapped_column(String(50), nullable=True)
    related_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="SENT", server_default="SENT")
    provider_message_id: Mapped[str | None] = mapped_column(String(255), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
