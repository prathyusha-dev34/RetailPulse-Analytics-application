import {
  useEffect,
  useState,
} from "react";


import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Stack,
  Button,
  TextField,
  MenuItem,
  CircularProgress,
  Alert,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";


import {
  Search,
  Refresh,
  Download,
  Notifications,
  Assessment,
} from "@mui/icons-material";


import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";


// FIX: axios direct import removed
// Use project axios instance with interceptor
import api from "../api/axios";

interface ProductForecast {

  id:number;

  product_id:number;

  category_id:number;

  product_name:string;

  category_name:string;

  brand:string;

  current_stock:number;

  available_stock:number;

  reorder_level:number;

  historical_sales:number;

  predicted_demand:number;

  expected_growth_percentage:number;

  confidence_score:number;

  forecast_accuracy:number;

  forecast_period:string;

  recommendation:string;

  forecast_value:string;

}



interface CategoryForecast {

  id:number;

  category_name:string;

  historical_sales:number;

  predicted_demand:number;

  expected_growth_percentage:number;

  confidence_score:number;

  recommendation:string;

}



interface DashboardData {

  total_predicted_demand:number;

  products_expected_to_run_out:number;

  high_growth_products:number;

  slow_moving_products:number;

  forecast_accuracy:number;

  total_forecasts:number;

}



interface ForecastNotification {

  message:string;

  type:string;

}



// REMOVED:
// const API_URL = "http://127.0.0.1:8000";



const FORECAST_PERIODS = [

  {
    label:"Next 7 Days",
    value:"7_days",
  },

  {
    label:"Next 30 Days",
    value:"30_days",
  },

  {
    label:"Next 90 Days",
    value:"90_days",
  },

];



const COLORS = [

  "#38BDF8",
  "#22C55E",
  "#F59E0B",
  "#EF4444",
  "#A855F7",

];



const darkFieldStyle = {

  minWidth:180,


  "& .MuiInputLabel-root":{
    color:"#CBD5E1",
  },


  "& .MuiInputLabel-root.Mui-focused":{
    color:"#38BDF8",
  },


  "& .MuiOutlinedInput-root":{

    color:"#E2E8F0",


    "& fieldset":{
      borderColor:"#475569",
    },


    "&:hover fieldset":{
      borderColor:"#38BDF8",
    },


    "&.Mui-focused fieldset":{
      borderColor:"#38BDF8",
    },


  },


  "& .MuiSelect-select":{
    color:"#E2E8F0",
  },

};


