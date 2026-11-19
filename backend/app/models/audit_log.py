from sqlalchemy import Column, String, ForeignKey, JSON
from app.models.base import BaseModel

class AuditLog(BaseModel):
    __tablename__ = "audit_logs"

    workspace_id = Column(String(36), ForeignKey("workspaces.id"), nullable=True, index=True)
    project_id = Column(String(36), ForeignKey("migration_projects.id"), nullable=True, index=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True, index=True)
    action = Column(String(100), nullable=False)  # project_created, mapping_approved, rule_created, validation_run, migration_executed
    resource_type = Column(String(100), nullable=False)  # project, mapping, transformation, migration
    resource_id = Column(String(36), nullable=True)
    metadata_json = Column("metadata", JSON, default=dict, nullable=False)
