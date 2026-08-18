from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field


# ============================================================
# COMMON
# ============================================================

class AnalyticsDateRange(BaseModel):
    from_date: Optional[str] = None
    to_date: Optional[str] = None


# ============================================================
# SUMMARY / KPI
# ============================================================

class SalesAnalyticsSummary(BaseModel):
    total_revenue: Decimal = Field(default=Decimal("0.00"))
    total_orders: int = Field(default=0)
    average_order_value: Decimal = Field(default=Decimal("0.00"))
    total_items_sold: int = Field(default=0)
    total_discount: Decimal = Field(default=Decimal("0.00"))
    total_tax: Decimal = Field(default=Decimal("0.00"))


# ============================================================
# REVENUE TREND
# ============================================================

class SalesTrendItem(BaseModel):
    date: str
    revenue: Decimal = Field(default=Decimal("0.00"))


# ============================================================
# SALES VS ORDERS
# ============================================================

class SalesVsOrdersItem(BaseModel):
    date: str

    revenue: Decimal = Field(
        default=Decimal("0.00")
    )

    orders: int = Field(
        default=0
    )


# ============================================================
# PRODUCT ANALYTICS
# ============================================================

class ProductAnalyticsItem(BaseModel):
    product_id: int

    product_name: str

    sku: str = ""

    quantity_sold: int = Field(
        default=0
    )

    revenue: Decimal = Field(
        default=Decimal("0.00")
    )


# ============================================================
# CUSTOMER ANALYTICS
# ============================================================

class CustomerAnalyticsItem(BaseModel):
    customer_id: int

    customer_name: str

    orders: int = Field(
        default=0
    )

    total_spend: Decimal = Field(
        default=Decimal("0.00")
    )

    average_order_value: Decimal = Field(
        default=Decimal("0.00")
    )


# ============================================================
# PAYMENT METHOD ANALYTICS
# ============================================================

class PaymentMethodAnalyticsItem(BaseModel):
    method: str

    transactions: int = Field(
        default=0
    )

    revenue: Decimal = Field(
        default=Decimal("0.00")
    )


# ============================================================
# EXPORT
# ============================================================

class AnalyticsExportResponse(BaseModel):
    filename: str
    content_type: str


# ============================================================
# FILTERS
# ============================================================

class AnalyticsFilters(BaseModel):
    from_date: Optional[str] = None

    to_date: Optional[str] = None

    period: str = "daily"

    product_id: Optional[int] = None

    category_id: Optional[int] = None

    customer_id: Optional[int] = None

    payment_method: Optional[str] = None