from sqlalchemy import func, asc, desc
from sqlalchemy.orm import Session

from app.models.product import Product
from app.models.category import Category
from app.models.user import User
from app.models.sale_item import SaleItem

from app.schemas.product import (
    ProductCreate,
    ProductUpdate,
)

from app.services.audit_service import create_audit_log
from app.services.inventory_service import create_inventory


# ==========================================
# CREATE PRODUCT
# ==========================================

def create_product(
    db: Session,
    product: ProductCreate,
    current_user: User,
):

    category = (
        db.query(Category)
        .filter(
            Category.id == product.category_id,
            Category.company_id == current_user.company_id,
        )
        .first()
    )

    if not category:
        raise ValueError(
            "Category not found."
        )


    existing_sku = (
        db.query(Product)
        .filter(
            Product.company_id == current_user.company_id,
            func.lower(Product.sku)
            == product.sku.lower(),
        )
        .first()
    )


    if existing_sku:
        raise ValueError(
            "SKU already exists."
        )


    duplicate_name = (
        db.query(Product)
        .filter(
            Product.company_id == current_user.company_id,
            Product.category_id == product.category_id,
            func.lower(Product.name)
            == product.name.lower(),
        )
        .first()
    )


    if duplicate_name:
        raise ValueError(
            "Product already exists in this category."
        )


    if product.unit_price <= 0:
        raise ValueError(
            "Unit Price must be greater than zero."
        )


    if product.cost_price > product.unit_price:
        raise ValueError(
            "Cost Price cannot exceed Unit Price."
        )


    if product.stock_quantity < 0:
        raise ValueError(
            "Stock Quantity cannot be negative."
        )


    new_product = Product(
        company_id=current_user.company_id,
        category_id=product.category_id,
        name=product.name,
        sku=product.sku,
        brand=product.brand,
        description=product.description,
        unit_price=product.unit_price,
        cost_price=product.cost_price,
        stock_quantity=product.stock_quantity,
        unit_of_measure=product.unit_of_measure,
        status=product.status,
    )


    db.add(new_product)
    db.commit()
    db.refresh(new_product)


    create_inventory(
        db=db,
        product=new_product,
    )


    create_audit_log(
        db=db,
        company_id=current_user.company_id,
        user_id=current_user.id,
        action="Product Created",
        entity_name="Product",
    )


    return new_product



# ==========================================
# GET ALL PRODUCTS
# ==========================================

def get_products(
    db: Session,
    current_user: User,
):

    return (
        db.query(Product)
        .filter(
            Product.company_id ==
            current_user.company_id
        )
        .all()
    )



# ==========================================
# GET SINGLE PRODUCT
# ==========================================

def get_product(
    db: Session,
    product_id: int,
    current_user: User,
):

    return (
        db.query(Product)
        .filter(
            Product.id == product_id,
            Product.company_id ==
            current_user.company_id,
        )
        .first()
    )

# ==========================================
# UPDATE PRODUCT
# ==========================================

def update_product(
    db: Session,
    product_id: int,
    data: ProductUpdate,
    current_user: User,
):

    product = get_product(
        db,
        product_id,
        current_user,
    )


    if not product:
        return None


    update_data = data.model_dump(
        exclude_unset=True
    )


    if "category_id" in update_data:

        category = (
            db.query(Category)
            .filter(
                Category.id ==
                update_data["category_id"],
                Category.company_id ==
                current_user.company_id,
            )
            .first()
        )


        if not category:
            raise ValueError(
                "Category not found."
            )



    if "sku" in update_data:

        sku_exists = (
            db.query(Product)
            .filter(
                Product.company_id ==
                current_user.company_id,

                func.lower(Product.sku)
                ==
                update_data["sku"].lower(),

                Product.id != product.id,
            )
            .first()
        )


        if sku_exists:
            raise ValueError(
                "SKU already exists."
            )



    new_name = update_data.get(
        "name",
        product.name,
    )


    new_category = update_data.get(
        "category_id",
        product.category_id,
    )



    duplicate_name = (
        db.query(Product)
        .filter(
            Product.company_id ==
            current_user.company_id,

            Product.category_id ==
            new_category,

            func.lower(Product.name)
            ==
            new_name.lower(),

            Product.id != product.id,
        )
        .first()
    )


    if duplicate_name:
        raise ValueError(
            "Product already exists in this category."
        )



    unit_price = update_data.get(
        "unit_price",
        product.unit_price,
    )


    cost_price = update_data.get(
        "cost_price",
        product.cost_price,
    )


    if unit_price <= 0:
        raise ValueError(
            "Unit Price must be greater than zero."
        )


    if cost_price > unit_price:
        raise ValueError(
            "Cost Price cannot exceed Unit Price."
        )



    stock_quantity = update_data.get(
        "stock_quantity",
        product.stock_quantity,
    )


    if stock_quantity < 0:
        raise ValueError(
            "Stock Quantity cannot be negative."
        )



    for key, value in update_data.items():

        setattr(
            product,
            key,
            value
        )


    db.commit()
    db.refresh(product)



    create_audit_log(
        db=db,
        company_id=current_user.company_id,
        user_id=current_user.id,
        action="Product Updated",
        entity_name="Product",
    )


    return product



