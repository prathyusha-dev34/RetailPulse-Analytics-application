from datetime import datetime, date, timedelta
from decimal import Decimal
from io import BytesIO, StringIO
import csv

from sqlalchemy import func
from sqlalchemy.orm import Session

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)
from reportlab.lib.styles import getSampleStyleSheet

from app.models.sale import Sale
from app.models.sale_item import SaleItem
from app.models.product import Product
from app.models.customer import Customer


# ============================================================
# HELPERS
# ============================================================

def _safe_decimal(value):
    if value is None:
        return Decimal("0.00")

    try:
        return Decimal(str(value))
    except Exception:
        return Decimal("0.00")


def _normalize_date(value):
    if value is None:
        return None

    if isinstance(value, datetime):
        return value.date()

    if isinstance(value, date):
        return value

    if isinstance(value, str):
        try:
            return datetime.strptime(
                value,
                "%Y-%m-%d",
            ).date()
        except ValueError:
            raise ValueError(
                f"Invalid date format: {value}. "
                "Expected YYYY-MM-DD."
            )

    raise ValueError("Invalid date value.")


def _start_datetime(value):
    normalized = _normalize_date(value)

    return datetime.combine(
        normalized,
        datetime.min.time(),
    )


def _next_day_datetime(value):
    normalized = _normalize_date(value)

    return datetime.combine(
        normalized + timedelta(days=1),
        datetime.min.time(),
    )


def validate_date_range(
    from_date=None,
    to_date=None,
):
    if not from_date or not to_date:
        return

    start = _normalize_date(from_date)
    end = _normalize_date(to_date)

    if start > end:
        raise ValueError(
            "from_date cannot be greater than to_date."
        )


def _apply_sale_validity(query):
    if hasattr(Sale, "is_deleted"):
        query = query.filter(
            Sale.is_deleted == False
        )

    return query


def _apply_date_filter(
    query,
    from_date=None,
    to_date=None,
):
    if from_date:
        query = query.filter(
            Sale.sale_date >= _start_datetime(from_date)
        )

    if to_date:
        query = query.filter(
            Sale.sale_date < _next_day_datetime(to_date)
        )

    return query


# ============================================================
# COMMON FILTERS
# ============================================================

def _apply_common_filters(
    query,
    company_id,
    from_date=None,
    to_date=None,
    product_id=None,
    category_id=None,
    customer_id=None,
    payment_method=None,
):
    query = query.filter(
        Sale.company_id == company_id
    )

    query = _apply_sale_validity(query)

    query = _apply_date_filter(
        query,
        from_date,
        to_date,
    )

    if payment_method:
        query = query.filter(
            Sale.payment_method == payment_method
        )

    if customer_id:
        query = query.filter(
            Sale.customer_id == customer_id
        )

    if product_id:
        query = query.filter(
            SaleItem.product_id == product_id
        )

    if category_id:
        query = query.filter(
            Product.category_id == category_id
        )

    return query


# ============================================================
# DATE PRESETS
# ============================================================

def resolve_date_preset(
    preset=None,
    custom_from=None,
    custom_to=None,
):
    today = date.today()

    if not preset:
        return None, None

    preset = preset.lower().strip()

    if preset == "today":
        return today, today

    if preset in {
        "last_7_days",
        "7_days",
        "7days",
    }:
        return (
            today - timedelta(days=6),
            today,
        )

    if preset in {
        "last_30_days",
        "30_days",
        "30days",
    }:
        return (
            today - timedelta(days=29),
            today,
        )

    if preset == "this_month":
        first_day = today.replace(day=1)

        return (
            first_day,
            today,
        )

    if preset == "last_month":
        first_this_month = today.replace(day=1)

        last_previous_month = (
            first_this_month - timedelta(days=1)
        )

        first_previous_month = (
            last_previous_month.replace(day=1)
        )

        return (
            first_previous_month,
            last_previous_month,
        )

    if preset == "custom":
        start = _normalize_date(custom_from)
        end = _normalize_date(custom_to)

        if not start or not end:
            raise ValueError(
                "Custom date range requires "
                "custom_from and custom_to."
            )

        validate_date_range(start, end)

        return start, end

    raise ValueError(
        "Invalid date preset. "
        "Use today, last_7_days, last_30_days, "
        "this_month, last_month, or custom."
    )


