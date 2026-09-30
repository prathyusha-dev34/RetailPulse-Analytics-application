from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.models.notification import Notification
from app.models.user import User


# ============================================================
# TASK 14 CONSTANTS
# ============================================================

PRIORITIES = {"LOW", "MEDIUM", "HIGH", "CRITICAL"}

ADMIN_ROLES = {"COMPANY_ADMIN", "SUPER_ADMIN"}
ANALYST_ROLES = {"ANALYST", "COMPANY_ADMIN", "SUPER_ADMIN"}
VIEWER_ROLES = {"VIEWER", "ANALYST", "COMPANY_ADMIN", "SUPER_ADMIN"}


ROLE_NOTIFICATION_TYPES = {
    "COMPANY_ADMIN": {
        "STOCKOUT", "LOW_STOCK", "STOCKOUT_RISK", "OVERSTOCK",
        "IMPORT_COMPLETED", "IMPORT_COMPLETED_WITH_ERRORS", "IMPORT_FAILED",
        "SALES_ALERT", "SYSTEM_ALERT",
    },
    "SUPER_ADMIN": {
        "STOCKOUT", "LOW_STOCK", "STOCKOUT_RISK", "OVERSTOCK",
        "IMPORT_COMPLETED", "IMPORT_COMPLETED_WITH_ERRORS", "IMPORT_FAILED",
        "SALES_ALERT", "SYSTEM_ALERT",
    },
    "ANALYST": {
        "STOCKOUT_RISK", "OVERSTOCK", "SALES_ALERT", "SYSTEM_ALERT",
    },
    "VIEWER": {
        "SYSTEM_ALERT",
    },
}


def _now():
    return datetime.now(timezone.utc)


def _existing_active_notification(
    db: Session,
    *,
    company_id: int,
    user_id: int,
    notification_type: str,
    resource_type: str | None,
    resource_id: int | None,
):
    """Return an existing unread alert for the same condition.

    This is the main duplicate-prevention rule for Task 14.
    """
    query = db.query(Notification).filter(
        Notification.company_id == company_id,
        Notification.user_id == user_id,
        Notification.notification_type == notification_type,
        Notification.is_read.is_(False),
    )

    if resource_type is None:
        query = query.filter(Notification.resource_type.is_(None))
    else:
        query = query.filter(Notification.resource_type == resource_type)

    if resource_id is None:
        query = query.filter(Notification.resource_id.is_(None))
    else:
        query = query.filter(Notification.resource_id == resource_id)

    return query.order_by(Notification.created_at.desc()).first()


def create_notification(
    db: Session,
    company_id: int,
    title: str,
    message: str,
    notification_type: str,
    user_id: int,
    priority: str = "LOW",
    resource_type: str | None = None,
    resource_id: int | None = None,
    expires_at: datetime | None = None,
    prevent_duplicate: bool = True,
):
    if priority not in PRIORITIES:
        raise ValueError(f"Invalid notification priority: {priority}")

    if not user_id:
        raise ValueError("user_id is required for a user-scoped notification")

    if prevent_duplicate:
        existing = _existing_active_notification(
            db,
            company_id=company_id,
            user_id=user_id,
            notification_type=notification_type,
            resource_type=resource_type,
            resource_id=resource_id,
        )
        if existing:
            return existing

    notification = Notification(
        company_id=company_id,
        user_id=user_id,
        title=title,
        message=message,
        notification_type=notification_type,
        priority=priority,
        resource_type=resource_type,
        resource_id=resource_id,
        is_read=False,
        expires_at=expires_at,
    )

    db.add(notification)
    return notification


def create_role_notifications(
    db: Session,
    *,
    company_id: int,
    roles: set[str],
    title: str,
    message: str,
    notification_type: str,
    priority: str,
    resource_type: str | None = None,
    resource_id: int | None = None,
    expires_at: datetime | None = None,
):
    """Create one notification per authorized user in the company."""
    users = (
        db.query(User)
        .filter(
            User.company_id == company_id,
            User.status == "ACTIVE",
            User.role.in_(roles),
        )
        .all()
    )

    created = []
    for user in users:
        created.append(
            create_notification(
                db,
                company_id=company_id,
                user_id=user.id,
                title=title,
                message=message,
                notification_type=notification_type,
                priority=priority,
                resource_type=resource_type,
                resource_id=resource_id,
                expires_at=expires_at,
            )
        )

    return created


def create_inventory_alert(
    db: Session,
    *,
    company_id: int,
    product_id: int,
    title: str,
    message: str,
    notification_type: str,
    priority: str,
    roles: set[str] = ADMIN_ROLES,
):
    return create_role_notifications(
        db,
        company_id=company_id,
        roles=roles,
        title=title,
        message=message,
        notification_type=notification_type,
        priority=priority,
        resource_type="product",
        resource_id=product_id,
    )


