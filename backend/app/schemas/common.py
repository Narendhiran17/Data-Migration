import uuid
from typing import Generic, TypeVar, Optional, Any
from pydantic import BaseModel, Field

T = TypeVar("T")

class ErrorDetails(BaseModel):
    code: str
    details: Any

class APIResponse(BaseModel, Generic[T]):
    success: bool = True
    message: str = "Operation successful"
    data: Optional[T] = None
    error: Optional[ErrorDetails] = None
    request_id: str = Field(default_factory=lambda: str(uuid.uuid4()))

class PaginatedData(BaseModel, Generic[T]):
    items: list[T]
    total: int
    page: int
    page_size: int
    total_pages: int
