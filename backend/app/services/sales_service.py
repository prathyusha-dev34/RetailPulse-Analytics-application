from datetime import datetime
from decimal import Decimal, ROUND_HALF_UP

from sqlalchemy import func, or_
from sqlalchemy.orm import Session, joinedload

from app.models.sale import Sale
from app.models.sale_item import SaleItem
from app.models.product import Product
from app.models.customer import Customer

from app.schemas.sale import SaleCreate, SaleUpdate

from app.services.audit_service import create_audit_log

from app.services.customer_service import (
    sync_customer_sales_analytics,
    update_customer_purchase_summary,
)

from app.services.notification_service import (
    create_vip_notification,
)


# ============================================================
# HELPER FUNCTIONS
# ============================================================

def to_decimal(value):
    """
    Safely convert a value to Decimal.
    """

    if value is None:
        return Decimal("0.00")

    if isinstance(value, Decimal):
        return value

    return Decimal(str(value))


def money(value):
    """
    Convert value to 2-decimal monetary value.
    """

    return to_decimal(value).quantize(
        Decimal("0.01"),
        rounding=ROUND_HALF_UP,
    )


def calculate_subtotal(unit_price, quantity):
    """
    Calculate subtotal before discount and tax.
    """

    unit_price = to_decimal(unit_price)
    quantity = int(quantity or 0)

    if quantity <= 0:
        raise ValueError(
            "Quantity must be greater than zero"
        )

    if unit_price < Decimal("0.00"):
        raise ValueError(
            "Unit price cannot be negative"
        )

    return money(
        unit_price * Decimal(quantity)
    )


def calculate_line_total(
    unit_price,
    quantity,
    discount=Decimal("0.00"),
    tax=Decimal("0.00"),
):
    """
    Calculate final line total.

    Formula:

        subtotal - discount + tax
    """

    unit_price = to_decimal(unit_price)
    discount = to_decimal(discount)
    tax = to_decimal(tax)
    quantity = int(quantity or 0)

    if quantity <= 0:
        raise ValueError(
            "Quantity must be greater than zero"
        )

    if unit_price < Decimal("0.00"):
        raise ValueError(
            "Unit price cannot be negative"
        )

    if discount < Decimal("0.00"):
        raise ValueError(
            "Discount cannot be negative"
        )

    if tax < Decimal("0.00"):
        raise ValueError(
            "Tax cannot be negative"
        )

    subtotal = (
        unit_price * Decimal(quantity)
    )

    total = (
        subtotal
        - discount
        + tax
    )

    if total < Decimal("0.00"):
        total = Decimal("0.00")

    return money(total)


def validate_stock(product, quantity):
    """
    Validate requested quantity against
    currently available stock.
    """

    quantity = int(quantity or 0)

    if quantity <= 0:
        raise ValueError(
            "Quantity must be greater than zero"
        )

    available_stock = int(
        product.stock_quantity or 0
    )

    if available_stock < quantity:
        raise ValueError(
            f"Insufficient stock for product "
            f"'{product.name}'. "
            f"Available: {available_stock}, "
            f"Requested: {quantity}"
        )

    return True


def update_stock_status(product):
    """
    Update stock status if Product model
    contains stock_status.
    """

    if not hasattr(product, "stock_status"):
        return product

    quantity = int(
        product.stock_quantity or 0
    )

    if quantity <= 0:
        product.stock_status = "OUT_OF_STOCK"

    elif quantity <= 5:
        product.stock_status = "LOW_STOCK"

    else:
        product.stock_status = "IN_STOCK"

    return product


def get_number_of_items(sale):
    """
    Number of sale line items.

    Example:

        Product A x 5
        Product B x 2

        Number of Items = 2
    """

    return len(sale.items or [])


def get_total_quantity(sale):
    """
    Total physical units sold.

    Example:

        Product A x 5
        Product B x 2

        Total Quantity = 7
    """

    return sum(
        int(item.quantity or 0)
        for item in (sale.items or [])
    )


# ============================================================
# INVOICE EXISTS
# ============================================================

def invoice_exists(
    db: Session,
    company_id: int,
    invoice_number: str,
):
    return (
        db.query(Sale)
        .filter(
            Sale.company_id == company_id,
            Sale.invoice_number == invoice_number,
        )
        .first()
        is not None
    )


# ============================================================
# GENERATE INVOICE NUMBER
# ============================================================

def generate_invoice_number(
    db: Session,
    company_id: int,
):
    """
    Generate company-specific invoice number.

    Example:
        INV-000001
        INV-000002
    """

    last_sale = (
        db.query(Sale)
        .filter(
            Sale.company_id == company_id
        )
        .order_by(
            Sale.id.desc()
        )
        .first()
    )

    next_number = (
        last_sale.id + 1
        if last_sale
        else 1
    )

    invoice_number = (
        f"INV-{next_number:06d}"
    )

    while invoice_exists(
        db=db,
        company_id=company_id,
        invoice_number=invoice_number,
    ):
        next_number += 1

        invoice_number = (
            f"INV-{next_number:06d}"
        )

    return invoice_number


# ============================================================
# CREATE SALE
# ============================================================

