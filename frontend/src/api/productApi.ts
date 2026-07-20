import api from "./axios";

export interface ProductData {
  id?: number;
  category_id: number;
  name: string;
  sku: string;
  brand?: string;
  description?: string;
  unit_price: number;
  cost_price: number;
  stock_quantity: number;
  unit_of_measure: string;
  status: string;
}

export interface ProductFilters {
  search?: string;
  category_id?: number;
  brand?: string;
  status?: string;
  sort_by?: string;
}

export const getProducts = (params?: ProductFilters) => {
  return api.get("/products", { params });
};

export const getProduct = (productId: number) => {
  return api.get(`/products/${productId}`);
};

export const createProduct = (data: ProductData) => {
  return api.post("/products", data);
};

export const updateProduct = (
  productId: number,
  data: Partial<ProductData>
) => {
  return api.put(`/products/${productId}`, data);
};

export const deleteProduct = (productId: number) => {
  return api.delete(`/products/${productId}`);
};

export const activateProduct = (productId: number) => {
  return api.patch(`/products/${productId}/activate`);
};

export const deactivateProduct = (productId: number) => {
  return api.patch(`/products/${productId}/deactivate`);
};

export const getProductDashboardSummary = () => {
  return api.get("/products/dashboard/summary");
};