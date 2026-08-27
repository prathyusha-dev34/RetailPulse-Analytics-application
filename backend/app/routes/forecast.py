from fastapi import APIRouter, Depends, HTTPException, Response
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
    try:
        forecasts = generate_all_forecasts(
            db=db,
            company_id=current_user.company_id,
            forecast_period=request.forecast_period,
        )

        create_forecast_audit_log(
            db=db,
            company_id=current_user.company_id,
            user_id=current_user.id,
            action="Forecast Generated",
            forecast_period=request.forecast_period,
        )

        return {
            "message": "Forecast generated successfully",
            "total": len(forecasts),
            "forecast_period": request.forecast_period,
        }

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=str(exc),
        ) from exc


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
    try:
        return get_forecast_analytics(
            db=db,
            company_id=current_user.company_id,
        )

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=str(exc),
        ) from exc


# ============================================================
# PRODUCT FORECAST
# ============================================================

@router.get("/products")
def products_forecast(
    forecast_period: str | None = None,
    search: str | None = None,
    category_id: int | None = None,
    brand: str | None = None,
    sort_by: str = "highest_demand",
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    try:
        return get_product_forecasts(
            db=db,
            company_id=current_user.company_id,
            forecast_period=forecast_period,
            search=search,
            category_id=category_id,
            brand=brand,
            sort_by=sort_by,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=str(exc),
        ) from exc


# ============================================================
# CATEGORY FORECAST
# ============================================================

@router.get("/categories")
def categories_forecast(
    forecast_period: str | None = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    try:
        return get_category_forecasts(
            db=db,
            company_id=current_user.company_id,
            forecast_period=forecast_period,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=str(exc),
        ) from exc


# ============================================================
# DEMAND FORECAST RECOMMENDATIONS
# ============================================================

@router.get("/recommendations")
def forecast_recommendations(
    forecast_period: str | None = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    try:
        forecast_days = (
            int(forecast_period)
            if forecast_period
            else 30
        )

        return get_inventory_recommendations(
            db=db,
            company_id=current_user.company_id,
            forecast_days=forecast_days,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=str(exc),
        ) from exc


# ============================================================
# TOP PREDICTED PRODUCTS
# ============================================================

@router.get("/top-products")
def top_predicted_products(
    forecast_period: str | None = None,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    try:
        return get_top_predicted_products(
            db=db,
            company_id=current_user.company_id,
            forecast_period=forecast_period,
            limit=limit,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=str(exc),
        ) from exc


# ============================================================
# FORECAST NOTIFICATIONS
# ============================================================

@router.post("/notifications/generate")
def generate_notifications(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    try:
        notifications = create_forecast_notifications(
            db=db,
            company_id=current_user.company_id,
        )

        return {
            "success": True,
            "message": (
                "Forecast notifications generated successfully."
            ),
            "count": len(notifications),
        }

    except Exception as exc:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=str(exc),
        ) from exc


# ============================================================
# PRODUCT CSV EXPORT
# ============================================================

@router.get("/export/products/csv")
def export_products_csv(
    forecast_period: str | None = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    try:
        csv_data = export_product_forecast_csv(
            db=db,
            company_id=current_user.company_id,
            forecast_period=forecast_period or "30",
        )

        create_forecast_audit_log(
            db=db,
            company_id=current_user.company_id,
            user_id=current_user.id,
            action="Forecast Product CSV Exported",
            forecast_period=forecast_period or "30",
        )

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
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=str(exc),
        ) from exc


# ============================================================
# CATEGORY CSV EXPORT
# ============================================================

@router.get("/export/categories/csv")
def export_categories_csv(
    forecast_period: str | None = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    try:
        csv_data = export_category_forecast_csv(
            db=db,
            company_id=current_user.company_id,
            forecast_period=forecast_period or "30",
        )

        create_forecast_audit_log(
            db=db,
            company_id=current_user.company_id,
            user_id=current_user.id,
            action="Forecast Category CSV Exported",
            forecast_period=forecast_period or "30",
        )

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
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=str(exc),
        ) from exc


# ============================================================
# PRODUCT PDF EXPORT
# ============================================================

@router.get("/export/products/pdf")
def export_products_pdf(
    forecast_period: str | None = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    try:
        pdf_file = export_product_forecast_pdf(
            db=db,
            company_id=current_user.company_id,
            forecast_period=forecast_period or "30",
        )

        create_forecast_audit_log(
            db=db,
            company_id=current_user.company_id,
            user_id=current_user.id,
            action="Forecast Product PDF Exported",
            forecast_period=forecast_period or "30",
        )

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
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=str(exc),
        ) from exc


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
    forecast_days: int = 30,
    lead_time_days: int = 7,
    safety_stock_days: int = 3,
    stock_risk: str | None = None,
    sort_by: str = "product",
    sort_order: str = "asc",
    search: str = "",
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    try:
        return get_inventory_forecast(
            db=db,
            company_id=current_user.company_id,
            forecast_days=forecast_days,
            lead_time_days=lead_time_days,
            safety_stock_days=safety_stock_days,
            stock_risk=stock_risk,
            sort_by=sort_by,
            sort_order=sort_order,
            search=search,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=str(exc),
        ) from exc


# ============================================================
# GET INVENTORY RECOMMENDATIONS
# ============================================================

@inventory_forecast_router.get("/recommendations")
def inventory_recommendations(
    forecast_days: int = 30,
    lead_time_days: int = 7,
    safety_stock_days: int = 3,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    try:
        return get_inventory_recommendations(
            db=db,
            company_id=current_user.company_id,
            forecast_days=forecast_days,
            lead_time_days=lead_time_days,
            safety_stock_days=safety_stock_days,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=str(exc),
        ) from exc