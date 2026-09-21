
import api from "./axios";

/* ===========================
   AUTH
=========================== */

export const registerCompany = (data: any) => {
  return api.post(
    "/auth/register-company",
    data
  );
};

export const login = (data: any) => {
  return api.post(
    "/auth/login",
    data
  );
};

export const logout = () => {
  localStorage.removeItem(
    "accessToken"
  );

  localStorage.removeItem(
    "refreshToken"
  );

  return Promise.resolve();
};

/* ===========================
   PROFILE
=========================== */

export const getProfile = () => {
  return api.get(
    "/auth/profile"
  );
};

export const changePassword = (
  data: any
) => {
  return api.post(
    "/auth/change-password",
    data
  );
};

/* ===========================
   ADMIN DASHBOARD
=========================== */

export const getAdminDashboard = () => {
  return api.get(
    "/admin/dashboard"
  );
};

/* ===========================
   AUDIT LOGS
=========================== */

export interface AuditLog {
  id: number;

  company_id: number | null;
  user_id: number | null;

  entity_name?: string | null;
  action: string;

  ip_address?: string | null;
  browser?: string | null;

  resource_type?: string | null;
  resource_id?: string | null;

  description?: string | null;
  user_agent?: string | null;

  status?: string | null;

  before_values?:
    | Record<string, unknown>
    | null;

  after_values?:
    | Record<string, unknown>
    | null;

  created_at: string;
}

export interface AuditLogFilters {
  page?: number;
  page_size?: number;

  search?: string;

  action?: string;
  resource_type?: string;
  status?: string;
  user_id?: number;

  start_date?: string;
  end_date?: string;

  sort_by?: string;
  sort_order?: "asc" | "desc";
}

/*
 * Get paginated / filtered audit logs.
 *
 * Backend:
 * GET /api/audit/logs
 */
export const getAuditLogs = (
  params?: AuditLogFilters
) => {
  return api.get<AuditLog[]>(
    "/audit/logs",
    {
      params,
    }
  );
};

/*
 * Get one audit log with complete
 * before / after information.
 *
 * Backend:
 * GET /api/audit/logs/{log_id}
 */
export const getAuditLog = (
  logId: number
) => {
  return api.get<AuditLog>(
    `/audit/logs/${logId}`
  );
};

