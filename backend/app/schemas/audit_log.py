from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class AuditLogResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: str
    action: str
    resource_type: str
    resource_id: str | None = None
    resource_name: str | None = None
    details: dict | None = None
    ip_address: str | None = None
    user_id: str
    created_at: datetime
