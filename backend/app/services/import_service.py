from __future__ import annotations

import csv
import io
import json
import os
import re
from datetime import datetime
from decimal import Decimal, InvalidOperation

from email_validator import EmailNotValidError, validate_email
from fastapi import UploadFile
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.category import Category
from app.models.customer import Customer
from app.models.customer_purchase_summary import CustomerPurchaseSummary
from app.models.import_error import ImportError as ImportErrorModel
from app.models.import_history import ImportHistory
from app.models.product import Product
from app.models.sale import Sale
from app.models.sale_item import SaleItem

from app.services.customer_service import (
    sync_customer_sales_analytics,
    update_customer_purchase_summary,
)

from app.services.sales_service import generate_invoice_number


# ============================================================
# CONSTANTS
# ============================================================

MAX_FILE_SIZE = 10 * 1024 * 1024
PREVIEW_ROWS = 10

STORAGE_DIR = os.path.abspath(
    os.path.join(
        os.path.dirname(__file__),
        "..",
        "storage",
        "imports",
    )
)

os.makedirs(STORAGE_DIR, exist_ok=True)


# ============================================================
# REQUIRED CSV COLUMNS
# ============================================================

REQUIRED_COLUMNS = {
    "products": [
        "product name",
        "sku",
        "category",
        "unit price",
        "stock quantity",
    ],
    "customers": [
        "name",
        "email",
        "phone",
    ],
    "sales": [
        "customer",
        "product",
        "quantity",
        "unit price",
        "sale date",
    ],
}


# ============================================================
# OPTIONAL CSV COLUMNS
# ============================================================

OPTIONAL_COLUMNS = {
    "products": [
        "brand",
        "description",
        "cost price",
        "reorder threshold",
        "unit of measure",
    ],
    "customers": [
        "customer id",
        "date of birth",
        "gender",
        "address",
        "city",
        "state",
        "country",
        "postal code",
    ],
    "sales": [
        "invoice number",
        "sales channel",
        "payment method",
        "payment status",
    ],
}


# ============================================================
# DEFAULT PRODUCT VALUES
# ============================================================

DEFAULT_COST_PRICE = None
DEFAULT_REORDER_THRESHOLD = 10
DEFAULT_UNIT_OF_MEASURE = "piece"
DEFAULT_PRODUCT_STATUS = "ACTIVE"


# ============================================================
# EXCEPTION
# ============================================================

class ImportValidationException(Exception):
    pass


# ============================================================
# NORMALIZATION
# ============================================================

def normalize_type(value: str) -> str:
    value = (
        value or ""
    ).strip().lower().replace("_", " ").replace("-", " ")

    aliases = {
        "product": "products",
        "products": "products",
        "customer": "customers",
        "customers": "customers",
        "sales": "sales",
        "sale": "sales",
        "sales transaction": "sales",
        "sales transactions": "sales",
        "transaction": "sales",
        "transactions": "sales",
    }

    if value not in aliases:
        raise ImportValidationException(
            "Invalid import type. "
            "Allowed types: products, customers, sales."
        )

    return aliases[value]


def normalize_header(value: str) -> str:
    return re.sub(
        r"\s+",
        " ",
        (value or "").strip().lower(),
    )


def clean_row(row: dict) -> dict:
    return {
        normalize_header(key): (value or "").strip()
        for key, value in row.items()
        if key is not None
    }


# ============================================================
# FILE STORAGE
# ============================================================

def storage_path(import_id: int) -> str:
    return os.path.join(
        STORAGE_DIR,
        f"{import_id}.csv",
    )


def save_path(import_id: int, content: bytes) -> str:
    path = storage_path(import_id)

    with open(path, "wb") as file:
        file.write(content)

    return path


def get_import_file_path(import_id: int) -> str:
    path = storage_path(import_id)

    if not os.path.exists(path):
        raise ImportValidationException(
            "Uploaded CSV file was not found."
        )

    return path


# ============================================================
# CSV READER
# ============================================================

def read_csv_file(
    path: str,
) -> tuple[list[str], list[dict]]:

    if not os.path.exists(path):
        raise ImportValidationException(
            "CSV file not found."
        )

    try:
        with open(path, "rb") as file:
            content = file.read()
    except OSError as exc:
        raise ImportValidationException(
            f"Unable to read CSV file: {exc}"
        ) from exc

    if not content:
        raise ImportValidationException(
            "CSV file is empty."
        )

    try:
        text = content.decode("utf-8-sig")
    except UnicodeDecodeError as exc:
        raise ImportValidationException(
            "CSV file must use UTF-8 encoding."
        ) from exc

    if not text.strip():
        raise ImportValidationException(
            "CSV file is empty."
        )

    reader = csv.DictReader(
        io.StringIO(text)
    )

    if not reader.fieldnames:
        raise ImportValidationException(
            "CSV file must contain a header row."
        )

    columns = [
        normalize_header(column)
        for column in reader.fieldnames
    ]

    if any(not column for column in columns):
        raise ImportValidationException(
            "CSV contains an empty column name."
        )

    if len(columns) != len(set(columns)):
        raise ImportValidationException(
            "CSV contains duplicate column names."
        )

    rows = []

    for row in reader:
        if not row:
            continue

        cleaned = clean_row(row)

        if not any(
            value.strip()
            for value in cleaned.values()
        ):
            continue

        rows.append(cleaned)

    return columns, rows


# ============================================================
# PARSERS
# ============================================================

