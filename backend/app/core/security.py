from datetime import datetime, timedelta

from jose import jwt, JWTError
from passlib.context import CryptContext

from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from sqlalchemy.orm import Session


from app.core.config import (
    SECRET_KEY,
    ALGORITHM,
    ACCESS_TOKEN_EXPIRE_MINUTES
)

from app.core.database import get_db

from app.models.user import User



pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)



security = HTTPBearer()



# -----------------------------
# Password
# -----------------------------

def hash_password(password: str):

    return pwd_context.hash(password)



def verify_password(
    plain_password: str,
    hashed_password: str
):

    return pwd_context.verify(
        plain_password,
        hashed_password
    )



# -----------------------------
# Access Token
# -----------------------------

def create_access_token(data: dict):

    to_encode = data.copy()


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



# -----------------------------
# Refresh Token
# -----------------------------

def create_refresh_token(data: dict):

    to_encode = data.copy()


    expire = datetime.utcnow() + timedelta(
        days=7
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



# -----------------------------
# Decode Token
# -----------------------------

def decode_token(token: str):

    try:

        return jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )


    except JWTError:

        raise HTTPException(
            status_code=401,
            detail="Invalid token"
        )



# -----------------------------
# Current User
# -----------------------------

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):

    token = credentials.credentials


    payload = decode_token(token)


    user_id = payload.get(
        "user_id"
    )


    if not user_id:

        raise HTTPException(
            status_code=401,
            detail="Invalid token"
        )



    user = (
        db.query(User)
        .filter(
            User.id == user_id
        )
        .first()
    )



    if not user:

        raise HTTPException(
            status_code=404,
            detail="User not found"
        )


    return user