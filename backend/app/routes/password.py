from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.schemas.password import ChangePasswordRequest
from app.services.password_service import change_password

router = APIRouter(
    prefix="/profile",
    tags=["Profile"],
)


@router.post("/change-password")
def change_user_password(
    data: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    try:
        return change_password(
            db=db,
            user=current_user,
            current_password=data.current_password,
            new_password=data.new_password,
            confirm_password=data.confirm_password,
        )

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e),
        )