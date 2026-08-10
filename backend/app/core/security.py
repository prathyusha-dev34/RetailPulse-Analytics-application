from datetime import datetime, timedelta
import os

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.models.user import User
from app.core.database import get_db


# ==========================================================
# JWT CONFIG
# ==========================================================

SECRET_KEY = os.getenv(
    "SECRET_KEY",
    "dev_secret_key_change_me"
)

ALGORITHM = os.getenv(
    "ALGORITHM",
    "HS256"
)

ACCESS_TOKEN_EXPIRE_MINUTES = int(
    os.getenv(
        "ACCESS_TOKEN_EXPIRE_MINUTES",
        "60"
    )
)


# ==========================================================
# PASSWORD HASHING
# ==========================================================

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)


# ==========================================================
# BEARER AUTH
# ==========================================================

security = HTTPBearer()


# ==========================================================
# PASSWORD FUNCTIONS
# ==========================================================

def verify_password(
    plain_password: str,
    hashed_password: str
):
    return pwd_context.verify(
        plain_password,
        hashed_password
    )


def get_password_hash(
    password: str
):
    return pwd_context.hash(
        password
    )


# Existing services compatibility
def hash_password(
    password: str
):
    return pwd_context.hash(
        password
    )


# ==========================================================
# ACCESS TOKEN
# ==========================================================

def create_access_token(
    data: dict,
    expires_delta: timedelta | None = None
):

    to_encode = data.copy()


    if expires_delta:

        expire = datetime.utcnow() + expires_delta

    else:

        expire = datetime.utcnow() + timedelta(
            minutes=ACCESS_TOKEN_EXPIRE_MINUTES
        )


    to_encode.update(
        {
            "exp": expire
        }
    )


    return jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM
    )


# ==========================================================
# REFRESH TOKEN
# ==========================================================

def create_refresh_token(
    data: dict
):

    to_encode = data.copy()


    expire = datetime.utcnow() + timedelta(
        days=7
    )


    to_encode.update(
        {
            "exp": expire,
            "type": "refresh"
        }
    )


    return jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM
    )


# ==========================================================
# CURRENT USER
# ==========================================================

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):

    token = credentials.credentials


    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={
            "WWW-Authenticate": "Bearer"
        }
    )


    try:

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )


        user_identity = payload.get("sub")


        if user_identity is None:

            raise credentials_exception


    except JWTError:

        raise credentials_exception



    # ======================================================
    # SUPPORT BOTH ID AND EMAIL LOGIN TOKENS
    # ======================================================

    if str(user_identity).isdigit():

        user = (
            db.query(User)
            .filter(
                User.id == int(user_identity)
            )
            .first()
        )

    else:

        user = (
            db.query(User)
            .filter(
                User.email == user_identity
            )
            .first()
        )



    if user is None:

        raise HTTPException(
            status_code=404,
            detail="User not found"
        )


    return user



# ==========================================================
# ADMIN AUTHORIZATION
# ==========================================================

def get_admin_user(
    current_user: User = Depends(get_current_user)
):

    if not getattr(current_user, "is_admin", False):

        raise HTTPException(
            status_code=403,
            detail="Admin access required"
        )


    return current_user