from apscheduler.schedulers.asyncio import AsyncIOScheduler
from loguru import logger

scheduler = AsyncIOScheduler()


async def scheduler_tick() -> None:
    """Called every minute by APScheduler"""
    from app.database import async_session_factory
    from app.engine.scheduler import scheduler_engine

    async with async_session_factory() as db:
        try:
            await scheduler_engine.run_tick(db)
            await db.commit()
        except Exception as e:
            logger.error(f"Scheduler tick error: {e}")
            await db.rollback()


async def sync_tick() -> None:
    """Called periodically for datasource sync"""
    from app.database import async_session_factory
    from app.services.datasource_sync import sync_all_datasources

    async with async_session_factory() as db:
        try:
            await sync_all_datasources(db)
            await db.commit()
        except Exception as e:
            logger.error(f"Sync tick error: {e}")
            await db.rollback()


def start_scheduler() -> None:
    scheduler.add_job(scheduler_tick, "interval", minutes=1, id="scheduler_tick")
    scheduler.add_job(sync_tick, "interval", hours=1, id="sync_tick")
    scheduler.start()
    logger.info("APScheduler started")


def stop_scheduler() -> None:
    scheduler.shutdown()
    logger.info("APScheduler stopped")
