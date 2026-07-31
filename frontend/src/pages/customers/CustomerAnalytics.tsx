import {
  useEffect,
  useState
} from "react";


import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography
} from "@mui/material";


import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line
} from "recharts";


import {
  getCustomerAnalytics
} from "../../services/customerService";



// ================================
// COMPONENT
// ================================

export default function CustomerAnalytics(){


const [data,setData] =
useState<any>({});



// ================================
// LOAD ANALYTICS
// ================================

const loadAnalytics = async()=>{


try{


const response =
await getCustomerAnalytics();


console.log(
" CUSTOMER ANALYTICS DATA:",
response
);


setData(response);


}

catch(error){

console.log(
"Analytics error",
error
);

}


};



useEffect(()=>{

loadAnalytics();

},[]);





// ================================
// CHART DATA MAPPING
// ================================



const segmentData =
Object.entries(
data.customer_segments || {}
).map(
([key,value])=>({

name:key,

value:Number(value)

})
);





const revenueData =
Array.isArray(
data.revenue_contribution
)
?
data.revenue_contribution.map(
(item:any)=>({

name:
item.customer_type ||
item.name ||
"Unknown",

value:
Number(
item.revenue || 
item.value || 
0
)

})
)
:
[];






const growthData =
Array.isArray(
data.growth
)
?
data.growth.map(
(item:any)=>({

month:
item.date ||
item.month ||
"",

customers:
Number(
item.total_customers ||
item.customers ||
0
)

})
)
:
[];





return (

<Box

sx={{

p:3,

background:"#0F172A",

minHeight:"100vh"

}}

>


<Typography

variant="h4"

fontWeight="bold"

color="white"

mb={3}

>

Customer Analytics

</Typography>





{/* ================= CARDS ================= */}


<Grid container spacing={3}>


<Grid item xs={12} md={3}>

<Card

sx={{

background:"#1E293B",

color:"white"

}}

>

<CardContent>


<Typography>
Total Customers
</Typography>


<Typography variant="h3">

{
data.total_customers || 0
}

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


<Typography>
New Customers
</Typography>


<Typography variant="h3">

{
data.new_customers || 0
}

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


<Typography>
VIP Customers
</Typography>


<Typography variant="h3">

{
data.vip_customers || 0
}

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


<Typography>
Active Customers
</Typography>


<Typography variant="h3">

{
data.active_customers || 0
}

</Typography>


</CardContent>

</Card>

</Grid>


</Grid>






{/* ================= CHARTS ================= */}


<Grid

container

spacing={3}

mt={2}

>




{/* PIE CHART */}


<Grid item xs={12} md={4}>


<Card

sx={{

background:"#1E293B",

height:350

}}

>


<CardContent>


<Typography

color="white"

mb={2}

>

Customer Segments

</Typography>



<ResponsiveContainer

width="100%"

height={250}

>


<PieChart>


<Pie

data={segmentData}

dataKey="value"

nameKey="name"

outerRadius={90}

>


{
segmentData.map(
(
entry,
index
)=>(

<Cell

key={index}

/>

)

)

}


</Pie>


<Tooltip/>

<Legend/>


</PieChart>



</ResponsiveContainer>


</CardContent>


</Card>


</Grid>







{/* BAR CHART */}



<Grid item xs={12} md={4}>


<Card

sx={{

background:"#1E293B",

height:350

}}

>


<CardContent>


<Typography

color="white"

mb={2}

>

Revenue By Type

</Typography>




<ResponsiveContainer

width="100%"

height={250}

>


<BarChart

data={revenueData}

>


<XAxis

dataKey="name"

/>


<YAxis/>


<Tooltip/>


<Legend/>


<Bar

dataKey="value"

/>


</BarChart>


</ResponsiveContainer>



</CardContent>


</Card>


</Grid>







{/* LINE CHART */}



<Grid item xs={12} md={4}>


<Card

sx={{

background:"#1E293B",

height:350

}}

>


<CardContent>


<Typography

color="white"

mb={2}

>

Customer Growth

</Typography>



<ResponsiveContainer

width="100%"

height={250}

>


<LineChart

data={growthData}

>


<XAxis

dataKey="month"

/>


<YAxis/>


<Tooltip/>


<Legend/>


<Line

type="monotone"

dataKey="customers"

/>


</LineChart>


</ResponsiveContainer>



</CardContent>


</Card>


</Grid>




</Grid>



</Box>

);

}