from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.migration_project import MigrationProject
from app.schemas.project import ProjectCreate, ProjectUpdate

class ProjectRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, project_in: ProjectCreate) -> MigrationProject:
        project = MigrationProject(
            workspace_id=project_in.workspace_id,
            name=project_in.name,
            description=project_in.description,
            source_type=project_in.source_type,
            target_product=project_in.target_product,
            status="draft"
        )
        self.db.add(project)
        self.db.commit()
        self.db.refresh(project)
        return project

    def get_by_id(self, project_id: str) -> Optional[MigrationProject]:
        return self.db.query(MigrationProject).filter(MigrationProject.id == project_id).first()

    def list_all(self, skip: int = 0, limit: int = 50) -> List[MigrationProject]:
        return self.db.query(MigrationProject).order_by(MigrationProject.created_at.desc()).offset(skip).limit(limit).all()

    def update(self, project: MigrationProject, project_in: ProjectUpdate) -> MigrationProject:
        update_data = project_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(project, field, value)
        self.db.commit()
        self.db.refresh(project)
        return project

    def delete(self, project: MigrationProject) -> None:
        self.db.delete(project)
        self.db.commit()
