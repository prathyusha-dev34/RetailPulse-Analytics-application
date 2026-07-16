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

    # SUPER ADMIN -> View everything
    if current_user.role == "SUPER_ADMIN":
        return {
            "total_companies": db.query(Company).count(),
            "total_users": db.query(User).count(),
            "active_users": db.query(User)
            .filter(User.status == "ACTIVE")
            .count(),
            "admin_users": db.query(User)
            .filter(User.role == "COMPANY_ADMIN")
            .count(),
            "total_audit_logs": db.query(AuditLog).count(),
            "total_refresh_tokens": db.query(RefreshToken).count(),
            "user": current_user.name,
            "role": current_user.role,
        }

    # COMPANY ADMIN -> View only own company
    total_users = (
        db.query(User)
        .filter(User.company_id == current_user.company_id)
        .count()
    )

    active_users = (
        db.query(User)
        .filter(
            User.company_id == current_user.company_id,
            User.status == "ACTIVE",
        )
        .count()
    )

    admin_users = (
        db.query(User)
        .filter(
            User.company_id == current_user.company_id,
            User.role == "COMPANY_ADMIN",
        )
        .count()
    )

    total_audit_logs = (
        db.query(AuditLog)
        .filter(AuditLog.company_id == current_user.company_id)
        .count()
    )

    total_refresh_tokens = (
        db.query(RefreshToken)
        .join(User, RefreshToken.user_id == User.id)
        .filter(User.company_id == current_user.company_id)
        .count()
    )

    return {
        "total_companies": 1,
        "total_users": total_users,
        "active_users": active_users,
        "admin_users": admin_users,
        "total_audit_logs": total_audit_logs,
        "total_refresh_tokens": total_refresh_tokens,
        "user": current_user.name,
        "role": current_user.role,
    }