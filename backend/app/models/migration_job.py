from sqlalchemy import Column, String, Integer, ForeignKey, DateTime, JSON
from app.models.base import BaseModel, utc_now

class MigrationJob(BaseModel):
    __tablename__ = "migration_jobs"

    project_id = Column(String(36), ForeignKey("migration_projects.id"), nullable=False, index=True)
    target_product = Column(String(50), nullable=False)
    target_module = Column(String(255), nullable=False)
    execution_mode = Column(String(50), default="dry_run", nullable=False)  # dry_run, live_insert, upsert
    status = Column(String(50), default="pending", nullable=False)  # pending, running, completed, partially_failed, cancelled
    total_records = Column(Integer, default=0, nullable=False)
    successful_records = Column(Integer, default=0, nullable=False)
    failed_records = Column(Integer, default=0, nullable=False)
    approved_by = Column(String(36), ForeignKey("users.id"), nullable=True)
    started_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)

class MigrationBatch(BaseModel):
    __tablename__ = "migration_batches"

    migration_job_id = Column(String(36), ForeignKey("migration_jobs.id"), nullable=False, index=True)
    batch_number = Column(Integer, default=1, nullable=False)
    status = Column(String(50), default="pending", nullable=False)  # pending, success, failed
    request_reference = Column(String(255), nullable=True)
    retry_count = Column(Integer, default=0, nullable=False)
    response_summary = Column(JSON, default=dict, nullable=False)

class RecordResult(BaseModel):
    __tablename__ = "record_results"

    batch_id = Column(String(36), ForeignKey("migration_batches.id"), nullable=False, index=True)
    source_record_reference = Column(String(255), nullable=False)
    source_record_key = Column(String(255), nullable=True)
    target_record_id = Column(String(255), nullable=True)
    status = Column(String(50), default="success", nullable=False)  # success, failed, skipped
    error_code = Column(String(100), nullable=True)
    error_message = Column(String(1000), nullable=True)

class RecordIdMapping(BaseModel):
    __tablename__ = "record_id_mappings"

    project_id = Column(String(36), ForeignKey("migration_projects.id"), nullable=False, index=True)
    target_module = Column(String(255), nullable=False)
    source_record_key = Column(String(255), nullable=False, index=True)
    target_record_id = Column(String(255), nullable=False, index=True)
    external_identifier = Column(String(255), nullable=True)
