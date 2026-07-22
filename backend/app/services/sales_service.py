from datetime import datetime
from decimal import Decimal

from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.models.sale import Sale
from app.models.sale_item import SaleItem
from app.models.product import Product

from app.schemas.sale import SaleCreate

from app.services.audit_service import create_audit_log



# ==========================================
# Generate Invoice Number
# ==========================================

def generate_invoice_number(
    db: Session,
    company_id: int,
):

    year = datetime.now().year


    count = (
        db.query(Sale)
        .filter(
            Sale.company_id == company_id
        )
        .count()
    )


    next_number = count + 1


    return (
        f"INV-{year}-{next_number:06d}"
    )



# ==========================================
# Create Sale
# ==========================================

def create_sale(
    db: Session,
    sale_data: SaleCreate,
    company_id: int,
    user_id: int,
):


    invoice_number = generate_invoice_number(
        db,
        company_id
    )


    total_amount = Decimal("0.00")



    sale = Sale(

        company_id=company_id,

        invoice_number=invoice_number,

        customer_name=sale_data.customer_name,

        sales_channel=sale_data.sales_channel,

        payment_method=sale_data.payment_method,

        created_by=user_id,

    )


    db.add(sale)

    db.flush()



    for item in sale_data.items:


        product = (
            db.query(Product)
            .filter(
                Product.id == item.product_id,
                Product.company_id == company_id
            )
            .first()
        )


        if not product:

            raise ValueError(
                "Product not found"
            )



        if product.stock_quantity < item.quantity:

            raise ValueError(
                f"Insufficient stock for {product.name}"
            )



        product_total = (
            item.unit_price *
            item.quantity
        )



        line_total = (
            product_total
            -
            item.discount
            +
            item.tax
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


        db.add(sale_item)



        total_amount += line_total



        # Reduce Stock

        product.stock_quantity -= item.quantity



        # Stock Status Update

        if product.stock_quantity <= 0:


            product.stock_quantity = 0

            product.status = "OUT_OF_STOCK"



        elif product.stock_quantity <= 5:


            create_audit_log(

                db=db,

                company_id=company_id,

                user_id=user_id,

                action=f"Low Stock Alert - {product.name}"

            )



        create_audit_log(

            db=db,

            company_id=company_id,

            user_id=user_id,

            action=f"Inventory Updated - {product.name}"

        )



    sale.total_amount = total_amount


    db.commit()


    db.refresh(sale)



    create_audit_log(

        db=db,

        company_id=company_id,

        user_id=user_id,

        action=f"Sale Created - {invoice_number}"

    )


    return sale



# ==========================================
# Get All Sales
# ==========================================

def get_sales(
    db: Session,
    company_id: int,
):

    return (

        db.query(Sale)

        .options(

            joinedload(Sale.items)

            .joinedload(SaleItem.product)

        )

        .filter(

            Sale.company_id == company_id

        )

        .order_by(

            Sale.sale_date.desc()

        )

        .all()

    )

    # ==========================================
# Get Sale By ID
# ==========================================

def get_sale(
    db: Session,
    sale_id: int,
    company_id: int,
):


    sale = (

        db.query(Sale)

        .options(

            joinedload(Sale.items)

            .joinedload(SaleItem.product)

        )

        .filter(

            Sale.id == sale_id,

            Sale.company_id == company_id

        )

        .first()

    )


    if not sale:

        raise ValueError(
            "Sale not found"
        )


    return sale





# ==========================================
# Search Sales
# ==========================================

def search_sales(
    db: Session,
    company_id: int,
    keyword: str,
):


    return (

        db.query(Sale)

        .join(SaleItem)

        .join(Product)

        .options(

            joinedload(Sale.items)

            .joinedload(SaleItem.product)

        )

        .filter(

            Sale.company_id == company_id

        )

        .filter(

            (Sale.invoice_number.ilike(
                f"%{keyword}%"
            ))

            |

            (Sale.customer_name.ilike(
                f"%{keyword}%"
            ))

            |

            (Product.name.ilike(
                f"%{keyword}%"
            ))

        )

        .distinct()

        .order_by(

            Sale.sale_date.desc()

        )

        .all()

    )





# ==========================================
# Filter Sales
# ==========================================

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

        .join(SaleItem)

        .options(

            joinedload(Sale.items)

            .joinedload(SaleItem.product)

        )

        .filter(

            Sale.company_id == company_id

        )

    )



    if start_date:

        query = query.filter(

            Sale.sale_date >= start_date

        )



    if end_date:

        query = query.filter(

            Sale.sale_date <= end_date

        )



    if category_id:

        query = query.filter(

            SaleItem.category_id == category_id

        )



    if sales_channel:

        query = query.filter(

            Sale.sales_channel == sales_channel

        )



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





# ==========================================
# Sort Sales
# ==========================================

