
from datetime import datetime
from typing import Any

from pydantic import BaseModel


class AuditLogResponse(BaseModel):
    id: int

    company_id: int | None = None
    user_id: int | None = None

    entity_name: str | None = None
    action: str

    ip_address: str | None = None
    browser: str | None = None

    # Task 13 fields
    resource_type: str | None = None
    resource_id: str | None = None
    description: str | None = None
    user_agent: str | None = None
    status: str | None = None

    before_values: dict[str, Any] | None = None
    after_values: dict[str, Any] | None = None

    created_at: datetime

    class Config:
        from_attributes = True

