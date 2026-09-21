
from typing import Any

from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog


def create_audit_log(
    db: Session,
    company_id: int | None,
    user_id: int | None,
    action: str,
    entity_name: str = "",
    ip_address: str = "",
    browser: str = "",
    resource_type: str | None = None,
    resource_id: str | None = None,
    description: str | None = None,
    user_agent: str | None = None,
    status: str | None = "SUCCESS",
    before_values: dict[str, Any] | None = None,
    after_values: dict[str, Any] | None = None,
):
    """
    Create an audit log entry.

    Existing callers can continue using the original parameters.
    Task 13 callers can additionally provide resource details,
    status, and before/after values.
    """

    log = AuditLog(
        company_id=company_id,
        user_id=user_id,
        action=action,
        entity_name=entity_name,
        ip_address=ip_address,
        browser=browser,
        resource_type=resource_type,
        resource_id=resource_id,
        description=description,
        user_agent=user_agent,
        status=status,
        before_values=before_values,
        after_values=after_values,
    )

    db.add(log)
    db.commit()
    db.refresh(log)

    return log

