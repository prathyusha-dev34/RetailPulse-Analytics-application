
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.data_quality import DataQualityIssue, ReconciliationRun
from app.models.product import Product
from app.models.customer import Customer
from app.models.sale import Sale


router = APIRouter(
    prefix="/data-quality",
    tags=["Data Quality"],
)


# =========================================================
# COMMON HELPERS
# =========================================================

def current_utc_time():
    return datetime.now(timezone.utc)


def get_issue_by_key(db: Session, company_id: int, issue_key: str):
    return (
        db.query(DataQualityIssue)
        .filter(
            DataQualityIssue.company_id == company_id,
            DataQualityIssue.issue_key == issue_key,
        )
        .first()
    )


def record_issue(
    db: Session,
    company_id: int,
    issue_key: str,
    issue_type: str,
    severity: str,
    module: str,
    record_type: str,
    record_id: str,
    title: str,
    description: str,
    details: dict,
):
    """
    Create a new issue or update the last-seen timestamp
    for an existing issue.
    """

    now = current_utc_time()

    issue = get_issue_by_key(db, company_id, issue_key)

    if issue is None:
        issue = DataQualityIssue(
            company_id=company_id,
            issue_key=issue_key,
            issue_type=issue_type,
            severity=severity,
            module=module,
            record_type=record_type,
            record_id=str(record_id),
            title=title,
            description=description,
            details=details,
            status="OPEN",
            detected_at=now,
            last_seen_at=now,
        )

        db.add(issue)
        db.flush()

        return issue, True

    # Update the existing issue without creating duplicates.
    issue.last_seen_at = now

    # If the same issue appears again after resolution,
    # reopen it because the problem still exists.
    if issue.status != "OPEN":
        issue.status = "OPEN"
        issue.resolution_note = None
        issue.resolved_by = None
        issue.resolved_at = None

    issue.severity = severity
    issue.description = description
    issue.details = details

    db.flush()

    return issue, False


# =========================================================
# INTERNAL DATA QUALITY SCAN
# =========================================================