# ==========================================
# DELETE PRODUCT
# ==========================================

def delete_product(
    db: Session,
    product_id: int,
    current_user: User,
):

    product = get_product(
        db,
        product_id,
        current_user,
    )


    if not product:
        return False



    # Check sales history before delete

    sale_history = (
        db.query(SaleItem)
        .filter(
            SaleItem.product_id ==
            product.id
        )
        .first()
    )


    if sale_history:

        raise ValueError(
            "Cannot delete product. Sales history exists for this product."
        )



    db.delete(product)
    db.commit()



    create_audit_log(
        db=db,
        company_id=current_user.company_id,
        user_id=current_user.id,
        action="Product Deleted",
        entity_name="Product",
    )


    return True


# ==========================================
# SEARCH / FILTER / SORT PRODUCTS
# ==========================================

def search_products(
    db: Session,
    current_user: User,
    search: str | None = None,
    category_id: int | None = None,
    brand: str | None = None,
    status: str | None = None,
    sort_by: str | None = None,
):

    query = (
        db.query(Product)
        .filter(
            Product.company_id ==
            current_user.company_id
        )
    )


    if search:

        query = query.filter(
            (Product.name.ilike(
                f"%{search}%"
            ))
            |
            (Product.sku.ilike(
                f"%{search}%"
            ))
            |
            (Product.brand.ilike(
                f"%{search}%"
            ))
        )



    if category_id:

        query = query.filter(
            Product.category_id ==
            category_id
        )



    if brand and brand.strip():

        query = query.filter(
            Product.brand.ilike(
                f"%{brand.strip()}%"
            )
        )



    if status:

        query = query.filter(
            Product.status ==
            status
        )



    if sort_by == "name":

        query = query.order_by(
            asc(Product.name)
        )


    elif sort_by == "price":

        query = query.order_by(
            asc(Product.unit_price)
        )


    elif sort_by == "recent":

        query = query.order_by(
            desc(Product.created_at)
        )


    else:

        query = query.order_by(
            desc(Product.created_at)
        )


    return query.all()



# ==========================================
# ACTIVATE PRODUCT
# ==========================================

def activate_product(
    db: Session,
    product_id: int,
    current_user: User,
):

    product = get_product(
        db,
        product_id,
        current_user,
    )


    if not product:
        return None


    product.status = "ACTIVE"


    db.commit()
    db.refresh(product)



    create_audit_log(
        db=db,
        company_id=current_user.company_id,
        user_id=current_user.id,
        action="Product Activated",
        entity_name="Product",
    )


    return product



# ==========================================
# DEACTIVATE PRODUCT
# ==========================================

def deactivate_product(
    db: Session,
    product_id: int,
    current_user: User,
):

    product = get_product(
        db,
        product_id,
        current_user,
    )


    if not product:
        return None



    product.status = "INACTIVE"


    db.commit()
    db.refresh(product)



    create_audit_log(
        db=db,
        company_id=current_user.company_id,
        user_id=current_user.id,
        action="Product Deactivated",
        entity_name="Product",
    )


    return product


# ==========================================
# PRODUCT DASHBOARD SUMMARY
# ==========================================

def get_dashboard_summary(
    db: Session,
    current_user: User,
):

    total_products = (
        db.query(Product)
        .filter(
            Product.company_id ==
            current_user.company_id
        )
        .count()
    )



    active_products = (
        db.query(Product)
        .filter(
            Product.company_id ==
            current_user.company_id,

            Product.status ==
            "ACTIVE",
        )
        .count()
    )



    inactive_products = (
        db.query(Product)
        .filter(
            Product.company_id ==
            current_user.company_id,

            Product.status ==
            "INACTIVE",
        )
        .count()
    )



    # Actual low stock count
    # No demo / hardcoded values

    low_stock = (
        db.query(Product)
        .filter(
            Product.company_id ==
            current_user.company_id,

            Product.stock_quantity <= 10,

            Product.stock_quantity > 0,
        )
        .count()
    )



    total_categories = (
        db.query(Category)
        .filter(
            Category.company_id ==
            current_user.company_id
        )
        .count()
    )



    return {

        "total_products":
            total_products,


        "active_products":
            active_products,


        "inactive_products":
            inactive_products,


        "low_stock":
            low_stock,


        "total_categories":
            total_categories,

    }