import csv
import io
import json
import os
from datetime import datetime, date, time, timedelta, timezone
from decimal import Decimal
from pathlib import Path
from email.message import EmailMessage
import smtplib
from zoneinfo import ZoneInfo

from fastapi import HTTPException
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from sqlalchemy import func, or_, and_
from sqlalchemy.orm import Session, aliased

from app.models.report_history import ReportHistory
from app.models.scheduled_report import ScheduledReport
from app.models.sale import Sale
from app.models.sale_item import SaleItem
from app.models.product import Product
from app.models.category import Category
from app.models.customer import Customer
from app.models.inventory import Inventory
from app.models.inventory_movement import InventoryMovement
from app.models.user import User

REPORT_TYPES = {
    "sales": "Sales Report",
    "inventory": "Inventory Report",
    "customer": "Customer Report",
    "product_performance": "Product Performance Report",
    "stock_movement": "Stock Movement Report",
}
REPORT_DIR = Path(__file__).resolve().parent.parent / "storage" / "reports"
REPORT_DIR.mkdir(parents=True, exist_ok=True)


def _clean(v):
    if isinstance(v, Decimal): return float(v)
    if isinstance(v, (datetime, date, time)): return v.isoformat()
    return v


def _filters_dict(filters):
    if hasattr(filters, "model_dump"):
        return filters.model_dump(exclude_none=True)
    return dict(filters or {})


def _date_filter(column, filters):
    clauses = []
    if filters.start_date:
        clauses.append(column >= datetime.combine(filters.start_date, time.min))
    if filters.end_date:
        clauses.append(column <= datetime.combine(filters.end_date, time.max))
    return clauses


def _validate_type(report_type):
    if report_type not in REPORT_TYPES:
        raise HTTPException(400, "Invalid report type")


def _base_product_filters(query, filters, product_col=Product):
    if filters.product_id: query = query.filter(product_col.id == filters.product_id)
    if filters.category_id: query = query.filter(product_col.category_id == filters.category_id)
    if filters.brand: query = query.filter(product_col.brand.ilike(f"%{filters.brand.strip()}%"))
    return query


def _sales_rows(db, company_id, f):
    q = (db.query(Sale, SaleItem, Product, Category, Customer, User)
         .join(SaleItem, SaleItem.sale_id == Sale.id)
         .join(Product, Product.id == SaleItem.product_id)
         .outerjoin(Category, Category.id == Product.category_id)
         .outerjoin(Customer, Customer.id == Sale.customer_id)
         .outerjoin(User, User.id == Sale.created_by)
         .filter(Sale.company_id == company_id, Product.company_id == company_id, Sale.is_deleted.is_(False)))
    q = _base_product_filters(q, f)
    if f.customer_id: q = q.filter(Sale.customer_id == f.customer_id)
    if f.sales_status: q = q.filter(Sale.payment_status.ilike(f.sales_status))
    if f.user_id: q = q.filter(Sale.created_by == f.user_id)
    for c in _date_filter(Sale.sale_date, f): q = q.filter(c)
    rows = []
    for sale, item, product, category, customer, user in q.all():
        rows.append({
            "Invoice": sale.invoice_number, "Sale Date": sale.sale_date, "Customer": customer.full_name if customer else sale.customer_name,
            "Product": product.name, "SKU": product.sku, "Category": category.name if category else "-", "Brand": product.brand or "-",
            "Quantity": item.quantity, "Unit Price": item.unit_price, "Discount": item.discount, "Tax": item.tax, "Total": item.total,
            "Payment Status": sale.payment_status, "Payment Method": sale.payment_method, "Sales Channel": sale.sales_channel,
            "Created By": user.name if user else str(sale.created_by),
        })
    return rows


def _inventory_rows(db, company_id, f):
    q = (db.query(Inventory, Product, Category)
         .join(Product, Product.id == Inventory.product_id)
         .outerjoin(Category, Category.id == Product.category_id)
         .filter(Inventory.company_id == company_id, Product.company_id == company_id))
    q = _base_product_filters(q, f)
    if f.stock_status: q = q.filter(Inventory.stock_status.ilike(f.stock_status))
    if f.start_date: q = q.filter(Inventory.updated_at >= datetime.combine(f.start_date, time.min))
    if f.end_date: q = q.filter(Inventory.updated_at <= datetime.combine(f.end_date, time.max))
    return [{"Product": p.name, "SKU": p.sku, "Category": c.name if c else "-", "Brand": p.brand or "-",
             "Current Stock": i.current_stock, "Reserved Stock": i.reserved_stock, "Available Stock": i.available_stock,
             "Reorder Level": i.reorder_level, "Stock Status": i.stock_status, "Updated At": i.updated_at} for i,p,c in q.all()]


