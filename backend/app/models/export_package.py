from sqlalchemy import Column, String, Integer, BigInteger, ForeignKey
from app.models.base import BaseModel

class ExportPackage(BaseModel):
    __tablename__ = "export_packages"

    project_id = Column(String(36), ForeignKey("migration_projects.id"), nullable=False, index=True)
    package_name = Column(String(255), nullable=False)
    storage_key = Column(String(500), nullable=False)
    format = Column(String(50), default="ZIP", nullable=False)  # ZIP, CSV, XLSX
    checksum = Column(String(64), nullable=False)
    record_count = Column(Integer, default=0, nullable=False)
    file_size = Column(BigInteger, default=0, nullable=False)
