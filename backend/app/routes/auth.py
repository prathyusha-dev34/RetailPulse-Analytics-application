from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.company import CompanyRegister, CompanyResponse
from app.schemas.auth import LoginRequest, TokenResponse
from app.services.auth_service import register_company, login_user

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


@router.post(
    "/register-company",
    response_model=CompanyResponse
)
def register(
    company: CompanyRegister,
    db: Session = Depends(get_db)
):
    try:
        return register_company(db, company)

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )


@router.post(
    "/login",
    response_model=TokenResponse
)
def login(
    user: LoginRequest,
    db: Session = Depends(get_db)
):
    try:
        return login_user(db, user)

    except ValueError as e:
        raise HTTPException(
            status_code=401,
            detail=str(e)
        )