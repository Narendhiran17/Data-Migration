from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict

class ProjectBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    source_type: str = Field(default="File", description="File, Database, or CRM")
    target_product: str = Field(default="CRM", description="CRM, Creator, Books, etc.")

class ProjectCreate(ProjectBase):
    workspace_id: Optional[str] = None

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    source_type: Optional[str] = None
    target_product: Optional[str] = None
    status: Optional[str] = None

class SourceFileSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    original_filename: str
    file_format: str
    file_size: int
    status: str
    uploaded_at: datetime

class ProjectResponse(ProjectBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    workspace_id: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime
    source_files: List[SourceFileSummary] = []
