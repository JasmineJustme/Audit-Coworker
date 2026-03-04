from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import SystemSetting, NotificationPref, NotificationGlobalPref
from app.schemas.settings import (
    SystemSettingsUpdate,
    NotificationPrefUpdate,
    NotificationGlobalPrefUpdate,
)

router = APIRouter(prefix="/settings", tags=["settings"])


@router.get("")
async def get_settings(
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(SystemSetting))
    items = result.scalars().all()
    data = {s.key: s.value for s in items}
    return {"code": 200, "message": "success", "data": data}


@router.put("")
async def update_settings(
    payload: SystemSettingsUpdate,
    db: AsyncSession = Depends(get_db),
):
    for key, value in payload.settings.items():
        result = await db.execute(select(SystemSetting).where(SystemSetting.key == key))
        setting = result.scalar_one_or_none()
        if setting:
            setting.value = value if isinstance(value, dict) else {"value": value}
        else:
            setting = SystemSetting(key=key, value=value if isinstance(value, dict) else {"value": value})
            db.add(setting)
    await db.flush()
    return {"code": 200, "message": "success", "data": None}


@router.get("/notification-prefs")
async def get_notification_prefs(
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(NotificationPref))
    items = result.scalars().all()
    data = [
        {
            "message_type": p.message_type,
            "in_app_enabled": p.in_app_enabled,
            "email_enabled": p.email_enabled,
            "wechat_enabled": p.wechat_enabled,
        }
        for p in items
    ]
    return {"code": 200, "message": "success", "data": data}


@router.put("/notification-prefs")
async def update_notification_prefs(
    payload: NotificationPrefUpdate,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(NotificationPref).where(
            NotificationPref.message_type == payload.message_type,
        )
    )
    pref = result.scalar_one_or_none()
    if pref:
        pref.in_app_enabled = payload.in_app_enabled
        pref.email_enabled = payload.email_enabled
        pref.wechat_enabled = payload.wechat_enabled
    else:
        pref = NotificationPref(
            message_type=payload.message_type,
            in_app_enabled=payload.in_app_enabled,
            email_enabled=payload.email_enabled,
            wechat_enabled=payload.wechat_enabled,
        )
        db.add(pref)
    await db.flush()
    return {"code": 200, "message": "success", "data": None}


@router.get("/notification-global")
async def get_notification_global(
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(NotificationGlobalPref).limit(1))
    pref = result.scalar_one_or_none()
    if not pref:
        return {
            "code": 200,
            "message": "success",
            "data": {
                "dnd_start": None,
                "dnd_end": None,
                "merge_strategy": "none",
                "merge_window_minutes": 5,
                "deadline_advance_minutes": 60,
            },
        }
    return {
        "code": 200,
        "message": "success",
        "data": {
            "dnd_start": pref.dnd_start,
            "dnd_end": pref.dnd_end,
            "merge_strategy": pref.merge_strategy,
            "merge_window_minutes": pref.merge_window_minutes,
            "deadline_advance_minutes": pref.deadline_advance_minutes,
        },
    }


@router.put("/notification-global")
async def update_notification_global(
    payload: NotificationGlobalPrefUpdate,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(NotificationGlobalPref).limit(1))
    pref = result.scalar_one_or_none()
    if pref:
        data = payload.model_dump(exclude_unset=True)
        for k, v in data.items():
            setattr(pref, k, v)
    else:
        pref = NotificationGlobalPref(**payload.model_dump())
        db.add(pref)
    await db.flush()
    return {"code": 200, "message": "success", "data": None}
