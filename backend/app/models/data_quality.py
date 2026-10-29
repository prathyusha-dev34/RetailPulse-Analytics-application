
from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    DateTime,
    ForeignKey,
    JSON,
    UniqueConstraint,
)

from sqlalchemy.sql import func
from app.core.database import Base


class DataQualityIssue(Base):
    __tablename__ = "data_quality_issues"

    __table_args__ = (
        UniqueConstraint(
            "company_id",
            "issue_key",
            name="uq_data_quality_company_issue_key",
        ),
    )

    id = Column(Integer, primary_key=True, index=True)

    company_id = Column(
        Integer,
        ForeignKey("companies.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    issue_key = Column(String(255), nullable=False, index=True)
    issue_type = Column(String(80), nullable=False, index=True)
    severity = Column(
        String(20),
        nullable=False,
        default="WARNING",
        index=True,
    )
    module = Column(String(50), nullable=False, index=True)
    record_type = Column(String(50), nullable=False)
    record_id = Column(String(100), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    details = Column(JSON, nullable=True)

    status = Column(
        String(30),
        nullable=False,
        default="OPEN",
        index=True,
    )

    detected_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        index=True,
    )

    last_seen_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    resolution_note = Column(Text, nullable=True)

    resolved_by = Column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    resolved_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )


class ReconciliationRun(Base):
    __tablename__ = "data_quality_runs"

    id = Column(Integer, primary_key=True, index=True)

    company_id = Column(
        Integer,
        ForeignKey("companies.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    triggered_by = Column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    started_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        index=True,
    )

    completed_at = Column(DateTime(timezone=True), nullable=True)

    records_checked = Column(Integer, nullable=False, default=0)
    issues_detected = Column(Integer, nullable=False, default=0)
    issues_resolved = Column(Integer, nullable=False, default=0)
    failed_checks = Column(Integer, nullable=False, default=0)

    status = Column(
        String(30),
        nullable=False,
        default="RUNNING",
        index=True,
    )

    summary = Column(JSON, nullable=True)
    failure_reason = Column(Text, nullable=True)

