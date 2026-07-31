from datetime import datetime
from decimal import Decimal
from io import BytesIO
import csv
import io

from sqlalchemy import func, or_
from sqlalchemy.orm import Session, joinedload

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import (
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)
from reportlab.lib.styles import getSampleStyleSheet


from app.schemas.customer import (
    CustomerCreate,
    CustomerUpdate,
)

from app.services.audit_service import (
    create_audit_log,
)

from app.models.customer import Customer
from app.models.customer_purchase_summary import (
    CustomerPurchaseSummary,
)

from app.models.notification import Notification
from app.models.product import Product
from app.models.category import Category
from app.models.inventory import Inventory
from app.models.sale import Sale
from app.models.sale_item import SaleItem

# =====================================================
# CONSTANTS
# =====================================================

VIP_REVENUE = Decimal("100000")
LOYAL_REVENUE = Decimal("50000")
REGULAR_REVENUE = Decimal("10000")


VIP_ORDERS = 100
LOYAL_ORDERS = 50
REGULAR_ORDERS = 10



# =====================================================
# CUSTOMER ID GENERATOR
# =====================================================

def generate_customer_id(
    db: Session,
    company_id: int,
) -> str:

    """
    Generate unique customer code.

    Format:
    CUS-YYYY-000001
    """

    year = datetime.now().year


    last_customer = (
        db.query(Customer.customer_id)
        .filter(
            Customer.company_id == company_id,
            Customer.customer_id.like(
                f"CUS-{year}-%"
            ),
        )
        .order_by(
            Customer.customer_id.desc()
        )
        .first()
    )


    if last_customer:

        last_number = int(
            last_customer[0]
            .split("-")[-1]
        )

        next_number = last_number + 1

    else:

        next_number = 1



    return (
        f"CUS-{year}-{next_number:06d}"
    )




# =====================================================
# DUPLICATE CUSTOMER VALIDATION
# =====================================================

def validate_duplicate_customer(
    db: Session,
    company_id: int,
    email: str | None,
    phone: str | None,
    customer_id: int | None = None,
):


    if email:

        email_query = (
            db.query(Customer)
            .filter(
                Customer.company_id == company_id,
                Customer.email == email,
            )
        )


        if customer_id:

            email_query = (
                email_query.filter(
                    Customer.id != customer_id
                )
            )


        if email_query.first():

            raise ValueError(
                "Email already exists."
            )



    if phone:

        phone_query = (
            db.query(Customer)
            .filter(
                Customer.company_id == company_id,
                Customer.phone_number == phone,
            )
        )


        if customer_id:

            phone_query = (
                phone_query.filter(
                    Customer.id != customer_id
                )
            )


        if phone_query.first():

            raise ValueError(
                "Phone number already exists."
            )





# =====================================================
# CREATE PURCHASE SUMMARY
# =====================================================

def create_purchase_summary(
    db: Session,
    customer_id: int,
):


    summary = CustomerPurchaseSummary(

        customer_id=customer_id,

        total_orders=0,

        total_quantity_purchased=0,

        total_revenue=Decimal("0.00"),

        average_order_value=Decimal("0.00"),

        purchase_frequency=Decimal("0.00"),

        customer_segment="New",

        is_vip="No",
    )


    db.add(summary)

    return summary




# =====================================================
# FILTER CUSTOMERS
# =====================================================

def filter_customers(
    db: Session,
    company_id: int,
    customer_type=None,
    status=None,
    city=None,
    state=None,
    country=None,
    from_date=None,
    to_date=None,
):


    query = (

        db.query(Customer)

        .options(
            joinedload(
                Customer.purchase_summary
            )
        )

        .filter(
            Customer.company_id == company_id
        )

    )



    if customer_type:

        query = query.filter(
            Customer.customer_type
            ==
            customer_type
        )



    if status:

        query = query.filter(
            Customer.status
            ==
            status
        )



    if city:

        query = query.filter(
            Customer.city
            ==
            city
        )



    if state:

        query = query.filter(
            Customer.state
            ==
            state
        )



    if country:

        query = query.filter(
            Customer.country
            ==
            country
        )



    if from_date:

        query = query.filter(
            Customer.created_at >= from_date
        )



    if to_date:

        query = query.filter(
            Customer.created_at <= to_date
        )



    return (

        query

        .order_by(
            Customer.created_at.desc()
        )

        .all()

    )





