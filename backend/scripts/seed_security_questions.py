"""Upsert the 5 fixed security questions used by the admin forgot-password flow.

Run with: python -m scripts.seed_security_questions (from the backend/ directory, venv active)

The initial migration seeds 5 placeholder rows (ids 1-5) so the schema is
usable immediately. Edit QUESTIONS below with the real question text, then
rerun this script — it upserts by id, so it's safe to run again whenever the
wording needs to change, without a new migration.
"""

import asyncio

from sqlalchemy import select

from app.db.session import AsyncSessionLocal
from app.models.security_question import SecurityQuestion

QUESTIONS = [
    (1, "PLACEHOLDER: What was the name of your first pet?"),
    (2, "PLACEHOLDER: What city were you born in?"),
    (3, "PLACEHOLDER: What was your childhood best friend's name?"),
    (4, "PLACEHOLDER: What was the make of your first car?"),
    (5, "PLACEHOLDER: What is your mother's maiden name?"),
]


async def seed_security_questions() -> None:
    async with AsyncSessionLocal() as db:
        for display_order, question_text in QUESTIONS:
            existing = await db.scalar(select(SecurityQuestion).where(SecurityQuestion.id == display_order))
            if existing is not None:
                existing.question_text = question_text
                existing.display_order = display_order
            else:
                db.add(
                    SecurityQuestion(id=display_order, question_text=question_text, display_order=display_order)
                )

        await db.commit()
        print(f"Upserted {len(QUESTIONS)} security questions.")


if __name__ == "__main__":
    asyncio.run(seed_security_questions())
