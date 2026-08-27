from typing import Optional

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
)
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import (
    get_current_user,
    require_company_admin,
)
from app.models.user import User

from app.schemas.inventory import (
    InventoryResponse,
    InventoryMovementResponse,
    StockAdjustment,
    ReorderLevelUpdate,
)

from app.services.inventory_service import (
    get_inventory,
    search_inventory,
    get_dashboard_summary,
    get_movement_history,
    add_stock,
    remove_stock,
    adjust_stock,
    update_reorder_level,
)

from app.services.forecast_service import (
    get_forecast_analytics,
    get_product_forecasts,
    get_category_forecasts,
    get_inventory_recommendations,
    get_top_predicted_products,
)


router = APIRouter(
    prefix="/inventory",
    tags=["Inventory"],
)


# =====================================
# GET INVENTORY LIST
# =====================================

@router.get(
    "/",
    response_model=list[InventoryResponse],
)
def list_inventory(
    search: Optional[str] = Query(None),
    category_id: Optional[int] = Query(None),
    brand: Optional[str] = Query(None),
    stock_status: Optional[str] = Query(None),
    sort_by: Optional[str] = Query(None),
    skip: int = Query(0),
    limit: int = Query(10),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if (
        search
        or category_id
        or brand
        or stock_status
        or sort_by
    ):
        return search_inventory(
            db=db,
            current_user=current_user,
            search=search,
            category_id=category_id,
            brand=brand,
            stock_status=stock_status,
            sort_by=sort_by,
            skip=skip,
            limit=limit,
        )

    return get_inventory(
        db,
        current_user,
        skip,
        limit,
    )


# =====================================
# DASHBOARD SUMMARY
# =====================================

@router.get("/dashboard/summary")
def dashboard_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_dashboard_summary(
        db,
        current_user,
    )


# =====================================
# MOVEMENT HISTORY
# =====================================

@router.get(
    "/movements",
    response_model=list[InventoryMovementResponse],
)
def movement_history(
    skip: int = Query(0),
    limit: int = Query(10),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_movement_history(
        db,
        current_user,
        skip,
        limit,
    )


# ============================================================
# INVENTORY FORECASTING
# ============================================================

@router.get(
    "/forecast",
    tags=["Inventory"],
)
def inventory_forecast(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return get_forecast_analytics(
            db=db,
            company_id=current_user.company_id,
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
# INVENTORY PRODUCT FORECAST
# ============================================================

@router.get(
    "/forecast/products",
    tags=["Inventory"],
)
def inventory_product_forecast(
    forecast_period: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    category_id: Optional[int] = Query(None),
    brand: Optional[str] = Query(None),
    sort_by: str = Query("highest_demand"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
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
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=str(exc),
        ) from exc


# ============================================================
# INVENTORY CATEGORY FORECAST
# ============================================================

@router.get(
    "/forecast/categories",
    tags=["Inventory"],
)
def inventory_category_forecast(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return get_category_forecasts(
            db=db,
            company_id=current_user.company_id,
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
# INVENTORY RECOMMENDATIONS
# ============================================================

@router.get(
    "/recommendations",
    tags=["Inventory"],
)
def inventory_recommendations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return get_inventory_recommendations(
            db=db,
            company_id=current_user.company_id,
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
# TOP PREDICTED PRODUCTS
# ============================================================

@router.get(
    "/forecast/top-products",
    tags=["Inventory"],
)
def inventory_top_predicted_products(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return get_top_predicted_products(
            db=db,
            company_id=current_user.company_id,
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


# =====================================
# ADD STOCK
# =====================================

@router.patch(
    "/add-stock",
    response_model=InventoryResponse,
)
def add_stock_route(
    data: StockAdjustment,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_company_admin),
):
    try:
        inventory = add_stock(
            db=db,
            inventory_id=data.inventory_id,
            quantity=data.quantity,
            reason=data.reason,
            remarks=data.remarks or "",
            current_user=current_user,
        )

        if not inventory:
            raise HTTPException(
                status_code=404,
                detail="Inventory not found.",
            )

        return inventory

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc


# =====================================
# REMOVE STOCK
# =====================================

@router.patch(
    "/remove-stock",
    response_model=InventoryResponse,
)
def remove_stock_route(
    data: StockAdjustment,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_company_admin),
):
    try:
        inventory = remove_stock(
            db=db,
            inventory_id=data.inventory_id,
            quantity=data.quantity,
            reason=data.reason,
            remarks=data.remarks or "",
            current_user=current_user,
        )

        if not inventory:
            raise HTTPException(
                status_code=404,
                detail="Inventory not found.",
            )

        return inventory

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc


# =====================================
# ADJUST STOCK
# =====================================

@router.patch(
    "/adjust-stock",
    response_model=InventoryResponse,
)
def adjust_stock_route(
    data: StockAdjustment,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_company_admin),
):
    try:
        inventory = adjust_stock(
            db=db,
            inventory_id=data.inventory_id,
            quantity=data.quantity,
            reason=data.reason,
            remarks=data.remarks or "",
            current_user=current_user,
        )

        if not inventory:
            raise HTTPException(
                status_code=404,
                detail="Inventory not found.",
            )

        return inventory

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc


# =====================================
# UPDATE REORDER LEVEL
# =====================================

@router.patch(
    "/{inventory_id}/reorder-level",
    response_model=InventoryResponse,
)
def update_reorder_level_route(
    inventory_id: int,
    data: ReorderLevelUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_company_admin),
):
    try:
        inventory = update_reorder_level(
            db=db,
            inventory_id=inventory_id,
            reorder_level=data.reorder_level,
            current_user=current_user,
        )

        if not inventory:
            raise HTTPException(
                status_code=404,
                detail="Inventory not found.",
            )

        return inventory

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc