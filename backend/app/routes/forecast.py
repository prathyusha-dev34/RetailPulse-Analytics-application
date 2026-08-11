from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Response,
)

from fastapi.responses import StreamingResponse

from sqlalchemy.orm import Session

from app.core.database import get_db

from app.dependencies.auth import (
    get_current_user,
)

from app.services.forecast_service import (
    generate_all_forecasts,
    get_forecast_analytics,
    get_product_forecasts,
    get_category_forecasts,
    get_inventory_recommendations,
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


router = APIRouter(
    prefix="/forecast",
    tags=["Demand Forecast"],
)


# ==========================================================
# GENERATE FORECAST
# ==========================================================

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

    except ValueError as e:

        raise HTTPException(
            status_code=400,
            detail=str(e),
        )

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e),
        )


# ==========================================================
# FORECAST ANALYTICS DASHBOARD
# ==========================================================

@router.get(
    "/analytics",
    response_model=ForecastAnalyticsResponse,
)
def forecast_dashboard(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):

    return get_forecast_analytics(
        db=db,
        company_id=current_user.company_id,
    )


# ==========================================================
# PRODUCT FORECAST LIST
# SEARCH + FILTER + SORT
# ==========================================================

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

    return get_product_forecasts(
        db=db,
        company_id=current_user.company_id,
        forecast_period=forecast_period,
        search=search,
        category_id=category_id,
        brand=brand,
        sort_by=sort_by,
    )


# ==========================================================
# CATEGORY FORECAST
# ==========================================================

@router.get("/categories")
def categories_forecast(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):

    return get_category_forecasts(
        db=db,
        company_id=current_user.company_id,
    )


# ==========================================================
# INVENTORY RECOMMENDATIONS
# ==========================================================

@router.get("/recommendations")
def forecast_recommendations(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):

    return get_inventory_recommendations(
        db=db,
        company_id=current_user.company_id,
    )


# ==========================================================
# TOP PREDICTED PRODUCTS
# ==========================================================

@router.get("/top-products")
def top_predicted_products(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):

    return get_top_predicted_products(
        db=db,
        company_id=current_user.company_id,
    )


# ==========================================================
# GENERATE FORECAST NOTIFICATIONS
# ==========================================================

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

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e),
        )


# ==========================================================
# EXPORT PRODUCT CSV
# ==========================================================

@router.get("/export/products/csv")
def export_products_csv(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):

    csv_data = export_product_forecast_csv(
        db=db,
        company_id=current_user.company_id,
    )

    create_forecast_audit_log(
        db=db,
        company_id=current_user.company_id,
        user_id=current_user.id,
        action="Forecast Product CSV Exported",
    )

    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={
            "Content-Disposition":
                "attachment; filename=product_forecast.csv"
        },
    )


# ==========================================================
# EXPORT CATEGORY CSV
# ==========================================================

@router.get("/export/categories/csv")
def export_categories_csv(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):

    csv_data = export_category_forecast_csv(
        db=db,
        company_id=current_user.company_id,
    )

    create_forecast_audit_log(
        db=db,
        company_id=current_user.company_id,
        user_id=current_user.id,
        action="Forecast Category CSV Exported",
    )

    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={
            "Content-Disposition":
                "attachment; filename=category_forecast.csv"
        },
    )


# ==========================================================
# EXPORT PRODUCT PDF
# ==========================================================

@router.get("/export/products/pdf")
def export_products_pdf(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):

    pdf_file = export_product_forecast_pdf(
        db=db,
        company_id=current_user.company_id,
    )

    create_forecast_audit_log(
        db=db,
        company_id=current_user.company_id,
        user_id=current_user.id,
        action="Forecast Product PDF Exported",
    )

    return StreamingResponse(
        pdf_file,
        media_type="application/pdf",
        headers={
            "Content-Disposition":
                "attachment; filename=forecast_report.pdf"
        },
    )