def create_sale(
    db: Session,
    sale_data: SaleCreate,
    company_id: int,
    user_id: int,
):
    try:

        # ----------------------------------------------------
        # 1. VALIDATE CUSTOMER
        # ----------------------------------------------------

        customer = (
            db.query(Customer)
            .filter(
                Customer.id == sale_data.customer_id,
                Customer.company_id == company_id,
                Customer.status == "ACTIVE",
            )
            .first()
        )

        if not customer:
            raise ValueError(
                "Customer not found or inactive"
            )

        # ----------------------------------------------------
        # 2. GENERATE / VALIDATE INVOICE
        # ----------------------------------------------------

        invoice_number = getattr(
            sale_data,
            "invoice_number",
            None,
        )

        if not invoice_number:
            invoice_number = generate_invoice_number(
                db=db,
                company_id=company_id,
            )

        if invoice_exists(
            db=db,
            company_id=company_id,
            invoice_number=invoice_number,
        ):
            raise ValueError(
                f"Invoice number "
                f"'{invoice_number}' already exists"
            )

        # ----------------------------------------------------
        # 3. VALIDATE ITEMS
        # ----------------------------------------------------

        if not sale_data.items:
            raise ValueError(
                "Sale must contain at least one product"
            )

        # ----------------------------------------------------
        # 4. CREATE SALE HEADER
        # ----------------------------------------------------

        sale = Sale(
            company_id=company_id,
            customer_id=customer.id,
            customer_name=customer.full_name,
            invoice_number=invoice_number,
            sale_date=(
                sale_data.sale_date
                if sale_data.sale_date
                else datetime.now()
            ),
            sales_channel=(
                sale_data.sales_channel
                if sale_data.sales_channel
                else "STORE"
            ),
            payment_method=sale_data.payment_method,
            payment_status=(
                getattr(
                    sale_data,
                    "payment_status",
                    None,
                )
                or "PAID"
            ),
            total_amount=Decimal("0.00"),
            created_by=user_id,
            is_deleted=False,
        )

        db.add(sale)
        db.flush()

        # ----------------------------------------------------
        # 5. CREATE SALE ITEMS
        # ----------------------------------------------------

        total_amount = Decimal("0.00")

        for item in sale_data.items:

            # ------------------------------------------------
            # PRODUCT
            # ------------------------------------------------

            product = (
                db.query(Product)
                .filter(
                    Product.id == item.product_id,
                    Product.company_id == company_id,
                )
                .first()
            )

            if not product:
                raise ValueError(
                    f"Product {item.product_id} not found"
                )

            # ------------------------------------------------
            # STOCK
            # ------------------------------------------------

            quantity = int(
                item.quantity or 0
            )

            validate_stock(
                product=product,
                quantity=quantity,
            )

            # ------------------------------------------------
            # PRICE
            # ------------------------------------------------

            unit_price = to_decimal(
                item.unit_price
            )

            discount = to_decimal(
                item.discount
            )

            tax = to_decimal(
                item.tax
            )

            if unit_price < Decimal("0.00"):
                raise ValueError(
                    "Unit price cannot be negative"
                )

            if discount < Decimal("0.00"):
                raise ValueError(
                    "Discount cannot be negative"
                )

            if tax < Decimal("0.00"):
                raise ValueError(
                    "Tax cannot be negative"
                )

            # ------------------------------------------------
            # TOTAL
            # ------------------------------------------------

            line_total = calculate_line_total(
                unit_price=unit_price,
                quantity=quantity,
                discount=discount,
                tax=tax,
            )

            # ------------------------------------------------
            # CATEGORY
            # ------------------------------------------------

            category_id = getattr(
                product,
                "category_id",
                None,
            )

            # ------------------------------------------------
            # SALE ITEM
            # ------------------------------------------------

            sale_item = SaleItem(
                sale_id=sale.id,
                product_id=product.id,
                quantity=quantity,
                unit_price=money(unit_price),
                discount=money(discount),
                tax=money(tax),
                total=line_total,
                category_id=category_id,
            )

            db.add(sale_item)

            # ------------------------------------------------
            # REDUCE STOCK
            # ------------------------------------------------

            product.stock_quantity = (
                int(product.stock_quantity or 0)
                - quantity
            )

            update_stock_status(product)

            total_amount += line_total

        # ----------------------------------------------------
        # 6. UPDATE SALE TOTAL
        # ----------------------------------------------------

        sale.total_amount = money(
            total_amount
        )

        db.flush()

        # ----------------------------------------------------
        # 7. CUSTOMER ANALYTICS
        # ----------------------------------------------------

        updated_customer = (
            sync_customer_sales_analytics(
                db=db,
                customer_id=customer.id,
            )
        )

        update_customer_purchase_summary(
            db=db,
            customer_id=customer.id,
        )

        # ----------------------------------------------------
        # 8. VIP NOTIFICATION
        # ----------------------------------------------------

        if updated_customer:
            create_vip_notification(
                db=db,
                customer=updated_customer,
            )

        # ----------------------------------------------------
        # 9. AUDIT LOG
        # ----------------------------------------------------

        create_audit_log(
            db=db,
            company_id=company_id,
            user_id=user_id,
            action=(
                f"Sale Created - "
                f"{sale.invoice_number}"
            ),
            entity_name="Sale",
        )

        # ----------------------------------------------------
        # 10. COMMIT
        # ----------------------------------------------------

        db.commit()
        db.refresh(sale)

        return sale

    except Exception:
        db.rollback()
        raise


# ============================================================
# GET ALL SALES
# ============================================================

