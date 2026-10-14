from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, Time
from sqlalchemy.sql import func
from app.core.database import Base


class ScheduledReport(Base):
    __tablename__ = "scheduled_reports"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    report_type = Column(String(80), nullable=False)
    report_name = Column(String(150), nullable=False)
    filters_json = Column(Text, nullable=False, default="{}")
    frequency = Column(String(20), nullable=False)
    execution_time = Column(Time, nullable=False)
    recipients_json = Column(Text, nullable=False, default="[]")
    export_format = Column(String(10), nullable=False, default="CSV")
    is_active = Column(Boolean, nullable=False, default=True, index=True)
    last_run_at = Column(DateTime(timezone=True), nullable=True)
    last_report_history_id = Column(Integer, ForeignKey("report_history.id", ondelete="SET NULL"), nullable=True)
    last_status = Column(String(30), nullable=True)
    last_error = Column(Text, nullable=True)
    next_run_at = Column(DateTime(timezone=True), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
