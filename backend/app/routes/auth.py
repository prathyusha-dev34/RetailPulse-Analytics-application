from fastapi import APIRouter, Depends, HTTPException, Request

from sqlalchemy.orm import Session

from pydantic import BaseModel

from app.core.database import get_db
from app.schemas.company import CompanyRegister, CompanyResponse
from app.schemas.auth import LoginRequest, TokenResponse
from app.services.auth_service import (
    register_company,
    login_user,
)


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


class ForgotPasswordRequest(BaseModel):
    email: str


def get_request_details(request: Request):
    """
    Get client IP address and User-Agent safely.
    """

    forwarded_for = request.headers.get(
        "X-Forwarded-For"
    )

    if forwarded_for:
        ip_address = forwarded_for.split(",")[0].strip()
    else:
        ip_address = (
            request.client.host
            if request.client
            else ""
        )

    user_agent = request.headers.get(
        "User-Agent",
        "",
    )

    return ip_address, user_agent


@router.post(
    "/register-company",
    response_model=CompanyResponse,
)
def register(
    company: CompanyRegister,
    db: Session = Depends(get_db),
):
    try:
        return register_company(
            db,
            company,
        )

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e),
        )


@router.post(
    "/login",
    response_model=TokenResponse,
)
def login(
    request: Request,
    user: LoginRequest,
    db: Session = Depends(get_db),
):
    ip_address, user_agent = get_request_details(
        request
    )

    try:
        return login_user(
            db,
            user,
            ip_address=ip_address,
            user_agent=user_agent,
        )

    except ValueError as e:
        raise HTTPException(
            status_code=401,
            detail=str(e),
        )


@router.post("/forgot-password")
def forgot_password(
    data: ForgotPasswordRequest,
):
    return {
        "message": (
            "Password reset functionality "
            "will be available soon."
        )
    }