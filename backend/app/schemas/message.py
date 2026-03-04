from pydantic import BaseModel
from datetime import datetime


class MessageResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: str
    type: str
    title: str
    content: str
    status: str
    related_type: str | None = None
    related_id: str | None = None
    action_url: str | None = None
    external_pushed: bool = False
    created_at: datetime
