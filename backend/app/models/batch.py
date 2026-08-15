from datetime import datetime

from sqlalchemy import DateTime, SmallInteger, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Batch(Base):
    """A class/grade — fixed set of 5 seeded rows: Pre-9th, 9th, 10th, 11th, 12th."""

    __tablename__ = "batches"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    grade_level: Mapped[int] = mapped_column(SmallInteger, unique=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
