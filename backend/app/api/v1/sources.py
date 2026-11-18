from typing import Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services.source_service import SourceService
from app.schemas.source import (
    SourceFileUploadResponse,
    SourceProfileResponse,
    RecordPreviewResponse
)
from app.schemas.common import APIResponse

router = APIRouter(prefix="/sources", tags=["Source Data Ingestion"])

@router.post("/upload", response_model=APIResponse[SourceFileUploadResponse], status_code=status.HTTP_201_CREATED)
async def upload_source_file(
    project_id: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    service = SourceService(db)
    result = await service.save_uploaded_file(project_id=project_id, file=file)
    return APIResponse(message="File uploaded successfully", data=result)

@router.post("/{file_id}/analyse", response_model=APIResponse[SourceProfileResponse])
def analyse_source_file(
    file_id: str,
    db: Session = Depends(get_db)
):
    service = SourceService(db)
    profile = service.analyse_file(file_id=file_id)
    return APIResponse(message="Source analysis completed", data=profile)

@router.get("/{file_id}/profile", response_model=APIResponse[SourceProfileResponse])
def get_source_profile(
    file_id: str,
    db: Session = Depends(get_db)
):
    service = SourceService(db)
    profile = service.get_profile(file_id=file_id)
    return APIResponse(data=profile)

@router.get("/{file_id}/preview", response_model=APIResponse[RecordPreviewResponse])
def get_record_preview(
    file_id: str,
    sheet: Optional[str] = Query(None, description="Sheet or table name"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None, description="Search term across all columns"),
    db: Session = Depends(get_db)
):
    service = SourceService(db)
    preview = service.get_record_preview(
        file_id=file_id,
        sheet_name=sheet,
        page=page,
        page_size=page_size,
        search=search
    )
    return APIResponse(data=preview)
