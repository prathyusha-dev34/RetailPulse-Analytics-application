from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class CategoryBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    description: Optional[str] = None
    status: str = "ACTIVE"


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=150)
    description: Optional[str] = None
    status: Optional[str] = None


class CategoryResponse(CategoryBase):
    id: int
    company_id: int
    created_at: datetime
    updated_at: datetime
    product_count: int = 0

    model_config = ConfigDict(from_attributes=True)