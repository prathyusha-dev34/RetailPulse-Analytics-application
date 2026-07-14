from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.token import RefreshRequest, AccessTokenResponse
from app.services.token_service import refresh_access_token

router = APIRouter(
    prefix="/token",
    tags=["Token"],
)


@router.post(
    "/refresh",
    response_model=AccessTokenResponse,
)
def refresh(
    data: RefreshRequest,
    db: Session = Depends(get_db),
):
    try:
        return refresh_access_token(
            db,
            data.refresh_token,
        )

    except ValueError as e:
        raise HTTPException(
            status_code=401,
            detail=str(e),
        )