def get_sales(
    db: Session,
    company_id: int,
    search: str | None = None,
    payment_method: str | None = None,
    payment_status: str | None = None,
    start_date: str | None = None,
    end_date: str | None = None,
    sort_by: str = "date",
    sort_order: str = "desc",
    skip: int = 0,
    limit: int = 100,
):

    query = (
        db.query(Sale)
        .options(
            joinedload(Sale.customer),
            joinedload(Sale.items)
            .joinedload(SaleItem.product),
        )
        .filter(
            Sale.company_id == company_id,
            Sale.is_deleted == False,
        )
    )

    # --------------------------------------------------------
    # SEARCH
    # --------------------------------------------------------

    if search:
        search_value = f"%{search}%"

        query = query.filter(
            or_(
                Sale.invoice_number.ilike(
                    search_value
                ),
                Sale.customer_name.ilike(
                    search_value
                ),
            )
        )

    # --------------------------------------------------------
    # PAYMENT METHOD
    # --------------------------------------------------------

    if payment_method:
        query = query.filter(
            Sale.payment_method == payment_method
        )

    # --------------------------------------------------------
    # PAYMENT STATUS
    # --------------------------------------------------------

    if payment_status:
        query = query.filter(
            Sale.payment_status == payment_status
        )

    # --------------------------------------------------------
    # START DATE
    # --------------------------------------------------------

    if start_date:
        try:
            start_datetime = datetime.fromisoformat(
                start_date
            )

            query = query.filter(
                Sale.sale_date >= start_datetime
            )

        except ValueError:
            raise ValueError(
                "Invalid start_date format. "
                "Use YYYY-MM-DD"
            )

    # --------------------------------------------------------
    # END DATE
    # --------------------------------------------------------

    if end_date:
        try:
            end_datetime = datetime.fromisoformat(
                end_date
            )

            if len(end_date) == 10:
                end_datetime = end_datetime.replace(
                    hour=23,
                    minute=59,
                    second=59,
                    microsecond=999999,
                )

            query = query.filter(
                Sale.sale_date <= end_datetime
            )

        except ValueError:
            raise ValueError(
                "Invalid end_date format. "
                "Use YYYY-MM-DD"
            )

    # --------------------------------------------------------
    # SORT
    # --------------------------------------------------------

    sort_columns = {
        "date": Sale.sale_date,
        "sale_date": Sale.sale_date,
        "amount": Sale.total_amount,
        "total_amount": Sale.total_amount,
        "id": Sale.id,
        "invoice": Sale.invoice_number,
        "invoice_number": Sale.invoice_number,
        "customer": Sale.customer_name,
        "customer_name": Sale.customer_name,
    }

    sort_column = sort_columns.get(
        sort_by,
        Sale.sale_date,
    )

    if sort_order.lower() == "asc":
        query = query.order_by(
            sort_column.asc()
        )
    else:
        query = query.order_by(
            sort_column.desc()
        )

    return (
        query
        .offset(skip)
        .limit(limit)
        .all()
    )


# ============================================================
# SEARCH SALES
# ============================================================

def search_sales(
    db: Session,
    company_id: int,
    keyword: str,
    skip: int = 0,
    limit: int = 100,
):

    search_value = f"%{keyword}%"

    return (
        db.query(Sale)
        .options(
            joinedload(Sale.customer),
            joinedload(Sale.items)
            .joinedload(SaleItem.product),
        )
        .filter(
            Sale.company_id == company_id,
            Sale.is_deleted == False,
            or_(
                Sale.invoice_number.ilike(
                    search_value
                ),
                Sale.customer_name.ilike(
                    search_value
                ),
            ),
        )
        .order_by(
            Sale.sale_date.desc()
        )
        .offset(skip)
        .limit(limit)
        .all()
    )


# ============================================================
# FILTER SALES
# ============================================================

def filter_sales(
    db: Session,
    company_id: int,
    payment_method: str | None = None,
    payment_status: str | None = None,
    start_date: str | None = None,
    end_date: str | None = None,
    skip: int = 0,
    limit: int = 100,
):

    query = (
        db.query(Sale)
        .options(
            joinedload(Sale.customer),
            joinedload(Sale.items)
            .joinedload(SaleItem.product),
        )
        .filter(
            Sale.company_id == company_id,
            Sale.is_deleted == False,
        )
    )

    if payment_method:
        query = query.filter(
            Sale.payment_method == payment_method
        )

    if payment_status:
        query = query.filter(
            Sale.payment_status == payment_status
        )

    if start_date:
        try:
            start_datetime = datetime.fromisoformat(
                start_date
            )

            query = query.filter(
                Sale.sale_date >= start_datetime
            )

        except ValueError:
            raise ValueError(
                "Invalid start_date format. "
                "Use YYYY-MM-DD"
            )

    if end_date:
        try:
            end_datetime = datetime.fromisoformat(
                end_date
            )

            if len(end_date) == 10:
                end_datetime = end_datetime.replace(
                    hour=23,
                    minute=59,
                    second=59,
                    microsecond=999999,
                )

            query = query.filter(
                Sale.sale_date <= end_datetime
            )

        except ValueError:
            raise ValueError(
                "Invalid end_date format. "
                "Use YYYY-MM-DD"
            )

    return (
        query
        .order_by(
            Sale.sale_date.desc()
        )
        .offset(skip)
        .limit(limit)
        .all()
    )


# ============================================================
# SORT SALES
# ============================================================

