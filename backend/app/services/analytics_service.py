from decimal import Decimal

from sqlalchemy import func
from sqlalchemy.orm import Session


from app.models.sale import Sale
from app.models.sale_item import SaleItem
from app.models.product import Product
from app.models.category import Category
from app.models.inventory import Inventory




# =====================================================
# SALES FILTER HELPERS
# =====================================================


def apply_sales_filters(
    query,
    filters=None
):

    if not filters:
        return query


    if filters.get("from_date"):

        query = query.filter(

            func.date(
                Sale.sale_date
            )
            >=
            filters["from_date"]

        )


    if filters.get("to_date"):

        query = query.filter(

            func.date(
                Sale.sale_date
            )
            <=
            filters["to_date"]

        )


    if filters.get("sales_channel"):

        query = query.filter(

            Sale.sales_channel
            ==
            filters["sales_channel"]

        )


    if filters.get("payment_method"):

        query = query.filter(

            Sale.payment_method
            ==
            filters["payment_method"]

        )


    return query







# =====================================================
# PRODUCT FILTER HELPERS
# =====================================================


def apply_product_filters(
    query,
    filters=None
):

    if not filters:
        return query



    if filters.get("product"):

        query = query.filter(

            Product.name.ilike(

                f"%{filters['product']}%"

            )

        )



    if filters.get("category"):

        query = query.filter(

            Category.name.ilike(

                f"%{filters['category']}%"

            )

        )



    if filters.get("brand"):

        query = query.filter(

            Product.brand.ilike(

                f"%{filters['brand']}%"

            )

        )


    return query







# =====================================================
# DASHBOARD SUMMARY
# =====================================================


def get_dashboard_summary(

    db: Session,

    company_id: int,

    filters=None

):


    # -----------------------------
    # TOTAL REVENUE
    # -----------------------------


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

            Sale.company_id
            ==
            company_id

        )

    )


    revenue_query = apply_sales_filters(

        revenue_query,

        filters

    )


    total_revenue = (

        revenue_query.scalar()

        or 0

    )




    # -----------------------------
    # TOTAL ORDERS
    # -----------------------------


    order_query = (

        db.query(

            Sale.id

        )

        .filter(

            Sale.company_id
            ==
            company_id

        )

    )


    order_query = apply_sales_filters(

        order_query,

        filters

    )


    total_orders = (

        order_query.count()

    )





    # -----------------------------
    # TOTAL PRODUCTS SOLD
    # -----------------------------


    products_query = (

        db.query(

            func.coalesce(

                func.sum(

                    SaleItem.quantity

                ),

                0

            )

        )


        .join(

            Sale,

            Sale.id
            ==
            SaleItem.sale_id

        )


        .join(

            Product,

            Product.id
            ==
            SaleItem.product_id

        )


        .join(

            Category,

            Category.id
            ==
            Product.category_id

        )


        .filter(

            Sale.company_id
            ==
            company_id

        )

    )



    products_query = apply_sales_filters(

        products_query,

        filters

    )


    products_query = apply_product_filters(

        products_query,

        filters

    )


    total_products_sold = (

        products_query.scalar()

        or 0

    )





    # -----------------------------
    # AVERAGE ORDER VALUE
    # -----------------------------


    average_order_value = Decimal("0.00")


    if total_orders:


        average_order_value = (

            Decimal(

                str(total_revenue)

            )

            /

            Decimal(

                str(total_orders)

            )

        )





    # -----------------------------
    # INVENTORY VALUE
    # -----------------------------


    inventory_query = (

        db.query(

            func.coalesce(

                func.sum(

                    Inventory.available_stock
                    *
                    Product.unit_price

                ),

                0

            )

        )


        .join(

            Product,

            Product.id
            ==
            Inventory.product_id

        )


        .join(

            Category,

            Category.id
            ==
            Product.category_id

        )


        .filter(

            Inventory.company_id
            ==
            company_id

        )

    )



    inventory_query = apply_product_filters(

        inventory_query,

        filters

    )


    total_inventory_value = (

        inventory_query.scalar()

        or 0

    )





    # -----------------------------
    # LOW STOCK
    # -----------------------------


    low_stock_products = (

        db.query(

            Inventory.id

        )

        .filter(

            Inventory.company_id
            ==
            company_id,


            Inventory.stock_status
            ==
            "Low Stock"

        )

        .count()

    )





    # -----------------------------
    # OUT OF STOCK
    # -----------------------------


    out_of_stock_products = (

        db.query(

            Inventory.id

        )

        .filter(

            Inventory.company_id
            ==
            company_id,


            Inventory.stock_status
            ==
            "Out Of Stock"

        )

        .count()

    )





    # -----------------------------
    # TOTAL CATEGORIES
    # -----------------------------


    total_categories = (

        db.query(

            Category.id

        )

        .filter(

            Category.company_id
            ==
            company_id

        )

        .count()

    )





    return {


        "total_revenue":

            float(total_revenue),



        "total_orders":

            total_orders,



        "total_products_sold":

            int(total_products_sold),



        "average_order_value":

            float(

                average_order_value

            ),



        "total_inventory_value":

            float(

                total_inventory_value

            ),



        "low_stock_products":

            low_stock_products,



        "out_of_stock_products":

            out_of_stock_products,



        "total_categories":

            total_categories

    }








