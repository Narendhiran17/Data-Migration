from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict

class SourceFileUploadResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    file_id: str = Field(..., validation_alias="id")
    project_id: str
    original_filename: str
    file_format: str
    file_size: int
    checksum: str
    status: str
    uploaded_at: datetime

class ColumnProfile(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    column_name: str
    inferred_type: str
    nullable: bool
    null_count: int
    null_percentage: float
    distinct_count: int
    unique_percentage: float
    duplicate_count: int
    invalid_format_count: int
    min_value: Optional[str] = None
    max_value: Optional[str] = None
    is_candidate_identifier: bool = False
    is_candidate_email: bool = False
    is_candidate_phone: bool = False
    is_candidate_date: bool = False
    sample_values: List[Any] = []

class SheetProfile(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    sheet_name: str
    total_rows: int
    total_columns: int
    columns: List[ColumnProfile]
    duplicate_rows_count: int = 0

class SourceProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    file_id: str
    original_filename: str
    file_format: str
    status: str
    total_rows: int
    total_columns: int
    detected_sheets: int
    sheets: List[SheetProfile]

class RecordPreviewResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    file_id: str
    sheet_name: str
    total_rows: int
    page: int
    page_size: int
    total_pages: int
    columns: List[str]
    records: List[Dict[str, Any]]