def sort_sales(
    db: Session,
    company_id: int,
    sort_by: str = "date",
    order: str = "desc",
    skip: int = 0,
    limit: int = 100,
):

    sort_columns = {
        "date": Sale.sale_date,
        "sale_date": Sale.sale_date,
        "amount": Sale.total_amount,
        "total_amount": Sale.total_amount,
        "id": Sale.id,
        "invoice": Sale.invoice_number,
        "invoice_number": Sale.invoice_number,
        "customer": Sale.customer_name,
        "customer_name": Sale.customer_name,
    }

    sort_column = sort_columns.get(
        sort_by,
        Sale.sale_date,
    )

    query = (
        db.query(Sale)
        .options(
            joinedload(Sale.customer),
            joinedload(Sale.items)
            .joinedload(SaleItem.product),
        )
        .filter(
            Sale.company_id == company_id,
            Sale.is_deleted == False,
        )
    )

    if order.lower() == "asc":
        query = query.order_by(
            sort_column.asc()
        )
    else:
        query = query.order_by(
            sort_column.desc()
        )

    return (
        query
        .offset(skip)
        .limit(limit)
        .all()
    )


# ============================================================
# DASHBOARD SUMMARY
# ============================================================

def get_dashboard_summary(
    db: Session,
    company_id: int,
):

    base_filter = [
        Sale.company_id == company_id,
        Sale.is_deleted == False,
    ]

    # --------------------------------------------------------
    # TOTAL SALES
    # --------------------------------------------------------

    total_sales = (
        db.query(
            func.count(Sale.id)
        )
        .filter(*base_filter)
        .scalar()
        or 0
    )

    # --------------------------------------------------------
    # TOTAL REVENUE
    # --------------------------------------------------------

    total_revenue = (
        db.query(
            func.coalesce(
                func.sum(
                    Sale.total_amount
                ),
                0,
            )
        )
        .filter(*base_filter)
        .scalar()
        or Decimal("0.00")
    )

    # --------------------------------------------------------
    # TOTAL ITEMS SOLD
    #
    # IMPORTANT:
    # SUM(SaleItem.quantity)
    #
    # Example:
    # Sale 1 -> Product A quantity 5
    # Sale 2 -> Product B quantity 3
    #
    # Total Items Sold = 8
    #
    # NOT number of sale records.
    # --------------------------------------------------------

    total_items_sold = (
        db.query(
            func.coalesce(
                func.sum(
                    SaleItem.quantity
                ),
                0,
            )
        )
        .join(
            Sale,
            Sale.id == SaleItem.sale_id,
        )
        .filter(
            Sale.company_id == company_id,
            Sale.is_deleted == False,
        )
        .scalar()
        or 0
    )

    # --------------------------------------------------------
    # TOTAL ORDERS
    # --------------------------------------------------------

    total_orders = total_sales

    # --------------------------------------------------------
    # AVERAGE ORDER VALUE
    # --------------------------------------------------------

    average_order_value = (
        to_decimal(total_revenue)
        / Decimal(total_orders)
        if total_orders
        else Decimal("0.00")
    )

    return {
        "total_sales": int(total_sales),

        "total_revenue": money(
            total_revenue
        ),

        "total_orders": int(total_orders),

        "total_items_sold": int(
            total_items_sold
        ),

        "average_order_value": money(
            average_order_value
        ),
    }


# ============================================================
# TOP CUSTOMERS
# ============================================================

def get_top_customers(
    db: Session,
    company_id: int,
    limit: int = 10,
):

    return (
        db.query(
            Customer.id,
            Customer.full_name,
            func.count(
                Sale.id
            ).label("orders"),
            func.sum(
                Sale.total_amount
            ).label("total_spent"),
        )
        .join(
            Sale,
            Sale.customer_id == Customer.id,
        )
        .filter(
            Sale.company_id == company_id,
            Sale.is_deleted == False,
            Customer.company_id == company_id,
        )
        .group_by(
            Customer.id,
            Customer.full_name,
        )
        .order_by(
            func.sum(
                Sale.total_amount
            ).desc()
        )
        .limit(limit)
        .all()
    )


# ============================================================
# LOW STOCK PRODUCTS
# ============================================================

def get_low_stock_products(
    db: Session,
    company_id: int,
    threshold: int = 5,
):

    return (
        db.query(Product)
        .filter(
            Product.company_id == company_id,
            Product.stock_quantity <= threshold,
            Product.stock_quantity > 0,
        )
        .order_by(
            Product.stock_quantity.asc()
        )
        .all()
    )


# ============================================================
# OUT OF STOCK PRODUCTS
# ============================================================

def get_out_of_stock_products(
    db: Session,
    company_id: int,
):

    return (
        db.query(Product)
        .filter(
            Product.company_id == company_id,
            Product.stock_quantity <= 0,
        )
        .order_by(
            Product.name.asc()
        )
        .all()
    )


# ============================================================
# REMAINING STOCK
# ============================================================

def get_remaining_stock(
    db: Session,
    product_id: int,
    company_id: int,
):

    product = (
        db.query(Product)
        .filter(
            Product.id == product_id,
            Product.company_id == company_id,
        )
        .first()
    )

    if not product:
        raise ValueError(
            "Product not found"
        )

    return {
        "product_id": product.id,

        "product_name": product.name,

        "sku": getattr(
            product,
            "sku",
            None,
        ),

        "remaining_stock": int(
            product.stock_quantity or 0
        ),
    }


