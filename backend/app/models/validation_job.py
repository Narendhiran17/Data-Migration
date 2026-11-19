from sqlalchemy import Column, String, Integer, ForeignKey, DateTime
from app.models.base import BaseModel, utc_now

class ValidationJob(BaseModel):
    __tablename__ = "validation_jobs"

    project_id = Column(String(36), ForeignKey("migration_projects.id"), nullable=False, index=True)
    source_file_id = Column(String(36), ForeignKey("source_files.id"), nullable=False, index=True)
    status = Column(String(50), default="pending", nullable=False)  # pending, running, completed, failed
    total_records = Column(Integer, default=0, nullable=False)
    valid_records = Column(Integer, default=0, nullable=False)
    invalid_records = Column(Integer, default=0, nullable=False)
    warning_records = Column(Integer, default=0, nullable=False)
    started_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)

class ValidationError(BaseModel):
    __tablename__ = "validation_errors"

    validation_job_id = Column(String(36), ForeignKey("validation_jobs.id"), nullable=False, index=True)
    source_record_reference = Column(String(255), nullable=False)  # stable row index or source key
    row_number = Column(Integer, nullable=True)
    field_name = Column(String(255), nullable=True)
    error_code = Column(String(100), nullable=False)  # MISSING_REQUIRED_FIELD, INVALID_DATE, VALUE_NOT_IN_PICKLIST, etc.
    severity = Column(String(20), default="Error", nullable=False)  # Error, Warning, Info
    message = Column(String(1000), nullable=False)
    suggested_correction = Column(String(1000), nullable=True)
