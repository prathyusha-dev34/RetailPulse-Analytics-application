from sqlalchemy import func, asc, desc
from sqlalchemy.orm import Session

from app.models.inventory import Inventory
from app.models.inventory_movement import InventoryMovement
from app.models.product import Product
from app.models.user import User
from app.models.notification import Notification

from app.services.audit_service import create_audit_log


# =====================================
# Stock Status Calculation
# =====================================

def calculate_stock_status(
    available_stock: int,
    reorder_level: int,
):
    if available_stock == 0:
        return "Out of Stock"

    if available_stock <= reorder_level:
        return "Low Stock"

    return "In Stock"



# =====================================
# Notification Helper
# =====================================

def create_inventory_notification(
    db: Session,
    inventory: Inventory,
    current_user: User,
    title: str,
    message: str,
    notification_type: str,
):

    notification = Notification(
        company_id=current_user.company_id,
        user_id=current_user.id,
        title=title,
        message=message,
        notification_type=notification_type,
        is_read=False,
    )

    db.add(notification)



# =====================================
# Create Inventory
# =====================================

def create_inventory(
    db: Session,
    product: Product,
):

    inventory = Inventory(

        company_id=product.company_id,

        product_id=product.id,

        current_stock=product.stock_quantity,

        reserved_stock=0,

        available_stock=product.stock_quantity,

        reorder_level=10,

        stock_status=calculate_stock_status(
            product.stock_quantity,
            10,
        ),
    )


    db.add(inventory)

    db.commit()

    db.refresh(inventory)


    return inventory



# =====================================
# Get Inventory
# =====================================

def get_inventory(
    db: Session,
    current_user: User,
):

    return (
        db.query(Inventory)
        .join(Product)
        .filter(
            Inventory.company_id
            == current_user.company_id
        )
        .all()
    )



# =====================================
# Get Single Inventory
# =====================================

def get_inventory_item(
    db: Session,
    inventory_id: int,
    current_user: User,
):

    return (
        db.query(Inventory)
        .filter(
            Inventory.id == inventory_id,
            Inventory.company_id
            == current_user.company_id,
        )
        .first()
    )



# =====================================
# Dashboard Summary
# =====================================

def get_dashboard_summary(
    db: Session,
    current_user: User,
):

    total_products = (
        db.query(Product)
        .filter(
            Product.company_id
            == current_user.company_id
        )
        .count()
    )


    total_inventory = (
        db.query(
            func.sum(
                Inventory.current_stock
            )
        )
        .filter(
            Inventory.company_id
            == current_user.company_id
        )
        .scalar()
        or 0
    )


    low_stock = (
        db.query(Inventory)
        .filter(
            Inventory.company_id
            == current_user.company_id,

            Inventory.stock_status
            == "Low Stock",
        )
        .count()
    )


    out_of_stock = (
        db.query(Inventory)
        .filter(
            Inventory.company_id
            == current_user.company_id,

            Inventory.stock_status
            == "Out of Stock",
        )
        .count()
    )


    return {

        "total_products": total_products,

        "total_inventory_quantity":
            total_inventory,

        "low_stock_products":
            low_stock,

        "out_of_stock_products":
            out_of_stock,

    }

# =====================================
# Add Stock
# =====================================