# ============================================================
# GET SALE BY ID
# ============================================================

def get_sale_by_id(
    db: Session,
    sale_id: int,
    company_id: int,
):

    sale = (
        db.query(Sale)
        .options(
            joinedload(Sale.customer),
            joinedload(Sale.items)
            .joinedload(SaleItem.product),
        )
        .filter(
            Sale.id == sale_id,
            Sale.company_id == company_id,
            Sale.is_deleted == False,
        )
        .first()
    )

    if not sale:
        raise ValueError(
            "Sale not found"
        )

    return sale


# ============================================================
# GET SALE
# ============================================================

def get_sale(
    db: Session,
    sale_id: int,
    company_id: int,
):

    return get_sale_by_id(
        db=db,
        sale_id=sale_id,
        company_id=company_id,
    )


# ============================================================
# UPDATE SALE
# ============================================================

def update_sale(
    db: Session,
    sale_id: int,
    sale_data: SaleUpdate,
    company_id: int,
    user_id: int,
):

    try:

        # ----------------------------------------------------
        # GET SALE
        # ----------------------------------------------------

        sale = (
            db.query(Sale)
            .options(
                joinedload(Sale.items)
            )
            .filter(
                Sale.id == sale_id,
                Sale.company_id == company_id,
                Sale.is_deleted == False,
            )
            .first()
        )

        if not sale:
            raise ValueError(
                "Sale not found"
            )

        old_customer_id = sale.customer_id

        # ----------------------------------------------------
        # CUSTOMER
        # ----------------------------------------------------

        if sale_data.customer_id is not None:

            customer = (
                db.query(Customer)
                .filter(
                    Customer.id == sale_data.customer_id,
                    Customer.company_id == company_id,
                    Customer.status == "ACTIVE",
                )
                .first()
            )

            if not customer:
                raise ValueError(
                    "Customer not found or inactive"
                )

            sale.customer_id = customer.id
            sale.customer_name = customer.full_name

        # ----------------------------------------------------
        # DATE
        # ----------------------------------------------------

        if sale_data.sale_date is not None:
            sale.sale_date = sale_data.sale_date

        # ----------------------------------------------------
        # SALES CHANNEL
        # ----------------------------------------------------

        if sale_data.sales_channel is not None:
            sale.sales_channel = (
                sale_data.sales_channel
            )

        # ----------------------------------------------------
        # PAYMENT METHOD
        # ----------------------------------------------------

        if sale_data.payment_method is not None:
            sale.payment_method = (
                sale_data.payment_method
            )

        # ----------------------------------------------------
        # PAYMENT STATUS
        # ----------------------------------------------------

        payment_status = getattr(
            sale_data,
            "payment_status",
            None,
        )

        if payment_status is not None:
            sale.payment_status = payment_status

        # ====================================================
        # HEADER ONLY UPDATE
        # ====================================================

        if sale_data.items is None:

            db.flush()

            if old_customer_id:

                sync_customer_sales_analytics(
                    db=db,
                    customer_id=old_customer_id,
                )

                update_customer_purchase_summary(
                    db=db,
                    customer_id=old_customer_id,
                )

            if sale.customer_id:

                sync_customer_sales_analytics(
                    db=db,
                    customer_id=sale.customer_id,
                )

                update_customer_purchase_summary(
                    db=db,
                    customer_id=sale.customer_id,
                )

            db.commit()
            db.refresh(sale)

            return sale

        # ====================================================
        # ITEMS UPDATE
        # ====================================================

        old_items = list(sale.items)

        # ----------------------------------------------------
        # RESTORE OLD STOCK
        # ----------------------------------------------------

        for old_item in old_items:

            product = (
                db.query(Product)
                .filter(
                    Product.id == old_item.product_id,
                    Product.company_id == company_id,
                )
                .first()
            )

            if not product:
                raise ValueError(
                    f"Product {old_item.product_id} "
                    f"not found while restoring stock"
                )

            product.stock_quantity = (
                int(product.stock_quantity or 0)
                + int(old_item.quantity or 0)
            )

            update_stock_status(product)

        # ----------------------------------------------------
        # DELETE OLD ITEMS
        # ----------------------------------------------------

        for old_item in old_items:
            db.delete(old_item)

        db.flush()

        # ----------------------------------------------------
        # CREATE NEW ITEMS
        # ----------------------------------------------------

        total_amount = Decimal("0.00")

        for item in sale_data.items:

            product = (
                db.query(Product)
                .filter(
                    Product.id == item.product_id,
                    Product.company_id == company_id,
                )
                .first()
            )

            if not product:
                raise ValueError(
                    f"Product {item.product_id} not found"
                )

            quantity = int(
                item.quantity or 0
            )

            validate_stock(
                product=product,
                quantity=quantity,
            )

            unit_price = to_decimal(
                item.unit_price
            )

            discount = to_decimal(
                item.discount
            )

            tax = to_decimal(
                item.tax
            )

            if unit_price < Decimal("0.00"):
                raise ValueError(
                    "Unit price cannot be negative"
                )

            if discount < Decimal("0.00"):
                raise ValueError(
                    "Discount cannot be negative"
                )

            if tax < Decimal("0.00"):
                raise ValueError(
                    "Tax cannot be negative"
                )

            line_total = calculate_line_total(
                unit_price=unit_price,
                quantity=quantity,
                discount=discount,
                tax=tax,
            )

            category_id = getattr(
                product,
                "category_id",
                None,
            )

            sale_item = SaleItem(
                sale_id=sale.id,
                product_id=product.id,
                quantity=quantity,
                unit_price=money(unit_price),
                discount=money(discount),
                tax=money(tax),
                total=line_total,
                category_id=category_id,
            )

            db.add(sale_item)

            # ------------------------------------------------
            # REDUCE STOCK
            # ------------------------------------------------

            product.stock_quantity = (
                int(product.stock_quantity or 0)
                - quantity
            )

            update_stock_status(product)

            total_amount += line_total

        # ----------------------------------------------------
        # UPDATE TOTAL
        # ----------------------------------------------------

        sale.total_amount = money(
            total_amount
        )

        db.flush()

        # ----------------------------------------------------
        # CUSTOMER ANALYTICS
        # ----------------------------------------------------

        if old_customer_id:

            sync_customer_sales_analytics(
                db=db,
                customer_id=old_customer_id,
            )

            update_customer_purchase_summary(
                db=db,
                customer_id=old_customer_id,
            )

        if sale.customer_id:

            sync_customer_sales_analytics(
                db=db,
                customer_id=sale.customer_id,
            )

            update_customer_purchase_summary(
                db=db,
                customer_id=sale.customer_id,
            )

        # ----------------------------------------------------
        # AUDIT
        # ----------------------------------------------------

        try:

            create_audit_log(
                db=db,
                company_id=company_id,
                user_id=user_id,
                action=(
                    f"Sale Updated - "
                    f"{sale.invoice_number}"
                ),
                entity_name="Sale",
            )

        except Exception:
            pass

        # ----------------------------------------------------
        # COMMIT
        # ----------------------------------------------------

        db.commit()
        db.refresh(sale)

        return sale

    except Exception:
        db.rollback()
        raise


