import api from "./axios";

/* =========================================================
   TYPES
========================================================= */

export type ImportType =
  | "products"
  | "customers"
  | "sales";

/* =========================================================
   VALIDATION ERROR
========================================================= */

export interface ImportErrorRow {
  row_number: number;
  error_type: string;
  field?: string | null;
  message: string;
  raw_data?: Record<string, string>;
}

/* =========================================================
   UPLOAD RESPONSE
========================================================= */

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

/* =========================================================
   VALIDATE RESPONSE
========================================================= */

export interface ValidateResponse
  extends UploadResponse {
  valid_records: number;
  invalid_records: number;
  duplicate_records: number;
  errors: ImportErrorRow[];
}

/* =========================================================
   PROCESS RESPONSE
========================================================= */

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

/* =========================================================
   IMPORT HISTORY
========================================================= */

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

  const response =
    await api.post<UploadResponse>(
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
  const response =
    await api.post<ValidateResponse>(
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
   PROCESS
   POST /api/import/process
========================================================= */

export async function processImport(
  importId: number
): Promise<ProcessResponse> {
  const response =
    await api.post<ProcessResponse>(
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
   HISTORY
   GET /api/import/history
========================================================= */

export async function getImportHistory(): Promise<
  ImportHistoryItem[]
> {
  const response =
    await api.get<ImportHistoryItem[]>(
      "/import/history"
    );

  return response.data;
}

/* =========================================================
   DETAILS
   GET /api/import/{import_id}
========================================================= */

export async function getImportDetails(
  importId: number
): Promise<ImportHistoryItem> {
  const response =
    await api.get<ImportHistoryItem>(
      `/import/${importId}`
    );

  return response.data;
}

/* =========================================================
   DELETE IMPORT
   DELETE /api/import/{import_id}
========================================================= */

export interface DeleteImportResponse {
  success: boolean;
  import_id: number;
  message: string;
}

export async function deleteImport(
  importId: number
): Promise<DeleteImportResponse> {
  const response =
    await api.delete<DeleteImportResponse>(
      `/import/${importId}`
    );

  return response.data;
}

/* =========================================================
   DOWNLOAD ERRORS
   GET /api/import/{import_id}/errors
========================================================= */

export async function downloadImportErrors(
  importId: number
): Promise<Blob> {
  const response =
    await api.get<Blob>(
      `/import/${importId}/errors`,
      {
        responseType: "blob",
      }
    );

  return response.data;
}