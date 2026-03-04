import json
from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import (
    Agent,
    Workflow,
    WAgent,
    WAgentVersion,
    DataSource,
    LLMConfig,
    NotificationChannel,
    SystemSetting,
    NotificationPref,
    NotificationGlobalPref,
)

router = APIRouter(prefix="/config", tags=["config-import-export"])


@router.get("/export")
async def export_configs(
    db: AsyncSession = Depends(get_db),
):
    agents = (await db.execute(select(Agent))).scalars().all()
    workflows = (await db.execute(select(Workflow))).scalars().all()
    wagents = (await db.execute(select(WAgent))).scalars().all()
    wagent_versions = (await db.execute(select(WAgentVersion))).scalars().all()
    datasources = (await db.execute(select(DataSource))).scalars().all()
    llm_configs = (await db.execute(select(LLMConfig))).scalars().all()
    channels = (await db.execute(select(NotificationChannel))).scalars().all()
    settings = (await db.execute(select(SystemSetting))).scalars().all()
    prefs = (await db.execute(select(NotificationPref))).scalars().all()
    global_prefs = (await db.execute(select(NotificationGlobalPref))).scalars().all()

    def to_dict(obj):
        return {c.key: getattr(obj, c.key) for c in obj.__table__.columns}

    data = {
        "agents": [to_dict(a) for a in agents],
        "workflows": [to_dict(w) for w in workflows],
        "wagents": [to_dict(wa) for wa in wagents],
        "wagent_versions": [to_dict(wv) for wv in wagent_versions],
        "datasources": [to_dict(d) for d in datasources],
        "llm_configs": [to_dict(l) for l in llm_configs],
        "notification_channels": [to_dict(c) for c in channels],
        "system_settings": [to_dict(s) for s in settings],
        "notification_prefs": [to_dict(p) for p in prefs],
        "notification_global_prefs": [to_dict(g) for g in global_prefs],
    }
    return {"code": 200, "message": "success", "data": data}


@router.post("/import/preview")
async def preview_import(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    content = await file.read()
    try:
        data = json.loads(content.decode("utf-8"))
    except Exception as e:
        return {"code": 400, "message": str(e), "data": None}
    preview = {
        "agents": len(data.get("agents", [])),
        "workflows": len(data.get("workflows", [])),
        "wagents": len(data.get("wagents", [])),
        "wagent_versions": len(data.get("wagent_versions", [])),
        "datasources": len(data.get("datasources", [])),
        "llm_configs": len(data.get("llm_configs", [])),
        "notification_channels": len(data.get("notification_channels", [])),
    }
    return {"code": 200, "message": "success", "data": preview}


@router.post("/import")
async def import_configs(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    content = await file.read()
    try:
        data = json.loads(content.decode("utf-8"))
    except Exception as e:
        return {"code": 400, "message": str(e), "data": None}
    imported = {}
    col_names = lambda m: {c.key for c in m.__table__.columns}
    for key, model in [
        ("agents", Agent),
        ("workflows", Workflow),
        ("wagents", WAgent),
        ("wagent_versions", WAgentVersion),
        ("datasources", DataSource),
        ("llm_configs", LLMConfig),
        ("notification_channels", NotificationChannel),
        ("system_settings", SystemSetting),
        ("notification_prefs", NotificationPref),
        ("notification_global_prefs", NotificationGlobalPref),
    ]:
        items = data.get(key, [])
        cols = col_names(model)
        for item in items:
            filtered = {k: v for k, v in item.items() if k in cols}
            if filtered:
                obj = model(**filtered)
                db.add(obj)
        imported[key] = len(items)
    await db.flush()
    return {"code": 200, "message": "success", "data": imported}
