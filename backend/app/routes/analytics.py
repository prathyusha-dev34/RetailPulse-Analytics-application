from datetime import date
from typing import Optional


from fastapi import (
    APIRouter,
    Depends,
    Query,
)


from sqlalchemy.orm import Session


from app.core.database import get_db


from app.dependencies.roles import require_roles



from app.schemas.analytics import (

    AnalyticsFilter,

    DashboardSummary,

    RevenueTrend,

    SalesTrend,

    ProductAnalytics,

    CategoryAnalytics,

    PaymentAnalytics,

    SalesChannelAnalytics,

    InventoryDistribution,

    InventoryValue,

    StockStatus,

    LowStockProduct,

    OutOfStockProduct,

)



from app.services.analytics_service import (

    get_dashboard_summary,

    get_revenue_trend,

    get_sales_trend,

    get_top_products,

    get_top_categories,

    get_sales_by_payment_method,

    get_sales_by_channel,

    get_inventory_distribution,

    get_stock_status_summary,

    get_inventory_value_by_category,

    get_low_stock_items,

    get_out_of_stock_items,

)






router = APIRouter(

    prefix="/analytics",

    tags=["Analytics"]

)







# =====================================================
# FILTER DEPENDENCY
# =====================================================


def analytics_filters(

    from_date: Optional[date] = Query(None),

    to_date: Optional[date] = Query(None),

    product: Optional[str] = Query(None),

    category: Optional[str] = Query(None),

    brand: Optional[str] = Query(None),

    sales_channel: Optional[str] = Query(None),

    payment_method: Optional[str] = Query(None),

):


    return {


        "from_date":

            from_date,


        "to_date":

            to_date,


        "product":

            product,


        "category":

            category,


        "brand":

            brand,


        "sales_channel":

            sales_channel,


        "payment_method":

            payment_method,

    }









# =====================================================
# ROLE ACCESS
# =====================================================


def analytics_access():

    return require_roles(

        "COMPANY_ADMIN",

        "ANALYST"

    )









# =====================================================
# DASHBOARD
# =====================================================


@router.get(

    "/dashboard",

    response_model=DashboardSummary

)

def dashboard(


    filters: dict = Depends(

        analytics_filters

    ),


    db: Session = Depends(

        get_db

    ),


    current_user=Depends(

        analytics_access()

    )

):


    return get_dashboard_summary(

        db,

        current_user.company_id,

        filters

    )









# =====================================================
# REVENUE TREND
# =====================================================


@router.get(

    "/revenue-trend",

    response_model=list[RevenueTrend]

)

def revenue_trend(


    filters: dict = Depends(

        analytics_filters

    ),


    period: str = Query(

        "daily"

    ),


    db: Session = Depends(

        get_db

    ),


    current_user=Depends(

        analytics_access()

    )

):


    return get_revenue_trend(

        db,

        current_user.company_id,

        filters,

        period

    )


# =====================================================
# SALES TREND
# =====================================================


@router.get(

    "/sales-trend",

    response_model=list[SalesTrend]

)

def sales_trend(


    filters: dict = Depends(

        analytics_filters

    ),


    period: str = Query(

        "daily"

    ),


    db: Session = Depends(

        get_db

    ),


    current_user=Depends(

        analytics_access()

    )

):


    return get_sales_trend(

        db,

        current_user.company_id,

        filters,

        period

    )








# =====================================================
# TOP PRODUCTS
# =====================================================


@router.get(

    "/top-products",

    response_model=list[ProductAnalytics]

)

def top_products(


    filters: dict = Depends(

        analytics_filters

    ),


    limit: int = Query(

        10,

        ge=1,

        le=100

    ),


    db: Session = Depends(

        get_db

    ),


    current_user=Depends(

        analytics_access()

    )

):


    return get_top_products(

        db,

        current_user.company_id,

        filters,

        limit

    )








# =====================================================
# TOP CATEGORIES
# =====================================================


@router.get(

    "/top-categories",

    response_model=list[CategoryAnalytics]

)

def top_categories(


    filters: dict = Depends(

        analytics_filters

    ),


    limit: int = Query(

        10,

        ge=1,

        le=100

    ),


    db: Session = Depends(

        get_db

    ),


    current_user=Depends(

        analytics_access()

    )

):


    return get_top_categories(

        db,

        current_user.company_id,

        filters,

        limit

    )








# =====================================================
# PAYMENT METHODS
# =====================================================


@router.get(

    "/payment-methods",

    response_model=list[PaymentAnalytics]

)

def payment_methods(


    filters: dict = Depends(

        analytics_filters

    ),


    db: Session = Depends(

        get_db

    ),


    current_user=Depends(

        analytics_access()

    )

):


    return get_sales_by_payment_method(

        db,

        current_user.company_id,

        filters

    )








# =====================================================
# SALES CHANNELS
# =====================================================


@router.get(

    "/sales-channels",

    response_model=list[SalesChannelAnalytics]

)

def sales_channels(


    filters: dict = Depends(

        analytics_filters

    ),


    db: Session = Depends(

        get_db

    ),


    current_user=Depends(

        analytics_access()

    )

):


    return get_sales_by_channel(

        db,

        current_user.company_id,

        filters

    )


# =====================================================
# INVENTORY DISTRIBUTION
# =====================================================


@router.get(

    "/inventory-distribution",

    response_model=list[InventoryDistribution]

)

def inventory_distribution(


    filters: dict = Depends(

        analytics_filters

    ),


    db: Session = Depends(

        get_db

    ),


    current_user=Depends(

        analytics_access()

    )

):


    return get_inventory_distribution(

        db,

        current_user.company_id,

        filters

    )








# =====================================================
# STOCK STATUS SUMMARY
# =====================================================


@router.get(

    "/stock-status",

    response_model=list[StockStatus]

)

def stock_status(


    filters: dict = Depends(

        analytics_filters

    ),


    db: Session = Depends(

        get_db

    ),


    current_user=Depends(

        analytics_access()

    )

):


    return get_stock_status_summary(

        db,

        current_user.company_id,

        filters

    )








# =====================================================
# INVENTORY VALUE BY CATEGORY
# =====================================================


@router.get(

    "/inventory-value",

    response_model=list[InventoryValue]

)

def inventory_value(


    filters: dict = Depends(

        analytics_filters

    ),


    db: Session = Depends(

        get_db

    ),


    current_user=Depends(

        analytics_access()

    )

):


    return get_inventory_value_by_category(

        db,

        current_user.company_id,

        filters

    )








# =====================================================
# LOW STOCK PRODUCTS
# =====================================================


@router.get(

    "/low-stock",

    response_model=list[LowStockProduct]

)

def low_stock(


    filters: dict = Depends(

        analytics_filters

    ),


    db: Session = Depends(

        get_db

    ),


    current_user=Depends(

        analytics_access()

    )

):


    return get_low_stock_items(

        db,

        current_user.company_id,

        filters

    )








# =====================================================
# OUT OF STOCK PRODUCTS
# =====================================================


@router.get(

    "/out-of-stock",

    response_model=list[OutOfStockProduct]

)

def out_of_stock(


    filters: dict = Depends(

        analytics_filters

    ),


    db: Session = Depends(

        get_db

    ),


    current_user=Depends(

        analytics_access()

    )

):


    return get_out_of_stock_items(

        db,

        current_user.company_id,

        filters

    )