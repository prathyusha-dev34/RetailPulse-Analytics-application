from datetime import datetime
from decimal import Decimal
from typing import Optional

from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from app.models.customer import Customer
from app.models.customer_purchase_summary import CustomerPurchaseSummary
from app.models.notification import Notification
from app.core.database import get_db
from app.services.audit_service import create_audit_log


# ==========================================================
# CUSTOMER ID GENERATION
# ==========================================================

def generate_customer_id(
    db: Session,
    company_id: int,
) -> str:

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
            Customer.id.desc()
        )
        .first()
    )

    if last_customer:
        try:
            last_number = int(
                last_customer[0].split("-")[-1]
            )
        except (ValueError, AttributeError):
            last_number = 0

        next_number = last_number + 1

    else:
        next_number = 1

    return f"CUS-{year}-{next_number:06d}"


# ==========================================================
# DUPLICATE VALIDATION
# ==========================================================

def validate_duplicate_customer(
    db: Session,
    company_id: int,
    email: Optional[str] = None,
    phone: Optional[str] = None,
    customer_id: Optional[int] = None,
) -> None:

    query = (
        db.query(Customer)
        .filter(
            Customer.company_id == company_id
        )
    )

    if customer_id is not None:
        query = query.filter(
            Customer.id != customer_id
        )

    if email:
        email_exists = (
            query
            .filter(
                Customer.email == str(email).strip()
            )
            .first()
        )

        if email_exists:
            raise ValueError(
                "Email already exists for this company."
            )

    if phone:
        phone_exists = (
            query
            .filter(
                Customer.phone_number == phone.strip()
            )
            .first()
        )

        if phone_exists:
            raise ValueError(
                "Phone number already exists for this company."
            )


# ==========================================================
# PURCHASE SUMMARY CREATION
# ==========================================================

def create_purchase_summary(
    db: Session,
    customer_id: int,
) -> CustomerPurchaseSummary:

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


# ==========================================================
# CREATE CUSTOMER
# ==========================================================

