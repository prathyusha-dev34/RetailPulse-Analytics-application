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
    resource_id: str | int | None = None,
    description: str | None = None,
    user_agent: str | None = None,
    status: str = "SUCCESS",
    before_values: dict[str, Any] | None = None,
    after_values: dict[str, Any] | None = None,
    commit: bool = True,
):
    """
    Create an audit log entry.

    commit=True:
        Keeps compatibility with existing code.

    commit=False:
        Recommended when the audit log must be committed together
        with the business operation in the same transaction.
    """

    log = AuditLog(
        company_id=company_id,
        user_id=user_id,
        action=action,
        entity_name=entity_name or None,
        resource_type=resource_type,
        resource_id=str(resource_id) if resource_id is not None else None,
        description=description,
        ip_address=ip_address,
        browser=browser,
        user_agent=user_agent,
        status=status,
        before_values=before_values,
        after_values=after_values,
    )

    db.add(log)

    if commit:
        db.commit()
        db.refresh(log)
    else:
        # Makes the generated ID available without committing.
        db.flush()

    return log