# ============================================================
# PERIOD
# ============================================================

def _to_date(value):
    if value is None:
        return None

    if isinstance(value, datetime):
        return value.date()

    if isinstance(value, date):
        return value

    if isinstance(value, str):
        try:
            return datetime.fromisoformat(value).date()
        except Exception:
            try:
                return datetime.strptime(
                    value,
                    "%Y-%m-%d",
                ).date()
            except Exception:
                return None

    return None


def _period_key(
    sale_date,
    period,
):
    current = _to_date(sale_date)

    if current is None:
        return None

    period = period.lower()

    if period == "daily":
        return current

    if period == "weekly":
        return (
            current
            - timedelta(
                days=current.weekday()
            )
        )

    if period == "monthly":
        return current.replace(day=1)

    raise ValueError(
        "period must be daily, weekly, or monthly."
    )


# ============================================================
# SUMMARY
# ============================================================

def get_sales_analytics_summary(
    db: Session,
    company_id: int,
    from_date=None,
    to_date=None,
    product_id=None,
    category_id=None,
    customer_id=None,
    payment_method=None,
):
    validate_date_range(
        from_date,
        to_date,
    )

    sale_id_query = (
        db.query(Sale.id)
        .outerjoin(
            SaleItem,
            SaleItem.sale_id == Sale.id,
        )
        .outerjoin(
            Product,
            Product.id == SaleItem.product_id,
        )
    )

    sale_id_query = _apply_common_filters(
        sale_id_query,
        company_id,
        from_date,
        to_date,
        product_id,
        category_id,
        customer_id,
        payment_method,
    )

    sale_ids = [
        row[0]
        for row in sale_id_query.distinct().all()
    ]

    if not sale_ids:
        return {
            "total_revenue": Decimal("0.00"),
            "total_orders": 0,
            "average_order_value": Decimal("0.00"),
            "total_items_sold": 0,
            "total_discount": Decimal("0.00"),
            "total_tax": Decimal("0.00"),
        }

    sales_summary = (
        db.query(
            func.count(Sale.id),
            func.coalesce(
                func.sum(Sale.total_amount),
                0,
            ),
        )
        .filter(
            Sale.id.in_(sale_ids)
        )
        .first()
    )

    total_orders = int(
        sales_summary[0] or 0
    )

    total_revenue = _safe_decimal(
        sales_summary[1]
    )

    average_order_value = (
        total_revenue / Decimal(total_orders)
        if total_orders
        else Decimal("0.00")
    )

    item_row = (
        db.query(
            func.coalesce(
                func.sum(SaleItem.quantity),
                0,
            ),
            func.coalesce(
                func.sum(SaleItem.discount),
                0,
            ),
            func.coalesce(
                func.sum(SaleItem.tax),
                0,
            ),
        )
        .join(
            Sale,
            Sale.id == SaleItem.sale_id,
        )
        .join(
            Product,
            Product.id == SaleItem.product_id,
        )
        .filter(
            Sale.id.in_(sale_ids)
        )
        .first()
    )

    total_items_sold = int(
        item_row[0] or 0
    )

    total_discount = _safe_decimal(
        item_row[1]
    )

    total_tax = _safe_decimal(
        item_row[2]
    )

    return {
        "total_revenue": total_revenue,
        "total_orders": total_orders,
        "average_order_value": average_order_value,
        "total_items_sold": total_items_sold,
        "total_discount": total_discount,
        "total_tax": total_tax,
    }


