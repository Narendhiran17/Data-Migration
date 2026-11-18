from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services.project_service import ProjectService
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectResponse
from app.schemas.common import APIResponse

router = APIRouter(prefix="/projects", tags=["Migration Projects"])

@router.post("", response_model=APIResponse[ProjectResponse], status_code=status.HTTP_201_CREATED)
def create_project(project_in: ProjectCreate, db: Session = Depends(get_db)):
    service = ProjectService(db)
    project = service.create_project(project_in)
    return APIResponse(message="Project created successfully", data=project)

@router.get("", response_model=APIResponse[List[ProjectResponse]])
def list_projects(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    service = ProjectService(db)
    projects = service.list_projects(skip=skip, limit=limit)
    return APIResponse(data=projects)

@router.get("/{project_id}", response_model=APIResponse[ProjectResponse])
def get_project(project_id: str, db: Session = Depends(get_db)):
    service = ProjectService(db)
    project = service.get_project(project_id)
    return APIResponse(data=project)

@router.put("/{project_id}", response_model=APIResponse[ProjectResponse])
def update_project(project_id: str, project_in: ProjectUpdate, db: Session = Depends(get_db)):
    service = ProjectService(db)
    project = service.update_project(project_id, project_in)
    return APIResponse(message="Project updated successfully", data=project)

@router.delete("/{project_id}", response_model=APIResponse[None])
def delete_project(project_id: str, db: Session = Depends(get_db)):
    service = ProjectService(db)
    service.delete_project(project_id)
    return APIResponse(message="Project deleted successfully", data=None)