# ============================================================
# DELETE / CANCEL SALE
# SOFT DELETE
# ============================================================

def delete_sale(
    db: Session,
    sale_id: int,
    company_id: int,
    user_id: int,
):

    try:

        sale = (
            db.query(Sale)
            .options(
                joinedload(Sale.items)
            )
            .filter(
                Sale.id == sale_id,
                Sale.company_id == company_id,
                Sale.is_deleted == False,
            )
            .first()
        )

        if not sale:
            raise ValueError(
                "Sale not found or already deleted"
            )

        customer_id = sale.customer_id
        invoice_number = sale.invoice_number

        # ----------------------------------------------------
        # RESTORE STOCK
        # ----------------------------------------------------

        for item in sale.items:

            product = (
                db.query(Product)
                .filter(
                    Product.id == item.product_id,
                    Product.company_id == company_id,
                )
                .first()
            )

            if not product:
                raise ValueError(
                    f"Product {item.product_id} "
                    f"not found while restoring stock"
                )

            product.stock_quantity = (
                int(product.stock_quantity or 0)
                + int(item.quantity or 0)
            )

            update_stock_status(product)

        # ----------------------------------------------------
        # SOFT DELETE
        # ----------------------------------------------------

        sale.is_deleted = True

        db.flush()

        # ----------------------------------------------------
        # CUSTOMER ANALYTICS
        # ----------------------------------------------------

        if customer_id:

            sync_customer_sales_analytics(
                db=db,
                customer_id=customer_id,
            )

            update_customer_purchase_summary(
                db=db,
                customer_id=customer_id,
            )

        # ----------------------------------------------------
        # AUDIT
        # ----------------------------------------------------

        try:

            create_audit_log(
                db=db,
                company_id=company_id,
                user_id=user_id,
                action=(
                    f"Sale Deleted - "
                    f"{invoice_number}"
                ),
                entity_name="Sale",
            )

        except Exception:
            pass

        # ----------------------------------------------------
        # COMMIT
        # ----------------------------------------------------

        db.commit()

        return {
            "success": True,
            "message": "Sale deleted successfully",
            "sale_id": sale.id,
            "invoice_number": invoice_number,
            "customer_id": customer_id,
        }

    except Exception:
        db.rollback()
        raise


# ============================================================
# CANCEL SALE
# ============================================================

def cancel_sale(
    db: Session,
    sale_id: int,
    company_id: int,
    user_id: int,
):

    return delete_sale(
        db=db,
        sale_id=sale_id,
        company_id=company_id,
        user_id=user_id,
    )


# ============================================================
# RESTORE SALE
# ============================================================

