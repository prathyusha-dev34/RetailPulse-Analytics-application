import {
  useEffect,
  useState
} from "react";


import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress
} from "@mui/material";


import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from "recharts";


import {
  getCustomerDashboard,
  getTopCustomers,
  getCustomerRevenueContribution,
  getNewVsReturningCustomers,
  getCustomerGrowthTrend,
  getCustomerSpendingDistribution
} from "../../services/customerService";



const COLORS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6"
];




export default function CustomerAnalytics(){


const [loading,setLoading] = useState(true);


const [dashboard,setDashboard] = useState<any>({});


const [topCustomers,setTopCustomers] = useState<any[]>([]);


const [revenueContribution,setRevenueContribution] = useState<any[]>([]);


const [newReturning,setNewReturning] = useState<any[]>([]);


const [growth,setGrowth] = useState<any[]>([]);


const [spending,setSpending] = useState<any[]>([]);




const normalizeArray=(data:any)=>{


if(Array.isArray(data))
return data;


if(Array.isArray(data?.data))
return data.data;


return [];

};





const loadAnalytics = async()=>{


try{


setLoading(true);



const [

dashboardData,

topData,

revenueData,

newData,

growthData,

spendingData

] = await Promise.all([


getCustomerDashboard(),

getTopCustomers(),

getCustomerRevenueContribution(),

getNewVsReturningCustomers(),

getCustomerGrowthTrend(),

getCustomerSpendingDistribution()

]);





setDashboard(

dashboardData?.data ??

dashboardData ??

{}

);





setTopCustomers(

normalizeArray(topData).map((item:any)=>({

name:

item.customer_name ??

item.name ??

item.full_name ??

"Customer",



revenue:

Number(

item.lifetime_revenue ??

item.total_revenue ??

item.revenue ??

0

)

}))

);





setRevenueContribution(

normalizeArray(revenueData).map((item:any)=>({

name:

item.customer_name ??

item.name ??

"Customer",



value:

Number(

item.revenue ??

item.total_revenue ??

item.amount ??

0

)

}))

);





setGrowth(

normalizeArray(growthData).map((item:any)=>({

month:

item.month ??

item.date ??

item.period ??

"",



customers:

Number(

item.total_customers ??

item.customer_count ??

item.customers ??

0

)

}))

);


// New vs Returning

if(Array.isArray(newData)){


setNewReturning(

newData.map((item:any)=>({

name:

item.name ??

item.customer_type ??

"Customers",


new_customers:

Number(

item.new_customers ??

item.new ??

0

),


returning_customers:

Number(

item.returning_customers ??

item.returning ??

0

)

}))

);


}
else{


setNewReturning([

{

name:"Customers",


new_customers:

Number(

newData?.new_customers ??

newData?.new ??

0

),


returning_customers:

Number(

newData?.returning_customers ??

newData?.returning ??

0

)

}

]);


}






// Spending

if(Array.isArray(spendingData)){


setSpending(

spendingData.map((item:any)=>({

name:

item.name ??

item.customer_type ??

"Unknown",


value:

Number(

item.value ??

item.amount ??

item.revenue ??

0

)

}))

);


}
else{


setSpending(

Object.entries(spendingData ?? {})

.map(([key,value])=>({

name:key,

value:Number(value)

}))

);


}



}
catch(error){


console.error(error);


}
finally{


setLoading(false);


}


};






useEffect(()=>{


loadAnalytics();


},[]);






if(loading){


return(


<Box

sx={{

height:"100vh",

display:"flex",

justifyContent:"center",

alignItems:"center",

background:"#0F172A"

}}

>


<CircularProgress/>


</Box>


);


}







return(


<Box

sx={{

p:3,

minHeight:"100vh",

background:"#0F172A",

color:"white"

}}

>


<Typography

variant="h4"

fontWeight="bold"

mb={3}

>

Customer Analytics Dashboard

</Typography>





<Grid container spacing={3}>



<Grid item xs={12} md={3}>

<Card

sx={{

background:"#1E293B",

color:"white"

}}

>

<CardContent>


<Typography color="#94A3B8">

Total Customers

</Typography>


<Typography variant="h4">

{dashboard.total_customers ?? 0}

</Typography>


</CardContent>


</Card>

</Grid>





<Grid item xs={12} md={3}>

<Card

sx={{

background:"#1E293B",

color:"white"

}}

>

<CardContent>


<Typography color="#94A3B8">

Total Revenue

</Typography>


<Typography variant="h4">

₹ {dashboard.total_revenue_generated ?? 0}

</Typography>


</CardContent>


</Card>

</Grid>





<Grid item xs={12} md={3}>

<Card

sx={{

background:"#1E293B",

color:"white"

}}

>

<CardContent>


<Typography color="#94A3B8">

Average Spend

</Typography>


<Typography variant="h4">

₹ {dashboard.average_customer_spend ?? 0}

</Typography>


</CardContent>


</Card>

</Grid>





<Grid item xs={12} md={3}>

<Card

sx={{

background:"#1E293B",

color:"white"

}}

>

<CardContent>


<Typography color="#94A3B8">

VIP Customers

</Typography>


<Typography variant="h4">

{dashboard.vip_customers ?? 0}

</Typography>


</CardContent>


</Card>

</Grid>


</Grid>




<Card

sx={{

mt:3,

background:"#1E293B",

color:"white"

}}

>

<CardContent>


<Typography variant="h6">

Customer Growth Trend

</Typography>



<Box

sx={{

height:350

}}

>


<ResponsiveContainer

width="100%"

height="100%"

>


<LineChart

data={growth}

>


<XAxis

dataKey="month"

/>


<YAxis/>


<Tooltip/>


<Line

type="monotone"

dataKey="customers"

stroke="#3B82F6"

strokeWidth={3}

/>


</LineChart>


</ResponsiveContainer>


</Box>


</CardContent>


</Card>








<Card

sx={{

mt:3,

background:"#1E293B",

color:"white"

}}

>


<CardContent>


<Typography variant="h6">

Top Customers Revenue

</Typography>



<Box

sx={{

height:350

}}

>


<ResponsiveContainer

width="100%"

height="100%"

>


<BarChart

data={topCustomers}

margin={{

top:20,

right:20,

left:20,

bottom:50

}}

>


<XAxis

dataKey="name"

interval={0}

angle={-25}

textAnchor="end"

/>


<YAxis/>


<Tooltip/>


<Bar

dataKey="revenue"

fill="#10B981"

/>


</BarChart>


</ResponsiveContainer>


</Box>



</CardContent>


</Card>








<Card

sx={{

mt:3,

background:"#1E293B",

color:"white"

}}

>


<CardContent>


<Typography variant="h6">

Revenue Contribution

</Typography>



<Box

sx={{

height:350

}}

>


<ResponsiveContainer

width="100%"

height="100%"

>


<PieChart>



<Pie

data={revenueContribution}

dataKey="value"

nameKey="name"

outerRadius={110}

label

>


{

revenueContribution.map(

(_,index)=>(


<Cell

key={index}

fill={

COLORS[index % COLORS.length]

}

/>


)

)

}



</Pie>



<Tooltip/>


<Legend/>


</PieChart>


</ResponsiveContainer>


</Box>



</CardContent>


</Card>


<Card

sx={{

mt:3,

background:"#1E293B",

color:"white"

}}

>


<CardContent>


<Typography variant="h6">

New vs Returning Customers

</Typography>



<Box

sx={{

height:350

}}

>


<ResponsiveContainer

width="100%"

height="100%"

>


<BarChart

data={newReturning}

margin={{

top:20,

right:20,

left:20,

bottom:20

}}

>


<XAxis

dataKey="name"

/>


<YAxis/>


<Tooltip/>


<Legend/>



<Bar

dataKey="new_customers"

fill="#3B82F6"

name="New Customers"

/>



<Bar

dataKey="returning_customers"

fill="#10B981"

name="Returning Customers"

/>



</BarChart>


</ResponsiveContainer>


</Box>


</CardContent>


</Card>








<Card

sx={{

mt:3,

background:"#1E293B",

color:"white"

}}

>


<CardContent>


<Typography variant="h6">

Customer Spending Distribution

</Typography>



<Box

sx={{

height:350

}}

>


<ResponsiveContainer

width="100%"

height="100%"

>


<PieChart>



<Pie

data={spending}

dataKey="value"

nameKey="name"

outerRadius={120}

label

>


{

spending.map(

(_,index)=>(


<Cell

key={index}

fill={

COLORS[index % COLORS.length]

}

/>


)

)

}



</Pie>


<Tooltip/>


<Legend/>


</PieChart>


</ResponsiveContainer>


</Box>



</CardContent>


</Card>






</Box>


);


}