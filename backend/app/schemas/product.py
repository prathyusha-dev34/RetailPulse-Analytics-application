from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


# =====================================================
# PRODUCT BASE
# =====================================================

class ProductBase(BaseModel):
    name: str = Field(
        ...,
        min_length=2,
        max_length=200,
    )

    sku: str = Field(
        ...,
        min_length=3,
        max_length=100,
    )

    category_id: int

    brand: Optional[str] = None

    description: Optional[str] = None

    unit_price: Decimal = Field(
        ...,
        ge=0,
    )

    cost_price: Decimal = Field(
        ...,
        ge=0,
    )

    stock_quantity: int = Field(
        default=0,
        ge=0,
    )


# =====================================================
# PRODUCT CREATE
# =====================================================

class ProductCreate(ProductBase):
    pass


# =====================================================
# PRODUCT UPDATE
# =====================================================

class ProductUpdate(BaseModel):
    name: Optional[str] = Field(
        default=None,
        min_length=2,
        max_length=200,
    )

    sku: Optional[str] = Field(
        default=None,
        min_length=3,
        max_length=100,
    )

    category_id: Optional[int] = None

    brand: Optional[str] = None

    description: Optional[str] = None

    unit_price: Optional[Decimal] = Field(
        default=None,
        ge=0,
    )

    cost_price: Optional[Decimal] = Field(
        default=None,
        ge=0,
    )

    stock_quantity: Optional[int] = Field(
        default=None,
        ge=0,
    )


# =====================================================
# PRODUCT RESPONSE
# =====================================================

class ProductResponse(ProductBase):
    id: int

    company_id: int

    created_at: Optional[datetime] = None

    updated_at: Optional[datetime] = None

    model_config = ConfigDict(
        from_attributes=True,
    )


# =====================================================
# PRODUCT LIST RESPONSE
# =====================================================

class ProductListResponse(BaseModel):
    items: list[ProductResponse]

    total: int

    page: int = 1

    page_size: int = 10

    model_config = ConfigDict(
        from_attributes=True,
    )