def restore_sale(
    db: Session,
    sale_id: int,
    company_id: int,
    user_id: int,
):

    try:

        sale = (
            db.query(Sale)
            .options(
                joinedload(Sale.items)
            )
            .filter(
                Sale.id == sale_id,
                Sale.company_id == company_id,
                Sale.is_deleted == True,
            )
            .first()
        )

        if not sale:
            raise ValueError(
                "Deleted sale not found"
            )

        customer_id = sale.customer_id

        # ----------------------------------------------------
        # VALIDATE STOCK FIRST
        # ----------------------------------------------------

        products = []

        for item in sale.items:

            product = (
                db.query(Product)
                .filter(
                    Product.id == item.product_id,
                    Product.company_id == company_id,
                )
                .first()
            )

            if not product:
                raise ValueError(
                    f"Product {item.product_id} not found"
                )

            validate_stock(
                product=product,
                quantity=item.quantity,
            )

            products.append(
                (
                    product,
                    int(item.quantity or 0),
                )
            )

        # ----------------------------------------------------
        # REDUCE STOCK
        # ----------------------------------------------------

        for product, quantity in products:

            product.stock_quantity = (
                int(product.stock_quantity or 0)
                - quantity
            )

            update_stock_status(product)

        # ----------------------------------------------------
        # RESTORE SALE
        # ----------------------------------------------------

        sale.is_deleted = False

        db.flush()

        # ----------------------------------------------------
        # CUSTOMER ANALYTICS
        # ----------------------------------------------------

        if customer_id:

            sync_customer_sales_analytics(
                db=db,
                customer_id=customer_id,
            )

            update_customer_purchase_summary(
                db=db,
                customer_id=customer_id,
            )

        # ----------------------------------------------------
        # AUDIT
        # ----------------------------------------------------

        try:

            create_audit_log(
                db=db,
                company_id=company_id,
                user_id=user_id,
                action=(
                    f"Sale Restored - "
                    f"{sale.invoice_number}"
                ),
                entity_name="Sale",
            )

        except Exception:
            pass

        # ----------------------------------------------------
        # COMMIT
        # ----------------------------------------------------

        db.commit()
        db.refresh(sale)

        return sale

    except Exception:
        db.rollback()
        raise


# ============================================================
# ACTIVE SALES
# ============================================================

def get_active_sales(
    db: Session,
    company_id: int,
):

    return (
        db.query(Sale)
        .options(
            joinedload(Sale.customer),
            joinedload(Sale.items)
            .joinedload(SaleItem.product),
        )
        .filter(
            Sale.company_id == company_id,
            Sale.is_deleted == False,
        )
        .order_by(
            Sale.sale_date.desc()
        )
        .all()
    )


# ============================================================
# DELETED SALES
# ============================================================

def get_deleted_sales(
    db: Session,
    company_id: int,
):

    return (
        db.query(Sale)
        .options(
            joinedload(Sale.customer),
            joinedload(Sale.items)
            .joinedload(SaleItem.product),
        )
        .filter(
            Sale.company_id == company_id,
            Sale.is_deleted == True,
        )
        .order_by(
            Sale.sale_date.desc()
        )
        .all()
    )


# ============================================================
# CUSTOMER SALES
# ============================================================

def get_customer_sales(
    db: Session,
    customer_id: int,
    company_id: int,
):

    return (
        db.query(Sale)
        .options(
            joinedload(Sale.customer),
            joinedload(Sale.items)
            .joinedload(SaleItem.product),
        )
        .filter(
            Sale.customer_id == customer_id,
            Sale.company_id == company_id,
            Sale.is_deleted == False,
        )
        .order_by(
            Sale.sale_date.desc()
        )
        .all()
    )


# ============================================================
# RECENT CUSTOMER SALES
# ============================================================

def get_recent_customer_sales(
    db: Session,
    customer_id: int,
    company_id: int,
    limit: int = 10,
):

    return (
        db.query(Sale)
        .options(
            joinedload(Sale.customer),
            joinedload(Sale.items)
            .joinedload(SaleItem.product),
        )
        .filter(
            Sale.customer_id == customer_id,
            Sale.company_id == company_id,
            Sale.is_deleted == False,
        )
        .order_by(
            Sale.sale_date.desc()
        )
        .limit(limit)
        .all()
    )


# ============================================================
# CUSTOMER PURCHASE TOTAL
# ============================================================

def get_customer_purchase_total(
    db: Session,
    customer_id: int,
    company_id: int,
):

    total = (
        db.query(
            func.coalesce(
                func.sum(
                    Sale.total_amount
                ),
                0,
            )
        )
        .filter(
            Sale.customer_id == customer_id,
            Sale.company_id == company_id,
            Sale.is_deleted == False,
        )
        .scalar()
    )

    return money(total)


# ============================================================
# CUSTOMER ORDER COUNT
# ============================================================

def get_customer_order_count(
    db: Session,
    customer_id: int,
    company_id: int,
):

    return (
        db.query(
            func.count(Sale.id)
        )
        .filter(
            Sale.customer_id == customer_id,
            Sale.company_id == company_id,
            Sale.is_deleted == False,
        )
        .scalar()
        or 0
    )


# ============================================================
# CUSTOMER LAST PURCHASE
# ============================================================

def get_customer_last_purchase_date(
    db: Session,
    customer_id: int,
    company_id: int,
):

    return (
        db.query(
            func.max(Sale.sale_date)
        )
        .filter(
            Sale.customer_id == customer_id,
            Sale.company_id == company_id,
            Sale.is_deleted == False,
        )
        .scalar()
    )


# ============================================================
# GET SALE BY INVOICE
# ============================================================

def get_sale_by_invoice(
    db: Session,
    invoice_number: str,
    company_id: int,
):

    sale = (
        db.query(Sale)
        .options(
            joinedload(Sale.customer),
            joinedload(Sale.items)
            .joinedload(SaleItem.product),
        )
        .filter(
            Sale.invoice_number == invoice_number,
            Sale.company_id == company_id,
            Sale.is_deleted == False,
        )
        .first()
    )

    if not sale:
        raise ValueError(
            "Sale not found"
        )

    return sale


# ============================================================
# COMPLETE SALE DETAILS
# ============================================================