def parse_decimal(
    value: str,
    field_name: str,
) -> Decimal:

    value = (value or "").strip()

    if not value:
        raise ValueError(
            f"{field_name} is required."
        )

    try:
        number = Decimal(value)
    except (InvalidOperation, ValueError) as exc:
        raise ValueError(
            f"{field_name} must be a valid number."
        ) from exc

    if not number.is_finite():
        raise ValueError(
            f"{field_name} must be a valid number."
        )

    return number


def parse_int(
    value: str,
    field_name: str,
) -> int:

    value = (value or "").strip()

    if not value:
        raise ValueError(
            f"{field_name} is required."
        )

    try:
        number = Decimal(value)

        if number != number.to_integral_value():
            raise ValueError

        return int(number)

    except (InvalidOperation, ValueError) as exc:
        raise ValueError(
            f"{field_name} must be a valid integer."
        ) from exc


def parse_date(value: str) -> datetime:

    value = (value or "").strip()

    if not value:
        raise ValueError(
            "Sale Date is required."
        )

    formats = [
        "%Y-%m-%d",
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%dT%H:%M:%S",
        "%d-%m-%Y",
        "%d/%m/%Y",
    ]

    for fmt in formats:
        try:
            return datetime.strptime(
                value,
                fmt,
            )
        except ValueError:
            continue

    try:
        return datetime.fromisoformat(
            value.replace("Z", "+00:00")
        )
    except ValueError as exc:
        raise ValueError(
            "Sale Date must be a valid date."
        ) from exc


# ============================================================
# VALIDATORS
# ============================================================

def valid_email(value: str) -> bool:
    try:
        validate_email(
            (value or "").strip(),
            check_deliverability=False,
        )
        return True
    except EmailNotValidError:
        return False


def valid_phone(value: str) -> bool:
    value = (value or "").strip()

    return bool(
        re.fullmatch(
            r"\+?[0-9][0-9\s().-]{6,18}[0-9]",
            value,
        )
    )


# ============================================================
# COLUMN VALIDATION
# ============================================================

def validate_columns(
    import_type: str,
    columns: list[str],
) -> None:

    import_type = normalize_type(import_type)

    required = REQUIRED_COLUMNS[import_type]

    missing = [
        column
        for column in required
        if column not in columns
    ]

    if missing:
        raise ImportValidationException(
            "Missing required columns: "
            + ", ".join(missing)
        )


# ============================================================
# DATABASE DUPLICATES
# ============================================================

def db_duplicate_sets(
    db: Session,
    import_type: str,
    company_id: int,
):

    import_type = normalize_type(import_type)

    # --------------------------------------------------------
    # PRODUCTS
    # --------------------------------------------------------

    if import_type == "products":

        existing = (
            db.query(Product.sku)
            .filter(
                Product.company_id == company_id
            )
            .all()
        )

        return {
            str(row[0]).strip().lower()
            for row in existing
            if row[0]
        }

    # --------------------------------------------------------
    # CUSTOMERS
    # --------------------------------------------------------

    if import_type == "customers":

        emails = (
            db.query(Customer.email)
            .filter(
                Customer.company_id == company_id
            )
            .all()
        )

        phones = (
            db.query(Customer.phone_number)
            .filter(
                Customer.company_id == company_id
            )
            .all()
        )

        return (
            {
                str(row[0]).strip().lower()
                for row in emails
                if row[0]
            },
            {
                str(row[0]).strip()
                for row in phones
                if row[0]
            },
        )

    # --------------------------------------------------------
    # SALES
    # --------------------------------------------------------

    if import_type == "sales":

        invoices = (
            db.query(Sale.invoice_number)
            .filter(
                Sale.company_id == company_id
            )
            .all()
        )

        return {
            str(row[0]).strip().lower()
            for row in invoices
            if row[0]
        }

    return set()


# ============================================================
# ROW VALIDATION
# ============================================================

