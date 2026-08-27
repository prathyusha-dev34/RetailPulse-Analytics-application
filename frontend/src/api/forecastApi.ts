import axiosInstance from "./axios";

export interface InventoryForecast {
  product_id: number;
  product: string;
  sku: string;

  category_id?: number | null;
  category?: string | null;
  supplier?: string | null;

  current_stock: number;
  historical_sales: number;

  average_daily_sales: number;
  forecasted_demand: number;
  forecast_days: number;

  lead_time_days: number;

  safety_stock: number;
  safety_stock_days: number;

  reorder_point: number;

  days_of_stock_remaining:
    | number
    | null;

  recommended_reorder_quantity: number;

  stock_risk:
    | "Out of Stock"
    | "Stockout Risk"
    | "Low Stock"
    | "Healthy"
    | "Overstock";

  reorder_required: boolean;

  recommendation: string;
}

export interface ForecastSummary {
  products_requiring_reorder: number;
  products_at_stockout_risk: number;
  overstocked_products: number;
  healthy_products: number;
  low_stock_products: number;
}

export async function getInventoryForecast(
  forecastDays = 30,
) {
  const response =
    await axiosInstance.get(
      "/inventory/forecast",
      {
        params: {
          forecast_days: forecastDays,
        },
      },
    );

  return response.data;
}

export async function getInventoryRecommendations(
  params?: {
    stock_risk?: string;
    category_id?: number;
    product_id?: number;
    reorder_required?: boolean;
    sort_by?: string;
    sort_order?: "asc" | "desc";
    forecast_days?: number;
  },
) {
  const response =
    await axiosInstance.get(
      "/inventory/recommendations",
      {
        params,
      },
    );

  return response.data;
}

export async function getProductRecommendation(
  productId: number,
  forecastDays = 30,
) {
  const response =
    await axiosInstance.get(
      `/inventory/recommendations/${productId}`,
      {
        params: {
          forecast_days: forecastDays,
        },
      },
    );

  return response.data;
}

export async function getInventoryForecastSummary(
  forecastDays = 30,
) {
  const response =
    await axiosInstance.get(
      "/inventory/forecast/summary",
      {
        params: {
          forecast_days: forecastDays,
        },
      },
    );

  return response.data;
}