# ============================================================
# REVENUE TREND
# ============================================================

def get_sales_revenue_trend(
    db: Session,
    company_id: int,
    period="daily",
    from_date=None,
    to_date=None,
    product_id=None,
    category_id=None,
    customer_id=None,
    payment_method=None,
):
    validate_date_range(
        from_date,
        to_date,
    )

    period = period.lower()

    if period not in {
        "daily",
        "weekly",
        "monthly",
    }:
        raise ValueError(
            "period must be daily, weekly, or monthly."
        )

    query = (
        db.query(
            Sale.id,
            Sale.sale_date,
            Sale.total_amount,
        )
        .outerjoin(
            SaleItem,
            SaleItem.sale_id == Sale.id,
        )
        .outerjoin(
            Product,
            Product.id == SaleItem.product_id,
        )
    )

    query = _apply_common_filters(
        query,
        company_id,
        from_date,
        to_date,
        product_id,
        category_id,
        customer_id,
        payment_method,
    )

    rows = query.all()

    sales_by_id = {}

    for sale_id, sale_date, total_amount in rows:
        if sale_id not in sales_by_id:
            sales_by_id[sale_id] = (
                sale_date,
                _safe_decimal(total_amount),
            )

    grouped = {}

    for sale_date, total_amount in sales_by_id.values():
        key = _period_key(
            sale_date,
            period,
        )

        if key is None:
            continue

        grouped.setdefault(
            key,
            Decimal("0.00"),
        )

        grouped[key] += total_amount

    return [
        {
            "date": key.isoformat(),
            "revenue": grouped[key],
        }
        for key in sorted(grouped.keys())
    ]


# ============================================================
# SALES VS ORDERS
# ============================================================

def get_sales_vs_orders(
    db: Session,
    company_id: int,
    period="daily",
    from_date=None,
    to_date=None,
    product_id=None,
    category_id=None,
    customer_id=None,
    payment_method=None,
):
    validate_date_range(
        from_date,
        to_date,
    )

    period = period.lower()

    if period not in {
        "daily",
        "weekly",
        "monthly",
    }:
        raise ValueError(
            "period must be daily, weekly, or monthly."
        )

    query = (
        db.query(
            Sale.id,
            Sale.sale_date,
            Sale.total_amount,
        )
        .outerjoin(
            SaleItem,
            SaleItem.sale_id == Sale.id,
        )
        .outerjoin(
            Product,
            Product.id == SaleItem.product_id,
        )
    )

    query = _apply_common_filters(
        query,
        company_id,
        from_date,
        to_date,
        product_id,
        category_id,
        customer_id,
        payment_method,
    )

    rows = query.all()

    sales_by_id = {}

    for sale_id, sale_date, total_amount in rows:
        if sale_id not in sales_by_id:
            sales_by_id[sale_id] = (
                sale_date,
                _safe_decimal(total_amount),
            )

    grouped = {}

    for sale_date, total_amount in sales_by_id.values():
        key = _period_key(
            sale_date,
            period,
        )

        if key is None:
            continue

        if key not in grouped:
            grouped[key] = {
                "revenue": Decimal("0.00"),
                "orders": 0,
            }

        grouped[key]["revenue"] += total_amount
        grouped[key]["orders"] += 1

    return [
        {
            "date": key.isoformat(),
            "revenue": grouped[key]["revenue"],
            "orders": grouped[key]["orders"],
        }
        for key in sorted(grouped.keys())
    ]


# ============================================================
# TOP PRODUCTS
# ============================================================

