from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, Query, UploadFile
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

import csv
import io
import json
from datetime import datetime, timezone

from app.core.database import get_db, SessionLocal
from app.dependencies.auth import require_roles
from app.models.import_error import ImportError as ImportErrorModel
from app.models.import_history import ImportHistory
from app.schemas.data_import import ImportHistoryResponse
from app.services.notification_service import create_import_notification, create_role_notifications
from app.services.audit_service import create_audit_log
from app.services.import_service import (
    ImportValidationException,
    normalize_type,
    upload_csv,
    validate_import,
    process_import,
    PREVIEW_ROWS,
)

router = APIRouter(
    prefix="/import",
    tags=["Data Import"],
)

admin_dependency = require_roles("COMPANY_ADMIN")


def get_admin(
    current_user=Depends(admin_dependency),
):
    return current_user


def get_owned_import(
    db: Session,
    import_id: int,
    company_id: int,
):
    item = (
        db.query(ImportHistory)
        .filter(
            ImportHistory.id == import_id,
            ImportHistory.company_id == company_id,
        )
        .first()
    )

    if not item:
        raise HTTPException(
            status_code=404,
            detail="Import record not found.",
        )

    return item


TEMPLATES = {
    "products": ["Product Name", "SKU", "Category", "Unit Price", "Stock Quantity", "Brand", "Description", "Cost Price", "Reorder Threshold", "Unit of Measure"],
    "inventory": ["SKU", "Current Stock", "Reorder Level"],
    "customers": ["Name", "Email", "Phone", "Customer ID", "Date of Birth", "Gender", "Address", "City", "State", "Country", "Postal Code"],
    "sales": ["Customer", "Product", "Quantity", "Unit Price", "Sale Date", "Invoice Number", "Sales Channel", "Payment Method", "Payment Status"],
}


@router.get("/templates/{import_type}")
def download_template(import_type: str, current_user=Depends(get_admin)):
    try:
        normalized = normalize_type(import_type)
    except ImportValidationException as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    output = io.StringIO()
    csv.writer(output).writerow(TEMPLATES[normalized])
    return StreamingResponse(
        iter([output.getvalue()]), media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{normalized}_import_template.csv"'},
    )


# ============================================================
# UPLOAD CSV
# ============================================================

@router.post("/upload")
def upload(
    import_type: str = Query(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(get_admin),
):
    try:
        item, columns, rows = upload_csv(
            db,
            current_user.company_id,
            current_user.id,
            import_type,
            file,
        )

        create_audit_log(
            db=db, company_id=current_user.company_id, user_id=current_user.id,
            action="Import Uploaded", entity_name="Import", resource_type="Import",
            resource_id=item.id, description=f"Uploaded {item.import_type} import file {item.filename} (Import ID: {item.id}).",
            after_values={"import_id": item.id, "import_type": item.import_type, "filename": item.filename},
            commit=True,
        )

        return {
            "success": True,
            "import_id": item.id,
            "import_type": item.import_type,
            "filename": item.filename,
            "total_records": len(rows),
            "columns": columns,
            "preview": rows[:PREVIEW_ROWS],
            "message": (
                "File uploaded successfully. "
                "Validate it before importing."
            ),
        }

    except ImportValidationException as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )


# ============================================================
# VALIDATE IMPORT
# ============================================================

@router.post("/validate")
def validate(
    import_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_admin),
):
    item = get_owned_import(
        db,
        import_id,
        current_user.company_id,
    )

    try:
        (
            columns,
            rows,
            valid,
            invalid,
            duplicates,
            errors,
            preview,
        ) = validate_import(
            db,
            item,
            current_user.company_id,
        )

        return {
            "success": True,
            "import_id": item.id,
            "import_type": item.import_type,
            "total_records": len(rows),
            "valid_records": valid,
            "invalid_records": invalid,
            "duplicate_records": duplicates,
            "columns": columns,
            "preview": preview,
            "errors": errors[:200],
            "message": "Validation completed.",
        }

    except ImportValidationException as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )


# ============================================================
# BACKGROUND IMPORT WORKER
# ============================================================

def _run_import_job(import_id: int, company_id: int, user_id: int):
    """Run an import in an isolated DB session after the HTTP response."""
    worker_db = SessionLocal()
    try:
        item = get_owned_import(worker_db, import_id, company_id)
        item.status = "Validating"
        worker_db.commit()
        item, _, _ = process_import(worker_db, item, company_id, user_id)
        create_import_notification(
            worker_db, company_id=company_id, import_id=item.id,
            import_type=item.import_type, status=item.status,
        )
        worker_db.commit()
    except Exception:
        worker_db.rollback()
        # Persist a safe terminal state without exposing internals.
        item = worker_db.query(ImportHistory).filter(
            ImportHistory.id == import_id, ImportHistory.company_id == company_id
        ).first()
        if item and item.status not in {"Completed", "Completed with Errors", "Cancelled"}:
            item.status = "Failed"
            item.completed_at = datetime.now(timezone.utc)
            worker_db.commit()
        if item:
            try:
                create_import_notification(
                    worker_db, company_id=company_id, import_id=item.id,
                    import_type=item.import_type, status="Failed",
                )
                worker_db.commit()
            except Exception:
                worker_db.rollback()
    finally:
        worker_db.close()


