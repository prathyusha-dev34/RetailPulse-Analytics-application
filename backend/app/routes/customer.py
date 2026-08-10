# ==========================================================
# app/api/routes/customer.py
# CUSTOMER MANAGEMENT + CUSTOMER PROFILE + ANALYTICS
# + CUSTOMER EXPORTS
# ==========================================================

from datetime import datetime
from decimal import Decimal
import csv
import io

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
)

from fastapi.responses import StreamingResponse

from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user

from app.models.user import User
from app.models.customer import Customer
from app.models.sale import Sale

from app.schemas.customer import (
    CustomerCreate,
    CustomerUpdate,
    CustomerResponse,
    CustomerListResponse,
    CustomerSearchResponse,
)

from app.services.customer_service import (
    create_customer,
    get_customers,
    get_customer,
    update_customer,
    delete_customer,
    activate_customer,
    deactivate_customer,
    search_customers,
    filter_customers,
)


# ==========================================================
# ROUTER
# ==========================================================

router = APIRouter(
    prefix="/customers",
    tags=["Customers"],
)


# ==========================================================
# COMPANY ID HELPER
# ==========================================================

def get_company_id(
    current_user: User,
) -> int:

    company_id = getattr(
        current_user,
        "company_id",
        None,
    )

    if company_id is None:
        raise HTTPException(
            status_code=400,
            detail="User is not associated with a company",
        )

    return company_id


# ==========================================================
# CREATE CUSTOMER
# ==========================================================

@router.post(
    "",
    response_model=CustomerResponse,
    status_code=201,
)
def create_customer_api(

    customer: CustomerCreate,

    db: Session = Depends(get_db),

    current_user: User = Depends(
        get_current_user
    ),

):

    company_id = get_company_id(
        current_user
    )

    try:

        created_customer = create_customer(

            db=db,

            company_id=company_id,

            user_id=current_user.id,

            customer=customer,

        )

        return created_customer

    except ValueError as e:

        raise HTTPException(
            status_code=400,
            detail=str(e),
        )


# ==========================================================
# GET CUSTOMER LIST
# ==========================================================

@router.get(
    "",
    response_model=CustomerListResponse,
)
def get_customers_api(

    page: int = Query(
        1,
        ge=1,
    ),

    limit: int = Query(
        100,
        ge=1,
        le=500,
    ),

    db: Session = Depends(get_db),

    current_user: User = Depends(
        get_current_user
    ),

):

    company_id = get_company_id(
        current_user
    )

    skip = (
        page - 1
    ) * limit

    customers = get_customers(

        db=db,

        company_id=company_id,

        skip=skip,

        limit=limit,

    )

    total = (
        db.query(Customer)
        .filter(
            Customer.company_id == company_id
        )
        .count()
    )

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "data": customers,
    }


# ==========================================================
# SEARCH CUSTOMERS
# ==========================================================

@router.get(
    "/search/",
    response_model=list[CustomerSearchResponse],
)
def search_customer_api(

    keyword: str = Query(
        ...,
        min_length=1,
    ),

    db: Session = Depends(get_db),

    current_user: User = Depends(
        get_current_user
    ),

):

    company_id = get_company_id(
        current_user
    )

    return search_customers(

        db=db,

        company_id=company_id,

        keyword=keyword,

    )


# ==========================================================
# FILTER CUSTOMERS
# ==========================================================

@router.get(
    "/filter/",
    response_model=list[CustomerResponse],
)
def filter_customer_api(

    customer_type: str | None = Query(
        None
    ),

    customer_segment: str | None = Query(
        None
    ),

    status: str | None = Query(
        None
    ),

    city: str | None = Query(
        None
    ),

    state: str | None = Query(
        None
    ),

    country: str | None = Query(
        None
    ),

    db: Session = Depends(get_db),

    current_user: User = Depends(
        get_current_user
    ),

):

    company_id = get_company_id(
        current_user
    )

    return filter_customers(

        db=db,

        company_id=company_id,

        customer_type=customer_type,

        customer_segment=customer_segment,

        status=status,

        city=city,

        state=state,

        country=country,

    )


