
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func

from app.core.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    company_id = Column(
        Integer,
        ForeignKey("companies.id"),
        nullable=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True
    )

    entity_name = Column(
        String,
        nullable=True
    )

    action = Column(
        String,
        nullable=False
    )

    # Existing fields
    ip_address = Column(
        String,
        nullable=True
    )

    browser = Column(
        String,
        nullable=True
    )

    # Task 13 fields
    resource_type = Column(
        String(100),
        nullable=True
    )

    resource_id = Column(
        String(100),
        nullable=True
    )

    description = Column(
        Text,
        nullable=True
    )

    user_agent = Column(
        Text,
        nullable=True
    )

    status = Column(
        String(50),
        nullable=True
    )

    before_values = Column(
        JSONB,
        nullable=True
    )

    after_values = Column(
        JSONB,
        nullable=True
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

