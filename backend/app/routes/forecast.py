
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import get_current_user

from app.services.forecast_service import (
    generate_all_forecasts,
    get_forecast_analytics,
    get_product_forecasts,
    get_category_forecasts,
    get_inventory_recommendations,
    get_inventory_forecast,
    get_top_predicted_products,
    create_forecast_notifications,
    export_product_forecast_csv,
    export_category_forecast_csv,
    export_product_forecast_pdf,
    create_forecast_audit_log,
)

from app.schemas.forecast import (
    ForecastGenerateRequest,
    ForecastAnalyticsResponse,
)


# ============================================================
# CONSTANTS
# ============================================================

VALID_FORECAST_PERIODS = {7, 30, 90}

DEFAULT_FORECAST_DAYS = 30
DEFAULT_LEAD_TIME_DAYS = 7
DEFAULT_SAFETY_STOCK_DAYS = 3

MAX_TOP_PRODUCTS_LIMIT = 100

VALID_SORT_ORDERS = {"asc", "desc"}


# ============================================================
# HELPER FUNCTIONS
# ============================================================

def validate_forecast_period(
    forecast_period: str | None,
    default: int = DEFAULT_FORECAST_DAYS,
) -> int:
    """
    Convert forecast period to integer and validate it.

    Supported forecast periods:
        7 days
        30 days
        90 days
    """

    if forecast_period is None or str(forecast_period).strip() == "":
        return default

    try:
        days = int(str(forecast_period).strip())
    except (TypeError, ValueError):
        raise ValueError(
            "forecast_period must be one of: 7, 30, or 90 days."
        )

    if days not in VALID_FORECAST_PERIODS:
        raise ValueError(
            "forecast_period must be one of: 7, 30, or 90 days."
        )

    return days


def validate_positive_integer(
    value: int,
    field_name: str,
    maximum: int | None = None,
) -> int:
    """
    Validate positive integer query parameters.
    """

    if value < 1:
        raise ValueError(
            f"{field_name} must be greater than 0."
        )

    if maximum is not None and value > maximum:
        raise ValueError(
            f"{field_name} must not exceed {maximum}."
        )

    return value


def validate_inventory_parameters(
    forecast_days: int,
    lead_time_days: int,
    safety_stock_days: int,
) -> None:
    """
    Validate inventory forecasting parameters.
    """

    if forecast_days not in VALID_FORECAST_PERIODS:
        raise ValueError(
            "forecast_days must be one of: 7, 30, or 90."
        )

    if lead_time_days < 0:
        raise ValueError(
            "lead_time_days cannot be negative."
        )

    if safety_stock_days < 0:
        raise ValueError(
            "safety_stock_days cannot be negative."
        )


def handle_service_exception(
    db: Session,
    exc: Exception,
) -> HTTPException:
    """
    Convert service exceptions into HTTP exceptions.
    """

    db.rollback()

    if isinstance(exc, ValueError):
        return HTTPException(
            status_code=400,
            detail=str(exc),
        )

    return HTTPException(
        status_code=500,
        detail=str(exc),
    )


# ============================================================
# DEMAND FORECAST ROUTER
# ============================================================

router = APIRouter(
    prefix="/forecast",
    tags=["Demand Forecast"],
)


# ============================================================
# GENERATE FORECAST
# ============================================================

