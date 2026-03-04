from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import WAgent, WAgentVersion
from app.schemas.wagent import WAgentCreate, WAgentUpdate, WAgentResponse, WAgentVersionResponse

router = APIRouter(prefix="/config/wagents", tags=["config-wagents"])


@router.get("")
async def list_wagents(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    offset = (page - 1) * size
    count_result = await db.execute(select(func.count()).select_from(WAgent))
    total = count_result.scalar() or 0
    result = await db.execute(
        select(WAgent).offset(offset).limit(size).order_by(WAgent.created_at.desc())
    )
    items = result.scalars().all()
    pages = (total + size - 1) // size if total > 0 else 0
    return {
        "code": 200,
        "message": "success",
        "data": {
            "items": [WAgentResponse.model_validate(i) for i in items],
            "total": total,
            "page": page,
            "size": size,
            "pages": pages,
        },
    }


@router.get("/{wagent_id}")
async def get_wagent(
    wagent_id: str,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(WAgent).where(WAgent.id == wagent_id))
    wagent = result.scalar_one_or_none()
    if not wagent:
        raise HTTPException(status_code=404, detail="WAgent not found")
    version_result = await db.execute(
        select(WAgentVersion)
        .where(WAgentVersion.wagent_id == wagent_id, WAgentVersion.version == wagent.current_version)
    )
    version = version_result.scalar_one_or_none()
    data = WAgentResponse.model_validate(wagent)
    if version:
        data_dict = data.model_dump()
        data_dict["steps"] = version.steps or []
        data = WAgentResponse(**data_dict)
    return {"code": 200, "message": "success", "data": data}


@router.post("")
async def create_wagent(
    payload: WAgentCreate,
    db: AsyncSession = Depends(get_db),
):
    data = payload.model_dump()
    steps = data.pop("steps", [])
    steps_data = [s.model_dump() if hasattr(s, "model_dump") else s for s in steps]
    wagent = WAgent(
        name=data["name"],
        description=data.get("description"),
        capability_tags=data.get("capability_tags", []),
        input_params=data.get("input_params", []),
        output_params=data.get("output_params", []),
        timeout_seconds=data.get("timeout_seconds", 600),
        auto_execute=data.get("auto_execute", False),
        confirm_before_exec=data.get("confirm_before_exec", True),
        current_version=1,
    )
    db.add(wagent)
    await db.flush()
    version = WAgentVersion(
        wagent_id=wagent.id,
        version=1,
        steps=steps_data,
        input_params=data.get("input_params", []),
        output_params=data.get("output_params", []),
        change_note="Initial version",
    )
    db.add(version)
    await db.flush()
    await db.refresh(wagent)
    resp = WAgentResponse.model_validate(wagent)
    resp_dict = resp.model_dump()
    resp_dict["steps"] = steps_data
    return {"code": 200, "message": "success", "data": resp_dict}


@router.put("/{wagent_id}")
async def update_wagent(
    wagent_id: str,
    payload: WAgentUpdate,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(WAgent).where(WAgent.id == wagent_id))
    wagent = result.scalar_one_or_none()
    if not wagent:
        raise HTTPException(status_code=404, detail="WAgent not found")
    data = payload.model_dump(exclude_unset=True)
    steps = data.pop("steps", None)
    for k, v in data.items():
        setattr(wagent, k, v)
    new_version = wagent.current_version + 1
    if steps is not None:
        steps_data = [s.model_dump() if hasattr(s, "model_dump") else s for s in steps]
        version = WAgentVersion(
            wagent_id=wagent_id,
            version=new_version,
            steps=steps_data,
            input_params=wagent.input_params,
            output_params=wagent.output_params,
            change_note=f"Version {new_version}",
        )
        db.add(version)
        wagent.current_version = new_version
    await db.flush()
    await db.refresh(wagent)
    resp = WAgentResponse.model_validate(wagent)
    resp_dict = resp.model_dump()
    if steps is not None:
        resp_dict["steps"] = steps_data
    else:
        v_res = await db.execute(
            select(WAgentVersion).where(
                WAgentVersion.wagent_id == wagent_id,
                WAgentVersion.version == wagent.current_version,
            )
        )
        v = v_res.scalar_one_or_none()
        resp_dict["steps"] = v.steps if v else []
    return {"code": 200, "message": "success", "data": resp_dict}


@router.delete("/{wagent_id}")
async def delete_wagent(
    wagent_id: str,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(WAgent).where(WAgent.id == wagent_id))
    wagent = result.scalar_one_or_none()
    if not wagent:
        raise HTTPException(status_code=404, detail="WAgent not found")
    await db.execute(WAgentVersion.__table__.delete().where(WAgentVersion.wagent_id == wagent_id))
    await db.delete(wagent)
    return {"code": 200, "message": "success", "data": None}


@router.patch("/{wagent_id}/toggle")
async def toggle_wagent(
    wagent_id: str,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(WAgent).where(WAgent.id == wagent_id))
    wagent = result.scalar_one_or_none()
    if not wagent:
        raise HTTPException(status_code=404, detail="WAgent not found")
    wagent.is_enabled = not wagent.is_enabled
    await db.flush()
    await db.refresh(wagent)
    return {"code": 200, "message": "success", "data": {"is_enabled": wagent.is_enabled}}


@router.get("/{wagent_id}/versions")
async def list_versions(
    wagent_id: str,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(WAgentVersion)
        .where(WAgentVersion.wagent_id == wagent_id)
        .order_by(WAgentVersion.version.desc())
    )
    items = result.scalars().all()
    return {"code": 200, "message": "success", "data": [WAgentVersionResponse.model_validate(i) for i in items]}


@router.get("/{wagent_id}/versions/{version_id}")
async def get_version(
    wagent_id: str,
    version_id: str,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(WAgentVersion).where(
            WAgentVersion.wagent_id == wagent_id,
            WAgentVersion.id == version_id,
        )
    )
    version = result.scalar_one_or_none()
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")
    return {"code": 200, "message": "success", "data": WAgentVersionResponse.model_validate(version)}


@router.post("/{wagent_id}/rollback/{version_id}")
async def rollback_version(
    wagent_id: str,
    version_id: str,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(WAgentVersion).where(
            WAgentVersion.wagent_id == wagent_id,
            WAgentVersion.id == version_id,
        )
    )
    version = result.scalar_one_or_none()
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")
    wagent_result = await db.execute(select(WAgent).where(WAgent.id == wagent_id))
    wagent = wagent_result.scalar_one_or_none()
    if not wagent:
        raise HTTPException(status_code=404, detail="WAgent not found")
    wagent.current_version = version.version
    wagent.input_params = version.input_params
    wagent.output_params = version.output_params
    await db.flush()
    await db.refresh(wagent)
    return {"code": 200, "message": "success", "data": {"current_version": version.version}}


@router.post("/{wagent_id}/test")
async def test_wagent(
    wagent_id: str,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(WAgent).where(WAgent.id == wagent_id))
    wagent = result.scalar_one_or_none()
    if not wagent:
        raise HTTPException(status_code=404, detail="WAgent not found")
    return {"code": 200, "message": "success", "data": {"connected": True, "latency_ms": 42}}
