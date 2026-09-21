
from datetime import datetime
import csv
import io

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse, Response

from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.roles import require_roles
from app.models.audit_log import AuditLog
from app.schemas.audit import AuditLogResponse


router = APIRouter(
    prefix="/audit",
    tags=["Audit Logs"],
)


# =========================================================
# COMMON AUDIT QUERY
# =========================================================

def build_audit_query(
    db: Session,
    current_user,
    search: str | None = None,
    action: str | None = None,
    resource_type: str | None = None,
    status: str | None = None,
    user_id: int | None = None,
    start_date: datetime | None = None,
    end_date: datetime | None = None,
):
    """
    Build the common audit-log query.

    This is shared by:
    - Audit log listing
    - CSV export
    - PDF export

    Company isolation is always enforced for COMPANY_ADMIN.
    """

    query = db.query(AuditLog)

    # -----------------------------------------------------
    # COMPANY ISOLATION
    # -----------------------------------------------------

    if current_user.role == "COMPANY_ADMIN":
        query = query.filter(
            AuditLog.company_id == current_user.company_id
        )

    # -----------------------------------------------------
    # USER FILTER
    # -----------------------------------------------------

    if user_id is not None:
        query = query.filter(
            AuditLog.user_id == user_id
        )

    # -----------------------------------------------------
    # SEARCH
    # -----------------------------------------------------

    if search:
        search_value = f"%{search.strip()}%"

        query = query.filter(
            AuditLog.action.ilike(search_value)
            | AuditLog.entity_name.ilike(search_value)
            | AuditLog.resource_type.ilike(search_value)
            | AuditLog.resource_id.ilike(search_value)
            | AuditLog.description.ilike(search_value)
            | AuditLog.ip_address.ilike(search_value)
        )

    # -----------------------------------------------------
    # ACTION
    # -----------------------------------------------------

    if action:
        query = query.filter(
            AuditLog.action == action
        )

    # -----------------------------------------------------
    # RESOURCE TYPE
    # -----------------------------------------------------

    if resource_type:
        query = query.filter(
            AuditLog.resource_type == resource_type
        )

    # -----------------------------------------------------
    # STATUS
    # -----------------------------------------------------

    if status:
        query = query.filter(
            AuditLog.status == status
        )

    # -----------------------------------------------------
    # START DATE
    # -----------------------------------------------------

    if start_date:
        query = query.filter(
            AuditLog.created_at >= start_date
        )

    # -----------------------------------------------------
    # END DATE
    # -----------------------------------------------------

    if end_date:
        query = query.filter(
            AuditLog.created_at <= end_date
        )

    return query


# =========================================================
# SORTING
# =========================================================

def apply_sorting(
    query,
    sort_by: str = "created_at",
    sort_order: str = "desc",
):
    allowed_sort_fields = {
        "id": AuditLog.id,
        "created_at": AuditLog.created_at,
        "action": AuditLog.action,
        "user_id": AuditLog.user_id,
        "resource_type": AuditLog.resource_type,
        "status": AuditLog.status,
        "resource_id": AuditLog.resource_id,
    }

    sort_column = allowed_sort_fields.get(
        sort_by,
        AuditLog.created_at,
    )

    if sort_order.lower() == "asc":
        return query.order_by(
            sort_column.asc()
        )

    return query.order_by(
        sort_column.desc()
    )


# =========================================================
# GET AUDIT LOGS
# =========================================================

@router.get(
    "/logs",
    response_model=list[AuditLogResponse],
)
def get_audit_logs(
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(
            "SUPER_ADMIN",
            "COMPANY_ADMIN",
        )
    ),

    # Pagination
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),

    # Search
    search: str | None = Query(None),

    # Filters
    action: str | None = Query(None),
    resource_type: str | None = Query(None),
    status: str | None = Query(None),
    user_id: int | None = Query(None),

    # Date range
    start_date: datetime | None = Query(None),
    end_date: datetime | None = Query(None),

    # Sorting
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc"),
):
    query = build_audit_query(
        db=db,
        current_user=current_user,
        search=search,
        action=action,
        resource_type=resource_type,
        status=status,
        user_id=user_id,
        start_date=start_date,
        end_date=end_date,
    )

    query = apply_sorting(
        query,
        sort_by=sort_by,
        sort_order=sort_order,
    )

    offset = (page - 1) * page_size

    logs = (
        query
        .offset(offset)
        .limit(page_size)
        .all()
    )

    return logs


