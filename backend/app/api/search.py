from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Todo, Agent, Workflow, WAgent, ScheduleTask, Message
from app.schemas.search import SearchResponse
from app.schemas.todo import TodoResponse
from app.schemas.agent import AgentResponse
from app.schemas.workflow import WorkflowResponse
from app.schemas.wagent import WAgentResponse
from app.schemas.schedule import ScheduleTaskResponse
from app.schemas.message import MessageResponse

router = APIRouter(prefix="", tags=["search"])


@router.get("/search")
async def search_modules(
    q: str = Query(..., min_length=1),
    db: AsyncSession = Depends(get_db),
):
    term = f"%{q}%"
    todos = (
        await db.execute(
            select(Todo).where(or_(Todo.title.ilike(term), Todo.description.ilike(term))).limit(20)
        )
    ).scalars().all()
    agents = (
        await db.execute(
            select(Agent).where(or_(Agent.name.ilike(term), Agent.description.ilike(term))).limit(20)
        )
    ).scalars().all()
    workflows = (
        await db.execute(
            select(Workflow).where(or_(Workflow.name.ilike(term), Workflow.description.ilike(term))).limit(20)
        )
    ).scalars().all()
    wagents = (
        await db.execute(
            select(WAgent).where(or_(WAgent.name.ilike(term), WAgent.description.ilike(term))).limit(20)
        )
    ).scalars().all()
    messages = (
        await db.execute(
            select(Message).where(or_(Message.title.ilike(term), Message.content.ilike(term))).limit(20)
        )
    ).scalars().all()
    tasks = (
        await db.execute(select(ScheduleTask).limit(20))
    ).scalars().all()

    return {
        "code": 200,
        "message": "success",
        "data": SearchResponse(
            todos=[TodoResponse.model_validate(t) for t in todos],
            agents=[AgentResponse.model_validate(a) for a in agents],
            workflows=[WorkflowResponse.model_validate(w) for w in workflows],
            wagents=[WAgentResponse.model_validate(wa) for wa in wagents],
            tasks=[ScheduleTaskResponse.model_validate(st) for st in tasks],
            messages=[MessageResponse.model_validate(m) for m in messages],
        ).model_dump(),
    }
