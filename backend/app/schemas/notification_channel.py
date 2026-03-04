from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class NotificationChannelUpdate(BaseModel):
    name: Optional[str] = None
    dify_endpoint: Optional[str] = None
    dify_api_key: Optional[str] = None
    input_mapping: Optional[dict] = None
    is_enabled: Optional[bool] = None


class NotificationChannelResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: str
    channel_type: str
    name: str
    dify_endpoint: str
    dify_api_key: str
    input_mapping: dict = {}
    is_enabled: bool = True
    created_at: datetime
    updated_at: datetime