def validate_rows(
    db: Session,
    import_type: str,
    company_id: int,
    rows: list[dict],
):

    import_type = normalize_type(import_type)

    errors = []
    valid_count = 0
    duplicate_count = 0

    existing_duplicates = db_duplicate_sets(
        db,
        import_type,
        company_id,
    )

    seen = set()

    # ========================================================
    # PROCESS EACH ROW
    # ========================================================

    for row_number, row in enumerate(
        rows,
        start=2,
    ):

        row_errors = []
        duplicate_row = False

        try:

            # ==================================================
            # PRODUCTS
            # ==================================================

            if import_type == "products":

                name = row.get(
                    "product name",
                    "",
                ).strip()

                sku = row.get(
                    "sku",
                    "",
                ).strip()

                category = row.get(
                    "category",
                    "",
                ).strip()

                # ----------------------------------------------
                # Required fields
                # ----------------------------------------------

                if not name:
                    row_errors.append(
                        (
                            "Product Name",
                            "Product Name is required.",
                        )
                    )

                if not sku:
                    row_errors.append(
                        (
                            "SKU",
                            "SKU is required.",
                        )
                    )

                if not category:
                    row_errors.append(
                        (
                            "Category",
                            "Category is required.",
                        )
                    )

                # ----------------------------------------------
                # Unit price
                # ----------------------------------------------

                try:

                    price = parse_decimal(
                        row.get(
                            "unit price",
                            "",
                        ),
                        "Unit Price",
                    )

                    if price <= 0:
                        row_errors.append(
                            (
                                "Unit Price",
                                "Unit Price must be greater than 0.",
                            )
                        )

                except ValueError as exc:

                    row_errors.append(
                        (
                            "Unit Price",
                            str(exc),
                        )
                    )

                # ----------------------------------------------
                # Stock
                # ----------------------------------------------

                try:

                    stock = parse_int(
                        row.get(
                            "stock quantity",
                            "",
                        ),
                        "Stock Quantity",
                    )

                    if stock < 0:
                        row_errors.append(
                            (
                                "Stock Quantity",
                                "Stock Quantity cannot be negative.",
                            )
                        )

                except ValueError as exc:

                    row_errors.append(
                        (
                            "Stock Quantity",
                            str(exc),
                        )
                    )

                # ----------------------------------------------
                # Optional Cost Price
                # ----------------------------------------------

                cost_price = row.get(
                    "cost price",
                    "",
                ).strip()

                if cost_price:

                    try:

                        cost = parse_decimal(
                            cost_price,
                            "Cost Price",
                        )

                        if cost < 0:
                            row_errors.append(
                                (
                                    "Cost Price",
                                    "Cost Price cannot be negative.",
                                )
                            )

                    except ValueError as exc:

                        row_errors.append(
                            (
                                "Cost Price",
                                str(exc),
                            )
                        )

                # ----------------------------------------------
                # Optional Reorder Threshold
                # ----------------------------------------------

                reorder_threshold = row.get(
                    "reorder threshold",
                    "",
                ).strip()

                if reorder_threshold:

                    try:

                        threshold = parse_int(
                            reorder_threshold,
                            "Reorder Threshold",
                        )

                        if threshold < 0:
                            row_errors.append(
                                (
                                    "Reorder Threshold",
                                    "Reorder Threshold cannot be negative.",
                                )
                            )

                    except ValueError as exc:

                        row_errors.append(
                            (
                                "Reorder Threshold",
                                str(exc),
                            )
                        )

                # ----------------------------------------------
                # Duplicate SKU
                # ----------------------------------------------

                normalized_sku = sku.lower()

                if sku and (
                    normalized_sku in existing_duplicates
                    or normalized_sku in seen
                ):

                    duplicate_row = True

                    row_errors.append(
                        (
                            "SKU",
                            f"Duplicate SKU: {sku}",
                        )
                    )

                if sku:
                    seen.add(normalized_sku)

            # ==================================================
            # CUSTOMERS
            # ==================================================

            elif import_type == "customers":

                name = row.get(
                    "name",
                    "",
                ).strip()

                email = row.get(
                    "email",
                    "",
                ).strip()

                phone = row.get(
                    "phone",
                    "",
                ).strip()

                existing_emails, existing_phones = (
                    existing_duplicates
                )

                # ----------------------------------------------
                # Name
                # ----------------------------------------------

                if not name:
                    row_errors.append(
                        (
                            "Name",
                            "Name is required.",
                        )
                    )

                # ----------------------------------------------
                # Email
                # ----------------------------------------------

                if not email:

                    row_errors.append(
                        (
                            "Email",
                            "Email is required.",
                        )
                    )

                elif not valid_email(email):

                    row_errors.append(
                        (
                            "Email",
                            "Invalid email address.",
                        )
                    )

                # ----------------------------------------------
                # Phone
                # ----------------------------------------------

                if not phone:

                    row_errors.append(
                        (
                            "Phone",
                            "Phone is required.",
                        )
                    )

                elif not valid_phone(phone):

                    row_errors.append(
                        (
                            "Phone",
                            "Invalid phone number.",
                        )
                    )

                # ----------------------------------------------
                # Duplicate email
                # ----------------------------------------------

                normalized_email = email.lower()

                if email and (
                    normalized_email in existing_emails
                    or ("email", normalized_email) in seen
                ):

                    duplicate_row = True

                    row_errors.append(
                        (
                            "Email",
                            f"Duplicate email: {email}",
                        )
                    )

                # ----------------------------------------------
                # Duplicate phone
                # ----------------------------------------------

                if phone and (
                    phone in existing_phones
                    or ("phone", phone) in seen
                ):

                    duplicate_row = True

                    row_errors.append(
                        (
                            "Phone",
                            f"Duplicate phone: {phone}",
                        )
                    )

                if email:
                    seen.add(
                        (
                            "email",
                            normalized_email,
                        )
                    )

                if phone:
                    seen.add(
                        (
                            "phone",
                            phone,
                        )
                    )

            # ==================================================
            # SALES
            # ==================================================

            elif import_type == "sales":

                customer_name = row.get(
                    "customer",
                    "",
                ).strip()

                product_name = row.get(
                    "product",
                    "",
                ).strip()

                quantity_value = row.get(
                    "quantity",
                    "",
                ).strip()

                unit_price_value = row.get(
                    "unit price",
                    "",
                ).strip()

                sale_date_value = row.get(
                    "sale date",
                    "",
                ).strip()

                invoice_number = row.get(
                    "invoice number",
                    "",
                ).strip()

                # ----------------------------------------------
                # Customer
                # ----------------------------------------------

                if not customer_name:
                    row_errors.append(
                        (
                            "Customer",
                            "Customer is required.",
                        )
                    )

                # ----------------------------------------------
                # Product
                # ----------------------------------------------

                if not product_name:
                    row_errors.append(
                        (
                            "Product",
                            "Product is required.",
                        )
                    )

                # ----------------------------------------------
                # Quantity
                # ----------------------------------------------

                quantity = None

                try:

                    quantity = parse_int(
                        quantity_value,
                        "Quantity",
                    )

                    if quantity <= 0:
                        row_errors.append(
                            (
                                "Quantity",
                                "Quantity must be greater than 0.",
                            )
                        )

                except ValueError as exc:

                    row_errors.append(
                        (
                            "Quantity",
                            str(exc),
                        )
                    )

                # ----------------------------------------------
                # Unit price
                # ----------------------------------------------

                try:

                    unit_price = parse_decimal(
                        unit_price_value,
                        "Unit Price",
                    )

                    if unit_price <= 0:
                        row_errors.append(
                            (
                                "Unit Price",
                                "Unit Price must be greater than 0.",
                            )
                        )

                except ValueError as exc:

                    row_errors.append(
                        (
                            "Unit Price",
                            str(exc),
                        )
                    )

                # ----------------------------------------------
                # Sale date
                # ----------------------------------------------

                try:

                    parse_date(
                        sale_date_value
                    )

                except ValueError as exc:

                    row_errors.append(
                        (
                            "Sale Date",
                            str(exc),
                        )
                    )

                # ----------------------------------------------
                # Customer existence
                # ----------------------------------------------

                customer = None

                if customer_name:

                    customer = (
                        db.query(Customer)
                        .filter(
                            Customer.company_id
                            == company_id,
                            Customer.full_name.ilike(
                                customer_name
                            ),
                            Customer.status == "ACTIVE",
                        )
                        .first()
                    )

                    if not customer:

                        row_errors.append(
                            (
                                "Customer",
                                f"Customer not found: "
                                f"{customer_name}",
                            )
                        )

                # ----------------------------------------------
                # Product existence
                # ----------------------------------------------

                product = None

                if product_name:

                    product = (
                        db.query(Product)
                        .filter(
                            Product.company_id
                            == company_id,
                            Product.name.ilike(
                                product_name
                            ),
                        )
                        .first()
                    )

                    if not product:

                        row_errors.append(
                            (
                                "Product",
                                f"Product not found: "
                                f"{product_name}",
                            )
                        )

                # ----------------------------------------------
                # Stock validation
                # ----------------------------------------------

                if (
                    product is not None
                    and quantity is not None
                    and quantity > product.stock_quantity
                ):

                    row_errors.append(
                        (
                            "Quantity",
                            (
                                f"Quantity {quantity} exceeds "
                                f"available stock "
                                f"{product.stock_quantity}."
                            ),
                        )
                    )

                # ----------------------------------------------
                # Invoice duplicate
                # ----------------------------------------------

                if invoice_number:

                    normalized_invoice = (
                        invoice_number.lower()
                    )

                    if (
                        normalized_invoice
                        in existing_duplicates
                        or normalized_invoice in seen
                    ):

                        duplicate_row = True

                        row_errors.append(
                            (
                                "Invoice Number",
                                (
                                    f"Duplicate invoice number: "
                                    f"{invoice_number}"
                                ),
                            )
                        )

                    seen.add(
                        normalized_invoice
                    )

        except Exception as exc:

            row_errors.append(
                (
                    None,
                    str(exc),
                )
            )

        # ======================================================
        # STORE RESULT
        # ======================================================

        if row_errors:

            if duplicate_row:
                duplicate_count += 1

            for field, message in row_errors:

                errors.append(
                    {
                        "row_number": row_number,
                        "error_type": (
                            "Duplicate"
                            if duplicate_row
                            else "Validation"
                        ),
                        "field": field,
                        "message": message,
                        "raw_data": row,
                    }
                )

        else:

            valid_count += 1

    invalid_count = len(rows) - valid_count

    return (
        valid_count,
        invalid_count,
        duplicate_count,
        errors,
    )


