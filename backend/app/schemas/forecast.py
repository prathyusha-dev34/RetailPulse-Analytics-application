from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field, model_validator


# ==========================================================
# GENERATE FORECAST REQUEST
# ==========================================================

class ForecastGenerateRequest(BaseModel):
    forecast_period: str = Field(
        ...,
        description="7_DAYS | 30_DAYS | 90_DAYS | CUSTOM",
    )

    start_date: Optional[date] = None
    end_date: Optional[date] = None

    @model_validator(mode="after")
    def validate_custom_dates(self):
        if self.forecast_period == "CUSTOM":
            if not self.start_date or not self.end_date:
                raise ValueError(
                    "Custom forecast requires start_date and end_date"
                )

            if self.start_date > self.end_date:
                raise ValueError(
                    "start_date cannot be greater than end_date"
                )

        return self


# ==========================================================
# FILTER REQUEST
# ==========================================================

class ForecastFilterRequest(BaseModel):
    product: Optional[str] = None
    category: Optional[str] = None
    brand: Optional[str] = None
    forecast_period: Optional[str] = None
    recommendation: Optional[str] = None

    sort_by: Optional[str] = Field(
        default="predicted_demand",
        description="""
        predicted_demand
        lowest_stock
        highest_growth
        forecast_accuracy
        """,
    )


# ==========================================================
# PRODUCT FORECAST RESPONSE
# ==========================================================

class ProductForecastResponse(BaseModel):
    product_id: int
    product: str
    sku: str

    category_id: int
    category: str

    brand: Optional[str] = None
    supplier: Optional[str] = None

    unit_price: float

    forecast_days: int

    historical_sales: float
    average_daily_sales: float
    forecasted_demand: float
    forecast_value: float

    confidence_score: float

    current_stock: int
    safety_stock: int
    reorder_point: int

    days_of_stock_remaining: Optional[float] = None

    recommended_quantity: int

    stock_risk: str
    reorder_required: bool

    model_config = ConfigDict(
        from_attributes=True
    )


# ==========================================================
# CATEGORY FORECAST RESPONSE
# ==========================================================

class CategoryForecastResponse(BaseModel):
    category_id: int
    category: str

    forecast_days: int
    product_count: int

    historical_sales: float
    forecasted_demand: float

    current_stock: int
    recommended_quantity: int

    forecast_value: float

    confidence_total: float
    average_confidence: float

    category_recommendation: int

    model_config = ConfigDict(
        from_attributes=True
    )


# ==========================================================
# RISK SUMMARY
# ==========================================================

class ForecastRiskSummary(BaseModel):
    OUT_OF_STOCK: int = 0
    STOCKOUT_RISK: int = 0
    LOW_STOCK: int = 0
    HEALTHY: int = 0
    OVERSTOCK: int = 0


# ==========================================================
# DASHBOARD KPI
# ==========================================================

class ForecastDashboardResponse(BaseModel):
    total_predicted_demand: int = 0
    products_expected_to_run_out: int = 0
    high_growth_products: int = 0
    slow_moving_products: int = 0
    forecast_accuracy: float = 0.0
    total_forecasts: int = 0


# ==========================================================
# INVENTORY RECOMMENDATION
# ==========================================================

class InventoryRecommendationResponse(BaseModel):
    product_id: int
    product_name: str
    category_name: str
    current_stock: int
    predicted_demand: int
    recommendation: str
    confidence_score: float

    model_config = ConfigDict(
        from_attributes=True
    )


# ==========================================================
# FORECAST HISTORY
# ==========================================================

class ForecastHistoryResponse(BaseModel):
    id: int
    historical_sales: int
    prediction: int
    accuracy: float
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )


# ==========================================================
# CHART RESPONSES
# ==========================================================

class HistoricalForecastChart(BaseModel):
    period: str
    historical_sales: int
    predicted_sales: int


class ProductTrendChart(BaseModel):
    product: str
    demand: float


class CategoryTrendChart(BaseModel):
    category: str
    demand: float


class SeasonalPatternChart(BaseModel):
    month: str
    sales: float
    forecast: float


# ==========================================================
# EXPORT RESPONSE
# ==========================================================

class ForecastExportResponse(BaseModel):
    message: str
    file_name: str


# ==========================================================
# COMPLETE FORECAST ANALYTICS RESPONSE
#
# IMPORTANT:
# This matches get_forecast_analytics() actual response.
# ==========================================================

class ForecastAnalyticsResponse(BaseModel):

    forecast_period: str
    forecast_days: int

    total_products: int

    total_historical_sales: float
    total_forecasted_demand: float
    forecast_growth_percentage: float

    total_current_stock: int
    total_recommended_quantity: int

    average_confidence_score: float

    out_of_stock_count: int
    stockout_risk_count: int
    low_stock_count: int
    healthy_stock_count: int
    overstock_count: int

    risk_summary: ForecastRiskSummary

    top_products: List[ProductForecastResponse]

    categories: List[CategoryForecastResponse]

    # These are kept optional so the existing service can return
    # the current flat response without validation errors.
    category_trend: List[CategoryTrendChart] = Field(default_factory=list)

    seasonal_pattern: List[SeasonalPatternChart] = Field(default_factory=list)

    model_config = ConfigDict(
        from_attributes=True
    )