def add_stock(
    db: Session,
    inventory_id: int,
    quantity: int,
    reason: str,
    remarks: str,
    current_user: User,
):

    inventory = get_inventory_item(
        db,
        inventory_id,
        current_user,
    )


    if not inventory:
        return None


    if quantity <= 0:
        raise ValueError(
            "Quantity must be greater than zero."
        )


    if not reason.strip():
        raise ValueError(
            "Reason is required."
        )


    previous_quantity = inventory.current_stock


    inventory.current_stock += quantity


    inventory.available_stock = (
        inventory.current_stock
        -
        inventory.reserved_stock
    )


    old_status = inventory.stock_status


    inventory.stock_status = calculate_stock_status(
        inventory.available_stock,
        inventory.reorder_level,
    )



    # ===============================
    # Movement Record
    # ===============================

    movement = InventoryMovement(

        inventory_id=inventory.id,

        movement_type="Stock Addition",

        quantity_changed=quantity,

        previous_quantity=previous_quantity,

        updated_quantity=inventory.current_stock,

        reason=reason,

        remarks=remarks,

        performed_by=current_user.id,
    )


    db.add(movement)



    # ===============================
    # Audit Log
    # ===============================

    create_audit_log(

        db=db,

        company_id=current_user.company_id,

        user_id=current_user.id,

        action="Stock Added",

    )



    # ===============================
    # Notification
    # ===============================

    if old_status != inventory.stock_status:


        if inventory.stock_status == "Low Stock":

            create_inventory_notification(

                db=db,

                inventory=inventory,

                current_user=current_user,

                title="Low Stock Alert",

                message=
                f"{inventory.product.name} reached low stock level.",

                notification_type="LOW_STOCK",

            )


        elif inventory.stock_status == "Out of Stock":


            create_inventory_notification(

                db=db,

                inventory=inventory,

                current_user=current_user,

                title="Out of Stock Alert",

                message=
                f"{inventory.product.name} is out of stock.",

                notification_type="OUT_OF_STOCK",

            )



    # Manual stock adjustment notification

    create_inventory_notification(

        db=db,

        inventory=inventory,

        current_user=current_user,

        title="Stock Added",

        message=
        f"{quantity} units added for {inventory.product.name}.",

        notification_type="STOCK_ADDITION",

    )



    db.commit()

    db.refresh(inventory)


    return inventory


# =====================================
# Remove Stock
# =====================================

def remove_stock(
    db: Session,
    inventory_id: int,
    quantity: int,
    reason: str,
    remarks: str,
    current_user: User,
):

    inventory = get_inventory_item(
        db,
        inventory_id,
        current_user,
    )


    if not inventory:
        return None



    if quantity <= 0:
        raise ValueError(
            "Quantity must be greater than zero."
        )


    if quantity > inventory.available_stock:
        raise ValueError(
            "Stock Out quantity cannot exceed available stock."
        )


    if not reason.strip():
        raise ValueError(
            "Reason is required."
        )


    previous_quantity = inventory.current_stock



    inventory.current_stock -= quantity



    inventory.available_stock = (
        inventory.current_stock
        -
        inventory.reserved_stock
    )


    old_status = inventory.stock_status



    inventory.stock_status = calculate_stock_status(
        inventory.available_stock,
        inventory.reorder_level,
    )



    # Movement History

    movement = InventoryMovement(

        inventory_id=inventory.id,

        movement_type="Stock Removal",

        quantity_changed=quantity,

        previous_quantity=previous_quantity,

        updated_quantity=inventory.current_stock,

        reason=reason,

        remarks=remarks,

        performed_by=current_user.id,

    )


    db.add(movement)



    # Audit

    create_audit_log(

        db=db,

        company_id=current_user.company_id,

        user_id=current_user.id,

        action="Stock Removed",

    )



    # Status Notifications

    if old_status != inventory.stock_status:


        if inventory.stock_status == "Low Stock":


            create_inventory_notification(

                db=db,

                inventory=inventory,

                current_user=current_user,

                title="Low Stock Alert",

                message=
                f"{inventory.product.name} stock is low.",

                notification_type="LOW_STOCK",

            )



        elif inventory.stock_status == "Out of Stock":


            create_inventory_notification(

                db=db,

                inventory=inventory,

                current_user=current_user,

                title="Out of Stock Alert",

                message=
                f"{inventory.product.name} is out of stock.",

                notification_type="OUT_OF_STOCK",

            )



    # Stock Removal Notification

    create_inventory_notification(

        db=db,

        inventory=inventory,

        current_user=current_user,

        title="Stock Removed",

        message=
        f"{quantity} units removed from {inventory.product.name}.",

        notification_type="STOCK_REMOVAL",

    )



    db.commit()

    db.refresh(inventory)


    return inventory





# =====================================
# Manual Stock Adjustment
# =====================================

