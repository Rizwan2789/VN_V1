"""Create or update the admin account with a real login and password.

Run with: python -m scripts.create_admin (from the backend/ directory, venv active)
Prompts for the email, full name, and password (hidden input) — nothing is
hardcoded or written to disk by this script, so it's safe to keep in git.

Only one admin is expected to exist today, but nothing here enforces that —
running this again with a different login_id just creates a second admin.
"""

import asyncio
from getpass import getpass

from sqlalchemy import select

from app.core.security import hash_password
from app.db.session import AsyncSessionLocal
from app.models.user import User


async def create_admin() -> None:
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
            existing.role = "admin"
            existing.is_active = True
            print(f"Updated existing account: {login_id}")
        else:
            db.add(
                User(
                    login_id=login_id,
                    email=login_id,
                    hashed_password=hash_password(password),
                    role="admin",
                    full_name=full_name,
                )
            )
            print(f"Created new admin: {login_id}")

        await db.commit()

    print(
        "Reminder: sign in and set up the 5 security-question answers before "
        "relying on the admin forgot-password flow — it can't work until then."
    )


if __name__ == "__main__":
    asyncio.run(create_admin())
