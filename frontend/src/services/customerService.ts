
import api from "../api/axios";

// ==========================================================
// CUSTOMER TYPES
// ==========================================================

export interface Customer {
  id?: number | string;
  customer_id?: string;

  first_name?: string;
  last_name?: string;

  full_name: string;

  email?: string;
  phone_number?: string;

  date_of_birth?: string;
  gender?: string;

  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;

  customer_type?: string;
  preferred_sales_channel?: string;

  customer_segment?: string;
  status?: string;

  total_orders?: number;
  total_quantity_purchased?: number;

  lifetime_revenue?: number;
  total_revenue?: number;
  total_purchase_amount?: number;

  average_order_value?: number;
  purchase_frequency?: number;

  first_purchase_date?: string | null;
  last_purchase_date?: string | null;
  last_activity_date?: string | null;

  favorite_product?: string | null;
  favorite_category?: string | null;

  is_vip?: boolean | string;

  created_by?: number;

  created_at?: string;
  updated_at?: string;

  // Profile / analytics data
  purchase_summary?: any;
  purchase_history?: any[];
  favourite_products?: any[];
  favorite_products?: any[];

  purchase_trend?: any[];
  order_frequency?: any[];
  spending_growth?: any[];
  revenue_distribution?: any[];
}


// ==========================================================
// CUSTOMER LIST RESPONSE
// ==========================================================

export interface CustomerListResponse {
  total: number;
  page: number;
  limit: number;
  data: Customer[];
}


// ==========================================================
// CREATE CUSTOMER
// ==========================================================

export const createCustomer = async (
  data: Customer
) => {
  const response = await api.post(
    "/customers/",
    data
  );

  return response.data;
};


// ==========================================================
// GET CUSTOMERS
// ==========================================================

export const getCustomers = async (
  page: number = 1,
  limit: number = 100
): Promise<CustomerListResponse> => {

  const response = await api.get(
    "/customers/",
    {
      params: {
        page,
        limit,
      },
    }
  );

  return response.data;
};


// ==========================================================
// GET SINGLE CUSTOMER
// ==========================================================

export const getCustomer = async (
  customerId: string | number
): Promise<Customer> => {

  const response = await api.get(
    `/customers/${customerId}`
  );

  return response.data;
};


// ==========================================================
// SEARCH CUSTOMERS
// ==========================================================

export const searchCustomers = async (
  keyword: string
) => {

  const response = await api.get(
    "/customers/search/",
    {
      params: {
        keyword: keyword.trim(),
      },
    }
  );

  return response.data;
};


// ==========================================================
// FILTER CUSTOMERS
// ==========================================================

export interface CustomerFilters {
  customer_type?: string;
  customer_segment?: string;
  status?: string;
  city?: string;
  state?: string;
  country?: string;
  from_date?: string;
  to_date?: string;
}

export const filterCustomers = async (
  filters: CustomerFilters
) => {

  const cleanFilters = Object.fromEntries(
    Object.entries(filters).filter(
      ([, value]) =>
        value !== undefined &&
        value !== null &&
        value !== ""
    )
  );

  const response = await api.get(
    "/customers/filter/",
    {
      params: cleanFilters,
    }
  );

  return response.data;
};


// ==========================================================
// SORT CUSTOMERS
// ==========================================================
// Frontend sorting.
// IMPORTANT:
// Customers.tsx should first get the customers,
// then call this function with the list.
//
// Example:
// const sorted = sortCustomers(
//   customers,
//   "total_orders",
//   "desc"
// );
// ==========================================================

export const sortCustomers = (
  customers: Customer[],
  sortBy: string,
  order: "asc" | "desc" = "desc"
): Customer[] => {

  const sorted = [...customers];

  sorted.sort(
    (
      a: Customer,
      b: Customer
    ) => {

      let valueA: any;
      let valueB: any;

      switch (sortBy) {

        case "name":
        case "full_name":

          valueA =
            a.full_name || "";

          valueB =
            b.full_name || "";

          break;


        case "total_spend":
        case "lifetime_revenue":

          valueA =
            Number(
              a.lifetime_revenue ?? 0
            );

          valueB =
            Number(
              b.lifetime_revenue ?? 0
            );

          break;


        case "total_orders":

          valueA =
            Number(
              a.total_orders ?? 0
            );

          valueB =
            Number(
              b.total_orders ?? 0
            );

          break;


        case "last_purchase":

          valueA =
            a.last_purchase_date
              ? new Date(
                  a.last_purchase_date
                ).getTime()
              : 0;

          valueB =
            b.last_purchase_date
              ? new Date(
                  b.last_purchase_date
                ).getTime()
              : 0;

          break;


        case "customer_since":

          valueA =
            a.created_at
              ? new Date(
                  a.created_at
                ).getTime()
              : 0;

          valueB =
            b.created_at
              ? new Date(
                  b.created_at
                ).getTime()
              : 0;

          break;


        case "status":

          valueA =
            a.status || "";

          valueB =
            b.status || "";

          break;


        case "customer_segment":

          valueA =
            a.customer_segment || "";

          valueB =
            b.customer_segment || "";

          break;


        default:

          valueA =
            a.created_at || "";

          valueB =
            b.created_at || "";

          break;
      }


      if (
        typeof valueA === "string" &&
        typeof valueB === "string"
      ) {

        const result =
          valueA.localeCompare(
            valueB
          );

        return order === "asc"
          ? result
          : -result;
      }


      const result =
        Number(valueA) -
        Number(valueB);

      return order === "asc"
        ? result
        : -result;
    }
  );

  return sorted;
};


