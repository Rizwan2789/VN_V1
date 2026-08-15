from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.routers import (
    admin,
    auth,
    batches,
    dashboard,
    fees,
    password_reset_requests,
    payments,
    signup_requests,
    students,
)
from app.scheduler import start_scheduler, stop_scheduler

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    start_scheduler()
    yield
    stop_scheduler()


app = FastAPI(title=settings.app_name, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(batches.router)
app.include_router(students.router)
app.include_router(fees.router)
app.include_router(payments.router)
app.include_router(dashboard.router)
app.include_router(signup_requests.router)
app.include_router(password_reset_requests.router)
app.include_router(admin.router)


@app.get("/api/health")
def health_check() -> dict:
    return {"status": "ok", "app": settings.app_name}
