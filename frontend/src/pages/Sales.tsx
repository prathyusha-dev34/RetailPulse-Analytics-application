import { useEffect, useState } from "react";

import {
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Chip,
} from "@mui/material";


import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";

import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";


import { useNavigate } from "react-router-dom";


import {
  getSales,
  deleteSale,
  getLowStockProducts,
  getOutOfStockProducts,
} from "../api/salesApi";





// ================================
// FILTER FIELD STYLE
// ================================


const filterFieldStyle = {


  "& .MuiInputBase-root": {
    color:"#e5e7eb",
    backgroundColor:"#111827",
  },


  "& .MuiInputLabel-root": {
    color:"#93c5fd",
  },


  "& .MuiInputLabel-root.Mui-focused": {
    color:"#60a5fa",
  },


 "& input": {
  color:"#e5e7eb",
  fontSize:"14px",
},

"& input::-webkit-calendar-picker-indicator": {
  filter:"invert(1)",
},


  "& .MuiOutlinedInput-notchedOutline": {
    borderColor:"#334155",
  },


  "&:hover .MuiOutlinedInput-notchedOutline": {
    borderColor:"#3b82f6",
  },


  "& .MuiSelect-icon": {
    color:"#93c5fd",
  },


};








export default function Sales(){



const navigate = useNavigate();




const [sales,setSales] =
useState<any[]>([]);



const [loading,setLoading] =
useState(true);



const [search,setSearch] =
useState("");



const [fromDate,setFromDate] =
useState("");



const [toDate,setToDate] =
useState("");



const [categoryFilter,setCategoryFilter] =
useState("");



const [channelFilter,setChannelFilter] =
useState("");



const [paymentFilter,setPaymentFilter] =
useState("");



const [sortBy,setSortBy] =
useState("");



const [lowStockCount,setLowStockCount] =
useState(0);



const [outOfStockCount,setOutOfStockCount] =
useState(0);



const [deleteId,setDeleteId] =
useState<number | null>(null);








// ================================
// LOAD SALES + STOCK ALERTS
// ================================


const loadSales = async()=>{


try{


setLoading(true);



const response:any =
await getSales();



console.log(
"SALES RESPONSE:",
response
);



const data =
Array.isArray(response)
?
response
:
response.data || [];



setSales(data);





const lowStock:any =
await getLowStockProducts(5);



const outStock:any =
await getOutOfStockProducts();





setLowStockCount(

Array.isArray(lowStock)
?
lowStock.length
:
0

);



setOutOfStockCount(

Array.isArray(outStock)
?
outStock.length
:
0

);



}


catch(error){


console.error(
"SALES LOAD ERROR:",
error
);


}


finally{


setLoading(false);


}


};






useEffect(()=>{


loadSales();


},[]);


// ================================
// DELETE SALE
// ================================


const handleDelete = async()=>{


try{


if(deleteId){


await deleteSale(deleteId);



setDeleteId(null);



loadSales();



}


}
catch(error){


console.log(error);


}


};









// ================================
// FILTER DATA
// ================================


let filteredSales = [
...sales
];




if(search){


filteredSales =
filteredSales.filter(
(item:any)=>

(item.customer_name || "")
.toLowerCase()
.includes(
search.toLowerCase()
)

||

(item.invoice_number || "")
.toLowerCase()
.includes(
search.toLowerCase()
)

);


}




if(channelFilter){


filteredSales =
filteredSales.filter(
(item:any)=>

item.sales_channel === channelFilter

);


}




if(paymentFilter){


filteredSales =
filteredSales.filter(
(item:any)=>

item.payment_method === paymentFilter

);


}




if(fromDate){


filteredSales =
filteredSales.filter(
(item:any)=>

new Date(item.sale_date)
>=
new Date(fromDate)

);


}




if(toDate){


filteredSales =
filteredSales.filter(
(item:any)=>

new Date(item.sale_date)
<=
new Date(
toDate+"T23:59:59"
)

);


}





if(sortBy==="date"){


filteredSales.sort(
(a:any,b:any)=>

new Date(b.sale_date).getTime()
-
new Date(a.sale_date).getTime()

);


}





if(sortBy==="amount"){


filteredSales.sort(
(a:any,b:any)=>

Number(
b.total_amount || 0
)
-
Number(
a.total_amount || 0
)

);


}





if(sortBy==="invoice"){


filteredSales.sort(
(a:any,b:any)=>

(a.invoice_number || "")
.localeCompare(
b.invoice_number || ""
)

);


}







const cardStyle = {


p:3,


borderRadius:4,


background:
"linear-gradient(135deg,#111827,#1e293b)",


color:"#fff",


boxShadow:
"0 10px 30px rgba(0,0,0,0.35)"


};






return (



<Container

maxWidth="xl"

sx={{

mt:4,

mb:6,

background:"transparent",

minHeight:"100vh"

}}

>







{/* HEADER */}



<Box

sx={{

display:"flex",

justifyContent:"space-between",

alignItems:"center",

mb:4,

flexWrap:"wrap",

gap:2

}}

>



<Box>




<Typography

variant="h4"

fontWeight="700"

sx={{

color:"#f8fafc",

letterSpacing:"0.5px",

textShadow:
"0 2px 8px rgba(0,0,0,0.5)"

}}

>

Sales Management

</Typography>






<Typography

sx={{

color:"#cbd5e1",

mt:1

}}

>

Manage sales, invoices and transactions

</Typography>





</Box>







<Button

variant="contained"

startIcon={<AddIcon/>}

onClick={()=>navigate("/sales/add")}

sx={{


borderRadius:3,


px:3,


py:1.2,


fontWeight:"bold"


}}

>

Add Sale

</Button>







</Box>







{/* SUMMARY CARDS */}


<Box

sx={{


display:"grid",


gridTemplateColumns:{


xs:"1fr",


sm:"repeat(2,1fr)",


md:"repeat(4,1fr)"


},


gap:3,


mb:4


}}

>


<Paper sx={cardStyle}>


<Typography
sx={{
color:"#cbd5e1"
}}
>
Total Sales
</Typography>



<Typography
variant="h4"
fontWeight="bold"
sx={{
mt:1
}}
>
{sales.length}
</Typography>


</Paper>







<Paper sx={cardStyle}>


<Typography
sx={{
color:"#cbd5e1"
}}
>
Revenue
</Typography>



<Typography
variant="h4"
fontWeight="bold"
sx={{
mt:1
}}
>

₹
{

sales.reduce(

(sum,item)=>

sum + Number(
item.total_amount || 0
),

0

)
.toFixed(2)

}

</Typography>


</Paper>







<Paper sx={cardStyle}>


<Typography
sx={{
color:"#cbd5e1"
}}
>
Orders
</Typography>



<Typography
variant="h4"
fontWeight="bold"
sx={{
mt:1
}}
>
{sales.length}
</Typography>


</Paper>







<Paper sx={cardStyle}>


<Typography
sx={{
color:"#cbd5e1"
}}
>
Average Order
</Typography>



<Typography
variant="h4"
fontWeight="bold"
sx={{
mt:1
}}
>

₹
{

sales.length

?

(

sales.reduce(

(sum,item)=>

sum + Number(
item.total_amount || 0
),

0

)
/
sales.length

)
.toFixed(2)

:

"0.00"

}


</Typography>


</Paper>



</Box>









{/* STOCK ALERTS */}



<Box

sx={{

display:"flex",

gap:3,

mb:4,

flexWrap:"wrap"

}}

>






<Paper

sx={{


p:3,


minWidth:280,


display:"flex",


alignItems:"center",


gap:2,


borderRadius:4,


background:
"linear-gradient(135deg,#854d0e,#422006)",


color:"white"


}}

>


<WarningAmberIcon

sx={{

fontSize:40,

color:"#facc15"

}}

/>




<Box>


<Typography

sx={{

color:"#fde68a"

}}

>

Low Stock

</Typography>





<Typography

variant="h5"

fontWeight="bold"

color="white"

>

{lowStockCount} Products

</Typography>



</Box>


</Paper>









<Paper

sx={{


p:3,


minWidth:280,


display:"flex",


alignItems:"center",


gap:2,


borderRadius:4,


background:
"linear-gradient(135deg,#991b1b,#450a0a)",


color:"white"


}}

>



<InfoOutlinedIcon

sx={{

fontSize:40,

color:"#fca5a5"

}}

/>






<Box>



<Typography

sx={{

color:"#fecaca"

}}

>

Out Of Stock

</Typography>





<Typography

variant="h5"

fontWeight="bold"

color="white"

>

{outOfStockCount} Products

</Typography>



</Box>



</Paper>





</Box>









{/* FILTER SECTION */}



<Paper

sx={{


p:3,


mb:4,


borderRadius:4,


background:"#0f172a"


}}

>



<Typography

sx={{

color:"#f8fafc",

fontWeight:700,

fontSize:"18px",

mb:2

}}

>

Filters

</Typography>







<Box

sx={{


display:"grid",


gridTemplateColumns:{


xs:"1fr",


sm:"repeat(2,1fr)",


md:"repeat(6,1fr)"


},


gap:2


}}

>








<TextField

label="Search"

value={search}

onChange={(e)=>

setSearch(
e.target.value
)

}

fullWidth

sx={filterFieldStyle}

/>
<TextField
  type="date"
  value={fromDate}
  fullWidth
  onChange={(e)=>setFromDate(e.target.value)}
  sx={filterFieldStyle}
/>

<TextField
  type="date"
  value={toDate}
  fullWidth
  onChange={(e)=>setToDate(e.target.value)}
  sx={filterFieldStyle}
/>
<TextField

select

label="Channel"

value={channelFilter}

onChange={(e)=>

setChannelFilter(
e.target.value
)

}

sx={filterFieldStyle}

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


</TextField>









<TextField

select

label="Payment"

value={paymentFilter}

onChange={(e)=>

setPaymentFilter(
e.target.value
)

}

sx={filterFieldStyle}

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


</TextField>









<TextField

select

label="Sort By"

value={sortBy}

onChange={(e)=>

setSortBy(
e.target.value
)

}

sx={filterFieldStyle}

>


<MenuItem value="">
None
</MenuItem>


<MenuItem value="date">
Date
</MenuItem>


<MenuItem value="invoice">
Invoice
</MenuItem>


<MenuItem value="amount">
Amount
</MenuItem>


</TextField>





</Box>


</Paper>









{/* SALES TABLE */}



<TableContainer

component={Paper}

sx={{

background:"#0f172a",

borderRadius:4

}}

>


<Table>


<TableHead>


<TableRow>


{

[
"Invoice",
"Customer",
"Date",
"Channel",
"Payment",
"Status",
"Amount",
"Actions"

].map((head)=>(


<TableCell

key={head}

sx={{

color:"#94a3b8",

fontWeight:"bold"

}}

>

{head}

</TableCell>


))


}


</TableRow>


</TableHead>








<TableBody>


{


loading ?



<TableRow>


<TableCell

colSpan={8}

align="center"

sx={{color:"white"}}

>

Loading...

</TableCell>


</TableRow>






:



filteredSales.length===0 ?





<TableRow>


<TableCell

colSpan={8}

align="center"

sx={{color:"white"}}

>


<Typography

p={3}

>

No sales available

</Typography>


</TableCell>


</TableRow>






:



filteredSales.map((item:any)=>(



<TableRow

key={item.id}

hover

>




<TableCell

sx={{

color:"white",

fontWeight:"bold"

}}

>

{item.invoice_number || "-"}

</TableCell>







<TableCell

sx={{color:"white"}}

>

{item.customer_name || "-"}

</TableCell>







<TableCell

sx={{color:"white"}}

>

{

item.sale_date

?

new Date(item.sale_date)
.toLocaleDateString()

:

"-"

}


</TableCell>







<TableCell

sx={{color:"white"}}

>

{item.sales_channel || "-"}

</TableCell>








<TableCell

sx={{color:"white"}}

>

{item.payment_method || "-"}

</TableCell>







<TableCell>


<Chip

label="Completed"

size="small"

sx={{

background:"#16a34a",

color:"white",

fontWeight:"bold"

}}

/>


</TableCell>







<TableCell

sx={{

color:"white",

fontWeight:"bold"

}}

>

₹
{

Number(
item.total_amount || 0
)
.toFixed(2)

}

</TableCell>







<TableCell>



<IconButton

sx={{color:"#38bdf8"}}

onClick={()=>navigate(`/sales/${item.id}`)}

>

<VisibilityIcon/>

</IconButton>







<IconButton

sx={{color:"#60a5fa"}}

onClick={()=>navigate(`/sales/edit/${item.id}`)}

>

<EditIcon/>

</IconButton>







<IconButton

sx={{color:"#f87171"}}

onClick={()=>setDeleteId(item.id)}

>

<DeleteIcon/>

</IconButton>



</TableCell>





</TableRow>


))


}



</TableBody>


</Table>


</TableContainer>









{/* DELETE CONFIRMATION */}



<Dialog

open={Boolean(deleteId)}

onClose={()=>setDeleteId(null)}

>



<DialogTitle>

Delete Sale

</DialogTitle>





<DialogContent>


<Typography>

Are you sure you want to delete this sale?

</Typography>


</DialogContent>







<DialogActions>


<Button

onClick={()=>setDeleteId(null)}

>

Cancel

</Button>






<Button

variant="contained"

color="error"

onClick={handleDelete}

>

Delete

</Button>



</DialogActions>



</Dialog>







</Container>


);


}

