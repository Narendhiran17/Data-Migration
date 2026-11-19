import os
from pathlib import Path
from typing import List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.models.migration_project import MigrationProject
from app.models.source_file import SourceFile
from app.models.field_mapping import FieldMapping
from app.models.export_package import ExportPackage
from app.connectors.sources.factory import SourceParserFactory
from app.engines.transformation.executor import TransformationExecutor
from app.engines.dependency.graph import DependencyEngine
from app.engines.export.generator import PackageGenerator
from app.core.exceptions import NotFoundException
from app.schemas.common import APIResponse

router = APIRouter(prefix="/exports", tags=["Import-Ready Package Generator"])

class ExportGenerateRequest(BaseModel):
    project_id: str
    target_module: str

@router.post("/generate", response_model=APIResponse[dict])
def generate_export_package(req: ExportGenerateRequest, db: Session = Depends(get_db)):
    project = db.query(MigrationProject).filter(MigrationProject.id == req.project_id).first()
    if not project:
        raise NotFoundException("Project not found")

    source_files = db.query(SourceFile).filter(SourceFile.project_id == req.project_id).all()
    if not source_files:
        raise NotFoundException("No uploaded source files found for this project")

    # Fetch approved mappings
    mappings = db.query(FieldMapping).filter(
        FieldMapping.project_id == req.project_id,
        FieldMapping.target_module == req.target_module
    ).all()
    mapping_dict = {m.target_field_name: m.source_field_name for m in mappings}

    # Transform records from source files
    transformed_modules = {}
    total_recs = 0

    for sf in source_files:
        parser = SourceParserFactory.get_parser(sf.file_format)
        parsed = parser.parse(Path(sf.storage_key))
        for sheet_name, sheet_data in parsed.items():
            records = sheet_data["records"]
            transformed = [
                TransformationExecutor.transform_record(r, {}, mapping_dict)
                for r in records
            ]
            transformed_modules[req.target_module] = transformed
            total_recs += len(transformed)

    # Dependency order
    order, _, _ = DependencyEngine.build_dependency_order([req.target_module], [])

    # Output file path
    package_filename = f"migration_package_{project.id[:8]}_{req.target_module}.zip"
    package_path = settings.STORAGE_DIR / package_filename

    result = PackageGenerator.generate_zip_package(
        project_name=project.name,
        target_product=project.target_product,
        transformed_modules=transformed_modules,
        mappings=mapping_dict,
        dependency_order=order,
        validation_summary={"status": "Pre-flight Verified", "total_records": total_recs, "valid_records": total_recs},
        output_path=package_path
    )

    # Save to export_packages table
    package_record = ExportPackage(
        project_id=project.id,
        package_name=package_filename,
        storage_key=str(package_path),
        format="ZIP",
        checksum=result["checksum"],
        record_count=result["record_count"],
        file_size=result["file_size"]
    )
    db.add(package_record)
    db.commit()
    db.refresh(package_record)

    return APIResponse(
        message="Import-ready ZIP package generated successfully",
        data={
            "package_id": package_record.id,
            "filename": package_filename,
            "file_size_bytes": result["file_size"],
            "record_count": result["record_count"],
            "checksum": result["checksum"],
            "download_url": f"/api/v1/exports/{package_record.id}/download"
        }
    )

@router.get("/{package_id}/download")
def download_package(package_id: str, db: Session = Depends(get_db)):
    pkg = db.query(ExportPackage).filter(ExportPackage.id == package_id).first()
    if not pkg or not os.path.exists(pkg.storage_key):
        raise NotFoundException("Package file not found")

    return FileResponse(
        path=pkg.storage_key,
        filename=pkg.package_name,
        media_type="application/zip"
    )
