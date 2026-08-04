from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    model_validator,
)



# ==========================================================
# GENERATE FORECAST REQUEST
# ==========================================================

class ForecastGenerateRequest(BaseModel):

    forecast_period: str = Field(

        ...,

        description=
        "7_DAYS | 30_DAYS | 90_DAYS | CUSTOM"

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

        description=
        """
        predicted_demand
        lowest_stock
        highest_growth
        forecast_accuracy
        """

    )





# ==========================================================
# PRODUCT FORECAST RESPONSE
# ==========================================================


class ProductForecastResponse(BaseModel):

    id: int


    product_id: int


    category_id: int


    product_name: str


    category_name: str


    brand: Optional[str] = None


    current_stock: int


    available_stock: int


    reorder_level: int


    historical_sales: int


    predicted_demand: int


    expected_growth_percentage: float


    confidence_score: float


    forecast_accuracy: float


    forecast_period: str


    recommendation: str


    forecast_value: Decimal


    generated_at: datetime



    model_config = ConfigDict(

        from_attributes=True

    )





# ==========================================================
# CATEGORY FORECAST RESPONSE
# ==========================================================


class CategoryForecastResponse(BaseModel):


    category_id: int


    category_name: str


    total_historical_sales: int


    predicted_demand: int


    expected_growth_percentage: float


    confidence_score: float


    forecast_accuracy: float


    forecast_value: Decimal



    model_config = ConfigDict(

        from_attributes=True

    )





# ==========================================================
# DASHBOARD KPI
# ==========================================================


class ForecastDashboardResponse(BaseModel):


    total_predicted_demand: int


    products_expected_to_run_out: int


    high_growth_products: int


    slow_moving_products: int


    forecast_accuracy: float


    total_forecasts: int





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


    demand: int





class CategoryTrendChart(BaseModel):

    category: str


    demand: int





class SeasonalPatternChart(BaseModel):

    month: str


    sales: int


    forecast: int





# ==========================================================
# EXPORT RESPONSE
# ==========================================================


class ForecastExportResponse(BaseModel):

    message: str


    file_name: str





# ==========================================================
# COMPLETE DASHBOARD RESPONSE
# ==========================================================


class ForecastAnalyticsResponse(BaseModel):


    dashboard: ForecastDashboardResponse


    product_forecasts: List[ProductForecastResponse]


    category_forecasts: List[CategoryForecastResponse]


    recommendations: List[InventoryRecommendationResponse]


    historical_vs_forecast: List[HistoricalForecastChart]


    product_trend: List[ProductTrendChart]


    category_trend: List[CategoryTrendChart]


    seasonal_pattern: List[SeasonalPatternChart]