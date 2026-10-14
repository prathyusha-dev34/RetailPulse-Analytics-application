
import api from "./axios";

// =====================================================
// TYPES
// =====================================================

export interface ReportType {
  value: string;
  label: string;
}

export interface ReportFilters {
  date_from?: string;
  date_to?: string;
  product?: string;
  category?: string;
  brand?: string;
  customer?: string;
  sales_status?: string;
  stock_status?: string;
  user?: string;
  company?: string;
  [key: string]: unknown;
}

export interface GenerateReportRequest {
  report_type: string;
  filters: ReportFilters;
  page: number;
  page_size: number;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

export interface ReportResponse {
  report_type: string;
  report_name: string;
  items: Record<string, unknown>[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  applied_filters: ReportFilters;
  period: string;
  history_id?: number;
}

export interface ExportReportRequest {
  report_type: string;
  filters: ReportFilters;
  export_format: "CSV" | "PDF";
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

export interface ReportHistoryItem {
  id: number;
  report_type: string;
  report_name: string;
  generated_by: number;
  generated_at: string;
  applied_filters: ReportFilters;
  report_period: string;
  format: string;
  status: string;
  failure_reason: string | null;
  row_count: number;
  download_available: boolean;
}

export interface ScheduleReport {
  id: number;
  report_type: string;
  report_name: string;
  filters: ReportFilters;
  frequency: "DAILY" | "WEEKLY" | "MONTHLY";
  execution_time: string;
  recipients: string[];
  export_format: "CSV" | "PDF";
  is_active: boolean;
  last_run_at: string | null;
  last_report_history_id: number | null;
  last_status: string | null;
  last_error: string | null;
  next_run_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateScheduleRequest {
  report_type: string;
  report_name: string;
  filters: ReportFilters;
  frequency: "DAILY" | "WEEKLY" | "MONTHLY";
  execution_time: string;
  recipients: string[];
  export_format: "CSV" | "PDF";
  is_active: boolean;
}

export interface UpdateScheduleRequest {
  report_type?: string;
  report_name?: string;
  filters?: ReportFilters;
  frequency?: "DAILY" | "WEEKLY" | "MONTHLY";
  execution_time?: string;
  recipients?: string[];
  export_format?: "CSV" | "PDF";
  is_active?: boolean;
}

// =====================================================
// REPORT TYPES
// =====================================================

export const getReportTypes = async (): Promise<ReportType[]> => {
  const response = await api.get("/reports/types");
  return response.data;
};

// =====================================================
// GENERATE REPORT
// =====================================================

export const generateReport = async (
  payload: GenerateReportRequest
): Promise<ReportResponse> => {
  const response = await api.post("/reports/generate", payload);
  return response.data;
};

// =====================================================
// EXPORT REPORT
// =====================================================

export const exportReport = async (
  payload: ExportReportRequest
): Promise<Blob> => {
  const response = await api.post("/reports/export", payload, {
    responseType: "blob",
  });

  return response.data;
};

// =====================================================
// REPORT HISTORY
// =====================================================

export const getReportHistory = async (): Promise<{
  items: ReportHistoryItem[];
}> => {
  const response = await api.get("/reports/history");
  return response.data;
};

// =====================================================
// DOWNLOAD REPORT HISTORY FILE
// =====================================================

export const downloadReportHistory = async (
  historyId: number
): Promise<Blob> => {
  const response = await api.get(
    `/reports/history/${historyId}/download`,
    {
      responseType: "blob",
    }
  );

  return response.data;
};

// =====================================================
// SCHEDULED REPORTS
// =====================================================

export const getScheduledReports = async (): Promise<ScheduleReport[]> => {
  const response = await api.get("/reports/schedules");
  return response.data;
};

export const createScheduledReport = async (
  payload: CreateScheduleRequest
): Promise<ScheduleReport> => {
  const response = await api.post("/reports/schedules", payload);
  return response.data;
};

export const updateScheduledReport = async (
  scheduleId: number,
  payload: UpdateScheduleRequest
): Promise<ScheduleReport> => {
  const response = await api.put(
    `/reports/schedules/${scheduleId}`,
    payload
  );

  return response.data;
};

export const deleteScheduledReport = async (
  scheduleId: number
): Promise<void> => {
  await api.delete(`/reports/schedules/${scheduleId}`);
};

export const toggleScheduledReport = async (
  scheduleId: number
): Promise<ScheduleReport> => {
  const response = await api.patch(
    `/reports/schedules/${scheduleId}/toggle`
  );

  return response.data;
};