# ==========================================================
# EXPORT CUSTOMERS CSV
#
# IMPORTANT:
# This route must be BEFORE /{customer_id}
# ==========================================================

@router.get(
    "/export/csv"
)
def export_customers_csv(

    db: Session = Depends(get_db),

    current_user: User = Depends(
        get_current_user
    ),

):

    company_id = get_company_id(
        current_user
    )

    customers = (
        db.query(Customer)
        .filter(
            Customer.company_id == company_id
        )
        .all()
    )

    output = io.StringIO()

    writer = csv.writer(
        output
    )

    writer.writerow([
        "Customer ID",
        "Customer Name",
        "Email",
        "Phone Number",
        "Customer Segment",
        "Status",
        "Total Orders",
        "Total Spend",
        "Last Purchase",
    ])

    for customer in customers:

        lifetime_revenue = getattr(
            customer,
            "lifetime_revenue",
            None,
        )

        if lifetime_revenue is None:

            lifetime_revenue = getattr(
                customer,
                "total_revenue",
                None,
            )

        if lifetime_revenue is None:

            lifetime_revenue = getattr(
                customer,
                "total_purchase_amount",
                0,
            )

        writer.writerow([

            getattr(
                customer,
                "id",
                "",
            ),

            getattr(
                customer,
                "full_name",
                "",
            ),

            getattr(
                customer,
                "email",
                "",
            ),

            getattr(
                customer,
                "phone_number",
                "",
            ),

            getattr(
                customer,
                "customer_segment",
                "",
            ),

            getattr(
                customer,
                "status",
                "ACTIVE",
            ),

            getattr(
                customer,
                "total_orders",
                0,
            ),

            lifetime_revenue,

            getattr(
                customer,
                "last_purchase_date",
                "",
            ),

        ])

    output.seek(0)

    return StreamingResponse(

        iter([
            output.getvalue()
        ]),

        media_type="text/csv",

        headers={
            "Content-Disposition":
                "attachment; filename=customers.csv"
        },

    )


# ==========================================================
# EXPORT CUSTOMERS PDF
# ==========================================================

@router.get(
    "/export/pdf"
)
def export_customers_pdf(

    db: Session = Depends(get_db),

    current_user: User = Depends(
        get_current_user
    ),

):

    company_id = get_company_id(
        current_user
    )

    customers = (
        db.query(Customer)
        .filter(
            Customer.company_id == company_id
        )
        .all()
    )

    # ------------------------------------------------------
    # REPORTLAB
    # ------------------------------------------------------

    from reportlab.lib import colors

    from reportlab.lib.pagesizes import (
        landscape,
        A4,
    )

    from reportlab.platypus import (
        SimpleDocTemplate,
        Table,
        TableStyle,
        Paragraph,
        Spacer,
    )

    from reportlab.lib.styles import (
        getSampleStyleSheet,
    )

    # ------------------------------------------------------
    # BUFFER
    # ------------------------------------------------------

    buffer = io.BytesIO()

    document = SimpleDocTemplate(

        buffer,

        pagesize=landscape(A4),

        rightMargin=20,

        leftMargin=20,

        topMargin=20,

        bottomMargin=20,

    )

    styles = getSampleStyleSheet()

    elements = []

    # ------------------------------------------------------
    # TITLE
    # ------------------------------------------------------

    elements.append(
        Paragraph(
            "Customer Report",
            styles["Title"],
        )
    )

    elements.append(
        Spacer(
            1,
            15,
        )
    )

    # ------------------------------------------------------
    # TABLE HEADER
    # ------------------------------------------------------

    data = [

        [
            "ID",
            "Customer Name",
            "Email",
            "Phone",
            "Segment",
            "Status",
            "Orders",
            "Total Spend",
            "Last Purchase",
        ]

    ]

    # ------------------------------------------------------
    # CUSTOMER ROWS
    # ------------------------------------------------------

    for customer in customers:

        lifetime_revenue = getattr(
            customer,
            "lifetime_revenue",
            None,
        )

        if lifetime_revenue is None:

            lifetime_revenue = getattr(
                customer,
                "total_revenue",
                None,
            )

        if lifetime_revenue is None:

            lifetime_revenue = getattr(
                customer,
                "total_purchase_amount",
                0,
            )

        data.append([

            str(
                getattr(
                    customer,
                    "id",
                    "",
                )
            ),

            str(
                getattr(
                    customer,
                    "full_name",
                    "",
                )
            ),

            str(
                getattr(
                    customer,
                    "email",
                    "",
                )
            ),

            str(
                getattr(
                    customer,
                    "phone_number",
                    "",
                )
            ),

            str(
                getattr(
                    customer,
                    "customer_segment",
                    "",
                )
            ),

            str(
                getattr(
                    customer,
                    "status",
                    "ACTIVE",
                )
            ),

            str(
                getattr(
                    customer,
                    "total_orders",
                    0,
                )
            ),

            str(
                lifetime_revenue
            ),

            str(
                getattr(
                    customer,
                    "last_purchase_date",
                    "",
                )
            ),

        ])

    # ------------------------------------------------------
    # TABLE
    # ------------------------------------------------------

    table = Table(
        data,
        repeatRows=1,
    )

    table.setStyle(
        TableStyle([

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
                colors.black,
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
                7,
            ),

            (
                "VALIGN",
                (0, 0),
                (-1, -1),
                "MIDDLE",
            ),

        ])
    )

    elements.append(
        table
    )

    # ------------------------------------------------------
    # BUILD PDF
    # ------------------------------------------------------

    document.build(
        elements
    )

    buffer.seek(0)

    return StreamingResponse(

        buffer,

        media_type="application/pdf",

        headers={
            "Content-Disposition":
                "attachment; filename=customers.pdf"
        },

    )