# ============================================================
# CREATE IMPORT HISTORY
# ============================================================

def create_import(
    db: Session,
    company_id: int,
    uploaded_by: int,
    import_type: str,
    filename: str,
    total_records: int,
) -> ImportHistory:

    item = ImportHistory(
        company_id=company_id,
        import_type=normalize_type(import_type),
        filename=filename,
        uploaded_by=uploaded_by,
        total_records=total_records,
        successful_records=0,
        failed_records=0,
        duplicate_records=0,
        status="Pending",
    )

    db.add(item)
    db.flush()

    return item


# ============================================================
# UPLOAD CSV
# ============================================================

def upload_csv(
    db: Session,
    company_id: int,
    uploaded_by: int,
    import_type: str,
    file: UploadFile,
):

    import_type = normalize_type(import_type)

    filename = file.filename or ""

    # --------------------------------------------------------
    # File extension
    # --------------------------------------------------------

    if not filename.lower().endswith(".csv"):
        raise ImportValidationException(
            "Only CSV files are allowed."
        )

    # --------------------------------------------------------
    # Read file
    # --------------------------------------------------------

    try:

        content = file.file.read()

    except Exception as exc:

        raise ImportValidationException(
            f"Unable to read uploaded file: {exc}"
        ) from exc

    # --------------------------------------------------------
    # Empty file
    # --------------------------------------------------------

    if not content:
        raise ImportValidationException(
            "Uploaded file is empty."
        )

    # --------------------------------------------------------
    # Size
    # --------------------------------------------------------

    if len(content) > MAX_FILE_SIZE:
        raise ImportValidationException(
            "CSV file size must not exceed 10 MB."
        )

    # --------------------------------------------------------
    # Encoding
    # --------------------------------------------------------

    try:

        text = content.decode("utf-8-sig")

    except UnicodeDecodeError as exc:

        raise ImportValidationException(
            "CSV file must use UTF-8 encoding."
        ) from exc

    if not text.strip():
        raise ImportValidationException(
            "CSV file is empty."
        )

    # --------------------------------------------------------
    # Reader
    # --------------------------------------------------------

    reader = csv.DictReader(
        io.StringIO(text)
    )

    if not reader.fieldnames:

        raise ImportValidationException(
            "CSV file must contain a header row."
        )

    columns = [
        normalize_header(column)
        for column in reader.fieldnames
    ]

    # --------------------------------------------------------
    # Duplicate columns
    # --------------------------------------------------------

    if len(columns) != len(set(columns)):

        raise ImportValidationException(
            "CSV contains duplicate column names."
        )

    # --------------------------------------------------------
    # Empty columns
    # --------------------------------------------------------

    if any(not column for column in columns):

        raise ImportValidationException(
            "CSV contains an empty column name."
        )

    # --------------------------------------------------------
    # Required columns
    # --------------------------------------------------------

    validate_columns(
        import_type,
        columns,
    )

    # --------------------------------------------------------
    # Rows
    # --------------------------------------------------------

    rows = []

    for row in reader:

        cleaned = clean_row(row)

        if not any(
            value.strip()
            for value in cleaned.values()
        ):
            continue

        rows.append(cleaned)

    if not rows:

        raise ImportValidationException(
            "CSV file does not contain any data rows."
        )

    # --------------------------------------------------------
    # Create history
    # --------------------------------------------------------

    item = None

    try:

        item = create_import(
            db=db,
            company_id=company_id,
            uploaded_by=uploaded_by,
            import_type=import_type,
            filename=filename,
            total_records=len(rows),
        )

        # ----------------------------------------------------
        # Store file
        # ----------------------------------------------------

        path = save_path(
            item.id,
            content,
        )

        if not os.path.exists(path):

            raise ImportValidationException(
                "Failed to store uploaded CSV file."
            )

        db.commit()
        db.refresh(item)

        return (
            item,
            columns,
            rows,
        )

    except Exception:

        db.rollback()

        if item is not None:

            path = storage_path(item.id)

            if os.path.exists(path):

                try:
                    os.remove(path)
                except OSError:
                    pass

        raise


