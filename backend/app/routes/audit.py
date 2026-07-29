from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.roles import require_roles

from app.models.audit_log import AuditLog
from app.schemas.audit import AuditLogResponse

router = APIRouter(
    prefix="/audit",
    tags=["Audit Logs"],
)


@router.get(
    "/logs",
    response_model=list[AuditLogResponse],
)
def get_audit_logs(
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(
            "SUPER_ADMIN",
            "COMPANY_ADMIN",
        )
    ),
):
    # SUPER ADMIN -> View all audit logs
    if current_user.role == "SUPER_ADMIN":
        logs = (
            db.query(AuditLog)
            .order_by(
                AuditLog.created_at.desc()
            )
            .all()
        )

        return logs

    # COMPANY ADMIN -> View only own company audit logs
    logs = (
        db.query(AuditLog)
        .filter(
            AuditLog.company_id ==
            current_user.company_id
        )
        .order_by(
            AuditLog.created_at.desc()
        )
        .all()
    )

    return logs