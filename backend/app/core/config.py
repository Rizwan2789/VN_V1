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

    # "log" writes to the email_log table instead of really sending — the only
    # backend implemented today. A future "smtp" value is the one seam where
    # real SMTP settings would get added, without touching any call site.
    email_backend: str = "log"
    email_from_address: str = "no-reply@vistanova.example.com"

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
