import sys
import os

sys.path.append(
    os.path.dirname(
        os.path.dirname(
            os.path.abspath(__file__)
        )
    )
)

from app.core.database import SessionLocal


from app.services.sales_service import sync_customer_sales_analytics
from app.models.customer import Customer


db = SessionLocal()


try:

    customers = db.query(Customer).all()

    print(
        "Total Customers:",
        len(customers)
    )

    for customer in customers:

        sync_customer_sales_analytics(
            db=db,
            customer_id=customer.id
        )

        print(
            "Updated:",
            customer.full_name
        )


finally:

    db.close()