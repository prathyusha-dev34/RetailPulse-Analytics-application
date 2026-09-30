from datetime import datetime
from pydantic import BaseModel, ConfigDict


class NotificationResponse(BaseModel):
    id: int
    company_id: int
    user_id: int
    title: str
    message: str
    notification_type: str
    priority: str
    resource_type: str | None = None
    resource_id: int | None = None
    is_read: bool
    created_at: datetime
    read_at: datetime | None = None
    expires_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class NotificationListResponse(BaseModel):
    items: list[NotificationResponse]
    total: int
    page: int
    page_size: int
    unread_count: int
