from collections import Counter
from datetime import datetime, timezone
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.data_quality import DataQualityIssue, ReconciliationRun
from app.models.product import Product
from app.models.inventory import Inventory
from app.models.inventory_movement import InventoryMovement
from app.models.sale import Sale
from app.models.sale_item import SaleItem
from app.models.customer import Customer
from app.models.audit_log import AuditLog

ACTIVE_STATUSES = ("OPEN", "INVESTIGATING")


def _issue(company_id, issue_type, severity, module, record_type, record_id, title, description, details=None):
    key = f"{issue_type}:{module}:{record_type}:{record_id}"
    return {
        "company_id": company_id, "issue_key": key, "issue_type": issue_type,
        "severity": severity, "module": module, "record_type": record_type,
        "record_id": str(record_id), "title": title, "description": description,
        "details": details or {},
    }


def _collect_issues(db: Session, company_id: int):
    found = []
    records_checked = 0
    summary = Counter()

    products = db.query(Product).filter(Product.company_id == company_id).all()
    records_checked += len(products)
    sku_groups = Counter((p.sku or "").strip().casefold() for p in products)
    for p in products:
        if not (p.sku or "").strip():
            found.append(_issue(company_id, "MISSING_PRODUCT_SKU", "ERROR", "PRODUCTS", "product", p.id,
                "Product SKU is missing", f"Product '{p.name}' has no SKU.", {"product_id": p.id, "name": p.name, "sku": p.sku}))
        if not (p.name or "").strip() or p.category_id is None or p.unit_price is None or p.cost_price is None:
            missing = [label for label, value in [("name", p.name), ("category_id", p.category_id), ("unit_price", p.unit_price), ("cost_price", p.cost_price)] if value is None or (isinstance(value, str) and not value.strip())]
            found.append(_issue(company_id, "MISSING_PRODUCT_FIELDS", "ERROR", "PRODUCTS", "product", p.id,
                "Mandatory product information is missing", f"Product {p.id} is missing: {', '.join(missing)}.", {"product_id": p.id, "missing_fields": missing}))
        if (p.sku or "").strip() and sku_groups[(p.sku or "").strip().casefold()] > 1:
            found.append(_issue(company_id, "DUPLICATE_PRODUCT_SKU", "ERROR", "PRODUCTS", "product", p.id,
                "Duplicate product SKU", f"SKU '{p.sku}' is used by more than one product in this company.", {"product_id": p.id, "sku": p.sku}))
        inv = db.query(Inventory).filter(Inventory.product_id == p.id, Inventory.company_id == company_id).first()
        if inv is None:
            found.append(_issue(company_id, "MISSING_INVENTORY", "WARNING", "INVENTORY", "product", p.id,
                "Inventory row is missing", f"Product '{p.name}' has no inventory record.", {"product_id": p.id, "product_stock_quantity": p.stock_quantity, "expected_quantity": p.stock_quantity}))
        else:
            if inv.current_stock != p.stock_quantity:
                found.append(_issue(company_id, "PRODUCT_INVENTORY_MISMATCH", "ERROR", "INVENTORY", "inventory", inv.id,
                    "Product and inventory quantities differ", f"Product stock is {p.stock_quantity}, but inventory current stock is {inv.current_stock}.", {"product_id": p.id, "product_name": p.name, "product_stock_quantity": p.stock_quantity, "current_quantity": inv.current_stock, "expected_quantity": p.stock_quantity, "difference": inv.current_stock - p.stock_quantity}))
            if inv.available_stock != inv.current_stock - inv.reserved_stock:
                expected = inv.current_stock - inv.reserved_stock
                found.append(_issue(company_id, "AVAILABLE_STOCK_MISMATCH", "ERROR", "INVENTORY", "inventory", inv.id,
                    "Available stock is inconsistent", f"Available stock is {inv.available_stock}; expected {expected} from current minus reserved stock.", {"product_id": p.id, "current_quantity": inv.current_stock, "reserved_quantity": inv.reserved_stock, "available_quantity": inv.available_stock, "expected_quantity": expected, "difference": inv.available_stock - expected}))

    customers = db.query(Customer).filter(Customer.company_id == company_id).all()
    records_checked += len(customers)
    for c in customers:
        missing = [label for label, value in [("customer_id", c.customer_id), ("full_name", c.full_name)] if not (value or "").strip()]
        if missing:
            found.append(_issue(company_id, "MISSING_CUSTOMER_FIELDS", "ERROR", "CUSTOMERS", "customer", c.id,
                "Mandatory customer information is missing", f"Customer {c.id} is missing: {', '.join(missing)}.", {"customer_id": c.id, "missing_fields": missing}))

    sales = db.query(Sale).filter(Sale.company_id == company_id, Sale.is_deleted.is_(False)).all()
    records_checked += len(sales)
    for sale in sales:
        customer = db.query(Customer).filter(Customer.id == sale.customer_id, Customer.company_id == company_id).first()
        if customer is None:
            found.append(_issue(company_id, "INVALID_SALE_CUSTOMER", "ERROR", "SALES", "sale", sale.id,
                "Sale references an invalid customer", f"Sale {sale.invoice_number} references customer ID {sale.customer_id}, which is not in this company.", {"sale_id": sale.id, "invoice_number": sale.invoice_number, "customer_id": sale.customer_id}))
        items = db.query(SaleItem).filter(SaleItem.sale_id == sale.id).all()
        for item in items:
            records_checked += 1
            product = db.query(Product).filter(Product.id == item.product_id, Product.company_id == company_id).first()
            if product is None:
                found.append(_issue(company_id, "INVALID_SALE_PRODUCT", "ERROR", "SALES", "sale_item", item.id,
                    "Sale references an invalid product", f"Sale {sale.invoice_number} references product ID {item.product_id}, which is not in this company.", {"sale_id": sale.id, "invoice_number": sale.invoice_number, "sale_item_id": item.id, "product_id": item.product_id}))
            elif str(product.status or "").upper() not in ("ACTIVE", "ENABLED"):
                found.append(_issue(company_id, "INACTIVE_SALE_PRODUCT", "WARNING", "SALES", "sale_item", item.id,
                    "Sale references an inactive product", f"Sale {sale.invoice_number} includes inactive product '{product.name}'.", {"sale_id": sale.id, "invoice_number": sale.invoice_number, "sale_item_id": item.id, "product_id": product.id, "product_name": product.name, "product_status": product.status}))
            if item.quantity is None or item.quantity <= 0:
                found.append(_issue(company_id, "INVALID_SALE_QUANTITY", "ERROR", "SALES", "sale_item", item.id,
                    "Sale quantity is invalid", f"Sale item {item.id} has quantity {item.quantity}.", {"sale_id": sale.id, "sale_item_id": item.id, "quantity": item.quantity}))

    inventories = db.query(Inventory).filter(Inventory.company_id == company_id).all()
    records_checked += len(inventories)
    for inv in inventories:
        movements = db.query(InventoryMovement).filter(InventoryMovement.inventory_id == inv.id).order_by(InventoryMovement.created_at.asc(), InventoryMovement.id.asc()).all()
        records_checked += len(movements)
        for movement in movements:
            mtype = (movement.movement_type or "").casefold()
            if "addition" in mtype or "add" in mtype:
                expected = movement.previous_quantity + abs(movement.quantity_changed)
            elif "removal" in mtype or "remove" in mtype or "deduct" in mtype:
                expected = movement.previous_quantity - abs(movement.quantity_changed)
            else:
                expected = movement.previous_quantity + movement.quantity_changed
            if expected != movement.updated_quantity:
                product = inv.product
                found.append(_issue(company_id, "INCONSISTENT_STOCK_MOVEMENT", "ERROR", "STOCK_MOVEMENTS", "movement", movement.id,
                    "Stock movement quantities are inconsistent", f"Movement {movement.id}: previous {movement.previous_quantity}, change {movement.quantity_changed}, recorded current {movement.updated_quantity}; expected {expected}.", {"movement_id": movement.id, "inventory_id": inv.id, "product_id": inv.product_id, "product_name": product.name if product else None, "previous_quantity": movement.previous_quantity, "quantity_changed": movement.quantity_changed, "current_quantity": movement.updated_quantity, "expected_quantity": expected, "difference": movement.updated_quantity - expected}))

    # Report totals are reconciled from source transactions; the aggregate is included in the run summary.
    sales_total = db.query(func.coalesce(func.sum(Sale.total_amount), 0)).filter(Sale.company_id == company_id, Sale.is_deleted.is_(False)).scalar()
    item_total = db.query(func.coalesce(func.sum(SaleItem.total), 0)).join(Sale, Sale.id == SaleItem.sale_id).filter(Sale.company_id == company_id, Sale.is_deleted.is_(False)).scalar()
    records_checked += 1
    if abs(float(sales_total or 0) - float(item_total or 0)) > 0.02:
        found.append(_issue(company_id, "SALES_TOTAL_MISMATCH", "WARNING", "REPORTS", "company_sales_total", company_id,
            "Sales totals do not match transaction line totals", f"Sales header total is {sales_total}; sum of sale item totals is {item_total}.", {"sales_total": float(sales_total or 0), "items_total": float(item_total or 0), "difference": float(sales_total or 0) - float(item_total or 0)}))

    for item in found:
        summary[item["issue_type"]] += 1
    return found, records_checked, dict(summary)