# ============================================================
# SAVE IMPORT ERRORS
# ============================================================

def _save_import_errors(
    db: Session,
    import_id: int,
    errors: list[dict],
):

    db.query(
        ImportErrorModel
    ).filter(
        ImportErrorModel.import_id == import_id
    ).delete(
        synchronize_session=False
    )

    for error in errors:

        raw_data = error.get(
            "raw_data",
            {},
        )

        db.add(
            ImportErrorModel(
                import_id=import_id,
                row_number=error.get(
                    "row_number",
                    0,
                ),
                error_type=error.get(
                    "error_type",
                    "Validation",
                ),
                field=error.get(
                    "field"
                ),
                message=error.get(
                    "message",
                    "Validation error.",
                ),
                raw_data=json.dumps(
                    raw_data,
                    default=str,
                ),
            )
        )


# ============================================================
# VALIDATE IMPORT
# ============================================================

def validate_import(
    db: Session,
    item: ImportHistory,
    company_id: int,
):

    if item.company_id != company_id:

        raise ImportValidationException(
            "You are not authorized to access this import."
        )

    if item.status == "Processing":

        raise ImportValidationException(
            "This import is currently being processed."
        )

    if item.status == "Completed":

        raise ImportValidationException(
            "This import has already been completed."
        )

    path = get_import_file_path(
        item.id
    )

    columns, rows = read_csv_file(
        path
    )

    validate_columns(
        item.import_type,
        columns,
    )

    (
        valid,
        invalid,
        duplicates,
        errors,
    ) = validate_rows(
        db=db,
        import_type=item.import_type,
        company_id=company_id,
        rows=rows,
    )

    try:

        _save_import_errors(
            db,
            item.id,
            errors,
        )

        item.total_records = len(rows)

        item.successful_records = valid

        item.failed_records = invalid

        item.duplicate_records = duplicates

        # Validation does not complete the import.
        item.status = "Pending"

        item.completed_at = None

        db.commit()
        db.refresh(item)

    except Exception:

        db.rollback()

        raise

    preview = rows[:PREVIEW_ROWS]

    return (
        columns,
        rows,
        valid,
        invalid,
        duplicates,
        errors,
        preview,
    )


# ============================================================
# CATEGORY HELPER
# ============================================================

def _category(
    db: Session,
    company_id: int,
    category_name: str,
):

    category_name = (
        category_name or ""
    ).strip()

    if not category_name:
        return None

    category = (
        db.query(Category)
        .filter(
            Category.company_id == company_id,
            Category.name.ilike(
                category_name
            ),
        )
        .first()
    )

    if category:
        return category

    category = Category(
        company_id=company_id,
        name=category_name,
    )

    db.add(category)
    db.flush()

    return category


# ============================================================
# CUSTOMER ID
# ============================================================

def _next_customer_id(
    db: Session,
    company_id: int,
):

    year = datetime.now().year

    prefix = f"CUS-{year}-"

    latest = (
        db.query(Customer)
        .filter(
            Customer.company_id == company_id,
            Customer.customer_id.like(
                f"{prefix}%"
            ),
        )
        .order_by(
            Customer.customer_id.desc()
        )
        .first()
    )

    if not latest or not latest.customer_id:

        number = 1

    else:

        try:

            number = (
                int(
                    latest.customer_id[
                        len(prefix):
                    ]
                )
                + 1
            )

        except ValueError:

            number = 1

    return f"{prefix}{number:06d}"


# ============================================================
# CUSTOMER CREATION
# ============================================================

