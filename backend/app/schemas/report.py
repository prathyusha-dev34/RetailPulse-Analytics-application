from datetime import date, time, datetime
from typing import Any, Literal
from pydantic import BaseModel, Field, field_validator

REPORT_TYPES = {
    "sales": "Sales Report",
    "inventory": "Inventory Report",
    "customer": "Customer Report",
    "product_performance": "Product Performance Report",
    "stock_movement": "Stock Movement Report",
}
FREQUENCIES = {"DAILY", "WEEKLY", "MONTHLY"}
EXPORT_FORMATS = {"CSV", "PDF"}


class ReportFilters(BaseModel):
    start_date: date | None = None
    end_date: date | None = None
    product_id: int | None = Field(default=None, ge=1)
    category_id: int | None = Field(default=None, ge=1)
    brand: str | None = None
    customer_id: int | None = Field(default=None, ge=1)
    sales_status: str | None = None
    stock_status: str | None = None
    user_id: int | None = Field(default=None, ge=1)

    @field_validator("end_date")
    @classmethod
    def validate_end_date(cls, value, info):
        start = info.data.get("start_date")
        if value and start and value < start:
            raise ValueError("end_date must be on or after start_date")
        return value


class ReportGenerateRequest(BaseModel):
    report_type: str
    filters: ReportFilters = ReportFilters()
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=25, ge=1, le=500)
    sort_by: str | None = None
    sort_order: Literal["asc", "desc"] = "desc"


class ReportExportRequest(BaseModel):
    report_type: str
    filters: ReportFilters = ReportFilters()
    export_format: Literal["CSV", "PDF"]
    sort_by: str | None = None
    sort_order: Literal["asc", "desc"] = "desc"


class ScheduledReportCreate(BaseModel):
    report_type: str
    report_name: str = Field(min_length=1, max_length=150)
    filters: ReportFilters = ReportFilters()
    frequency: str
    execution_time: time
    recipients: list[str] = Field(min_length=1)
    export_format: Literal["CSV", "PDF"] = "CSV"
    is_active: bool = True

    @field_validator("report_type")
    @classmethod
    def validate_report_type(cls, value):
        if value not in REPORT_TYPES:
            raise ValueError("Invalid report type")
        return value

    @field_validator("frequency")
    @classmethod
    def validate_frequency(cls, value):
        value = value.upper()
        if value not in FREQUENCIES:
            raise ValueError("frequency must be Daily, Weekly, or Monthly")
        return value

    @field_validator("recipients")
    @classmethod
    def validate_recipients(cls, value):
        cleaned = [v.strip() for v in value if v.strip()]
        if not cleaned or any("@" not in v for v in cleaned):
            raise ValueError("recipients must contain valid email addresses")
        return list(dict.fromkeys(cleaned))


class ScheduledReportUpdate(ScheduledReportCreate):
    pass
