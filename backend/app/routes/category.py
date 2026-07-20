from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import get_current_user

from app.models.user import User

from app.schemas.category import (
    CategoryCreate,
    CategoryUpdate,
    CategoryResponse,
)

from app.services.category_service import (
    create_category,
    get_categories,
    get_category,
    update_category,
    delete_category,
    search_categories,
)

router = APIRouter(
    prefix="/categories",
    tags=["Categories"],
)


@router.post(
    "/",
    response_model=CategoryResponse,
)
def create_new_category(
    category: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return create_category(db, category, current_user)
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e),
        )


@router.get(
    "/",
    response_model=list[CategoryResponse],
)
def list_categories(
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if search:
        return search_categories(
            db,
            search,
            current_user,
        )

    return get_categories(
        db,
        current_user,
    )


@router.get(
    "/{category_id}",
    response_model=CategoryResponse,
)
def get_category_by_id(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    category = get_category(
        db,
        category_id,
        current_user,
    )

    if not category:
        raise HTTPException(
            status_code=404,
            detail="Category not found.",
        )

    return category


@router.put(
    "/{category_id}",
    response_model=CategoryResponse,
)
def edit_category(
    category_id: int,
    data: CategoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    category = update_category(
        db,
        category_id,
        data,
        current_user,
    )

    if not category:
        raise HTTPException(
            status_code=404,
            detail="Category not found.",
        )

    return category


@router.delete(
    "/{category_id}",
)
def remove_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    success = delete_category(
        db,
        category_id,
        current_user,
    )

    if not success:
        raise HTTPException(
            status_code=404,
            detail="Category not found.",
        )

    return {
        "message": "Category deleted successfully."
    }