def sort_sales(
    db: Session,
    company_id: int,
    sort_by="sale_date",
    order="desc",
):


    query = (

        db.query(Sale)

        .options(

            joinedload(Sale.items)

            .joinedload(SaleItem.product)

        )

        .filter(

            Sale.company_id == company_id

        )

    )



    columns = {

        "sale_date": Sale.sale_date,

        "invoice_number": Sale.invoice_number,

        "total_amount": Sale.total_amount,

    }



    column = columns.get(

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

# ==========================================
# Update Sale
# ==========================================

def update_sale(
    db: Session,
    sale_id: int,
    sale_data: SaleCreate,
    company_id: int,
    user_id: int,
):


    sale = (

        db.query(Sale)

        .filter(

            Sale.id == sale_id,

            Sale.company_id == company_id

        )

        .first()

    )



    if not sale:

        raise ValueError(
            "Sale not found"
        )




    # Restore previous stock

    old_items = (

        db.query(SaleItem)

        .filter(

            SaleItem.sale_id == sale.id

        )

        .all()

    )



    for old_item in old_items:


        product = (

            db.query(Product)

            .filter(

                Product.id == old_item.product_id

            )

            .first()

        )


        if product:

            product.stock_quantity += old_item.quantity


            if product.stock_quantity > 0:

                product.status = "ACTIVE"




    db.query(SaleItem).filter(

        SaleItem.sale_id == sale.id

    ).delete()



    sale.customer_name = sale_data.customer_name

    sale.sales_channel = sale_data.sales_channel

    sale.payment_method = sale_data.payment_method



    total_amount = Decimal("0.00")




    for item in sale_data.items:


        product = (

            db.query(Product)

            .filter(

                Product.id == item.product_id,

                Product.company_id == company_id

            )

            .first()

        )



        if not product:

            raise ValueError(
                "Product not found"
            )



        if product.stock_quantity < item.quantity:

            raise ValueError(
                f"Insufficient stock for {product.name}"
            )



        product_total = (

            item.unit_price *

            item.quantity

        )



        line_total = (

            product_total

            -

            item.discount

            +

            item.tax

        )



        sale_item = SaleItem(

            sale_id=sale.id,

            product_id=product.id,

            category_id=product.category_id,

            quantity=item.quantity,

            unit_price=item.unit_price,

            discount=item.discount,

            tax=item.tax,

            total=line_total

        )



        db.add(sale_item)



        product.stock_quantity -= item.quantity



        if product.stock_quantity <= 0:


            product.stock_quantity = 0

            product.status = "OUT_OF_STOCK"



        elif product.stock_quantity <= 5:


            product.status = "ACTIVE"



        total_amount += line_total




    sale.total_amount = total_amount



    db.commit()


    db.refresh(sale)



    create_audit_log(

        db=db,

        company_id=company_id,

        user_id=user_id,

        action=f"Sale Updated - {sale.invoice_number}"

    )



    return sale





# ==========================================
# Delete Sale
# ==========================================

def delete_sale(
    db: Session,
    sale_id: int,
    company_id: int,
    user_id: int,
):


    try:


        sale = (

            db.query(Sale)

            .filter(

                Sale.id == sale_id,

                Sale.company_id == company_id

            )

            .first()

        )



        if not sale:

            raise ValueError(
                "Sale not found"
            )



        items = (

            db.query(SaleItem)

            .filter(

                SaleItem.sale_id == sale.id

            )

            .all()

        )



        for item in items:


            product = (

                db.query(Product)

                .filter(

                    Product.id == item.product_id,

                    Product.company_id == company_id

                )

                .first()

            )



            if product:


                product.stock_quantity += item.quantity



                if product.stock_quantity > 0:

                    product.status = "ACTIVE"



                create_audit_log(

                    db=db,

                    company_id=company_id,

                    user_id=user_id,

                    action=f"Stock Restored - {product.name}"

                )



        invoice = sale.invoice_number



        db.delete(sale)


        db.commit()



        create_audit_log(

            db=db,

            company_id=company_id,

            user_id=user_id,

            action=f"Sale Deleted - {invoice}"

        )



        return {

            "message":
            "Sale deleted successfully"

        }



    except Exception as e:


        db.rollback()

        raise e

    # ==========================================
# Sales Dashboard Summary
# ==========================================

def get_dashboard_summary(
    db: Session,
    company_id: int,
):


    total_orders = (

        db.query(Sale)

        .filter(

            Sale.company_id == company_id

        )

        .count()

    )



    total_revenue = (

        db.query(

            func.sum(

                Sale.total_amount

            )

        )

        .filter(

            Sale.company_id == company_id

        )

        .scalar()

        or Decimal("0.00")

    )



    average_order_value = (

        total_revenue / total_orders

        if total_orders

        else Decimal("0.00")

    )



    return {

        "total_sales":
        total_revenue,


        "total_revenue":
        total_revenue,


        "total_orders":
        total_orders,


        "average_order_value":
        average_order_value

    }





# ==========================================
# Low Stock Products
# ==========================================

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

            Product.stock_quantity > 0

        )

        .order_by(

            Product.stock_quantity.asc()

        )

        .all()

    )





# ==========================================
# Out Of Stock Products
# ==========================================

def get_out_of_stock_products(
    db: Session,
    company_id: int,
):


    return (

        db.query(Product)

        .filter(

            Product.company_id == company_id,

            Product.stock_quantity == 0

        )

        .order_by(

            Product.name.asc()

        )

        .all()

    )





# ==========================================
# Remaining Stock
# ==========================================

def get_remaining_stock(
    db: Session,
    product_id: int,
    company_id: int,
):


    product = (

        db.query(Product)

        .filter(

            Product.id == product_id,

            Product.company_id == company_id

        )

        .first()

    )



    if not product:


        raise ValueError(

            "Product not found"

        )



    return {

        "product":
        product.name,


        "remaining_stock":
        product.stock_quantity,


        "status":
        product.status

    }