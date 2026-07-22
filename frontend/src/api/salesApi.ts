import api from "./axios";


// ----------------------------
// Types
// ----------------------------


export interface SaleItem {


  product_id:number;


  quantity:number;


  unit_price:number;


  discount:number;


  tax:number;


}




export interface SalePayload {


  customer_name:string;


  sale_date?:string;


  sales_channel:string;


  payment_method:string;


  items:SaleItem[];


}




export interface SalesFilterParams {


  start_date?:string;


  end_date?:string;


  category_id?:number;


  sales_channel?:string;


  payment_method?:string;


}





// ----------------------------
// Create Sale
// ----------------------------


export const createSale = async (

  data:SalePayload

)=>{


  const response = await api.post(

    "/sales/",

    data

  );


  return response.data;

};







// ----------------------------
// Get All Sales
// ----------------------------


export const getSales = async ()=>{


  const response = await api.get(

    "/sales/"

  );


  return response.data;

};








// ----------------------------
// Get Single Sale
// ----------------------------


export const getSale = async (

  saleId:number

)=>{


  const response = await api.get(

    `/sales/${saleId}`

  );


  return response.data;

};








// ----------------------------
// Update Sale
// ----------------------------


export const updateSale = async (

  saleId:number,

  data:SalePayload

)=>{


  const response = await api.put(

    `/sales/${saleId}`,

    data

  );


  return response.data;

};








// ----------------------------
// Delete Sale
// ----------------------------


export const deleteSale = async (

  saleId:number

)=>{


  const response = await api.delete(

    `/sales/${saleId}`

  );


  return response.data;

};









// ----------------------------
// Search Sales
// ----------------------------


export const searchSales = async (

  keyword:string

)=>{


  const response = await api.get(

    "/sales/search",

    {

      params:{

        keyword,

      },

    }

  );


  return response.data;

};









// ----------------------------
// Filter Sales
// ----------------------------


export const filterSales = async (

  params:SalesFilterParams

)=>{


  const response = await api.get(

    "/sales/filter",

    {

      params,

    }

  );


  return response.data;

};









// ----------------------------
// Sort Sales
// ----------------------------


export const sortSales = async (

  sort_by:string = "sale_date",

  order:string = "desc"

)=>{


  const response = await api.get(

    "/sales/sort",

    {

      params:{

        sort_by,

        order,

      },

    }

  );


  return response.data;

};









// ----------------------------
// Dashboard Summary
// ----------------------------


export const getSalesDashboard = async ()=>{


  const response = await api.get(

    "/sales/dashboard"

  );


  return response.data;

};









// ----------------------------
// Low Stock
// ----------------------------


export const getLowStockProducts = async (

  threshold:number = 5

)=>{


  const response = await api.get(

    "/sales/low-stock",

    {

      params:{

        threshold,

      },

    }

  );


  return response.data;

};









// ----------------------------
// Out Of Stock
// ----------------------------


export const getOutOfStockProducts = async ()=>{


  const response = await api.get(

    "/sales/out-of-stock"

  );


  return response.data;

};









// ----------------------------
// Remaining Stock
// ----------------------------


export const getRemainingStock = async (

  productId:number

)=>{


  const response = await api.get(

    `/sales/remaining-stock/${productId}`

  );


  return response.data;

};