# ============================================================
# START IMPORT (NON-BLOCKING HTTP REQUEST)
# ============================================================

@router.post("/start")
def start_import(
    import_id: int, background_tasks: BackgroundTasks,
    db: Session = Depends(get_db), current_user=Depends(get_admin),
):
    item = get_owned_import(db, import_id, current_user.company_id)
    if item.status in {"Processing", "Validating", "Completed", "Completed with Errors", "Failed", "Cancelled"}:
        raise HTTPException(status_code=409, detail="This import cannot be started in its current status.")
    # Validate once before queueing, so the user gets immediate actionable feedback.
    try:
        validate_import(db, item, current_user.company_id)
    except ImportValidationException as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    item.status = "Uploaded"
    db.commit()
    create_audit_log(
        db=db, company_id=current_user.company_id, user_id=current_user.id,
        action="Import Started", entity_name="Import", resource_type="Import",
        resource_id=item.id, description=f"Queued import #{item.id} ({item.import_type}) for processing.",
        before_values={"status": "Uploaded"}, after_values={"status": "Validating"}, commit=True,
    )
    create_role_notifications(
        db, company_id=current_user.company_id, roles={"COMPANY_ADMIN", "SUPER_ADMIN"},
        title="Data Import Started", message=f"{item.import_type.title()} import #{item.id} processing has started.",
        notification_type="IMPORT_STARTED", priority="LOW", resource_type="import", resource_id=item.id,
    )
    db.commit()
    background_tasks.add_task(_run_import_job, item.id, current_user.company_id, current_user.id)
    return {"success": True, "import_id": item.id, "status": "Validating", "message": "Import queued. You can track its status."}


# ============================================================
# PROCESS IMPORT (LEGACY SYNCHRONOUS ENDPOINT)
# ============================================================

@router.post("/process")
def process(
    import_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_admin),
):
    item = get_owned_import(
        db,
        import_id,
        current_user.company_id,
    )

    try:
        create_role_notifications(
            db, company_id=current_user.company_id, roles={"COMPANY_ADMIN", "SUPER_ADMIN"},
            title="Data Import Started",
            message=f"{item.import_type.title()} import #{item.id} processing has started.",
            notification_type="IMPORT_STARTED", priority="LOW",
            resource_type="import", resource_id=item.id,
        )
        create_audit_log(
            db=db, company_id=current_user.company_id, user_id=current_user.id,
            action="Import Started", entity_name="Import", resource_type="Import",
            resource_id=item.id, description=f"Started import #{item.id} ({item.import_type}).",
            before_values={"status": item.status}, after_values={"status": "Processing"}, commit=True,
        )
        (
            item,
            validation_failures,
            duplicates,
        ) = process_import(
            db,
            item,
            current_user.company_id,
            current_user.id,
        )

        # Task 14: notify authorized company admins after the real import result.
        create_import_notification(
            db,
            company_id=current_user.company_id,
            import_id=item.id,
            import_type=item.import_type,
            status=item.status,
        )
        db.commit()

        return {
            "success": True,
            "import_id": item.id,
            "status": item.status,
            "total_records": item.total_records,
            "successful_records": item.successful_records,
            "failed_records": item.failed_records,
            "duplicate_records": duplicates,
            "validation_failures": validation_failures,
            "message": (
                "Import completed."
                if item.status == "Completed"
                else "Import completed with errors."
            ),
        }

    except ImportValidationException as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )


# ============================================================
# IMPORT HISTORY
# ============================================================

@router.get(
    "/history",
    response_model=list[ImportHistoryResponse],
)
def history(
    db: Session = Depends(get_db),
    current_user=Depends(get_admin),
):
    return (
        db.query(ImportHistory)
        .filter(
            ImportHistory.company_id
            == current_user.company_id
        )
        .order_by(
            ImportHistory.id.desc()
        )
        .all()
    )


# ============================================================
# IMPORT STATUS / PROGRESS
# ============================================================