# =====================================================
# REVENUE TREND
# =====================================================


def get_revenue_trend(

    db: Session,

    company_id: int,

    filters=None,

    period="daily"

):


    date_format = "YYYY-MM-DD"


    if period == "weekly":

        date_format = "IYYY-IW"


    elif period == "monthly":

        date_format = "YYYY-MM"



    date_column = func.to_char(

        Sale.sale_date,

        date_format

    )



    query = (

        db.query(

            date_column.label(
                "date"
            ),


            func.sum(

                Sale.total_amount

            ).label(
                "revenue"
            )

        )


        .filter(

            Sale.company_id
            ==
            company_id

        )

    )



    query = apply_sales_filters(

        query,

        filters

    )



    query = (

        query

        .group_by(

            date_column

        )

        .order_by(

            date_column

        )

    )



    return [

        {

            "date":

                row.date,


            "revenue":

                float(

                    row.revenue or 0

                )

        }

        for row in query.all()

    ]








# =====================================================
# SALES TREND
# =====================================================


def get_sales_trend(

    db: Session,

    company_id: int,

    filters=None,

    period="daily"

):


    date_format = "YYYY-MM-DD"


    if period == "weekly":

        date_format = "IYYY-IW"


    elif period == "monthly":

        date_format = "YYYY-MM"



    date_column = func.to_char(

        Sale.sale_date,

        date_format

    )



    query = (

        db.query(

            date_column.label(
                "date"
            ),


            func.count(

                Sale.id

            ).label(
                "sales"
            )

        )


        .filter(

            Sale.company_id
            ==
            company_id

        )

    )



    query = apply_sales_filters(

        query,

        filters

    )



    query = (

        query

        .group_by(

            date_column

        )

        .order_by(

            date_column

        )

    )



    return [

        {

            "date":

                row.date,


            "sales":

                row.sales

        }

        for row in query.all()

    ]


# =====================================================
# TOP SELLING PRODUCTS
# =====================================================


def get_top_products(

    db: Session,

    company_id: int,

    filters=None,

    limit=10

):


    query = (

        db.query(

            Product.id.label(
                "product_id"
            ),


            Product.name.label(
                "product_name"
            ),


            func.sum(

                SaleItem.quantity

            ).label(
                "quantity"
            ),


            func.sum(

                SaleItem.quantity
                *
                SaleItem.unit_price

            ).label(
                "revenue"
            )

        )


        .join(

            SaleItem,

            SaleItem.product_id
            ==
            Product.id

        )


        .join(

            Sale,

            Sale.id
            ==
            SaleItem.sale_id

        )


        .join(

            Category,

            Category.id
            ==
            Product.category_id

        )


        .filter(

            Sale.company_id
            ==
            company_id

        )

    )



    query = apply_sales_filters(

        query,

        filters

    )


    query = apply_product_filters(

        query,

        filters

    )



    query = (

        query

        .group_by(

            Product.id,

            Product.name

        )


        .order_by(

            func.sum(

                SaleItem.quantity

            )

            .desc()

        )


        .limit(

            limit

        )

    )



    return [

        {


            "product_id":

                row.product_id,



            "product_name":

                row.product_name,



            "quantity":

                row.quantity,



            "revenue":

                float(

                    row.revenue or 0

                )

        }


        for row in query.all()

    ]








