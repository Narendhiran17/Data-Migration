from typing import List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.migration_project import MigrationProject
from app.engines.dependency.graph import DependencyEngine
from app.schemas.common import APIResponse

router = APIRouter(prefix="/dependencies", tags=["Relationship & Dependency Engine"])

@router.get("/{project_id}", response_model=APIResponse[dict])
def get_dependency_plan(project_id: str, db: Session = Depends(get_db)):
    project = db.query(MigrationProject).filter(MigrationProject.id == project_id).first()
    target_prod = project.target_product if project else "CRM"

    if target_prod.upper() == "CRM":
        entities = ["Accounts", "Contacts", "Vendors", "Products", "Deals", "Quotes", "Invoices", "Tasks"]
        relationships = [
            {"parent": "Accounts", "child": "Contacts"},
            {"parent": "Accounts", "child": "Deals"},
            {"parent": "Contacts", "child": "Deals"},
            {"parent": "Deals", "child": "Quotes"},
            {"parent": "Quotes", "child": "Invoices"},
            {"parent": "Products", "child": "Quotes"}
        ]
    else:
        entities = ["Customer_Onboarding", "Employee_Directory", "Asset_Tracking"]
        relationships = []

    order, has_cycle, cycles = DependencyEngine.build_dependency_order(entities, relationships)

    return APIResponse(data={
        "project_id": project_id,
        "target_product": target_prod,
        "entities": entities,
        "relationships": relationships,
        "execution_order": order,
        "has_circular_dependency": has_cycle,
        "detected_cycles": cycles
    })
