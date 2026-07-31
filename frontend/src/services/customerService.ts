import api from "../api/axios";


// ===============================
// CUSTOMER TYPES
// ===============================

export interface Customer {

  id?: number;

  customer_id?: string;

  full_name:string;

  email?:string;

  phone_number?:string;

  date_of_birth?:string;

  gender?:string;

  address?:string;

  city?:string;

  state?:string;

  country?:string;

  postal_code?:string;

  customer_type?:string;

  preferred_sales_channel?:string;

  customer_segment?:string;

  status?:string;

  total_orders?:number;

  total_quantity_purchased?:number;

  lifetime_revenue?:number;

  average_order_value?:number;

  purchase_frequency?:number;

  favorite_product?:string;

  favorite_category?:string;

  is_vip?:boolean;

}



// ===============================
// CREATE CUSTOMER
// ===============================


export const createCustomer =
async(
data:Customer
)=>{


const response =
await api.post(
"/customers/",
data
);


return response.data;


};





// ===============================
// GET CUSTOMERS
// ===============================


export const getCustomers =
async()=>{


const response =
await api.get(
"/customers/"
);


return response.data;


};





// ===============================
// GET SINGLE CUSTOMER
// ===============================


export const getCustomer =
async(
customerId:string|number
)=>{


const response =
await api.get(
`/customers/${customerId}`
);


return response.data;


};





// ===============================
// SEARCH CUSTOMERS
// ===============================


export const searchCustomers = async (keyword: string) => {
  const response = await api.get("/customers/search", {
    params: {
      query: keyword,
    },
  });

  console.log(response.data);

  return response.data;
};



// ===============================
// FILTER CUSTOMERS
// ===============================


export const filterCustomers =
async(
filters:any
)=>{


const response =
await api.get(
"/customers/filter",
{

params:{

...filters

}

}

);


return response.data;


};





// ===============================
// SORT CUSTOMERS
// ===============================


export const sortCustomers =
async(
sortBy:string,
order:string="desc"
)=>{


const response =
await api.get(
"/customers/filter",
{

params:{

sort_by:sortBy,

order:order

}

}

);


return response.data;


};



// ===============================
// UPDATE CUSTOMER
// ===============================


export const updateCustomer =
async(
customerId:string|number,
data:Partial<Customer>
)=>{


const response =
await api.put(
`/customers/${customerId}`,
data
);


return response.data;


};





// ===============================
// DELETE CUSTOMER
// ===============================


export const deleteCustomer =
async(
customerId:string|number
)=>{


const response =
await api.delete(
`/customers/${customerId}`
);


return response.data;


};





// ===============================
// ACTIVATE CUSTOMER
// ===============================


export const activateCustomer =
async(
customerId:string|number
)=>{


const response =
await api.patch(
`/customers/${customerId}/activate`
);


return response.data;


};





// ===============================
// DEACTIVATE CUSTOMER
// ===============================


export const deactivateCustomer =
async(
customerId:string|number
)=>{


const response =
await api.patch(
`/customers/${customerId}/deactivate`
);


return response.data;


};





// ===============================
// CUSTOMER PROFILE
// ===============================


export const getCustomerProfile =
async(
customerId:string|number
)=>{


const response =
await api.get(
`/customers/${customerId}/profile`
);


return response.data;


};





// ===============================
// CUSTOMER TIMELINE
// ===============================


export const getCustomerTimeline =
async(
customerId:string|number
)=>{


const response =
await api.get(
`/customers/${customerId}/timeline`
);


return response.data;


};





// ===============================
// RECENT TRANSACTIONS
// ===============================


export const getRecentTransactions =
async(
customerId:string|number
)=>{


const response =
await api.get(
`/customers/${customerId}/transactions`
);


return response.data;


};






// ===============================
// CUSTOMER DASHBOARD
// ===============================

export const getCustomerDashboard =
async()=>{


const response =
await api.get(
"/customers/analytics/dashboard"
);


return response.data;


};




// ===============================
// CUSTOMER ANALYTICS
// ===============================

export const getCustomerAnalytics =
async()=>{


const response =
await api.get(
"/customers/analytics"
);


return response.data;


};


// ===============================
// EXPORT CSV
// ===============================


export const exportCustomersCSV =
async()=>{


const response =
await api.get(
"/customers/export/csv",
{

responseType:"blob"

}

);


return response.data;


};





// ===============================
// EXPORT PDF
// ===============================


export const exportCustomersPDF =
async()=>{


const response =
await api.get(
"/customers/export/pdf",
{

responseType:"blob"

}

);


return response.data;


};





// ===============================
// EXPORT ANALYTICS PDF
// ===============================


export const exportCustomerAnalyticsPDF =
async()=>{


const response =
await api.get(
"/customers/export/analytics/pdf",
{

responseType:"blob"

}

);


return response.data;


};



// ===============================
// TOP CUSTOMERS CSV
// ===============================


export const exportTopCustomersCSV =
async()=>{


const response =
await api.get(
"/customers/export/top-customers/csv",
{

responseType:"blob"

}

);


return response.data;


};





// ===============================
// TOP CUSTOMERS PDF
// ===============================


export const exportTopCustomersPDF =
async()=>{


const response =
await api.get(
"/customers/export/top-customers/pdf",
{

responseType:"blob"

}

);


return response.data;


};





// ===============================
// DOWNLOAD FILE HELPER
// ===============================


export const downloadFile =
(
blob:any,
filename:string
)=>{


const url =
window.URL.createObjectURL(
blob
);



const link =
document.createElement(
"a"
);



link.href=url;



link.download=filename;



document.body.appendChild(
link
);



link.click();



document.body.removeChild(
link
);



window.URL.revokeObjectURL(
url
);


};





// ===============================
// CUSTOMER REVENUE CONTRIBUTION
// ===============================


export const getCustomerRevenueContribution =
async()=>{


const response =
await api.get(
"/customers/analytics/revenue-contribution"
);


return response.data;


};





// ===============================
// NEW VS RETURNING CUSTOMERS
// ===============================


export const getNewVsReturningCustomers =
async()=>{


const response =
await api.get(
"/customers/analytics/new-vs-returning"
);


return response.data;


};





// ===============================
// RECENT CUSTOMER ACTIVITY
// ===============================


export const getRecentCustomerActivity =
async()=>{


const response =
await api.get(
"/customers/activity/recent"
);


return response.data;


};


// ===============================
// TOP CUSTOMERS
// ===============================

export const getTopCustomers =
async()=>{

  const response =
  await api.get(
    "/customers/analytics/top-customers"
  );

  return response.data;

};




// ===============================
// CUSTOMER GROWTH TREND
// ===============================

export const getCustomerGrowthTrend =
async()=>{

  const response =
  await api.get(
    "/customers/analytics/growth-trend"
  );

  return response.data;

};




// ===============================
// CUSTOMER SPENDING DISTRIBUTION
// ===============================

export const getCustomerSpendingDistribution =
async()=>{

  const response =
  await api.get(
    "/customers/analytics/spending-distribution"
  );

  return response.data;

};