import random
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password, verify_password
from app.models.admin_reset_challenge import AdminResetChallenge
from app.models.admin_security_answer import AdminSecurityAnswer
from app.models.security_question import SecurityQuestion
from app.models.user import User

CHALLENGE_TTL_MINUTES = 5
MAX_ATTEMPTS = 3


class ChallengeInvalid(Exception):
    """Token unknown, expired, or attempts exhausted — client must restart via /start."""


class ChallengeAnswerIncorrect(Exception):
    """Wrong answer, but the challenge itself is still usable — retry with the same token."""

    def __init__(self, attempts_remaining: int) -> None:
        self.attempts_remaining = attempts_remaining
        super().__init__(f"Incorrect answer, {attempts_remaining} attempt(s) remaining")


def _normalize_answer(answer: str) -> str:
    return answer.strip().lower()


async def get_random_answered_question(db: AsyncSession, admin_user_id: int) -> SecurityQuestion | None:
    """Picks only among questions this admin has actually configured an answer
    for, rather than blindly all 5, in case setup is incomplete."""
    result = await db.execute(
        select(SecurityQuestion)
        .join(AdminSecurityAnswer, AdminSecurityAnswer.security_question_id == SecurityQuestion.id)
        .where(AdminSecurityAnswer.user_id == admin_user_id)
    )
    questions = result.scalars().all()
    if not questions:
        return None
    return random.choice(questions)


async def create_reset_challenge(db: AsyncSession, *, user_id: int, question_id: int) -> AdminResetChallenge:
    challenge = AdminResetChallenge(
        user_id=user_id,
        security_question_id=question_id,
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=CHALLENGE_TTL_MINUTES),
    )
    db.add(challenge)
    await db.flush()
    return challenge


async def verify_challenge(db: AsyncSession, *, token: str, submitted_answer: str) -> User:
    challenge = await db.get(AdminResetChallenge, token)
    if challenge is None:
        raise ChallengeInvalid()

    if challenge.expires_at < datetime.now(timezone.utc):
        await db.delete(challenge)
        raise ChallengeInvalid()

    answer_row = await db.scalar(
        select(AdminSecurityAnswer).where(
            AdminSecurityAnswer.user_id == challenge.user_id,
            AdminSecurityAnswer.security_question_id == challenge.security_question_id,
        )
    )

    if answer_row is None or not verify_password(_normalize_answer(submitted_answer), answer_row.hashed_answer):
        challenge.attempts += 1
        if challenge.attempts >= MAX_ATTEMPTS:
            await db.delete(challenge)
            raise ChallengeInvalid()
        raise ChallengeAnswerIncorrect(attempts_remaining=MAX_ATTEMPTS - challenge.attempts)

    user = await db.get(User, challenge.user_id)
    await db.delete(challenge)
    if user is None:
        raise ChallengeInvalid()
    return user


def set_password_after_verification(user: User, new_password: str) -> None:
    user.hashed_password = hash_password(new_password)


async def upsert_security_answers(db: AsyncSession, admin_user_id: int, answers: list[tuple[int, str]]) -> None:
    for question_id, answer in answers:
        existing = await db.scalar(
            select(AdminSecurityAnswer).where(
                AdminSecurityAnswer.user_id == admin_user_id,
                AdminSecurityAnswer.security_question_id == question_id,
            )
        )
        hashed = hash_password(_normalize_answer(answer))
        if existing is not None:
            existing.hashed_answer = hashed
        else:
            db.add(
                AdminSecurityAnswer(user_id=admin_user_id, security_question_id=question_id, hashed_answer=hashed)
            )
