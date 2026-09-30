from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.notification import NotificationListResponse, NotificationResponse
from app.services.notification_service import (
    get_notifications,
    get_unread_count,
    mark_all_notifications_read,
    mark_notification_read,
)

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("/", response_model=NotificationListResponse)
def list_notifications(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    is_read: bool | None = Query(None),
    notification_type: str | None = Query(None),
    priority: str | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_notifications(
        db,
        current_user,
        page=page,
        page_size=page_size,
        is_read=is_read,
        notification_type=notification_type,
        priority=priority,
    )


@router.get("/unread-count")
def unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return {"unread_count": get_unread_count(db, current_user)}


# Backward-compatible endpoint for the existing Topbar.
@router.get("/unread", response_model=list[NotificationResponse])
def unread_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = get_notifications(
        db,
        current_user,
        page=1,
        page_size=100,
        is_read=False,
    )
    return result["items"]


@router.patch("/{notification_id}/read", response_model=NotificationResponse)
def read_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    notification = mark_notification_read(
        db,
        notification_id,
        current_user,
    )

    if not notification:
        # Deliberately do not reveal whether another user's notification
        # exists. This is part of the security boundary.
        raise HTTPException(status_code=404, detail="Notification not found")

    return notification


@router.patch("/read-all")
def read_all_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    updated = mark_all_notifications_read(db, current_user)
    return {"success": True, "updated_count": updated}