// ==========================================================
// UPDATE CUSTOMER
// ==========================================================

export const updateCustomer = async (
  customerId: string | number,
  data: Partial<Customer>
): Promise<Customer> => {

  const response = await api.put(
    `/customers/${customerId}`,
    data
  );

  return response.data;
};


// ==========================================================
// DELETE CUSTOMER
// ==========================================================

export const deleteCustomer = async (
  customerId: string | number
) => {

  const response = await api.delete(
    `/customers/${customerId}`
  );

  return response.data;
};


// ==========================================================
// ACTIVATE CUSTOMER
// ==========================================================

export const activateCustomer = async (
  customerId: string | number
): Promise<Customer> => {

  const response = await api.patch(
    `/customers/${customerId}/activate`
  );

  return response.data;
};


// ==========================================================
// DEACTIVATE CUSTOMER
// ==========================================================

export const deactivateCustomer = async (
  customerId: string | number
): Promise<Customer> => {

  const response = await api.patch(
    `/customers/${customerId}/deactivate`
  );

  return response.data;
};


// ==========================================================
// CUSTOMER PROFILE
// ==========================================================

export const getCustomerProfile = async (
  customerId: string | number
) => {

  const response = await api.get(
    `/customers/${customerId}/profile`
  );

  return response.data;
};


// ==========================================================
// CUSTOMER TIMELINE
// ==========================================================

export const getCustomerTimeline = async (
  customerId: string | number
) => {

  const response = await api.get(
    `/customers/${customerId}/timeline`
  );

  return response.data;
};


// ==========================================================
// RECENT TRANSACTIONS
// ==========================================================

export const getRecentTransactions = async (
  customerId: string | number
) => {

  const response = await api.get(
    `/customers/${customerId}/transactions`
  );

  return response.data;
};


// ==========================================================
// CUSTOMER DASHBOARD
// ==========================================================

export const getCustomerDashboard =
async () => {

  const response = await api.get(
    "/customers/analytics/dashboard"
  );

  return response.data;
};


// ==========================================================
// CUSTOMER ANALYTICS
// ==========================================================

export const getCustomerAnalytics =
async () => {

  const response = await api.get(
    "/customers/analytics"
  );

  return response.data;
};


// ==========================================================
// CUSTOMER REVENUE CONTRIBUTION
// ==========================================================

export const getCustomerRevenueContribution =
async () => {

  const response = await api.get(
    "/customers/analytics/revenue-contribution"
  );

  return response.data;
};


// ==========================================================
// NEW VS RETURNING CUSTOMERS
// ==========================================================

export const getNewVsReturningCustomers =
async () => {

  const response = await api.get(
    "/customers/analytics/new-vs-returning"
  );

  return response.data;
};


// ==========================================================
// CUSTOMER GROWTH TREND
// ==========================================================

export const getCustomerGrowthTrend =
async () => {

  const response = await api.get(
    "/customers/analytics/growth-trend"
  );

  return response.data;
};


// ==========================================================
// CUSTOMER SPENDING DISTRIBUTION
// ==========================================================

export const getCustomerSpendingDistribution =
async () => {

  const response = await api.get(
    "/customers/analytics/spending-distribution"
  );

  return response.data;
};


// ==========================================================
// TOP CUSTOMERS
// ==========================================================

export const getTopCustomers =
async () => {

  const response = await api.get(
    "/customers/analytics/top-customers"
  );

  return response.data;
};


// ==========================================================
// RECENT CUSTOMER ACTIVITY
// ==========================================================

export const getRecentCustomerActivity =
async () => {

  const response = await api.get(
    "/customers/activity/recent"
  );

  return response.data;
};


// ==========================================================
// EXPORT CUSTOMERS CSV
// ==========================================================

export const exportCustomersCSV =
async () => {

  const response = await api.get(
    "/customers/export/csv",
    {
      responseType: "blob",
    }
  );

  return response.data;
};


// ==========================================================
// EXPORT CUSTOMERS PDF
// ==========================================================

export const exportCustomersPDF =
async () => {

  const response = await api.get(
    "/customers/export/pdf",
    {
      responseType: "blob",
    }
  );

  return response.data;
};


// ==========================================================
// EXPORT ANALYTICS PDF
// ==========================================================

export const exportCustomerAnalyticsPDF =
async () => {

  const response = await api.get(
    "/customers/export/analytics/pdf",
    {
      responseType: "blob",
    }
  );

  return response.data;
};


// ==========================================================
// TOP CUSTOMERS CSV
// ==========================================================

export const exportTopCustomersCSV =
async () => {

  const response = await api.get(
    "/customers/export/top-customers/csv",
    {
      responseType: "blob",
    }
  );

  return response.data;
};


// ==========================================================
// TOP CUSTOMERS PDF
// ==========================================================

export const exportTopCustomersPDF =
async () => {

  const response = await api.get(
    "/customers/export/top-customers/pdf",
    {
      responseType: "blob",
    }
  );

  return response.data;
};


// ==========================================================
// DOWNLOAD FILE HELPER
// ==========================================================

export const downloadFile = (
  blob: Blob,
  filename: string
) => {

  const url =
    window.URL.createObjectURL(blob);

  const link =
    document.createElement("a");

  link.href = url;

  link.download = filename;

  document.body.appendChild(link);

  link.click();

  document.body.removeChild(link);

  window.URL.revokeObjectURL(url);
};
