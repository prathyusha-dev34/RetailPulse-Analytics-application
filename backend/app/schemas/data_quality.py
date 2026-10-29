from datetime import datetime
from typing import Any, Optional
from pydantic import BaseModel, Field


class IssueStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(OPEN|INVESTIGATING|RESOLVED|IGNORED)$")
    resolution_note: Optional[str] = Field(default=None, max_length=4000)


class ReconciliationResult(BaseModel):
    execution_id: int
    status: str
    records_checked: int
    issues_detected: int
    issues_resolved: int
    failed_checks: int
    started_at: datetime
    completed_at: Optional[datetime] = None
    summary: dict[str, Any] = {}
