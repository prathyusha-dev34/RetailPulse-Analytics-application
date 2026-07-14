from pydantic import BaseModel, EmailStr, Field


class CompanyRegister(BaseModel):
    company_name: str = Field(..., min_length=2)
    industry: str
    company_email: EmailStr
    address: str
    phone: str

    owner_name: str
    owner_email: EmailStr

    password: str = Field(..., min_length=8)
    confirm_password: str = Field(..., min_length=8)


class CompanyResponse(BaseModel):
    id: int
    name: str
    industry: str
    email: EmailStr
    address: str
    phone: str

    class Config:
        from_attributes = True