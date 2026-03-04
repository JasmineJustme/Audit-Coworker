from pydantic import BaseModel
from typing import Optional, Any


class SystemSettingsUpdate(BaseModel):
    settings: dict[str, Any] = {}


class NotificationPrefUpdate(BaseModel):
    message_type: str
    in_app_enabled: bool
    email_enabled: bool
    wechat_enabled: bool


class NotificationGlobalPrefUpdate(BaseModel):
    dnd_start: Optional[str] = None
    dnd_end: Optional[str] = None
    merge_strategy: Optional[str] = None
    merge_window_minutes: Optional[int] = None
    deadline_advance_minutes: Optional[int] = None
