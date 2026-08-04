from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


# Import all models here so Alembic's autogenerate can discover them via Base.metadata.
from app.models import batch, fee_record, payment, student, user  # noqa: E402,F401
