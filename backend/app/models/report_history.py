from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.core.database import Base


class ReportHistory(Base):
    __tablename__ = "report_history"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    generated_by = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    report_type = Column(String(80), nullable=False, index=True)
    report_name = Column(String(150), nullable=False)
    applied_filters = Column(Text, nullable=False, default="{}")
    report_period = Column(String(100), nullable=True)
    export_format = Column(String(20), nullable=False, default="VIEW")
    status = Column(String(30), nullable=False, default="SUCCESS", index=True)
    failure_reason = Column(Text, nullable=True)
    file_path = Column(String(500), nullable=True)
    row_count = Column(Integer, nullable=False, default=0)
    generated_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
