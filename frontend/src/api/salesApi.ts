import api from "./axios";


// ============================
// TYPES
// ============================

export interface SaleItem {

  product_id: number;

  quantity: number;

  unit_price: number;

  discount: number;

  tax: number;

}



export interface SalePayload {

  customer_name: string;

  sale_date?: string;

  sales_channel: string;

  payment_method: string;

  items: SaleItem[];

}



export interface SalesFilterParams {

  start_date?: string;

  end_date?: string;

  category_id?: number;

  sales_channel?: string;

  payment_method?: string;

}



// ============================
// CREATE SALE
// ============================

export const createSale = async (
  data: SalePayload
) => {

  const response = await api.post(
    "/sales/",
    data
  );

  return response.data;

};



// ============================
// GET ALL SALES
// ============================

export const getSales = async () => {

  const response = await api.get(
    "/sales/"
  );

  return response.data;

};



// ============================
// GET SINGLE SALE
// ============================

export const getSale = async (
  saleId:number
) => {

  const response = await api.get(
    `/sales/${saleId}`
  );

  return response.data;

};



// ============================
// UPDATE SALE
// ============================

export const updateSale = async (
  saleId:number,
  data:SalePayload
) => {

  const response = await api.put(
    `/sales/${saleId}`,
    data
  );

  return response.data;

};



// ============================
// DELETE SALE
// ============================

export const deleteSale = async (
  saleId:number
) => {

  const response = await api.delete(
    `/sales/${saleId}`
  );

  return response.data;

};



// ============================
// SEARCH SALES
// ============================

export const searchSales = async (
  keyword:string
) => {

  const response = await api.get(
    "/sales/search",
    {
      params:{
        keyword
      }
    }
  );

  return response.data;

};



// ============================
// FILTER SALES
// ============================

export const filterSales = async (
  params:SalesFilterParams
) => {

  const response = await api.get(
    "/sales/filter",
    {
      params
    }
  );

  return response.data;

};



// ============================
// SORT SALES
// ============================

export const sortSales = async (
  sort_by:string="sale_date",
  order:string="desc"
) => {

  const response = await api.get(
    "/sales/sort",
    {
      params:{
        sort_by,
        order
      }
    }
  );

  return response.data;

};



// ============================
// DASHBOARD SUMMARY
// ============================

export const getDashboardSummary = async () => {

  const response = await api.get(
    "/sales/dashboard"
  );

  return response.data;

};



// Existing alias (optional use)
export const getSalesDashboard = getDashboardSummary;



// ============================
// LOW STOCK PRODUCTS
// ============================

export const getLowStockProducts = async (
  threshold:number = 5
) => {

  const response = await api.get(
    "/sales/low-stock",
    {
      params:{
        threshold
      }
    }
  );

  return response.data;

};



// ============================
// OUT OF STOCK PRODUCTS
// ============================

export const getOutOfStockProducts = async () => {

  const response = await api.get(
    "/sales/out-of-stock"
  );

  return response.data;

};



// ============================
// REMAINING STOCK
// ============================

export const getRemainingStock = async (
  productId:number
) => {

  const response = await api.get(
    `/sales/remaining-stock/${productId}`
  );

  return response.data;

};