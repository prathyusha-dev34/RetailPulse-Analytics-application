from fastapi import APIRouter, Depends

from sqlalchemy.orm import Session

from app.core.database import get_db

from app.services.inventory_seed_service import (
    create_missing_inventory
)


router = APIRouter(
    prefix="/inventory",
    tags=["Inventory"]
)



@router.post("/create-existing")
def create_existing_inventory(
    db: Session = Depends(get_db),
):

    return create_missing_inventory(
        db
    )