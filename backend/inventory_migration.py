from app.core.database import SessionLocal

from app.models.product import Product
from app.models.inventory import Inventory

from app.services.inventory_service import create_inventory


def migrate_inventory():

    db = SessionLocal()

    try:

        products = (
            db.query(Product)
            .all()
        )

        print(
            "Total Products:",
            len(products)
        )


        for product in products:

            existing_inventory = (
                db.query(Inventory)
                .filter(
                    Inventory.product_id == product.id
                )
                .first()
            )


            if existing_inventory:
                print(
                    f"Already exists: {product.name}"
                )
                continue


            create_inventory(
                db=db,
                product=product,
            )


            print(
                f"Created inventory: {product.name}"
            )


        print(
            "Inventory migration completed"
        )


    finally:
        db.close()



if __name__ == "__main__":

    migrate_inventory()