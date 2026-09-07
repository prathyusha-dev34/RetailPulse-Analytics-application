from typing import Any, Optional
from pydantic import BaseModel, ConfigDict


class ImportUploadResponse(BaseModel):
    success: bool = True
    import_id: int
    import_type: str
    filename: str
    total_records: int
    columns: list[str]
    preview: list[dict[str, Any]]
    message: str


class ImportValidateResponse(BaseModel):
    success: bool = True
    import_id: int
    import_type: str
    total_records: int
    valid_records: int
    invalid_records: int
    duplicate_records: int
    columns: list[str]
    preview: list[dict[str, Any]]
    errors: list[dict[str, Any]]
    message: str


class ImportProcessResponse(BaseModel):
    success: bool = True
    import_id: int
    status: str
    total_records: int
    successful_records: int
    failed_records: int
    duplicate_records: int
    validation_failures: int
    message: str


class ImportHistoryResponse(BaseModel):
    id: int
    import_type: str
    filename: str
    uploaded_by: int
    total_records: int
    successful_records: int
    failed_records: int
    duplicate_records: int
    status: str
    created_at: Any
    completed_at: Optional[Any] = None

    model_config = ConfigDict(from_attributes=True)
