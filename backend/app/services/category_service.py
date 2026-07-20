from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.category import Category
from app.models.product import Product
from app.models.user import User
from app.schemas.category import CategoryCreate, CategoryUpdate

from app.services.audit_service import create_audit_log


def create_category(
    db: Session,
    category: CategoryCreate,
    current_user: User,
):
    # Duplicate category name within same company
    existing = (
        db.query(Category)
        .filter(
            Category.company_id == current_user.company_id,
            func.lower(Category.name) == category.name.lower(),
        )
        .first()
    )

    if existing:
        raise ValueError("Category already exists.")

    new_category = Category(
        company_id=current_user.company_id,
        name=category.name,
        description=category.description,
        status=category.status,
    )

    db.add(new_category)
    db.commit()
    db.refresh(new_category)

    create_audit_log(
        db=db,
        company_id=current_user.company_id,
        user_id=current_user.id,
        action=f"Category '{new_category.name}' created.",
    )

    return new_category


def get_categories(
    db: Session,
    current_user: User,
):
    categories = (
        db.query(Category)
        .filter(Category.company_id == current_user.company_id)
        .all()
    )

    result = []

    for category in categories:
        count = (
            db.query(Product)
            .filter(Product.category_id == category.id)
            .count()
        )

        category.product_count = count
        result.append(category)

    return result


def get_category(
    db: Session,
    category_id: int,
    current_user: User,
):
    return (
        db.query(Category)
        .filter(
            Category.id == category_id,
            Category.company_id == current_user.company_id,
        )
        .first()
    )


def search_categories(
    db: Session,
    search: str,
    current_user: User,
):
    return (
        db.query(Category)
        .filter(
            Category.company_id == current_user.company_id,
            Category.name.ilike(f"%{search}%"),
        )
        .all()
    )


def update_category(
    db: Session,
    category_id: int,
    data: CategoryUpdate,
    current_user: User,
):
    category = get_category(
        db,
        category_id,
        current_user,
    )

    if not category:
        return None

    update_data = data.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(category, key, value)

    db.commit()
    db.refresh(category)

    create_audit_log(
        db=db,
        company_id=current_user.company_id,
        user_id=current_user.id,
        action=f"Category '{category.name}' updated.",
    )

    return category


def delete_category(
    db: Session,
    category_id: int,
    current_user: User,
):
    category = get_category(
        db,
        category_id,
        current_user,
    )

    if not category:
        return False

    db.delete(category)
    db.commit()

    create_audit_log(
        db=db,
        company_id=current_user.company_id,
        user_id=current_user.id,
        action=f"Category '{category.name}' deleted.",
    )

    return True