# =====================================================
# SORT CUSTOMERS
# =====================================================

def sort_customers(
    query,
    sort_by: str,
    order="desc",
):


    sort_columns = {

        "name":
            Customer.full_name,

        "total_spend":
            Customer.lifetime_revenue,

        "total_orders":
            Customer.total_orders,

        "last_purchase":
            Customer.last_purchase_date,

        "customer_since":
            Customer.created_at,

    }



    column = sort_columns.get(
        sort_by,
        Customer.created_at,
    )



    if order.lower() == "asc":

        return query.order_by(
            column.asc()
        )


    return query.order_by(
        column.desc()
    )



# =====================================================
# UPDATE CUSTOMER PURCHASE SUMMARY
# =====================================================

def update_customer_purchase_summary(
    db: Session,
    customer_id: int,
):


    customer = (

        db.query(Customer)

        .options(
            joinedload(
                Customer.purchase_summary
            )
        )

        .filter(
            Customer.id == customer_id
        )

        .first()

    )


    if not customer:

        return None



    sales = (

        db.query(Sale)

        .filter(
            Sale.customer_id == customer.id
        )

        .all()

    )



    summary = customer.purchase_summary



    if not summary:

        summary = create_purchase_summary(
            db,
            customer.id,
        )



    total_orders = len(sales)

    total_revenue = Decimal("0.00")

    total_quantity = 0



    first_purchase = None

    last_purchase = None



    product_frequency = {}

    category_frequency = {}




    for sale in sales:



        total_revenue += Decimal(
            str(
                sale.total_amount
            )
        )



        if (

            first_purchase is None

            or sale.sale_date < first_purchase

        ):

            first_purchase = sale.sale_date



        if (

            last_purchase is None

            or sale.sale_date > last_purchase

        ):

            last_purchase = sale.sale_date




        items = (

            db.query(SaleItem)

            .options(
                joinedload(
                    SaleItem.product
                )
            )

            .filter(
                SaleItem.sale_id == sale.id
            )

            .all()

        )



        for item in items:


            total_quantity += item.quantity



            if item.product:


                product_name = (
                    item.product.name
                )


                product_frequency[
                    product_name
                ] = (

                    product_frequency.get(
                        product_name,
                        0
                    )

                    + item.quantity

                )



                if item.product.category:


                    category_name = (
                        item.product.category.name
                    )


                    category_frequency[
                        category_name
                    ] = (

                        category_frequency.get(
                            category_name,
                            0
                        )

                        + item.quantity

                    )






    if total_orders:


        average_order = (

            total_revenue

            /

            Decimal(
                total_orders
            )

        )


    else:


        average_order = Decimal(
            "0.00"
        )





    # =====================================
    # UPDATE SUMMARY
    # =====================================


    summary.total_orders = total_orders

    summary.total_quantity_purchased = (
        total_quantity
    )

    summary.total_revenue = (
        total_revenue
    )

    summary.average_order_value = (
        average_order
    )

    summary.first_purchase_date = (
        first_purchase
    )

    summary.last_purchase_date = (
        last_purchase
    )





    # =====================================
    # UPDATE CUSTOMER
    # =====================================


    customer.total_orders = (
        total_orders
    )

    customer.total_quantity_purchased = (
        total_quantity
    )

    customer.lifetime_revenue = (
        total_revenue
    )

    customer.average_order_value = (
        average_order
    )

    customer.first_purchase_date = (
        first_purchase
    )

    customer.last_purchase_date = (
        last_purchase
    )





    # =====================================
    # FAVOURITE PRODUCT
    # =====================================


    if product_frequency:


        favourite_product = max(
            product_frequency,
            key=product_frequency.get
        )


        summary.favorite_product = (
            favourite_product
        )


        customer.favorite_product = (
            favourite_product
        )





    # =====================================
    # FAVOURITE CATEGORY
    # =====================================


    if category_frequency:


        favourite_category = max(
            category_frequency,
            key=category_frequency.get
        )


        summary.favorite_category = (
            favourite_category
        )


        customer.favorite_category = (
            favourite_category
        )





    update_customer_segment(
        customer,
        summary,
    )



    db.commit()

    db.refresh(customer)


    return customer






