from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.dependencies.roles import require_roles

from app.models.user import User

from app.schemas.product import (
    ProductCreate,
    ProductUpdate,
    ProductResponse,
)

from app.services.product_service import (
    create_product,
    get_products,
    get_product,
    update_product,
    delete_product,
    search_products,
    activate_product,
    deactivate_product,
    get_dashboard_summary,
)

router = APIRouter(
    prefix="/products",
    tags=["Products"],
)


@router.post(
    "/",
    response_model=ProductResponse,
)
def create_new_product(
    product: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("COMPANY_ADMIN")
    ),
):
    try:
        return create_product(
            db,
            product,
            current_user,
        )

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e),
        )


@router.get(
    "/",
    response_model=list[ProductResponse],
)
def list_products(
    search: Optional[str] = Query(None),
    category_id: Optional[int] = Query(None),
    brand: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    sort_by: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if (
        search
        or category_id
        or brand
        or status
        or sort_by
    ):
        return search_products(
            db=db,
            current_user=current_user,
            search=search,
            category_id=category_id,
            brand=brand,
            status=status,
            sort_by=sort_by,
        )

    return get_products(
        db,
        current_user,
    )


@router.get(
    "/{product_id}",
    response_model=ProductResponse,
)
def get_product_by_id(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    product = get_product(
        db,
        product_id,
        current_user,
    )

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found.",
        )

    return product


@router.put(
    "/{product_id}",
    response_model=ProductResponse,
)
def edit_product(
    product_id: int,
    data: ProductUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
       require_roles("COMPANY_ADMIN")
    ),
):
    try:
        product = update_product(
            db,
            product_id,
            data,
            current_user,
        )

        if not product:
            raise HTTPException(
                status_code=404,
                detail="Product not found.",
            )

        return product

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e),
        )


@router.delete(
    "/{product_id}",
)
def remove_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("COMPANY_ADMIN")
    ),
):
    success = delete_product(
        db,
        product_id,
        current_user,
    )

    if not success:
        raise HTTPException(
            status_code=404,
            detail="Product not found.",
        )

    return {
        "message": "Product deleted successfully."
    }

@router.patch(
    "/{product_id}/activate",
    response_model=ProductResponse,
)
def activate_product_route(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("COMPANY_ADMIN")
    ),
):
    product = activate_product(
        db,
        product_id,
        current_user,
    )

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found.",
        )

    return product


@router.patch(
    "/{product_id}/deactivate",
    response_model=ProductResponse,
)
def deactivate_product_route(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("COMPANY_ADMIN")
    ),
):
    product = deactivate_product(
        db,
        product_id,
        current_user,
    )

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found.",
        )

    return product


@router.get(
    "/dashboard/summary",
)
def dashboard_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_dashboard_summary(
        db,
        current_user,
    )