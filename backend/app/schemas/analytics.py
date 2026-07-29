from datetime import date
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel




# =====================================================
# DASHBOARD SUMMARY
# =====================================================


class DashboardSummary(BaseModel):

    total_revenue: Decimal

    total_orders: int

    total_products_sold: int

    average_order_value: Decimal

    total_inventory_value: Decimal

    low_stock_products: int

    out_of_stock_products: int

    total_categories: int





# =====================================================
# REVENUE TREND
# =====================================================


class RevenueTrend(BaseModel):

    date: str

    revenue: Decimal





# =====================================================
# SALES TREND
# =====================================================


class SalesTrend(BaseModel):

    date: str

    sales: int





# =====================================================
# PRODUCT ANALYTICS
# =====================================================


class ProductAnalytics(BaseModel):

    product_id: int

    product_name: str

    quantity: int

    revenue: Decimal





# =====================================================
# CATEGORY ANALYTICS
# =====================================================


class CategoryAnalytics(BaseModel):

    category_id: Optional[int] = None

    category_name: str

    quantity: int

    revenue: Decimal





# =====================================================
# PAYMENT ANALYTICS
# =====================================================


class PaymentAnalytics(BaseModel):

    method: str

    orders: int

    amount: Decimal





# =====================================================
# SALES CHANNEL ANALYTICS
# =====================================================


class SalesChannelAnalytics(BaseModel):

    channel: str

    orders: int

    revenue: Decimal





# =====================================================
# INVENTORY DISTRIBUTION
# =====================================================


class InventoryDistribution(BaseModel):

    category: str

    quantity: int





# =====================================================
# INVENTORY VALUE BY CATEGORY
# =====================================================


class InventoryValue(BaseModel):

    category_name: str

    value: Decimal





# =====================================================
# STOCK STATUS
# =====================================================


class StockStatus(BaseModel):

    status: str

    count: int





# =====================================================
# LOW STOCK PRODUCTS
# =====================================================


class LowStockProduct(BaseModel):

    product_id:int

    product_name:str

    sku:str

    brand:str

    available_stock:int

    reorder_level:int



# =====================================================
# OUT OF STOCK PRODUCTS
# =====================================================


class OutOfStockProduct(BaseModel):

    product_id: int

    product_name: str

    brand: Optional[str] = None

    available_stock: int





# =====================================================
# ANALYTICS FILTERS
# =====================================================


class AnalyticsFilter(BaseModel):

    from_date: Optional[date] = None

    to_date: Optional[date] = None


    product: Optional[str] = None

    category: Optional[str] = None

    brand: Optional[str] = None


    sales_channel: Optional[str] = None

    payment_method: Optional[str] = None