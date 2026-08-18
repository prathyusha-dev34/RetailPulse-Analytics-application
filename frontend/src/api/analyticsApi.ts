import api from "./axios";

export type AnalyticsPeriod =
  | "daily"
  | "weekly"
  | "monthly";

export type ProductSort =
  | "revenue"
  | "quantity";

export interface AnalyticsFilters {
  from_date?: string;
  to_date?: string;
  period?: AnalyticsPeriod;

  product_id?: number | string;
  category_id?: number | string;
  customer_id?: number | string;
  payment_method?: string;
}

export interface ProductAnalyticsParams
  extends AnalyticsFilters {
  sort_by?: ProductSort;
  limit?: number;
  offset?: number;
}

export interface CustomerAnalyticsParams
  extends AnalyticsFilters {
  limit?: number;
  offset?: number;
}

const CACHE_TTL = 30 * 1000;

interface CacheEntry {
  expiresAt: number;
  data: any;
}

const cache = new Map<string, CacheEntry>();

const cleanParams = (
  params?: Record<string, any>
) => {
  if (!params) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) =>
        value !== "" &&
        value !== null &&
        value !== undefined
    )
  );
};

const createCacheKey = (
  endpoint: string,
  params?: Record<string, any>
) => {
  const cleaned =
    cleanParams(params);

  const sorted =
    Object.keys(cleaned)
      .sort()
      .reduce<Record<string, any>>(
        (result, key) => {
          result[key] =
            cleaned[key];

          return result;
        },
        {}
      );

  return `${endpoint}?${JSON.stringify(
    sorted
  )}`;
};

const getCached = async (
  endpoint: string,
  params?: Record<string, any>
) => {
  const key =
    createCacheKey(
      endpoint,
      params
    );

  const existing =
    cache.get(key);

  if (
    existing &&
    existing.expiresAt >
      Date.now()
  ) {
    return existing.data;
  }

  if (existing) {
    cache.delete(key);
  }

  const response =
    await api.get(
      endpoint,
      {
        params:
          cleanParams(
            params
          ),
      }
    );

  cache.set(key, {
    data: response,
    expiresAt:
      Date.now() +
      CACHE_TTL,
  });

  return response;
};

export const clearAnalyticsCache =
  () => {
    cache.clear();
  };

export const getSalesSummary = (
  params?: AnalyticsFilters
) =>
  getCached(
    "/analytics/sales/summary",
    params
  );

export const getSalesTrend = (
  params?: AnalyticsFilters
) =>
  getCached(
    "/analytics/sales/trend",
    params
  );

export const getSalesVsOrders = (
  params?: AnalyticsFilters
) =>
  getCached(
    "/analytics/sales/sales-vs-orders",
    params
  );

export const getSalesProducts = (
  params?: ProductAnalyticsParams
) =>
  getCached(
    "/analytics/sales/products",
    params
  );

export const getSalesCustomers = (
  params?: CustomerAnalyticsParams
) =>
  getCached(
    "/analytics/sales/customers",
    params
  );

export const getPaymentMethods = (
  params?: AnalyticsFilters
) =>
  getCached(
    "/analytics/sales/payment-methods",
    params
  );

export const exportSalesCsv = (
  params?: AnalyticsFilters
) =>
  api.get(
    "/analytics/sales/export/csv",
    {
      params:
        cleanParams(params),
      responseType:
        "blob",
    }
  );

export const exportSalesPdf = (
  params?: AnalyticsFilters
) =>
  api.get(
    "/analytics/sales/export/pdf",
    {
      params:
        cleanParams(params),
      responseType:
        "blob",
    }
  );

export const getDashboard =
  getSalesSummary;

export const getRevenueTrend =
  getSalesTrend;

export const getTopProducts =
  getSalesProducts;

export const getTopCategories =
  getSalesProducts;

export const getSalesChannels =
  getSalesVsOrders;

export const getInventoryDistribution =
  async () => ({
    data: [],
  });

export const getStockStatus =
  async () => ({
    data: [],
  });

export const getInventoryValue =
  async () => ({
    data: [],
  });

export const getLowStock =
  async () => ({
    data: [],
  });

export const getOutOfStock =
  async () => ({
    data: [],
  });