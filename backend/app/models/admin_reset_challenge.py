import secrets
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, SmallInteger, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


def _generate_token() -> str:
    return secrets.token_urlsafe(32)


class AdminResetChallenge(Base):
    """Single-use opaque token proving an admin answered their security question.

    Deliberately NOT a JWT — get_current_user/decode_access_token only check
    `sub` + DB role, with no concept of "this token only proves a security
    answer," so a JWT minted for that purpose would be a fully valid bearer
    token if it leaked mid-flow. See routers/auth.py's admin recovery endpoints.
    """

    __tablename__ = "admin_reset_challenges"

    token: Mapped[str] = mapped_column(String(64), primary_key=True, default=_generate_token)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    security_question_id: Mapped[int] = mapped_column(ForeignKey("security_questions.id"), nullable=False)
    attempts: Mapped[int] = mapped_column(SmallInteger, nullable=False, default=0, server_default="0")
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