@router.get("/{import_id}/status")
def import_status(import_id: int, db: Session = Depends(get_db), current_user=Depends(get_admin)):
    item = get_owned_import(db, import_id, current_user.company_id)
    total = int(item.total_records or 0)
    if item.status in {"Uploaded", "Validating", "Processing"}:
        processed = 0  # The transaction commits atomically at completion.
    else:
        processed = int(item.successful_records or 0) + int(item.failed_records or 0)
    return {
        "import_id": item.id, "status": item.status, "total_records": total,
        "successful_records": item.successful_records, "failed_records": item.failed_records,
        "duplicate_records": item.duplicate_records,
        "skipped_records": item.skipped_records,
        "processing_duration_seconds": item.processing_duration_seconds,
        "processed_records": min(processed, total),
        "progress_percent": round((min(processed, total) / total) * 100, 2) if total else 0,
        "created_at": item.created_at, "completed_at": item.completed_at,
    }


# ============================================================
# IMPORT DETAILS
# ============================================================

@router.get("/{import_id}")
def details(
    import_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_admin),
):
    item = get_owned_import(
        db,
        import_id,
        current_user.company_id,
    )

    errors = (
        db.query(ImportErrorModel)
        .filter(
            ImportErrorModel.import_id
            == item.id
        )
        .order_by(
            ImportErrorModel.row_number.asc()
        )
        .all()
    )

    return {
        "id": item.id,
        "import_type": item.import_type,
        "filename": item.filename,
        "uploaded_by": item.uploaded_by,
        "total_records": item.total_records,
        "successful_records": item.successful_records,
        "failed_records": item.failed_records,
        "duplicate_records": item.duplicate_records,
        "skipped_records": item.skipped_records,
        "processing_duration_seconds": item.processing_duration_seconds,
        "started_at": item.started_at,
        "status": item.status,
        "created_at": item.created_at,
        "completed_at": item.completed_at,
        "errors": [
            {
                "id": error.id,
                "row_number": error.row_number,
                "error_type": error.error_type,
                "field": error.field,
                "message": error.message,
                "raw_data": (
                    json.loads(error.raw_data)
                    if error.raw_data
                    else {}
                ),
            }
            for error in errors
        ],
    }


# ============================================================
# DOWNLOAD IMPORT ERRORS
# ============================================================

@router.get("/{import_id}/errors")
def errors(
    import_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_admin),
):
    item = get_owned_import(
        db,
        import_id,
        current_user.company_id,
    )

    rows = (
        db.query(ImportErrorModel)
        .filter(
            ImportErrorModel.import_id
            == item.id
        )
        .order_by(
            ImportErrorModel.row_number.asc()
        )
        .all()
    )

    output = io.StringIO()

    writer = csv.writer(output)

    writer.writerow(
        [
            "Row Number",
            "Error Type",
            "Field",
            "Error Reason",
            "Raw Data",
        ]
    )

    for row in rows:
        writer.writerow(
            [
                row.row_number,
                row.error_type,
                row.field or "",
                row.message,
                row.raw_data or "{}",
            ]
        )

    output.seek(0)

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": (
                f'attachment; '
                f'filename="import_{item.id}_errors.csv"'
            )
        },
    )


# ============================================================
# CANCEL IMPORT (only before processing starts)
# ============================================================

@router.post("/{import_id}/cancel")
def cancel_import(import_id: int, db: Session = Depends(get_db), current_user=Depends(get_admin)):
    item = get_owned_import(db, import_id, current_user.company_id)
    if item.status in {"Processing", "Completed", "Completed with Errors", "Failed", "Cancelled"}:
        raise HTTPException(status_code=409, detail="This import can no longer be cancelled.")
    before = item.status
    item.status = "Cancelled"
    item.completed_at = datetime.now(timezone.utc)
    create_audit_log(
        db=db, company_id=current_user.company_id, user_id=current_user.id,
        action="Import Cancelled", entity_name="Import", resource_type="Import",
        resource_id=item.id, description=f"Cancelled import #{item.id}.",
        before_values={"status": before}, after_values={"status": "Cancelled"}, commit=False,
    )
    db.commit()
    return {"success": True, "import_id": item.id, "status": item.status, "message": "Import cancelled."}


# ============================================================
# DELETE IMPORT HISTORY
# ============================================================

@router.delete("/{import_id}")
def delete_import(
    import_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_admin),
):
    """
    Delete an import history record.

    This deletes:
    - ImportHistory record
    - Related ImportError records

    It does NOT delete imported business data
    such as products, customers, or sales.
    """

    item = get_owned_import(
        db,
        import_id,
        current_user.company_id,
    )

    try:
        # ----------------------------------------------------
        # Delete related validation/error records first
        # ----------------------------------------------------

        (
            db.query(ImportErrorModel)
            .filter(
                ImportErrorModel.import_id
                == item.id
            )
            .delete(
                synchronize_session=False
            )
        )

        # ----------------------------------------------------
        # Delete import history
        # ----------------------------------------------------

        db.delete(item)

        # ----------------------------------------------------
        # Commit transaction
        # ----------------------------------------------------

        db.commit()

        return {
            "success": True,
            "import_id": import_id,
            "message": (
                "Import record deleted successfully."
            ),
        }

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Failed to delete import record.",
        )