# =====================================================
# CUSTOMER SEGMENT CALCULATION
# =====================================================

def update_customer_segment(
    customer: Customer,
    summary: CustomerPurchaseSummary,
):


    revenue = Decimal(
        str(
            summary.total_revenue
        )
    )


    orders = summary.total_orders




    if (

        revenue >= VIP_REVENUE

        or orders >= VIP_ORDERS

    ):


        segment = "VIP"

        is_vip = "Yes"



    elif (

        revenue >= LOYAL_REVENUE

        or orders >= LOYAL_ORDERS

    ):


        segment = "Loyal"

        is_vip = "No"



    elif (

        revenue >= REGULAR_REVENUE

        or orders >= REGULAR_ORDERS

    ):


        segment = "Regular"

        is_vip = "No"



    else:


        segment = "New"

        is_vip = "No"





    customer.customer_segment = segment

    customer.is_vip = is_vip



    summary.customer_segment = segment

    summary.is_vip = is_vip



    summary.purchase_frequency = (
        calculate_purchase_frequency(
            summary.first_purchase_date,
            summary.last_purchase_date,
            summary.total_orders,
        )
    )


    customer.purchase_frequency = (
        summary.purchase_frequency
    )






# =====================================================
# PURCHASE FREQUENCY
# =====================================================

def calculate_purchase_frequency(
    first_purchase,
    last_purchase,
    total_orders,
):


    if (

        not first_purchase

        or not last_purchase

        or total_orders <= 1

    ):

        return Decimal(
            "0.00"
        )



    days = (

        last_purchase

        -

        first_purchase

    ).days




    if days <= 0:


        return Decimal(
            str(total_orders)
        )



    return round(

        Decimal(
            total_orders
        )

        /

        Decimal(
            days
        ),

        2,

    )






# =====================================================
# FIRST PURCHASE NOTIFICATION
# =====================================================

def create_first_purchase_notification(
    db: Session,
    customer: Customer,
):


    notification = Notification(

        company_id=customer.company_id,

        user_id=customer.created_by,

        title="First Purchase",

        message=(

            f"{customer.full_name} "

            "completed first purchase."

        ),

        notification_type="CUSTOMER",

    )


    db.add(notification)






# =====================================================
# VIP CUSTOMER NOTIFICATION
# =====================================================

def create_vip_notification(
    db: Session,
    customer: Customer,
):


    if customer.customer_segment != "VIP":

        return




    notification = Notification(

        company_id=customer.company_id,

        user_id=None,

        title="VIP Customer",

        message=(

            f"{customer.full_name} "

            "became a VIP customer."

        ),

        notification_type="CUSTOMER",

    )


    db.add(notification)






# =====================================================
# INACTIVE CUSTOMER CHECK
# =====================================================

def check_inactive_customer(
    db: Session,
    customer: Customer,
):


    if not customer.last_purchase_date:

        return



    last_purchase = (
        customer.last_purchase_date
    )



    if hasattr(
        last_purchase,
        "replace"
    ):


        last_purchase = (
            last_purchase.replace(
                tzinfo=None
            )
        )



    days = (

        datetime.utcnow()

        -

        last_purchase

    ).days




    if days < 90:

        return




    notification = Notification(

        company_id=customer.company_id,

        user_id=None,

        title="Inactive Customer",

        message=(

            f"{customer.full_name} "

            f"has been inactive for "

            f"{days} days."

        ),

        notification_type="CUSTOMER",

    )



    db.add(notification)


    # =====================================================
# CUSTOMER ANALYTICS DASHBOARD
# =====================================================

