
from fastapi import APIRouter, Depends

from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.services.logout_service import logout_user
from app.services.audit_service import create_audit_log


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


@router.post("/logout")
def logout(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    # ---------------------------------------------------------
    # Task 13 - Audit successful logout
    # ---------------------------------------------------------
    create_audit_log(
        db=db,
        company_id=current_user.company_id,
        user_id=current_user.id,
        action="User Logout",
        entity_name="User",
        resource_type="User",
        resource_id=str(current_user.id),
        description=(
            f"User '{current_user.email}' logged out successfully"
        ),
        status="SUCCESS",
    )

    # ---------------------------------------------------------
    # Existing logout functionality
    # ---------------------------------------------------------
    return logout_user(
        db=db,
        user_id=current_user.id,
    )

