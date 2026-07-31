import { useEffect, useState } from "react";

import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
} from "@mui/material";


import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";


import { getTopCustomers } from "../../services/customerService";



export default function TopCustomers(){


const [data,setData]=useState<any[]>([]);

const [loading,setLoading]=useState(true);



const loadData=async()=>{

try{


const response = await getTopCustomers();


setData(
Array.isArray(response)
?
response
:
response.data ?? []
);


}
catch(error){

console.log(error);

}
finally{

setLoading(false);

}

};



useEffect(()=>{

loadData();

},[]);




if(loading){

return(

<Box
sx={{
height:"100vh",
display:"flex",
justifyContent:"center",
alignItems:"center"
}}
>

<CircularProgress/>

</Box>

)

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
Top Customers
</Typography>



<Card
sx={{
background:"#1E293B",
color:"white"
}}
>

<CardContent>


<Box
height={350}
>


<ResponsiveContainer
width="100%"
height="100%"
>


<BarChart data={data}>


<XAxis
dataKey="customer_name"
/>


<YAxis/>


<Tooltip/>


<Bar
dataKey="revenue"
fill="#3B82F6"
/>


</BarChart>


</ResponsiveContainer>


</Box>


</CardContent>

</Card>


</Box>

);


}