def get_customer_dashboard(
    db: Session,
    company_id: int,
):


    customers = (

        db.query(Customer)

        .filter(
            Customer.company_id == company_id
        )

        .all()

    )



    total_customers = len(customers)



    active_customers = sum(

        1

        for customer in customers

        if customer.status == "ACTIVE"

    )



    inactive_customers = sum(

        1

        for customer in customers

        if customer.status == "INACTIVE"

    )



    new_customers = sum(

        1

        for customer in customers

        if customer.customer_segment == "New"

    )



    regular_customers = sum(

        1

        for customer in customers

        if customer.customer_segment == "Regular"

    )



    loyal_customers = sum(

        1

        for customer in customers

        if customer.customer_segment == "Loyal"

    )



    vip_customers = sum(

        1

        for customer in customers

        if customer.customer_segment == "VIP"

    )



    total_revenue = sum(

        Decimal(
            str(
                customer.lifetime_revenue or 0
            )
        )

        for customer in customers

    )



    average_customer_spend = (

        total_revenue

        /

        Decimal(total_customers)

        if total_customers

        else Decimal("0.00")

    )



    average_purchase_frequency = (

        sum(

            Decimal(
                str(
                    customer.purchase_frequency or 0
                )
            )

            for customer in customers

        )

        /

        Decimal(total_customers)

        if total_customers

        else Decimal("0.00")

    )



    returning_customers = (

        total_customers

        -

        new_customers

    )



    return {

        "total_customers":
            total_customers,

        "active_customers":
            active_customers,

        "inactive_customers":
            inactive_customers,

        "new_customers":
            new_customers,

        "regular_customers":
            regular_customers,

        "loyal_customers":
            loyal_customers,

        "vip_customers":
            vip_customers,

        "returning_customers":
            returning_customers,

        "average_customer_spend":
            average_customer_spend,

        "total_revenue_generated":
            total_revenue,

        "average_purchase_frequency":
            average_purchase_frequency,

    }





# =====================================================
# TOP CUSTOMERS
# =====================================================

def get_top_customers(
    db: Session,
    company_id: int,
    limit: int = 10,
):


    return (

        db.query(Customer)

        .filter(
            Customer.company_id == company_id
        )

        .order_by(
            Customer.lifetime_revenue.desc()
        )

        .limit(limit)

        .all()

    )






# =====================================================
# REVENUE BY CUSTOMER TYPE
# =====================================================

def revenue_by_customer_type(
    db: Session,
    company_id: int,
):


    rows = (

        db.query(

            Customer.customer_type,

            func.sum(
                Customer.lifetime_revenue
            )

        )

        .filter(
            Customer.company_id == company_id
        )

        .group_by(
            Customer.customer_type
        )

        .all()

    )



    return [

        {

            "customer_type":
                row[0],

            "revenue":
                float(row[1] or 0),

        }

        for row in rows

    ]






# =====================================================
# LOCATION DISTRIBUTION
# =====================================================

def location_distribution(
    db: Session,
    company_id: int,
):


    rows = (

        db.query(

            Customer.city,

            func.count(
                Customer.id
            )

        )

        .filter(
            Customer.company_id == company_id
        )

        .group_by(
            Customer.city
        )

        .all()

    )



    return [

        {

            "city":
                row[0],

            "customers":
                row[1],

        }

        for row in rows

    ]






# =====================================================
# MONTHLY CUSTOMER ACQUISITION
# =====================================================

def get_monthly_customer_acquisition(
    db: Session,
    company_id: int,
):


    rows = (

        db.query(

            func.date_trunc(
                "month",
                Customer.created_at,
            ),

            func.count(
                Customer.id
            ),

        )

        .filter(
            Customer.company_id == company_id
        )

        .group_by(
            Customer.created_at
        )

        .order_by(
            Customer.created_at
        )

        .all()

    )



    result = []



    for row in rows:


        result.append({

            "month":

                row[0].strftime("%b %Y")
                if row[0]
                else None,


            "customers":
                row[1],

        })



    return result






# =====================================================
# CUSTOMER GROWTH TREND
# =====================================================

