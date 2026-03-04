from pydantic import BaseModel
from datetime import datetime
from typing import Optional

from app.schemas.agent import ParamDefinition


class WorkflowCreate(BaseModel):
    name: str
    description: str | None = None
    capability_tags: list[str] = []
    dify_endpoint: str
    dify_api_key: str
    input_params: list[ParamDefinition] = []
    output_params: list[ParamDefinition] = []
    timeout_seconds: int = 300


class WorkflowUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    capability_tags: Optional[list[str]] = None
    dify_endpoint: Optional[str] = None
    dify_api_key: Optional[str] = None
    input_params: Optional[list[ParamDefinition]] = None
    output_params: Optional[list[ParamDefinition]] = None
    timeout_seconds: Optional[int] = None


class WorkflowResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: str
    name: str
    description: str | None = None
    capability_tags: list[str] = []
    dify_endpoint: str
    dify_api_key: str
    input_params: list[ParamDefinition] = []
    output_params: list[ParamDefinition] = []
    timeout_seconds: int = 300
    is_enabled: bool = True
    created_at: datetime
    updated_at: datetime
    user_id: str | None = None


class WorkflowListResponse(BaseModel):
    items: list[WorkflowResponse] = []