def get_top_products(
    db: Session,
    company_id: int,
    from_date=None,
    to_date=None,
    product_id=None,
    category_id=None,
    customer_id=None,
    payment_method=None,
    sort_by="revenue",
    limit=10,
    offset=0,
):
    validate_date_range(
        from_date,
        to_date,
    )

    sort_by = sort_by.lower()

    if sort_by not in {
        "revenue",
        "quantity",
    }:
        raise ValueError(
            "sort_by must be revenue or quantity."
        )

    limit = max(
        1,
        min(int(limit), 100),
    )

    offset = max(
        0,
        int(offset),
    )

    query = (
        db.query(
            Product.id.label("product_id"),
            Product.name.label("product_name"),
            Product.sku.label("sku"),
            func.coalesce(
                func.sum(SaleItem.quantity),
                0,
            ).label("quantity_sold"),
            func.coalesce(
                func.sum(
                    SaleItem.quantity
                    * SaleItem.unit_price
                ),
                0,
            ).label("revenue"),
        )
        .join(
            SaleItem,
            SaleItem.product_id == Product.id,
        )
        .join(
            Sale,
            Sale.id == SaleItem.sale_id,
        )
    )

    query = _apply_common_filters(
        query,
        company_id,
        from_date,
        to_date,
        product_id,
        category_id,
        customer_id,
        payment_method,
    )

    query = query.group_by(
        Product.id,
        Product.name,
        Product.sku,
    )

    if sort_by == "quantity":
        query = query.order_by(
            func.sum(
                SaleItem.quantity
            ).desc()
        )
    else:
        query = query.order_by(
            func.sum(
                SaleItem.quantity
                * SaleItem.unit_price
            ).desc()
        )

    rows = (
        query
        .offset(offset)
        .limit(limit)
        .all()
    )

    return [
        {
            "product_id": row.product_id,
            "product_name": row.product_name,
            "sku": row.sku or "",
            "quantity_sold": int(
                row.quantity_sold or 0
            ),
            "revenue": _safe_decimal(
                row.revenue
            ),
        }
        for row in rows
    ]


# ============================================================
# TOP CUSTOMERS
# ============================================================

def get_top_customers(
    db: Session,
    company_id: int,
    from_date=None,
    to_date=None,
    product_id=None,
    category_id=None,
    customer_id=None,
    payment_method=None,
    limit=10,
    offset=0,
):
    validate_date_range(
        from_date,
        to_date,
    )

    limit = max(
        1,
        min(int(limit), 100),
    )

    offset = max(
        0,
        int(offset),
    )

    # --------------------------------------------------------
    # First identify the unique sales matching the filters.
    # This prevents Sale.total_amount from being duplicated
    # when a sale contains multiple SaleItems.
    # --------------------------------------------------------

    filtered_sales = (
        db.query(
            Sale.id.label("sale_id"),
            Sale.customer_id.label("customer_id"),
            Sale.total_amount.label("total_amount"),
        )
        .outerjoin(
            SaleItem,
            SaleItem.sale_id == Sale.id,
        )
        .outerjoin(
            Product,
            Product.id == SaleItem.product_id,
        )
    )

    filtered_sales = _apply_common_filters(
        filtered_sales,
        company_id,
        from_date,
        to_date,
        product_id,
        category_id,
        customer_id,
        payment_method,
    )

    filtered_sales_subquery = (
        filtered_sales
        .distinct(Sale.id)
        .subquery()
    )

    query = (
        db.query(
            Customer.id.label(
                "customer_id"
            ),
            Customer.full_name.label(
                "customer_name"
            ),
            func.count(
                filtered_sales_subquery.c.sale_id
            ).label(
                "orders"
            ),
            func.coalesce(
                func.sum(
                    filtered_sales_subquery.c.total_amount
                ),
                0,
            ).label(
                "total_spend"
            ),
        )
        .join(
            filtered_sales_subquery,
            filtered_sales_subquery.c.customer_id
            == Customer.id,
        )
        .group_by(
            Customer.id,
            Customer.full_name,
        )
        .order_by(
            func.coalesce(
                func.sum(
                    filtered_sales_subquery.c.total_amount
                ),
                0,
            ).desc()
        )
    )

    rows = (
        query
        .offset(offset)
        .limit(limit)
        .all()
    )

    result = []

    for row in rows:
        orders = int(
            row.orders or 0
        )

        total_spend = _safe_decimal(
            row.total_spend
        )

        average_order_value = (
            total_spend / Decimal(orders)
            if orders
            else Decimal("0.00")
        )

        result.append(
            {
                "customer_id": row.customer_id,
                "customer_name":
                    row.customer_name or "Unknown",
                "orders": orders,
                "total_spend": total_spend,
                "average_order_value":
                    average_order_value,
            }
        )

    return result