def get_customer_growth_trend(
    db: Session,
    company_id: int,
):


    customers = (

        db.query(Customer)

        .filter(
            Customer.company_id == company_id
        )

        .order_by(
            Customer.created_at
        )

        .all()

    )



    growth = []

    total = 0



    for customer in customers:


        total += 1


        growth.append({

            "date":

                customer.created_at.date()
                if customer.created_at
                else None,


            "total_customers":
                total,

        })



    return growth






# =====================================================
# CUSTOMER SPENDING DISTRIBUTION
# =====================================================

def get_customer_spending_distribution(
    db: Session,
    company_id: int,
):


    customers = (

        db.query(Customer)

        .filter(
            Customer.company_id == company_id
        )

        .all()

    )



    distribution = {

        "0-1000":0,

        "1000-10000":0,

        "10000-50000":0,

        "50000+":0,

    }



    for customer in customers:


        revenue = float(
            customer.lifetime_revenue or 0
        )



        if revenue < 1000:

            distribution["0-1000"] += 1


        elif revenue < 10000:

            distribution["1000-10000"] += 1


        elif revenue < 50000:

            distribution["10000-50000"] += 1


        else:

            distribution["50000+"] += 1



        return distribution


# =====================================================
# ANALYTICS DASHBOARD SUMMARY
# =====================================================

def get_dashboard_summary(
    db: Session,
    company_id: int,
):

    total_customers = (
        db.query(Customer)
        .filter(
            Customer.company_id == company_id
        )
        .count()
    )

    total_revenue = (
        db.query(
            func.sum(Customer.lifetime_revenue)
        )
        .filter(
            Customer.company_id == company_id
        )
        .scalar()
        or Decimal("0.00")
    )

    total_orders = (
        db.query(Sale)
        .filter(
            Sale.company_id == company_id
        )
        .count()
    )

    vip_customers = (
        db.query(Customer)
        .filter(
            Customer.company_id == company_id,
            Customer.customer_segment == "VIP",
        )
        .count()
    )

    active_customers = (
        db.query(Customer)
        .filter(
            Customer.company_id == company_id,
            Customer.status == "ACTIVE",
        )
        .count()
    )

    return {
        "total_customers": total_customers,
        "total_orders": total_orders,
        "total_revenue": total_revenue,
        "vip_customers": vip_customers,
        "active_customers": active_customers,
    }


# =====================================================
# REVENUE TREND
# =====================================================

def get_revenue_trend(
    db: Session,
    company_id: int,
    filters=None,
    period="daily",
):

    query = (
        db.query(
            func.date_trunc(
                "month",
                Sale.sale_date
            ).label("period"),

            func.sum(
                Sale.total_amount
            ).label("revenue")
        )
        .filter(
            Sale.company_id == company_id
        )
    )


    if filters:

        if filters.get("from_date"):

            query = query.filter(
                Sale.sale_date >= filters["from_date"]
            )


        if filters.get("to_date"):

            query = query.filter(
                Sale.sale_date <= filters["to_date"]
            )


    rows = (
        query
        .group_by(
            "period"
        )
        .order_by(
            "period"
        )
        .all()
    )


    result = []


    for row in rows:

        result.append(
            {
                "period":
                    row.period.strftime("%b %Y")
                    if row.period
                    else None,

                "revenue":
                    float(row.revenue or 0)
            }
        )


    return result


# =====================================================
# SALES TREND
# =====================================================

def get_sales_trend(
    db: Session,
    company_id: int,
    filters=None,
    period="daily",
):

    query = (
        db.query(
            func.date_trunc(
                "month",
                Sale.sale_date
            ).label("period"),

            func.count(
                Sale.id
            ).label("orders"),

            func.sum(
                Sale.total_amount
            ).label("sales")
        )
        .filter(
            Sale.company_id == company_id
        )
    )


    if filters:

        if filters.get("from_date"):

            query = query.filter(
                Sale.sale_date >= filters["from_date"]
            )


        if filters.get("to_date"):

            query = query.filter(
                Sale.sale_date <= filters["to_date"]
            )


    rows = (
        query
        .group_by(
            "period"
        )
        .order_by(
            "period"
        )
        .all()
    )


    result = []


    for row in rows:

        result.append(
            {
                "period":
                    row.period.strftime("%b %Y")
                    if row.period
                    else None,

                "orders":
                    row.orders,

                "sales":
                    float(row.sales or 0)
            }
        )


    return result

