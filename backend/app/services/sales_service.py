from datetime import datetime
from decimal import Decimal

from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload


from app.models.sale import Sale
from app.models.sale_item import SaleItem
from app.models.product import Product
from app.models.customer import Customer


from app.schemas.sale import (
    SaleCreate,
    SaleUpdate,
)


from app.services.audit_service import (
    create_audit_log,
)


from app.services.customer_service import (
    update_customer_purchase_summary,
    create_vip_notification,
)





# ==================================================
# CONSTANTS
# ==================================================

LOW_STOCK_LIMIT = 5





# ==================================================
# GENERATE INVOICE NUMBER
# ==================================================

def generate_invoice_number(
    db: Session,
    company_id: int,
):

    year = datetime.now().year


    last_invoice = (
        db.query(
            Sale.invoice_number
        )
        .filter(
            Sale.company_id == company_id,

            Sale.invoice_number.like(
                f"INV-{year}-%"
            ),
        )
        .order_by(
            Sale.id.desc()
        )
        .first()
    )


    if last_invoice:

        last_number = int(
            last_invoice[0]
            .split("-")[-1]
        )


        next_number = (
            last_number + 1
        )


    else:

        next_number = 1



    return (
        f"INV-{year}-{next_number:06d}"
    )







# ==================================================
# CALCULATE LINE TOTAL
# ==================================================

def calculate_line_total(
    unit_price: Decimal,
    quantity: int,
    discount: Decimal,
    tax: Decimal,
):


    subtotal = (
        unit_price *
        quantity
    )


    total = (
        subtotal
        - discount
        + tax
    )


    return total







# ==================================================
# STOCK VALIDATION
# ==================================================

def validate_stock(
    product: Product,
    quantity: int,
):


    if product.stock_quantity < quantity:


        raise ValueError(
            f"Insufficient stock for {product.name}"
        )









# ==================================================
# UPDATE STOCK STATUS
# ==================================================

def update_stock_status(
    product: Product,
):


    if product.stock_quantity <= 0:


        product.stock_quantity = 0


        product.status = (
            "OUT_OF_STOCK"
        )


    else:


        product.status = (
            "ACTIVE"
        )








# ==================================================
# FORMAT DECIMAL
# ==================================================

def format_decimal(
    value
):


    if value is None:

        return Decimal(
            "0.00"
        )


    return Decimal(
        str(value)
    )


    # ==================================================
# CREATE SALE
# ==================================================

def create_sale(
    db: Session,
    sale_data: SaleCreate,
    company_id: int,
    user_id: int,
):

    try:


        # ---------------------------------
        # Generate Invoice Number
        # ---------------------------------

        invoice_number = generate_invoice_number(
            db,
            company_id,
        )



        # ---------------------------------
        # Find Customer
        # ---------------------------------

        customer = (
            db.query(Customer)
            .filter(
                Customer.id == sale_data.customer_id,
                Customer.company_id == company_id,
            )
            .first()
        )



        if not customer:

            raise ValueError(
                "Customer not found"
            )





        # ---------------------------------
        # Create Sale Header
        # ---------------------------------

        sale = Sale(

            company_id=company_id,

            customer_id=customer.id,

            customer_name=customer.full_name,

            invoice_number=invoice_number,

            sales_channel=sale_data.sales_channel,

            payment_method=sale_data.payment_method,

            created_by=user_id,

            total_amount=Decimal(
                "0.00"
            ),

        )



        db.add(sale)


        db.flush()





        total_amount = Decimal(
            "0.00"
        )






        # ---------------------------------
        # Create Sale Items
        # ---------------------------------

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
                    "Product not found"
                )





            # Stock Check

            validate_stock(
                product,
                item.quantity,
            )






            # Calculate Total

            line_total = calculate_line_total(

                Decimal(
                    str(item.unit_price)
                ),

                item.quantity,


                Decimal(
                    str(item.discount or 0)
                ),


                Decimal(
                    str(item.tax or 0)
                ),

            )






            # Create Item

            sale_item = SaleItem(

                sale_id=sale.id,

                product_id=product.id,

                category_id=product.category_id,

                quantity=item.quantity,

                unit_price=item.unit_price,

                discount=item.discount,

                tax=item.tax,

                total=line_total,

            )



            db.add(sale_item)



            total_amount += line_total






            # ---------------------------------
            # Reduce Product Stock
            # ---------------------------------

            product.stock_quantity -= (
                item.quantity
            )



            update_stock_status(
                product
            )






        # ---------------------------------
        # Update Sale Total
        # ---------------------------------

        sale.total_amount = (
            total_amount
        )





        db.commit()


        db.refresh(sale)






        # ---------------------------------
        # CUSTOMER ANALYTICS UPDATE
        # ---------------------------------

        from app.services.customer_service import (
            sync_customer_sales_analytics
        )



        updated_customer = (
            sync_customer_sales_analytics(

                db=db,

                customer_id=customer.id,

            )
        )




        if updated_customer:


            create_vip_notification(

                db=db,

                customer=updated_customer,

            )





        update_customer_purchase_summary(

            db=db,

            customer_id=customer.id,

        )





        db.commit()






        # ---------------------------------
        # AUDIT LOG
        # ---------------------------------

        create_audit_log(

            db=db,

            company_id=company_id,

            user_id=user_id,

            action=f"Sale Created - {invoice_number}",

            entity_name="Sale",

        )



        db.commit()






        return sale





    except Exception:


        db.rollback()


        raise


    # ==================================================
