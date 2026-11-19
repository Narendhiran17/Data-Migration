from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.audit_log import AuditLog

class AuditService:
    @staticmethod
    def log_action(
        db: Session,
        action: str,
        resource_type: str,
        resource_id: Optional[str] = None,
        project_id: Optional[str] = None,
        workspace_id: Optional[str] = None,
        user_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> AuditLog:
        audit_entry = AuditLog(
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            project_id=project_id,
            workspace_id=workspace_id,
            user_id=user_id,
            metadata_json=metadata or {}
        )
        db.add(audit_entry)
        db.commit()
        db.refresh(audit_entry)
        return audit_entry
