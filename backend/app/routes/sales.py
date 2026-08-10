from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
)

from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User

from app.schemas.sale import (
    SaleCreate,
    SaleUpdate,
    SaleResponse,
)

from app.services.sales_service import (
    create_sale,
    get_sales,
    get_sale,
    update_sale,
    delete_sale,
    restore_sale,
    search_sales,
    filter_sales,
    sort_sales,
    get_dashboard_summary,
    get_low_stock_products,
    get_out_of_stock_products,
    get_remaining_stock,
    get_top_customers,
    get_sale_by_invoice,
    get_customer_sales,
    get_recent_customer_sales,
    get_complete_sale_details,
    get_sale_export_data,
)


router = APIRouter(
    prefix="/sales",
    tags=["Sales"],
)


# ============================================================
# CREATE SALE
# ============================================================

@router.post(
    "/",
    response_model=SaleResponse,
)
def create_new_sale(
    sale: SaleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return create_sale(
            db=db,
            sale_data=sale,
            company_id=current_user.company_id,
            user_id=current_user.id,
        )

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e),
        )


# ============================================================
# GET ALL SALES
# ============================================================

@router.get(
    "/",
    response_model=list[SaleResponse],
)
def get_all_sales(
    search: str | None = None,
    payment_method: str | None = None,
    payment_status: str | None = None,
    start_date: str | None = None,
    end_date: str | None = None,
    sort_by: str = "date",
    sort_order: str = "desc",
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),

    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_sales(
        db=db,
        company_id=current_user.company_id,
        search=search,
        payment_method=payment_method,
        payment_status=payment_status,
        start_date=start_date,
        end_date=end_date,
        sort_by=sort_by,
        sort_order=sort_order,
        skip=skip,
        limit=limit,
    )


# ============================================================
# SEARCH SALES
# ============================================================

