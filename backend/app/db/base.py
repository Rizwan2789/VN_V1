from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


# Import all models here so Alembic's autogenerate can discover them via Base.metadata.
from app.models import (  # noqa: E402,F401
    admin_reset_challenge,
    admin_security_answer,
    batch,
    email_log,
    fee_record,
    password_reset_request,
    payment,
    security_question,
    signup_request,
    student,
    user,
)
