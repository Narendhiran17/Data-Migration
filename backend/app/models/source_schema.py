from sqlalchemy import Column, String, Boolean, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.models.base import BaseModel

class SourceSchema(BaseModel):
    __tablename__ = "source_schemas"
    
    file_id = Column(String(36), ForeignKey("source_files.id"), nullable=False, index=True)
    sheet_or_table_name = Column(String(255), default="default", nullable=False)
    column_name = Column(String(255), nullable=False)
    inferred_type = Column(String(100), nullable=False)  # Integer, Float, Text, Date, Email, Phone, etc.
    nullable = Column(Boolean, default=True, nullable=False)
    sample_values = Column(JSON, default=list, nullable=False)
    statistics = Column(JSON, default=dict, nullable=False)
    
    file = relationship("SourceFile", back_populates="schemas")
