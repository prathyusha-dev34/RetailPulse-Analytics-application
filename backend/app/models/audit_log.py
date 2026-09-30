from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON
from sqlalchemy.sql import func

from app.core.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    company_id = Column(
        Integer,
        ForeignKey("companies.id"),
        nullable=True,
        index=True,
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True,
        index=True,
    )

    # What happened
    action = Column(
        String,
        nullable=False,
        index=True,
    )

    # Main entity affected
    entity_name = Column(
        String,
        nullable=True,
        index=True,
    )

    # Generic resource information
    resource_type = Column(
        String,
        nullable=True,
        index=True,
    )

    resource_id = Column(
        String,
        nullable=True,
        index=True,
    )

    # Human-readable explanation
    description = Column(
        String,
        nullable=True,
    )

    # Request information
    ip_address = Column(
        String,
        nullable=True,
    )

    browser = Column(
        String,
        nullable=True,
    )

    user_agent = Column(
        String,
        nullable=True,
    )

    # SUCCESS / FAILED
    status = Column(
        String,
        nullable=True,
        default="SUCCESS",
        index=True,
    )

    # State before the operation
    before_values = Column(
        JSON,
        nullable=True,
    )

    # State after the operation
    after_values = Column(
        JSON,
        nullable=True,
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,
    )