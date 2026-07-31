from datetime import datetime
from decimal import Decimal
from typing import List, Optional

from pydantic import (
    BaseModel,
    Field,
    ConfigDict,
)


# ===============================
# SALE ITEM CREATE
# ===============================

class SaleItemCreate(BaseModel):

    product_id: int

    quantity: int = Field(
        ...,
        gt=0
    )

    unit_price: Decimal = Field(
        ...,
        ge=0
    )

    discount: Decimal = Field(
        default=Decimal("0.00"),
        ge=0
    )

    tax: Decimal = Field(
        default=Decimal("0.00"),
        ge=0
    )


# ===============================
# SALE ITEM RESPONSE
# ===============================

class SaleItemResponse(BaseModel):

    id: int

    product_id: int

    category_id: Optional[int] = None

    quantity: int

    unit_price: Decimal

    discount: Decimal

    tax: Decimal

    total: Decimal


    model_config = ConfigDict(
        from_attributes=True
    )



# ===============================
# CREATE SALE
# ===============================

class SaleCreate(BaseModel):

    customer_id: int = Field(
        ...,
        gt=0
    )

    sales_channel: str

    payment_method: str

    items: List[SaleItemCreate]



# ===============================
# UPDATE SALE
# ===============================

class SaleUpdate(BaseModel):

    customer_id: Optional[int] = None

    sales_channel: Optional[str] = None

    payment_method: Optional[str] = None

    items: Optional[List[SaleItemCreate]] = None



# ===============================
# SALE RESPONSE
# ===============================

class SaleResponse(BaseModel):

    id: int

    invoice_number: str

    customer_id: int

    customer_name: str

    sale_date: datetime

    sales_channel: str

    payment_method: str

    total_amount: Decimal

    items: List[SaleItemResponse]


    model_config = ConfigDict(
        from_attributes=True
    )



# ===============================
# DASHBOARD
# ===============================

class SalesDashboardSummary(BaseModel):

    total_sales: int

    total_revenue: Decimal

    total_orders: int

    average_order_value: Decimal