# GET ALL SALES
# ==================================================

def get_sales(
    db: Session,
    company_id: int,
):


    return (

        db.query(Sale)

        .options(

            joinedload(
                Sale.items
            )
            .joinedload(
                SaleItem.product
            )

        )

        .filter(

            Sale.company_id == company_id

        )

        .order_by(

            Sale.sale_date.desc()

        )

        .all()

    )







# ==================================================
# GET SALE BY ID
# ==================================================

def get_sale(
    db: Session,
    sale_id: int,
    company_id: int,
):


    sale = (

        db.query(Sale)

        .options(

            joinedload(
                Sale.items
            )
            .joinedload(
                SaleItem.product
            )

        )

        .filter(

            Sale.id == sale_id,

            Sale.company_id == company_id,

        )

        .first()

    )



    if not sale:


        raise ValueError(
            "Sale not found"
        )



    return sale







# ==================================================
# SEARCH SALES
# ==================================================

def search_sales(
    db: Session,
    company_id: int,
    keyword: str,
):


    search = (
        f"%{keyword}%"
    )



    return (

        db.query(Sale)

        .join(
            SaleItem
        )

        .join(
            Product
        )

        .options(

            joinedload(
                Sale.items
            )
            .joinedload(
                SaleItem.product
            )

        )

        .filter(

            Sale.company_id == company_id

        )

        .filter(


            (Sale.invoice_number.ilike(search))


            |


            (Sale.customer_name.ilike(search))


            |


            (Product.name.ilike(search))


        )

        .distinct()


        .order_by(

            Sale.sale_date.desc()

        )


        .all()

    )









# ==================================================
# FILTER SALES
# ==================================================

def filter_sales(
    db: Session,
    company_id: int,
    start_date=None,
    end_date=None,
    category_id=None,
    sales_channel=None,
    payment_method=None,
):


    query = (


        db.query(Sale)


        .join(
            SaleItem
        )


        .options(

            joinedload(
                Sale.items
            )
            .joinedload(
                SaleItem.product
            )

        )


        .filter(

            Sale.company_id == company_id

        )

    )






    # Date Filter

    if start_date:


        query = query.filter(

            Sale.sale_date >= start_date

        )





    if end_date:


        query = query.filter(

            Sale.sale_date <= end_date

        )







    # Category Filter

    if category_id:


        query = query.filter(

            SaleItem.category_id == category_id

        )







    # Channel Filter

    if sales_channel:


        query = query.filter(

            Sale.sales_channel == sales_channel

        )








    # Payment Filter

    if payment_method:


        query = query.filter(

            Sale.payment_method == payment_method

        )






    return (

        query

        .distinct()

        .order_by(

            Sale.sale_date.desc()

        )

        .all()

    )


# ==================================================
# SORT SALES
# ==================================================

def sort_sales(
    db: Session,
    company_id: int,
    sort_by: str = "sale_date",
    order: str = "desc",
):


    query = (

        db.query(Sale)

        .options(

            joinedload(
                Sale.items
            )
            .joinedload(
                SaleItem.product
            )

        )

        .filter(

            Sale.company_id == company_id

        )

    )




    sort_columns = {


        "sale_date":

            Sale.sale_date,



        "invoice_number":

            Sale.invoice_number,



        "total_amount":

            Sale.total_amount,


    }





    column = sort_columns.get(

        sort_by,

        Sale.sale_date

    )






    if order.lower() == "asc":


        query = query.order_by(

            column.asc()

        )


    else:


        query = query.order_by(

            column.desc()

        )





    return query.all()











