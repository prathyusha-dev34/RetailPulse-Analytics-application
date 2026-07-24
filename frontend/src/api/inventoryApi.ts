import axios from "./axios";


// =========================
// Get Inventory List
// =========================

export const getInventory = async (
  params?: {
    search?: string;
    category_id?: number;
    brand?: string;
    stock_status?: string;
    sort_by?: string;
  }
) => {

  const response = await axios.get(
    "/inventory/",
    {
      params,
    }
  );

  return response.data;
};



// =========================
// Dashboard Summary
// =========================

export const getInventoryDashboard =
async () => {

  const response = await axios.get(
    "/inventory/dashboard/summary"
  );

  return response.data;
};



// =========================
// Movement History
// =========================

export const getInventoryMovements =
async () => {

  const response = await axios.get(
    "/inventory/movements"
  );

  return response.data;
};



// =========================
// Add Stock
// =========================

export const addStock = async (
  data: {
    inventory_id: number;
    quantity: number;
    reason: string;
    remarks?: string;
  }
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
  data: {
    inventory_id: number;
    quantity: number;
    reason: string;
    remarks?: string;
  }
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
  data: {
    inventory_id: number;
    quantity: number;
    reason: string;
    remarks?: string;
  }
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

export const updateReorderLevel =
async (
  inventory_id: number,
  data: {
    reorder_level: number;
  }
) => {

  const response = await axios.patch(
    `/inventory/${inventory_id}/reorder-level`,
    data
  );

  return response.data;
};