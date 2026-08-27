import axios from "./axios";

// =========================
// Types
// =========================

export interface InventoryQueryParams {
  search?: string;
  category_id?: number;
  brand?: string;
  stock_status?: string;
  sort_by?: string;
  skip?: number;
  limit?: number;
}

export interface StockAdjustmentData {
  inventory_id: number;
  quantity: number;
  reason: string;
  remarks?: string;
}

export interface ReorderLevelData {
  reorder_level: number;
}

// =========================
// Get Inventory List
// =========================

export const getInventory = async (
  params?: InventoryQueryParams
) => {
  const response = await axios.get("/inventory/", {
    params,
  });

  return response.data;
};

// =========================
// Dashboard Summary
// =========================

export const getInventoryDashboard = async () => {
  const response = await axios.get(
    "/inventory/dashboard/summary"
  );

  return response.data;
};

// =========================
// Movement History
// =========================

export const getInventoryMovements = async (
  skip = 0,
  limit = 10
) => {
  const response = await axios.get(
    "/inventory/movements",
    {
      params: {
        skip,
        limit,
      },
    }
  );

  return response.data;
};

// =========================
// Add Stock
// =========================

export const addStock = async (
  data: StockAdjustmentData
) => {
  const response = await axios.patch(
    "/inventory/add-stock",
    data
  );

  return response.data;
};

// =========================
// Remove Stock
// =========================

export const removeStock = async (
  data: StockAdjustmentData
) => {
  const response = await axios.patch(
    "/inventory/remove-stock",
    data
  );

  return response.data;
};

// =========================
// Adjust Stock
// =========================

export const adjustStock = async (
  data: StockAdjustmentData
) => {
  const response = await axios.patch(
    "/inventory/adjust-stock",
    data
  );

  return response.data;
};

// =========================
// Update Reorder Level
// =========================

export const updateReorderLevel = async (
  inventoryId: number,
  reorderLevel: number
) => {
  const response = await axios.patch(
    `/inventory/${inventoryId}/reorder-level`,
    {
      reorder_level: reorderLevel,
    }
  );

  return response.data;
};

// ============================================================
// INVENTORY FORECASTING
// ============================================================

// =========================
// Forecast Analytics
// GET /inventory/forecast
// =========================

export const getInventoryForecast = async () => {
  const response = await axios.get(
    "/inventory/forecast"
  );

  return response.data;
};

// =========================
// Product Forecasts
// GET /inventory/forecast/products
// =========================

export interface ProductForecastParams {
  forecast_period?: string;
  search?: string;
  category_id?: number;
  brand?: string;
  sort_by?: string;
}

export const getProductForecasts = async (
  params?: ProductForecastParams
) => {
  const response = await axios.get(
    "/inventory/forecast/products",
    {
      params,
    }
  );

  return response.data;
};

// =========================
// Category Forecasts
// GET /inventory/forecast/categories
// =========================

export const getCategoryForecasts = async () => {
  const response = await axios.get(
    "/inventory/forecast/categories"
  );

  return response.data;
};

// =========================
// Inventory Recommendations
// GET /inventory/recommendations
// =========================

export const getInventoryRecommendations =
  async () => {
    const response = await axios.get(
      "/inventory/recommendations"
    );

    return response.data;
  };

// =========================
// Top Predicted Products
// GET /inventory/forecast/top-products
// =========================

export const getTopPredictedProducts =
  async () => {
    const response = await axios.get(
      "/inventory/forecast/top-products"
    );

    return response.data;
  };