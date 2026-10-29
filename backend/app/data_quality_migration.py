
from app.core.database import Base, engine
from app.models.data_quality import DataQualityIssue, ReconciliationRun

if __name__ == "__main__":
    DataQualityIssue.__table__.create(bind=engine, checkfirst=True)
    ReconciliationRun.__table__.create(bind=engine, checkfirst=True)
    print("Data Quality migration completed: data_quality_issues, data_quality_runs")