def create_customer(
    db: Session,
    company_id: int,
    user_id: int,
    customer,
) -> Customer:

    validate_duplicate_customer(
        db=db,
        company_id=company_id,
        email=customer.email,
        phone=customer.phone_number,
    )

    db_customer = Customer(
        company_id=company_id,

        customer_id=generate_customer_id(
            db=db,
            company_id=company_id,
        ),

        full_name=customer.full_name.strip(),

        email=(
            str(customer.email).strip()
            if customer.email
            else None
        ),

        phone_number=(
            customer.phone_number.strip()
            if customer.phone_number
            else None
        ),

        date_of_birth=customer.date_of_birth,

        gender=customer.gender,

        address=customer.address,

        city=customer.city,

        state=customer.state,

        country=customer.country,

        postal_code=customer.postal_code,

        customer_type=(
            customer.customer_type
            or "Regular"
        ),

        preferred_sales_channel=(
            customer.preferred_sales_channel
        ),

        status="ACTIVE",

        customer_segment="New",

        total_orders=0,

        total_quantity_purchased=0,

        lifetime_revenue=Decimal("0.00"),

        average_order_value=Decimal("0.00"),

        purchase_frequency=Decimal("0.00"),

        is_vip="No",

        total_purchase_amount=Decimal("0.00"),

        created_by=user_id,
    )

    try:

        db.add(db_customer)

        db.flush()

        # Create purchase summary
        create_purchase_summary(
            db=db,
            customer_id=db_customer.id,
        )

        # Create notification
        # IMPORTANT: user_id must NOT be None
        db.add(
            Notification(
                company_id=company_id,
                user_id=user_id,
                title="New Customer",
                message=(
                    f"{db_customer.full_name} "
                    "registered successfully."
                ),
                notification_type="CUSTOMER",
            )
        )

        # Create audit log
        create_audit_log(
            db=db,
            company_id=company_id,
            user_id=user_id,
            entity_name=(
                f"Customer: "
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



# ==========================================================
# GET CUSTOMERS
# ==========================================================

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


# ==========================================================
# GET CUSTOMER COUNT
# ==========================================================

def get_customer_count(
    db: Session,
    company_id: int,
) -> int:

    return (
        db.query(Customer)
        .filter(
            Customer.company_id == company_id
        )
        .count()
    )


# ==========================================================
# GET SINGLE CUSTOMER
# ==========================================================

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


# ==========================================================
# SEARCH CUSTOMERS
# ==========================================================

def search_customers(
    db: Session,
    company_id: int,
    keyword: str,
):

    keyword = keyword.strip()

    if not keyword:
        return get_customers(
            db=db,
            company_id=company_id,
        )

    search_pattern = f"%{keyword}%"

    return (
        db.query(Customer)
        .filter(
            Customer.company_id == company_id,
            or_(
                Customer.full_name.ilike(
                    search_pattern
                ),
                Customer.customer_id.ilike(
                    search_pattern
                ),
                Customer.email.ilike(
                    search_pattern
                ),
                Customer.phone_number.ilike(
                    search_pattern
                ),
            ),
        )
        .order_by(
            Customer.full_name.asc()
        )
        .all()
    )


# ==========================================================
# FILTER CUSTOMERS
# ==========================================================

def filter_customers(
    db: Session,
    company_id: int,
    customer_type: Optional[str] = None,
    status: Optional[str] = None,
    city: Optional[str] = None,
    state: Optional[str] = None,
    country: Optional[str] = None,
    customer_segment: Optional[str] = None,
    from_date=None,
    to_date=None,
    search: Optional[str] = None,
):

    query = (
        db.query(Customer)
        .filter(
            Customer.company_id == company_id
        )
    )

    if customer_type:
        query = query.filter(
            Customer.customer_type
            == customer_type
        )

    if status:
        query = query.filter(
            Customer.status
            == status.upper()
        )

    if city:
        query = query.filter(
            Customer.city == city
        )

    if state:
        query = query.filter(
            Customer.state == state
        )

    if country:
        query = query.filter(
            Customer.country == country
        )

    if customer_segment:
        query = query.filter(
            Customer.customer_segment
            == customer_segment
        )

    if from_date:
        query = query.filter(
            Customer.created_at >= from_date
        )

    if to_date:
        query = query.filter(
            Customer.created_at <= to_date
        )

    if search:
        search_pattern = f"%{search.strip()}%"

        query = query.filter(
            or_(
                Customer.full_name.ilike(
                    search_pattern
                ),
                Customer.email.ilike(
                    search_pattern
                ),
                Customer.customer_id.ilike(
                    search_pattern
                ),
            )
        )

    return (
        query
        .order_by(
            Customer.created_at.desc()
        )
        .all()
    )


# ==========================================================
# SORT CUSTOMERS
# ==========================================================

def sort_customers(
    query,
    sort_by: str = "created_at",
    order: str = "desc",
):

    columns = {
        "name": Customer.full_name,
        "full_name": Customer.full_name,
        "total_spend": Customer.lifetime_revenue,
        "lifetime_revenue": Customer.lifetime_revenue,
        "total_orders": Customer.total_orders,
        "last_purchase": Customer.last_purchase_date,
        "last_purchase_date": Customer.last_purchase_date,
        "customer_since": Customer.created_at,
        "created_at": Customer.created_at,
        "status": Customer.status,
        "customer_segment": Customer.customer_segment,
    }

    column = columns.get(
        sort_by,
        Customer.created_at,
    )

    if str(order).lower() == "asc":
        return query.order_by(
            column.asc()
        )

    return query.order_by(
        column.desc()
    )


# ==========================================================
# UPDATE CUSTOMER
# ==========================================================

def update_customer(
    db: Session,
    company_id: int,
    user_id: int,
    customer_id: int,
    customer,
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

    if (
        "email" in update_data
        or "phone_number" in update_data
    ):

        email = update_data.get(
            "email",
            db_customer.email,
        )

        phone = update_data.get(
            "phone_number",
            db_customer.phone_number,
        )

        validate_duplicate_customer(
            db=db,
            company_id=company_id,
            email=email,
            phone=phone,
            customer_id=customer_id,
        )

    if "full_name" in update_data:
        update_data["full_name"] = (
            update_data["full_name"].strip()
        )

    if "email" in update_data:
        update_data["email"] = (
            str(update_data["email"]).strip()
            if update_data["email"]
            else None
        )

    if "phone_number" in update_data:
        update_data["phone_number"] = (
            update_data["phone_number"].strip()
            if update_data["phone_number"]
            else None
        )

    for key, value in update_data.items():

        setattr(
            db_customer,
            key,
            value,
        )

    create_audit_log(
        db=db,
        company_id=company_id,
        user_id=user_id,
        entity_name=(
            f"Customer: "
            f"{db_customer.customer_id}"
        ),
        action="CUSTOMER_UPDATED",
    )

    try:

        db.commit()

        db.refresh(db_customer)

        return db_customer

    except Exception:
        db.rollback()
        raise


# ==========================================================
# SOFT DELETE CUSTOMER
# ==========================================================

def delete_customer(
    db: Session,
    company_id: int,
    user_id: int,
    customer_id: int,
) -> bool:

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

    customer.status = "INACTIVE"

    create_audit_log(
        db=db,
        company_id=company_id,
        user_id=user_id,
        entity_name=(
            f"Customer: "
            f"{customer.customer_id}"
        ),
        action="CUSTOMER_DELETED",
    )

    try:

        db.commit()

        return True

    except Exception:
        db.rollback()
        raise


# ==========================================================
# ACTIVATE CUSTOMER
# ==========================================================

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
        entity_name=(
            f"Customer: "
            f"{customer.customer_id}"
        ),
        action="CUSTOMER_ACTIVATED",
    )

    try:

        db.commit()

        db.refresh(customer)

        return customer

    except Exception:
        db.rollback()
        raise


# ==========================================================
# DEACTIVATE CUSTOMER
# ==========================================================

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
        entity_name=(
            f"Customer: "
            f"{customer.customer_id}"
        ),
        action="CUSTOMER_DEACTIVATED",
    )

    try:

        db.commit()

        db.refresh(customer)

        return customer

    except Exception:
        db.rollback()
        raise


# ==========================================================
# CUSTOMER ANALYTICS
# ==========================================================

def get_customer_analytics(
    db: Session,
    company_id: int,
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

    return {
        "customer_id": customer.id,
        "total_orders": customer.total_orders or 0,
        "total_spent": float(
            customer.lifetime_revenue or 0
        ),
        "lifetime_revenue": float(
            customer.lifetime_revenue or 0
        ),
        "average_order_value": float(
            customer.average_order_value or 0
        ),
        "total_items_purchased": (
            customer.total_quantity_purchased or 0
        ),
        "first_purchase_date": (
            customer.first_purchase_date
        ),
        "last_purchase_date": (
            customer.last_purchase_date
        ),
        "purchase_frequency": float(
            customer.purchase_frequency or 0
        ),
        "customer_segment": (
            customer.customer_segment
        ),
    }


# ==========================================================
# CUSTOMER STATISTICS
# ==========================================================

def get_customer_statistics(
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
        if str(customer.status).upper()
        == "ACTIVE"
    )

    inactive_customers = sum(
        1
        for customer in customers
        if str(customer.status).upper()
        == "INACTIVE"
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

    returning_customers = sum(
        1
        for customer in customers
        if (customer.total_orders or 0) > 1
    )

    total_revenue = sum(
        (
            Decimal(
                str(
                    customer.lifetime_revenue
                    or 0
                )
            )
            for customer in customers
        ),
        Decimal("0.00"),
    )

    vip_revenue = sum(
        (
            Decimal(
                str(
                    customer.lifetime_revenue
                    or 0
                )
            )
            for customer in customers
            if customer.customer_segment == "VIP"
        ),
        Decimal("0.00"),
    )

    average_customer_spend = (
        total_revenue / total_customers
        if total_customers
        else Decimal("0.00")
    )

    vip_average_spend = (
        vip_revenue / vip_customers
        if vip_customers
        else Decimal("0.00")
    )

    total_frequency = sum(
        (
            Decimal(
                str(
                    customer.purchase_frequency
                    or 0
                )
            )
            for customer in customers
        ),
        Decimal("0.00"),
    )

    average_purchase_frequency = (
        total_frequency / total_customers
        if total_customers
        else Decimal("0.00")
    )

    return {
        "total_customers": total_customers,
        "active_customers": active_customers,
        "inactive_customers": inactive_customers,
        "new_customers": new_customers,
        "returning_customers": returning_customers,
        "regular_customers": regular_customers,
        "loyal_customers": loyal_customers,
        "vip_customers": vip_customers,
        "total_revenue": float(total_revenue),
        "vip_revenue": float(vip_revenue),
        "average_customer_spend": float(
            average_customer_spend
        ),
        "vip_average_spend": float(
            vip_average_spend
        ),
        "average_purchase_frequency": float(
            average_purchase_frequency
        ),
    }


# ==========================================================
# CUSTOMER PROFILE
# ==========================================================

def get_customer_profile(
    db: Session,
    company_id: int,
    customer_id: int,
):

    customer = get_customer(
        db=db,
        company_id=company_id,
        customer_id=customer_id,
    )

    if not customer:
        return None

    purchase_summary = customer.purchase_summary

    return {
        "customer": customer,
        "purchase_summary": purchase_summary,
        "recent_transactions": [],
        "favourite_products": [],
        "timeline": [],
        "purchase_trend": [],
        "revenue_distribution": [],
        "order_frequency": [],
        "spending_growth": [],
    }





# ============================================================
# SALE-BASED CUSTOMER ANALYTICS
# ============================================================

def sync_customer_sales_analytics(
    db: Session,
    customer_id: int,
):
    """
    Recalculate customer purchase analytics
    from active sales.

    Handles both timezone-aware and timezone-naive
    datetime values safely.
    """

    from datetime import timezone

    customer = (
        db.query(Customer)
        .filter(
            Customer.id == customer_id
        )
        .first()
    )

    if not customer:
        return None

    # Local import avoids circular import
    from app.models.sale import Sale

    sales = (
        db.query(Sale)
        .filter(
            Sale.customer_id == customer_id,
            Sale.is_deleted == False,
        )
        .all()
    )

    total_orders = len(sales)

    total_spent = Decimal("0.00")

    last_purchase_date = None

    # ========================================================
    # FIND LATEST PURCHASE DATE
    # ========================================================

    for sale in sales:

        total_spent += Decimal(
            str(sale.total_amount or 0)
        )

        if sale.sale_date:

            sale_date = sale.sale_date

            # Convert timezone-aware datetime to UTC
            # and remove timezone information.
            #
            # This makes comparison safe even if the
            # database contains mixed datetime formats.
            if sale_date.tzinfo is not None:
                sale_date = (
                    sale_date
                    .astimezone(timezone.utc)
                    .replace(tzinfo=None)
                )

            if last_purchase_date is not None:

                if last_purchase_date.tzinfo is not None:
                    last_purchase_date = (
                        last_purchase_date
                        .astimezone(timezone.utc)
                        .replace(tzinfo=None)
                    )

            if (
                last_purchase_date is None
                or sale_date > last_purchase_date
            ):
                last_purchase_date = sale_date

    # ========================================================
    # UPDATE CUSTOMER ANALYTICS
    # ========================================================

    if hasattr(customer, "total_orders"):
        customer.total_orders = total_orders

    if hasattr(customer, "lifetime_revenue"):
        customer.lifetime_revenue = total_spent

    if hasattr(customer, "total_spent"):
        customer.total_spent = total_spent

    if hasattr(customer, "total_purchase_amount"):
        customer.total_purchase_amount = total_spent

    if hasattr(customer, "last_purchase_date"):
        customer.last_purchase_date = last_purchase_date

    # ========================================================
    # AVERAGE ORDER VALUE
    # ========================================================

    if hasattr(customer, "average_order_value"):

        if total_orders > 0:

            customer.average_order_value = (
                total_spent
                / Decimal(total_orders)
            )

        else:

            customer.average_order_value = (
                Decimal("0.00")
            )

    # ========================================================
    # UPDATE CUSTOMER SEGMENT
    # ========================================================

    if hasattr(customer, "update_segment"):
        customer.update_segment()

    # ========================================================
    # SAVE CHANGES
    # ========================================================

    db.flush()

    return customer




# ============================================================
# UPDATE CUSTOMER PURCHASE SUMMARY
# ============================================================

def update_customer_purchase_summary(
    db: Session,
    customer_id: int,
):
    """
    Create or update customer purchase summary
    based on active sales.

    Handles both timezone-aware and timezone-naive
    datetime values safely.
    """

    from datetime import timezone

    customer = (
        db.query(Customer)
        .filter(
            Customer.id == customer_id
        )
        .first()
    )

    if not customer:
        return None

    # Local import avoids circular import
    from app.models.sale import Sale

    sales = (
        db.query(Sale)
        .filter(
            Sale.customer_id == customer_id,
            Sale.is_deleted == False,
        )
        .all()
    )

    total_orders = len(sales)

    total_spent = Decimal("0.00")

    last_purchase_date = None

    # ========================================================
    # CALCULATE PURCHASE DATA
    # ========================================================

    for sale in sales:

        total_spent += Decimal(
            str(sale.total_amount or 0)
        )

        if sale.sale_date:

            sale_date = sale.sale_date

            # Convert timezone-aware datetime
            # into UTC and remove timezone.
            if sale_date.tzinfo is not None:
                sale_date = (
                    sale_date
                    .astimezone(timezone.utc)
                    .replace(tzinfo=None)
                )

            # Make existing comparison value naive too.
            if last_purchase_date is not None:

                if last_purchase_date.tzinfo is not None:
                    last_purchase_date = (
                        last_purchase_date
                        .astimezone(timezone.utc)
                        .replace(tzinfo=None)
                    )

            if (
                last_purchase_date is None
                or sale_date > last_purchase_date
            ):
                last_purchase_date = sale_date

    # ========================================================
    # GET OR CREATE SUMMARY
    # ========================================================

    summary = (
        db.query(CustomerPurchaseSummary)
        .filter(
            CustomerPurchaseSummary.customer_id
            == customer_id
        )
        .first()
    )

    if not summary:

        summary = CustomerPurchaseSummary(
            customer_id=customer_id
        )

        db.add(summary)

    # ========================================================
    # UPDATE SUMMARY FIELDS
    # ========================================================

    if hasattr(summary, "total_orders"):
        summary.total_orders = total_orders

    if hasattr(summary, "total_revenue"):
        summary.total_revenue = total_spent

    if hasattr(summary, "total_spent"):
        summary.total_spent = total_spent

    if hasattr(summary, "total_purchase_amount"):
        summary.total_purchase_amount = total_spent

    if hasattr(summary, "last_purchase_date"):
        summary.last_purchase_date = last_purchase_date

    # ========================================================
    # AVERAGE ORDER VALUE
    # ========================================================

    if hasattr(summary, "average_order_value"):

        if total_orders > 0:

            summary.average_order_value = (
                total_spent
                / Decimal(total_orders)
            )

        else:

            summary.average_order_value = (
                Decimal("0.00")
            )

    # ========================================================
    # SAVE
    # ========================================================

    db.flush()

    return summary



# ============================================================
# CREATE VIP NOTIFICATION
# ============================================================

def create_vip_notification(
    db: Session,
    customer,
):
    """
    Create a notification when a customer becomes VIP.

    Notification failure should not break the sale
    transaction.
    """

    if not customer:
        return None

    customer_id = getattr(
        customer,
        "id",
        None,
    )

    if not customer_id:
        return None

    segment = getattr(
        customer,
        "customer_segment",
        None,
    )

    if not segment:
        segment = getattr(
            customer,
            "segment",
            None,
        )

    if segment != "VIP":
        return None

    message = (
        f"Customer "
        f"{getattr(customer, 'full_name', 'Customer')} "
        f"is now a VIP customer."
    )

    try:

        notification = Notification()

        if hasattr(
            notification,
            "user_id",
        ):
            notification.user_id = getattr(
                customer,
                "user_id",
                None,
            )

        if hasattr(
            notification,
            "customer_id",
        ):
            notification.customer_id = customer_id

        if hasattr(
            notification,
            "type",
        ):
            notification.type = "VIP_CUSTOMER"

        if hasattr(
            notification,
            "message",
        ):
            notification.message = message

        if hasattr(
            notification,
            "is_read",
        ):
            notification.is_read = False

        if hasattr(
            notification,
            "created_at",
        ):
            notification.created_at = datetime.utcnow()

        db.add(notification)

        db.flush()

        return notification

    except Exception:
        # Do not rollback the complete sale transaction here.
        # The caller controls the transaction.
        return None