def run_reconciliation(db: Session, company_id: int, user_id: int):
    run = ReconciliationRun(company_id=company_id, triggered_by=user_id, status="RUNNING")
    db.add(run)
    db.commit()
    db.refresh(run)
    started = run.started_at
    before_active = db.query(DataQualityIssue).filter(DataQualityIssue.company_id == company_id, DataQualityIssue.status.in_(ACTIVE_STATUSES)).count()
    try:
        detected, checked, summary = _collect_issues(db, company_id)
        now = datetime.now(timezone.utc)
        seen_keys = set()
        created = 0
        updated = 0
        for data in detected:
            key = data["issue_key"]
            seen_keys.add(key)
            issue = db.query(DataQualityIssue).filter(DataQualityIssue.company_id == company_id, DataQualityIssue.issue_key == key).first()
            if issue is None:
                issue = DataQualityIssue(**data, status="OPEN", detected_at=now, last_seen_at=now)
                db.add(issue)
                created += 1
            else:
                issue.issue_type = data["issue_type"]
                issue.severity = data["severity"]
                issue.module = data["module"]
                issue.record_type = data["record_type"]
                issue.record_id = data["record_id"]
                issue.title = data["title"]
                issue.description = data["description"]
                issue.details = data["details"]
                issue.last_seen_at = now
                if issue.status in ("RESOLVED", "IGNORED"):
                    issue.status = "OPEN"
                    issue.resolution_note = None
                    issue.resolved_by = None
                    issue.resolved_at = None
                updated += 1
        db.flush()
        # Mark previously active issues no longer detected as resolved by reconciliation, preserving the resolution audit trail.
        active = db.query(DataQualityIssue).filter(DataQualityIssue.company_id == company_id, DataQualityIssue.status.in_(ACTIVE_STATUSES)).all()
        resolved = 0
        for issue in active:
            if issue.issue_key not in seen_keys:
                issue.status = "RESOLVED"
                issue.resolution_note = "Automatically resolved: issue was not detected in the latest reconciliation."
                issue.resolved_by = user_id
                issue.resolved_at = now
                resolved += 1
        db.add(AuditLog(company_id=company_id, user_id=user_id, entity_name="DATA_QUALITY", action=f"RECONCILIATION_RUN:{run.id}"))
        run.records_checked = checked
        run.issues_detected = len(detected)
        run.issues_resolved = resolved
        run.failed_checks = 0
        run.status = "COMPLETED_WITH_ISSUES" if detected else "COMPLETED"
        run.completed_at = now
        run.summary = {"by_type": summary, "created": created, "updated": updated, "active_before": before_active, "active_after": sum(1 for x in detected)}
        db.commit()
        db.refresh(run)
        return run
    except Exception as exc:
        db.rollback()
        failed = db.query(ReconciliationRun).filter(ReconciliationRun.id == run.id).first()
        if failed:
            failed.status = "FAILED"
            failed.completed_at = datetime.now(timezone.utc)
            failed.failed_checks = 1
            failed.failure_reason = str(exc)[:4000]
            db.commit()
        raise
