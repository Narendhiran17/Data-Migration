from sqlalchemy import Column, String, Numeric, Integer, ForeignKey, JSON
from app.models.base import BaseModel

class FieldMapping(BaseModel):
    __tablename__ = "field_mappings"

    project_id = Column(String(36), ForeignKey("migration_projects.id"), nullable=False, index=True)
    source_schema_id = Column(String(36), ForeignKey("source_schemas.id"), nullable=True, index=True)
    target_schema_id = Column(String(36), ForeignKey("target_schemas.id"), nullable=False, index=True)
    source_field_name = Column(String(255), nullable=False)
    target_field_name = Column(String(255), nullable=False)
    target_module = Column(String(255), nullable=False)
    mapping_type = Column(String(50), default="direct", nullable=False)  # direct, ai_suggested, manual
    confidence = Column(Numeric(5, 2), default=1.00, nullable=False)  # 0.00 to 1.00
    confidence_reason = Column(String(500), nullable=True)
    status = Column(String(50), default="suggested", nullable=False)  # suggested, approved, rejected, manual
    approved_by = Column(String(36), ForeignKey("users.id"), nullable=True)
    version = Column(Integer, default=1, nullable=False)