# =========================================================
# GET SINGLE AUDIT LOG
# =========================================================

@router.get(
    "/logs/{log_id}",
    response_model=AuditLogResponse,
)
def get_audit_log(
    log_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(
            "SUPER_ADMIN",
            "COMPANY_ADMIN",
        )
    ),
):
    query = db.query(AuditLog).filter(
        AuditLog.id == log_id
    )

    # Company isolation
    if current_user.role == "COMPANY_ADMIN":
        query = query.filter(
            AuditLog.company_id == current_user.company_id
        )

    log = query.first()

    if not log:
        raise HTTPException(
            status_code=404,
            detail="Audit log not found",
        )

    return log


# =========================================================
# CSV EXPORT
# =========================================================

@router.get(
    "/logs/export/csv",
)
def export_audit_logs_csv(
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(
            "SUPER_ADMIN",
            "COMPANY_ADMIN",
        )
    ),

    # Search
    search: str | None = Query(None),

    # Filters
    action: str | None = Query(None),
    resource_type: str | None = Query(None),
    status: str | None = Query(None),
    user_id: int | None = Query(None),

    # Date range
    start_date: datetime | None = Query(None),
    end_date: datetime | None = Query(None),

    # Sorting
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc"),
):
    """
    Export filtered audit logs as CSV.

    Export respects:
    - Authentication
    - Admin authorization
    - Company isolation
    - Search
    - Filters
    - Date range
    - Sorting
    """

    query = build_audit_query(
        db=db,
        current_user=current_user,
        search=search,
        action=action,
        resource_type=resource_type,
        status=status,
        user_id=user_id,
        start_date=start_date,
        end_date=end_date,
    )

    query = apply_sorting(
        query,
        sort_by=sort_by,
        sort_order=sort_order,
    )

    logs = query.all()

    output = io.StringIO()

    writer = csv.writer(output)

    # -----------------------------------------------------
    # CSV HEADER
    # -----------------------------------------------------

    writer.writerow(
        [
            "ID",
            "Company ID",
            "User ID",
            "Action",
            "Entity",
            "Resource Type",
            "Resource ID",
            "Description",
            "IP Address",
            "Browser",
            "User Agent",
            "Status",
            "Before Values",
            "After Values",
            "Created At",
        ]
    )

    # -----------------------------------------------------
    # CSV DATA
    # -----------------------------------------------------

    for log in logs:
        writer.writerow(
            [
                log.id,
                log.company_id,
                log.user_id,
                log.action,
                log.entity_name,
                log.resource_type,
                log.resource_id,
                log.description,
                log.ip_address,
                log.browser,
                log.user_agent,
                log.status,
                log.before_values,
                log.after_values,
                log.created_at.isoformat()
                if log.created_at
                else "",
            ]
        )

    output.seek(0)

    filename = (
        f"audit_logs_"
        f"{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    )

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": (
                f'attachment; filename="{filename}"'
            )
        },
    )


# =========================================================
# PDF EXPORT
# =========================================================

