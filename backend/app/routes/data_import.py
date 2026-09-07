from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

import csv
import io
import json

from app.core.database import get_db
from app.dependencies.auth import require_roles
from app.models.import_error import ImportError as ImportErrorModel
from app.models.import_history import ImportHistory
from app.schemas.data_import import ImportHistoryResponse
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
# PROCESS IMPORT
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