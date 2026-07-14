from datetime import datetime

from sqlalchemy.orm import Session

from app.models.refresh_token import RefreshToken
from app.models.user import User
from app.core.security import create_access_token


def refresh_access_token(db: Session, refresh_token: str):

    token = db.query(RefreshToken).filter(
        RefreshToken.token == refresh_token
    ).first()

    if not token:
        raise ValueError("Invalid refresh token")

    user = db.query(User).filter(
        User.id == token.user_id
    ).first()

    if not user:
        raise ValueError("User not found")

    access_token = create_access_token(
        {
            "sub": user.email,
            "user_id": user.id,
            "company_id": user.company_id,
            "role": user.role,
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
    }