from sqlalchemy import Column, String, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import BaseModel

class MigrationProject(BaseModel):
    __tablename__ = "migration_projects"
    
    workspace_id = Column(String(36), ForeignKey("workspaces.id"), nullable=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    source_type = Column(String(50), default="File", nullable=False)  # File/Database/CRM
    target_product = Column(String(50), default="CRM", nullable=False)  # CRM/Creator/Books/etc.
    status = Column(String(50), default="draft", nullable=False)  # draft/analyzing/analyzed/mapping/validating/completed
    created_by = Column(String(36), ForeignKey("users.id"), nullable=True)
    
    workspace = relationship("Workspace", back_populates="projects")
    source_files = relationship("SourceFile", back_populates="project", cascade="all, delete-orphan")
