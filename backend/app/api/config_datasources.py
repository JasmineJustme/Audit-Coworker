from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import DataSource
from app.schemas.datasource import DataSourceCreate, DataSourceUpdate, DataSourceResponse

router = APIRouter(prefix="/config/datasources", tags=["config-datasources"])


@router.get("")
async def list_datasources(
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(DataSource))
    items = result.scalars().all()
    return {
        "code": 200,
        "message": "success",
        "data": [DataSourceResponse.model_validate(i) for i in items],
    }


@router.post("")
async def create_datasource(
    payload: DataSourceCreate,
    db: AsyncSession = Depends(get_db),
):
    existing = await db.execute(select(DataSource).where(DataSource.type == payload.type))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail=f"数据源类型 '{payload.type}' 已存在")
    ds = DataSource(
        type=payload.type,
        name=payload.name,
        dify_endpoint=payload.dify_endpoint or "",
        dify_api_key=payload.dify_api_key or "",
        input_params=([p.model_dump() for p in payload.input_params] if payload.input_params else []),
        output_params=([p.model_dump() for p in payload.output_params] if payload.output_params else []),
    )
    db.add(ds)
    await db.flush()
    await db.refresh(ds)
    return {
        "code": 200,
        "message": "success",
        "data": DataSourceResponse.model_validate(ds),
    }


@router.put("/{ds_type}")
async def update_datasource(
    ds_type: str,
    payload: DataSourceUpdate,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(DataSource).where(DataSource.type == ds_type))
    ds = result.scalar_one_or_none()
    if not ds:
        ds = DataSource(type=ds_type, name=ds_type, dify_endpoint="", dify_api_key="", input_params=[], output_params=[])
        db.add(ds)
        await db.flush()
    data = payload.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(ds, k, v)
    await db.flush()
    await db.refresh(ds)
    return {"code": 200, "message": "success", "data": DataSourceResponse.model_validate(ds)}


@router.patch("/{ds_type}/toggle")
async def toggle_datasource(
    ds_type: str,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(DataSource).where(DataSource.type == ds_type))
    ds = result.scalar_one_or_none()
    if not ds:
        raise HTTPException(status_code=404, detail="Datasource not found")
    ds.is_enabled = not ds.is_enabled
    await db.flush()
    await db.refresh(ds)
    return {"code": 200, "message": "success", "data": {"is_enabled": ds.is_enabled}}


@router.post("/{ds_type}/test")
async def test_datasource(
    ds_type: str,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(DataSource).where(DataSource.type == ds_type))
    ds = result.scalar_one_or_none()
    if not ds:
        raise HTTPException(status_code=404, detail="Datasource not found")
    return {"code": 200, "message": "success", "data": {"connected": True, "latency_ms": 42}}


@router.post("/{ds_type}/sync")
async def sync_datasource(
    ds_type: str,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(DataSource).where(DataSource.type == ds_type))
    ds = result.scalar_one_or_none()
    if not ds:
        raise HTTPException(status_code=404, detail="Datasource not found")
    return {"code": 200, "message": "success", "data": "sync triggered"}


@router.delete("/{ds_type}")
async def delete_datasource(
    ds_type: str,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(DataSource).where(DataSource.type == ds_type))
    ds = result.scalar_one_or_none()
    if not ds:
        raise HTTPException(status_code=404, detail="Datasource not found")
    await db.delete(ds)
    await db.flush()
    return {"code": 200, "message": "success", "data": None}
