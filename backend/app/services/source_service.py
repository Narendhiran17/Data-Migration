import hashlib
import os
import shutil
from pathlib import Path
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from fastapi import UploadFile

from app.core.config import settings
from app.core.exceptions import NotFoundException, BadRequestException, FileProcessingException
from app.core.logging import logger
from app.repositories.source_repository import SourceRepository
from app.repositories.project_repository import ProjectRepository
from app.connectors.sources.factory import SourceParserFactory
from app.engines.profiling.profiler import DataProfiler
from app.schemas.source import (
    SourceFileUploadResponse,
    SourceProfileResponse,
    SheetProfile,
    ColumnProfile,
    RecordPreviewResponse
)

class SourceService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = SourceRepository(db)
        self.project_repo = ProjectRepository(db)

    async def save_uploaded_file(self, project_id: str, file: UploadFile) -> SourceFileUploadResponse:
        project = self.project_repo.get_by_id(project_id)
        if not project:
            raise NotFoundException(f"Project with ID '{project_id}' not found.")

        filename = file.filename or "unknown_file"
        file_format = SourceParserFactory.detect_format_from_filename(filename)
        if file_format == "UNKNOWN":
            raise BadRequestException(f"Unsupported file extension for '{filename}'. Supported: .xlsx, .csv, .json")

        # Save to storage directory
        dest_filename = f"{project_id}_{filename}"
        dest_path = settings.STORAGE_DIR / dest_filename

        hasher = hashlib.sha256()
        file_size = 0

        try:
            with open(dest_path, "wb") as out_file:
                while chunk := await file.read(1024 * 1024):  # 1MB chunks
                    file_size += len(chunk)
                    if file_size > settings.MAX_FILE_SIZE_MB * 1024 * 1024:
                        dest_path.unlink(missing_ok=True)
                        raise BadRequestException(f"File size exceeds maximum limit of {settings.MAX_FILE_SIZE_MB}MB.")
                    hasher.update(chunk)
                    out_file.write(chunk)
        except Exception as e:
            if dest_path.exists():
                dest_path.unlink()
            raise e

        checksum = hasher.hexdigest()

        source_file = self.repo.create_file(
            project_id=project_id,
            original_filename=filename,
            storage_key=str(dest_path),
            file_format=file_format,
            file_size=file_size,
            checksum=checksum
        )

        return SourceFileUploadResponse(
            file_id=source_file.id,
            project_id=source_file.project_id,
            original_filename=source_file.original_filename,
            file_format=source_file.file_format,
            file_size=source_file.file_size,
            checksum=source_file.checksum,
            status=source_file.status,
            uploaded_at=source_file.uploaded_at
        )

    def analyse_file(self, file_id: str) -> SourceProfileResponse:
        """
        Parses the uploaded file, computes data profiles, and stores schemas in the database.
        """
        source_file = self.repo.get_file_id(file_id) if hasattr(self.repo, 'get_file_id') else self.repo.get_file_by_id(file_id)
        if not source_file:
            raise NotFoundException(f"Source file with ID '{file_id}' not found.")

        self.repo.update_file_status(file_id, "analysing")
        file_path = Path(source_file.storage_key)

        try:
            parser = SourceParserFactory.get_parser(source_file.file_format)
            parsed_data = parser.parse(file_path)

            sheet_profiles: List[SheetProfile] = []
            total_records_all_sheets = 0
            total_columns_all_sheets = 0

            for sheet_name, sheet_data in parsed_data.items():
                columns = sheet_data["columns"]
                records = sheet_data["records"]
                
                sp = DataProfiler.profile_sheet(
                    sheet_name=sheet_name,
                    records=records,
                    columns=columns
                )
                sheet_profiles.append(sp)
                total_records_all_sheets += sp.total_rows
                total_columns_all_sheets += sp.total_columns

            # Persist schema profiles
            self.repo.save_sheet_profiles(file_id, sheet_profiles)
            self.repo.update_file_status(file_id, "analysed")

            # Update project status
            project = self.project_repo.get_by_id(source_file.project_id)
            if project and project.status == "draft":
                project.status = "analysed"
                self.db.commit()

            return SourceProfileResponse(
                file_id=source_file.id,
                original_filename=source_file.original_filename,
                file_format=source_file.file_format,
                status="analysed",
                total_rows=total_records_all_sheets,
                total_columns=total_columns_all_sheets,
                detected_sheets=len(sheet_profiles),
                sheets=sheet_profiles
            )
        except Exception as e:
            logger.error(f"Error analysing file {file_id}: {str(e)}", exc_info=True)
            self.repo.update_file_status(file_id, "failed", error_message=str(e))
            raise FileProcessingException(f"Analysis failed: {str(e)}")

    def get_profile(self, file_id: str) -> SourceProfileResponse:
        source_file = self.repo.get_file_by_id(file_id)
        if not source_file:
            raise NotFoundException(f"Source file with ID '{file_id}' not found.")

        schemas = self.repo.get_schemas_by_file(file_id)
        if not schemas and source_file.status != "analysed":
            # If not yet analyzed, trigger on-demand analysis
            return self.analyse_file(file_id)

        # Reconstruct SheetProfile objects from saved schemas
        sheets_dict: Dict[str, List[ColumnProfile]] = {}
        sheet_meta: Dict[str, Dict[str, Any]] = {}

        for s in schemas:
            stats = s.statistics or {}
            sheet_name = s.sheet_or_table_name
            if sheet_name not in sheets_dict:
                sheets_dict[sheet_name] = []
                sheet_meta[sheet_name] = {
                    "total_rows": stats.get("total_rows", 0),
                    "total_columns": stats.get("total_columns", 0),
                    "duplicate_rows_count": stats.get("duplicate_rows_count", 0)
                }

            col_profile = ColumnProfile(
                column_name=s.column_name,
                inferred_type=s.inferred_type,
                nullable=s.nullable,
                null_count=stats.get("null_count", 0),
                null_percentage=stats.get("null_percentage", 0.0),
                distinct_count=stats.get("distinct_count", 0),
                unique_percentage=stats.get("unique_percentage", 0.0),
                duplicate_count=stats.get("duplicate_count", 0),
                invalid_format_count=stats.get("invalid_format_count", 0),
                min_value=stats.get("min_value"),
                max_value=stats.get("max_value"),
                is_candidate_identifier=stats.get("is_candidate_identifier", False),
                is_candidate_email=stats.get("is_candidate_email", False),
                is_candidate_phone=stats.get("is_candidate_phone", False),
                is_candidate_date=stats.get("is_candidate_date", False),
                sample_values=s.sample_values or []
            )
            sheets_dict[sheet_name].append(col_profile)

        sheet_profiles = [
            SheetProfile(
                sheet_name=name,
                total_rows=sheet_meta[name]["total_rows"],
                total_columns=sheet_meta[name]["total_columns"],
                columns=cols,
                duplicate_rows_count=sheet_meta[name]["duplicate_rows_count"]
            )
            for name, cols in sheets_dict.items()
        ]

        total_rows = sum(sp.total_rows for sp in sheet_profiles)
        total_cols = sum(sp.total_columns for sp in sheet_profiles)

        return SourceProfileResponse(
            file_id=source_file.id,
            original_filename=source_file.original_filename,
            file_format=source_file.file_format,
            status=source_file.status,
            total_rows=total_rows,
            total_columns=total_cols,
            detected_sheets=len(sheet_profiles),
            sheets=sheet_profiles
        )

    def get_record_preview(self, file_id: str, sheet_name: Optional[str] = None, 
                           page: int = 1, page_size: int = 20, 
                           search: Optional[str] = None) -> RecordPreviewResponse:
        source_file = self.repo.get_file_by_id(file_id)
        if not source_file:
            raise NotFoundException(f"Source file with ID '{file_id}' not found.")

        file_path = Path(source_file.storage_key)
        parser = SourceParserFactory.get_parser(source_file.file_format)
        parsed_data = parser.parse(file_path)

        target_sheet = sheet_name or list(parsed_data.keys())[0]
        if target_sheet not in parsed_data:
            target_sheet = list(parsed_data.keys())[0]

        sheet_data = parsed_data[target_sheet]
        columns = sheet_data["columns"]
        records = sheet_data["records"]

        # Optional search filtering across all column values
        if search and search.strip():
            query = search.strip().lower()
            records = [
                r for r in records
                if any(query in str(v).lower() for v in r.values() if v is not None)
            ]

        total_rows = len(records)
        total_pages = (total_rows + page_size - 1) // page_size if total_rows > 0 else 1
        page = max(1, min(page, total_pages))

        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size
        paginated_records = records[start_idx:end_idx]

        return RecordPreviewResponse(
            file_id=source_file.id,
            sheet_name=target_sheet,
            total_rows=total_rows,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
            columns=columns,
            records=paginated_records
        )
