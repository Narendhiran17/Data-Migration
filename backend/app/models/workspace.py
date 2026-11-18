from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import BaseModel

class Workspace(BaseModel):
    __tablename__ = "workspaces"
    
    name = Column(String(255), nullable=False)
    owner_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    
    members = relationship("WorkspaceMember", back_populates="workspace", cascade="all, delete-orphan")
    projects = relationship("MigrationProject", back_populates="workspace", cascade="all, delete-orphan")

class WorkspaceMember(BaseModel):
    __tablename__ = "workspace_members"
    
    workspace_id = Column(String(36), ForeignKey("workspaces.id"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    role = Column(String(50), default="Developer", nullable=False)  # Owner/Admin/Developer/Reviewer/Viewer
    
    workspace = relationship("Workspace", back_populates="members")
