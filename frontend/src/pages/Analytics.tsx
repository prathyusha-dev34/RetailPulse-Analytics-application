import {
  useEffect,
  useState,
} from "react";


import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";


import {
  Download,
  Refresh,
  Visibility,
} from "@mui/icons-material";


import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";


import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";


import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";


import {
  getDashboard,
  getRevenueTrend,
  getSalesTrend,
  getTopProducts,
  getTopCategories,
  getPaymentMethods,
  getSalesChannels,
  getInventoryDistribution,
  getStockStatus,
  getInventoryValue,
  getLowStock,
  getOutOfStock,
} from "../api/analyticsApi";




// =====================================================
// INTERFACES
// =====================================================


interface DashboardData {

  total_revenue:number;

  total_orders:number;

  total_products_sold:number;

  average_order_value:number;

  total_inventory_value:number;

  low_stock_products:number;

  out_of_stock_products:number;

  total_categories:number;

}




interface AnalyticsFilters {

  from_date:string;

  to_date:string;

  product:string;

  category:string;

  brand:string;

  sales_channel:string;

  payment_method:string;

}




// =====================================================
// CONSTANTS
// =====================================================


const AUTO_REFRESH_INTERVAL = 30000;



const COLORS = [

  "#22C55E",
  "#60A5FA",
  "#F59E0B",
  "#EC4899",
  "#8B5CF6",
  "#14B8A6",
  "#F97316",

];





// =====================================================
// COMPONENT
// =====================================================