# ==========================================================
# EXPORT CUSTOMER ANALYTICS PDF
# ==========================================================

@router.get(
    "/export/analytics/pdf"
)
def export_customer_analytics_pdf(

    db: Session = Depends(get_db),

    current_user: User = Depends(
        get_current_user
    ),

):

    company_id = get_company_id(
        current_user
    )

    customers = (
        db.query(Customer)
        .filter(
            Customer.company_id == company_id
        )
        .all()
    )

    # ------------------------------------------------------
    # CUSTOMER COUNTS
    # ------------------------------------------------------

    total_customers = len(
        customers
    )

    active_customers = sum(

        1

        for customer in customers

        if str(
            getattr(
                customer,
                "status",
                "ACTIVE",
            )
        ).upper()
        == "ACTIVE"

    )

    inactive_customers = sum(

        1

        for customer in customers

        if str(
            getattr(
                customer,
                "status",
                "ACTIVE",
            )
        ).upper()
        == "INACTIVE"

    )

    vip_customers = sum(

        1

        for customer in customers

        if (

            str(
                getattr(
                    customer,
                    "customer_segment",
                    "",
                )
            ).upper()
            == "VIP"

            or

            str(
                getattr(
                    customer,
                    "customer_type",
                    "",
                )
            ).upper()
            == "VIP"

        )

    )

    # ------------------------------------------------------
    # SALES / REVENUE
    # ------------------------------------------------------

    total_revenue = Decimal(
        "0"
    )

    total_orders = 0

    try:

        sales_query = (
            db.query(Sale)
        )

        if hasattr(
            Sale,
            "company_id",
        ):

            sales_query = sales_query.filter(
                Sale.company_id
                == company_id
            )

        else:

            customer_ids = [

                customer.id

                for customer
                in customers

            ]

            if customer_ids:

                sales_query = sales_query.filter(
                    Sale.customer_id.in_(
                        customer_ids
                    )
                )

            else:

                sales_query = None

        if sales_query is not None:

            sales = (
                sales_query
                .all()
            )

            total_orders = len(
                sales
            )

            for sale in sales:

                amount = getattr(
                    sale,
                    "total_amount",
                    0,
                ) or 0

                total_revenue += Decimal(
                    str(amount)
                )

    except Exception:

        total_orders = 0

        total_revenue = Decimal(
            "0"
        )

    # ------------------------------------------------------
    # AVERAGE SPEND
    # ------------------------------------------------------

    average_customer_spend = (

        total_revenue
        / total_customers

        if total_customers

        else Decimal("0")

    )

    # ------------------------------------------------------
    # REPORTLAB
    # ------------------------------------------------------

    from reportlab.lib import colors

    from reportlab.lib.pagesizes import A4

    from reportlab.platypus import (
        SimpleDocTemplate,
        Table,
        TableStyle,
        Paragraph,
        Spacer,
    )

    from reportlab.lib.styles import (
        getSampleStyleSheet,
    )

    # ------------------------------------------------------
    # BUFFER
    # ------------------------------------------------------

    buffer = io.BytesIO()

    document = SimpleDocTemplate(

        buffer,

        pagesize=A4,

        rightMargin=40,

        leftMargin=40,

        topMargin=40,

        bottomMargin=40,

    )

    styles = getSampleStyleSheet()

    elements = []

    # ------------------------------------------------------
    # TITLE
    # ------------------------------------------------------

    elements.append(
        Paragraph(
            "Customer Analytics Report",
            styles["Title"],
        )
    )

    elements.append(
        Spacer(
            1,
            20,
        )
    )

    # ------------------------------------------------------
    # ANALYTICS TABLE
    # ------------------------------------------------------

    analytics_data = [

        [
            "Metric",
            "Value",
        ],

        [
            "Total Customers",
            str(
                total_customers
            ),
        ],

        [
            "Active Customers",
            str(
                active_customers
            ),
        ],

        [
            "Inactive Customers",
            str(
                inactive_customers
            ),
        ],

        [
            "VIP Customers",
            str(
                vip_customers
            ),
        ],

        [
            "Total Orders",
            str(
                total_orders
            ),
        ],

        [
            "Total Revenue Generated",
            f"₹{float(total_revenue):,.2f}",
        ],

        [
            "Average Customer Spend",
            f"₹{float(average_customer_spend):,.2f}",
        ],

    ]

    table = Table(

        analytics_data,

        colWidths=[
            250,
            200,
        ],

    )

    table.setStyle(
        TableStyle([

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
                "FONTNAME",
                (0, 0),
                (-1, 0),
                "Helvetica-Bold",
            ),

            (
                "GRID",
                (0, 0),
                (-1, -1),
                0.5,
                colors.black,
            ),

            (
                "FONTSIZE",
                (0, 0),
                (-1, -1),
                10,
            ),

            (
                "PADDING",
                (0, 0),
                (-1, -1),
                8,
            ),

        ])
    )

    elements.append(
        table
    )

    # ------------------------------------------------------
    # BUILD PDF
    # ------------------------------------------------------

    document.build(
        elements
    )

    buffer.seek(0)

    return StreamingResponse(

        buffer,

        media_type="application/pdf",

        headers={
            "Content-Disposition":
                "attachment; filename=customer-analytics.pdf"
        },

    )


