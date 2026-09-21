from datetime import datetime, timedelta

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


def register_company(
    db: Session,
    data: CompanyRegister,
):
    # ---------------------------------------------------------
    # Check existing company
    # ---------------------------------------------------------
    existing_company = (
        db.query(Company)
        .filter(
            Company.email == data.company_email
        )
        .first()
    )

    if existing_company:
        raise ValueError(
            "Company email already exists"
        )

    # ---------------------------------------------------------
    # Check existing user
    # ---------------------------------------------------------
    existing_user = (
        db.query(User)
        .filter(
            User.email == data.owner_email
        )
        .first()
    )

    if existing_user:
        raise ValueError(
            "User email already exists"
        )

    # ---------------------------------------------------------
    # Validate password confirmation
    # ---------------------------------------------------------
    if data.password != data.confirm_password:
        raise ValueError(
            "Passwords do not match"
        )

    # ---------------------------------------------------------
    # Create company
    # ---------------------------------------------------------
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

    # ---------------------------------------------------------
    # Create company admin user
    # ---------------------------------------------------------
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

    # ---------------------------------------------------------
    # Task 13 - Audit company registration
    # ---------------------------------------------------------
    create_audit_log(
        db=db,
        company_id=company.id,
        user_id=user.id,
        action="Company Registered",
        entity_name="Company",
        resource_type="Company",
        resource_id=str(company.id),
        description=(
            f"Company '{company.name}' "
            f"registered successfully"
        ),
        status="SUCCESS",
    )

    return company


def login_user(
    db: Session,
    data: LoginRequest,
    ip_address: str = "",
    user_agent: str = "",
):
    # ---------------------------------------------------------
    # Find user
    # ---------------------------------------------------------
    user = (
        db.query(User)
        .filter(
            User.email == data.email
        )
        .first()
    )

    if not user:
        raise ValueError(
            "Invalid email or password"
        )

    # ---------------------------------------------------------
    # Verify password
    # ---------------------------------------------------------
    if not verify_password(
        data.password,
        user.password,
    ):
        raise ValueError(
            "Invalid email or password"
        )

    # ---------------------------------------------------------
    # Create access token
    # ---------------------------------------------------------
    access_token = create_access_token(
        {
            "sub": user.email,
            "user_id": user.id,
            "company_id": user.company_id,
            "role": user.role,
        }
    )

    # ---------------------------------------------------------
    # Create refresh token
    # ---------------------------------------------------------
    refresh_token = create_refresh_token(
        {
            "sub": user.email,
            "user_id": user.id,
        }
    )

    # ---------------------------------------------------------
    # Update last login
    # ---------------------------------------------------------
    user.last_login = datetime.utcnow()

    # ---------------------------------------------------------
    # Store refresh token
    # ---------------------------------------------------------
    db.add(
        RefreshToken(
            user_id=user.id,
            token=refresh_token,
            expires_at=(
                datetime.utcnow()
                + timedelta(days=7)
            ),
        )
    )

    db.commit()

    # ---------------------------------------------------------
    # Task 13 - Audit successful login
    # ---------------------------------------------------------
    create_audit_log(
        db=db,
        company_id=user.company_id,
        user_id=user.id,
        action="User Login",
        entity_name="User",
        ip_address=ip_address,
        browser=user_agent,
        resource_type="User",
        resource_id=str(user.id),
        description=(
            f"User '{user.email}' "
            f"logged in successfully"
        ),
        user_agent=user_agent,
        status="SUCCESS",
        after_values={
            "login_time": (
                user.last_login.isoformat()
                if user.last_login
                else None
            ),
        },
    )

    # ---------------------------------------------------------
    # Return authentication response
    # ---------------------------------------------------------
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "company": (
                user.company.name
                if user.company
                else ""
            ),
            "last_login": (
                user.last_login.isoformat()
                if user.last_login
                else None
            ),
            "status": user.status,
        },
    }