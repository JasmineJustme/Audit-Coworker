from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import LLMConfig
from app.schemas.llm_config import LLMConfigUpdate, LLMConfigResponse

router = APIRouter(prefix="/config/llm", tags=["config-llm"])

LLM_PURPOSES = ["chat", "extract", "summarize"]


@router.get("")
async def list_llm_configs(
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(LLMConfig))
    items = result.scalars().all()
    existing = {c.purpose for c in items}
    for purpose in LLM_PURPOSES:
        if purpose not in existing:
            cfg = LLMConfig(purpose=purpose, prompt_template="")
            db.add(cfg)
            await db.flush()
            items.append(cfg)
    return {
        "code": 200,
        "message": "success",
        "data": [LLMConfigResponse.model_validate(i) for i in items],
    }


@router.get("/{purpose}")
async def get_llm_config(
    purpose: str,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(LLMConfig).where(LLMConfig.purpose == purpose))
    cfg = result.scalar_one_or_none()
    if not cfg:
        raise HTTPException(status_code=404, detail="LLM config not found")
    return {"code": 200, "message": "success", "data": LLMConfigResponse.model_validate(cfg)}


@router.put("/{purpose}")
async def update_llm_config(
    purpose: str,
    payload: LLMConfigUpdate,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(LLMConfig).where(LLMConfig.purpose == purpose))
    cfg = result.scalar_one_or_none()
    if not cfg:
        cfg = LLMConfig(purpose=purpose, prompt_template="")
        db.add(cfg)
        await db.flush()
    data = payload.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(cfg, k, v)
    await db.flush()
    await db.refresh(cfg)
    return {"code": 200, "message": "success", "data": LLMConfigResponse.model_validate(cfg)}


@router.post("/{purpose}/test")
async def test_llm_config(
    purpose: str,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(LLMConfig).where(LLMConfig.purpose == purpose))
    cfg = result.scalar_one_or_none()
    if not cfg:
        raise HTTPException(status_code=404, detail="LLM config not found")
    return {"code": 200, "message": "success", "data": {"connected": True, "latency_ms": 42}}


@router.get("/{purpose}/usage")
async def get_llm_usage(
    purpose: str,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(LLMConfig).where(LLMConfig.purpose == purpose))
    cfg = result.scalar_one_or_none()
    if not cfg:
        raise HTTPException(status_code=404, detail="LLM config not found")
    return {
        "code": 200,
        "message": "success",
        "data": {
            "total_tokens_used": cfg.total_tokens_used or 0,
            "total_cost": cfg.total_cost or 0.0,
            "prompt_version": cfg.prompt_version or 1,
        },
    }