def scan_company_data(db: Session, company_id: int):
    """
    Scan product, customer, and sales records.

    Checks:
    1. Non-positive product prices.
    2. Negative inventory values when a supported field exists.
    3. Missing customer emails.
    4. Duplicate customer emails.
    5. Negative sales totals.

    Returns the scan results.
    """

    records_checked = 0
    new_issues_detected = 0
    existing_issues_updated = 0

    summary = {
        "products_checked": 0,
        "customers_checked": 0,
        "sales_checked": 0,
        "new_issues_detected": 0,
        "existing_issues_updated": 0,
    }

    # -----------------------------------------------------
    # 1. PRODUCT CHECKS
    # -----------------------------------------------------

    products = (
        db.query(Product)
        .filter(Product.company_id == company_id)
        .all()
    )

    for product in products:
        records_checked += 1
        summary["products_checked"] += 1

        product_id = str(product.id)

        # Product price check
        price = getattr(product, "unit_price", None)

        if price is not None:
            try:
                invalid_price = float(price) <= 0
            except (TypeError, ValueError):
                invalid_price = True

            if invalid_price:
                _, created = record_issue(
                    db=db,
                    company_id=company_id,
                    issue_key=f"PRODUCT_INVALID_PRICE_{product.id}",
                    issue_type="INVALID_VALUE",
                    severity="CRITICAL",
                    module="PRODUCTS",
                    record_type="Product",
                    record_id=product_id,
                    title="Invalid product price",
                    description=(
                        f"Product {product_id} has an invalid "
                        f"or non-positive price: {price}."
                    ),
                    details={
                        "product_id": product_id,
                        "price": str(price),
                    },
                )

                if created:
                    new_issues_detected += 1
                else:
                    existing_issues_updated += 1

        # Check supported stock field names.
        stock_field = None

        for field_name in (
            "stock_quantity",
            "quantity",
            "current_stock",
            "stock",
        ):
            if hasattr(product, field_name):
                stock_field = field_name
                break

        if stock_field is not None:
            stock_value = getattr(product, stock_field, None)

            if stock_value is not None:
                try:
                    negative_stock = float(stock_value) < 0
                except (TypeError, ValueError):
                    negative_stock = False

                if negative_stock:
                    _, created = record_issue(
                        db=db,
                        company_id=company_id,
                        issue_key=f"PRODUCT_NEGATIVE_STOCK_{product.id}",
                        issue_type="INVALID_VALUE",
                        severity="CRITICAL",
                        module="INVENTORY",
                        record_type="Product",
                        record_id=product_id,
                        title="Negative inventory stock",
                        description=(
                            f"Product {product_id} has negative stock."
                        ),
                        details={
                            "product_id": product_id,
                            "stock_field": stock_field,
                            "stock_value": str(stock_value),
                        },
                    )

                    if created:
                        new_issues_detected += 1
                    else:
                        existing_issues_updated += 1

    # -----------------------------------------------------
    # 2. CUSTOMER CHECKS
    # -----------------------------------------------------

    customers = (
        db.query(Customer)
        .filter(Customer.company_id == company_id)
        .all()
    )

    seen_emails = set()

    for customer in customers:
        records_checked += 1
        summary["customers_checked"] += 1

        customer_id = str(customer.id)
        email = getattr(customer, "email", None)

        if not email or not str(email).strip():
            _, created = record_issue(
                db=db,
                company_id=company_id,
                issue_key=f"CUSTOMER_MISSING_EMAIL_{customer.id}",
                issue_type="MISSING_VALUE",
                severity="WARNING",
                module="CUSTOMERS",
                record_type="Customer",
                record_id=customer_id,
                title="Customer email missing",
                description=(
                    f"Customer {customer_id} does not have an email."
                ),
                details={
                    "customer_id": customer_id,
                },
            )

            if created:
                new_issues_detected += 1
            else:
                existing_issues_updated += 1

            continue

        normalized_email = str(email).strip().lower()

        if normalized_email in seen_emails:
            issue_key = (
                f"CUSTOMER_DUPLICATE_EMAIL_{normalized_email}"
            )

            _, created = record_issue(
                db=db,
                company_id=company_id,
                issue_key=issue_key,
                issue_type="DUPLICATE_RECORD",
                severity="WARNING",
                module="CUSTOMERS",
                record_type="Customer",
                record_id=customer_id,
                title="Duplicate customer email",
                description=(
                    "Multiple customer records use the same email."
                ),
                details={
                    "email": normalized_email,
                    "duplicate_customer_id": customer_id,
                },
            )

            if created:
                new_issues_detected += 1
            else:
                existing_issues_updated += 1

        seen_emails.add(normalized_email)

    # -----------------------------------------------------
    # 3. SALES CHECKS
    # -----------------------------------------------------

    sales = (
        db.query(Sale)
        .filter(Sale.company_id == company_id)
        .all()
    )

    for sale in sales:
        records_checked += 1
        summary["sales_checked"] += 1

        sale_id = str(sale.id)

        # Support common sales total field names.
        total_field = None

        for field_name in (
            "total_amount",
            "total",
            "grand_total",
            "net_amount",
        ):
            if hasattr(sale, field_name):
                total_field = field_name
                break

        if total_field is not None:
            total_value = getattr(sale, total_field, None)

            if total_value is not None:
                try:
                    negative_total = float(total_value) < 0
                except (TypeError, ValueError):
                    negative_total = False

                if negative_total:
                    _, created = record_issue(
                        db=db,
                        company_id=company_id,
                        issue_key=f"SALE_NEGATIVE_TOTAL_{sale.id}",
                        issue_type="INVALID_VALUE",
                        severity="CRITICAL",
                        module="SALES",
                        record_type="Sale",
                        record_id=sale_id,
                        title="Negative sales total",
                        description=(
                            f"Sale {sale_id} has a negative total."
                        ),
                        details={
                            "sale_id": sale_id,
                            "total_field": total_field,
                            "total_value": str(total_value),
                        },
                    )

                    if created:
                        new_issues_detected += 1
                    else:
                        existing_issues_updated += 1

    # -----------------------------------------------------
    # 4. RETURN SCAN SUMMARY
    # -----------------------------------------------------

    summary["new_issues_detected"] = new_issues_detected
    summary["existing_issues_updated"] = existing_issues_updated

    return {
        "records_checked": records_checked,
        "new_issues_detected": new_issues_detected,
        "existing_issues_updated": existing_issues_updated,
        "summary": summary,
    }


# =========================================================
# GET DATA QUALITY SUMMARY
# =========================================================

@router.get("/summary")
def get_data_quality_summary(
    company_id: int = Query(..., gt=0),
    db: Session = Depends(get_db),
):
    issues = db.query(DataQualityIssue).filter(
        DataQualityIssue.company_id == company_id
    )

    total_issues = issues.count()

    open_issues = issues.filter(
        DataQualityIssue.status == "OPEN"
    ).count()

    resolved_issues = issues.filter(
        DataQualityIssue.status == "RESOLVED"
    ).count()

    critical_issues = issues.filter(
        DataQualityIssue.severity == "CRITICAL",
        DataQualityIssue.status == "OPEN",
    ).count()

    warning_issues = issues.filter(
        DataQualityIssue.severity == "WARNING",
        DataQualityIssue.status == "OPEN",
    ).count()

    return {
        "company_id": company_id,
        "total_issues": total_issues,
        "open_issues": open_issues,
        "resolved_issues": resolved_issues,
        "critical_issues": critical_issues,
        "warning_issues": warning_issues,
    }


