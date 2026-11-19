from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import BaseModel

class ZohoConnection(BaseModel):
    __tablename__ = "zoho_connections"

    workspace_id = Column(String(36), ForeignKey("workspaces.id"), nullable=True, index=True)
    project_id = Column(String(36), ForeignKey("migration_projects.id"), nullable=True, index=True)
    product = Column(String(50), nullable=False)  # CRM, Creator, Books, Inventory, Desk, Projects, People
    organization_id = Column(String(100), nullable=True)
    organization_name = Column(String(255), nullable=True)
    data_center = Column(String(20), default="US", nullable=False)  # US, EU, IN, AU, JP, CA
    account_owner = Column(String(255), nullable=True)
    app_link_name = Column(String(255), nullable=True)  # For Zoho Creator applications
    credential_reference = Column(String(500), nullable=False)  # Encrypted reference or token ID
    status = Column(String(50), default="connected", nullable=False)  # connected, expired, revoked
