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
    SaleResponse,
)


from app.services.sales_service import (

    create_sale,

    get_sales,

    get_sale,

    update_sale,

    delete_sale,

    search_sales,

    filter_sales,

    sort_sales,

    get_dashboard_summary,

    get_low_stock_products,

    get_out_of_stock_products,

    get_remaining_stock,

)





router = APIRouter(

    prefix="/sales",

    tags=["Sales"]

)








# ------------------------------------------
# Create Sale
# ------------------------------------------

@router.post(
    "/",
    response_model=SaleResponse
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

            user_id=current_user.id

        )



    except ValueError as e:


        raise HTTPException(

            status_code=400,

            detail=str(e)

        )





# ------------------------------------------
# Get All Sales
# ------------------------------------------

@router.get(
    "/",
    response_model=list[SaleResponse]
)
def get_all_sales(

    db: Session = Depends(get_db),

    current_user: User = Depends(get_current_user),

):


    return get_sales(

        db=db,

        company_id=current_user.company_id

    )






# ------------------------------------------
# Search Sales
# ------------------------------------------

@router.get(
    "/search"
)
def search_sales_route(

    keyword: str = Query(...),

    db: Session = Depends(get_db),

    current_user: User = Depends(get_current_user),

):


    return search_sales(

        db=db,

        company_id=current_user.company_id,

        keyword=keyword

    )






# ------------------------------------------
# Filter Sales
# ------------------------------------------

@router.get(
    "/filter"
)
def filter_sales_route(

    start_date: str | None = None,

    end_date: str | None = None,

    category_id: int | None = None,

    sales_channel: str | None = None,

    payment_method: str | None = None,


    db: Session = Depends(get_db),

    current_user: User = Depends(get_current_user),

):


    return filter_sales(

        db=db,

        company_id=current_user.company_id,

        start_date=start_date,

        end_date=end_date,

        category_id=category_id,

        sales_channel=sales_channel,

        payment_method=payment_method

    )


# ------------------------------------------
# Sort Sales
# ------------------------------------------

@router.get(
    "/sort"
)
def sort_sales_route(

    sort_by: str = "sale_date",

    order: str = "desc",

    db: Session = Depends(get_db),

    current_user: User = Depends(get_current_user),

):


    return sort_sales(

        db=db,

        company_id=current_user.company_id,

        sort_by=sort_by,

        order=order

    )







# ------------------------------------------
# Sales Dashboard Summary
# ------------------------------------------

@router.get(
    "/dashboard"
)
def sales_dashboard(

    db: Session = Depends(get_db),

    current_user: User = Depends(get_current_user),

):


    return get_dashboard_summary(

        db=db,

        company_id=current_user.company_id

    )







# ------------------------------------------
# Low Stock Products
# ------------------------------------------

@router.get(
    "/low-stock"
)
def low_stock_products(

    threshold: int = 5,

    db: Session = Depends(get_db),

    current_user: User = Depends(get_current_user),

):


    return get_low_stock_products(

        db=db,

        company_id=current_user.company_id,

        threshold=threshold

    )







# ------------------------------------------
# Out Of Stock Products
# ------------------------------------------

@router.get(
    "/out-of-stock"
)
def out_of_stock_products(

    db: Session = Depends(get_db),

    current_user: User = Depends(get_current_user),

):


    return get_out_of_stock_products(

        db=db,

        company_id=current_user.company_id

    )







# ------------------------------------------
# Remaining Stock
# ------------------------------------------

@router.get(
    "/remaining-stock/{product_id}"
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

            company_id=current_user.company_id

        )


    except ValueError as e:


        raise HTTPException(

            status_code=404,

            detail=str(e)

        )
    

    
# ------------------------------------------
# Update Sale
# ------------------------------------------

@router.put(
    "/{sale_id}",
    response_model=SaleResponse
)
def update_existing_sale(

    sale_id: int,

    sale: SaleCreate,

    db: Session = Depends(get_db),

    current_user: User = Depends(get_current_user),

):


    try:


        return update_sale(

            db=db,

            sale_id=sale_id,

            sale_data=sale,

            company_id=current_user.company_id,

            user_id=current_user.id

        )



    except ValueError as e:


        raise HTTPException(

            status_code=400,

            detail=str(e)

        )







# ------------------------------------------
# Delete Sale
# ------------------------------------------

@router.delete(
    "/{sale_id}"
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

            user_id=current_user.id

        )



    except ValueError as e:


        raise HTTPException(

            status_code=404,

            detail=str(e)

        )
    

    

# ------------------------------------------
# Get Sale Details
# MUST BE LAST ROUTE
# ------------------------------------------

@router.get(
    "/{sale_id}",
    response_model=SaleResponse
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

            company_id=current_user.company_id

        )



    except ValueError as e:


        raise HTTPException(

            status_code=404,

            detail=str(e)

        )