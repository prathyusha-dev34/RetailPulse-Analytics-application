import api from "./axios";


// =====================================================
// CLEAN EMPTY FILTER PARAMS
// =====================================================

const cleanParams = (
    params?: any
) => {

    if (!params) {
        return {};
    }


    const cleaned:any = {};


    Object.keys(params).forEach((key)=>{


        if(
            params[key] !== "" &&
            params[key] !== null &&
            params[key] !== undefined
        ){

            cleaned[key] = params[key];

        }


    });


    return cleaned;

};



// =====================================================
// DASHBOARD
// =====================================================


export const getDashboard =
(
    params?: any
) =>
    api.get(
        "/analytics/dashboard",
        {
            params: cleanParams(params)
        }
    );




// =====================================================
// SALES TRENDS
// =====================================================


export const getRevenueTrend =
(
    params?: any
) =>
    api.get(
        "/analytics/revenue-trend",
        {
            params: cleanParams(params)
        }
    );



export const getSalesTrend =
(
    params?: any
) =>
    api.get(
        "/analytics/sales-trend",
        {
            params: cleanParams(params)
        }
    );




// =====================================================
// PRODUCT ANALYTICS
// =====================================================


export const getTopProducts =
(
    params?: any
) =>
    api.get(
        "/analytics/top-products",
        {
            params: cleanParams(params)
        }
    );



export const getTopCategories =
(
    params?: any
) =>
    api.get(
        "/analytics/top-categories",
        {
            params: cleanParams(params)
        }
    );




// =====================================================
// SALES BREAKDOWN
// =====================================================


export const getPaymentMethods =
(
    params?: any
) =>
    api.get(
        "/analytics/payment-methods",
        {
            params: cleanParams(params)
        }
    );



export const getSalesChannels =
(
    params?: any
) =>
    api.get(
        "/analytics/sales-channels",
        {
            params: cleanParams(params)
        }
    );




// =====================================================
// INVENTORY ANALYTICS
// =====================================================


export const getInventoryDistribution =
(
    params?: any
) =>
    api.get(
        "/analytics/inventory-distribution",
        {
            params: cleanParams(params)
        }
    );



export const getStockStatus =
(
    params?: any
) =>
    api.get(
        "/analytics/stock-status",
        {
            params: cleanParams(params)
        }
    );



export const getInventoryValue =
(
    params?: any
) =>
    api.get(
        "/analytics/inventory-value",
        {
            params: cleanParams(params)
        }
    );




// =====================================================
// STOCK ALERTS
// =====================================================


export const getLowStock =
(
    params?: any
) =>
    api.get(
        "/analytics/low-stock",
        {
            params: cleanParams(params)
        }
    );



export const getOutOfStock =
(
    params?: any
) =>
    api.get(
        "/analytics/out-of-stock",
        {
            params: cleanParams(params)
        }
    );