def _customer_rows(db, company_id, f):
    q = db.query(Customer).filter(Customer.company_id == company_id)
    if f.customer_id: q = q.filter(Customer.id == f.customer_id)
    if f.user_id: q = q.filter(Customer.created_by == f.user_id)
    if f.start_date: q = q.filter(Customer.created_at >= datetime.combine(f.start_date, time.min))
    if f.end_date: q = q.filter(Customer.created_at <= datetime.combine(f.end_date, time.max))
    if f.sales_status: q = q.filter(Customer.status.ilike(f.sales_status))
    rows = []
    for c in q.all():
        rows.append({"Customer ID": c.customer_id, "Name": c.full_name, "Email": c.email or "-", "Phone": c.phone_number or "-",
                     "Status": c.status, "Segment": c.customer_segment, "Total Orders": c.total_orders, "Quantity Purchased": c.total_quantity_purchased,
                     "Lifetime Revenue": c.lifetime_revenue, "Average Order Value": c.average_order_value, "Purchase Frequency": c.purchase_frequency,
                     "Created At": c.created_at})
    return rows


def _product_performance_rows(db, company_id, f):
    q = (db.query(Product, Category,
                  func.coalesce(func.sum(SaleItem.quantity), 0).label("qty"),
                  func.coalesce(func.sum(SaleItem.total), 0).label("revenue"),
                  func.count(func.distinct(Sale.id)).label("orders"))
         .outerjoin(Category, Category.id == Product.category_id)
         .outerjoin(SaleItem, SaleItem.product_id == Product.id)
         .outerjoin(Sale, and_(Sale.id == SaleItem.sale_id, Sale.company_id == company_id, Sale.is_deleted.is_(False)))
         .filter(Product.company_id == company_id)
         .group_by(Product.id, Category.id))
    q = _base_product_filters(q, f)
    if f.customer_id: q = q.filter(or_(Sale.customer_id == f.customer_id, Sale.id.is_(None)))
    if f.user_id: q = q.filter(or_(Sale.created_by == f.user_id, Sale.id.is_(None)))
    if f.sales_status: q = q.filter(or_(Sale.payment_status.ilike(f.sales_status), Sale.id.is_(None)))
    if f.start_date: q = q.filter(or_(Sale.sale_date >= datetime.combine(f.start_date, time.min), Sale.id.is_(None)))
    if f.end_date: q = q.filter(or_(Sale.sale_date <= datetime.combine(f.end_date, time.max), Sale.id.is_(None)))
    rows = []
    for p,c,qty,revenue,orders in q.all():
        rows.append({"Product": p.name, "SKU": p.sku, "Category": c.name if c else "-", "Brand": p.brand or "-", "Units Sold": qty,
                     "Revenue": revenue, "Orders": orders, "Average Order Revenue": (Decimal(str(revenue or 0))/orders if orders else Decimal("0")),
                     "Current Stock": p.stock_quantity, "Unit Price": p.unit_price})
    return rows


def _stock_movement_rows(db, company_id, f):
    q = (db.query(InventoryMovement, Inventory, Product, Category, User)
         .join(Inventory, Inventory.id == InventoryMovement.inventory_id)
         .join(Product, Product.id == Inventory.product_id)
         .outerjoin(Category, Category.id == Product.category_id)
         .outerjoin(User, User.id == InventoryMovement.performed_by)
         .filter(Inventory.company_id == company_id, Product.company_id == company_id))
    q = _base_product_filters(q, f)
    if f.user_id: q = q.filter(InventoryMovement.performed_by == f.user_id)
    if f.stock_status: q = q.filter(Inventory.stock_status.ilike(f.stock_status))
    for c in _date_filter(InventoryMovement.created_at, f): q = q.filter(c)
    return [{"Date": m.created_at, "Product": p.name, "SKU": p.sku, "Category": c.name if c else "-", "Brand": p.brand or "-",
             "Movement Type": m.movement_type, "Quantity Changed": m.quantity_changed, "Previous Quantity": m.previous_quantity,
             "Updated Quantity": m.updated_quantity, "Reason": m.reason, "Remarks": m.remarks or "-", "Performed By": u.name if u else str(m.performed_by),
             "Stock Status": i.stock_status} for m,i,p,c,u in q.all()]


