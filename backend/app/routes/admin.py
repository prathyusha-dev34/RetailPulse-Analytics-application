from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.roles import require_roles

from app.models.user import User
from app.models.company import Company
from app.models.audit_log import AuditLog
from app.models.refresh_token import RefreshToken

router = APIRouter(
    prefix="/admin",
    tags=["Admin"],
)


@router.get("/dashboard")
def admin_dashboard(
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(
            "SUPER_ADMIN",
            "COMPANY_ADMIN",
        )
    ),
):
    return {
        "total_companies": db.query(Company).count(),
        "total_users": db.query(User).count(),
        "active_users": db.query(User).filter(User.status == "ACTIVE").count(),
        "admin_users": db.query(User).filter(User.role == "COMPANY_ADMIN").count(),
        "total_audit_logs": db.query(AuditLog).count(),
        "total_refresh_tokens": db.query(RefreshToken).count(),
        "user": current_user.name,
        "role": current_user.role,
    }