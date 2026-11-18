from sqlalchemy import Column, String, BigInteger, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.models.base import BaseModel, utc_now

class SourceFile(BaseModel):
    __tablename__ = "source_files"
    
    project_id = Column(String(36), ForeignKey("migration_projects.id"), nullable=False, index=True)
    original_filename = Column(String(255), nullable=False)
    storage_key = Column(String(500), nullable=False)
    file_format = Column(String(50), nullable=False)  # XLSX/CSV/JSON
    file_size = Column(BigInteger, default=0, nullable=False)
    checksum = Column(String(64), nullable=False)  # SHA-256
    status = Column(String(50), default="uploaded", nullable=False)  # uploaded/analysing/analysed/failed
    error_message = Column(String(1000), nullable=True)
    uploaded_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    
    project = relationship("MigrationProject", back_populates="source_files")
    schemas = relationship("SourceSchema", back_populates="file", cascade="all, delete-orphan")
