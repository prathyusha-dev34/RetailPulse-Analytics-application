from typing import Optional

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

router = APIRouter(
    prefix="/inventory",
    tags=["Inventory"],
)


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
        )

    return get_inventory(
        db,
        current_user,
    )


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


@router.get(
    "/movements",
    response_model=list[InventoryMovementResponse],
)
def movement_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_movement_history(
        db,
        current_user,
    )


@router.patch(
    "/add-stock",
    response_model=InventoryResponse,
)
def add_stock_route(
    data: StockAdjustment,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
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

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e),
        )


@router.patch(
    "/remove-stock",
    response_model=InventoryResponse,
)
def remove_stock_route(
    data: StockAdjustment,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
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

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e),
        )


@router.patch(
    "/adjust-stock",
    response_model=InventoryResponse,
)
def adjust_stock_route(
    data: StockAdjustment,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
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

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e),
        )


@router.patch(
    "/{inventory_id}/reorder-level",
    response_model=InventoryResponse,
)
def update_reorder_level_route(
    inventory_id: int,
    data: ReorderLevelUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
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

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e),
        )