# ============================================================
# PAYMENT METHOD
# ============================================================

def get_payment_method_analytics(
    db: Session,
    company_id: int,
    from_date=None,
    to_date=None,
    product_id=None,
    category_id=None,
    customer_id=None,
    payment_method=None,
):
    validate_date_range(
        from_date,
        to_date,
    )

    query = (
        db.query(
            Sale.id,
            Sale.payment_method,
            Sale.total_amount,
        )
        .outerjoin(
            SaleItem,
            SaleItem.sale_id == Sale.id,
        )
        .outerjoin(
            Product,
            Product.id == SaleItem.product_id,
        )
    )

    query = _apply_common_filters(
        query,
        company_id,
        from_date,
        to_date,
        product_id,
        category_id,
        customer_id,
        payment_method,
    )

    rows = query.all()

    transactions = {}

    for sale_id, method, total_amount in rows:
        if sale_id not in transactions:
            transactions[sale_id] = {
                "method": method or "Other",
                "revenue": _safe_decimal(
                    total_amount
                ),
            }

    grouped = {}

    for item in transactions.values():
        method = item["method"]

        if method not in grouped:
            grouped[method] = {
                "transactions": 0,
                "revenue": Decimal("0.00"),
            }

        grouped[method]["transactions"] += 1

        grouped[method]["revenue"] += (
            item["revenue"]
        )

    return [
        {
            "method": method,
            "transactions":
                values["transactions"],
            "revenue":
                values["revenue"],
        }
        for method, values in sorted(
            grouped.items()
        )
    ]


# ============================================================
# EXPORT DATA
# ============================================================

def get_export_data(
    db: Session,
    company_id: int,
    from_date=None,
    to_date=None,
    product_id=None,
    category_id=None,
    customer_id=None,
    payment_method=None,
):
    validate_date_range(
        from_date,
        to_date,
    )

    query = (
        db.query(
            Sale.id.label("sale_id"),
            Sale.sale_date.label("sale_date"),
            Sale.payment_method.label(
                "payment_method"
            ),
            Sale.sales_channel.label(
                "sales_channel"
            ),
            Customer.full_name.label(
                "customer_name"
            ),
            Product.name.label(
                "product_name"
            ),
            Product.sku.label("sku"),
            SaleItem.quantity.label(
                "quantity"
            ),
            SaleItem.unit_price.label(
                "unit_price"
            ),
            SaleItem.discount.label(
                "discount"
            ),
            SaleItem.tax.label("tax"),
            Sale.total_amount.label(
                "sale_total"
            ),
        )
        .join(
            SaleItem,
            SaleItem.sale_id == Sale.id,
        )
        .join(
            Product,
            Product.id == SaleItem.product_id,
        )
        .outerjoin(
            Customer,
            Customer.id == Sale.customer_id,
        )
    )

    query = _apply_common_filters(
        query,
        company_id,
        from_date,
        to_date,
        product_id,
        category_id,
        customer_id,
        payment_method,
    )

    query = query.order_by(
        Sale.sale_date.desc()
    )

    return query.all()


# ============================================================
# CSV EXPORT
# ============================================================

