from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Boolean,
    DateTime,
    ForeignKey,
)

from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class Notification(Base):

    __tablename__ = "notifications"


    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )


    company_id = Column(
        Integer,
        ForeignKey(
            "companies.id",
            ondelete="CASCADE"
        ),
        nullable=False,
        index=True,
    )


    # NULL means company-wide notification
    # value means personal notification

    user_id = Column(
        Integer,
        ForeignKey(
            "users.id",
            ondelete="CASCADE"
        ),
        nullable=True,
        index=True,
    )


    title = Column(
        String(150),
        nullable=False,
    )


    message = Column(
        Text,
        nullable=False,
    )


    notification_type = Column(
        String(50),
        nullable=False,
    )


    is_read = Column(
        Boolean,
        default=False,
        nullable=False,
    )


    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )


    company = relationship(
        "Company"
    )


    user = relationship(
        "User"
    )