from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.source_file import SourceFile
from app.models.source_schema import SourceSchema
from app.schemas.source import SheetProfile

class SourceRepository:
    def __init__(self, db: Session):
        self.db = db

    def create_file(self, project_id: str, original_filename: str, storage_key: str, 
                    file_format: str, file_size: int, checksum: str) -> SourceFile:
        source_file = SourceFile(
            project_id=project_id,
            original_filename=original_filename,
            storage_key=storage_key,
            file_format=file_format,
            file_size=file_size,
            checksum=checksum,
            status="uploaded"
        )
        self.db.add(source_file)
        self.db.commit()
        self.db.refresh(source_file)
        return source_file

    def get_file_by_id(self, file_id: str) -> Optional[SourceFile]:
        return self.db.query(SourceFile).filter(SourceFile.id == file_id).first()

    def list_files_by_project(self, project_id: str) -> List[SourceFile]:
        return self.db.query(SourceFile).filter(SourceFile.project_id == project_id).all()

    def update_file_status(self, file_id: str, status: str, error_message: Optional[str] = None) -> Optional[SourceFile]:
        source_file = self.get_file_by_id(file_id)
        if source_file:
            source_file.status = status
            if error_message is not None:
                source_file.error_message = error_message
            self.db.commit()
            self.db.refresh(source_file)
        return source_file

    def save_sheet_profiles(self, file_id: str, sheet_profiles: List[SheetProfile]) -> None:
        # Clear existing schemas for this file
        self.db.query(SourceSchema).filter(SourceSchema.file_id == file_id).delete()
        
        for sp in sheet_profiles:
            for col in sp.columns:
                schema_entry = SourceSchema(
                    file_id=file_id,
                    sheet_or_table_name=sp.sheet_name,
                    column_name=col.column_name,
                    inferred_type=col.inferred_type,
                    nullable=col.nullable,
                    sample_values=col.sample_values,
                    statistics={
                        "null_count": col.null_count,
                        "null_percentage": col.null_percentage,
                        "distinct_count": col.distinct_count,
                        "unique_percentage": col.unique_percentage,
                        "duplicate_count": col.duplicate_count,
                        "invalid_format_count": col.invalid_format_count,
                        "min_value": col.min_value,
                        "max_value": col.max_value,
                        "is_candidate_identifier": col.is_candidate_identifier,
                        "is_candidate_email": col.is_candidate_email,
                        "is_candidate_phone": col.is_candidate_phone,
                        "is_candidate_date": col.is_candidate_date,
                        "duplicate_rows_count": sp.duplicate_rows_count,
                        "total_rows": sp.total_rows,
                        "total_columns": sp.total_columns
                    }
                )
                self.db.add(schema_entry)
        self.db.commit()

    def get_schemas_by_file(self, file_id: str) -> List[SourceSchema]:
        return self.db.query(SourceSchema).filter(SourceSchema.file_id == file_id).all()