def _create_customer(
    db: Session,
    row: dict,
    company_id: int,
    created_by: int,
):

    name = row.get(
        "name",
        "",
    ).strip()

    email = row.get(
        "email",
        "",
    ).strip()

    phone = row.get(
        "phone",
        "",
    ).strip()

    # --------------------------------------------------------
    # IMPORTANT:
    # Customer model uses phone_number.
    # --------------------------------------------------------

    customer_kwargs = {
        "company_id": company_id,
        "customer_id": _next_customer_id(
            db,
            company_id,
        ),
        "full_name": name,
        "email": email,
        "phone_number": phone,
        "status": "ACTIVE",
    }

    # --------------------------------------------------------
    # created_by if supported
    # --------------------------------------------------------

    if hasattr(Customer, "created_by"):
        customer_kwargs["created_by"] = created_by

    # --------------------------------------------------------
    # Optional fields
    # --------------------------------------------------------

    optional_mapping = {
        "date of birth": "date_of_birth",
        "gender": "gender",
        "address": "address",
        "city": "city",
        "state": "state",
        "country": "country",
        "postal code": "postal_code",
    }

    for csv_field, model_field in optional_mapping.items():

        value = row.get(
            csv_field,
            "",
        ).strip()

        if (
            value
            and hasattr(Customer, model_field)
        ):

            setattr(
                customer_kwargs,
                model_field,
                value,
            )

    customer = Customer(
        **customer_kwargs
    )

    db.add(customer)
    db.flush()

    # --------------------------------------------------------
    # Customer purchase summary
    # --------------------------------------------------------

    try:

        summary = CustomerPurchaseSummary(
            customer_id=customer.id,
            company_id=company_id,
        )

        db.add(summary)
        db.flush()

    except TypeError:

        raise

    return customer


# ============================================================
# PRODUCT CREATION
# ============================================================

def _create_product(
    db: Session,
    row: dict,
    company_id: int,
    created_by: int,
):

    # --------------------------------------------------------
    # Required values
    # --------------------------------------------------------

    name = row.get(
        "product name",
        "",
    ).strip()

    sku = row.get(
        "sku",
        "",
    ).strip()

    category_name = row.get(
        "category",
        "",
    ).strip()

    unit_price = parse_decimal(
        row.get(
            "unit price",
            "",
        ),
        "Unit Price",
    )

    stock_quantity = parse_int(
        row.get(
            "stock quantity",
            "",
        ),
        "Stock Quantity",
    )

    # --------------------------------------------------------
    # Category
    # --------------------------------------------------------

    category = _category(
        db,
        company_id,
        category_name,
    )

    if not category:

        raise ImportValidationException(
            f"Category is required for SKU {sku}."
        )

    # --------------------------------------------------------
    # Brand
    # --------------------------------------------------------

    brand = row.get(
        "brand",
        "",
    ).strip()

    # --------------------------------------------------------
    # Description
    # --------------------------------------------------------

    description = row.get(
        "description",
        "",
    ).strip()

    # --------------------------------------------------------
    # Cost Price
    #
    # Product model has:
    #
    # cost_price = nullable=False
    #
    # Therefore when CSV does not provide cost price,
    # use unit price as a safe fallback.
    # --------------------------------------------------------

    cost_price_value = row.get(
        "cost price",
        "",
    ).strip()

    if cost_price_value:

        cost_price = parse_decimal(
            cost_price_value,
            "Cost Price",
        )

    else:

        cost_price = unit_price

    if cost_price < 0:

        raise ImportValidationException(
            f"Cost Price cannot be negative for SKU {sku}."
        )

    # --------------------------------------------------------
    # Reorder threshold
    # --------------------------------------------------------

    reorder_threshold_value = row.get(
        "reorder threshold",
        "",
    ).strip()

    if reorder_threshold_value:

        reorder_threshold = parse_int(
            reorder_threshold_value,
            "Reorder Threshold",
        )

    else:

        reorder_threshold = DEFAULT_REORDER_THRESHOLD

    if reorder_threshold < 0:

        raise ImportValidationException(
            (
                "Reorder Threshold cannot be negative "
                f"for SKU {sku}."
            )
        )

    # --------------------------------------------------------
    # Unit of measure
    #
    # Product model has:
    #
    # unit_of_measure = nullable=False
    #
    # CSV treats it as optional.
    # --------------------------------------------------------

    unit_of_measure = row.get(
        "unit of measure",
        "",
    ).strip()

    if not unit_of_measure:

        unit_of_measure = DEFAULT_UNIT_OF_MEASURE

    # --------------------------------------------------------
    # Product kwargs
    # --------------------------------------------------------

    product_kwargs = {
        "company_id": company_id,
        "category_id": category.id,
        "name": name,
        "sku": sku,
        "unit_price": unit_price,
        "cost_price": cost_price,
        "stock_quantity": stock_quantity,
        "reorder_threshold": reorder_threshold,
        "unit_of_measure": unit_of_measure,
        "status": DEFAULT_PRODUCT_STATUS,
    }

    # --------------------------------------------------------
    # Optional fields
    # --------------------------------------------------------

    if brand:
        product_kwargs["brand"] = brand

    if description:
        product_kwargs["description"] = description

    # --------------------------------------------------------
    # Product created_by
    #
    # Add only if model supports it.
    # --------------------------------------------------------

    if hasattr(Product, "created_by"):

        product_kwargs["created_by"] = created_by

    # --------------------------------------------------------
    # Create
    # --------------------------------------------------------

    product = Product(
        **product_kwargs
    )

    db.add(product)

    db.flush()

    return product


# ============================================================
# SALE CREATION
# ============================================================