def generate_rows(db, company_id, report_type, filters):
    _validate_type(report_type)
    f = filters
    if report_type == "sales": rows = _sales_rows(db, company_id, f)
    elif report_type == "inventory": rows = _inventory_rows(db, company_id, f)
    elif report_type == "customer": rows = _customer_rows(db, company_id, f)
    elif report_type == "product_performance": rows = _product_performance_rows(db, company_id, f)
    else: rows = _stock_movement_rows(db, company_id, f)
    return rows


def _sort_rows(rows, sort_by, sort_order):
    if not sort_by or not rows: return rows
    key = sort_by.lower().replace("_", " ")
    candidates = {str(k).lower(): k for k in rows[0].keys()}
    actual = candidates.get(key) or next((v for k,v in candidates.items() if key in k), None)
    if actual:
        try: rows.sort(key=lambda x: (x.get(actual) is None, x.get(actual)), reverse=sort_order == "desc")
        except TypeError: pass
    return rows


def report_response(db, user, report_type, filters, page, page_size, sort_by, sort_order):
    rows = generate_rows(db, user.company_id, report_type, filters)
    _sort_rows(rows, sort_by, sort_order)
    total = len(rows)
    start = (page - 1) * page_size
    items = rows[start:start + page_size]
    history = ReportHistory(company_id=user.company_id, generated_by=user.id, report_type=report_type, report_name=REPORT_TYPES[report_type],
                            applied_filters=json.dumps(_filters_dict(filters), default=str), report_period=_period(filters), export_format="VIEW",
                            status="SUCCESS", row_count=total)
    db.add(history)
    db.commit()
    return {"report_type": report_type, "report_name": REPORT_TYPES[report_type], "items": [{k: _clean(v) for k, v in r.items()} for r in items],
            "total": total, "page": page, "page_size": page_size, "total_pages": (total + page_size - 1)//page_size,
            "applied_filters": _filters_dict(filters), "period": _period(filters), "history_id": history.id}


def _period(filters):
    start = filters.start_date.isoformat() if filters.start_date else "All time"
    end = filters.end_date.isoformat() if filters.end_date else "Present"
    return f"{start} to {end}"


def _write_csv(report_name, rows, filters, period):
    output = io.StringIO()
    output.write(f"# Report: {report_name}\n")
    output.write(f"# Period: {period}\n")
    output.write("# Applied Filters: " + json.dumps(_filters_dict(filters), default=str) + "\n")
    if not rows: output.write("No data\n"); return output.getvalue().encode("utf-8-sig")
    writer = csv.DictWriter(output, fieldnames=list(rows[0].keys()))
    writer.writeheader(); writer.writerows([{k:_clean(v) for k,v in r.items()} for r in rows])
    return output.getvalue().encode("utf-8-sig")


def _write_pdf(report_name, rows, filters, period):
    output = io.BytesIO()
    doc = SimpleDocTemplate(output, pagesize=landscape(A4), rightMargin=24, leftMargin=24, topMargin=24, bottomMargin=24)
    styles = getSampleStyleSheet()
    story = [Paragraph(report_name, styles["Title"]), Paragraph(f"Period: {period}", styles["Normal"]),
             Paragraph("Applied filters: " + (json.dumps(_filters_dict(filters), default=str) if _filters_dict(filters) else "None"), styles["Normal"]), Spacer(1, 12)]
    if rows:
        headers=list(rows[0].keys()); data=[headers]
        for r in rows: data.append([str(_clean(r.get(h, ""))) for h in headers])
        table=Table(data, repeatRows=1)
        table.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,0),colors.HexColor("#1E293B")),("TEXTCOLOR",(0,0),(-1,0),colors.white),
                                   ("GRID",(0,0),(-1,-1),0.25,colors.grey),("FONTSIZE",(0,0),(-1,-1),7),("VALIGN",(0,0),(-1,-1),"TOP")]))
        story.append(table)
    else: story.append(Paragraph("No data found for the selected filters.", styles["Normal"]))
    doc.build(story)
    return output.getvalue()


