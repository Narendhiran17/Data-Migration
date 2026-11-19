from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.zoho_connection import ZohoConnection
from app.models.target_schema import TargetSchema
from app.connectors.zoho.factory import ZohoConnectorFactory
from app.schemas.common import APIResponse

router = APIRouter(prefix="/zoho", tags=["Zoho Connectors & Metadata"])

@router.post("/connect", response_model=APIResponse[dict])
def connect_zoho(
    project_id: str,
    product: str,
    data_center: str = "US",
    db: Session = Depends(get_db)
):
    connector = ZohoConnectorFactory.get_connector(product=product, data_center=data_center)
    validation = connector.validate_connection()

    connection = ZohoConnection(
        project_id=project_id,
        product=product,
        organization_id=validation.get("organization_id"),
        organization_name=validation.get("organization_name"),
        data_center=data_center,
        credential_reference="vault_ref_token_enc",
        status="connected"
    )
    db.add(connection)
    db.commit()
    db.refresh(connection)

    return APIResponse(
        message=f"Successfully connected to Zoho {product}",
        data={
            "connection_id": connection.id,
            "product": product,
            "organization_name": connection.organization_name,
            "status": connection.status,
            "capabilities": connector.get_capabilities()
        }
    )

@router.get("/connections", response_model=APIResponse[List[dict]])
def list_connections(project_id: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(ZohoConnection)
    if project_id:
        query = query.filter(ZohoConnection.project_id == project_id)
    conns = query.all()
    return APIResponse(data=[
        {
            "id": c.id,
            "product": c.product,
            "organization_name": c.organization_name,
            "data_center": c.data_center,
            "status": c.status
        }
        for c in conns
    ])

@router.post("/metadata/discover", response_model=APIResponse[dict])
def discover_target_metadata(
    project_id: str,
    product: str,
    db: Session = Depends(get_db)
):
    connector = ZohoConnectorFactory.get_connector(product=product)
    modules = connector.discover_modules()
    discovered_fields_count = 0

    # Wipe previous discovered target schemas for this project to refresh
    db.query(TargetSchema).filter(TargetSchema.project_id == project_id).delete()

    for mod in modules:
        mod_name = mod["api_name"]
        fields = connector.discover_fields(mod_name)
        for f in fields:
            ts = TargetSchema(
                project_id=project_id,
                product=product,
                module_or_form=mod_name,
                field_api_name=f["api_name"],
                field_label=f["label"],
                data_type=f["data_type"],
                is_mandatory=f.get("is_mandatory", False),
                is_unique=f.get("is_unique", False),
                is_read_only=f.get("is_read_only", False),
                constraints=f.get("constraints", {})
            )
            db.add(ts)
            discovered_fields_count += 1

    db.commit()

    return APIResponse(
        message=f"Discovered {len(modules)} modules and {discovered_fields_count} fields from Zoho {product}",
        data={
            "project_id": project_id,
            "product": product,
            "modules_count": len(modules),
            "fields_count": discovered_fields_count,
            "modules": modules
        }
    )

@router.get("/metadata/{project_id}", response_model=APIResponse[List[dict]])
def get_target_metadata(
    project_id: str,
    module: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(TargetSchema).filter(TargetSchema.project_id == project_id)
    if module:
        query = query.filter(TargetSchema.module_or_form == module)
    fields = query.all()

    return APIResponse(data=[
        {
            "id": f.id,
            "product": f.product,
            "module_or_form": f.module_or_form,
            "field_api_name": f.field_api_name,
            "field_label": f.field_label,
            "data_type": f.data_type,
            "is_mandatory": f.is_mandatory,
            "is_unique": f.is_unique,
            "constraints": f.constraints
        }
        for f in fields
    ])
