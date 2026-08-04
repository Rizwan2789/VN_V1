"""One-off dev seed: 4 batches (9th-12th) + one test coordinator + one test student.

Run with: python -m scripts.seed_data (from the backend/ directory, venv active)
"""

import asyncio
from datetime import date
from decimal import Decimal

from sqlalchemy import select

from app.core.security import hash_password
from app.db.session import AsyncSessionLocal
from app.models.batch import Batch
from app.models.student import Student
from app.models.user import User

BATCHES = [("9th", 9), ("10th", 10), ("11th", 11), ("12th", 12)]


async def seed() -> None:
    async with AsyncSessionLocal() as db:
        batch_by_grade: dict[int, Batch] = {}
        for name, grade_level in BATCHES:
            existing = await db.scalar(select(Batch).where(Batch.grade_level == grade_level))
            if existing is None:
                existing = Batch(name=name, grade_level=grade_level)
                db.add(existing)
                await db.flush()
            batch_by_grade[grade_level] = existing

        coordinator = await db.scalar(select(User).where(User.login_id == "admin@vistanova.edu"))
        if coordinator is None:
            coordinator = User(
                login_id="admin@vistanova.edu",
                email="admin@vistanova.edu",
                hashed_password=hash_password("Coordinator123!"),
                role="coordinator",
                full_name="Vista Nova Coordinator",
            )
            db.add(coordinator)
            await db.flush()

        student_user = await db.scalar(select(User).where(User.login_id == "VN-2026-001"))
        if student_user is None:
            student_user = User(
                login_id="VN-2026-001",
                email=None,
                hashed_password=hash_password("Student123!"),
                role="student",
                full_name="Ayesha Khan",
            )
            db.add(student_user)
            await db.flush()

            db.add(
                Student(
                    user_id=student_user.id,
                    roll_no="VN-2026-001",
                    batch_id=batch_by_grade[9].id,
                    phone="03001234567",
                    guardian_name="Imran Khan",
                    guardian_phone="03007654321",
                    monthly_fee_amount=Decimal("5000.00"),
                    admission_date=date(2026, 1, 5),
                )
            )

        await db.commit()
        print("Seed complete: 4 batches, 1 coordinator (admin@vistanova.edu / Coordinator123!), "
              "1 student (VN-2026-001 / Student123!)")


if __name__ == "__main__":
    asyncio.run(seed())
