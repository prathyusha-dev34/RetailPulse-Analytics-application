from datetime import datetime

from pydantic import BaseModel


class NotificationResponse(BaseModel):

    id: int

    company_id: int

    user_id: int | None

    title: str

    message: str

    notification_type: str

    is_read: bool

    created_at: datetime


    class Config:

        from_attributes = True