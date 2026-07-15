import api from "./axios";

/* ===========================
   AUTH
=========================== */

export const registerCompany = (data: any) => {
  return api.post("/auth/register-company", data);
};

export const login = (data: any) => {
  return api.post("/auth/login", data);
};

export const logout = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  return Promise.resolve();
};

/* ===========================
   PROFILE
=========================== */

export const getProfile = () => {
  return api.get("/auth/profile");
};

export const changePassword = (data: any) => {
  return api.post("/auth/change-password", data);
};

/* ===========================
   ADMIN DASHBOARD
=========================== */

export const getAdminDashboard = () => {
  return api.get("/admin/dashboard");
};