# =========================================================
# LIST DATA QUALITY ISSUES
# =========================================================

@router.get("/issues")
def get_data_quality_issues(
    company_id: int = Query(..., gt=0),
    status: Optional[str] = None,
    severity: Optional[str] = None,
    module: Optional[str] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(DataQualityIssue).filter(
        DataQualityIssue.company_id == company_id
    )

    if status:
        query = query.filter(
            DataQualityIssue.status == status.strip().upper()
        )

    if severity:
        query = query.filter(
            DataQualityIssue.severity == severity.strip().upper()
        )

    if module:
        query = query.filter(
            DataQualityIssue.module == module.strip().upper()
        )

    if search:
        term = f"%{search.strip()}%"

        query = query.filter(
            or_(
                DataQualityIssue.title.ilike(term),
                DataQualityIssue.description.ilike(term),
                DataQualityIssue.record_id.ilike(term),
                DataQualityIssue.issue_key.ilike(term),
            )
        )

    total = query.count()

    items = (
        query.order_by(DataQualityIssue.detected_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return {
        "items": [
            {
                "id": item.id,
                "company_id": item.company_id,
                "issue_key": item.issue_key,
                "issue_type": item.issue_type,
                "severity": item.severity,
                "module": item.module,
                "record_type": item.record_type,
                "record_id": item.record_id,
                "title": item.title,
                "description": item.description,
                "details": item.details,
                "status": item.status,
                "detected_at": item.detected_at,
                "last_seen_at": item.last_seen_at,
                "resolution_note": item.resolution_note,
                "resolved_by": item.resolved_by,
                "resolved_at": item.resolved_at,
            }
            for item in items
        ],
        "pagination": {
            "page": page,
            "page_size": page_size,
            "total": total,
            "total_pages": (
                (total + page_size - 1) // page_size
            ),
        },
    }


# =========================================================
# GET SINGLE ISSUE
# =========================================================

@router.get("/issues/{issue_id}")
def get_data_quality_issue(
    issue_id: int,
    company_id: int = Query(..., gt=0),
    db: Session = Depends(get_db),
):
    issue = (
        db.query(DataQualityIssue)
        .filter(
            DataQualityIssue.id == issue_id,
            DataQualityIssue.company_id == company_id,
        )
        .first()
    )

    if not issue:
        raise HTTPException(
            status_code=404,
            detail="Data quality issue not found",
        )

    return {
        "id": issue.id,
        "company_id": issue.company_id,
        "issue_key": issue.issue_key,
        "issue_type": issue.issue_type,
        "severity": issue.severity,
        "module": issue.module,
        "record_type": issue.record_type,
        "record_id": issue.record_id,
        "title": issue.title,
        "description": issue.description,
        "details": issue.details,
        "status": issue.status,
        "detected_at": issue.detected_at,
        "last_seen_at": issue.last_seen_at,
        "resolution_note": issue.resolution_note,
        "resolved_by": issue.resolved_by,
        "resolved_at": issue.resolved_at,
    }


# =========================================================
# RESOLVE ISSUE
# =========================================================

@router.patch("/issues/{issue_id}/resolve")
def resolve_data_quality_issue(
    issue_id: int,
    company_id: int = Query(..., gt=0),
    resolution_note: str = Query(..., min_length=1, max_length=2000),
    resolved_by: Optional[int] = Query(None, gt=0),
    db: Session = Depends(get_db),
):
    issue = (
        db.query(DataQualityIssue)
        .filter(
            DataQualityIssue.id == issue_id,
            DataQualityIssue.company_id == company_id,
        )
        .first()
    )

    if not issue:
        raise HTTPException(
            status_code=404,
            detail="Data quality issue not found",
        )

    if issue.status == "RESOLVED":
        return {
            "message": "Issue is already resolved",
            "issue_id": issue.id,
            "status": issue.status,
        }

    issue.status = "RESOLVED"
    issue.resolution_note = resolution_note.strip()
    issue.resolved_by = resolved_by
    issue.resolved_at = current_utc_time()

    try:
        db.commit()
        db.refresh(issue)

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Failed to resolve data quality issue",
        )

    return {
        "message": "Data quality issue resolved successfully",
        "issue_id": issue.id,
        "status": issue.status,
        "resolved_at": issue.resolved_at,
    }


# =========================================================
# RUN DATA QUALITY SCAN
# =========================================================

@router.post("/scan")
def run_data_quality_scan(
    company_id: int = Query(..., gt=0),
    db: Session = Depends(get_db),
):
    started_at = current_utc_time()

    try:
        result = scan_company_data(
            db=db,
            company_id=company_id,
        )

        run = ReconciliationRun(
            company_id=company_id,
            started_at=started_at,
            completed_at=current_utc_time(),
            records_checked=result["records_checked"],
            issues_detected=result["new_issues_detected"],
            issues_resolved=0,
            failed_checks=0,
            status="SUCCESS",
            summary=result["summary"],
        )

        db.add(run)
        db.commit()
        db.refresh(run)

        return {
            "message": "Data quality scan completed successfully",
            "company_id": company_id,
            "run_id": run.id,
            "status": run.status,
            "records_checked": result["records_checked"],
            "new_issues_detected": result["new_issues_detected"],
            "existing_issues_updated": result["existing_issues_updated"],
            "failed_checks": 0,
            "summary": result["summary"],
        }

    except Exception as exc:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=f"Data quality scan failed: {str(exc)}",
        )


# =========================================================
# RUN RECONCILIATION
# =========================================================

@router.post("/reconciliation/run")
def run_data_reconciliation(
    company_id: int = Query(..., gt=0),
    db: Session = Depends(get_db),
):
    started_at = current_utc_time()

    try:
        # Run the checks first so the reconciliation uses
        # the latest detected issues.
        result = scan_company_data(
            db=db,
            company_id=company_id,
        )

        open_issues = (
            db.query(DataQualityIssue)
            .filter(
                DataQualityIssue.company_id == company_id,
                DataQualityIssue.status == "OPEN",
            )
            .count()
        )

        run = ReconciliationRun(
            company_id=company_id,
            started_at=started_at,
            completed_at=current_utc_time(),
            records_checked=result["records_checked"],
            issues_detected=result["new_issues_detected"],
            issues_resolved=0,
            failed_checks=0,
            status="SUCCESS",
            summary={
                **result["summary"],
                "open_issues_after_scan": open_issues,
            },
        )

        db.add(run)
        db.commit()
        db.refresh(run)

        return {
            "message": "Reconciliation completed successfully",
            "company_id": company_id,
            "run_id": run.id,
            "status": run.status,
            "records_checked": result["records_checked"],
            "new_issues_detected": result["new_issues_detected"],
            "existing_issues_updated": result["existing_issues_updated"],
            "open_issues": open_issues,
            "failed_checks": 0,
            "summary": run.summary,
        }

    except Exception as exc:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=f"Reconciliation failed: {str(exc)}",
        )


