
import api from "./axios";

/* =========================================================
   TYPES
========================================================= */

export type ImportType =
  | "products"
  | "inventory"
  | "customers"
  | "sales";

export interface ImportErrorRow {
  row_number: number;
  error_type: string;
  field?: string | null;
  message: string;
  raw_data?: Record<string, string>;
  status?: string;
}

export interface UploadResponse {
  success: boolean;
  import_id: number;
  import_type: ImportType;
  filename: string;
  total_records: number;
  columns: string[];
  preview: Record<string, string>[];
  message: string;
}

export interface ValidateResponse extends UploadResponse {
  valid_records: number;
  invalid_records: number;
  duplicate_records: number;
  errors: ImportErrorRow[];
}

export interface ProcessResponse {
  success: boolean;
  import_id: number;
  status: string;
  total_records: number;
  successful_records: number;
  failed_records: number;
  duplicate_records: number;
  validation_failures: number;
  message: string;
}

export interface ImportHistoryItem {
  id: number;
  import_type: ImportType;
  filename: string;
  uploaded_by: number;
  total_records: number;
  successful_records: number;
  failed_records: number;
  duplicate_records: number;
  status: string;
  created_at: string;
  completed_at?: string | null;
  progress_percentage?: number;
  duration_seconds?: number;
}

export interface DeleteImportResponse {
  success: boolean;
  import_id: number;
  message: string;
}

export interface ImportStatusResponse {
  import_id: number;
  status: string;
  total_records: number;
  processed_records: number;
  successful_records: number;
  failed_records: number;
  duplicate_records: number;
  progress_percentage: number;
  message?: string;
}

/* =========================================================
   UPLOAD
   POST /api/import/upload
========================================================= */

export async function uploadImport(
  file: File,
  importType: ImportType
): Promise<UploadResponse> {
  const form = new FormData();

  form.append("file", file);

  const response = await api.post<UploadResponse>(
    "/import/upload",
    form,
    {
      params: {
        import_type: importType,
      },
    }
  );

  return response.data;
}

/* =========================================================
   VALIDATE
   POST /api/import/validate
========================================================= */

export async function validateImport(
  importId: number
): Promise<ValidateResponse> {
  const response = await api.post<ValidateResponse>(
    "/import/validate",
    null,
    {
      params: {
        import_id: importId,
      },
    }
  );

  return response.data;
}

/* =========================================================
   PROCESS - EXISTING API
   POST /api/import/process
========================================================= */

export async function processImport(
  importId: number
): Promise<ProcessResponse> {
  const response = await api.post<ProcessResponse>(
    "/import/process",
    null,
    {
      params: {
        import_id: importId,
      },
    }
  );

  return response.data;
}

/* =========================================================
   START IMPORT
   POST /api/import/start
========================================================= */

export async function startImport(
  importId: number
): Promise<ProcessResponse> {
  const response = await api.post<ProcessResponse>(
    "/import/start",
    null,
    {
      params: {
        import_id: importId,
      },
    }
  );

  return response.data;
}

/* =========================================================
   IMPORT STATUS
   GET /api/import/status/{import_id}
========================================================= */

export async function getImportStatus(
  importId: number
): Promise<ImportStatusResponse> {
  const response = await api.get<ImportStatusResponse>(
    `/import/status/${importId}`
  );

  return response.data;
}

/* =========================================================
   CANCEL IMPORT
   POST /api/import/cancel/{import_id}
========================================================= */

export async function cancelImport(
  importId: number
): Promise<{ success: boolean; message: string }> {
  const response = await api.post(
    `/import/cancel/${importId}`
  );

  return response.data;
}

/* =========================================================
   TEMPLATE DOWNLOAD
   GET /api/import/templates/{import_type}
========================================================= */

export async function downloadImportTemplate(
  importType: ImportType
): Promise<Blob> {
  const response = await api.get(
    `/import/templates/${importType}`,
    {
      responseType: "blob",
    }
  );

  return response.data;
}

/* =========================================================
   HISTORY
   GET /api/import/history
========================================================= */

export async function getImportHistory(): Promise<
  ImportHistoryItem[]
> {
  const response = await api.get(
    "/import/history"
  );

  // Supports both array and paginated API responses.
  return Array.isArray(response.data)
    ? response.data
    : response.data.items ?? [];
}

/* =========================================================
   DETAILS
   GET /api/import/{import_id}
========================================================= */

export async function getImportDetails(
  importId: number
): Promise<ImportHistoryItem> {
  const response = await api.get<ImportHistoryItem>(
    `/import/${importId}`
  );

  return response.data;
}

/* =========================================================
   DELETE IMPORT
   DELETE /api/import/{import_id}
========================================================= */

export async function deleteImport(
  importId: number
): Promise<DeleteImportResponse> {
  const response = await api.delete<DeleteImportResponse>(
    `/import/${importId}`
  );

  return response.data;
}

/* =========================================================
   ERRORS
   GET /api/import/{import_id}/errors
========================================================= */

export async function getImportErrors(
  importId: number
): Promise<ImportErrorRow[]> {
  const response = await api.get(
    `/import/${importId}/errors`
  );

  return Array.isArray(response.data)
    ? response.data
    : response.data.items ?? [];
}

/* =========================================================
   DOWNLOAD ERROR CSV
========================================================= */

export async function downloadImportErrors(
  importId: number
): Promise<Blob> {
  const response = await api.get(
    `/import/${importId}/errors/download`,
    {
      responseType: "blob",
    }
  );

  return response.data;
}


/* =========================================================
   TEMPLATE DOWNLOAD - COMPATIBILITY FUNCTION
========================================================= */

export async function downloadTemplate(
  importType: ImportType
): Promise<Blob> {
  return downloadImportTemplate(importType);
}