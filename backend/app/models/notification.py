from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)

    company_id = Column(
        Integer,
        ForeignKey("companies.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # A notification is delivered to one user. This keeps access control
    # simple and prevents one user from reading another user's notification.
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    title = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)

    notification_type = Column(String(60), nullable=False, index=True)
    priority = Column(String(20), nullable=False, default="LOW", index=True)

    resource_type = Column(String(50), nullable=True)
    resource_id = Column(Integer, nullable=True)

    is_read = Column(Boolean, default=False, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    read_at = Column(DateTime(timezone=True), nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=True, index=True)

    company = relationship("Company")
    user = relationship("User")

    __table_args__ = (
        Index(
            "ix_notifications_user_active_resource",
            "user_id",
            "notification_type",
            "resource_type",
            "resource_id",
            "is_read",
        ),
    )
