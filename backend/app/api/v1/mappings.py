from typing import List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.field_mapping import FieldMapping
from app.engines.mapping.engine import MappingEngine
from app.engines.ai.orchestrator import AIOrchestrator
from app.schemas.common import APIResponse

router = APIRouter(prefix="/mappings", tags=["Schema Mapping Engine"])

class MappingSaveRequest(BaseModel):
    project_id: str
    target_module: str
    source_field_name: str
    target_field_name: str
    confidence: float = 1.0
    status: str = "approved"

@router.post("/suggest", response_model=APIResponse[dict])
def suggest_mappings(
    project_id: str,
    target_module: str,
    db: Session = Depends(get_db)
):
    engine = MappingEngine(db)
    suggestions = engine.generate_suggestions(project_id, target_module)

    # Attach AI suggestions if needed
    for s in suggestions:
        top = s.get("top_match")
        if top:
            ai_hint = AIOrchestrator.suggest_transformation(
                source_field=s["source_field_name"],
                source_type=s["inferred_type"],
                target_field=top["target_field_name"],
                target_type=top["target_data_type"]
            )
            top["ai_transformation_hint"] = ai_hint

    return APIResponse(
        message=f"Generated mapping suggestions for {target_module}",
        data={
            "project_id": project_id,
            "target_module": target_module,
            "suggestions": suggestions
        }
    )

@router.post("", response_model=APIResponse[dict])
def save_mapping(req: MappingSaveRequest, db: Session = Depends(get_db)):
    engine = MappingEngine(db)
    mapping = engine.save_mapping(
        project_id=req.project_id,
        target_module=req.target_module,
        source_field_name=req.source_field_name,
        target_field_name=req.target_field_name,
        confidence=req.confidence,
        mapping_type="manual" if req.confidence == 1.0 else "ai_suggested",
        status=req.status
    )
    return APIResponse(
        message="Mapping saved successfully",
        data={
            "id": mapping.id,
            "source_field": mapping.source_field_name,
            "target_field": mapping.target_field_name,
            "target_module": mapping.target_module,
            "confidence": float(mapping.confidence),
            "status": mapping.status,
            "version": mapping.version
        }
    )

@router.get("/{project_id}", response_model=APIResponse[List[dict]])
def get_project_mappings(
    project_id: str,
    target_module: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(FieldMapping).filter(FieldMapping.project_id == project_id)
    if target_module:
        query = query.filter(FieldMapping.target_module == target_module)
    mappings = query.all()

    return APIResponse(data=[
        {
            "id": m.id,
            "source_field_name": m.source_field_name,
            "target_field_name": m.target_field_name,
            "target_module": m.target_module,
            "confidence": float(m.confidence),
            "status": m.status,
            "mapping_type": m.mapping_type,
            "version": m.version
        }
        for m in mappings
    ])