# ==========================================================
# CUSTOMER PROFILE
# ==========================================================

@router.get(
    "/{customer_id}/profile"
)
def customer_profile(

    customer_id: int,

    db: Session = Depends(get_db),

    current_user: User = Depends(
        get_current_user
    ),

):

    company_id = get_company_id(
        current_user
    )

    # ------------------------------------------------------
    # FIND CUSTOMER
    # ------------------------------------------------------

    customer = (
        db.query(Customer)
        .filter(
            Customer.id == customer_id,
            Customer.company_id == company_id,
        )
        .first()
    )

    if not customer:

        raise HTTPException(
            status_code=404,
            detail="Customer not found",
        )

    # ------------------------------------------------------
    # SAFE CUSTOMER ANALYTICS
    # ------------------------------------------------------

    total_orders = getattr(
        customer,
        "total_orders",
        0,
    ) or 0

    total_revenue = getattr(
        customer,
        "total_revenue",
        0,
    ) or 0

    customer_segment = getattr(
        customer,
        "customer_segment",
        None,
    )

    last_purchase_date = getattr(
        customer,
        "last_purchase_date",
        None,
    )

    # ------------------------------------------------------
    # CALCULATE FROM SALES
    # ------------------------------------------------------

    try:

        sales_query = (
            db.query(Sale)
            .filter(
                Sale.customer_id
                == customer.id,
            )
        )

        if hasattr(
            Sale,
            "company_id",
        ):

            sales_query = sales_query.filter(
                Sale.company_id
                == company_id
            )

        sales = (
            sales_query
            .all()
        )

        if sales:

            total_orders = len(
                sales
            )

            calculated_revenue = Decimal(
                "0"
            )

            latest_date = None

            for sale in sales:

                amount = getattr(
                    sale,
                    "total_amount",
                    0,
                ) or 0

                calculated_revenue += Decimal(
                    str(amount)
                )

                sale_date = getattr(
                    sale,
                    "sale_date",
                    None,
                )

                if sale_date:

                    if (
                        latest_date is None
                        or sale_date > latest_date
                    ):

                        latest_date = sale_date

            total_revenue = (
                calculated_revenue
            )

            if latest_date:

                last_purchase_date = (
                    latest_date
                )

    except Exception:

        pass

    # ------------------------------------------------------
    # RECENT PURCHASE HISTORY
    # ------------------------------------------------------

    recent_purchases = []

    try:

        sales_query = (
            db.query(Sale)
            .filter(
                Sale.customer_id
                == customer.id,
            )
        )

        if hasattr(
            Sale,
            "company_id",
        ):

            sales_query = sales_query.filter(
                Sale.company_id
                == company_id
            )

        if hasattr(
            Sale,
            "sale_date",
        ):

            sales_query = (
                sales_query
                .order_by(
                    Sale.sale_date.desc()
                )
            )

        sales = (
            sales_query
            .limit(5)
            .all()
        )

        for sale in sales:

            recent_purchases.append({

                "id":
                    getattr(
                        sale,
                        "id",
                        None,
                    ),

                "invoice_number":
                    getattr(
                        sale,
                        "invoice_number",
                        None,
                    ),

                "sale_date":
                    getattr(
                        sale,
                        "sale_date",
                        None,
                    ),

                "total_amount":
                    float(
                        getattr(
                            sale,
                            "total_amount",
                            0,
                        ) or 0
                    ),

            })

    except Exception:

        recent_purchases = []

    # ------------------------------------------------------
    # RETURN PROFILE
    # ------------------------------------------------------

    return {

        "id":
            customer.id,

        "full_name":
            getattr(
                customer,
                "full_name",
                "",
            ),

        "email":
            getattr(
                customer,
                "email",
                "",
            ),

        "phone_number":
            getattr(
                customer,
                "phone_number",
                "",
            ),

        "address":
            getattr(
                customer,
                "address",
                "",
            ),

        "city":
            getattr(
                customer,
                "city",
                "",
            ),

        "state":
            getattr(
                customer,
                "state",
                "",
            ),

        "country":
            getattr(
                customer,
                "country",
                "",
            ),

        "postal_code":
            getattr(
                customer,
                "postal_code",
                "",
            ),

        "date_of_birth":
            getattr(
                customer,
                "date_of_birth",
                None,
            ),

        "gender":
            getattr(
                customer,
                "gender",
                None,
            ),

        "customer_type":
            getattr(
                customer,
                "customer_type",
                None,
            ),

        "customer_segment":
            customer_segment,

        "status":
            getattr(
                customer,
                "status",
                "ACTIVE",
            ),

        "total_orders":
            total_orders,

        "total_spend":
            float(
                total_revenue
            ),

        "total_revenue":
            float(
                total_revenue
            ),

        "last_purchase_date":
            last_purchase_date,

        "recent_purchases":
            recent_purchases,

    }


