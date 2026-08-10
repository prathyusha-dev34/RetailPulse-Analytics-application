from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
)


# ============================================================
# SALE ITEM
# ============================================================

class SaleItemBase(BaseModel):
    product_id: int
    quantity: int = Field(
        ...,
        gt=0,
    )
    unit_price: Decimal
    discount: Decimal = Decimal("0.00")
    tax: Decimal = Decimal("0.00")


class SaleItemCreate(SaleItemBase):
    pass


class SaleItemResponse(BaseModel):
    id: int
    product_id: int

    # Product information
    product_name: Optional[str] = None
    sku: Optional[str] = None

    # Category information
    category_id: Optional[int] = None
    category_name: Optional[str] = None

    quantity: int
    unit_price: Decimal
    discount: Decimal
    tax: Decimal
    total: Decimal

    model_config = ConfigDict(
        from_attributes=True,
    )


# ============================================================
# SALE CREATE
# ============================================================

class SaleCreate(BaseModel):
    customer_id: int

    sale_date: Optional[datetime] = None

    sales_channel: Optional[str] = "STORE"

    payment_method: str

    payment_status: Optional[str] = "PAID"

    invoice_number: Optional[str] = None

    items: list[SaleItemCreate]


# ============================================================
# SALE UPDATE
# ============================================================

class SaleUpdate(BaseModel):
    customer_id: Optional[int] = None

    sale_date: Optional[datetime] = None

    sales_channel: Optional[str] = None

    payment_method: Optional[str] = None

    payment_status: Optional[str] = None

    items: Optional[list[SaleItemCreate]] = None


# ============================================================
# SALE RESPONSE
# ============================================================

class SaleResponse(BaseModel):
    id: int

    company_id: int

    customer_id: Optional[int] = None

    customer_name: Optional[str] = None

    invoice_number: Optional[str] = None

    sale_date: Optional[datetime] = None

    sales_channel: Optional[str] = None

    payment_method: Optional[str] = None

    payment_status: Optional[str] = None

    total_amount: Decimal

    created_by: Optional[int] = None

    is_deleted: bool = False

    items: list[SaleItemResponse] = []

    model_config = ConfigDict(
        from_attributes=True,
    )