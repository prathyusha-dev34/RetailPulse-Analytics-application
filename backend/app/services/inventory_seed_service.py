from sqlalchemy.orm import Session

from app.models.product import Product
from app.models.inventory import Inventory

from app.services.inventory_service import (
    calculate_stock_status
)


def create_missing_inventory(
    db: Session,
):

    products = (
        db.query(Product)
        .all()
    )


    created = 0


    for product in products:

        existing_inventory = (
            db.query(Inventory)
            .filter(
                Inventory.product_id
                == product.id
            )
            .first()
        )


        if existing_inventory:
            continue


        inventory = Inventory(

            company_id=product.company_id,

            product_id=product.id,

            current_stock=product.stock_quantity,

            reserved_stock=0,

            available_stock=product.stock_quantity,

            reorder_level=10,

            stock_status=calculate_stock_status(
                product.stock_quantity,
                10,
            ),
        )


        db.add(inventory)

        created += 1


    db.commit()


    return {
        "message":
        "Inventory created successfully",

        "created_records":
        created,
    }