def _create_sale(
    db: Session,
    row: dict,
    company_id: int,
    user_id: int,
):

    # --------------------------------------------------------
    # CSV values
    # --------------------------------------------------------

    customer_name = row.get(
        "customer",
        "",
    ).strip()

    product_name = row.get(
        "product",
        "",
    ).strip()

    quantity = parse_int(
        row.get(
            "quantity",
            "",
        ),
        "Quantity",
    )

    unit_price = parse_decimal(
        row.get(
            "unit price",
            "",
        ),
        "Unit Price",
    )

    sale_date = parse_date(
        row.get(
            "sale date",
            "",
        )
    )

    # --------------------------------------------------------
    # Customer
    # --------------------------------------------------------

    customer = (
        db.query(Customer)
        .filter(
            Customer.company_id == company_id,
            Customer.full_name.ilike(
                customer_name
            ),
            Customer.status == "ACTIVE",
        )
        .first()
    )

    if not customer:

        raise ImportValidationException(
            f"Customer not found: {customer_name}"
        )

    # --------------------------------------------------------
    # Product
    # --------------------------------------------------------

    product = (
        db.query(Product)
        .filter(
            Product.company_id == company_id,
            Product.name.ilike(
                product_name
            ),
        )
        .first()
    )

    if not product:

        raise ImportValidationException(
            f"Product not found: {product_name}"
        )

    # --------------------------------------------------------
    # Stock
    # --------------------------------------------------------

    if quantity > product.stock_quantity:

        raise ImportValidationException(
            (
                f"Quantity {quantity} exceeds "
                f"available stock "
                f"{product.stock_quantity} "
                f"for {product.name}."
            )
        )

    # --------------------------------------------------------
    # Invoice
    # --------------------------------------------------------

    invoice_number = row.get(
        "invoice number",
        "",
    ).strip()

    if not invoice_number:

        try:

            invoice_number = generate_invoice_number(
                db=db,
                company_id=company_id,
            )

        except TypeError:

            invoice_number = generate_invoice_number(
                db
            )

    # --------------------------------------------------------
    # Sale kwargs
    # --------------------------------------------------------

    total_amount = (
        unit_price * quantity
    )

    sale_kwargs = {
        "company_id": company_id,
        "customer_id": customer.id,
        "invoice_number": invoice_number,
        "sale_date": sale_date,
    }

    # --------------------------------------------------------
    # Optional / common Sale fields
    # --------------------------------------------------------

    if hasattr(Sale, "customer_name"):

        sale_kwargs["customer_name"] = (
            customer.full_name
        )

    if hasattr(Sale, "sales_channel"):

        sales_channel = row.get(
            "sales channel",
            "",
        ).strip()

        sale_kwargs["sales_channel"] = (
            sales_channel
            if sales_channel
            else "STORE"
        )

    if hasattr(Sale, "payment_method"):

        payment_method = row.get(
            "payment method",
            "",
        ).strip()

        if payment_method:
            sale_kwargs["payment_method"] = (
                payment_method
            )

    if hasattr(Sale, "payment_status"):

        payment_status = row.get(
            "payment status",
            "",
        ).strip()

        sale_kwargs["payment_status"] = (
            payment_status
            if payment_status
            else "PAID"
        )

    if hasattr(Sale, "total_amount"):

        sale_kwargs["total_amount"] = (
            total_amount
        )

    if hasattr(Sale, "created_by"):

        sale_kwargs["created_by"] = user_id

    if hasattr(Sale, "is_deleted"):

        sale_kwargs["is_deleted"] = False

    # --------------------------------------------------------
    # Create Sale
    # --------------------------------------------------------

    sale = Sale(
        **sale_kwargs
    )

    db.add(sale)
    db.flush()

    # --------------------------------------------------------
    # Sale item
    # --------------------------------------------------------

    sale_item_kwargs = {
        "sale_id": sale.id,
        "product_id": product.id,
        "quantity": quantity,
        "unit_price": unit_price,
        "total_price": total_amount,
    }

    sale_item = SaleItem(
        **sale_item_kwargs
    )

    db.add(sale_item)

    # --------------------------------------------------------
    # Inventory update
    # --------------------------------------------------------

    product.stock_quantity -= quantity

    return (
        sale,
        sale_item,
        product,
        customer,
    )


# ============================================================
# PROCESS IMPORT
# ============================================================

