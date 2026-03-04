from sqlalchemy import JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class Workflow(TimestampMixin, Base):
    __tablename__ = "workflows"
    name: Mapped[str] = mapped_column(String(200), nullable=False, unique=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    capability_tags: Mapped[dict | None] = mapped_column(JSON, default=list)
    dify_endpoint: Mapped[str] = mapped_column(String(500), nullable=False)
    dify_api_key: Mapped[str] = mapped_column(String(500), nullable=False)
    input_params: Mapped[dict] = mapped_column(JSON, nullable=False)
    output_params: Mapped[dict] = mapped_column(JSON, nullable=False)
    timeout_seconds: Mapped[int] = mapped_column(default=300)
    is_enabled: Mapped[bool] = mapped_column(default=True)
