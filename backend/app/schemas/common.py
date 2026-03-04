from pydantic import BaseModel, Field
from typing import TypeVar, Generic, Optional

T = TypeVar("T")


class PaginationParams(BaseModel):
    page: int = Field(1, ge=1)
    size: int = Field(20, ge=1, le=100)


class APIResponse(BaseModel, Generic[T]):
    code: int = 200
    message: str = "success"
    data: Optional[T] = None


class PaginatedData(BaseModel, Generic[T]):
    items: list[T] = []
    total: int = 0
    page: int = 1
    size: int = 20
    pages: int = 0