export default function Analytics(){



// =====================================================
// STATES
// =====================================================



const [dashboard,setDashboard] =
useState<DashboardData>({

  total_revenue:0,

  total_orders:0,

  total_products_sold:0,

  average_order_value:0,

  total_inventory_value:0,

  low_stock_products:0,

  out_of_stock_products:0,

  total_categories:0,

});





const [filters,setFilters] =
useState<AnalyticsFilters>({

  from_date:"",

  to_date:"",

  product:"",

  category:"",

  brand:"",

  sales_channel:"",

  payment_method:"",

});





const [revenueTrend,setRevenueTrend] =
useState<any[]>([]);



const [salesTrend,setSalesTrend] =
useState<any[]>([]);



const [topProducts,setTopProducts] =
useState<any[]>([]);



const [topCategories,setTopCategories] =
useState<any[]>([]);



const [paymentMethods,setPaymentMethods] =
useState<any[]>([]);



const [salesChannels,setSalesChannels] =
useState<any[]>([]);



const [inventoryDistribution,setInventoryDistribution] =
useState<any[]>([]);



const [stockStatus,setStockStatus] =
useState<any[]>([]);



const [inventoryValue,setInventoryValue] =
useState<any[]>([]);



const [lowStock,setLowStock] =
useState<any[]>([]);



const [outOfStock,setOutOfStock] =
useState<any[]>([]);





const [loading,setLoading] =
useState(false);



const [error,setError] =
useState("");



const [autoRefresh,setAutoRefresh] =
useState(true);





// =====================================================
// DRILL DOWN STATES
// =====================================================


const [drillOpen,setDrillOpen] =
useState(false);



const [drillTitle,setDrillTitle] =
useState("");



const [drillData,setDrillData] =
useState<any[]>([]);


  
// =====================================================
// FORMAT HELPERS
// =====================================================


const formatCurrency = (
  value:number
)=>{

  return `₹${Number(value || 0)
    .toLocaleString(
      "en-IN",
      {
        minimumFractionDigits:2,
        maximumFractionDigits:2,
      }
    )}`;

};





const formatCurrencyPDF = (
  value:number
)=>{

  return `Rs. ${Number(value || 0)
    .toLocaleString(
      "en-IN",
      {
        minimumFractionDigits:2,
        maximumFractionDigits:2,
      }
    )}`;

};






// =====================================================
// FILTER HANDLER
// =====================================================


const handleFilterChange = (
  event:any
)=>{


  const {
    name,
    value,
  } = event.target;



  setFilters(prev=>({

    ...prev,

    [name]:value,

  }));

};







// =====================================================
// CLEAR FILTERS
// =====================================================


const clearFilters = ()=>{


  setFilters({

    from_date:"",

    to_date:"",

    product:"",

    category:"",

    brand:"",

    sales_channel:"",

    payment_method:"",

  });


};







// =====================================================
// DRILL DOWN
// =====================================================


const openDrillDown = (
  title:string,
  data:any[]
)=>{


  setDrillTitle(title);

  setDrillData(data);

  setDrillOpen(true);


};





const closeDrillDown = ()=>{

  setDrillOpen(false);

};







// =====================================================
// REFRESH BUTTON
// =====================================================


const refreshDashboard = ()=>{

  loadAnalytics();

};








// =====================================================
// LOAD ANALYTICS DATA
// =====================================================


const loadAnalytics = async ()=>{


try{


  setLoading(true);

  setError("");




  const [

    dashboardRes,

    revenueRes,

    salesRes,

    productsRes,

    categoriesRes,

    paymentRes,

    channelRes,

    inventoryRes,

    stockRes,

    valueRes,

    lowRes,

    outRes,


  ] = await Promise.all([



    getDashboard(filters),


    getRevenueTrend(filters),


    getSalesTrend(filters),


    getTopProducts(filters),


    getTopCategories(filters),


    getPaymentMethods(filters),


    getSalesChannels(filters),


    getInventoryDistribution(filters),


    getStockStatus(filters),


    getInventoryValue(filters),


    getLowStock(filters),


    getOutOfStock(filters),



  ]);






// =====================================================
// SET RESPONSE DATA
// =====================================================



setDashboard(

  dashboardRes.data?.data ??

  dashboardRes.data ??

  {}

);





setRevenueTrend(

  revenueRes.data?.data ??

  revenueRes.data ??

  []

);





setSalesTrend(

  salesRes.data?.data ??

  salesRes.data ??

  []

);





setTopProducts(

  productsRes.data?.data ??

  productsRes.data ??

  []

);





setTopCategories(

  categoriesRes.data?.data ??

  categoriesRes.data ??

  []

);





setPaymentMethods(

  paymentRes.data?.data ??

  paymentRes.data ??

  []

);





setSalesChannels(

  channelRes.data?.data ??

  channelRes.data ??

  []

);





setInventoryDistribution(

  inventoryRes.data?.data ??

  inventoryRes.data ??

  []

);





setStockStatus(

  stockRes.data?.data ??

  stockRes.data ??

  []

);





setInventoryValue(

  valueRes.data?.data ??

  valueRes.data ??

  []

);





setLowStock(

  lowRes.data?.data ??

  lowRes.data ??

  []

);





setOutOfStock(

  outRes.data?.data ??

  outRes.data ??

  []

);





}


catch(error){


  console.error(
    "Analytics Error:",
    error
  );


  setError(
    "Failed to load analytics dashboard"
  );


}


finally{


  setLoading(false);


}



};









// =====================================================
// INITIAL LOAD
// =====================================================


useEffect(()=>{


  loadAnalytics();


},[]);








// =====================================================
// FILTER CHANGE REFRESH
// =====================================================


useEffect(()=>{


  loadAnalytics();


},[

  filters.from_date,

  filters.to_date,

  filters.product,

  filters.category,

  filters.brand,

  filters.sales_channel,

  filters.payment_method,


]);









// =====================================================
// AUTO REFRESH
// =====================================================


useEffect(()=>{


  if(!autoRefresh)

    return;




  const timer = setInterval(()=>{


    loadAnalytics();


  },AUTO_REFRESH_INTERVAL);





  return ()=>{


    clearInterval(timer);


  };



},[

  autoRefresh,

  filters,


]);




// =====================================================
// EXPORT CSV
// =====================================================


const exportCSV = ()=>{


const rows = [


[
"Metric",
"Value"
],


[
"Total Revenue",
formatCurrencyPDF(
dashboard.total_revenue
)
],


[
"Total Orders",
dashboard.total_orders
],


[
"Products Sold",
dashboard.total_products_sold
],


[
"Average Order Value",
formatCurrencyPDF(
dashboard.average_order_value
)
],


[
"Inventory Value",
formatCurrencyPDF(
dashboard.total_inventory_value
)
],


[
"Low Stock Products",
dashboard.low_stock_products
],


[
"Out Of Stock Products",
dashboard.out_of_stock_products
],


[
"Total Categories",
dashboard.total_categories
],


];




const csvContent = rows
.map(
(row)=>
row
.map(
(item)=>`"${item}"`
)
.join(",")
)
.join("\n");





const blob = new Blob(

[
csvContent
],

{
type:"text/csv;charset=utf-8;"
}

);





const url =
URL.createObjectURL(blob);




const link =
document.createElement("a");



link.href = url;



link.download =
"Retail_Analytics_Report.csv";



document.body.appendChild(link);



link.click();



document.body.removeChild(link);



URL.revokeObjectURL(url);



};








// =====================================================
// EXPORT PDF
// =====================================================


const exportPDF = ()=>{


const doc = new jsPDF();




doc.setFontSize(18);



doc.text(

"Retail Analytics Dashboard",

14,

18

);





autoTable(doc,{


startY:30,


head:[

[
"Metric",
"Value"
]

],



body:[



[
"Total Revenue",
formatCurrencyPDF(
dashboard.total_revenue
)
],



[
"Total Orders",
dashboard.total_orders
],



[
"Products Sold",
dashboard.total_products_sold
],



[
"Average Order Value",
formatCurrencyPDF(
dashboard.average_order_value
)
],



[
"Inventory Value",
formatCurrencyPDF(
dashboard.total_inventory_value
)
],



[
"Low Stock Products",
dashboard.low_stock_products
],



[
"Out Of Stock Products",
dashboard.out_of_stock_products
],



[
"Total Categories",
dashboard.total_categories
],



],



theme:"grid",



});





doc.save(

"Retail_Analytics_Dashboard.pdf"

);



};









// =====================================================
// RETURN JSX START
// =====================================================



return (



<Box

sx={{

display:"flex",

minHeight:"100vh",

bgcolor:"#0F172A",

}}

>



{/* SIDEBAR */}


<Sidebar />






<Box

component="main"

sx={{

flexGrow:1,

ml:"80px",

}}

>





{/* TOPBAR */}


<Topbar />








<Container

maxWidth="xl"

sx={{

mt:10,

pb:5,

}}

>








{/* ERROR MESSAGE */}



{

error &&

(


<Alert

severity="error"

sx={{

mb:3

}}

>

{error}


</Alert>


)


}








{/* PAGE HEADER */}



<Stack

direction="row"

justifyContent="space-between"

alignItems="center"

flexWrap="wrap"

gap={2}

mb={4}

>





<Box>


<Typography

variant="h4"

fontWeight={800}

color="white"

>


Retail Analytics Dashboard


</Typography>






<Typography
variant="subtitle1"
sx={{
  color:"rgba(255,255,255,0.65)",
  mt:1,
  fontWeight:500,
}}
>
  Business Insights & KPI Dashboard
</Typography>

</Box>







<Stack

direction="row"

spacing={2}

>




<Button

variant="contained"

startIcon={<Download />}

onClick={exportCSV}

>


Export CSV


</Button>








<Button

variant="contained"

color="success"

startIcon={<Download />}

onClick={exportPDF}

>


Export PDF


</Button>









<Button

variant="outlined"

startIcon={<Refresh />}

onClick={refreshDashboard}

>


Refresh


</Button>





</Stack>






</Stack>



// =====================================================
// FILTER SECTION
// =====================================================


<Paper

sx={{

p:3,

mb:4,

bgcolor:"#1E293B",

borderRadius:3,

}}

>



<Typography

variant="h6"

fontWeight={700}

color="white"

mb={3}

>

Dashboard Filters

</Typography>





<Grid

container

spacing={2}

>






{/* FROM DATE */}



<Grid

size={{

xs:12,

md:2,

}}

>



<TextField

fullWidth

type="date"

label="From Date"

name="from_date"

value={filters.from_date}

onChange={handleFilterChange}

InputLabelProps={{

shrink:true,

}}


/>



</Grid>








{/* TO DATE */}



<Grid

size={{

xs:12,

md:2,

}}

>



<TextField

fullWidth

type="date"

label="To Date"

name="to_date"

value={filters.to_date}

onChange={handleFilterChange}

InputLabelProps={{

shrink:true,

}}


/>



</Grid>










{/* PRODUCT */}



<Grid

size={{

xs:12,

md:2,

}}

>



<TextField

fullWidth

label="Product"

name="product"

value={filters.product}

onChange={handleFilterChange}

/>



</Grid>









{/* CATEGORY */}



<Grid

size={{

xs:12,

md:2,

}}

>



<TextField

fullWidth

label="Category"

name="category"

value={filters.category}

onChange={handleFilterChange}

/>



</Grid>









{/* BRAND */}



<Grid

size={{

xs:12,

md:2,

}}

>



<TextField

fullWidth

label="Brand"

name="brand"

value={filters.brand}

onChange={handleFilterChange}

/>



</Grid>









{/* SALES CHANNEL */}



<Grid

size={{

xs:12,

md:2,

}}

>



<FormControl fullWidth>



<InputLabel>

Sales Channel

</InputLabel>





<Select

label="Sales Channel"

name="sales_channel"

value={filters.sales_channel}

onChange={handleFilterChange}

>



<MenuItem value="">

All

</MenuItem>





<MenuItem value="Retail Store">

Retail Store

</MenuItem>





<MenuItem value="Online Store">

Online Store

</MenuItem>





<MenuItem value="Marketplace">

Marketplace

</MenuItem>





</Select>



</FormControl>



</Grid>









{/* PAYMENT METHOD */}



<Grid

size={{

xs:12,

md:3,

}}

>



<FormControl fullWidth>



<InputLabel>

Payment Method

</InputLabel>





<Select

label="Payment Method"

name="payment_method"

value={filters.payment_method}

onChange={handleFilterChange}

>



<MenuItem value="">

All

</MenuItem>





<MenuItem value="Cash">

Cash

</MenuItem>





<MenuItem value="Card">

Card

</MenuItem>





<MenuItem value="UPI">

UPI

</MenuItem>





<MenuItem value="Bank Transfer">

Bank Transfer

</MenuItem>





</Select>



</FormControl>



</Grid>









{/* CLEAR FILTER */}



<Grid

size={{

xs:12,

md:3,

}}

>



<Button

fullWidth

variant="outlined"

color="warning"

onClick={clearFilters}

sx={{

height:"56px"

}}

>


Clear Filters


</Button>



</Grid>







</Grid>



</Paper>



// =====================================================
// KPI CARDS
// =====================================================


<Grid

container

spacing={3}

mb={4}

>



{

[


{

title:"Total Revenue",

value:formatCurrency(

dashboard.total_revenue

),

},



{

title:"Total Orders",

value:dashboard.total_orders,

},



{

title:"Products Sold",

value:dashboard.total_products_sold,

},



{

title:"Average Order Value",

value:formatCurrency(

dashboard.average_order_value

),

},



{

title:"Inventory Value",

value:formatCurrency(

dashboard.total_inventory_value

),

},



{

title:"Low Stock Products",

value:dashboard.low_stock_products,

},



{

title:"Out Of Stock Products",

value:dashboard.out_of_stock_products,

},



{

title:"Total Categories",

value:dashboard.total_categories,

},



]

.map(

(item,index)=>(


<Grid

key={index}

size={{

xs:12,

sm:6,

md:3,

}}

>



<Card

onClick={()=>


openDrillDown(

item.title,

[item]

)


}

sx={{


cursor:"pointer",

background:

"linear-gradient(135deg,#1E293B,#334155)",

borderRadius:3,

color:"white",


"&:hover":{

transform:"translateY(-5px)",

boxShadow:8,

},


}}


>



<CardContent>




<Typography

color="#CBD5E1"

fontWeight={700}

>


{item.title}


</Typography>





<Typography

variant="h4"

mt={2}

fontWeight={800}

>


{item.value}


</Typography>






<Button

size="small"

startIcon={<Visibility />}

sx={{

mt:2,

color:"#CBD5E1"

}}


>


View Details


</Button>




</CardContent>




</Card>



</Grid>


)


)


}



</Grid>









// =====================================================
// LOADING OVERLAY
// =====================================================



{

loading &&

(


<Box

sx={{


position:"fixed",

top:0,

left:0,

right:0,

bottom:0,

display:"flex",

alignItems:"center",

justifyContent:"center",

background:"rgba(15,23,42,0.6)",

zIndex:9999,


}}

>



<CircularProgress />



</Box>


)

}









// =====================================================
// SALES TREND SECTION
// =====================================================



<Grid

container

spacing={3}

mb={4}

>









{/* REVENUE TREND */}



<Grid

size={{

xs:12,

md:6,

}}

>



<Paper

sx={{


p:3,

bgcolor:"#1E293B",

borderRadius:3,

color:"white",

height:380,


}}



>



<Stack

direction="row"

justifyContent="space-between"

alignItems="center"

mb={2}

>



<Typography

variant="h6"

fontWeight={700}

>


Revenue Trend


</Typography>





<Button

size="small"

startIcon={<Visibility />}

onClick={()=>


openDrillDown(

"Revenue Trend",

revenueTrend

)


}

>


View


</Button>





</Stack>








{

revenueTrend.length===0 ?


(


<Box

height="85%"

display="flex"

alignItems="center"

justifyContent="center"

>



<Typography

color="#94A3B8"

>


No revenue data available


</Typography>



</Box>



)



:

(



<ResponsiveContainer

width="100%"

height="85%"

>



<LineChart

data={revenueTrend}

>



<CartesianGrid

strokeDasharray="3 3"

/>




<XAxis

dataKey="date"

stroke="#CBD5E1"

/>





<YAxis

stroke="#CBD5E1"

/>





<Tooltip />






<Line

type="monotone"

dataKey="revenue"

stroke="#22C55E"

strokeWidth={3}

/>





</LineChart>





</ResponsiveContainer>



)


}



</Paper>



</Grid>









{/* SALES TREND */}



<Grid

size={{

xs:12,

md:6,

}}



>



<Paper

sx={{


p:3,

bgcolor:"#1E293B",

borderRadius:3,

color:"white",

height:380,


}}



>



<Stack

direction="row"

justifyContent="space-between"

alignItems="center"

mb={2}

>



<Typography

variant="h6"

fontWeight={700}

>


Sales Trend


</Typography>





<Button

size="small"

startIcon={<Visibility />}

onClick={()=>


openDrillDown(

"Sales Trend",

salesTrend

)


}

>


View


</Button>




</Stack>








{

salesTrend.length===0 ?


(


<Box

height="85%"

display="flex"

alignItems="center"

justifyContent="center"

>



<Typography

color="#94A3B8"

>


No sales data available


</Typography>



</Box>



)



:

(



<ResponsiveContainer

width="100%"

height="85%"

>



<LineChart

data={salesTrend}

>



<CartesianGrid

strokeDasharray="3 3"

/>





<XAxis

dataKey="date"

stroke="#CBD5E1"

/>





<YAxis

stroke="#CBD5E1"

/>





<Tooltip />







<Line

type="monotone"

dataKey="sales"

stroke="#60A5FA"

strokeWidth={3}

/>






</LineChart>





</ResponsiveContainer>



)


}



</Paper>



</Grid>







</Grid>



// =====================================================
// TOP PRODUCTS + TOP CATEGORIES
// =====================================================


<Grid

container

spacing={3}

mb={4}

>





{/* TOP SELLING PRODUCTS */}



<Grid

size={{

xs:12,

md:6,

}}

>



<Paper

sx={{


p:3,

bgcolor:"#1E293B",

borderRadius:3,

color:"white",

height:420,


}}



>



<Stack

direction="row"

justifyContent="space-between"

alignItems="center"

mb={2}

>



<Typography

variant="h6"

fontWeight={700}

>


Top Selling Products


</Typography>





<Button

size="small"

startIcon={<Visibility />}

onClick={()=>


openDrillDown(

"Top Products",

topProducts

)


}

>


View


</Button>





</Stack>








{

topProducts.length===0 ?


(


<Box

height="85%"

display="flex"

alignItems="center"

justifyContent="center"

>



<Typography

color="#94A3B8"

>


No product data available


</Typography>



</Box>



)



:


(



<ResponsiveContainer

width="100%"

height="85%"

>



<BarChart

data={topProducts}

layout="vertical"

>



<CartesianGrid

strokeDasharray="3 3"

/>





<XAxis

type="number"

stroke="#CBD5E1"

/>





<YAxis

type="category"

dataKey="product_name"

width={140}

stroke="#CBD5E1"

/>





<Tooltip />





<Bar

dataKey="quantity"

fill="#F59E0B"

/>





</BarChart>





</ResponsiveContainer>



)


}



</Paper>



</Grid>










{/* TOP CATEGORIES */}



<Grid

size={{

xs:12,

md:6,

}}

>



<Paper

sx={{


p:3,

bgcolor:"#1E293B",

borderRadius:3,

color:"white",

height:420,


}}



>



<Stack

direction="row"

justifyContent="space-between"

alignItems="center"

mb={2}

>



<Typography

variant="h6"

fontWeight={700}

>


Top Performing Categories


</Typography>






<Button

size="small"

startIcon={<Visibility />}

onClick={()=>


openDrillDown(

"Top Categories",

topCategories

)


}

>


View


</Button>





</Stack>








{

topCategories.length===0 ?


(


<Box

height="85%"

display="flex"

alignItems="center"

justifyContent="center"

>



<Typography

color="#94A3B8"

>


No category data available


</Typography>



</Box>



)



:


(



<ResponsiveContainer

width="100%"

height="85%"

>



<BarChart

data={topCategories}

>



<CartesianGrid

strokeDasharray="3 3"

/>





<XAxis

dataKey="category_name"

stroke="#CBD5E1"

/>





<YAxis

stroke="#CBD5E1"

/>





<Tooltip />





<Bar

dataKey="revenue"

fill="#22C55E"

/>





</BarChart>





</ResponsiveContainer>



)


}



</Paper>



</Grid>







</Grid>









// =====================================================
// PAYMENT METHOD + SALES CHANNEL
// =====================================================


<Grid

container

spacing={3}

mb={4}

>









{/* PAYMENT METHODS */}



<Grid

size={{

xs:12,

md:6,

}}

>



<Paper

sx={{


p:3,

bgcolor:"#1E293B",

borderRadius:3,

color:"white",

height:380,


}}



>



<Stack

direction="row"

justifyContent="space-between"

alignItems="center"

mb={2}

>



<Typography

variant="h6"

fontWeight={700}

>


Sales By Payment Method


</Typography>






<Button

size="small"

startIcon={<Visibility />}

onClick={()=>


openDrillDown(

"Payment Methods",

paymentMethods

)


}

>


View


</Button>




</Stack>








{

paymentMethods.length===0 ?


(


<Box

height="85%"

display="flex"

alignItems="center"

justifyContent="center"

>



<Typography

color="#94A3B8"

>


No payment data available


</Typography>



</Box>



)



:


(



<ResponsiveContainer

width="100%"

height="85%"

>



<PieChart>




<Pie

data={paymentMethods}

dataKey="amount"

nameKey="method"

outerRadius={120}

label

>



{

paymentMethods.map(

(_,index)=>(


<Cell

key={index}

fill={COLORS[index % COLORS.length]}

/>


)


)



}



</Pie>






<Tooltip />



<Legend />





</PieChart>





</ResponsiveContainer>



)


}



</Paper>



</Grid>









{/* SALES CHANNEL */}



<Grid

size={{

xs:12,

md:6,

}}

>



<Paper

sx={{


p:3,

bgcolor:"#1E293B",

borderRadius:3,

color:"white",

height:380,


}}



>



<Stack

direction="row"

justifyContent="space-between"

alignItems="center"

mb={2}

>



<Typography

variant="h6"

fontWeight={700}

>


Sales By Sales Channel


</Typography>






<Button

size="small"

startIcon={<Visibility />}

onClick={()=>


openDrillDown(

"Sales Channel",

salesChannels

)


}

>


View


</Button>




</Stack>








{

salesChannels.length===0 ?


(


<Box

height="85%"

display="flex"

alignItems="center"

justifyContent="center"

>



<Typography

color="#94A3B8"

>


No channel data available


</Typography>



</Box>



)



:


(



<ResponsiveContainer

width="100%"

height="85%"

>



<BarChart

data={salesChannels}

>



<CartesianGrid

strokeDasharray="3 3"

/>





<XAxis

dataKey="channel"

stroke="#CBD5E1"

/>





<YAxis

stroke="#CBD5E1"

/>





<Tooltip />





<Bar

dataKey="revenue"

fill="#60A5FA"

/>





</BarChart>





</ResponsiveContainer>



)


}



</Paper>



</Grid>








</Grid>



// =====================================================
// INVENTORY ANALYTICS
// =====================================================


<Grid

container

spacing={3}

mb={4}

>





{/* INVENTORY DISTRIBUTION */}



<Grid

size={{

xs:12,

md:6,

}}

>



<Paper

sx={{


p:3,

bgcolor:"#1E293B",

borderRadius:3,

color:"white",

height:380,


}}



>



<Stack

direction="row"

justifyContent="space-between"

alignItems="center"

mb={2}

>



<Typography

variant="h6"

fontWeight={700}

>


Inventory Distribution By Category


</Typography>






<Button

size="small"

startIcon={<Visibility />}

onClick={()=>


openDrillDown(

"Inventory Distribution",

inventoryDistribution

)


}

>


View


</Button>




</Stack>








{

inventoryDistribution.length===0 ?


(


<Box

height="85%"

display="flex"

alignItems="center"

justifyContent="center"

>



<Typography

color="#94A3B8"

>


No inventory data available


</Typography>



</Box>



)



:


(



<ResponsiveContainer

width="100%"

height="85%"

>



<BarChart

data={inventoryDistribution}

>



<CartesianGrid

strokeDasharray="3 3"

/>





<XAxis

dataKey="category_name"

stroke="#CBD5E1"

/>





<YAxis

stroke="#CBD5E1"

/>





<Tooltip />





<Bar

dataKey="quantity"

fill="#14B8A6"

/>





</BarChart>





</ResponsiveContainer>



)


}



</Paper>



</Grid>









{/* STOCK STATUS */}



<Grid

size={{

xs:12,

md:6,

}}

>



<Paper

sx={{


p:3,

bgcolor:"#1E293B",

borderRadius:3,

color:"white",

height:380,


}}



>



<Stack

direction="row"

justifyContent="space-between"

alignItems="center"

mb={2}

>



<Typography

variant="h6"

fontWeight={700}

>


Stock Status Summary


</Typography>






<Button

size="small"

startIcon={<Visibility />}

onClick={()=>


openDrillDown(

"Stock Status",

stockStatus

)


}

>


View


</Button>




</Stack>








{

stockStatus.length===0 ?


(


<Box

height="85%"

display="flex"

alignItems="center"

justifyContent="center"

>



<Typography

color="#94A3B8"

>


No stock data available


</Typography>



</Box>



)



:


(



<ResponsiveContainer

width="100%"

height="85%"

>



<PieChart>




<Pie

data={stockStatus}

dataKey="count"

nameKey="status"

outerRadius={120}

label

>



{

stockStatus.map(

(_,index)=>(


<Cell

key={index}

fill={COLORS[index % COLORS.length]}

/>


)


)



}



</Pie>





<Tooltip />



<Legend />





</PieChart>





</ResponsiveContainer>



)


}



</Paper>



</Grid>








</Grid>








{/* =====================================================
    INVENTORY VALUE BY CATEGORY
===================================================== */}


<Grid

container

spacing={3}

mb={4}

>



<Grid

size={{

xs:12,

md:12,

}}

>



<Paper

sx={{


p:3,

bgcolor:"#1E293B",

borderRadius:3,

color:"white",

height:400,


}}



>



<Stack

direction="row"

justifyContent="space-between"

mb={2}

>



<Typography

variant="h6"

fontWeight={700}

>


Inventory Value By Category


</Typography>





<Button

size="small"

startIcon={<Visibility />}

onClick={()=>


openDrillDown(

"Inventory Value",

inventoryValue

)


}

>


View


</Button>




</Stack>








{

inventoryValue.length===0 ?


(


<Box

height="85%"

display="flex"

alignItems="center"

justifyContent="center"

>



<Typography

color="#94A3B8"

>


No inventory value data available


</Typography>



</Box>



)



:


(



<ResponsiveContainer

width="100%"

height="85%"

>



<BarChart

data={inventoryValue}

>



<CartesianGrid

strokeDasharray="3 3"

/>





<XAxis

dataKey="category_name"

stroke="#CBD5E1"

/>





<YAxis

stroke="#CBD5E1"

/>





<Tooltip />





<Bar

dataKey="value"

fill="#8B5CF6"

/>





</BarChart>





</ResponsiveContainer>



)


}



</Paper>



</Grid>



</Grid>








{/* =====================================================
    LOW STOCK PRODUCTS TABLE
===================================================== */}

<Paper

sx={{


p:3,

mb:4,

bgcolor:"#1E293B",

borderRadius:3,

color:"white",


}}



>



<Typography

variant="h6"

fontWeight={700}

mb={2}

>


Top Low Stock Products


</Typography>








{

lowStock.length===0 ?


(


<Typography

color="#94A3B8"

>


No low stock products available


</Typography>



)



:


(



<Table>




<TableHead>



<TableRow>




<TableCell sx={{color:"white"}}>

Product

</TableCell>





<TableCell sx={{color:"white"}}>

SKU

</TableCell>





<TableCell sx={{color:"white"}}>

Available Stock

</TableCell>





<TableCell sx={{color:"white"}}>

Reorder Level

</TableCell>





</TableRow>



</TableHead>






<TableBody>



{

lowStock.map(

(item,index)=>(


<TableRow

key={index}

>



<TableCell sx={{color:"white"}}>

{item.product_name}

</TableCell>





<TableCell sx={{color:"white"}}>

{item.sku}

</TableCell>





<TableCell sx={{color:"white"}}>

{item.available_stock}

</TableCell>





<TableCell sx={{color:"white"}}>

{item.reorder_level}

</TableCell>





</TableRow>



)


)



}



</TableBody>





</Table>



)



}



</Paper>








{/* =====================================================
    OUT OF STOCK PRODUCTS TABLE
===================================================== */}


<Paper

sx={{


p:3,

mb:4,

bgcolor:"#1E293B",

borderRadius:3,

color:"white",


}}



>



<Typography

variant="h6"

fontWeight={700}

mb={2}

>


Out Of Stock Products


</Typography>








{

outOfStock.length===0 ?


(


<Typography

color="#94A3B8"

>


No out of stock products available


</Typography>



)



:


(



<Table>




<TableHead>



<TableRow>




<TableCell sx={{color:"white"}}>

Product

</TableCell>





<TableCell sx={{color:"white"}}>

SKU

</TableCell>





<TableCell sx={{color:"white"}}>

Category

</TableCell>





</TableRow>



</TableHead>






<TableBody>



{

outOfStock.map(

(item,index)=>(


<TableRow

key={index}

>



<TableCell sx={{color:"white"}}>

{item.product_name}

</TableCell>





<TableCell sx={{color:"white"}}>

{item.sku}

</TableCell>





<TableCell sx={{color:"white"}}>

{item.category_name}

</TableCell>





</TableRow>



)


)



}



</TableBody>





</Table>



)



}



</Paper>

{/* =====================================================
    DRILL DOWN DIALOG
===================================================== */}

<Dialog

open={drillOpen}

onClose={closeDrillDown}

maxWidth="md"

fullWidth

>


<DialogTitle

sx={{
  bgcolor:"#1E293B",
  color:"white",
  fontWeight:700,
}}

>

{drillTitle}

</DialogTitle>



<DialogContent

sx={{
  bgcolor:"#0F172A",
}}

>


{
drillData.length === 0 ?

(
<Typography

color="#94A3B8"

mt={2}

>

No detailed records available

</Typography>
)


:

(


<Table

sx={{
  mt:2
}}

>


<TableHead>

<TableRow>


<TableCell sx={{color:"white"}}>

Field

</TableCell>


<TableCell sx={{color:"white"}}>

Value

</TableCell>


</TableRow>

</TableHead>



<TableBody>


{

Object.entries(

drillData[0] || {}

).map(

([key,value])=>(


<TableRow

key={key}

>


<TableCell

sx={{
color:"white"
}}

>

{key}

</TableCell>



<TableCell

sx={{
color:"white"
}}

>

{String(value)}

</TableCell>



</TableRow>


)

)


}


</TableBody>


</Table>


)


}


</DialogContent>





<DialogActions

sx={{
bgcolor:"#1E293B"
}}

>


<Button

onClick={closeDrillDown}

color="warning"

>

Close

</Button>


</DialogActions>



</Dialog>





</Container>


</Box>


</Box>


);

}