# ==========================================================
# CUSTOMER ANALYTICS DASHBOARD
# ==========================================================

@router.get(
    "/analytics/dashboard"
)
def customer_analytics_dashboard(

    db: Session = Depends(get_db),

    current_user: User = Depends(
        get_current_user
    ),

):

    company_id = get_company_id(
        current_user
    )

    customers = (
        db.query(Customer)
        .filter(
            Customer.company_id
            == company_id
        )
        .all()
    )

    total_customers = len(
        customers
    )

    total_revenue = Decimal(
        "0"
    )

    total_orders = 0

    try:

        sales_query = (
            db.query(Sale)
        )

        if hasattr(
            Sale,
            "company_id",
        ):

            sales_query = sales_query.filter(
                Sale.company_id
                == company_id
            )

        else:

            customer_ids = [
                customer.id
                for customer
                in customers
            ]

            if customer_ids:

                sales_query = sales_query.filter(
                    Sale.customer_id.in_(
                        customer_ids
                    )
                )

            else:

                sales_query = None

        if sales_query is not None:

            sales = (
                sales_query
                .all()
            )

            total_orders = len(
                sales
            )

            for sale in sales:

                total_revenue += Decimal(
                    str(
                        getattr(
                            sale,
                            "total_amount",
                            0,
                        ) or 0
                    )
                )

    except Exception:

        total_orders = 0

    average_customer_spend = (

        total_revenue
        / total_customers

        if total_customers

        else Decimal("0")

    )

    # ------------------------------------------------------
    # VIP
    # ------------------------------------------------------

    vip_customers = 0

    for customer in customers:

        segment = getattr(
            customer,
            "customer_segment",
            "",
        )

        customer_type = getattr(
            customer,
            "customer_type",
            "",
        )

        if (

            str(
                segment
            ).upper()
            == "VIP"

            or

            str(
                customer_type
            ).upper()
            == "VIP"

        ):

            vip_customers += 1

    return {

        "total_customers":
            total_customers,

        "total_orders":
            total_orders,

        "total_revenue_generated":
            float(
                total_revenue
            ),

        "average_customer_spend":
            float(
                average_customer_spend
            ),

        "vip_customers":
            vip_customers,

    }


