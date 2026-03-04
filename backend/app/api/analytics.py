from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/agent-stats")
async def get_agent_stats(
    db: AsyncSession = Depends(get_db),
):
    return {
        "code": 200,
        "message": "success",
        "data": {
            "total_calls": 150,
            "success_rate": 0.92,
            "by_agent": [
                {"agent_id": "a1", "name": "Agent A", "calls": 80, "success": 75},
                {"agent_id": "a2", "name": "Agent B", "calls": 70, "success": 63},
            ],
        },
    }


@router.get("/task-stats")
async def get_task_stats(
    db: AsyncSession = Depends(get_db),
):
    return {
        "code": 200,
        "message": "success",
        "data": {
            "pending": 15,
            "completed_today": 25,
            "failed": 2,
            "avg_duration_ms": 1200,
        },
    }


@router.get("/llm-usage")
async def get_llm_usage(
    db: AsyncSession = Depends(get_db),
):
    return {
        "code": 200,
        "message": "success",
        "data": {
            "total_tokens": 50000,
            "total_cost": 1.25,
            "by_purpose": [
                {"purpose": "chat", "tokens": 30000, "cost": 0.75},
                {"purpose": "extract", "tokens": 15000, "cost": 0.38},
                {"purpose": "summarize", "tokens": 5000, "cost": 0.12},
            ],
        },
    }
