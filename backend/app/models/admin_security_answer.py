from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class AdminSecurityAnswer(Base):
    """An admin's hashed answer to one security question.

    `user_id` is expected to reference a role='admin' User — an app-layer
    invariant enforced in security_question_service, not a DB constraint.
    """

    __tablename__ = "admin_security_answers"
    __table_args__ = (UniqueConstraint("user_id", "security_question_id", name="uq_admin_security_answer"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    security_question_id: Mapped[int] = mapped_column(ForeignKey("security_questions.id"), nullable=False)
    hashed_answer: Mapped[str] = mapped_column(String(255), nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
