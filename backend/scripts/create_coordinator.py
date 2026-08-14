"""Create or update a coordinator account with a real login and password.

Run with: python -m scripts.create_coordinator (from the backend/ directory, venv active)
Prompts for the email, full name, and password (hidden input) — nothing is
hardcoded or written to disk by this script, so it's safe to keep in git.
"""

import asyncio
from getpass import getpass

from sqlalchemy import select

from app.core.security import hash_password
from app.db.session import AsyncSessionLocal
from app.models.user import User


async def create_coordinator() -> None:
    login_id = input("Login email: ").strip()
    full_name = input("Full name: ").strip()
    password = getpass("Password: ")
    confirm = getpass("Confirm password: ")

    if password != confirm:
        print("Passwords did not match — nothing changed.")
        return
    if len(password) < 8:
        print("Password must be at least 8 characters — nothing changed.")
        return

    async with AsyncSessionLocal() as db:
        existing = await db.scalar(select(User).where(User.login_id == login_id))
        if existing is not None:
            existing.hashed_password = hash_password(password)
            existing.full_name = full_name
            existing.role = "coordinator"
            existing.is_active = True
            print(f"Updated existing account: {login_id}")
        else:
            db.add(
                User(
                    login_id=login_id,
                    email=login_id,
                    hashed_password=hash_password(password),
                    role="coordinator",
                    full_name=full_name,
                )
            )
            print(f"Created new coordinator: {login_id}")

        await db.commit()


if __name__ == "__main__":
    asyncio.run(create_coordinator())
