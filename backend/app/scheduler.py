import logging
from datetime import date

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy import update

from app.db.session import AsyncSessionLocal
from app.models.fee_record import FeeRecord

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()


async def sweep_overdue_fee_records() -> None:
    today = date.today()
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            update(FeeRecord)
            .where(FeeRecord.status == "PENDING", FeeRecord.due_date < today)
            .values(status="OVERDUE")
        )
        await db.commit()
        if result.rowcount:
            logger.info("Marked %d fee record(s) overdue", result.rowcount)


def start_scheduler() -> None:
    scheduler.add_job(
        sweep_overdue_fee_records, "cron", hour=0, minute=5, id="sweep_overdue", replace_existing=True
    )
    scheduler.start()


def stop_scheduler() -> None:
    scheduler.shutdown(wait=False)
