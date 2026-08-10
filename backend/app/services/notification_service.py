from sqlalchemy.orm import Session

from app.models.notification import Notification
from app.models.user import User


# ============================================================
# CREATE NOTIFICATION
# ============================================================

def create_notification(
    db: Session,
    company_id: int,
    title: str,
    message: str,
    notification_type: str,
    user_id: int | None = None,
):
    notification = Notification(
        company_id=company_id,
        user_id=user_id,
        title=title,
        message=message,
        notification_type=notification_type,
    )

    db.add(notification)
    db.commit()
    db.refresh(notification)

    return notification


# ============================================================
# GET NOTIFICATIONS
# ============================================================

def get_notifications(
    db: Session,
    current_user: User,
):
    return (
        db.query(Notification)
        .filter(
            Notification.company_id
            == current_user.company_id
        )
        .order_by(
            Notification.created_at.desc()
        )
        .all()
    )


# ============================================================
# GET UNREAD NOTIFICATIONS
# ============================================================

def get_unread_notifications(
    db: Session,
    current_user: User,
):
    return (
        db.query(Notification)
        .filter(
            Notification.company_id
            == current_user.company_id,

            Notification.is_read == False,
        )
        .order_by(
            Notification.created_at.desc()
        )
        .all()
    )


# ============================================================
# MARK NOTIFICATION AS READ
# ============================================================

def mark_notification_read(
    db: Session,
    notification_id: int,
    current_user: User,
):
    notification = (
        db.query(Notification)
        .filter(
            Notification.id == notification_id,

            Notification.company_id
            == current_user.company_id,
        )
        .first()
    )

    if not notification:
        return None

    notification.is_read = True

    db.commit()
    db.refresh(notification)

    return notification


# ============================================================
# CREATE VIP CUSTOMER NOTIFICATION
# ============================================================

def create_vip_notification(
    db: Session,
    customer,
):
    """
    Create a notification when a customer becomes VIP.

    This function is intentionally compatible with
    sales_service.py.
    """

    if not customer:
        return None

    try:
        # ----------------------------------------------------
        # Get company
        # ----------------------------------------------------

        company_id = getattr(
            customer,
            "company_id",
            None,
        )

        if not company_id:
            return None

        # ----------------------------------------------------
        # Get user
        # ----------------------------------------------------

        user_id = getattr(
            customer,
            "user_id",
            None,
        )

        # ----------------------------------------------------
        # Customer name
        # ----------------------------------------------------

        customer_name = getattr(
            customer,
            "full_name",
            "Customer",
        )

        # ----------------------------------------------------
        # Create notification
        # ----------------------------------------------------

        notification = Notification(
            company_id=company_id,
            user_id=user_id,
            title="VIP Customer",
            message=(
                f"{customer_name} "
                "has become a VIP customer."
            ),
            notification_type="VIP_CUSTOMER",
        )

        db.add(notification)

      

        return notification

    except Exception:
        return None

