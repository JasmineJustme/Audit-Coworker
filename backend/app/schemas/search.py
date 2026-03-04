from pydantic import BaseModel
from typing import Optional

from app.schemas.agent import AgentResponse
from app.schemas.workflow import WorkflowResponse
from app.schemas.wagent import WAgentResponse
from app.schemas.todo import TodoResponse
from app.schemas.schedule import ScheduleTaskResponse
from app.schemas.message import MessageResponse


class SearchResult(BaseModel):
    type: str
    id: str
    title: str
    description: str | None = None


class SearchResponse(BaseModel):
    todos: list[TodoResponse] = []
    agents: list[AgentResponse] = []
    workflows: list[WorkflowResponse] = []
    wagents: list[WAgentResponse] = []
    tasks: list[ScheduleTaskResponse] = []
    messages: list[MessageResponse] = []