# ==========================================================
# TOP CUSTOMERS
# ==========================================================

@router.get(
    "/analytics/top-customers"
)
def top_customers(

    db: Session = Depends(get_db),

    current_user: User = Depends(
        get_current_user
    ),

    limit: int = Query(
        10,
        ge=1,
        le=100,
    ),

):

    company_id = get_company_id(
        current_user
    )

    customers = (
        db.query(Customer)
        .filter(
            Customer.company_id
            == company_id
        )
        .all()
    )

    result = []

    for customer in customers:

        revenue = Decimal(
            "0"
        )

        orders = 0

        try:

            sales_query = (
                db.query(Sale)
                .filter(
                    Sale.customer_id
                    == customer.id
                )
            )

            if hasattr(
                Sale,
                "company_id",
            ):

                sales_query = sales_query.filter(
                    Sale.company_id
                    == company_id
                )

            sales = (
                sales_query
                .all()
            )

            orders = len(
                sales
            )

            for sale in sales:

                revenue += Decimal(
                    str(
                        getattr(
                            sale,
                            "total_amount",
                            0,
                        ) or 0
                    )
                )

        except Exception:

            revenue = Decimal(
                "0"
            )

        result.append({

            "customer_id":
                customer.id,

            "customer_name":
                getattr(
                    customer,
                    "full_name",
                    "Customer",
                ),

            "total_orders":
                orders,

            "total_revenue":
                float(
                    revenue
                ),

            "lifetime_revenue":
                float(
                    revenue
                ),

        })

    result.sort(
        key=lambda x:
            x["total_revenue"],
        reverse=True,
    )

    return result[:limit]


# ==========================================================
# REVENUE CONTRIBUTION
# ==========================================================