# =====================================================
# TOP PERFORMING CATEGORIES
# =====================================================


def get_top_categories(

    db: Session,

    company_id: int,

    filters=None,

    limit=10

):


    query = (

        db.query(

            Category.id.label(
                "category_id"
            ),


            Category.name.label(
                "category_name"
            ),


            func.sum(

                SaleItem.quantity

            ).label(
                "quantity"
            ),


            func.sum(

                SaleItem.quantity
                *
                SaleItem.unit_price

            ).label(
                "revenue"
            )

        )


        .join(

            Product,

            Product.category_id
            ==
            Category.id

        )


        .join(

            SaleItem,

            SaleItem.product_id
            ==
            Product.id

        )


        .join(

            Sale,

            Sale.id
            ==
            SaleItem.sale_id

        )


        .filter(

            Sale.company_id
            ==
            company_id

        )

    )



    query = apply_sales_filters(

        query,

        filters

    )


    query = apply_product_filters(

        query,

        filters

    )



    query = (

        query

        .group_by(

            Category.id,

            Category.name

        )


        .order_by(

            func.sum(

                SaleItem.quantity

            )

            .desc()

        )


        .limit(

            limit

        )

    )



    return [

        {


            "category_id":

                row.category_id,



            "category_name":

                row.category_name,



            "quantity":

                row.quantity,



            "revenue":

                float(

                    row.revenue or 0

                )

        }


        for row in query.all()

    ]









# =====================================================
# SALES BY PAYMENT METHOD
# =====================================================


def get_sales_by_payment_method(

    db: Session,

    company_id: int,

    filters=None

):


    query = (

        db.query(

            Sale.payment_method.label(
                "method"
            ),


            func.count(

                Sale.id

            ).label(
                "orders"
            ),


            func.sum(

                Sale.total_amount

            ).label(
                "amount"
            )

        )


        .filter(

            Sale.company_id
            ==
            company_id

        )

    )



    query = apply_sales_filters(

        query,

        filters

    )



    query = (

        query

        .group_by(

            Sale.payment_method

        )

    )



    return [

        {


            "method":

                row.method,



            "orders":

                row.orders,



            "amount":

                float(

                    row.amount or 0

                )

        }


        for row in query.all()

    ]









# =====================================================
# SALES BY SALES CHANNEL
# =====================================================


def get_sales_by_channel(

    db: Session,

    company_id: int,

    filters=None

):


    query = (

        db.query(

            Sale.sales_channel.label(
                "channel"
            ),


            func.count(

                Sale.id

            ).label(
                "orders"
            ),


            func.sum(

                Sale.total_amount

            ).label(
                "revenue"
            )

        )


        .filter(

            Sale.company_id
            ==
            company_id

        )

    )



    query = apply_sales_filters(

        query,

        filters

    )



    query = (

        query

        .group_by(

            Sale.sales_channel

        )

    )



    return [

        {


            "channel":

                row.channel,



            "orders":

                row.orders,



            "revenue":

                float(

                    row.revenue or 0

                )

        }


        for row in query.all()

    ]


# =====================================================
# INVENTORY DISTRIBUTION BY CATEGORY
# =====================================================


def get_inventory_distribution(

    db: Session,

    company_id: int,

    filters=None

):


    query = (

        db.query(

            Category.name.label(
                "category"
            ),


            func.sum(

                Inventory.available_stock

            ).label(
                "quantity"
            )

        )


        .join(

            Product,

            Product.id
            ==
            Inventory.product_id

        )


        .join(

            Category,

            Category.id
            ==
            Product.category_id

        )


        .filter(

            Inventory.company_id
            ==
            company_id

        )

    )



    query = apply_product_filters(

        query,

        filters

    )



    query = (

        query

        .group_by(

            Category.name

        )

        .order_by(

            func.sum(

                Inventory.available_stock

            )

            .desc()

        )

    )



    return [

        {

            "category":

                row.category,


            "quantity":

                int(row.quantity or 0)

        }


        for row in query.all()

    ]









# =====================================================
# STOCK STATUS SUMMARY
# =====================================================


