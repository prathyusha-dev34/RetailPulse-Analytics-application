from datetime import datetime

from sqlalchemy.orm import Session

from app.models.company import Company
from app.models.user import User
from app.models.refresh_token import RefreshToken

from app.schemas.company import CompanyRegister
from app.schemas.auth import LoginRequest

from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
)

from app.services.audit_service import create_audit_log


def register_company(db: Session, data: CompanyRegister):

    existing_company = db.query(Company).filter(
        Company.email == data.company_email
    ).first()

    if existing_company:
        raise ValueError("Company email already exists")

    existing_user = db.query(User).filter(
        User.email == data.owner_email
    ).first()

    if existing_user:
        raise ValueError("User email already exists")

    if data.password != data.confirm_password:
        raise ValueError("Passwords do not match")

    company = Company(
        name=data.company_name,
        industry=data.industry,
        email=data.company_email,
        address=data.address,
        phone=data.phone,
    )

    db.add(company)
    db.commit()
    db.refresh(company)

    user = User(
        company_id=company.id,
        name=data.owner_name,
        email=data.owner_email,
        password=hash_password(data.password),
        role="COMPANY_ADMIN",
        status="ACTIVE",
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    # Audit Log
    create_audit_log(
        db=db,
        company_id=company.id,
        user_id=user.id,
        action="Company Registered",
    )

    return company


def login_user(db: Session, data: LoginRequest):

    user = db.query(User).filter(
        User.email == data.email
    ).first()

    if not user:
        raise ValueError("Invalid email or password")

    if not verify_password(
        data.password,
        user.password,
    ):
        raise ValueError("Invalid email or password")

    access_token = create_access_token(
        {
            "sub": user.email,
            "user_id": user.id,
            "company_id": user.company_id,
            "role": user.role,
        }
    )

    refresh_token = create_refresh_token(
        {
            "sub": user.email,
            "user_id": user.id,
        }
    )

    user.last_login = datetime.utcnow()

    db.add(
        RefreshToken(
            user_id=user.id,
            token=refresh_token,
            expires_at=datetime.utcnow(),
        )
    )

    db.commit()

    # Audit Log
    create_audit_log(
        db=db,
        company_id=user.company_id,
        user_id=user.id,
        action="User Login",
    )

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }