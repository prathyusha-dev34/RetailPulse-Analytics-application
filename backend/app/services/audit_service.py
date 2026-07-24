from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog


def create_audit_log(
    db: Session,
    company_id: int,
    user_id: int,
    action: str,
    entity_name: str = "",
    ip_address: str = "",
    browser: str = "",
):

    log = AuditLog(
        company_id=company_id,
        user_id=user_id,
        action=action,
        entity_name=entity_name,
        ip_address=ip_address,
        browser=browser,
    )

    db.add(log)
    db.commit()