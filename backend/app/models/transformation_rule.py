from sqlalchemy import Column, String, Integer, Boolean, ForeignKey, JSON
from app.models.base import BaseModel

class TransformationRule(BaseModel):
    __tablename__ = "transformation_rules"

    project_id = Column(String(36), ForeignKey("migration_projects.id"), nullable=False, index=True)
    mapping_id = Column(String(36), ForeignKey("field_mappings.id"), nullable=True, index=True)
    rule_type = Column(String(50), nullable=False)  # trim, uppercase, lowercase, replace, date_format, phone_normalize, picklist_map, lookup_resolve, default_value, custom_formula
    source_field = Column(String(255), nullable=False)
    target_field = Column(String(255), nullable=False)
    configuration = Column(JSON, default=dict, nullable=False)  # specific parameters: format strings, mapping dicts, prefixes
    execution_order = Column(Integer, default=1, nullable=False)
    enabled = Column(Boolean, default=True, nullable=False)
    version = Column(Integer, default=1, nullable=False)
