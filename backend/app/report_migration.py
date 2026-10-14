  from app.core.database import Base, engine
from app.models.report_history import ReportHistory
from app.models.scheduled_report import ScheduledReport


if __name__ == "__main__":
    Base.metadata.create_all(
        bind=engine,
        tables=[ReportHistory.__table__, ScheduledReport.__table__],
    )
    print("Task 15 report tables created/verified successfully.")