@router.get(
    "/logs/export/pdf",
)
def export_audit_logs_pdf(
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(
            "SUPER_ADMIN",
            "COMPANY_ADMIN",
        )
    ),

    # Search
    search: str | None = Query(None),

    # Filters
    action: str | None = Query(None),
    resource_type: str | None = Query(None),
    status: str | None = Query(None),
    user_id: int | None = Query(None),

    # Date range
    start_date: datetime | None = Query(None),
    end_date: datetime | None = Query(None),

    # Sorting
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc"),
):
    """
    Export filtered audit logs as PDF.

    Company scope and all selected filters are enforced
    on the backend.
    """

    try:
        from reportlab.lib import colors
        from reportlab.lib.pagesizes import landscape, A4
        from reportlab.lib.styles import getSampleStyleSheet
        from reportlab.lib.units import mm
        from reportlab.platypus import (
            SimpleDocTemplate,
            Table,
            TableStyle,
            Paragraph,
            Spacer,
        )

    except ImportError:
        raise HTTPException(
            status_code=500,
            detail=(
                "PDF export requires the 'reportlab' "
                "package. Install it with: pip install reportlab"
            ),
        )

    query = build_audit_query(
        db=db,
        current_user=current_user,
        search=search,
        action=action,
        resource_type=resource_type,
        status=status,
        user_id=user_id,
        start_date=start_date,
        end_date=end_date,
    )

    query = apply_sorting(
        query,
        sort_by=sort_by,
        sort_order=sort_order,
    )

    logs = query.all()

    buffer = io.BytesIO()

    document = SimpleDocTemplate(
        buffer,
        pagesize=landscape(A4),
        rightMargin=8 * mm,
        leftMargin=8 * mm,
        topMargin=8 * mm,
        bottomMargin=8 * mm,
    )

    styles = getSampleStyleSheet()

    elements = []

    # -----------------------------------------------------
    # TITLE
    # -----------------------------------------------------

    elements.append(
        Paragraph(
            "RetailPulse Analytics - Audit Logs",
            styles["Title"],
        )
    )

    elements.append(
        Spacer(1, 5 * mm)
    )

    # -----------------------------------------------------
    # SUMMARY
    # -----------------------------------------------------

    company_text = (
        str(current_user.company_id)
        if current_user.role == "COMPANY_ADMIN"
        else "All Companies"
    )

    elements.append(
        Paragraph(
            f"Company Scope: {company_text}",
            styles["Normal"],
        )
    )

    elements.append(
        Paragraph(
            f"Total Records: {len(logs)}",
            styles["Normal"],
        )
    )

    elements.append(
        Spacer(1, 4 * mm)
    )

    # -----------------------------------------------------
    # TABLE
    # -----------------------------------------------------

    table_data = [
        [
            "ID",
            "User",
            "Action",
            "Resource",
            "Resource ID",
            "Description",
            "IP",
            "Status",
            "Timestamp",
        ]
    ]

    for log in logs:
        description = (
            log.description
            if log.description
            else ""
        )

        # Prevent extremely large text from breaking layout
        if len(description) > 100:
            description = (
                description[:97] + "..."
            )

        table_data.append(
            [
                str(log.id),
                str(log.user_id or ""),
                str(log.action or ""),
                str(
                    log.resource_type
                    or log.entity_name
                    or ""
                ),
                str(log.resource_id or ""),
                description,
                str(log.ip_address or ""),
                str(log.status or ""),
                (
                    log.created_at.strftime(
                        "%Y-%m-%d %H:%M:%S"
                    )
                    if log.created_at
                    else ""
                ),
            ]
        )

    table = Table(
        table_data,
        repeatRows=1,
        colWidths=[
            12 * mm,
            15 * mm,
            25 * mm,
            25 * mm,
            20 * mm,
            75 * mm,
            25 * mm,
            20 * mm,
            35 * mm,
        ],
    )

    table.setStyle(
        TableStyle(
            [
                (
                    "BACKGROUND",
                    (0, 0),
                    (-1, 0),
                    colors.HexColor("#1f2937"),
                ),
                (
                    "TEXTCOLOR",
                    (0, 0),
                    (-1, 0),
                    colors.white,
                ),
                (
                    "FONTNAME",
                    (0, 0),
                    (-1, 0),
                    "Helvetica-Bold",
                ),
                (
                    "FONTSIZE",
                    (0, 0),
                    (-1, -1),
                    7,
                ),
                (
                    "GRID",
                    (0, 0),
                    (-1, -1),
                    0.5,
                    colors.grey,
                ),
                (
                    "VALIGN",
                    (0, 0),
                    (-1, -1),
                    "TOP",
                ),
                (
                    "ROWBACKGROUNDS",
                    (0, 1),
                    (-1, -1),
                    [
                        colors.white,
                        colors.HexColor("#f3f4f6"),
                    ],
                ),
                (
                    "LEFTPADDING",
                    (0, 0),
                    (-1, -1),
                    3,
                ),
                (
                    "RIGHTPADDING",
                    (0, 0),
                    (-1, -1),
                    3,
                ),
                (
                    "TOPPADDING",
                    (0, 0),
                    (-1, -1),
                    3,
                ),
                (
                    "BOTTOMPADDING",
                    (0, 0),
                    (-1, -1),
                    3,
                ),
            ]
        )
    )

    elements.append(table)

    # -----------------------------------------------------
    # BUILD PDF
    # -----------------------------------------------------

    document.build(elements)

    buffer.seek(0)

    filename = (
        f"audit_logs_"
        f"{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
    )

    return Response(
        content=buffer.getvalue(),
        media_type="application/pdf",
        headers={
            "Content-Disposition": (
                f'attachment; filename="{filename}"'
            )
        },
    )