# ==================================================
# SALES DASHBOARD SUMMARY
# ==================================================

def get_dashboard_summary(
    db: Session,
    company_id: int,
):


    # ---------------------------------
    # Total Orders
    # ---------------------------------

    total_orders = (

        db.query(

            func.count(
                Sale.id
            )

        )

        .filter(

            Sale.company_id == company_id

        )

        .scalar()

        or 0

    )







    # ---------------------------------
    # Total Revenue
    # ---------------------------------

    total_revenue = (

        db.query(

            func.coalesce(

                func.sum(
                    Sale.total_amount
                ),

                0

            )

        )

        .filter(

            Sale.company_id == company_id

        )

        .scalar()


        or Decimal(
            "0.00"
        )

    )







    # ---------------------------------
    # Average Order Value
    # ---------------------------------

    average_order_value = (


        total_revenue / total_orders


        if total_orders > 0


        else Decimal(
            "0.00"
        )


    )







    # ---------------------------------
    # Total Quantity Sold
    # ---------------------------------

    total_quantity = (

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

            Sale.id == SaleItem.sale_id

        )


        .filter(

            Sale.company_id == company_id

        )


        .scalar()


        or 0

    )








    return {


        "total_sales":

            total_quantity,



        "total_revenue":

            float(
                total_revenue
            ),



        "total_orders":

            total_orders,



        "average_order_value":

            float(
                average_order_value
            ),


    }









# ==================================================
# GET TOTAL SALES AMOUNT
# ==================================================

def get_total_sales_amount(
    db: Session,
    company_id: int,
):


    revenue = (

        db.query(

            func.coalesce(

                func.sum(
                    Sale.total_amount
                ),

                0

            )

        )

        .filter(

            Sale.company_id == company_id

        )

        .scalar()


        or 0

    )



    return Decimal(
        str(revenue)
    )


    # ==================================================
# LOW STOCK PRODUCTS
# ==================================================

def get_low_stock_products(
    db: Session,
    company_id: int,
    threshold: int = LOW_STOCK_LIMIT,
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








# ==================================================
# OUT OF STOCK PRODUCTS
# ==================================================

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









# ==================================================
# GET REMAINING STOCK
# ==================================================

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


        "product_id":

            product.id,



        "product_name":

            product.name,



        "remaining_stock":

            product.stock_quantity,



        "status":

            product.status,


    }









# ==================================================
# GET SALES BY CUSTOMER
# ==================================================

def get_customer_sales(
    db: Session,
    customer_id: int,
    company_id: int,
):


    return (

        db.query(Sale)


        .options(

            joinedload(

                Sale.items

            )

            .joinedload(

                SaleItem.product

            )

        )


        .filter(

            Sale.customer_id == customer_id,

            Sale.company_id == company_id,

        )


        .order_by(

            Sale.sale_date.desc()

        )


        .all()

    )









# ==================================================
# GET SALES COUNT
# ==================================================

def get_sales_count(
    db: Session,
    company_id: int,
):


    count = (

        db.query(

            func.count(
                Sale.id
            )

        )


        .filter(

            Sale.company_id == company_id

        )


        .scalar()


        or 0

    )


    return count


    # ==================================================
# SYNC CUSTOMER SALES ANALYTICS
# ==================================================

def sync_customer_sales_analytics(
    db: Session,
    customer_id: int,
):


    customer = (

        db.query(Customer)

        .filter(

            Customer.id == customer_id

        )

        .first()

    )




    if not customer:


        return None







    # ---------------------------------
    # Lifetime Revenue
    # ---------------------------------

    total_purchase = (

        db.query(

            func.coalesce(

                func.sum(
                    Sale.total_amount
                ),

                0

            )

        )

        .filter(

            Sale.customer_id == customer_id

        )

        .scalar()


        or 0

    )






    # ---------------------------------
    # Total Orders
    # ---------------------------------

    total_orders = (

        db.query(

            func.count(
                Sale.id
            )

        )

        .filter(

            Sale.customer_id == customer_id

        )

        .scalar()


        or 0

    )






    revenue = Decimal(
        str(total_purchase)
    )





    



    # Used in dashboard

    customer.lifetime_revenue = revenue



    customer.total_orders = (
        total_orders
    )



    customer.purchase_frequency = (
        total_orders
    )







    # ---------------------------------
    # Average Order Value
    # ---------------------------------

    if total_orders > 0:


        customer.average_order_value = (

            revenue /

            Decimal(
                str(total_orders)
            )

        )


    else:


        customer.average_order_value = Decimal(
            "0.00"
        )








    # ---------------------------------
    # Customer Segment
    # ---------------------------------

    if revenue >= Decimal("50000"):


        customer.customer_segment = (
            "VIP"
        )


    elif revenue >= Decimal("10000"):


        customer.customer_segment = (
            "Loyal"
        )


    elif total_orders > 1:


        customer.customer_segment = (
            "Regular"
        )


    else:


        customer.customer_segment = (
            "New"
        )







    db.commit()


    db.refresh(customer)



    return customer












