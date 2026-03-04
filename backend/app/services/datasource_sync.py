from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.datasource import DataSource
from app.services.dify_client import dify_client
from loguru import logger
from datetime import datetime


async def sync_all_datasources(db: AsyncSession):
    """Sync all enabled datasources and return combined data"""
    result = await db.execute(select(DataSource).where(DataSource.is_enabled == True))
    datasources = result.scalars().all()

    combined_data = {}
    for ds in datasources:
        try:
            ds.last_sync_status = "running"
            await db.flush()

            response = await dify_client.call_agent(
                ds.dify_endpoint,
                ds.dify_api_key,
                ds.input_params if isinstance(ds.input_params, dict) else {},
                timeout=120,
            )
            ds.sync_data_cache = response
            ds.last_sync_at = datetime.utcnow()
            ds.last_sync_status = "success"
            ds.last_sync_error = None
            combined_data[ds.type] = response
            logger.info(f"Datasource {ds.type} synced successfully")
        except Exception as e:
            ds.last_sync_status = "failed"
            ds.last_sync_error = str(e)
            logger.error(f"Datasource {ds.type} sync failed: {e}")

    await db.flush()
    return combined_data


async def sync_single_datasource(db: AsyncSession, ds_type: str):
    result = await db.execute(select(DataSource).where(DataSource.type == ds_type))
    ds = result.scalar_one_or_none()
    if not ds:
        return None
    try:
        ds.last_sync_status = "running"
        await db.flush()
        response = await dify_client.call_agent(
            ds.dify_endpoint, ds.dify_api_key, {}, timeout=120
        )
        ds.sync_data_cache = response
        ds.last_sync_at = datetime.utcnow()
        ds.last_sync_status = "success"
        ds.last_sync_error = None
        await db.flush()
        return response
    except Exception as e:
        ds.last_sync_status = "failed"
        ds.last_sync_error = str(e)
        await db.flush()
        return None