export default function Forecast(){


const [loading,setLoading] =
useState(false);



const [generating,setGenerating] =
useState(false);



const [error,setError] =
useState("");





const [forecastPeriod,setForecastPeriod] =
useState("30_days");



const [startDate,setStartDate] =
useState("");



const [endDate,setEndDate] =
useState("");





const [searchText,setSearchText] =
useState("");



const [brand,setBrand] =
useState("");



const [category,setCategory] =
useState("");



const [sortBy,setSortBy] =
useState("");





const [dashboard,setDashboard] =
useState<DashboardData|null>(null);





const [products,setProducts] =
useState<ProductForecast[]>([]);



const [allProducts,setAllProducts] =
useState<ProductForecast[]>([]);





const [categories,setCategories] =
useState<CategoryForecast[]>([]);





const [productChartData,setProductChartData] =
useState<any[]>([]);



const [growthChartData,setGrowthChartData] =
useState<any[]>([]);



const [productTrendData,setProductTrendData] =
useState<any[]>([]);



const [topProductsData,setTopProductsData] =
useState<any[]>([]);



const [seasonalData,setSeasonalData] =
useState<any[]>([]);



const [categoryChartData,setCategoryChartData] =
useState<any[]>([]);





const [showNotifications,setShowNotifications] =
useState(false);



const [notifications,setNotifications] =
useState<ForecastNotification[]>([]);





// =====================================================
// LOAD FORECAST DATA
// =====================================================


const fetchForecastData = async()=>{


  try{


    setLoading(true);

    setError("");



    // FIX:
    // axios direct call removed
    // api interceptor automatically adds token


    const response = await api.get(
      "/forecast/analytics"
    );



    const data = response.data;



    setDashboard(
      data.dashboard ?? null
    );




    const productData:ProductForecast[] =
      data.product_forecasts ?? [];




    const categoryData:CategoryForecast[] =
      data.category_forecasts ?? [];





    setAllProducts(productData);

    setProducts(productData);

    setCategories(categoryData);





    setProductChartData(

      productData.map(

        (item)=>(

          {

            name:item.product_name,

            historical:
              Number(item.historical_sales) || 0,


            predicted:
              Number(item.predicted_demand) || 0,


          }

        )

      )

    );



    setGrowthChartData(

      productData.map(

        (item)=>(

          {

            name:item.product_name,


            growth:
              Number(
                item.expected_growth_percentage
              ) || 0,


          }

        )

      )

    );




        setProductTrendData(

      productData.map(

        (item)=>(

          {

            name:item.product_name,


            historical:
              Number(
                item.historical_sales
              ) || 0,



            forecast:
              Number(
                item.predicted_demand
              ) || 0,


          }

        )

      )

    );







    setTopProductsData(

      [...productData]

      .sort(

        (a,b)=>

        b.predicted_demand -

        a.predicted_demand

      )


      .slice(0,5)


      .map(

        (item)=>(

          {

            name:item.product_name,

            demand:
              item.predicted_demand,


          }

        )

      )

    );







    setSeasonalData(

      productData.map(

        (item)=>(

          {

            month:
              item.forecast_period,


            sales:
              item.historical_sales,


            forecast:
              item.predicted_demand,


          }

        )

      )

    );







    setCategoryChartData(

      categoryData.map(

        (item)=>(

          {

            name:
              item.category_name,


            demand:
              Number(
                item.predicted_demand
              ) || 0,


          }

        )

      )

    );



  }



  catch(error:any){


    console.error(

      "Forecast Load Error",

      error

    );



    if(error.response?.status===401){


      setError(

        "Session expired. Login again"

      );


    }

    else{


      setError(

        "Failed to load forecast data"

      );


    }



    setDashboard(null);

    setProducts([]);

    setAllProducts([]);

    setCategories([]);


  }





  finally{


    setLoading(false);


  }


};







useEffect(()=>{


  fetchForecastData();


},[]);







// =====================================================
// GENERATE FORECAST
// =====================================================


const generateForecast = async()=>{


  try{


    setGenerating(true);

    setError("");





    if(

      forecastPeriod==="custom"

      &&

      (!startDate || !endDate)

    ){


      setError(

        "Start Date and End Date are required"

      );


      return;


    }






    await api.post(

      "/forecast/generate",

      {

        forecast_period:
          forecastPeriod,


        start_date:
          startDate || null,


        end_date:
          endDate || null,


      }

    );





    await fetchForecastData();




  }


  catch(error:any){


    console.error(

      "Forecast Generate Error",

      error

    );



    setError(

      "Forecast generation failed"

    );


  }



  finally{


    setGenerating(false);


  }


};

const handleSearch = ()=>{


  let filtered = [

    ...allProducts

  ];





  if(searchText.trim()){



    filtered = filtered.filter(


      (item)=>

      item.product_name

      .toLowerCase()

      .includes(

        searchText

        .toLowerCase()

      )


    );


  }









  if(brand.trim()){



    filtered = filtered.filter(


      (item)=>

      item.brand

      ?.toLowerCase()

      .includes(

        brand

        .toLowerCase()

      )


    );


  }









  if(category){



    filtered = filtered.filter(


      (item)=>

      item.category_name===category


    );


  }









  if(sortBy==="demand"){



    filtered.sort(

      (a,b)=>

      b.predicted_demand -

      a.predicted_demand

    );


  }







  else if(sortBy==="stock"){



    filtered.sort(

      (a,b)=>

      a.current_stock -

      b.current_stock

    );


  }







  else if(sortBy==="growth"){



    filtered.sort(

      (a,b)=>

      b.expected_growth_percentage -

      a.expected_growth_percentage

    );


  }







  else if(sortBy==="accuracy"){



    filtered.sort(

      (a,b)=>

      b.forecast_accuracy -

      a.forecast_accuracy

    );


  }







  setProducts(filtered);



};








const handleRefresh = ()=>{


  setSearchText("");

  setBrand("");

  setCategory("");

  setSortBy("");

  setForecastPeriod("30_days");

  setStartDate("");

  setEndDate("");



  fetchForecastData();



};












// =====================================================
// NOTIFICATIONS
// =====================================================


const toggleNotifications = async()=>{



  const value =

  !showNotifications;



  setShowNotifications(value);







  if(value){



    try{



      const response = await api.get(

        "/notifications/forecast"

      );






      setNotifications(

        response.data ?? []

      );




    }



    catch(error){



      console.error(

        "Notification Error",

        error

      );



      setNotifications([]);



    }



  }



};












// =====================================================
// DOWNLOAD FILE
// =====================================================


const downloadFile = (

  data:any,

  fileName:string

)=>{



  const url =

  window.URL.createObjectURL(data);





  const link =

  document.createElement("a");





  link.href=url;



  link.download=fileName;




  document.body.appendChild(link);



  link.click();



  link.remove();



  window.URL.revokeObjectURL(url);



};


const exportProductsCSV = async()=>{


  try{


    const response = await api.get(

      "/forecast/export/products/csv",

      {

        responseType:"blob",

      }

    );





    downloadFile(

      response.data,

      "product_forecast.csv"

    );



  }



  catch(error){



    console.error(

      "CSV Export Error",

      error

    );



  }


};









const exportCategoriesCSV = async()=>{


  try{


    const response = await api.get(

      "/forecast/export/categories/csv",

      {

        responseType:"blob",

      }

    );







    downloadFile(


      response.data,


      "category_forecast.csv"


    );



  }



  catch(error){



    console.error(

      "Category Export Error",

      error

    );



  }


};









const exportProductsPDF = async()=>{


  try{


    const response = await api.get(

      "/forecast/export/products/pdf",

      {

        responseType:"blob",

      }

    );







    downloadFile(


      response.data,


      "product_forecast.pdf"


    );



  }



  catch(error){



    console.error(

      "PDF Export Error",

      error

    );



  }


};








return (

<Box

sx={{

p:3,

width:"100%",

minHeight:"100vh",

overflowX:"hidden",

background:"#0F172A",

boxSizing:"border-box",

}}

>







<Typography

variant="h4"

fontWeight={700}

sx={{

color:"#FFFFFF",

mb:3,

}}

>

Demand Forecasting & Predictive Analytics

</Typography>








{

error &&


<Alert

severity="error"

sx={{mb:3}}

>

{error}

</Alert>


}








{

loading &&


<Box

sx={{

display:"flex",

justifyContent:"center",

mb:3,

}}

>

<CircularProgress />

</Box>


}







<Grid

container

spacing={2}

sx={{mb:3}}

>


{

[

[

"Total Forecasts",

dashboard?.total_forecasts ?? 0

],



[

"Predicted Demand",

dashboard?.total_predicted_demand ?? 0

],



[

"Run Out Risk",

dashboard?.products_expected_to_run_out ?? 0

],



[

"High Growth",

dashboard?.high_growth_products ?? 0

],



[

"Slow Moving",

dashboard?.slow_moving_products ?? 0

],



[

"Accuracy",

`${dashboard?.forecast_accuracy ?? 0}%`

]



].map(


(item,index)=>(

<Grid

key={index}

size={{

xs:12,

sm:6,

md:4,

lg:2,

}}

>


<Card

sx={{

height:"100%",

background:"#1E293B",

}}


>


<CardContent>


<Typography

variant="subtitle2"

sx={{

color:"#94A3B8",

}}

>

{item[0]}

</Typography>






<Typography

variant="h4"

fontWeight={700}

sx={{

color:"#FFFFFF",

mt:1,

}}

>

{item[1]}

</Typography>





</CardContent>


</Card>


</Grid>


)


)


}


</Grid>


{/* FILTER SECTION */}


<Stack

spacing={2}

sx={{mb:3}}

>






<Stack

direction="row"

spacing={2}

sx={{

flexWrap:"wrap",

gap:2,

}}

>









<TextField

select

label="Forecast Period"

value={forecastPeriod}

onChange={(e)=>

setForecastPeriod(

e.target.value

)

}

sx={darkFieldStyle}

>


{

FORECAST_PERIODS.map(

(item)=>(


<MenuItem

key={item.value}

value={item.value}

>

{item.label}

</MenuItem>


)


)

}



</TextField>









<TextField

type="date"

label="Start Date"

value={startDate}

onChange={(e)=>

setStartDate(e.target.value)

}

slotProps={{

inputLabel:{

shrink:true

}

}}

sx={darkFieldStyle}

/>









<TextField

type="date"

label="End Date"

value={endDate}

onChange={(e)=>

setEndDate(e.target.value)

}

slotProps={{

inputLabel:{

shrink:true

}

}}

sx={darkFieldStyle}

/>









<TextField

label="Search Product"

value={searchText}

onChange={(e)=>

setSearchText(e.target.value)

}

sx={darkFieldStyle}

/>









<TextField

label="Brand"

value={brand}

onChange={(e)=>

setBrand(e.target.value)

}

sx={darkFieldStyle}

/>









<TextField

select

label="Category"

value={category}

onChange={(e)=>

setCategory(e.target.value)

}

sx={darkFieldStyle}

>



<MenuItem value="">

All Categories

</MenuItem>





{

[...new Set(

allProducts.map(

(item)=>

item.category_name

)

)]

.map(

(cat)=>(


<MenuItem

key={cat}

value={cat}

>

{cat}

</MenuItem>


)

)

}


</TextField>









<TextField

select

label="Sort By"

value={sortBy}

onChange={(e)=>

setSortBy(e.target.value)

}

sx={darkFieldStyle}

>


<MenuItem value="">

Default

</MenuItem>



<MenuItem value="demand">

Highest Predicted Demand

</MenuItem>



<MenuItem value="stock">

Lowest Stock

</MenuItem>



<MenuItem value="growth">

Highest Growth

</MenuItem>



<MenuItem value="accuracy">

Forecast Accuracy

</MenuItem>


</TextField>



</Stack>


<Stack

direction="row"

spacing={2}

sx={{

flexWrap:"wrap",

gap:2,

}}

>





<Button

variant="contained"

startIcon={<Search />}

onClick={handleSearch}

>

Search

</Button>







<Button

variant="outlined"

startIcon={<Refresh />}

onClick={handleRefresh}

sx={{

color:"#FFFFFF",

borderColor:"#64748B",

}}

>

Refresh

</Button>







<Button

variant="contained"

startIcon={<Assessment />}

onClick={generateForecast}

disabled={generating}

>



{

generating

?

"Generating..."

:

"Generate Forecast"

}



</Button>







<Button

variant="outlined"

startIcon={<Notifications />}

onClick={toggleNotifications}

sx={{

color:"#FFFFFF",

borderColor:"#64748B",

}}

>

Notifications

</Button>





</Stack>





</Stack>









{/* HISTORICAL VS PREDICTED */}



<Card

sx={{

mb:3,

background:"#1E293B",

}}

>



<CardContent>



<Typography

variant="h6"

fontWeight={700}

sx={{

color:"#FFFFFF",

mb:2,

}}

>

Historical Sales vs Forecast

</Typography>








<Box

sx={{

height:350,

width:"100%",

}}

>



<ResponsiveContainer

width="100%"

height="100%"

>



<BarChart

data={productChartData}

>



<CartesianGrid

strokeDasharray="3 3"

/>







<XAxis

dataKey="name"

tick={{

fill:"#E2E8F0"

}}

/>







<YAxis

tick={{

fill:"#E2E8F0"

}}

/>







<Tooltip

contentStyle={{

background:"#111827",

border:"1px solid #334155",

}}

labelStyle={{

color:"#FFFFFF"

}}

itemStyle={{

color:"#FFFFFF"

}}

/>







<Legend />








<Bar

dataKey="historical"

name="Historical Sales"

fill="#38BDF8"

/>








<Bar

dataKey="predicted"

name="Predicted Demand"

fill="#22C55E"

/>







</BarChart>



</ResponsiveContainer>



</Box>




</CardContent>




</Card>


{/* GROWTH FORECAST */}



<Card

sx={{

mb:3,

background:"#1E293B",

}}

>



<CardContent>



<Typography

variant="h6"

fontWeight={700}

sx={{

color:"#FFFFFF",

mb:2,

}}

>

Product Growth Forecast

</Typography>







<ResponsiveContainer

width="100%"

height={350}

>



<BarChart

data={growthChartData}

>



<CartesianGrid

strokeDasharray="3 3"

/>







<XAxis

dataKey="name"

tick={{

fill:"#E2E8F0"

}}

/>







<YAxis

tick={{

fill:"#E2E8F0"

}}

/>







<Tooltip

contentStyle={{

background:"#111827",

border:"1px solid #334155",

}}

labelStyle={{

color:"#FFFFFF"

}}

itemStyle={{

color:"#FFFFFF"

}}

/>









<Bar

dataKey="growth"

name="Growth %"

fill="#F59E0B"

/>







</BarChart>



</ResponsiveContainer>





</CardContent>




</Card>









{/* PRODUCT DEMAND TREND */}



<Card

sx={{

mb:3,

background:"#1E293B",

}}

>



<CardContent>



<Typography

variant="h6"

fontWeight={700}

sx={{

color:"#FFFFFF",

mb:2,

}}

>

Product Demand Trend

</Typography>









<ResponsiveContainer

width="100%"

height={350}

>



<LineChart

data={productTrendData}

>



<CartesianGrid

strokeDasharray="3 3"

/>







<XAxis

dataKey="name"

tick={{

fill:"#E2E8F0"

}}

/>







<YAxis

tick={{

fill:"#E2E8F0"

}}

/>







<Tooltip

contentStyle={{

background:"#111827",

border:"1px solid #334155",

}}

labelStyle={{

color:"#FFFFFF"

}}

itemStyle={{

color:"#FFFFFF"

}}

/>







<Legend />








<Line

dataKey="historical"

name="Historical"

stroke="#38BDF8"

/>








<Line

dataKey="forecast"

name="Forecast"

stroke="#22C55E"

/>







</LineChart>



</ResponsiveContainer>




</CardContent>




</Card>


{/* TOP PREDICTED PRODUCTS */}



<Card

sx={{

mb:3,

background:"#1E293B",

}}

>



<CardContent>



<Typography

variant="h6"

fontWeight={700}

sx={{

color:"#FFFFFF",

mb:2,

}}

>

Top Predicted Products

</Typography>








<ResponsiveContainer

width="100%"

height={350}

>



<BarChart

data={topProductsData}

>



<CartesianGrid

strokeDasharray="3 3"

/>







<XAxis

dataKey="name"

tick={{

fill:"#E2E8F0"

}}

/>







<YAxis

tick={{

fill:"#E2E8F0"

}}

/>







<Tooltip

contentStyle={{

background:"#111827",

border:"1px solid #334155",

}}

labelStyle={{

color:"#FFFFFF"

}}

itemStyle={{

color:"#FFFFFF"

}}

/>







<Bar

dataKey="demand"

name="Predicted Demand"

fill="#A855F7"

/>







</BarChart>



</ResponsiveContainer>




</CardContent>




</Card>









{/* SEASONAL SALES PATTERN */}



<Card

sx={{

mb:3,

background:"#1E293B",

}}

>



<CardContent>



<Typography

variant="h6"

fontWeight={700}

sx={{

color:"#FFFFFF",

mb:2,

}}

>

Seasonal Sales Pattern

</Typography>









<ResponsiveContainer

width="100%"

height={350}

>



<LineChart

data={seasonalData}

>



<CartesianGrid

strokeDasharray="3 3"

/>







<XAxis

dataKey="month"

tick={{

fill:"#E2E8F0"

}}

/>







<YAxis

tick={{

fill:"#E2E8F0"

}}

/>







<Tooltip

contentStyle={{

background:"#111827",

border:"1px solid #334155",

}}

labelStyle={{

color:"#FFFFFF"

}}

itemStyle={{

color:"#FFFFFF"

}}

/>







<Legend />








<Line

dataKey="sales"

name="Historical Sales"

stroke="#38BDF8"

/>








<Line

dataKey="forecast"

name="Forecast"

stroke="#22C55E"

/>







</LineChart>



</ResponsiveContainer>




</CardContent>




</Card>


{/* CATEGORY DEMAND DISTRIBUTION */}



<Card

sx={{

mb:3,

background:"#1E293B",

}}

>



<CardContent>



<Typography

variant="h6"

fontWeight={700}

sx={{

color:"#FFFFFF",

mb:2,

}}

>

Category Demand Distribution

</Typography>








<Box

sx={{

height:350,

width:"100%",

}}

>



<ResponsiveContainer

width="100%"

height="100%"

>



<PieChart>







<Pie

data={categoryChartData}

dataKey="demand"

nameKey="name"

outerRadius={120}

label

>








{

categoryChartData.map(

(item,index)=>(


<Cell

key={

`${item.name}-${index}`

}

fill={

COLORS[

index %

COLORS.length

]

}

/>


)


)

}








</Pie>









<Tooltip

contentStyle={{

background:"#111827",

border:"1px solid #334155",

}}

labelStyle={{

color:"#FFFFFF"

}}

itemStyle={{

color:"#FFFFFF"

}}

/>







<Legend />





</PieChart>



</ResponsiveContainer>




</Box>





</CardContent>




</Card>









{/* PRODUCT FORECAST DETAILS TABLE */}



<Card

sx={{

mb:3,

background:"#1E293B",

}}

>



<CardContent>



<Typography

variant="h6"

fontWeight={700}

sx={{

color:"#FFFFFF",

mb:2,

}}

>

Product Forecast Details

</Typography>








<TableContainer

component={Paper}

sx={{

background:"#111827",

}}

>



<Table>





<TableHead>



<TableRow>





<TableCell

sx={{

color:"#FFFFFF",

fontWeight:700,

}}

>

Product

</TableCell>







<TableCell

sx={{

color:"#FFFFFF",

fontWeight:700,

}}

>

Stock

</TableCell>







<TableCell

sx={{

color:"#FFFFFF",

fontWeight:700,

}}

>

Historical

</TableCell>







<TableCell

sx={{

color:"#FFFFFF",

fontWeight:700,

}}

>

Predicted

</TableCell>







<TableCell

sx={{

color:"#FFFFFF",

fontWeight:700,

}}

>

Confidence

</TableCell>







<TableCell

sx={{

color:"#FFFFFF",

fontWeight:700,

}}

>

Recommendation

</TableCell>







</TableRow>



</TableHead>


<TableBody>



{


products.length === 0

?

<TableRow>


<TableCell

colSpan={6}

align="center"

sx={{

color:"#CBD5E1",

}}

>

No Product Forecast Data Available

</TableCell>



</TableRow>



:



products.map(

(row)=>(


<TableRow

key={row.id}

>





<TableCell

sx={{

color:"#E2E8F0",

}}

>

{row.product_name}

</TableCell>







<TableCell

sx={{

color:"#E2E8F0",

}}

>

{row.current_stock}

</TableCell>







<TableCell

sx={{

color:"#E2E8F0",

}}

>

{row.historical_sales}

</TableCell>







<TableCell

sx={{

color:"#E2E8F0",

}}

>

{row.predicted_demand}

</TableCell>







<TableCell

sx={{

color:"#E2E8F0",

}}

>

{row.confidence_score}%

</TableCell>







<TableCell>



<Chip

label={row.recommendation}

size="small"

sx={{

background:"#334155",

color:"#FFFFFF",

}}

/>



</TableCell>







</TableRow>



)


)



}





</TableBody>





</Table>



</TableContainer>





</CardContent>




</Card>









{/* CATEGORY FORECAST DETAILS TABLE */}



<Card

sx={{

mb:3,

background:"#1E293B",

}}

>



<CardContent>



<Typography

variant="h6"

fontWeight={700}

sx={{

color:"#FFFFFF",

mb:2,

}}

>

Category Forecast Details

</Typography>








<TableContainer

component={Paper}

sx={{

background:"#111827",

}}

>



<Table>





<TableHead>



<TableRow>





<TableCell

sx={{

color:"#FFFFFF",

fontWeight:700,

}}

>

Category

</TableCell>







<TableCell

sx={{

color:"#FFFFFF",

fontWeight:700,

}}

>

Historical

</TableCell>







<TableCell

sx={{

color:"#FFFFFF",

fontWeight:700,

}}

>

Predicted

</TableCell>







<TableCell

sx={{

color:"#FFFFFF",

fontWeight:700,

}}

>

Growth %

</TableCell>







<TableCell

sx={{

color:"#FFFFFF",

fontWeight:700,

}}

>

Recommendation

</TableCell>







</TableRow>



</TableHead>


<TableBody>



{


categories.length === 0

?

<TableRow>


<TableCell

colSpan={5}

align="center"

sx={{

color:"#CBD5E1",

}}

>

No Category Forecast Data Available

</TableCell>



</TableRow>



:



categories.map(

(row)=>(


<TableRow

key={row.id}

>





<TableCell

sx={{

color:"#E2E8F0",

}}

>

{row.category_name}

</TableCell>







<TableCell

sx={{

color:"#E2E8F0",

}}

>

{row.historical_sales}

</TableCell>







<TableCell

sx={{

color:"#E2E8F0",

}}

>

{row.predicted_demand}

</TableCell>







<TableCell

sx={{

color:"#E2E8F0",

}}

>

{row.expected_growth_percentage}%

</TableCell>







<TableCell>



<Chip

label={row.recommendation}

size="small"

sx={{

background:"#334155",

color:"#FFFFFF",

}}

/>



</TableCell>







</TableRow>



)


)



}





</TableBody>





</Table>



</TableContainer>





</CardContent>




</Card>









{/* EXPORT REPORTS */}



<Card

sx={{

mb:3,

background:"#1E293B",

}}

>



<CardContent>



<Typography

variant="h6"

fontWeight={700}

sx={{

color:"#FFFFFF",

mb:2,

}}

>

Export Forecast Reports

</Typography>








<Stack

direction="row"

spacing={2}

sx={{

flexWrap:"wrap",

gap:2,

}}

>





<Button

variant="outlined"

startIcon={<Download />}

onClick={exportProductsCSV}

sx={{

color:"#FFFFFF",

borderColor:"#64748B",

}}

>

Product CSV

</Button>





<Button

variant="outlined"

startIcon={<Download />}

onClick={exportProductsPDF}

sx={{

color:"#FFFFFF",

borderColor:"#64748B",

}}

>

Product PDF

</Button>





<Button

variant="outlined"

startIcon={<Download />}

onClick={exportCategoriesCSV}

sx={{

color:"#FFFFFF",

borderColor:"#64748B",

}}

>

Category CSV

</Button>


</Stack>


</CardContent>


</Card>









{/* FORECAST NOTIFICATIONS */}



{


showNotifications &&



<Card

sx={{

mb:3,

background:"#1E293B",

}}

>



<CardContent>



<Typography

variant="h6"

fontWeight={700}

sx={{

color:"#FFFFFF",

mb:2,

}}

>

Forecast Notifications

</Typography>









{


notifications.length === 0

?

<Typography

sx={{

color:"#CBD5E1",

}}

>

No new forecast notifications

</Typography>





:



notifications.map(

(item,index)=>(


<Card

key={index}

sx={{

mb:1,

background:"#334155",

}}

>



<CardContent>



<Typography

sx={{

color:"#FFFFFF",

fontWeight:600,

}}

>

{item.message}

</Typography>







<Typography

sx={{

color:"#CBD5E1",

}}

>

{item.type}

</Typography>






</CardContent>




</Card>



)


)



}






</CardContent>




</Card>



}







</Box>


);


}


