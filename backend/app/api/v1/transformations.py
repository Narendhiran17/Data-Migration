from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.transformation_rule import TransformationRule
from app.engines.transformation.executor import TransformationExecutor
from app.schemas.common import APIResponse

router = APIRouter(prefix="/transformations", tags=["Transformation Rules"])

class TransformationCreateRequest(BaseModel):
    project_id: str
    rule_type: str  # trim, uppercase, lowercase, replace, date_format, phone_normalize, picklist_map, prefix
    source_field: str
    target_field: str
    configuration: Dict[str, Any] = {}
    execution_order: int = 1
    enabled: bool = True

class PreviewRequest(BaseModel):
    sample_records: List[Dict[str, Any]]
    rules: List[Dict[str, Any]]
    mappings: Dict[str, str]  # target_field -> source_field

@router.post("", response_model=APIResponse[dict], status_code=status.HTTP_201_CREATED)
def create_transformation(req: TransformationCreateRequest, db: Session = Depends(get_db)):
    rule = TransformationRule(
        project_id=req.project_id,
        rule_type=req.rule_type,
        source_field=req.source_field,
        target_field=req.target_field,
        configuration=req.configuration,
        execution_order=req.execution_order,
        enabled=req.enabled,
        version=1
    )
    db.add(rule)
    db.commit()
    db.refresh(rule)

    return APIResponse(
        message=f"Transformation rule '{req.rule_type}' created for {req.target_field}",
        data={
            "id": rule.id,
            "rule_type": rule.rule_type,
            "source_field": rule.source_field,
            "target_field": rule.target_field,
            "configuration": rule.configuration,
            "execution_order": rule.execution_order,
            "enabled": rule.enabled
        }
    )

@router.get("/{project_id}", response_model=APIResponse[List[dict]])
def list_transformations(project_id: str, db: Session = Depends(get_db)):
    rules = db.query(TransformationRule).filter(
        TransformationRule.project_id == project_id
    ).order_by(TransformationRule.execution_order.asc()).all()

    return APIResponse(data=[
        {
            "id": r.id,
            "rule_type": r.rule_type,
            "source_field": r.source_field,
            "target_field": r.target_field,
            "configuration": r.configuration,
            "execution_order": r.execution_order,
            "enabled": r.enabled
        }
        for r in rules
    ])

@router.post("/preview", response_model=APIResponse[dict])
def preview_transformations(req: PreviewRequest):
    transformed = TransformationExecutor.preview_transformations(
        sample_records=req.sample_records,
        rules=req.rules,
        mappings=req.mappings
    )
    return APIResponse(
        message="Transformations previewed successfully",
        data={
            "input_records_count": len(req.sample_records),
            "output_records_count": len(transformed),
            "transformed_records": transformed
        }
    )