def export_analytics_csv(
    db: Session,
    company_id: int,
    from_date=None,
    to_date=None,
    product_id=None,
    category_id=None,
    customer_id=None,
    payment_method=None,
):
    rows = get_export_data(
        db=db,
        company_id=company_id,
        from_date=from_date,
        to_date=to_date,
        product_id=product_id,
        category_id=category_id,
        customer_id=customer_id,
        payment_method=payment_method,
    )

    output = StringIO()

    writer = csv.writer(output)

    writer.writerow(
        [
            "Sale ID",
            "Sale Date",
            "Customer",
            "Product",
            "SKU",
            "Quantity",
            "Unit Price",
            "Discount",
            "Tax",
            "Payment Method",
            "Sales Channel",
            "Sale Total",
        ]
    )

    for row in rows:
        sale_date = row.sale_date

        if isinstance(
            sale_date,
            (datetime, date),
        ):
            sale_date = sale_date.isoformat()

        writer.writerow(
            [
                row.sale_id,
                sale_date or "",
                row.customer_name or "",
                row.product_name or "",
                row.sku or "",
                row.quantity or 0,
                row.unit_price or 0,
                row.discount or 0,
                row.tax or 0,
                row.payment_method or "",
                row.sales_channel or "",
                row.sale_total or 0,
            ]
        )

    return output.getvalue()


# ============================================================
# PDF EXPORT
# ============================================================

def export_analytics_pdf(
    db: Session,
    company_id: int,
    from_date=None,
    to_date=None,
    product_id=None,
    category_id=None,
    customer_id=None,
    payment_method=None,
):
    rows = get_export_data(
        db=db,
        company_id=company_id,
        from_date=from_date,
        to_date=to_date,
        product_id=product_id,
        category_id=category_id,
        customer_id=customer_id,
        payment_method=payment_method,
    )

    buffer = BytesIO()

    document = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=25,
        leftMargin=25,
        topMargin=25,
        bottomMargin=25,
    )

    styles = getSampleStyleSheet()

    story = []

    story.append(
        Paragraph(
            "RetailPulse Sales Analytics Report",
            styles["Title"],
        )
    )

    story.append(
        Spacer(1, 10)
    )

    story.append(
        Paragraph(
            f"Date Range: "
            f"{from_date or 'All'} "
            f"to "
            f"{to_date or 'All'}",
            styles["Normal"],
        )
    )

    story.append(
        Spacer(1, 15)
    )

    data = [
        [
            "Sale ID",
            "Date",
            "Customer",
            "Product",
            "Qty",
            "Revenue",
        ]
    ]

    for row in rows:
        sale_date = row.sale_date

        if isinstance(
            sale_date,
            (datetime, date),
        ):
            sale_date = sale_date.isoformat()

        data.append(
            [
                str(row.sale_id),
                str(sale_date or ""),
                row.customer_name or "",
                row.product_name or "",
                str(row.quantity or 0),
                str(row.sale_total or 0),
            ]
        )

    if len(data) == 1:
        data.append(
            [
                "",
                "",
                "No sales data available",
                "",
                "",
                "",
            ]
        )

    table = Table(
        data,
        repeatRows=1,
    )

    table.setStyle(
        TableStyle(
            [
                (
                    "BACKGROUND",
                    (0, 0),
                    (-1, 0),
                    colors.grey,
                ),
                (
                    "TEXTCOLOR",
                    (0, 0),
                    (-1, 0),
                    colors.white,
                ),
                (
                    "GRID",
                    (0, 0),
                    (-1, -1),
                    0.5,
                    colors.grey,
                ),
                (
                    "FONTNAME",
                    (0, 0),
                    (-1, 0),
                    "Helvetica-Bold",
                ),
                (
                    "FONTSIZE",
                    (0, 0),
                    (-1, -1),
                    8,
                ),
                (
                    "VALIGN",
                    (0, 0),
                    (-1, -1),
                    "MIDDLE",
                ),
            ]
        )
    )

    story.append(table)

    document.build(story)

    buffer.seek(0)

    return buffer