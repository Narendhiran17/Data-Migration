from typing import List, Optional
from pathlib import Path
from pydantic import BaseModel
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.migration_project import MigrationProject
from app.models.source_file import SourceFile
from app.models.field_mapping import FieldMapping
from app.models.migration_job import MigrationJob
from app.connectors.sources.factory import SourceParserFactory
from app.engines.transformation.executor import TransformationExecutor
from app.engines.migration.executor import MigrationExecutor
from app.engines.audit.logger import AuditService
from app.core.exceptions import NotFoundException
from app.schemas.common import APIResponse

router = APIRouter(prefix="/migrations", tags=["Direct Migration Engine"])

class MigrationExecuteRequest(BaseModel):
    project_id: str
    target_module: str
    execution_mode: str = "dry_run"  # dry_run or live_insert
    batch_size: int = 50

@router.post("/execute", response_model=APIResponse[dict])
def execute_migration(req: MigrationExecuteRequest, db: Session = Depends(get_db)):
    project = db.query(MigrationProject).filter(MigrationProject.id == req.project_id).first()
    if not project:
        raise NotFoundException("Project not found")

    source_files = db.query(SourceFile).filter(SourceFile.project_id == req.project_id).all()
    if not source_files:
        raise NotFoundException("No source files found for migration")

    # Fetch approved mappings
    mappings = db.query(FieldMapping).filter(
        FieldMapping.project_id == req.project_id,
        FieldMapping.target_module == req.target_module
    ).all()
    mapping_dict = {m.target_field_name: m.source_field_name for m in mappings}

    # Transform records
    all_records = []
    for sf in source_files:
        parser = SourceParserFactory.get_parser(sf.file_format)
        parsed = parser.parse(Path(sf.storage_key))
        for sheet_name, sheet_data in parsed.items():
            for r in sheet_data["records"]:
                all_records.append(TransformationExecutor.transform_record(r, {}, mapping_dict))

    # Execute migration via MigrationExecutor
    executor = MigrationExecutor(db)
    result = executor.execute_migration(
        project_id=req.project_id,
        target_product=project.target_product,
        target_module=req.target_module,
        records=all_records,
        execution_mode=req.execution_mode,
        batch_size=req.batch_size
    )

    # Log to audit trail
    AuditService.log_action(
        db=db,
        action="migration_executed" if req.execution_mode == "live_insert" else "dry_run_simulated",
        resource_type="migration_job",
        resource_id=result["job_id"],
        project_id=req.project_id,
        metadata={
            "execution_mode": req.execution_mode,
            "target_module": req.target_module,
            "total_records": result["total_records"],
            "successful_records": result["successful_records"]
        }
    )

    return APIResponse(
        message=f"Migration execution completed in mode '{req.execution_mode}'",
        data=result
    )

@router.get("/{project_id}/history", response_model=APIResponse[List[dict]])
def get_migration_history(project_id: str, db: Session = Depends(get_db)):
    jobs = db.query(MigrationJob).filter(
        MigrationJob.project_id == project_id
    ).order_by(MigrationJob.started_at.desc()).all()

    return APIResponse(data=[
        {
            "id": j.id,
            "target_product": j.target_product,
            "target_module": j.target_module,
            "execution_mode": j.execution_mode,
            "status": j.status,
            "total_records": j.total_records,
            "successful_records": j.successful_records,
            "failed_records": j.failed_records,
            "started_at": j.started_at.isoformat(),
            "completed_at": j.completed_at.isoformat() if j.completed_at else None
        }
        for j in jobs
    ])