# =========================================================
# RECONCILIATION RUN HISTORY
# =========================================================

@router.get("/reconciliation-runs")
def get_reconciliation_runs(
    company_id: int = Query(..., gt=0),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(ReconciliationRun).filter(
        ReconciliationRun.company_id == company_id
    )

    total = query.count()

    runs = (
        query.order_by(ReconciliationRun.started_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return {
        "items": [
            {
                "id": run.id,
                "company_id": run.company_id,
                "triggered_by": run.triggered_by,
                "started_at": run.started_at,
                "completed_at": run.completed_at,
                "records_checked": run.records_checked,
                "issues_detected": run.issues_detected,
                "issues_resolved": run.issues_resolved,
                "failed_checks": run.failed_checks,
                "status": run.status,
                "summary": run.summary,
                "failure_reason": run.failure_reason,
            }
            for run in runs
        ],
        "pagination": {
            "page": page,
            "page_size": page_size,
            "total": total,
            "total_pages": (
                (total + page_size - 1) // page_size
            ),
        },
    }


# =========================================================
# GET SINGLE RECONCILIATION RUN
# =========================================================

@router.get("/reconciliation-runs/{run_id}")
def get_reconciliation_run(
    run_id: int,
    company_id: int = Query(..., gt=0),
    db: Session = Depends(get_db),
):
    run = (
        db.query(ReconciliationRun)
        .filter(
            ReconciliationRun.id == run_id,
            ReconciliationRun.company_id == company_id,
        )
        .first()
    )

    if not run:
        raise HTTPException(
            status_code=404,
            detail="Reconciliation run not found",
        )

    return {
        "id": run.id,
        "company_id": run.company_id,
        "triggered_by": run.triggered_by,
        "started_at": run.started_at,
        "completed_at": run.completed_at,
        "records_checked": run.records_checked,
        "issues_detected": run.issues_detected,
        "issues_resolved": run.issues_resolved,
        "failed_checks": run.failed_checks,
        "status": run.status,
        "summary": run.summary,
        "failure_reason": run.failure_reason,
    }