@router.post("/generate")
def generate_forecast(
    request: ForecastGenerateRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Generate demand forecasts for all products
    belonging to the current user's company.
    """

    try:
        forecast_days = validate_forecast_period(
            request.forecast_period
        )

        forecasts = generate_all_forecasts(
            db=db,
            company_id=current_user.company_id,
            forecast_period=str(forecast_days),
        )

        create_forecast_audit_log(
            db=db,
            company_id=current_user.company_id,
            user_id=current_user.id,
            action="Forecast Generated",
            forecast_period=str(forecast_days),
        )

        db.commit()

        return {
            "success": True,
            "message": "Forecast generated successfully.",
            "total": len(forecasts),
            "forecast_period": forecast_days,
        }

    except Exception as exc:
        raise handle_service_exception(db, exc) from exc


# ============================================================
# FORECAST ANALYTICS
# ============================================================

@router.get(
    "/analytics",
    response_model=ForecastAnalyticsResponse,
)
def forecast_dashboard(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Return demand forecasting dashboard analytics.
    """

    try:
        return get_forecast_analytics(
            db=db,
            company_id=current_user.company_id,
        )

    except Exception as exc:
        raise handle_service_exception(db, exc) from exc


# ============================================================
# PRODUCT FORECAST
# ============================================================

@router.get("/products")
def products_forecast(
    forecast_period: str | None = Query(
        default=None,
        description="Forecast period: 7, 30, or 90 days",
    ),
    search: str | None = Query(
        default=None,
        description="Search by product name or SKU",
    ),
    category_id: int | None = Query(
        default=None,
        ge=1,
    ),
    brand: str | None = Query(
        default=None,
    ),
    sort_by: str = Query(
        default="highest_demand",
    ),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Return product-level demand forecasts.
    """

    try:
        forecast_days = validate_forecast_period(
            forecast_period
        )

        clean_search = (
            search.strip()
            if search and search.strip()
            else None
        )

        clean_brand = (
            brand.strip()
            if brand and brand.strip()
            else None
        )

        return get_product_forecasts(
            db=db,
            company_id=current_user.company_id,
            forecast_period=str(forecast_days),
            search=clean_search,
            category_id=category_id,
            brand=clean_brand,
            sort_by=sort_by,
        )

    except Exception as exc:
        raise handle_service_exception(db, exc) from exc


# ============================================================
# CATEGORY FORECAST
# ============================================================

@router.get("/categories")
def categories_forecast(
    forecast_period: str | None = Query(
        default=None,
        description="Forecast period: 7, 30, or 90 days",
    ),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Return category-level demand forecasts.
    """

    try:
        forecast_days = validate_forecast_period(
            forecast_period
        )

        return get_category_forecasts(
            db=db,
            company_id=current_user.company_id,
            forecast_period=str(forecast_days),
        )

    except Exception as exc:
        raise handle_service_exception(db, exc) from exc


# ============================================================
# DEMAND FORECAST RECOMMENDATIONS
# ============================================================

@router.get("/recommendations")
def forecast_recommendations(
    forecast_period: str | None = Query(
        default=None,
        description="Forecast period: 7, 30, or 90 days",
    ),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Return inventory recommendations generated from
    demand forecasts.
    """

    try:
        forecast_days = validate_forecast_period(
            forecast_period
        )

        return get_inventory_recommendations(
            db=db,
            company_id=current_user.company_id,
            forecast_days=forecast_days,
        )

    except Exception as exc:
        raise handle_service_exception(db, exc) from exc


# ============================================================
# TOP PREDICTED PRODUCTS
# ============================================================

@router.get("/top-products")
def top_predicted_products(
    forecast_period: str | None = Query(
        default=None,
        description="Forecast period: 7, 30, or 90 days",
    ),
    limit: int = Query(
        default=10,
        ge=1,
        le=MAX_TOP_PRODUCTS_LIMIT,
    ),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Return products with the highest predicted demand.
    """

    try:
        forecast_days = validate_forecast_period(
            forecast_period
        )

        return get_top_predicted_products(
            db=db,
            company_id=current_user.company_id,
            forecast_period=str(forecast_days),
            limit=limit,
        )

    except Exception as exc:
        raise handle_service_exception(db, exc) from exc


# ============================================================
# FORECAST NOTIFICATIONS
# ============================================================

@router.post("/notifications/generate")
def generate_notifications(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Generate notifications for forecast-related
    inventory risks.
    """

    try:
        notifications = create_forecast_notifications(
            db=db,
            company_id=current_user.company_id,
        )

        db.commit()

        return {
            "success": True,
            "message": (
                "Forecast notifications generated successfully."
            ),
            "count": len(notifications),
        }

    except Exception as exc:
        raise handle_service_exception(db, exc) from exc


# ============================================================
# PRODUCT CSV EXPORT
# ============================================================

@router.get("/export/products/csv")
def export_products_csv(
    forecast_period: str | None = Query(
        default=None,
        description="Forecast period: 7, 30, or 90 days",
    ),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Export product forecasts as CSV.
    """

    try:
        forecast_days = validate_forecast_period(
            forecast_period
        )

        csv_data = export_product_forecast_csv(
            db=db,
            company_id=current_user.company_id,
            forecast_period=str(forecast_days),
        )

        create_forecast_audit_log(
            db=db,
            company_id=current_user.company_id,
            user_id=current_user.id,
            action="Forecast Product CSV Exported",
            forecast_period=str(forecast_days),
        )

        db.commit()

        return Response(
            content=csv_data,
            media_type="text/csv",
            headers={
                "Content-Disposition": (
                    "attachment; "
                    "filename=product_forecast.csv"
                )
            },
        )

    except Exception as exc:
        raise handle_service_exception(db, exc) from exc


# ============================================================
# CATEGORY CSV EXPORT
# ============================================================

@router.get("/export/categories/csv")
def export_categories_csv(
    forecast_period: str | None = Query(
        default=None,
        description="Forecast period: 7, 30, or 90 days",
    ),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Export category forecasts as CSV.
    """

    try:
        forecast_days = validate_forecast_period(
            forecast_period
        )

        csv_data = export_category_forecast_csv(
            db=db,
            company_id=current_user.company_id,
            forecast_period=str(forecast_days),
        )

        create_forecast_audit_log(
            db=db,
            company_id=current_user.company_id,
            user_id=current_user.id,
            action="Forecast Category CSV Exported",
            forecast_period=str(forecast_days),
        )

        db.commit()

        return Response(
            content=csv_data,
            media_type="text/csv",
            headers={
                "Content-Disposition": (
                    "attachment; "
                    "filename=category_forecast.csv"
                )
            },
        )

    except Exception as exc:
        raise handle_service_exception(db, exc) from exc


# ============================================================
# PRODUCT PDF EXPORT
# ============================================================

@router.get("/export/products/pdf")
def export_products_pdf(
    forecast_period: str | None = Query(
        default=None,
        description="Forecast period: 7, 30, or 90 days",
    ),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Export product forecast report as PDF.
    """

    try:
        forecast_days = validate_forecast_period(
            forecast_period
        )

        pdf_file = export_product_forecast_pdf(
            db=db,
            company_id=current_user.company_id,
            forecast_period=str(forecast_days),
        )

        create_forecast_audit_log(
            db=db,
            company_id=current_user.company_id,
            user_id=current_user.id,
            action="Forecast Product PDF Exported",
            forecast_period=str(forecast_days),
        )

        db.commit()

        return StreamingResponse(
            pdf_file,
            media_type="application/pdf",
            headers={
                "Content-Disposition": (
                    "attachment; "
                    "filename=forecast_report.pdf"
                )
            },
        )

    except Exception as exc:
        raise handle_service_exception(db, exc) from exc


# ============================================================
# INVENTORY FORECASTING ROUTER
# ============================================================

inventory_forecast_router = APIRouter(
    prefix="/inventory",
    tags=["Inventory Forecasting"],
)


# ============================================================
# GET INVENTORY FORECAST
# ============================================================

@inventory_forecast_router.get("/forecast")
def inventory_forecast(
    forecast_days: int = Query(
        default=DEFAULT_FORECAST_DAYS,
        description="Forecast period: 7, 30, or 90 days",
    ),
    lead_time_days: int = Query(
        default=DEFAULT_LEAD_TIME_DAYS,
        ge=0,
        description="Supplier lead time in days",
    ),
    safety_stock_days: int = Query(
        default=DEFAULT_SAFETY_STOCK_DAYS,
        ge=0,
        description="Safety stock coverage in days",
    ),
    stock_risk: str | None = Query(
        default=None,
        description=(
            "Filter by stock risk: "
            "OUT_OF_STOCK, STOCKOUT_RISK, "
            "LOW_STOCK, HEALTHY, OVERSTOCK"
        ),
    ),
    sort_by: str = Query(
        default="product",
    ),
    sort_order: str = Query(
        default="asc",
    ),
    search: str = Query(
        default="",
        description="Search by product name or SKU",
    ),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Inventory Forecasting & Smart Replenishment.

    Calculates:
        - Current stock
        - Average daily sales
        - Forecasted demand
        - Days of stock remaining
        - Safety stock
        - Reorder point
        - Recommended reorder quantity
        - Stock risk
        - Reorder requirement
        - Confidence score
    """

    try:
        validate_inventory_parameters(
            forecast_days=forecast_days,
            lead_time_days=lead_time_days,
            safety_stock_days=safety_stock_days,
        )

        clean_search = (
            search.strip()
            if search and search.strip()
            else ""
        )

        clean_sort_order = sort_order.lower().strip()

        if clean_sort_order not in VALID_SORT_ORDERS:
            raise ValueError(
                "sort_order must be either 'asc' or 'desc'."
            )

        return get_inventory_forecast(
            db=db,
            company_id=current_user.company_id,
            forecast_days=forecast_days,
            lead_time_days=lead_time_days,
            safety_stock_days=safety_stock_days,
            stock_risk=stock_risk,
            sort_by=sort_by,
            sort_order=clean_sort_order,
            search=clean_search,
        )

    except Exception as exc:
        raise handle_service_exception(db, exc) from exc


# ============================================================
# GET INVENTORY RECOMMENDATIONS
# ============================================================

@inventory_forecast_router.get("/recommendations")
def inventory_recommendations(
    forecast_days: int = Query(
        default=DEFAULT_FORECAST_DAYS,
        description="Forecast period: 7, 30, or 90 days",
    ),
    lead_time_days: int = Query(
        default=DEFAULT_LEAD_TIME_DAYS,
        ge=0,
        description="Supplier lead time in days",
    ),
    safety_stock_days: int = Query(
        default=DEFAULT_SAFETY_STOCK_DAYS,
        ge=0,
        description="Safety stock coverage in days",
    ),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Return smart inventory replenishment recommendations.
    """

    try:
        validate_inventory_parameters(
            forecast_days=forecast_days,
            lead_time_days=lead_time_days,
            safety_stock_days=safety_stock_days,
        )

        return get_inventory_recommendations(
            db=db,
            company_id=current_user.company_id,
            forecast_days=forecast_days,
            lead_time_days=lead_time_days,
            safety_stock_days=safety_stock_days,
        )

    except Exception as exc:
        raise handle_service_exception(db, exc) from exc
