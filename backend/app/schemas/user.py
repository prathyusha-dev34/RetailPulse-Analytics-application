from pydantic import BaseModel, EmailStr
from datetime import datetime


class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str
    status: str
    last_login: datetime | None = None

    class Config:
        from_attributes = True