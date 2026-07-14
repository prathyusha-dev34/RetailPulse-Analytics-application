export const registerCompany = async (_data: any) => {
  return Promise.resolve({
    data: {
      message: "Company registered successfully",
    },
  });
};

export const login = async (_data: any) => {
  return Promise.resolve({
    data: {
      access_token: "demo-access-token",
      refresh_token: "demo-refresh-token",
    },
  });
};

export const logout = async () => {
  return Promise.resolve({ data: {} });
};

export const getProfile = async () => {
  return Promise.resolve({
    data: {
      name: "Praveen",
      email: "admin@test.com",
      role: "Company Admin",
      company: "RetailPulse",
      last_login: new Date().toLocaleString(),
      status: "Active",
    },
  });
};

export const changePassword = async () => {
  return Promise.resolve({ data: {} });
};

export const getAdminDashboard = async () => {
  return Promise.resolve({
    data: {
      totalUsers: 25,
      totalProducts: 120,
      totalSales: 450,
      totalRevenue: 125000,
    },
  });
};