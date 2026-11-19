from typing import List, Optional
from datetime import datetime, timezone
from pydantic import BaseModel
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from pathlib import Path

from app.core.database import get_db
from app.models.source_file import SourceFile
from app.models.target_schema import TargetSchema
from app.models.field_mapping import FieldMapping
from app.models.transformation_rule import TransformationRule
from app.models.validation_job import ValidationJob, ValidationError
from app.connectors.sources.factory import SourceParserFactory
from app.engines.transformation.executor import TransformationExecutor
from app.engines.validation.validator import RecordValidator
from app.core.exceptions import NotFoundException
from app.schemas.common import APIResponse

router = APIRouter(prefix="/validations", tags=["Validation Engine"])

class ValidationRunRequest(BaseModel):
    project_id: str
    file_id: str
    target_module: str

@router.post("/run", response_model=APIResponse[dict])
def run_validation(req: ValidationRunRequest, db: Session = Depends(get_db)):
    source_file = db.query(SourceFile).filter(SourceFile.id == req.file_id).first()
    if not source_file:
        raise NotFoundException("Source file not found")

    # 1. Parse raw records
    parser = SourceParserFactory.get_parser(source_file.file_format)
    parsed = parser.parse(Path(source_file.storage_key))
    first_sheet = list(parsed.keys())[0]
    raw_records = parsed[first_sheet]["records"]

    # 2. Fetch mappings
    mappings = db.query(FieldMapping).filter(
        FieldMapping.project_id == req.project_id,
        FieldMapping.target_module == req.target_module,
        FieldMapping.status == "approved"
    ).all()

    mapping_dict = {m.target_field_name: m.source_field_name for m in mappings}

    # 3. Fetch transformation rules
    rules = db.query(TransformationRule).filter(
        TransformationRule.project_id == req.project_id,
        TransformationRule.enabled == True
    ).all()
    rules_dict = [
        {
            "target_field": r.target_field,
            "rule_type": r.rule_type,
            "configuration": r.configuration,
            "execution_order": r.execution_order,
            "enabled": r.enabled
        }
        for r in rules
    ]

    # 4. Transform records
    transformed_records = TransformationExecutor.preview_transformations(
        sample_records=raw_records,
        rules=rules_dict,
        mappings=mapping_dict
    )

    # 5. Fetch target fields
    target_fields = db.query(TargetSchema).filter(
        TargetSchema.project_id == req.project_id,
        TargetSchema.module_or_form == req.target_module
    ).all()
    target_field_dicts = [
        {
            "api_name": tf.field_api_name,
            "data_type": tf.data_type,
            "is_mandatory": tf.is_mandatory,
            "constraints": tf.constraints
        }
        for tf in target_fields
    ]

    # 6. Run validation engine
    val_summary = RecordValidator.validate_dataset(transformed_records, target_field_dicts)

    # 7. Persist ValidationJob & Errors
    job = ValidationJob(
        project_id=req.project_id,
        source_file_id=req.file_id,
        status="completed",
        total_records=val_summary["total_records"],
        valid_records=val_summary["valid_records"],
        invalid_records=val_summary["invalid_records"],
        warning_records=val_summary["warning_records"],
        completed_at=datetime.now(timezone.utc)
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    # Save top errors
    for err in val_summary["errors"][:100]:
        db.add(ValidationError(
            validation_job_id=job.id,
            source_record_reference=f"row_{err.get('row_number', 0)}",
            row_number=err.get("row_number"),
            field_name=err.get("field_name"),
            error_code=err.get("error_code"),
            severity=err.get("severity", "Error"),
            message=err.get("message"),
            suggested_correction=err.get("suggested_correction")
        ))
    db.commit()

    return APIResponse(
        message="Validation execution completed",
        data={
            "job_id": job.id,
            "total_records": val_summary["total_records"],
            "valid_records": val_summary["valid_records"],
            "invalid_records": val_summary["invalid_records"],
            "warning_records": val_summary["warning_records"],
            "errors_count": len(val_summary["errors"]),
            "errors": val_summary["errors"][:50]
        }
    )

@router.get("/{project_id}/latest", response_model=APIResponse[dict])
def get_latest_validation(project_id: str, db: Session = Depends(get_db)):
    job = db.query(ValidationJob).filter(
        ValidationJob.project_id == project_id
    ).order_by(ValidationJob.started_at.desc()).first()

    if not job:
        return APIResponse(data=None)

    errors = db.query(ValidationError).filter(ValidationError.validation_job_id == job.id).all()

    return APIResponse(data={
        "job_id": job.id,
        "status": job.status,
        "total_records": job.total_records,
        "valid_records": job.valid_records,
        "invalid_records": job.invalid_records,
        "warning_records": job.warning_records,
        "started_at": job.started_at.isoformat(),
        "errors": [
            {
                "row_number": e.row_number,
                "field_name": e.field_name,
                "error_code": e.error_code,
                "severity": e.severity,
                "message": e.message,
                "suggested_correction": e.suggested_correction
            }
            for e in errors
        ]
    })
