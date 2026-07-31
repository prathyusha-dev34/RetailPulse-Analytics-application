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
    SimpleDocTemplate,
    Table,
    TableStyle,
    Paragraph,
    Spacer,
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

from app.models.sale import Sale
from app.models.sale_item import SaleItem
from app.models.product import Product
from app.models.notification import Notification


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
):

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
    email: str,
    phone: str,
    customer_id: int | None = None,
):


    email_query = (
        db.query(Customer)
        .filter(
            Customer.company_id == company_id,
            Customer.email == email,
        )
    )


    if customer_id:

        email_query = email_query.filter(
            Customer.id != customer_id
        )


    if email_query.first():

        raise ValueError(
            "Email already exists."
        )



    phone_query = (
        db.query(Customer)
        .filter(
            Customer.company_id == company_id,
            Customer.phone_number == phone,
        )
    )


    if customer_id:

        phone_query = phone_query.filter(
            Customer.id != customer_id
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
# CREATE CUSTOMER
# =====================================================

def create_customer(
    db: Session,
    company_id: int,
    user_id: int,
    customer: CustomerCreate,
):


    validate_duplicate_customer(

        db=db,

        company_id=company_id,

        email=customer.email,

        phone=customer.phone_number,

    )



    db_customer = Customer(

        company_id=company_id,


        customer_id=generate_customer_id(
            db,
            company_id,
        ),


        full_name=customer.full_name,


        email=customer.email,


        phone_number=customer.phone_number,


        date_of_birth=customer.date_of_birth,


        gender=customer.gender,


        address=customer.address,


        city=customer.city,


        state=customer.state,


        country=customer.country,


        postal_code=customer.postal_code,


        customer_type=customer.customer_type,


        preferred_sales_channel=
            customer.preferred_sales_channel,


        status=customer.status,


        customer_segment="New",


        total_orders=0,


        total_quantity_purchased=0,


        lifetime_revenue=Decimal("0.00"),


        average_order_value=Decimal("0.00"),


        purchase_frequency=Decimal("0.00"),


        is_vip="No",


        created_by=user_id,

    )



    try:


        db.add(db_customer)


        db.flush()



        create_purchase_summary(

            db=db,

            customer_id=db_customer.id,

        )



        notification = Notification(

            company_id=company_id,

            user_id=None,

            title="New Customer",

            message=(

                f"{db_customer.full_name} "
                f"registered successfully."

            ),

            notification_type="CUSTOMER",

        )


        db.add(notification)



        create_audit_log(

            db=db,

            company_id=company_id,

            user_id=user_id,

            entity_name=(
                f"Customer : "
                f"{db_customer.customer_id}"
            ),

            action="CUSTOMER_CREATED",

        )



        db.commit()


        db.refresh(db_customer)



        return db_customer



    except Exception:


        db.rollback()


        raise


# =====================================================
# GET ALL CUSTOMERS
# =====================================================

def get_customers(
    db: Session,
    company_id: int,
    skip: int = 0,
    limit: int = 100,
):

    return (

        db.query(Customer)

        .options(
            joinedload(
                Customer.purchase_summary
            )
        )

        .filter(
            Customer.company_id == company_id
        )

        .order_by(
            Customer.created_at.desc()
        )

        .offset(skip)

        .limit(limit)

        .all()

    )




# =====================================================
# GET CUSTOMER BY ID
# =====================================================

def get_customer(
    db: Session,
    company_id: int,
    customer_id: int,
):

    return (

        db.query(Customer)

        .options(
            joinedload(
                Customer.purchase_summary
            )
        )

        .filter(

            Customer.company_id == company_id,

            Customer.id == customer_id,

        )

        .first()

    )




# =====================================================
# GET CUSTOMER BY CUSTOMER CODE
# =====================================================

def get_customer_by_code(
    db: Session,
    company_id: int,
    customer_code: str,
):

    return (

        db.query(Customer)

        .filter(

            Customer.company_id == company_id,

            Customer.customer_id == customer_code,

        )

        .first()

    )




# =====================================================
# GET CUSTOMER BY EMAIL
# =====================================================

def get_customer_by_email(
    db: Session,
    company_id: int,
    email: str,
):

    return (

        db.query(Customer)

        .filter(

            Customer.company_id == company_id,

            Customer.email == email,

        )

        .first()

    )




# =====================================================
# SEARCH CUSTOMERS
# =====================================================

def search_customers(
    db: Session,
    company_id: int,
    keyword: str,
):


    return (

        db.query(Customer)

        .options(
            joinedload(
                Customer.purchase_summary
            )
        )

        .filter(

            Customer.company_id == company_id,


            or_(

                Customer.full_name.ilike(
                    f"%{keyword}%"
                ),


                Customer.customer_id.ilike(
                    f"%{keyword}%"
                ),


                Customer.email.ilike(
                    f"%{keyword}%"
                ),


                Customer.phone_number.ilike(
                    f"%{keyword}%"
                ),

            ),

        )

        .order_by(
            Customer.full_name.asc()
        )

        .all()

    )




# =====================================================
# FILTER CUSTOMERS
# =====================================================

def filter_customers(

    db: Session,

    company_id: int,

    customer_type: str | None = None,

    status: str | None = None,

    city: str | None = None,

    state: str | None = None,

    country: str | None = None,

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

    order: str = "desc",

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

        query = query.order_by(
            column.asc()
        )


    else:

        query = query.order_by(
            column.desc()
        )



    return query


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
        Sale.customer_id == customer.id,
        Sale.is_deleted == False
    )
    .all()
)

    summary = customer.purchase_summary


    if not summary:

        summary = create_purchase_summary(
            db,
            customer.id
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

            or

            sale.sale_date < first_purchase

        ):

            first_purchase = sale.sale_date



        if (

            last_purchase is None

            or

            sale.sale_date > last_purchase

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


                product_frequency[product_name] = (

                    product_frequency.get(
                        product_name,
                        0
                    )

                    +

                    item.quantity

                )



                if item.product.category:


                    category_name = (
                        item.product.category.name
                    )


                    category_frequency[category_name] = (

                        category_frequency.get(
                            category_name,
                            0
                        )

                        +

                        item.quantity

                    )




    if total_orders:


        average_order = (

            total_revenue

            /

            Decimal(total_orders)

        )

    else:

        average_order = Decimal("0.00")



        # ===============================
    # UPDATE SUMMARY TABLE
    # ===============================

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


    # ===============================
    # PRODUCT / CATEGORY SUMMARY
    # ===============================

    if product_frequency:

        favourite_product = max(
            product_frequency,
            key=product_frequency.get
        )

    else:

        favourite_product = None



    if category_frequency:

        favourite_category = max(
            category_frequency,
            key=category_frequency.get
        )

    else:

        favourite_category = None



    summary.favorite_product = (
        favourite_product
    )

    summary.favorite_category = (
        favourite_category
    )

    summary.product_frequency = (
        product_frequency
    )

    summary.category_frequency = (
        category_frequency
    )


        # ===============================
    # UPDATE CUSTOMER TABLE
    # ===============================

    customer.total_orders = total_orders

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


    # ===============================
    # MOST PURCHASED PRODUCT
    # ===============================

    if product_frequency:

        most_product = max(
            product_frequency,
            key=product_frequency.get
        )

        summary.most_purchased_product = (
            most_product
        )

        summary.favorite_product = (
            most_product
        )

        customer.favorite_product = (
            most_product
        )


    # ===============================
    # MOST PURCHASED CATEGORY
    # ===============================

    if category_frequency:

        most_category = max(
            category_frequency,
            key=category_frequency.get
        )

        summary.most_purchased_category = (
            most_category
        )

        summary.favorite_category = (
            most_category
        )

        customer.favorite_category = (
            most_category
        )


        # ===============================
    # CUSTOMER SEGMENT UPDATE
    # ===============================

    update_customer_segment(
        customer,
        summary
    )


    # ===============================
    # MOST PURCHASED PRODUCT
    # ===============================

    if product_frequency:

        summary.most_purchased_product = max(
            product_frequency,
            key=product_frequency.get
        )


    # ===============================
    # MOST PURCHASED CATEGORY
    # ===============================

    if category_frequency:

        summary.most_purchased_category = max(
            category_frequency,
            key=category_frequency.get
        )


    # ===============================
    # FAVOURITE PRODUCT
    # ===============================

    if product_frequency:

        favourite_product = max(
            product_frequency,
            key=product_frequency.get
        )

        summary.favorite_product = favourite_product
        customer.favorite_product = favourite_product



    # ===============================
    # FAVOURITE CATEGORY
    # ===============================

    if category_frequency:

        favourite_category = max(
            category_frequency,
            key=category_frequency.get
        )

        summary.favorite_category = favourite_category
        customer.favorite_category = favourite_category



    db.add(summary)

    db.add(customer)

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

        or

        orders >= VIP_ORDERS

    ):


        segment = "VIP"

        is_vip = "Yes"




    elif (

        revenue >= LOYAL_REVENUE

        or

        orders >= LOYAL_ORDERS

    ):


        segment = "Loyal"

        is_vip = "No"





    elif (

        revenue >= REGULAR_REVENUE

        or

        orders >= REGULAR_ORDERS

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

        or

        not last_purchase

        or

        total_orders <= 1

    ):

        return Decimal("0.00")




    days = (

        last_purchase - first_purchase

    ).days




    if days <= 0:

        return Decimal(
            str(total_orders)
        )



    return round(

        Decimal(total_orders)

        /

        Decimal(days),

        2

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

        user_id=None,

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




    last_purchase = customer.last_purchase_date



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





    inactive_customers = (

        total_customers

        -

        active_customers

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





    # =====================================
    # VIP REVENUE CALCULATION
    # =====================================

    vip_revenue = sum(

        Decimal(

            str(

                customer.lifetime_revenue or 0

            )

        )

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





    vip_average_spend = (

        vip_revenue

        /

        Decimal(vip_customers)

        if vip_customers

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



        "vip_revenue":

            vip_revenue,



        "vip_average_spend":

            vip_average_spend,



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


    customers = (
        db.query(Customer)
        .filter(
            Customer.company_id == company_id
        )
        .all()
    )


    result = []


    for customer in customers:


        revenue_query = (
            db.query(
                func.coalesce(
                    func.sum(
                        Sale.total_amount
                    ),
                    0
                )
            )
            .filter(
                Sale.company_id == company_id,
                Sale.customer_id == customer.id
            )
        )


        # only if is_deleted column exists
        if hasattr(Sale, "is_deleted"):

            revenue_query = revenue_query.filter(
                Sale.is_deleted == False
            )


        revenue = (
            revenue_query.scalar()
            or Decimal("0.00")
        )



        orders_query = (
            db.query(
                func.count(
                    Sale.id
                )
            )
            .filter(
                Sale.company_id == company_id,
                Sale.customer_id == customer.id
            )
        )


        if hasattr(Sale, "is_deleted"):

            orders_query = orders_query.filter(
                Sale.is_deleted == False
            )


        orders = (
            orders_query.scalar()
            or 0
        )



        result.append({

            "id": customer.id,

            "customer_id": customer.customer_id,

            "customer_name": customer.full_name,

            "total_orders": orders,

            "lifetime_revenue": float(
                revenue
            ),

            "customer_segment":
                customer.customer_segment,

        })



    result.sort(

        key=lambda x:
            x["lifetime_revenue"],

        reverse=True

    )


    return result[:limit]
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

            ),

        )

        .filter(

            Customer.company_id == company_id

        )

        .group_by(

            Customer.customer_type

        )

        .all()

    )




    result = []



    for row in rows:


        result.append({

            "customer_type":

                row[0],



            "revenue":

                float(row[1] or 0),

        })




    return result






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

            func.count(Customer.id),

        )

        .filter(

            Customer.company_id == company_id

        )

        .group_by(

            Customer.city

        )

        .all()

    )




    result = []



    for row in rows:


        result.append({

            "city":

                row[0],


            "customers":

                row[1],

        })




    return result






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

                Customer.created_at

            ).label("month"),


            func.count(Customer.id)

        )

        .filter(

            Customer.company_id == company_id

        )

        .group_by(

            "month"

        )

        .order_by(

            "month"

        )

        .all()

    )




    result = []



    for row in rows:


        result.append({

            "month":

                row[0].strftime(
                    "%b %Y"
                )
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


        "0-1000": 0,

        "1000-10000": 0,

        "10000-50000": 0,

        "50000+": 0,


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
# CUSTOMER TIMELINE
# =====================================================


def get_customer_timeline(

    db: Session,

    company_id: int,

    customer_id: int,

):


    customer = get_customer(

        db,

        company_id,

        customer_id

    )



    if not customer:

        return []





    timeline = [


        {

            "event":

                "Customer Registered",


            "date":

                customer.created_at,

        }

    ]





    if customer.first_purchase_date:


        timeline.append({

            "event":

                "First Purchase",


            "date":

                customer.first_purchase_date,

        })





    if customer.last_purchase_date:


        timeline.append({

            "event":

                "Last Purchase",


            "date":

                customer.last_purchase_date,

        })





    if customer.status == "INACTIVE":


        timeline.append({

            "event":

                "Customer Deactivated",


            "date":

                customer.updated_at,

        })






    return sorted(

        timeline,

        key=lambda x: x["date"]

    )








# =====================================================
# CUSTOMER PROFILE
# =====================================================


def get_customer_profile(

    db: Session,

    company_id: int,

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

            Customer.company_id == company_id,


            Customer.id == customer_id

        )

        .first()

    )



    if not customer:

        return None





    recent_transactions = (

        db.query(Sale)

        .filter(

            Sale.company_id == company_id,


            Sale.customer_id == customer.id

        )

        .order_by(

            Sale.sale_date.desc()

        )

        .limit(10)

        .all()

    )





    favourite_products = (

        get_frequently_purchased_products(

            db,

            customer.id

        )

    )





    timeline = get_customer_timeline(

        db,

        company_id,

        customer.id

    )






    return {


        "customer":

            customer,



        "purchase_summary":

            customer.purchase_summary,



        "recent_transactions":

            recent_transactions,



        "favourite_products":

            favourite_products,



        "timeline":

            timeline,


    }








# =====================================================
# RECENT TRANSACTIONS
# =====================================================


def get_recent_transactions(

    db: Session,

    company_id: int,

    customer_id: int,

    limit: int = 10,

):


    return (

        db.query(Sale)

        .filter(

            Sale.company_id == company_id,


            Sale.customer_id == customer_id

        )

        .order_by(

            Sale.sale_date.desc()

        )

        .limit(limit)

        .all()

    )








# =====================================================
# FREQUENTLY PURCHASED PRODUCTS
# =====================================================


def get_frequently_purchased_products(

    db: Session,

    customer_id: int,

):


    rows = (

        db.query(

            Product.id,


            Product.name,


            func.sum(

                SaleItem.quantity

            ).label("quantity")

        )


        .join(

            SaleItem,

            Product.id == SaleItem.product_id

        )


        .join(

            Sale,

            Sale.id == SaleItem.sale_id

        )


        .filter(

            Sale.customer_id == customer_id

        )


        .group_by(

            Product.id,

            Product.name

        )


        .order_by(

            func.sum(

                SaleItem.quantity

            ).desc()

        )


        .limit(10)


        .all()

    )





    return [


        {


            "product_id":

                row.id,



            "product_name":

                row.name,



            "quantity":

                row.quantity,


        }


        for row in rows

    ]


# =====================================================
# RECENT CUSTOMER ACTIVITY
# =====================================================


def get_recent_customer_activity(

    db: Session,

    company_id: int,

    limit: int = 20,

):


    customers = (

        db.query(Customer)

        .filter(

            Customer.company_id == company_id

        )

        .order_by(

            Customer.updated_at.desc()

        )

        .limit(limit)

        .all()

    )



    activity = []



    for customer in customers:


        activity.append({


            "customer_id":

                customer.customer_id,



            "customer_name":

                customer.full_name,



            "status":

                customer.status,



            "segment":

                customer.customer_segment,



            "last_updated":

                customer.updated_at,


        })



    return activity







# =====================================================
# LARGE PURCHASE DETECTION
# =====================================================


def create_large_purchase_activity(

    db: Session,

    sale: Sale,

    threshold: Decimal = Decimal("10000.00"),

):


    if Decimal(

        str(

            sale.total_amount

        )

    ) < threshold:

        return




    customer = (

        db.query(Customer)

        .filter(

            Customer.id == sale.customer_id

        )

        .first()

    )




    if not customer:

        return





    db.add(

        Notification(

            company_id=customer.company_id,

            user_id=None,

            title="Large Purchase",

            message=(

                f"{customer.full_name} "

                f"made a purchase of "

                f"${sale.total_amount}."

            ),

            notification_type="CUSTOMER",

        )

    )









# =====================================================
# CUSTOMER ACTIVITY TIMELINE
# =====================================================


def get_customer_activity_timeline(

    db: Session,

    company_id: int,

    customer_id: int,

):


    customer = get_customer(

        db,

        company_id,

        customer_id

    )



    if not customer:

        return []




    timeline = []




    timeline.append({

        "event":

            "Customer Registered",


        "date":

            customer.created_at,

    })





    if customer.updated_at:


        timeline.append({

            "event":

                "Profile Updated",


            "date":

                customer.updated_at,

        })





    if customer.first_purchase_date:


        timeline.append({

            "event":

                "First Purchase",


            "date":

                customer.first_purchase_date,

        })





    if customer.last_purchase_date:


        timeline.append({

            "event":

                "Last Purchase",


            "date":

                customer.last_purchase_date,

        })





    if customer.status == "ACTIVE":


        timeline.append({

            "event":

                "Customer Active",


            "date":

                customer.updated_at,

        })





    if customer.status == "INACTIVE":


        timeline.append({

            "event":

                "Customer Deactivated",


            "date":

                customer.updated_at,

        })






    return sorted(

        timeline,

        key=lambda x: x["date"] or datetime.min

    )








# =====================================================
# RECENT CUSTOMERS WIDGET
# =====================================================


def get_recent_customers(

    db: Session,

    company_id: int,

    limit: int = 5,

):


    return (

        db.query(Customer)

        .filter(

            Customer.company_id == company_id

        )

        .order_by(

            Customer.created_at.desc()

        )

        .limit(limit)

        .all()

    )









# =====================================================
# CUSTOMER REVENUE CONTRIBUTION
# =====================================================


def get_customer_revenue_contribution(

    db: Session,

    company_id: int,

):


    total = (

        db.query(

            func.sum(

                Customer.lifetime_revenue

            )

        )

        .filter(

            Customer.company_id == company_id

        )

        .scalar()

        or Decimal("0.00")

    )




    customers = (

        db.query(Customer)

        .filter(

            Customer.company_id == company_id

        )

        .all()

    )




    result = []




    for customer in customers:


        contribution = Decimal("0.00")



        if total > 0:


            contribution = round(

                (

                    Decimal(

                        str(

                            customer.lifetime_revenue

                        )

                    )

                    /

                    Decimal(total)

                )

                *

                100,

                2,

            )





        result.append({


            "customer_id":

                customer.customer_id,



            "customer_name":

                customer.full_name,



            "revenue":

                customer.lifetime_revenue,



            "contribution":

                contribution,


        })





    return sorted(

        result,

        key=lambda x: x["revenue"],

        reverse=True

    )









# =====================================================
# NEW VS RETURNING CUSTOMERS
# =====================================================


def get_new_vs_returning_customers(

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




    new_count = sum(

        1

        for customer in customers

        if customer.total_orders <= 1

    )




    returning_count = sum(

        1

        for customer in customers

        if customer.total_orders > 1

    )





    return {


        "new_customers":

            new_count,



        "returning_customers":

            returning_count,


    }


# =====================================================
# EXPORT CUSTOMERS CSV
# =====================================================

import csv
import io



def export_customers_csv(

    db: Session,

    company_id: int,

    user_id: int,

):


    customers = (

        db.query(Customer)

        .filter(

            Customer.company_id == company_id

        )

        .order_by(

            Customer.full_name

        )

        .all()

    )



    output = io.StringIO()


    writer = csv.writer(output)



    writer.writerow([

        "Customer ID",

        "Customer Name",

        "Email",

        "Phone",

        "Customer Type",

        "Status",

        "Segment",

        "City",

        "State",

        "Country",

        "Total Orders",

        "Lifetime Revenue",

        "Average Order Value",

        "Last Purchase",

        "Customer Since",

    ])





    for customer in customers:


        writer.writerow([


            customer.customer_id,


            customer.full_name,


            customer.email,


            customer.phone_number,


            customer.customer_type,


            customer.status,


            customer.customer_segment,


            customer.city,


            customer.state,


            customer.country,


            customer.total_orders,


            float(

                customer.lifetime_revenue or 0

            ),


            float(

                customer.average_order_value or 0

            ),


            customer.last_purchase_date,


            customer.created_at,


        ])





    create_audit_log(

    db=db,

    company_id=company_id,

    user_id=user_id,

    entity_name="Customers",

    action="CUSTOMER_CSV_EXPORTED",

)


# TEMPORARY COMMENT
# db.add(
#     Notification(
#         company_id=company_id,
#         user_id=None,
#         title="Customer Export",
#         message="Customer CSV exported successfully.",
#         notification_type="EXPORT",
#     )
# )

    db.commit()

    output.seek(0)

    return output







# =====================================================
# EXPORT TOP CUSTOMERS CSV
# =====================================================


def export_top_customers_csv(
    db: Session,
    company_id: int,
    user_id: int,
):

    customers = get_top_customers(
        db,
        company_id,
        limit=10
    )


    output = io.StringIO()

    writer = csv.writer(output)


    writer.writerow([
        "Rank",
        "Customer",
        "Revenue",
        "Orders",
        "Segment",
    ])


    for index, customer in enumerate(
        customers,
        start=1
    ):

        writer.writerow([

            index,

            customer["customer_name"],

            customer["lifetime_revenue"],

            customer["total_orders"],

            customer["customer_segment"],

        ])


    create_audit_log(
        db=db,
        company_id=company_id,
        user_id=user_id,
        entity_name="Top Customers",
        action="TOP_CUSTOMERS_EXPORTED",
    )


    db.commit()


    output.seek(0)


    return output



# =====================================================
# PDF DOCUMENT SETUP
# =====================================================


def create_pdf_document(

    title

):


    buffer = BytesIO()



    doc = SimpleDocTemplate(

        buffer,

        pagesize=letter

    )



    styles = getSampleStyleSheet()



    elements = []



    elements.append(

        Paragraph(

            title,

            styles["Title"]

        )

    )



    elements.append(

        Spacer(

            1,

            20

        )

    )



    return buffer, doc, elements







# =====================================================
# CUSTOMER LIST PDF
# =====================================================


def generate_customer_list_pdf(

    db: Session,

    company_id: int,

):


    buffer, doc, elements = create_pdf_document(

        "Customer List Report"

    )



    customers = (

        db.query(Customer)

        .filter(

            Customer.company_id == company_id

        )

        .all()

    )




    data = [

        [

            "ID",

            "Name",

            "Email",

            "Phone",

            "Created Date"

        ]

    ]





    for customer in customers:


        data.append([


            customer.customer_id,


            customer.full_name,


            customer.email or "-",


            customer.phone_number or "-",


            str(

                customer.created_at.date()

            )

            if customer.created_at

            else "-"


        ])




    table = Table(data)



    table.setStyle(

        TableStyle([


            (

                "GRID",

                (0,0),

                (-1,-1),

                0.5,

                colors.black

            ),



            (

                "BACKGROUND",

                (0,0),

                (-1,0),

                colors.grey

            )


        ])

    )




    elements.append(table)



    doc.build(elements)



    buffer.seek(0)



    return buffer







# =====================================================
# TOP CUSTOMERS PDF
# =====================================================


def generate_top_customers_pdf(

    db: Session,

    company_id: int,

):


    buffer, doc, elements = create_pdf_document(

        "Top Customers Report"

    )


    customers = get_top_customers(

        db,

        company_id,

        limit=10

    )


    data = [

        [

            "Rank",

            "Customer",

            "Revenue"

        ]

    ]



    for index, customer in enumerate(

        customers,

        start=1

    ):


        data.append([


            index,


            customer["customer_name"],


            float(

                customer["lifetime_revenue"] or 0

            )


        ])




    table = Table(data)



    table.setStyle(

        TableStyle([


            (

                "GRID",

                (0,0),

                (-1,-1),

                0.5,

                colors.black

            )


        ])

    )



    elements.append(table)



    doc.build(elements)



    buffer.seek(0)



    return buffer




# =====================================================
# CUSTOMER ANALYTICS PDF
# =====================================================


def generate_customer_analytics_pdf(

    db: Session,

    company_id: int,

):


    buffer, doc, elements = create_pdf_document(

        "Customer Analytics Report"

    )



    dashboard = get_customer_dashboard(

        db,

        company_id

    )




    data = [

        [

            "Metric",

            "Value"

        ],


        [

            "Total Customers",

            dashboard["total_customers"]

        ],


        [

            "VIP Customers",

            dashboard["vip_customers"]

        ],


        [

            "Total Revenue",

            dashboard["total_revenue_generated"]

        ],


        [

            "Generated Date",

            datetime.now().date()

        ]

    ]




    table = Table(data)



    table.setStyle(

        TableStyle([


            (

                "GRID",

                (0,0),

                (-1,-1),

                0.5,

                colors.black

            )


        ])

    )



    elements.append(table)



    doc.build(elements)



    buffer.seek(0)



    return buffer


# =====================================================
# DASHBOARD CUSTOMER WIDGETS
# =====================================================


def get_dashboard_customer_widgets(

    db: Session,

    company_id: int,

):


    return {


        "top_customers":

            get_top_customers(

                db,

                company_id

            ),



        "recent_customers":

            get_recent_customers(

                db,

                company_id,

                limit=5

            ),



        "growth":

            get_customer_growth_trend(

                db,

                company_id

            ),



        "revenue_contribution":

            get_customer_revenue_contribution(

                db,

                company_id

            ),



        "customer_segments":

            get_new_vs_returning_customers(

                db,

                company_id

            ),

    }


# =====================================================
# UPDATE CUSTOMER
# =====================================================

def update_customer(
    db: Session,
    company_id: int,
    user_id: int,
    customer_id: int,
    customer: CustomerUpdate,
):

    db_customer = (
        db.query(Customer)
        .filter(
            Customer.company_id == company_id,
            Customer.id == customer_id,
        )
        .first()
    )

    if not db_customer:
        return None


    update_data = customer.model_dump(
        exclude_unset=True
    )


    for key, value in update_data.items():

        setattr(
            db_customer,
            key,
            value
        )


    create_audit_log(
        db=db,
        company_id=company_id,
        user_id=user_id,
        entity_name=f"Customer : {db_customer.customer_id}",
        action="CUSTOMER_UPDATED",
    )


    db.commit()

    db.refresh(db_customer)

    return db_customer



# =====================================================
# DELETE CUSTOMER
# =====================================================

def delete_customer(
    db: Session,
    company_id: int,
    user_id: int,
    customer_id: int,
):

    customer = (
        db.query(Customer)
        .filter(
            Customer.company_id == company_id,
            Customer.id == customer_id,
        )
        .first()
    )


    if not customer:
        return False


    db.delete(customer)


    create_audit_log(
        db=db,
        company_id=company_id,
        user_id=user_id,
        entity_name=f"Customer : {customer.customer_id}",
        action="CUSTOMER_DELETED",
    )


    db.commit()


    return True



# =====================================================
# ACTIVATE CUSTOMER
# =====================================================

def activate_customer(
    db: Session,
    company_id: int,
    user_id: int,
    customer_id: int,
):

    customer = (
        db.query(Customer)
        .filter(
            Customer.company_id == company_id,
            Customer.id == customer_id,
        )
        .first()
    )


    if not customer:
        return None


    customer.status = "ACTIVE"


    create_audit_log(
        db=db,
        company_id=company_id,
        user_id=user_id,
        entity_name=f"Customer : {customer.customer_id}",
        action="CUSTOMER_ACTIVATED",
    )


    db.commit()

    db.refresh(customer)

    return customer



# =====================================================
# DEACTIVATE CUSTOMER
# =====================================================

def deactivate_customer(
    db: Session,
    company_id: int,
    user_id: int,
    customer_id: int,
):

    customer = (
        db.query(Customer)
        .filter(
            Customer.company_id == company_id,
            Customer.id == customer_id,
        )
        .first()
    )


    if not customer:
        return None


    customer.status = "INACTIVE"


    create_audit_log(
        db=db,
        company_id=company_id,
        user_id=user_id,
        entity_name=f"Customer : {customer.customer_id}",
        action="CUSTOMER_DEACTIVATED",
    )


    db.commit()

    db.refresh(customer)

    return customer


# =====================================================
# END OF CUSTOMER SERVICE
# =====================================================