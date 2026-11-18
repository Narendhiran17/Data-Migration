from typing import List
from sqlalchemy.orm import Session
from app.repositories.project_repository import ProjectRepository
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectResponse
from app.core.exceptions import NotFoundException
from app.models.migration_project import MigrationProject

class ProjectService:
    def __init__(self, db: Session):
        self.repo = ProjectRepository(db)

    def create_project(self, project_in: ProjectCreate) -> ProjectResponse:
        project = self.repo.create(project_in)
        return ProjectResponse.model_validate(project)

    def get_project(self, project_id: str) -> ProjectResponse:
        project = self.repo.get_by_id(project_id)
        if not project:
            raise NotFoundException(f"Project with ID '{project_id}' not found.")
        return ProjectResponse.model_validate(project)

    def list_projects(self, skip: int = 0, limit: int = 50) -> List[ProjectResponse]:
        projects = self.repo.list_all(skip=skip, limit=limit)
        return [ProjectResponse.model_validate(p) for p in projects]

    def update_project(self, project_id: str, project_in: ProjectUpdate) -> ProjectResponse:
        project = self.repo.get_by_id(project_id)
        if not project:
            raise NotFoundException(f"Project with ID '{project_id}' not found.")
        updated = self.repo.update(project, project_in)
        return ProjectResponse.model_validate(updated)

    def delete_project(self, project_id: str) -> None:
        project = self.repo.get_by_id(project_id)
        if not project:
            raise NotFoundException(f"Project with ID '{project_id}' not found.")
        self.repo.delete(project)