def export_report(db, user, report_type, filters, export_format, sort_by=None, sort_order="desc"):
    rows = generate_rows(db, user.company_id, report_type, filters)
    _sort_rows(rows, sort_by, sort_order)
    period=_period(filters)
    stamp=datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    ext=export_format.lower(); filename=f"{report_type}_{stamp}.{ext}"; path=REPORT_DIR/filename
    try:
        content = _write_csv(REPORT_TYPES[report_type], rows, filters, period) if export_format == "CSV" else _write_pdf(REPORT_TYPES[report_type], rows, filters, period)
        path.write_bytes(content)
        history=ReportHistory(company_id=user.company_id, generated_by=user.id, report_type=report_type, report_name=REPORT_TYPES[report_type],
                              applied_filters=json.dumps(_filters_dict(filters), default=str), report_period=period, export_format=export_format,
                              status="SUCCESS", file_path=str(path), row_count=len(rows))
        db.add(history); db.commit(); db.refresh(history)
        return path, history
    except Exception as exc:
        db.rollback()
        history=ReportHistory(company_id=user.company_id, generated_by=user.id, report_type=report_type, report_name=REPORT_TYPES[report_type],
                              applied_filters=json.dumps(_filters_dict(filters), default=str), report_period=period, export_format=export_format,
                              status="FAILED", failure_reason=str(exc), row_count=0)
        db.add(history); db.commit()
        raise


def _next_run(frequency, execution_time, now):
    local=now.replace(hour=execution_time.hour, minute=execution_time.minute, second=0, microsecond=0)
    if frequency == "DAILY": candidate=local if local > now else local+timedelta(days=1)
    elif frequency == "WEEKLY":
        days=(7-now.weekday()+0)%7; candidate=local+timedelta(days=days)
        if candidate <= now: candidate += timedelta(days=7)
    else:
        month=now.month%12+1; year=now.year+(1 if now.month==12 else 0)
        candidate=local.replace(year=year,month=month,day=1)
        if now.day == 1 and local > now: candidate=local
    return candidate


def calculate_next_run(schedule, now=None):
    tz = ZoneInfo(os.getenv("REPORT_TIMEZONE", "Asia/Kolkata"))
    now = (now or datetime.now(tz)).astimezone(tz)
    return _next_run(schedule.frequency, schedule.execution_time, now)


def send_email(recipients, subject, body, attachment_path):
    host=os.getenv("SMTP_HOST"); port=int(os.getenv("SMTP_PORT", "587")); username=os.getenv("SMTP_USERNAME"); password=os.getenv("SMTP_PASSWORD"); sender=os.getenv("SMTP_FROM", username or "")
    if not host or not sender: raise RuntimeError("SMTP is not configured. Set SMTP_HOST and SMTP_FROM/SMTP_USERNAME.")
    msg=EmailMessage(); msg["Subject"]=subject; msg["From"]=sender; msg["To"]=", ".join(recipients); msg.set_content(body)
    data=Path(attachment_path).read_bytes(); maintype="application"; subtype="pdf" if attachment_path.lower().endswith(".pdf") else "csv"
    msg.add_attachment(data, maintype=maintype, subtype=subtype, filename=Path(attachment_path).name)
    with smtplib.SMTP(host, port, timeout=30) as server:
        if os.getenv("SMTP_TLS", "true").lower() == "true": server.starttls()
        if username and password: server.login(username, password)
        server.send_message(msg)


def execute_schedule(db, schedule):
    from app.schemas.report import ReportFilters
    try:
        filters=ReportFilters.model_validate(json.loads(schedule.filters_json or "{}"))
        user=db.query(User).filter(User.id==schedule.created_by, User.company_id==schedule.company_id).first()
        if not user: raise RuntimeError("Schedule owner no longer exists")
        path, history=export_report(db,user,schedule.report_type,filters,schedule.export_format)
        send_email(json.loads(schedule.recipients_json), f"RetailPulse - {schedule.report_name}",
                   f"Your scheduled report is attached. Period: {history.report_period}", str(path))
        schedule.last_status="SUCCESS"; schedule.last_error=None; schedule.last_report_history_id=history.id
    except Exception as exc:
        schedule.last_status="FAILED"; schedule.last_error=str(exc)
    schedule.last_run_at=datetime.now(timezone.utc); schedule.next_run_at=calculate_next_run(schedule, schedule.last_run_at)
    db.commit()
    return schedule
