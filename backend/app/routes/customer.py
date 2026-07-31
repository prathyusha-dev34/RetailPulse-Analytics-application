from datetime import date
from typing import Optional, List


from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)


from fastapi.responses import StreamingResponse


from sqlalchemy.orm import Session


from app.core.database import get_db


from app.dependencies.auth import get_current_user



# =====================================================
# SCHEMAS
# =====================================================

from app.schemas.customer import (

    CustomerCreate,

    CustomerUpdate,

    CustomerResponse,

    CustomerListResponse,

    CustomerDashboardResponse,

)



# =====================================================
# MODELS
# =====================================================

from app.models.customer import Customer



# =====================================================
# SERVICES
# =====================================================

from app.services.customer_service import (


    # -------------------------
    # CRUD
    # -------------------------

    create_customer,

    get_customers,

    get_customer,

    update_customer,

    delete_customer,

    activate_customer,

    deactivate_customer,



    # -------------------------
    # Search Filter Sort
    # -------------------------

    search_customers,

    filter_customers,

    sort_customers,



    # -------------------------
    # Profile
    # -------------------------

    get_customer_profile,

    get_recent_transactions,

    get_frequently_purchased_products,

    get_customer_activity_timeline,



    # -------------------------
    # Analytics
    # -------------------------

    get_customer_dashboard,

    get_top_customers,

    revenue_by_customer_type,

    get_customer_growth_trend,

    get_monthly_customer_acquisition,

    location_distribution,

    get_customer_spending_distribution,

    get_new_vs_returning_customers,

    get_recent_customer_activity,

    get_customer_revenue_contribution,

    get_dashboard_customer_widgets,



    # -------------------------
    # Export
    # -------------------------

    export_customers_csv,

    export_top_customers_csv,

    generate_customer_list_pdf,

    generate_top_customers_pdf,

    generate_customer_analytics_pdf,

)



# =====================================================
# ROUTER
# =====================================================


router = APIRouter(

    prefix="/customers",

    tags=["Customers"]

)





# =====================================================
# CREATE CUSTOMER
# =====================================================


@router.post(
    "/",
    response_model=CustomerResponse
)
def create_customer_api(

    customer: CustomerCreate,

    db: Session = Depends(get_db),

    current_user = Depends(get_current_user),

):


    try:

        return create_customer(

            db=db,

            company_id=current_user.company_id,

            user_id=current_user.id,

            customer=customer,

        )


    except ValueError as e:


        raise HTTPException(

            status_code=400,

            detail=str(e)

        )







# =====================================================
# GET ALL CUSTOMERS
# =====================================================