def create_import_notification(
    db: Session,
    *,
    company_id: int,
    import_id: int,
    import_type: str,
    status: str,
):
    if status == "Completed":
        notification_type = "IMPORT_COMPLETED"
        priority = "LOW"
        title = "Data Import Completed"
        message = f"{import_type.title()} import #{import_id} completed successfully."
    elif status == "Completed with Errors":
        notification_type = "IMPORT_COMPLETED_WITH_ERRORS"
        priority = "MEDIUM"
        title = "Data Import Completed with Errors"
        message = f"{import_type.title()} import #{import_id} completed with validation or duplicate errors."
    else:
        notification_type = "IMPORT_FAILED"
        priority = "HIGH"
        title = "Data Import Failed"
        message = f"{import_type.title()} import #{import_id} failed. Review the import details."

    return create_role_notifications(
        db,
        company_id=company_id,
        roles=ADMIN_ROLES,
        title=title,
        message=message,
        notification_type=notification_type,
        priority=priority,
        resource_type="import",
        resource_id=import_id,
    )


def _visible_query(db: Session, current_user: User):
    now = _now()
    return db.query(Notification).filter(
        Notification.company_id == current_user.company_id,
        Notification.user_id == current_user.id,
        or_(Notification.expires_at.is_(None), Notification.expires_at > now),
    )


def get_notifications(
    db: Session,
    current_user: User,
    *,
    page: int = 1,
    page_size: int = 25,
    is_read: bool | None = None,
    notification_type: str | None = None,
    priority: str | None = None,
):
    page = max(page, 1)
    page_size = min(max(page_size, 1), 100)

    query = _visible_query(db, current_user)

    if is_read is not None:
        query = query.filter(Notification.is_read == is_read)
    if notification_type:
        query = query.filter(Notification.notification_type == notification_type)
    if priority:
        query = query.filter(Notification.priority == priority)

    total = query.count()

    unread_count = _visible_query(db, current_user).filter(
        Notification.is_read.is_(False)
    ).count()

    items = (
        query.order_by(Notification.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "unread_count": unread_count,
    }


def get_unread_count(db: Session, current_user: User) -> int:
    return (
        _visible_query(db, current_user)
        .filter(Notification.is_read.is_(False))
        .count()
    )


def mark_notification_read(
    db: Session,
    notification_id: int,
    current_user: User,
):
    notification = _visible_query(db, current_user).filter(
        Notification.id == notification_id
    ).first()

    if not notification:
        return None

    if not notification.is_read:
        notification.is_read = True
        notification.read_at = _now()
        db.commit()
        db.refresh(notification)

    return notification


def mark_all_notifications_read(db: Session, current_user: User) -> int:
    notifications = (
        _visible_query(db, current_user)
        .filter(Notification.is_read.is_(False))
        .all()
    )

    if not notifications:
        return 0

    now = _now()
    for notification in notifications:
        notification.is_read = True
        notification.read_at = now

    db.commit()
    return len(notifications)


def expire_inventory_alerts(
    db: Session,
    *,
    company_id: int,
    product_id: int,
):
    """Resolve old inventory alerts once stock is healthy again."""
    alerts = (
        db.query(Notification)
        .filter(
            Notification.company_id == company_id,
            Notification.resource_type == "product",
            Notification.resource_id == product_id,
            Notification.notification_type.in_([
                "STOCKOUT", "LOW_STOCK", "STOCKOUT_RISK", "OVERSTOCK"
            ]),
            Notification.is_read.is_(False),
        )
        .all()
    )

    now = _now()
    for alert in alerts:
        alert.is_read = True
        alert.read_at = now
        alert.expires_at = now

    return len(alerts)


# Backward-compatible helper used by existing sales_service.py.
def create_vip_notification(db: Session, customer):
    if not customer:
        return None

    company_id = getattr(customer, "company_id", None)
    if not company_id:
        return None

    customer_name = getattr(customer, "full_name", "Customer")

    users = (
        db.query(User)
        .filter(
            User.company_id == company_id,
            User.status == "ACTIVE",
            User.role.in_(ADMIN_ROLES | ANALYST_ROLES),
        )
        .all()
    )

    result = []
    for user in users:
        result.append(
            create_notification(
                db,
                company_id=company_id,
                user_id=user.id,
                title="VIP Customer",
                message=f"{customer_name} has become a VIP customer.",
                notification_type="SALES_ALERT",
                priority="LOW",
                resource_type="customer",
                resource_id=getattr(customer, "id", None),
            )
        )

    return result[0] if result else None