# =====================================================
# TOP PRODUCTS ANALYTICS
# =====================================================

def get_top_products(
    db: Session,
    company_id: int,
    filters=None,
    limit: int = 10,
):

    query = (
        db.query(
            Product.name.label("product"),
            func.sum(
                SaleItem.quantity
            ).label("quantity"),

            func.sum(
                SaleItem.quantity * SaleItem.unit_price
            ).label("revenue")
        )
        .join(
            SaleItem,
            SaleItem.product_id == Product.id
        )
        .join(
            Sale,
            Sale.id == SaleItem.sale_id
        )
        .filter(
            Sale.company_id == company_id
        )
    )


    if filters:

        if filters.get("from_date"):

            query = query.filter(
                Sale.sale_date >= filters["from_date"]
            )


        if filters.get("to_date"):

            query = query.filter(
                Sale.sale_date <= filters["to_date"]
            )


    rows = (
        query
        .group_by(
            Product.name
        )
        .order_by(
            func.sum(
                SaleItem.quantity
            ).desc()
        )
        .limit(limit)
        .all()
    )


    return [

        {
            "product": row.product,
            "quantity": row.quantity,
            "revenue": float(row.revenue or 0)
        }

        for row in rows

    ]


# =====================================================
# TOP CATEGORIES ANALYTICS
# =====================================================

def get_top_categories(
    db: Session,
    company_id: int,
    filters=None,
    limit: int = 10,
):

    query = (
        db.query(
            Category.name.label("category"),

            func.sum(
                SaleItem.quantity
            ).label("quantity"),

            func.sum(
                SaleItem.quantity *
                SaleItem.unit_price
            ).label("revenue")
        )
        .join(
            Product,
            Product.id == SaleItem.product_id
        )
        .join(
            Category,
            Category.id == Product.category_id
        )
        .join(
            Sale,
            Sale.id == SaleItem.sale_id
        )
        .filter(
            Sale.company_id == company_id
        )
    )


    if filters:

        if filters.get("from_date"):

            query = query.filter(
                Sale.sale_date >= filters["from_date"]
            )


        if filters.get("to_date"):

            query = query.filter(
                Sale.sale_date <= filters["to_date"]
            )


    rows = (
        query
        .group_by(
            Category.name
        )
        .order_by(
            func.sum(
                SaleItem.quantity
            ).desc()
        )
        .limit(limit)
        .all()
    )


    return [

        {
            "category": row.category,
            "quantity": row.quantity,
            "revenue": float(
                row.revenue or 0
            )
        }

        for row in rows

    ]


# =====================================================
# SALES BY PAYMENT METHOD
# =====================================================

def get_sales_by_payment_method(
    db: Session,
    company_id: int,
    filters=None,
):

    query = (
        db.query(
            Sale.payment_method.label("payment_method"),

            func.count(
                Sale.id
            ).label("orders"),

            func.sum(
                Sale.total_amount
            ).label("revenue")
        )
        .filter(
            Sale.company_id == company_id
        )
    )


    if filters:

        if filters.get("from_date"):

            query = query.filter(
                Sale.sale_date >= filters["from_date"]
            )


        if filters.get("to_date"):

            query = query.filter(
                Sale.sale_date <= filters["to_date"]
            )


        if filters.get("payment_method"):

            query = query.filter(
                Sale.payment_method ==
                filters["payment_method"]
            )


    rows = (
        query
        .group_by(
            Sale.payment_method
        )
        .all()
    )


    return [

        {
            "payment_method": row.payment_method,

            "orders": row.orders,

            "revenue": float(
                row.revenue or 0
            )
        }

        for row in rows

    ]


# =====================================================
# SALES BY CHANNEL
# =====================================================

