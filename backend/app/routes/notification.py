from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)

from sqlalchemy.orm import Session


from app.core.database import get_db

from app.dependencies.auth import get_current_user

from app.models.user import User


from app.schemas.notification import (
    NotificationResponse,
)


from app.services.notification_service import (
    get_notifications,
    get_unread_notifications,
    mark_notification_read,
)



router = APIRouter(

    prefix="/notifications",

    tags=["Notifications"]

)





@router.get(
    "/",
    response_model=list[NotificationResponse],
)
def list_notifications(

    db: Session = Depends(get_db),

    current_user: User = Depends(get_current_user),

):

    return get_notifications(

        db,

        current_user

    )





@router.get(
    "/unread",
    response_model=list[NotificationResponse],
)
def unread_notifications(

    db: Session = Depends(get_db),

    current_user: User = Depends(get_current_user),

):

    return get_unread_notifications(

        db,

        current_user

    )





@router.patch(
    "/{notification_id}/read",
    response_model=NotificationResponse,
)
def read_notification(

    notification_id: int,

    db: Session = Depends(get_db),

    current_user: User = Depends(get_current_user),

):

    notification = mark_notification_read(

        db,

        notification_id,

        current_user

    )


    if not notification:

        raise HTTPException(

            status_code=404,

            detail="Notification not found"

        )


    return notification