def get_complete_sale_details(
    db: Session,
    sale_id: int,
    company_id: int,
):

    sale = (
        db.query(Sale)
        .options(
            joinedload(Sale.customer),
            joinedload(Sale.items)
            .joinedload(SaleItem.product),
        )
        .filter(
            Sale.id == sale_id,
            Sale.company_id == company_id,
            Sale.is_deleted == False,
        )
        .first()
    )

    if not sale:
        raise ValueError(
            "Sale not found"
        )

    items = []

    for item in sale.items:

        product = item.product

        # ----------------------------------------------------
        # CATEGORY
        # ----------------------------------------------------

        category_name = None

        if product is not None:

            category = getattr(
                product,
                "category",
                None,
            )

            if category is not None:

                category_name = getattr(
                    category,
                    "name",
                    None,
                )

        # ----------------------------------------------------
        # SKU
        # ----------------------------------------------------

        sku = None

        if product is not None:
            sku = getattr(
                product,
                "sku",
                None,
            )

        # ----------------------------------------------------
        # ITEM
        # ----------------------------------------------------

        items.append(
            {
                "sale_item_id": item.id,

                "product_id": item.product_id,

                "product_name": (
                    product.name
                    if product
                    else None
                ),

                # IMPORTANT:
                # SKU is returned here
                "sku": sku,

                "category_id": getattr(
                    item,
                    "category_id",
                    None,
                ),

                "category_name": category_name,

                "quantity": int(
                    item.quantity or 0
                ),

                "unit_price": money(
                    item.unit_price
                ),

                "discount": money(
                    item.discount
                ),

                "tax": money(
                    item.tax
                ),

                "total": money(
                    item.total
                ),
            }
        )

    # --------------------------------------------------------
    # CALCULATE SUBTOTAL
    # --------------------------------------------------------

    subtotal = Decimal("0.00")
    discount_total = Decimal("0.00")
    tax_total = Decimal("0.00")

    for item in sale.items:

        subtotal += (
            to_decimal(
                item.unit_price
            )
            * Decimal(
                int(item.quantity or 0)
            )
        )

        discount_total += to_decimal(
            item.discount
        )

        tax_total += to_decimal(
            item.tax
        )

    return {
        "sale_id": sale.id,

        "invoice_number": sale.invoice_number,

        "customer_id": sale.customer_id,

        "customer_name": sale.customer_name,

        "sale_date": sale.sale_date,

        "sales_channel": sale.sales_channel,

        "payment_method": sale.payment_method,

        "payment_status": sale.payment_status,

        "created_by": sale.created_by,

        "subtotal": money(
            subtotal
        ),

        "discount": money(
            discount_total
        ),

        "tax": money(
            tax_total
        ),

        "total_amount": money(
            sale.total_amount
        ),

        "is_deleted": sale.is_deleted,

        "items": items,
    }


# ============================================================
# SALE EXPORT DATA
# ============================================================

def get_sale_export_data(
    db: Session,
    sale_id: int,
    company_id: int,
):

    sale = (
        db.query(Sale)
        .options(
            joinedload(Sale.customer),
            joinedload(Sale.items)
            .joinedload(SaleItem.product),
        )
        .filter(
            Sale.id == sale_id,
            Sale.company_id == company_id,
            Sale.is_deleted == False,
        )
        .first()
    )

    if not sale:
        raise ValueError(
            "Sale not found"
        )

    export_items = []

    subtotal = Decimal("0.00")
    discount_total = Decimal("0.00")
    tax_total = Decimal("0.00")

    for item in sale.items:

        product = item.product

        quantity = int(
            item.quantity or 0
        )

        unit_price = money(
            item.unit_price
        )

        discount = money(
            item.discount
        )

        tax = money(
            item.tax
        )

        line_subtotal = (
            unit_price
            * Decimal(quantity)
        )

        line_total = money(
            item.total
        )

        subtotal += line_subtotal
        discount_total += discount
        tax_total += tax

        # ----------------------------------------------------
        # SKU
        # ----------------------------------------------------

        sku = None

        if product is not None:
            sku = getattr(
                product,
                "sku",
                None,
            )

        # ----------------------------------------------------
        # EXPORT ITEM
        # ----------------------------------------------------

        export_items.append(
            {
                "product_id": item.product_id,

                "product_name": (
                    product.name
                    if product
                    else None
                ),

                # IMPORTANT FOR PDF / EXPORT
                "sku": sku,

                "quantity": quantity,

                "unit_price": float(
                    unit_price
                ),

                "discount": float(
                    discount
                ),

                "tax": float(
                    tax
                ),

                "line_subtotal": float(
                    money(line_subtotal)
                ),

                "line_total": float(
                    line_total
                ),

                "total": float(
                    line_total
                ),
            }
        )

    return {
        "invoice_number": sale.invoice_number,

        "sale_id": sale.id,

        "customer_id": sale.customer_id,

        "customer_name": sale.customer_name,

        "sale_date": sale.sale_date,

        "sales_channel": sale.sales_channel,

        "payment_method": sale.payment_method,

        "payment_status": sale.payment_status,

        "subtotal": float(
            money(subtotal)
        ),

        "discount": float(
            money(discount_total)
        ),

        "tax": float(
            money(tax_total)
        ),

        "total_amount": float(
            money(sale.total_amount)
        ),

        "items": export_items,
    }