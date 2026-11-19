from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.audit_log import AuditLog
from app.schemas.common import APIResponse

router = APIRouter(prefix="/audit", tags=["Security & Audit Trail"])

@router.get("", response_model=APIResponse[List[dict]])
def list_audit_logs(
    project_id: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    query = db.query(AuditLog)
    if project_id:
        query = query.filter(AuditLog.project_id == project_id)
    logs = query.order_by(AuditLog.created_at.desc()).limit(limit).all()

    return APIResponse(data=[
        {
            "id": l.id,
            "action": l.action,
            "resource_type": l.resource_type,
            "resource_id": l.resource_id,
            "project_id": l.project_id,
            "timestamp": l.created_at.isoformat(),
            "metadata": l.metadata_json
        }
        for l in logs
    ])