def get_stock_status_summary(

    db: Session,

    company_id: int,

    filters=None

):


    query = (

        db.query(

            Inventory.stock_status.label(
                "status"
            ),


            func.count(

                Inventory.id

            ).label(
                "count"
            )

        )


        .join(

            Product,

            Product.id
            ==
            Inventory.product_id

        )


        .join(

            Category,

            Category.id
            ==
            Product.category_id

        )


        .filter(

            Inventory.company_id
            ==
            company_id

        )

    )



    query = apply_product_filters(

        query,

        filters

    )



    query = (

        query

        .group_by(

            Inventory.stock_status

        )

    )



    return [

        {

            "status":

                row.status,


            "count":

                row.count

        }


        for row in query.all()

    ]



def get_inventory_value_by_category(

    db: Session,

    company_id: int,

    filters=None

):


    query = (

        db.query(

            Category.name.label(
                "category_name"
            ),


            func.sum(

                Inventory.available_stock
                *
                Product.unit_price

            ).label(
                "value"
            )

        )


        .join(

            Product,

            Product.id
            ==
            Inventory.product_id

        )


        .join(

            Category,

            Category.id
            ==
            Product.category_id

        )


        .filter(

            Inventory.company_id
            ==
            company_id

        )

    )



    query = apply_product_filters(

        query,

        filters

    )



    query = (

        query

        .group_by(

            Category.name

        )


        .order_by(

            func.sum(

                Inventory.available_stock
                *
                Product.unit_price

            )

            .desc()

        )

    )



    return [

        {

            "category_name":

                row.category_name,


            "value":

                float(

                    row.value or 0

                )

        }


        for row in query.all()

    ]








# =====================================================
# LOW STOCK PRODUCTS
# =====================================================


def get_low_stock_items(

    db: Session,

    company_id: int,

    filters=None

):


    query = (

        db.query(

            Product.id.label(
                "product_id"
            ),


            Product.name.label(
                "product_name"
            ),


            Product.sku.label(
                "sku"
            ),


            Product.brand.label(
                "brand"
            ),


            Inventory.available_stock.label(
                "available_stock"
            ),


            Inventory.reorder_level.label(
                "reorder_level"
            )

        )


        .join(

            Inventory,

            Inventory.product_id
            ==
            Product.id

        )


        .join(

            Category,

            Category.id
            ==
            Product.category_id

        )


        .filter(

            Inventory.company_id
            ==
            company_id,


            Inventory.stock_status
            ==
            "Low Stock"

        )

    )



    query = apply_product_filters(

        query,

        filters

    )



    results = query.all()



    return [

        {

            "product_id":

                row.product_id,


            "product_name":

                row.product_name,


            "sku":

                row.sku,


            "brand":

                row.brand,


            "available_stock":

                row.available_stock,


            "reorder_level":

                row.reorder_level

        }

        for row in results

    ]

# =====================================================
# OUT OF STOCK PRODUCTS
# =====================================================


def get_out_of_stock_items(

    db: Session,

    company_id: int,

    filters=None

):


    query = (

        db.query(

            Product.id.label(
                "product_id"
            ),


            Product.name.label(
                "product_name"
            ),


            Product.brand.label(
                "brand"
            ),


            Inventory.available_stock.label(
                "available_stock"
            )

        )


        .join(

            Inventory,

            Inventory.product_id
            ==
            Product.id

        )


        .join(

            Category,

            Category.id
            ==
            Product.category_id

        )


        .filter(

            Inventory.company_id
            ==
            company_id,


            Inventory.stock_status
            ==
            "Out Of Stock"

        )

    )



    query = apply_product_filters(

        query,

        filters

    )



    return [

        {

            "product_id":

                row.product_id,


            "product_name":

                row.product_name,


            "brand":

                row.brand,


            "available_stock":

                row.available_stock

        }


        for row in query.all()

    ]



# =====================================================
# END PART 3
# =====================================================


# =====================================================
# ANALYTICS UTIL HELPERS
# =====================================================


def safe_float(value):

    if value is None:

        return 0.0


    return float(value)





def safe_int(value):

    if value is None:

        return 0


    return int(value)






# =====================================================
# APPLY INVENTORY FILTERS
# =====================================================


def apply_inventory_filters(

    query,

    filters=None

):


    if not filters:

        return query



    if filters.get("product"):

        query = query.filter(

            Product.name.ilike(

                f"%{filters['product']}%"

            )

        )



    if filters.get("category"):

        query = query.filter(

            Category.name.ilike(

                f"%{filters['category']}%"

            )

        )



    if filters.get("brand"):

        query = query.filter(

            Product.brand.ilike(

                f"%{filters['brand']}%"

            )

        )



    return query