@router.get(
    "/",
    response_model=CustomerListResponse
)
def get_customers_api(

    skip: int = 0,

    limit: int = 100,


    db: Session = Depends(get_db),

    current_user = Depends(get_current_user),

):


    customers = get_customers(

        db=db,

        company_id=current_user.company_id,

        skip=skip,

        limit=limit,

    )



    return {


        "total": len(customers),


        "page":

            (skip // limit) + 1,


        "limit":

            limit,


        "data":

            customers,


    }








# =====================================================
# SEARCH CUSTOMER
# =====================================================


@router.get(

    "/search",

    response_model=List[CustomerResponse]

)
def search_customer_api(

    keyword: str,


    db: Session = Depends(get_db),


    current_user = Depends(get_current_user),

):


    return search_customers(

        db=db,


        company_id=current_user.company_id,


        keyword=keyword,

    )


# =====================================================
# FILTER CUSTOMERS
# =====================================================


@router.get(
    "/filter",
    response_model=List[CustomerResponse]
)
def filter_customer_api(

    customer_type: Optional[str] = None,

    status: Optional[str] = None,

    city: Optional[str] = None,

    state: Optional[str] = None,

    country: Optional[str] = None,

    from_date: Optional[date] = None,

    to_date: Optional[date] = None,


    db: Session = Depends(get_db),

    current_user = Depends(get_current_user),

):


    return filter_customers(

        db=db,

        company_id=current_user.company_id,

        customer_type=customer_type,

        status=status,

        city=city,

        state=state,

        country=country,

        from_date=from_date,

        to_date=to_date,

    )







# =====================================================
# SORT CUSTOMERS
# =====================================================


@router.get(
    "/sort",
    response_model=List[CustomerResponse]
)
def sort_customer_api(

    sort_by: str = "customer_since",

    order: str = "desc",


    db: Session = Depends(get_db),


    current_user = Depends(get_current_user),

):


    query = (

        db.query(Customer)

        .filter(

            Customer.company_id

            ==

            current_user.company_id

        )

    )



    result = sort_customers(

        query=query,

        sort_by=sort_by,

        order=order,

    )



    return result.all()






# =====================================================
# CUSTOMER ANALYTICS DASHBOARD
# =====================================================


@router.get(
    "/analytics/dashboard"
)
def customer_dashboard_api(

    db: Session = Depends(get_db),

    current_user = Depends(get_current_user),

):


    return get_customer_dashboard(

        db=db,

        company_id=current_user.company_id,

    )







# =====================================================
# TOP CUSTOMERS
# =====================================================


@router.get(
    "/analytics/top-customers"
)
def top_customers_api(

    limit: int = 10,


    db: Session = Depends(get_db),


    current_user = Depends(get_current_user),

):


    return get_top_customers(

        db=db,

        company_id=current_user.company_id,

        limit=limit,

    )







# =====================================================
# REVENUE BY CUSTOMER TYPE
# =====================================================


@router.get(
    "/analytics/revenue-by-type"
)
def revenue_by_type_api(

    db: Session = Depends(get_db),


    current_user = Depends(get_current_user),

):


    return revenue_by_customer_type(

        db=db,

        company_id=current_user.company_id,

    )








# =====================================================
# CUSTOMER GROWTH TREND
# =====================================================


@router.get(
    "/analytics/growth-trend"
)
def growth_trend_api(

    db: Session = Depends(get_db),


    current_user = Depends(get_current_user),

):


    return get_customer_growth_trend(

        db=db,

        company_id=current_user.company_id,

    )








# =====================================================
# MONTHLY CUSTOMER ACQUISITION
# =====================================================


@router.get(
    "/analytics/monthly-acquisition"
)
def monthly_acquisition_api(

    db: Session = Depends(get_db),


    current_user = Depends(get_current_user),

):


    return get_monthly_customer_acquisition(

        db=db,

        company_id=current_user.company_id,

    )







# =====================================================
# LOCATION DISTRIBUTION
# =====================================================


@router.get(
    "/analytics/location-distribution"
)
def location_distribution_api(

    db: Session = Depends(get_db),


    current_user = Depends(get_current_user),

):


    return location_distribution(

        db=db,

        company_id=current_user.company_id,

    )







# =====================================================
# CUSTOMER SPENDING DISTRIBUTION
# =====================================================


@router.get(
    "/analytics/spending-distribution"
)
def spending_distribution_api(

    db: Session = Depends(get_db),


    current_user = Depends(get_current_user),

):


    return get_customer_spending_distribution(

        db=db,

        company_id=current_user.company_id,

    )








# =====================================================
# NEW VS RETURNING CUSTOMERS
# =====================================================


@router.get(
    "/analytics/new-vs-returning"
)
def new_vs_returning_api(

    db: Session = Depends(get_db),


    current_user = Depends(get_current_user),

):


    return get_new_vs_returning_customers(

        db=db,

        company_id=current_user.company_id,

    )


# =====================================================
# CUSTOMER REVENUE CONTRIBUTION
# =====================================================


@router.get(
    "/analytics/revenue-contribution"
)
def revenue_contribution_api(

    db: Session = Depends(get_db),

    current_user = Depends(get_current_user),

):


    return get_customer_revenue_contribution(

        db=db,

        company_id=current_user.company_id,

    )







# =====================================================
# RECENT CUSTOMER ACTIVITY
# =====================================================


@router.get(
    "/activity/recent"
)
def recent_activity_api(

    limit: int = 20,


    db: Session = Depends(get_db),


    current_user = Depends(get_current_user),

):


    return get_recent_customer_activity(

        db=db,

        company_id=current_user.company_id,

        limit=limit,

    )







# =====================================================
# CUSTOMER DASHBOARD WIDGETS
# =====================================================


@router.get(
    "/dashboard/widgets"
)
def dashboard_widgets_api(

    db: Session = Depends(get_db),


    current_user = Depends(get_current_user),

):


    return get_dashboard_customer_widgets(

        db=db,

        company_id=current_user.company_id,

    )








# =====================================================
# CUSTOMER PROFILE
# =====================================================


@router.get(
    "/{customer_id}/profile"
)
def customer_profile_api(

    customer_id: int,


    db: Session = Depends(get_db),


    current_user = Depends(get_current_user),

):


    profile = get_customer_profile(

        db=db,

        company_id=current_user.company_id,

        customer_id=customer_id,

    )



    if not profile:


        raise HTTPException(

            status_code=404,

            detail="Customer not found"

        )



    return profile







# =====================================================
# CUSTOMER RECENT TRANSACTIONS
# =====================================================


@router.get(
    "/{customer_id}/transactions"
)
def customer_transactions_api(

    customer_id: int,


    limit: int = 10,


    db: Session = Depends(get_db),


    current_user = Depends(get_current_user),

):


    return get_recent_transactions(

        db=db,

        company_id=current_user.company_id,

        customer_id=customer_id,

        limit=limit,

    )








# =====================================================
# CUSTOMER ACTIVITY TIMELINE
# =====================================================


@router.get(
    "/{customer_id}/timeline"
)
def customer_timeline_api(

    customer_id: int,


    db: Session = Depends(get_db),


    current_user = Depends(get_current_user),

):


    return get_customer_activity_timeline(

        db=db,

        company_id=current_user.company_id,

        customer_id=customer_id,

    )








# =====================================================
# CUSTOMER FAVORITE PRODUCTS
# =====================================================


@router.get(
    "/{customer_id}/favorite-products"
)
def favorite_products_api(

    customer_id: int,


    db: Session = Depends(get_db),


    current_user = Depends(get_current_user),

):


    customer = get_customer(

        db=db,

        company_id=current_user.company_id,

        customer_id=customer_id,

    )



    if not customer:


        raise HTTPException(

            status_code=404,

            detail="Customer not found"

        )



    return get_frequently_purchased_products(

        db=db,

        customer_id=customer.id,

    )


# =====================================================
# UPDATE CUSTOMER
# =====================================================


@router.put(
    "/{customer_id}",
    response_model=CustomerResponse
)
def update_customer_api(

    customer_id: int,


    customer: CustomerUpdate,


    db: Session = Depends(get_db),


    current_user = Depends(get_current_user),

):


    updated_customer = update_customer(

        db=db,

        company_id=current_user.company_id,

        user_id=current_user.id,

        customer_id=customer_id,

        customer=customer,

    )



    if not updated_customer:


        raise HTTPException(

            status_code=404,

            detail="Customer not found"

        )



    return updated_customer







# =====================================================
# DELETE CUSTOMER
# =====================================================


@router.delete(
    "/{customer_id}"
)
def delete_customer_api(

    customer_id: int,


    db: Session = Depends(get_db),


    current_user = Depends(get_current_user),

):


    deleted = delete_customer(

        db=db,

        company_id=current_user.company_id,

        user_id=current_user.id,

        customer_id=customer_id,

    )



    if not deleted:


        raise HTTPException(

            status_code=404,

            detail="Customer not found"

        )



    return {


        "success": True,


        "message":

            "Customer deleted successfully"

    }








# =====================================================
# ACTIVATE CUSTOMER
# =====================================================


@router.patch(
    "/{customer_id}/activate",
    response_model=CustomerResponse
)
def activate_customer_api(

    customer_id: int,


    db: Session = Depends(get_db),


    current_user = Depends(get_current_user),

):


    customer = activate_customer(

        db=db,

        company_id=current_user.company_id,

        user_id=current_user.id,

        customer_id=customer_id,

    )



    if not customer:


        raise HTTPException(

            status_code=404,

            detail="Customer not found"

        )



    return customer








# =====================================================
# DEACTIVATE CUSTOMER
# =====================================================


@router.patch(
    "/{customer_id}/deactivate",
    response_model=CustomerResponse
)
def deactivate_customer_api(

    customer_id: int,


    db: Session = Depends(get_db),


    current_user = Depends(get_current_user),

):


    customer = deactivate_customer(

        db=db,

        company_id=current_user.company_id,

        user_id=current_user.id,

        customer_id=customer_id,

    )



    if not customer:


        raise HTTPException(

            status_code=404,

            detail="Customer not found"

        )



    return customer







# =====================================================
# EXPORT CUSTOMER CSV
# =====================================================


@router.get(
    "/export/csv"
)
def export_customer_csv_api(

    db: Session = Depends(get_db),


    current_user = Depends(get_current_user),

):


    file = export_customers_csv(

        db=db,

        company_id=current_user.company_id,

        user_id=current_user.id,

    )



    return StreamingResponse(

    file,

    media_type="application/pdf",

    headers={

        "Content-Disposition":

        "attachment; filename=customers.pdf"

    }

)








# =====================================================
# EXPORT TOP CUSTOMERS CSV
# =====================================================


@router.get(
    "/export/top-customers/csv"
)
def export_top_customers_csv_api(

    db: Session = Depends(get_db),


    current_user = Depends(get_current_user),

):


    file = export_top_customers_csv(

        db=db,

        company_id=current_user.company_id,

        user_id=current_user.id,

    )



    return StreamingResponse(

    file,

    media_type="application/pdf",

    headers={

        "Content-Disposition":

        "attachment; filename=customers.pdf"

    }

)


# =====================================================
# EXPORT CUSTOMER LIST PDF
# =====================================================


@router.get(
    "/export/pdf"
)
def export_customer_pdf_api(

    db: Session = Depends(get_db),


    current_user = Depends(get_current_user),

):


    file = generate_customer_list_pdf(

    db=db,

    company_id=current_user.company_id,

)



    return StreamingResponse(

    file,

    media_type="application/pdf",

    headers={

        "Content-Disposition":

        "attachment; filename=customers.pdf"

    }

)




# =====================================================
# EXPORT TOP CUSTOMERS PDF
# =====================================================


@router.get(
    "/export/top-customers/pdf"
)
def export_top_customers_pdf_api(

    db: Session = Depends(get_db),


    current_user = Depends(get_current_user),

):


    file = generate_top_customers_pdf(

    db=db,

    company_id=current_user.company_id,

)



    return StreamingResponse(

    file,

    media_type="application/pdf",

    headers={

        "Content-Disposition":

        "attachment; filename=customers.pdf"

    }

)


# =====================================================
# EXPORT CUSTOMER ANALYTICS PDF
# =====================================================


@router.get(
    "/export/analytics/pdf"
)
def export_customer_analytics_pdf_api(

    db: Session = Depends(get_db),


    current_user = Depends(get_current_user),

):


    file = generate_customer_analytics_pdf(

    db=db,

    company_id=current_user.company_id,

)



    return StreamingResponse(

    file,

    media_type="application/pdf",

    headers={

        "Content-Disposition":

        "attachment; filename=customers.pdf"

    }

)







# =====================================================
# GET CUSTOMER BY ID
# KEEP THIS ROUTE LAST
# =====================================================


@router.get(
    "/{customer_id}",
    response_model=CustomerResponse
)
def get_customer_api(

    customer_id: int,


    db: Session = Depends(get_db),


    current_user = Depends(get_current_user),

):


    customer = get_customer(

        db=db,

        company_id=current_user.company_id,

        customer_id=customer_id,

    )



    if not customer:


        raise HTTPException(

            status_code=404,

            detail="Customer not found"

        )



    return customer