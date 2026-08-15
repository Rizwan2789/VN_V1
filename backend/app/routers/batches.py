from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db, require_role
from app.models.batch import Batch
from app.schemas.batch import BatchResponse

router = APIRouter(prefix="/api/batches", tags=["batches"])


@router.get("", response_model=list[BatchResponse])
async def list_batches(
    db: AsyncSession = Depends(get_db),
    _=Depends(require_role("coordinator", "student")),
) -> list[Batch]:
    result = await db.execute(select(Batch).order_by(Batch.grade_level))
    return list(result.scalars().all())


@router.get("/public", response_model=list[BatchResponse])
async def list_batches_public(db: AsyncSession = Depends(get_db)) -> list[Batch]:
    """Unauthenticated — the self-signup form needs a class picker before
    there's any session to authenticate. Same minimal fields as the
    authenticated list; nothing sensitive lives on Batch."""
    result = await db.execute(select(Batch).order_by(Batch.grade_level))
    return list(result.scalars().all())
