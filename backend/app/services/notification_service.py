from sqlalchemy.orm import Session

from app.models.notification import Notification
from app.models.user import User



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





def get_notifications(
    db: Session,
    current_user: User,
):

    return (

        db.query(Notification)

        .filter(

            Notification.company_id
            ==
            current_user.company_id

        )

        .order_by(

            Notification.created_at.desc()

        )

        .all()

    )





def get_unread_notifications(
    db: Session,
    current_user: User,
):

    return (

        db.query(Notification)

        .filter(

            Notification.company_id
            ==
            current_user.company_id,

            Notification.is_read == False

        )

        .order_by(

            Notification.created_at.desc()

        )

        .all()

    )





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
            ==
            current_user.company_id

        )

        .first()

    )


    if not notification:

        return None


    notification.is_read = True


    db.commit()

    db.refresh(notification)


    return notification