def adjust_stock(
    db: Session,
    inventory_id: int,
    quantity: int,
    reason: str,
    remarks: str,
    current_user: User,
):


    inventory = get_inventory_item(
        db,
        inventory_id,
        current_user,
    )



    if not inventory:
        return None



    if quantity < 0:

        raise ValueError(
            "Stock quantity cannot become negative."
        )



    if not reason.strip():

        raise ValueError(
            "Reason is required."
        )



    previous_quantity = inventory.current_stock



    inventory.current_stock = quantity



    inventory.available_stock = (
        inventory.current_stock
        -
        inventory.reserved_stock
    )



    old_status = inventory.stock_status



    inventory.stock_status = calculate_stock_status(

        inventory.available_stock,

        inventory.reorder_level,

    )



    # Movement

    movement = InventoryMovement(

        inventory_id=inventory.id,

        movement_type="Manual Adjustment",

        quantity_changed=
            quantity - previous_quantity,

        previous_quantity=previous_quantity,

        updated_quantity=quantity,

        reason=reason,

        remarks=remarks,

        performed_by=current_user.id,

    )


    db.add(movement)



    # Audit

    create_audit_log(

        db=db,

        company_id=current_user.company_id,

        user_id=current_user.id,

        action="Stock Adjusted",

    )



    # Adjustment Notification

    create_inventory_notification(

        db=db,

        inventory=inventory,

        current_user=current_user,

        title="Stock Adjusted",

        message=
        f"Inventory adjusted manually for {inventory.product.name}.",

        notification_type="STOCK_ADJUSTMENT",

    )



    # Status Change Notification

    if old_status != inventory.stock_status:


        create_inventory_notification(

            db=db,

            inventory=inventory,

            current_user=current_user,

            title=inventory.stock_status,

            message=
            f"{inventory.product.name} status changed to {inventory.stock_status}.",

            notification_type="STOCK_STATUS",

        )



    db.commit()

    db.refresh(inventory)



    return inventory


# =====================================
# Search & Filter Inventory
# =====================================

def search_inventory(
    db: Session,
    current_user: User,
    search: str | None = None,
    category_id: int | None = None,
    brand: str | None = None,
    stock_status: str | None = None,
    sort_by: str | None = None,
):

    query = (
        db.query(Inventory)
        .join(Product)
        .filter(
            Inventory.company_id
            ==
            current_user.company_id
        )
    )


    # Search by Product Name / SKU

    if search:

        query = query.filter(

            (Product.name.ilike(f"%{search}%"))
            |
            (Product.sku.ilike(f"%{search}%"))

        )



    # Category Filter

    if category_id:

        query = query.filter(

            Product.category_id
            ==
            category_id

        )



    # Brand Filter

    if brand and brand.strip():

        query = query.filter(

            Product.brand.ilike(
                f"%{brand.strip()}%"
            )

        )



    # Stock Status Filter

    if stock_status:

        query = query.filter(

            Inventory.stock_status
            ==
            stock_status

        )



    # Sorting

    if sort_by == "name":

        query = query.order_by(
            asc(Product.name)
        )


    elif sort_by == "stock":

        query = query.order_by(
            desc(Inventory.current_stock)
        )


    elif sort_by == "recent":

        query = query.order_by(
            desc(Inventory.updated_at)
        )


    else:

        query = query.order_by(
            asc(Product.name)
        )



    return query.all()





# =====================================
# Movement History
# =====================================

def get_movement_history(
    db: Session,
    current_user: User,
):

    return (

        db.query(InventoryMovement)

        .join(Inventory)

        .filter(

            Inventory.company_id
            ==
            current_user.company_id

        )

        .order_by(

            desc(
                InventoryMovement.created_at
            )

        )

        .all()

    )





# =====================================
# Get Inventory By Product
# =====================================

def get_inventory_by_product(
    db: Session,
    product_id: int,
    current_user: User,
):

    return (

        db.query(Inventory)

        .filter(

            Inventory.product_id
            ==
            product_id,

            Inventory.company_id
            ==
            current_user.company_id,

        )

        .first()

    )





# =====================================
# Update Reorder Level
# =====================================

def update_reorder_level(
    db: Session,
    inventory_id: int,
    reorder_level: int,
    current_user: User,
):


    inventory = get_inventory_item(

        db,

        inventory_id,

        current_user,

    )



    if not inventory:

        return None



    if reorder_level < 0:

        raise ValueError(

            "Reorder level cannot be negative."

        )



    inventory.reorder_level = reorder_level



    inventory.stock_status = calculate_stock_status(

        inventory.available_stock,

        reorder_level,

    )



    create_audit_log(

        db=db,

        company_id=current_user.company_id,

        user_id=current_user.id,

        action="Reorder Level Updated",

    )



    create_inventory_notification(

        db=db,

        inventory=inventory,

        current_user=current_user,

        title="Reorder Level Updated",

        message=
        f"Reorder level updated for {inventory.product.name}.",

        notification_type="REORDER_UPDATE",

    )



    db.commit()

    db.refresh(inventory)



    return inventory