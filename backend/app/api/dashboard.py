from datetime import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/stats")
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db),
):
    return {
        "code": 200,
        "message": "success",
        "data": {
            "today_todos": 12,
            "pending_confirm": 3,
            "running": 1,
            "completed_today": 8,
            "failed": 0,
        },
    }


@router.get("/next-task")
async def get_next_task(
    db: AsyncSession = Depends(get_db),
):
    return {
        "code": 200,
        "message": "success",
        "data": {
            "id": "mock-task-id",
            "name": "Review audit report",
            "scheduled_at": datetime.utcnow().isoformat(),
        },
    }


@router.get("/trend")
async def get_trend(
    db: AsyncSession = Depends(get_db),
):
    return {
        "code": 200,
        "message": "success",
        "data": [
            {"date": "2025-03-01", "completed": 5, "pending": 10},
            {"date": "2025-03-02", "completed": 8, "pending": 7},
            {"date": "2025-03-03", "completed": 12, "pending": 3},
        ],
    }


@router.get("/agent-ranking")
async def get_agent_ranking(
    db: AsyncSession = Depends(get_db),
):
    return {
        "code": 200,
        "message": "success",
        "data": [
            {"agent_id": "a1", "name": "Agent A", "success_count": 45, "rank": 1},
            {"agent_id": "a2", "name": "Agent B", "success_count": 32, "rank": 2},
        ],
    }


@router.get("/sync-status")
async def get_sync_status(
    db: AsyncSession = Depends(get_db),
):
    return {
        "code": 200,
        "message": "success",
        "data": {
            "email": {"last_sync": "2025-03-03T10:00:00Z", "status": "success"},
            "wechat": {"last_sync": "2025-03-03T09:30:00Z", "status": "success"},
            "in_app": {"last_sync": None, "status": "idle"},
        },
    }
