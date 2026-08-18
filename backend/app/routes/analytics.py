from datetime import date
from typing import Optional

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
)
from fastapi.responses import (
    StreamingResponse,
)

from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import get_current_user

from app.models.user import User

from app.services.analytics_service import (
    get_sales_analytics_summary,
    get_sales_revenue_trend,
    get_sales_vs_orders,
    get_top_products,
    get_top_customers,
    get_payment_method_analytics,
    export_analytics_csv,
    export_analytics_pdf,
)


router = APIRouter(
    prefix="/analytics/sales",
    tags=["Sales Analytics"],
)


# ============================================================
# COMMON PARAMETERS
# ============================================================

def _get_company_id(
    current_user: User,
):
    company_id = getattr(
        current_user,
        "company_id",
        None,
    )

    if company_id is None:
        raise HTTPException(
            status_code=400,
            detail="User is not associated with a company.",
        )

    return company_id


def _handle_service_error(error):
    if isinstance(error, ValueError):
        raise HTTPException(
            status_code=400,
            detail=str(error),
        )

    raise HTTPException(
        status_code=500,
        detail="Failed to process sales analytics.",
    )


# ============================================================
# SUMMARY
# ============================================================

@router.get(
    "/summary",
)
def sales_analytics_summary(
    from_date: Optional[date] = Query(
        None,
        description="Start date in YYYY-MM-DD format",
    ),
    to_date: Optional[date] = Query(
        None,
        description="End date in YYYY-MM-DD format",
    ),
    product_id: Optional[int] = Query(
        None,
    ),
    category_id: Optional[int] = Query(
        None,
    ),
    customer_id: Optional[int] = Query(
        None,
    ),
    payment_method: Optional[str] = Query(
        None,
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):
    company_id = _get_company_id(
        current_user
    )

    try:
        return get_sales_analytics_summary(
            db=db,
            company_id=company_id,
            from_date=from_date,
            to_date=to_date,
            product_id=product_id,
            category_id=category_id,
            customer_id=customer_id,
            payment_method=payment_method,
        )

    except Exception as error:
        _handle_service_error(error)


# ============================================================
# REVENUE TREND
# ============================================================

@router.get(
    "/trend",
)
def sales_revenue_trend(
    period: str = Query(
        "daily",
        pattern="^(daily|weekly|monthly)$",
    ),
    from_date: Optional[date] = Query(
        None,
    ),
    to_date: Optional[date] = Query(
        None,
    ),
    product_id: Optional[int] = Query(
        None,
    ),
    category_id: Optional[int] = Query(
        None,
    ),
    customer_id: Optional[int] = Query(
        None,
    ),
    payment_method: Optional[str] = Query(
        None,
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):
    company_id = _get_company_id(
        current_user
    )

    try:
        return get_sales_revenue_trend(
            db=db,
            company_id=company_id,
            period=period,
            from_date=from_date,
            to_date=to_date,
            product_id=product_id,
            category_id=category_id,
            customer_id=customer_id,
            payment_method=payment_method,
        )

    except Exception as error:
        _handle_service_error(error)


# ============================================================
# SALES VS ORDERS
# ============================================================

@router.get(
    "/sales-vs-orders",
)
def sales_vs_orders(
    period: str = Query(
        "daily",
        pattern="^(daily|weekly|monthly)$",
    ),
    from_date: Optional[date] = Query(
        None,
    ),
    to_date: Optional[date] = Query(
        None,
    ),
    product_id: Optional[int] = Query(
        None,
    ),
    category_id: Optional[int] = Query(
        None,
    ),
    customer_id: Optional[int] = Query(
        None,
    ),
    payment_method: Optional[str] = Query(
        None,
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):
    company_id = _get_company_id(
        current_user
    )

    try:
        return get_sales_vs_orders(
            db=db,
            company_id=company_id,
            period=period,
            from_date=from_date,
            to_date=to_date,
            product_id=product_id,
            category_id=category_id,
            customer_id=customer_id,
            payment_method=payment_method,
        )

    except Exception as error:
        _handle_service_error(error)


# ============================================================
# TOP PRODUCTS
# ============================================================

@router.get(
    "/products",
)
def sales_products(
    from_date: Optional[date] = Query(
        None,
    ),
    to_date: Optional[date] = Query(
        None,
    ),
    product_id: Optional[int] = Query(
        None,
    ),
    category_id: Optional[int] = Query(
        None,
    ),
    customer_id: Optional[int] = Query(
        None,
    ),
    payment_method: Optional[str] = Query(
        None,
    ),
    sort_by: str = Query(
        "revenue",
        pattern="^(revenue|quantity)$",
    ),
    limit: int = Query(
        10,
        ge=1,
        le=100,
    ),
    offset: int = Query(
        0,
        ge=0,
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):
    company_id = _get_company_id(
        current_user
    )

    try:
        return get_top_products(
            db=db,
            company_id=company_id,
            from_date=from_date,
            to_date=to_date,
            product_id=product_id,
            category_id=category_id,
            customer_id=customer_id,
            payment_method=payment_method,
            sort_by=sort_by,
            limit=limit,
            offset=offset,
        )

    except Exception as error:
        _handle_service_error(error)


# ============================================================
# TOP CUSTOMERS
# ============================================================

@router.get(
    "/customers",
)
def sales_customers(
    from_date: Optional[date] = Query(
        None,
    ),
    to_date: Optional[date] = Query(
        None,
    ),
    product_id: Optional[int] = Query(
        None,
    ),
    category_id: Optional[int] = Query(
        None,
    ),
    customer_id: Optional[int] = Query(
        None,
    ),
    payment_method: Optional[str] = Query(
        None,
    ),
    limit: int = Query(
        10,
        ge=1,
        le=100,
    ),
    offset: int = Query(
        0,
        ge=0,
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):
    company_id = _get_company_id(
        current_user
    )

    try:
        return get_top_customers(
            db=db,
            company_id=company_id,
            from_date=from_date,
            to_date=to_date,
            product_id=product_id,
            category_id=category_id,
            customer_id=customer_id,
            payment_method=payment_method,
            limit=limit,
            offset=offset,
        )

    except Exception as error:
        _handle_service_error(error)


# ============================================================
# PAYMENT METHODS
# ============================================================

@router.get(
    "/payment-methods",
)
def payment_methods(
    from_date: Optional[date] = Query(
        None,
    ),
    to_date: Optional[date] = Query(
        None,
    ),
    product_id: Optional[int] = Query(
        None,
    ),
    category_id: Optional[int] = Query(
        None,
    ),
    customer_id: Optional[int] = Query(
        None,
    ),
    payment_method: Optional[str] = Query(
        None,
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):
    company_id = _get_company_id(
        current_user
    )

    try:
        return get_payment_method_analytics(
            db=db,
            company_id=company_id,
            from_date=from_date,
            to_date=to_date,
            product_id=product_id,
            category_id=category_id,
            customer_id=customer_id,
            payment_method=payment_method,
        )

    except Exception as error:
        _handle_service_error(error)


# ============================================================
# CSV EXPORT
# ============================================================

@router.get(
    "/export/csv",
)
def export_sales_csv(
    from_date: Optional[date] = Query(
        None,
    ),
    to_date: Optional[date] = Query(
        None,
    ),
    product_id: Optional[int] = Query(
        None,
    ),
    category_id: Optional[int] = Query(
        None,
    ),
    customer_id: Optional[int] = Query(
        None,
    ),
    payment_method: Optional[str] = Query(
        None,
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):
    company_id = _get_company_id(
        current_user
    )

    try:
        csv_content = export_analytics_csv(
            db=db,
            company_id=company_id,
            from_date=from_date,
            to_date=to_date,
            product_id=product_id,
            category_id=category_id,
            customer_id=customer_id,
            payment_method=payment_method,
        )

        return StreamingResponse(
            iter([csv_content]),
            media_type="text/csv",
            headers={
                "Content-Disposition":
                    "attachment; "
                    "filename=RetailPulse_Sales_Analytics.csv"
            },
        )

    except Exception as error:
        _handle_service_error(error)


# ============================================================
# PDF EXPORT
# ============================================================

@router.get(
    "/export/pdf",
)
def export_sales_pdf(
    from_date: Optional[date] = Query(
        None,
    ),
    to_date: Optional[date] = Query(
        None,
    ),
    product_id: Optional[int] = Query(
        None,
    ),
    category_id: Optional[int] = Query(
        None,
    ),
    customer_id: Optional[int] = Query(
        None,
    ),
    payment_method: Optional[str] = Query(
        None,
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):
    company_id = _get_company_id(
        current_user
    )

    try:
        pdf_buffer = export_analytics_pdf(
            db=db,
            company_id=company_id,
            from_date=from_date,
            to_date=to_date,
            product_id=product_id,
            category_id=category_id,
            customer_id=customer_id,
            payment_method=payment_method,
        )

        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={
                "Content-Disposition":
                    "attachment; "
                    "filename=RetailPulse_Sales_Analytics.pdf"
            },
        )

    except Exception as error:
        _handle_service_error(error)