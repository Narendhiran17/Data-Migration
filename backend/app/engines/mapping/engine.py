from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.source_schema import SourceSchema
from app.models.target_schema import TargetSchema
from app.models.field_mapping import FieldMapping
from app.engines.mapping.scorer import MappingScorer

class MappingEngine:
    def __init__(self, db: Session):
        self.db = db

    def generate_suggestions(self, project_id: str, target_module: str) -> List[Dict[str, Any]]:
        source_schemas = self.db.query(SourceSchema).join(
            SourceSchema.file
        ).filter(SourceSchema.file.has(project_id=project_id)).all()

        target_fields = self.db.query(TargetSchema).filter(
            TargetSchema.project_id == project_id,
            TargetSchema.module_or_form == target_module
        ).all()

        if not target_fields:
            return []

        suggestions = []
        for src in source_schemas:
            candidates = []
            for tgt in target_fields:
                score, reason = MappingScorer.calculate_score(
                    src_name=src.column_name,
                    src_type=src.inferred_type,
                    samples=src.sample_values or [],
                    tgt_name=tgt.field_api_name,
                    tgt_type=tgt.data_type,
                    constraints=tgt.constraints or {}
                )
                if score >= 0.40:
                    candidates.append({
                        "target_field_id": tgt.id,
                        "target_field_name": tgt.field_api_name,
                        "target_field_label": tgt.field_label,
                        "target_data_type": tgt.data_type,
                        "is_mandatory": tgt.is_mandatory,
                        "confidence": score,
                        "reason": reason
                    })

            candidates.sort(key=lambda x: x["confidence"], reverse=True)
            top_match = candidates[0] if candidates else None

            suggestions.append({
                "source_schema_id": src.id,
                "source_field_name": src.column_name,
                "inferred_type": src.inferred_type,
                "sheet_or_table_name": src.sheet_or_table_name,
                "top_match": top_match,
                "all_candidates": candidates[:5]
            })

        return suggestions

    def save_mapping(self, project_id: str, target_module: str, source_field_name: str, target_field_name: str,
                     source_schema_id: Optional[str] = None, target_schema_id: Optional[str] = None,
                     confidence: float = 1.0, mapping_type: str = "manual", status: str = "approved") -> FieldMapping:
        # Check if existing mapping exists for this project + target field
        mapping = self.db.query(FieldMapping).filter(
            FieldMapping.project_id == project_id,
            FieldMapping.target_module == target_module,
            FieldMapping.target_field_name == target_field_name
        ).first()

        if mapping:
            mapping.source_field_name = source_field_name
            mapping.source_schema_id = source_schema_id
            mapping.confidence = confidence
            mapping.mapping_type = mapping_type
            mapping.status = status
            mapping.version += 1
        else:
            mapping = FieldMapping(
                project_id=project_id,
                source_schema_id=source_schema_id,
                target_schema_id=target_schema_id or "tgt_gen",
                source_field_name=source_field_name,
                target_field_name=target_field_name,
                target_module=target_module,
                mapping_type=mapping_type,
                confidence=confidence,
                status=status
            )
            self.db.add(mapping)

        self.db.commit()
        self.db.refresh(mapping)
        return mapping
