from sqlalchemy import Boolean, JSON, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class NotificationChannel(TimestampMixin, Base):
    __tablename__ = "notification_channels"
    channel_type: Mapped[str] = mapped_column(String(20), nullable=False, unique=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    dify_endpoint: Mapped[str] = mapped_column(String(500), nullable=False)
    dify_api_key: Mapped[str] = mapped_column(String(500), nullable=False)
    input_mapping: Mapped[dict] = mapped_column(JSON, nullable=False)
    is_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
