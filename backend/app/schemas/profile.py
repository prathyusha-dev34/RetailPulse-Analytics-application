from pydantic import BaseModel, EmailStr
from datetime import datetime


class ProfileResponse(BaseModel):
    name: str
    email: EmailStr
    role: str
    company: str
    status: str
    last_login: datetime | None = None

    class Config:
        from_attributes = True