@router.get(
    "/analytics/revenue-contribution"
)
def customer_revenue_contribution(

    db: Session = Depends(get_db),

    current_user: User = Depends(
        get_current_user
    ),

):

    company_id = get_company_id(
        current_user
    )

    customers = (
        db.query(Customer)
        .filter(
            Customer.company_id
            == company_id
        )
        .all()
    )

    result = []

    for customer in customers:

        revenue = Decimal(
            "0"
        )

        try:

            sales_query = (
                db.query(Sale)
                .filter(
                    Sale.customer_id
                    == customer.id
                )
            )

            if hasattr(
                Sale,
                "company_id",
            ):

                sales_query = sales_query.filter(
                    Sale.company_id
                    == company_id
                )

            sales = (
                sales_query
                .all()
            )

            for sale in sales:

                revenue += Decimal(
                    str(
                        getattr(
                            sale,
                            "total_amount",
                            0,
                        ) or 0
                    )
                )

        except Exception:

            revenue = Decimal(
                "0"
            )

        if revenue > 0:

            result.append({

                "customer_id":
                    customer.id,

                "customer_name":
                    getattr(
                        customer,
                        "full_name",
                        "Customer",
                    ),

                "revenue":
                    float(
                        revenue
                    ),

                "total_revenue":
                    float(
                        revenue
                    ),

            })

    result.sort(
        key=lambda x:
            x["revenue"],
        reverse=True,
    )

    return result


# ==========================================================
# NEW VS RETURNING CUSTOMERS
# ==========================================================

@router.get(
    "/analytics/new-vs-returning"
)
def new_vs_returning_customers(

    db: Session = Depends(get_db),

    current_user: User = Depends(
        get_current_user
    ),

):

    company_id = get_company_id(
        current_user
    )

    customers = (
        db.query(Customer)
        .filter(
            Customer.company_id
            == company_id
        )
        .all()
    )

    new_customers = 0

    returning_customers = 0

    for customer in customers:

        total_orders = getattr(
            customer,
            "total_orders",
            0,
        ) or 0

        if total_orders <= 1:

            new_customers += 1

        else:

            returning_customers += 1

    return [

        {
            "name":
                "Customers",

            "new_customers":
                new_customers,

            "returning_customers":
                returning_customers,

        }

    ]


# ==========================================================
# CUSTOMER GROWTH TREND
# ==========================================================

@router.get(
    "/analytics/growth-trend"
)
def customer_growth_trend(

    db: Session = Depends(get_db),

    current_user: User = Depends(
        get_current_user
    ),

):

    company_id = get_company_id(
        current_user
    )

    customers = (
        db.query(Customer)
        .filter(
            Customer.company_id
            == company_id
        )
        .all()
    )

    monthly_data = {}

    for customer in customers:

        created_at = getattr(
            customer,
            "created_at",
            None,
        )

        if not created_at:
            continue

        try:

            month = created_at.strftime(
                "%Y-%m"
            )

        except Exception:

            continue

        monthly_data[month] = (
            monthly_data.get(
                month,
                0,
            )
            + 1
        )

    result = []

    for month in sorted(
        monthly_data.keys()
    ):

        result.append({

            "month":
                month,

            "customers":
                monthly_data[month],

            "customer_count":
                monthly_data[month],

            "total_customers":
                monthly_data[month],

        })

    return result


# ==========================================================
# CUSTOMER SPENDING DISTRIBUTION
# ==========================================================

@router.get(
    "/analytics/spending-distribution"
)
def customer_spending_distribution(

    db: Session = Depends(get_db),

    current_user: User = Depends(
        get_current_user
    ),

):

    company_id = get_company_id(
        current_user
    )

    customers = (
        db.query(Customer)
        .filter(
            Customer.company_id
            == company_id
        )
        .all()
    )

    distribution = {

        "₹0 - ₹1,000":
            0,

        "₹1,001 - ₹5,000":
            0,

        "₹5,001 - ₹10,000":
            0,

        "₹10,001 - ₹50,000":
            0,

        "₹50,000+":
            0,

    }

    for customer in customers:

        revenue = Decimal(
            "0"
        )

        try:

            sales_query = (
                db.query(Sale)
                .filter(
                    Sale.customer_id
                    == customer.id
                )
            )

            if hasattr(
                Sale,
                "company_id",
            ):

                sales_query = sales_query.filter(
                    Sale.company_id
                    == company_id
                )

            sales = (
                sales_query
                .all()
            )

            for sale in sales:

                revenue += Decimal(
                    str(
                        getattr(
                            sale,
                            "total_amount",
                            0,
                        ) or 0
                    )
                )

        except Exception:

            revenue = Decimal(
                "0"
            )

        amount = float(
            revenue
        )

        if amount <= 1000:

            distribution[
                "₹0 - ₹1,000"
            ] += 1

        elif amount <= 5000:

            distribution[
                "₹1,001 - ₹5,000"
            ] += 1

        elif amount <= 10000:

            distribution[
                "₹5,001 - ₹10,000"
            ] += 1

        elif amount <= 50000:

            distribution[
                "₹10,001 - ₹50,000"
            ] += 1

        else:

            distribution[
                "₹50,000+"
            ] += 1

    return [

        {
            "name":
                key,

            "value":
                value,

        }

        for key, value
        in distribution.items()

    ]