def process_import(
    db: Session,
    item: ImportHistory,
    company_id: int,
    user_id: int,
):

    # ========================================================
    # AUTHORIZATION
    # ========================================================

    if item.company_id != company_id:

        raise ImportValidationException(
            "You are not authorized to process this import."
        )

    # ========================================================
    # STATUS CHECKS
    # ========================================================

    if item.status == "Processing":

        raise ImportValidationException(
            "This import is already being processed."
        )

    if item.status == "Completed":

        raise ImportValidationException(
            "This import has already been completed."
        )

    # ========================================================
    # FILE
    # ========================================================

    path = get_import_file_path(
        item.id
    )

    columns, rows = read_csv_file(
        path
    )

    validate_columns(
        item.import_type,
        columns,
    )

    # ========================================================
    # VALIDATE AGAIN BEFORE PROCESSING
    # ========================================================

    (
        valid,
        invalid,
        duplicates,
        errors,
    ) = validate_rows(
        db=db,
        import_type=item.import_type,
        company_id=company_id,
        rows=rows,
    )

    # ========================================================
    # SAVE VALIDATION RESULTS
    # ========================================================

    try:

        _save_import_errors(
            db,
            item.id,
            errors,
        )

        item.total_records = len(rows)

        item.successful_records = valid

        item.failed_records = invalid

        item.duplicate_records = duplicates

        # ----------------------------------------------------
        # Do not touch business data if validation failed.
        # ----------------------------------------------------

        if invalid > 0:

            item.status = "Completed with Errors"

            item.completed_at = datetime.now()

            db.commit()
            db.refresh(item)

            return (
                item,
                invalid,
                duplicates,
            )

        # ====================================================
        # PROCESSING START
        # ====================================================

        item.status = "Processing"

        item.completed_at = None

        db.commit()
        db.refresh(item)

    except Exception:

        db.rollback()

        raise

    # ========================================================
    # BUSINESS DATA TRANSACTION
    # ========================================================

    success = 0

    affected_customers = set()

    try:

        # ====================================================
        # PRODUCTS
        # ====================================================

        if item.import_type == "products":

            for row in rows:

                _create_product(
                    db=db,
                    row=row,
                    company_id=company_id,
                    created_by=user_id,
                )

                success += 1

        # ====================================================
        # CUSTOMERS
        # ====================================================

        elif item.import_type == "customers":

            for row in rows:

                customer = _create_customer(
                    db=db,
                    row=row,
                    company_id=company_id,
                    created_by=user_id,
                )

                success += 1

        # ====================================================
        # SALES
        # ====================================================

        elif item.import_type == "sales":

            for row in rows:

                (
                    sale,
                    sale_item,
                    product,
                    customer,
                ) = _create_sale(
                    db=db,
                    row=row,
                    company_id=company_id,
                    user_id=user_id,
                )

                affected_customers.add(
                    customer.id
                )

                success += 1

            # ------------------------------------------------
            # Make sure SaleItems are flushed.
            # ------------------------------------------------

            db.flush()

            # ------------------------------------------------
            # Customer analytics
            # ------------------------------------------------

            for customer_id in affected_customers:

                customer = (
                    db.query(Customer)
                    .filter(
                        Customer.id
                        == customer_id,
                        Customer.company_id
                        == company_id,
                    )
                    .first()
                )

                if not customer:
                    continue

                # --------------------------------------------
                # Sales analytics
                # --------------------------------------------

                try:

                    sync_customer_sales_analytics(
                        db,
                        customer,
                    )

                except TypeError:

                    sync_customer_sales_analytics(
                        db=db,
                        customer=customer,
                    )

                # --------------------------------------------
                # Purchase summary
                # --------------------------------------------

                try:

                    update_customer_purchase_summary(
                        db,
                        customer,
                    )

                except TypeError:

                    update_customer_purchase_summary(
                        db=db,
                        customer=customer,
                    )

        # ====================================================
        # UNSUPPORTED TYPE
        # ====================================================

        else:

            raise ImportValidationException(
                "Unsupported import type."
            )

        # ====================================================
        # FINAL RESULT
        # ====================================================

        failed = len(rows) - success

        item.total_records = len(rows)

        item.successful_records = success

        item.failed_records = failed

        item.duplicate_records = duplicates

        if failed == 0:

            item.status = "Completed"

        else:

            item.status = "Completed with Errors"

        item.completed_at = datetime.now()

        # ----------------------------------------------------
        # IMPORTANT:
        # This commits BOTH:
        #
        # 1. Business records
        # 2. Import history
        #
        # as one transaction.
        # ----------------------------------------------------

        db.commit()

        db.refresh(item)

        return (
            item,
            failed,
            duplicates,
        )

    # ========================================================
    # DATABASE ERROR
    # ========================================================

    except IntegrityError as exc:

        db.rollback()

        fresh_item = (
            db.query(ImportHistory)
            .filter(
                ImportHistory.id == item.id,
                ImportHistory.company_id
                == company_id,
            )
            .first()
        )

        if fresh_item:

            fresh_item.status = "Failed"

            fresh_item.completed_at = datetime.now()

            fresh_item.successful_records = 0

            fresh_item.failed_records = len(rows)

            db.commit()

            db.refresh(fresh_item)

            item = fresh_item

        # ----------------------------------------------------
        # Show actual database error.
        # This makes future debugging much easier.
        # ----------------------------------------------------

        database_message = str(
            getattr(
                exc,
                "orig",
                exc,
            )
        )

        raise ImportValidationException(
            (
                "Import failed because of a database "
                f"constraint: {database_message}. "
                "No partial data was committed."
            )
        ) from exc

    # ========================================================
    # IMPORT VALIDATION ERROR
    # ========================================================

    except ImportValidationException:

        db.rollback()

        fresh_item = (
            db.query(ImportHistory)
            .filter(
                ImportHistory.id == item.id,
                ImportHistory.company_id
                == company_id,
            )
            .first()
        )

        if fresh_item:

            fresh_item.status = "Failed"

            fresh_item.completed_at = datetime.now()

            fresh_item.successful_records = 0

            fresh_item.failed_records = len(rows)

            db.commit()

            db.refresh(fresh_item)

            item = fresh_item

        raise

    # ========================================================
    # GENERAL ERROR
    # ========================================================

    except Exception as exc:

        db.rollback()

        fresh_item = (
            db.query(ImportHistory)
            .filter(
                ImportHistory.id == item.id,
                ImportHistory.company_id
                == company_id,
            )
            .first()
        )

        if fresh_item:

            fresh_item.status = "Failed"

            fresh_item.completed_at = datetime.now()

            fresh_item.successful_records = 0

            fresh_item.failed_records = len(rows)

            db.commit()

            db.refresh(fresh_item)

            item = fresh_item

        raise ImportValidationException(
            (
                "Import failed unexpectedly: "
                f"{str(exc)}. "
                "No partial data was committed."
            )
        ) from exc