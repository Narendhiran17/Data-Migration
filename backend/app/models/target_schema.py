from sqlalchemy import Column, String, Boolean, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.models.base import BaseModel

class TargetSchema(BaseModel):
    __tablename__ = "target_schemas"

    project_id = Column(String(36), ForeignKey("migration_projects.id"), nullable=False, index=True)
    product = Column(String(50), nullable=False)  # CRM, Creator, Books, etc.
    module_or_form = Column(String(255), nullable=False)  # Leads, Contacts, Accounts, FormLinkName
    field_api_name = Column(String(255), nullable=False)  # Last_Name, Email, Single_Line
    field_label = Column(String(255), nullable=False)
    data_type = Column(String(100), nullable=False)  # text, email, phone, date, picklist, lookup, currency, number, etc.
    is_mandatory = Column(Boolean, default=False, nullable=False)
    is_unique = Column(Boolean, default=False, nullable=False)
    is_read_only = Column(Boolean, default=False, nullable=False)
    constraints = Column(JSON, default=dict, nullable=False)  # length limits, picklist options, lookup module reference
    metadata_version = Column(String(50), default="1.0", nullable=False)
