from sqlalchemy.orm import Session

from app.models.user import User
from app.core.security import verify_password, hash_password
from app.services.audit_service import create_audit_log


def change_password(
    db: Session,
    user: User,
    current_password: str,
    new_password: str,
    confirm_password: str,
):
    if not verify_password(current_password, user.password):
        raise ValueError("Current password is incorrect")

    if new_password != confirm_password:
        raise ValueError("Passwords do not match")

    user.password = hash_password(new_password)

    db.commit()
    db.refresh(user)

    create_audit_log(
        db=db,
        company_id=user.company_id,
        user_id=user.id,
        action="Password Changed",
    )

    return {
        "message": "Password changed successfully"
    }