# ==================================================
# TOP CUSTOMERS
# ==================================================

def get_top_customers(
    db: Session,
    company_id: int,
    limit: int = 10,
):


    customers = (

        db.query(

            Customer.id,

            Customer.customer_id,

            Customer.full_name,

            Customer.customer_segment,

            func.sum(
                Sale.total_amount
            )
            .label(
                "revenue"
            ),


            func.count(
                Sale.id
            )
            .label(
                "orders"
            )

        )


        .join(

            Sale,

            Sale.customer_id == Customer.id

        )


        .filter(

            Customer.company_id == company_id

        )


        .group_by(

            Customer.id

        )


        .order_by(

            func.sum(
                Sale.total_amount
            )
            .desc()

        )


        .limit(limit)


        .all()

    )







    result = []





    for customer in customers:


        result.append({


            "id":

                customer.id,



            "customer_id":

                customer.customer_id,



            "customer_name":

                customer.full_name,



            "total_orders":

                customer.orders,



            "lifetime_revenue":

                float(
                    customer.revenue or 0
                ),



            "customer_segment":

                customer.customer_segment,


        })





    return result


# ==================================================
# UPDATE SALE
# ==================================================

def update_sale(
    db: Session,
    sale_id: int,
    sale_data: SaleUpdate,
    company_id: int,
    user_id: int,
):

    try:

        sale = (
            db.query(Sale)
            .options(
                joinedload(
                    Sale.items
                )
            )
            .filter(
                Sale.id == sale_id,
                Sale.company_id == company_id,
            )
            .first()
        )


        if not sale:

            raise ValueError(
                "Sale not found"
            )


        old_customer_id = sale.customer_id



        # ---------------------------------
        # Restore Previous Stock
        # ---------------------------------

        for old_item in sale.items:

            product = (
                db.query(Product)
                .filter(
                    Product.id == old_item.product_id,
                    Product.company_id == company_id,
                )
                .first()
            )


            if product:

                product.stock_quantity += (
                    old_item.quantity
                )


                update_stock_status(
                    product
                )



        # ---------------------------------
        # Remove Old Items
        # ---------------------------------

        for old_item in sale.items:

            db.delete(old_item)


        db.flush()



        # ---------------------------------
        # Update Sale Header
        # ---------------------------------

        if sale_data.customer_id:


            customer = (
                db.query(Customer)
                .filter(
                    Customer.id == sale_data.customer_id,
                    Customer.company_id == company_id,
                )
                .first()
            )


            if not customer:

                raise ValueError(
                    "Customer not found"
                )


            sale.customer_id = (
                customer.id
            )


            sale.customer_name = (
                customer.full_name
            )



        if sale_data.sales_channel:

            sale.sales_channel = (
                sale_data.sales_channel
            )



        if sale_data.payment_method:

            sale.payment_method = (
                sale_data.payment_method
            )



        total_amount = Decimal(
            "0.00"
        )



        # ---------------------------------
        # Create New Items
        # ---------------------------------

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
                    "Product not found"
                )



            validate_stock(
                product,
                item.quantity
            )



            line_total = calculate_line_total(

                Decimal(
                    str(item.unit_price)
                ),

                item.quantity,

                Decimal(
                    str(item.discount or 0)
                ),

                Decimal(
                    str(item.tax or 0)
                ),

            )



            sale_item = SaleItem(

                sale_id=sale.id,

                product_id=product.id,

                category_id=product.category_id,

                quantity=item.quantity,

                unit_price=item.unit_price,

                discount=item.discount,

                tax=item.tax,

                total=line_total,

            )


            db.add(
                sale_item
            )


            total_amount += (
                line_total
            )



            # Reduce Stock

            product.stock_quantity -= (
                item.quantity
            )


            update_stock_status(
                product
            )



        sale.total_amount = (
            total_amount
        )



        db.commit()

        db.refresh(
            sale
        )



        # ---------------------------------
        # Refresh Customer Analytics
        # ---------------------------------

        if old_customer_id:

            sync_customer_sales_analytics(
                db,
                old_customer_id
            )


        if sale.customer_id:

            sync_customer_sales_analytics(
                db,
                sale.customer_id
            )



        # ---------------------------------
        # Audit Log
        # ---------------------------------

        create_audit_log(

            db=db,

            company_id=company_id,

            user_id=user_id,

            action=f"Sale Updated - {sale.invoice_number}",

            entity_name="Sale",

        )


        db.commit()


        return sale



    except Exception:

        db.rollback()

        raise


    # ==================================================
