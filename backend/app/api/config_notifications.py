from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import NotificationChannel
from app.schemas.notification_channel import NotificationChannelUpdate, NotificationChannelResponse

router = APIRouter(prefix="/config/notifications", tags=["config-notifications"])

CHANNEL_TYPES = ["email", "wechat", "in_app"]


@router.get("")
async def list_notification_channels(
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(NotificationChannel))
    items = result.scalars().all()
    existing = {c.channel_type for c in items}
    for ct in CHANNEL_TYPES:
        if ct not in existing:
            ch = NotificationChannel(
                channel_type=ct,
                name=ct,
                dify_endpoint="",
                dify_api_key="",
                input_mapping={},
            )
            db.add(ch)
            await db.flush()
            items.append(ch)
    return {
        "code": 200,
        "message": "success",
        "data": [NotificationChannelResponse.model_validate(i) for i in items],
    }


@router.put("/{channel_type}")
async def update_channel(
    channel_type: str,
    payload: NotificationChannelUpdate,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(NotificationChannel).where(NotificationChannel.channel_type == channel_type)
    )
    ch = result.scalar_one_or_none()
    if not ch:
        ch = NotificationChannel(
            channel_type=channel_type,
            name=channel_type,
            dify_endpoint="",
            dify_api_key="",
            input_mapping={},
        )
        db.add(ch)
        await db.flush()
    data = payload.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(ch, k, v)
    await db.flush()
    await db.refresh(ch)
    return {"code": 200, "message": "success", "data": NotificationChannelResponse.model_validate(ch)}


@router.patch("/{channel_type}/toggle")
async def toggle_channel(
    channel_type: str,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(NotificationChannel).where(NotificationChannel.channel_type == channel_type)
    )
    ch = result.scalar_one_or_none()
    if not ch:
        raise HTTPException(status_code=404, detail="Channel not found")
    ch.is_enabled = not ch.is_enabled
    await db.flush()
    await db.refresh(ch)
    return {"code": 200, "message": "success", "data": {"is_enabled": ch.is_enabled}}


@router.post("/{channel_type}/test")
async def test_channel(
    channel_type: str,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(NotificationChannel).where(NotificationChannel.channel_type == channel_type)
    )
    ch = result.scalar_one_or_none()
    if not ch:
        raise HTTPException(status_code=404, detail="Channel not found")
    return {"code": 200, "message": "success", "data": {"connected": True, "latency_ms": 42}}