@router.get(
    "/search",
)
def search_sales_route(
    keyword: str = Query(
        ...,
        min_length=1,
    ),
    skip: int = Query(
        0,
        ge=0,
    ),
    limit: int = Query(
        100,
        ge=1,
        le=500,
    ),

    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return search_sales(
        db=db,
        company_id=current_user.company_id,
        keyword=keyword,
        skip=skip,
        limit=limit,
    )


# ============================================================
# FILTER SALES
# ============================================================

@router.get(
    "/filter",
)
def filter_sales_route(
    payment_method: str | None = None,
    payment_status: str | None = None,
    start_date: str | None = None,
    end_date: str | None = None,

    skip: int = Query(
        0,
        ge=0,
    ),
    limit: int = Query(
        100,
        ge=1,
        le=500,
    ),

    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return filter_sales(
        db=db,
        company_id=current_user.company_id,
        payment_method=payment_method,
        payment_status=payment_status,
        start_date=start_date,
        end_date=end_date,
        skip=skip,
        limit=limit,
    )


# ============================================================
# SORT SALES
# ============================================================

@router.get(
    "/sort",
)
def sort_sales_route(
    sort_by: str = "date",
    sort_order: str = "desc",

    skip: int = Query(
        0,
        ge=0,
    ),
    limit: int = Query(
        100,
        ge=1,
        le=500,
    ),

    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sales = sort_sales(
        db=db,
        company_id=current_user.company_id,
        sort_by=sort_by,
        order=sort_order,
        skip=skip,
        limit=limit,
    )

    return list(sales)


# ============================================================
# SALES DASHBOARD
# ============================================================

@router.get(
    "/dashboard",
)
def sales_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_dashboard_summary(
        db=db,
        company_id=current_user.company_id,
    )


# ============================================================
# TOP CUSTOMERS
# ============================================================

@router.get(
    "/top-customers",
)
def top_customers_route(
    limit: int = Query(
        10,
        ge=1,
        le=100,
    ),

    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_top_customers(
        db=db,
        company_id=current_user.company_id,
        limit=limit,
    )


# ============================================================
# LOW STOCK PRODUCTS
# ============================================================

@router.get(
    "/low-stock",
)
def low_stock_products(
    threshold: int = Query(
        5,
        ge=0,
    ),

    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_low_stock_products(
        db=db,
        company_id=current_user.company_id,
        threshold=threshold,
    )


# ============================================================
# OUT OF STOCK PRODUCTS
# ============================================================

@router.get(
    "/out-of-stock",
)
def out_of_stock_products(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_out_of_stock_products(
        db=db,
        company_id=current_user.company_id,
    )


# ============================================================
# REMAINING STOCK
# ============================================================

@router.get(
    "/remaining-stock/{product_id}",
)
def remaining_stock(
    product_id: int,

    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return get_remaining_stock(
            db=db,
            product_id=product_id,
            company_id=current_user.company_id,
        )

    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e),
        )


# ============================================================
# GET SALE BY INVOICE
# ============================================================

@router.get(
    "/invoice/{invoice_number}",
)
def get_sale_by_invoice_route(
    invoice_number: str,

    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return get_sale_by_invoice(
            db=db,
            invoice_number=invoice_number,
            company_id=current_user.company_id,
        )

    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e),
        )


# ============================================================
# CUSTOMER SALES
# ============================================================

@router.get(
    "/customer/{customer_id}",
)
def customer_sales_route(
    customer_id: int,

    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_customer_sales(
        db=db,
        customer_id=customer_id,
        company_id=current_user.company_id,
    )


# ============================================================
# RECENT CUSTOMER SALES
# ============================================================

@router.get(
    "/customer/{customer_id}/recent",
)
def recent_customer_sales_route(
    customer_id: int,

    limit: int = Query(
        10,
        ge=1,
        le=100,
    ),

    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_recent_customer_sales(
        db=db,
        customer_id=customer_id,
        company_id=current_user.company_id,
        limit=limit,
    )


# ============================================================
# COMPLETE SALE / INVOICE DETAILS
# ============================================================

@router.get(
    "/{sale_id}/invoice",
)
def complete_sale_details(
    sale_id: int,

    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return get_complete_sale_details(
            db=db,
            sale_id=sale_id,
            company_id=current_user.company_id,
        )

    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e),
        )


# ============================================================
# SALE EXPORT DATA
# ============================================================

@router.get(
    "/{sale_id}/export",
)
def sale_export_data(
    sale_id: int,

    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return get_sale_export_data(
            db=db,
            sale_id=sale_id,
            company_id=current_user.company_id,
        )

    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e),
        )


# ============================================================
# UPDATE SALE
# ============================================================

@router.put(
    "/{sale_id}",
    response_model=SaleResponse,
)
def update_existing_sale(
    sale_id: int,

    sale: SaleUpdate,

    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return update_sale(
            db=db,
            sale_id=sale_id,
            sale_data=sale,
            company_id=current_user.company_id,
            user_id=current_user.id,
        )

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e),
        )


# ============================================================
# DELETE SALE
# ============================================================

@router.delete(
    "/{sale_id}",
)
def delete_existing_sale(
    sale_id: int,

    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return delete_sale(
            db=db,
            sale_id=sale_id,
            company_id=current_user.company_id,
            user_id=current_user.id,
        )

    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e),
        )


# ============================================================
# RESTORE SALE
# ============================================================

@router.post(
    "/{sale_id}/restore",
)
def restore_existing_sale(
    sale_id: int,

    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return restore_sale(
            db=db,
            sale_id=sale_id,
            company_id=current_user.company_id,
            user_id=current_user.id,
        )

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e),
        )


# ============================================================
# GET SALE DETAILS
# IMPORTANT: KEEP THIS LAST
# ============================================================

@router.get(
    "/{sale_id}",
    response_model=SaleResponse,
)
def get_sale_details(
    sale_id: int,

    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return get_sale(
            db=db,
            sale_id=sale_id,
            company_id=current_user.company_id,
        )

    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e),
        )