# ==========================================================
# GET SINGLE CUSTOMER
# ==========================================================

@router.get(
    "/{customer_id}",
    response_model=CustomerResponse,
)
def get_customer_api(

    customer_id: int,

    db: Session = Depends(get_db),

    current_user: User = Depends(
        get_current_user
    ),

):

    company_id = get_company_id(
        current_user
    )

    customer = get_customer(

        db=db,

        company_id=company_id,

        customer_id=customer_id,

    )

    if not customer:

        raise HTTPException(
            status_code=404,
            detail="Customer not found",
        )

    return customer


# ==========================================================
# UPDATE CUSTOMER
# ==========================================================

@router.put(
    "/{customer_id}",
    response_model=CustomerResponse,
)
def update_customer_api(

    customer_id: int,

    customer: CustomerUpdate,

    db: Session = Depends(get_db),

    current_user: User = Depends(
        get_current_user
    ),

):

    company_id = get_company_id(
        current_user
    )

    try:

        updated_customer = update_customer(

            db=db,

            company_id=company_id,

            user_id=current_user.id,

            customer_id=customer_id,

            customer=customer,

        )

    except ValueError as e:

        raise HTTPException(
            status_code=400,
            detail=str(e),
        )

    if not updated_customer:

        raise HTTPException(
            status_code=404,
            detail="Customer not found",
        )

    return updated_customer


# ==========================================================
# DELETE CUSTOMER
# SOFT DELETE
# ==========================================================

@router.delete(
    "/{customer_id}"
)
def delete_customer_api(

    customer_id: int,

    db: Session = Depends(get_db),

    current_user: User = Depends(
        get_current_user
    ),

):

    company_id = get_company_id(
        current_user
    )

    deleted = delete_customer(

        db=db,

        company_id=company_id,

        user_id=current_user.id,

        customer_id=customer_id,

    )

    if not deleted:

        raise HTTPException(
            status_code=404,
            detail="Customer not found",
        )

    return {

        "message":
            "Customer deleted successfully",

        "customer_id":
            customer_id,

        "status":
            "INACTIVE",

    }


# ==========================================================
# ACTIVATE CUSTOMER
# ==========================================================

@router.patch(
    "/{customer_id}/activate",
    response_model=CustomerResponse,
)
def activate_customer_api(

    customer_id: int,

    db: Session = Depends(get_db),

    current_user: User = Depends(
        get_current_user
    ),

):

    company_id = get_company_id(
        current_user
    )

    customer = activate_customer(

        db=db,

        company_id=company_id,

        user_id=current_user.id,

        customer_id=customer_id,

    )

    if not customer:

        raise HTTPException(
            status_code=404,
            detail="Customer not found",
        )

    return customer


# ==========================================================
# DEACTIVATE CUSTOMER
# ==========================================================

@router.patch(
    "/{customer_id}/deactivate",
    response_model=CustomerResponse,
)
def deactivate_customer_api(

    customer_id: int,

    db: Session = Depends(get_db),

    current_user: User = Depends(
        get_current_user
    ),

):

    company_id = get_company_id(
        current_user
    )

    customer = deactivate_customer(

        db=db,

        company_id=company_id,

        user_id=current_user.id,

        customer_id=customer_id,

    )

    if not customer:

        raise HTTPException(
            status_code=404,
            detail="Customer not found",
        )

    return customer