from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "Vista Nova Fee Management API"
    environment: str = "development"

    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5434/vistanova_dev"

    jwt_secret_key: str = "change-me-in-.env"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 480  # 8h

    cors_origins: list[str] = ["http://localhost:4200"]

    # "log" writes to the email_log table instead of really sending. "smtp"
    # sends via SmtpEmailService — works from most networks, but many hosts
    # (Render's free tier included) block outbound SMTP ports entirely, in
    # which case use "resend" (ResendEmailService), which sends over HTTPS.
    email_backend: str = "log"
    email_from_address: str = "no-reply@vistanova.example.com"

    # Only read when email_backend == "smtp". Gmail: smtp.gmail.com, port 587,
    # smtp_username is the full @gmail.com address, smtp_password is a 16-char
    # App Password (not the account password — see docs/email-setup.md).
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_username: str = ""
    smtp_password: str = ""
    smtp_use_tls: bool = True

    # Only read when email_backend == "resend". Get a key at resend.com —
    # note the free tier can only send to your own account's email address
    # until a sending domain is verified via DNS records in their dashboard.
    resend_api_key: str = ""

    @field_validator("database_url")
    @classmethod
    def normalize_database_url(cls, value: str) -> str:
        # Hosted Postgres providers (Neon, Vercel Postgres, etc.) commonly hand out
        # "postgres://" or "postgresql://" URLs; the app's async engine needs the
        # asyncpg driver scheme explicitly.
        if value.startswith("postgres://"):
            return value.replace("postgres://", "postgresql+asyncpg://", 1)
        if value.startswith("postgresql://"):
            return value.replace("postgresql://", "postgresql+asyncpg://", 1)
        return value


@lru_cache
def get_settings() -> Settings:
    return Settings()