# DELETE SALE
# ==================================================

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
                joinedload(
                    Sale.items
                )
            )
            .filter(
                Sale.id == sale_id,
                Sale.company_id == company_id,
            )
            .first()
        )


        if not sale:

            raise ValueError(
                "Sale not found"
            )



        customer_id = sale.customer_id

        invoice_number = sale.invoice_number



        # ---------------------------------
        # Restore Stock
        # ---------------------------------

        for item in sale.items:


            product = (
                db.query(Product)
                .filter(
                    Product.id == item.product_id,
                    Product.company_id == company_id,
                )
                .first()
            )


            if product:


                product.stock_quantity += (
                    item.quantity
                )


                update_stock_status(
                    product
                )



        # ---------------------------------
        # Delete Sale Items
        # ---------------------------------

        for item in sale.items:

            db.delete(item)



        # ---------------------------------
        # Delete Sale
        # ---------------------------------

        db.delete(
            sale
        )


        db.commit()



        # ---------------------------------
        # Refresh Customer Analytics
        # ---------------------------------

        if customer_id:


            sync_customer_sales_analytics(
                db,
                customer_id
            )


            update_customer_purchase_summary(
                db=db,
                customer_id=customer_id,
            )



        # ---------------------------------
        # Audit Log
        # ---------------------------------

        create_audit_log(

            db=db,

            company_id=company_id,

            user_id=user_id,

            action=f"Sale Deleted - {invoice_number}",

            entity_name="Sale",

        )


        db.commit()



        return {

            "message":
            "Sale deleted successfully"

        }



    except Exception:

        db.rollback()

        raise





# ==================================================
# VALIDATE SALE ITEMS
# ==================================================

def validate_sale_items(
    sale_data: SaleCreate,
):


    if not sale_data.items:

        raise ValueError(
            "Sale must contain items"
        )



    for item in sale_data.items:


        if item.quantity <= 0:

            raise ValueError(
                "Quantity must be greater than zero"
            )



        if item.unit_price < 0:

            raise ValueError(
                "Unit price cannot be negative"
            )



        if item.discount < 0:

            raise ValueError(
                "Discount cannot be negative"
            )



        if item.tax < 0:

            raise ValueError(
                "Tax cannot be negative"
            )



    return True





# ==================================================
# TOTAL SALES AMOUNT
# ==================================================

def get_total_sales_amount(
    db: Session,
    company_id: int,
):


    amount = (

        db.query(
            func.coalesce(
                func.sum(
                    Sale.total_amount
                ),
                0
            )
        )

        .filter(
            Sale.company_id == company_id
        )

        .scalar()

    )


    return Decimal(
        str(amount or 0)
    )





# ==================================================
# TODAY SALES
# ==================================================

def get_today_sales(
    db: Session,
    company_id: int,
):


    today = datetime.now().date()


    return (

        db.query(Sale)

        .filter(

            Sale.company_id == company_id,

            func.date(
                Sale.sale_date
            ) == today

        )

        .order_by(
            Sale.sale_date.desc()
        )

        .all()

    )





# ==================================================
# TOP CUSTOMERS
# ==================================================

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


        revenue = (

            db.query(
                func.sum(
                    Sale.total_amount
                )
            )

            .filter(

                Sale.company_id == company_id,

                Sale.customer_id == customer.id,

            )

            .scalar()

            or 0

        )



        orders = (

            db.query(
                func.count(
                    Sale.id
                )
            )

            .filter(

                Sale.company_id == company_id,

                Sale.customer_id == customer.id,

            )

            .scalar()

            or 0

        )



        if orders > 0:


            result.append({

                "id":
                customer.id,


                "customer_id":
                customer.customer_id,


                "customer_name":
                customer.full_name,


                "total_orders":
                orders,


                "lifetime_revenue":
                float(revenue),


                "customer_segment":
                customer.customer_segment

            })



    result.sort(

        key=lambda x:
        x["lifetime_revenue"],

        reverse=True

    )


    return result[:limit]