from pydantic import BaseModel
from datetime import datetime
from typing import Optional

from app.schemas.agent import ParamDefinition


class WAgentStepMapping(BaseModel):
    source: str
    upstream_step: int | None = None
    upstream_param: str | None = None
    fixed_value: str | None = None


class WAgentStep(BaseModel):
    order: int
    workflow_id: str
    workflow_name: str
    execution_mode: str = "serial"
    param_mapping: dict[str, WAgentStepMapping] = {}


class WAgentCreate(BaseModel):
    name: str
    description: str | None = None
    capability_tags: list[str] = []
    input_params: list[ParamDefinition] = []
    output_params: list[ParamDefinition] = []
    timeout_seconds: int = 600
    auto_execute: bool = False
    confirm_before_exec: bool = True
    steps: list[WAgentStep] = []


class WAgentUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    capability_tags: Optional[list[str]] = None
    input_params: Optional[list[ParamDefinition]] = None
    output_params: Optional[list[ParamDefinition]] = None
    timeout_seconds: Optional[int] = None
    auto_execute: Optional[bool] = None
    confirm_before_exec: Optional[bool] = None
    steps: Optional[list[WAgentStep]] = None


class WAgentResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: str
    name: str
    description: str | None = None
    capability_tags: list[str] = []
    input_params: list[ParamDefinition] = []
    output_params: list[ParamDefinition] = []
    timeout_seconds: int = 600
    auto_execute: bool = False
    confirm_before_exec: bool = True
    steps: list[WAgentStep] = []
    current_version: int = 1
    is_enabled: bool = True
    source: str | None = None
    call_count: int = 0
    success_count: int = 0
    created_at: datetime
    updated_at: datetime


class WAgentVersionResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: str
    wagent_id: str
    version: int
    steps: list[WAgentStep] = []
    input_params: list[ParamDefinition] = []
    output_params: list[ParamDefinition] = []
    change_note: str | None = None
    created_at: datetime
