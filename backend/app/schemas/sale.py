from datetime import datetime
from decimal import Decimal
from typing import List, Optional

from pydantic import (
    BaseModel,
    Field,
    ConfigDict,
)



# ==================================
# Sale Item Create
# ==================================

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
        default=0,
        ge=0
    )


    tax: Decimal = Field(
        default=0,
        ge=0
    )




# ==================================
# Sale Item Response
# ==================================

class SaleItemResponse(BaseModel):

    id: int

    product_id: int

    category_id: int

    quantity: int

    unit_price: Decimal

    discount: Decimal

    tax: Decimal

    total: Decimal



    model_config = ConfigDict(
        from_attributes=True
    )





# ==================================
# Create Sale
# ==================================

class SaleCreate(BaseModel):

    customer_name: str


    sales_channel: str


    payment_method: str


    items: List[SaleItemCreate]





# ==================================
# Update Sale
# ==================================

class SaleUpdate(BaseModel):

    customer_name: Optional[str] = None


    sales_channel: Optional[str] = None


    payment_method: Optional[str] = None


    items: Optional[
        List[SaleItemCreate]
    ] = None





# ==================================
# Sale Response
# ==================================

class SaleResponse(BaseModel):

    id: int


    invoice_number: str


    customer_name: str


    sale_date: datetime


    sales_channel: str


    payment_method: str


    total_amount: Decimal


    items: List[
        SaleItemResponse
    ]



    model_config = ConfigDict(
        from_attributes=True
    )





# ==================================
# Dashboard Response
# ==================================

class SalesDashboardSummary(BaseModel):

    total_sales: Decimal

    total_revenue: Decimal

    total_orders: int

    average_order_value: Decimal

    