def get_sales_by_channel(
    db: Session,
    company_id: int,
    filters=None,
):

    query = (
        db.query(
            Sale.sales_channel.label("sales_channel"),

            func.count(
                Sale.id
            ).label("orders"),

            func.sum(
                Sale.total_amount
            ).label("revenue")
        )
        .filter(
            Sale.company_id == company_id
        )
    )


    if filters:

        if filters.get("from_date"):

            query = query.filter(
                Sale.sale_date >= filters["from_date"]
            )


        if filters.get("to_date"):

            query = query.filter(
                Sale.sale_date <= filters["to_date"]
            )


        if filters.get("sales_channel"):

            query = query.filter(
                Sale.sales_channel ==
                filters["sales_channel"]
            )


    rows = (
        query
        .group_by(
            Sale.sales_channel
        )
        .all()
    )


    return [

        {
            "sales_channel": row.sales_channel,

            "orders": row.orders,

            "revenue": float(
                row.revenue or 0
            )
        }

        for row in rows

    ]

# =====================================================
# INVENTORY DISTRIBUTION
# =====================================================

def get_inventory_distribution(
    db: Session,
    company_id: int,
    filters=None,
):

    rows = (
        db.query(
            Inventory.stock_status.label("status"),

            func.count(
                Inventory.id
            ).label("products")
        )
        .filter(
            Inventory.company_id == company_id
        )
        .group_by(
            Inventory.stock_status
        )
        .all()
    )


    return [

        {
            "status": row.status,

            "products": row.products
        }

        for row in rows

    ]


# =====================================================
# STOCK STATUS SUMMARY
# =====================================================

def get_stock_status_summary(
    db: Session,
    company_id: int,
    filters=None,
):

    rows = (
        db.query(
            Inventory.stock_status.label("status"),

            func.count(
                Inventory.id
            ).label("count")
        )
        .filter(
            Inventory.company_id == company_id
        )
        .group_by(
            Inventory.stock_status
        )
        .all()
    )


    return [

        {
            "status": row.status,
            "count": row.count
        }

        for row in rows

    ]



# =====================================================
# INVENTORY VALUE BY CATEGORY
# =====================================================

def get_inventory_value_by_category(
    db: Session,
    company_id: int,
    filters=None,
):


    rows = (

        db.query(

            Category.name.label("category"),

            func.sum(
                Inventory.available_stock *
                Product.unit_price
            ).label("value")

        )

        .join(
            Product,
            Product.id == Inventory.product_id
        )

        .join(
            Category,
            Category.id == Product.category_id
        )

        .filter(
            Inventory.company_id == company_id
        )

        .group_by(
            Category.name
        )

        .all()

    )


    return [

        {
            "category": row.category,

            "value": float(
                row.value or 0
            )
        }

        for row in rows

    ]



# =====================================================
# LOW STOCK PRODUCTS
# =====================================================

def get_low_stock_items(
    db: Session,
    company_id: int,
    filters=None,
):


    rows = (

        db.query(

            Product.name.label("product"),

            Inventory.available_stock.label(
                "available_stock"
            ),

            Inventory.reorder_level.label(
                "reorder_level"
            )

        )

        .join(
            Inventory,
            Inventory.product_id == Product.id
        )

        .filter(

            Inventory.company_id == company_id,

            Inventory.stock_status == "Low Stock"

        )

        .all()

    )


    return [

        {

            "product": row.product,

            "available_stock":
                row.available_stock,

            "reorder_level":
                row.reorder_level

        }

        for row in rows

    ]



# =====================================================
# OUT OF STOCK PRODUCTS
# =====================================================

def get_out_of_stock_items(
    db: Session,
    company_id: int,
    filters=None,
):


    rows = (

        db.query(

            Product.name.label("product"),

            Inventory.available_stock.label(
                "available_stock"
            )

        )

        .join(
            Inventory,
            Inventory.product_id == Product.id
        )

        .filter(

            Inventory.company_id == company_id,

            Inventory.stock_status == "Out of Stock"

        )

        .all()

    )


    return [

        {

            "product": row.product,

            "available_stock":
                row.available_stock

        }

        for row in rows

    ]


    