# =====================================================
# DASHBOARD FILTER VALIDATION
# =====================================================


def normalize_filters(filters):


    if not filters:

        return {}



    cleaned = {}



    for key, value in filters.items():


        if value not in [

            None,

            ""

        ]:

            cleaned[key] = value



    return cleaned







# =====================================================
# ANALYTICS EMPTY RESPONSE HANDLER
# =====================================================


def empty_list_response():

    return []







# =====================================================
# AUDIT LOG PAYLOAD
# =====================================================


def create_dashboard_audit_payload(

    user,

    action="Dashboard Viewed",

    export_type=None

):


    return {


        "company_id":

            user.company_id,


        "user_id":

            user.id,


        "action":

            action,


        "export_type":

            export_type


    }









# =====================================================
# FILTER SUMMARY GENERATOR
# =====================================================


def get_active_filters(filters=None):


    if not filters:

        return {}



    return {


        "from_date":

            filters.get(
                "from_date"
            ),


        "to_date":

            filters.get(
                "to_date"
            ),


        "product":

            filters.get(
                "product"
            ),


        "category":

            filters.get(
                "category"
            ),


        "brand":

            filters.get(
                "brand"
            ),


        "sales_channel":

            filters.get(
                "sales_channel"
            ),


        "payment_method":

            filters.get(
                "payment_method"
            )

    }









# =====================================================
# ANALYTICS HEALTH CHECK
# =====================================================


def analytics_health_check(

    db: Session,

    company_id:int

):


    sales_count = (

        db.query(

            Sale.id

        )

        .filter(

            Sale.company_id
            ==
            company_id

        )

        .count()

    )



    inventory_count = (

        db.query(

            Inventory.id

        )

        .filter(

            Inventory.company_id
            ==
            company_id

        )

        .count()

    )



    return {


        "sales_available":

            sales_count > 0,


        "inventory_available":

            inventory_count > 0,


        "sales_count":

            sales_count,


        "inventory_count":

            inventory_count

    }









# =====================================================
# KPI DETAIL SUPPORT
# =====================================================


def get_kpi_details(

    db: Session,

    company_id:int,

    kpi_type:str,

    filters=None

):


    filters = normalize_filters(

        filters

    )



    if kpi_type == "orders":


        query = (

            db.query(

                Sale

            )

            .filter(

                Sale.company_id
                ==
                company_id

            )

        )


        query = apply_sales_filters(

            query,

            filters

        )


        return query.all()



    elif kpi_type == "products":


        query = (

            db.query(

                SaleItem

            )

            .join(

                Sale,

                Sale.id
                ==
                SaleItem.sale_id

            )

            .filter(

                Sale.company_id
                ==
                company_id

            )

        )


        query = apply_sales_filters(

            query,

            filters

        )


        return query.all()



    return []






# =====================================================
# EXPORT DATA PREPARATION
# =====================================================


def prepare_export_payload(

    dashboard_data,

    export_type="CSV"

):


    return {


        "export_type":

            export_type,


        "generated_at":

            None,


        "data":

            dashboard_data

    }





# =====================================================
# END PART 4
# =====================================================


# =====================================================
# OUT OF STOCK PRODUCTS
# =====================================================


def get_out_of_stock_items(

    db: Session,

    company_id: int,

    filters=None

):


    query = (

        db.query(

            Product.id.label(
                "product_id"
            ),


            Product.name.label(
                "product_name"
            ),


            Product.brand.label(
                "brand"
            ),


            Inventory.available_stock.label(
                "available_stock"
            )

        )


        .join(

            Inventory,

            Inventory.product_id
            ==
            Product.id

        )


        .join(

            Category,

            Category.id
            ==
            Product.category_id

        )


        .filter(

            Inventory.company_id
            ==
            company_id,


            Inventory.stock_status
            ==
            "Out Of Stock"

        )

    )



    query = apply_product_filters(

        query,

        filters

    )



    return [

        {

            "product_id":

                row.product_id,


            "product_name":

                row.product_name,


            "brand":

                row.brand,


            "available_stock":

                row.available_stock

        }


        for row in query.all()

    ]





# =====================================================
# ANALYTICS SERVICE END
# =====================================================