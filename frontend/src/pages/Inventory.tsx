import { useEffect, useMemo, useState } from "react";

import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
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

import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

import {
  getInventory,
  getInventoryDashboard,
  addStock,
  removeStock,
  adjustStock,
  getInventoryMovements,
  updateReorderLevel,
} from "../api/inventoryApi";

interface InventoryItem {

  id:number;

  product_id:number;

  current_stock:number;

  reserved_stock:number;

  available_stock:number;

  reorder_level:number;

  stock_status:string;

  updated_at?:string;


  product:{
    name:string;
    sku:string;
    brand:string;
    category_id:number;

    category?:{
      name:string;
    };
  };

}



export default function Inventory(){


const [inventory,setInventory] =
useState<InventoryItem[]>([]);



const [dashboard,setDashboard] =
useState<any>({});



// Search

const [search,setSearch] =
useState("");



// Filters

const [status,setStatus] =
useState("");

const [category,setCategory] =
useState("");

const [brand,setBrand] =
useState("");



// Sorting

const [sortBy,setSortBy] =
useState("");



// Dialog

const [open,setOpen] =
useState(false);

const [movementOpen, setMovementOpen] =
useState(false);

const [selectedItem,setSelectedItem] =
useState<any>(null);

const [reorderOpen,setReorderOpen] =
useState(false);

const [reorderValue,setReorderValue] =
useState(0);


const [movements, setMovements] =
useState<any[]>([]);

const [actionType,setActionType] =
useState<
"add"|"remove"|"adjust"
>("add");



const [form,setForm] =
useState({

 inventory_id:0,

 quantity:0,

 reason:"",

 remarks:"",

});



// Load Inventory

const loadInventory = async()=>{


 const data = await getInventory({

  search,

  stock_status:
  status || undefined,

 });


 setInventory(data);


};



// Dashboard

const loadDashboard = async()=>{


 const data =
 await getInventoryDashboard();


 setDashboard(data);


};



// Category Chart Data

const categoryData =
useMemo(()=>{


 const map:any={};



 inventory.forEach(item=>{


  const name =
  item.product.category?.name ||
  "Other";


  map[name] =
  (map[name] || 0)
  +
  item.current_stock;


 });



 return Object.keys(map)
 .map(key=>({

  name:key,

  value:map[key]

 }));


},[inventory]);





// Stock Status Chart Data

const stockStatusData =
useMemo(()=>{


 const map:any={};



 inventory.forEach(item=>{


  map[item.stock_status] =
  (map[item.stock_status] || 0)
  +
  1;


 });



 return Object.keys(map)
 .map(key=>({

  name:key,

  value:map[key]

 }));


},[inventory]);






// Filter + Sort Inventory

const filteredInventory =
useMemo(()=>{


 let data=[...inventory];



 if(category){


  data =
  data.filter(
   item =>
   item.product.category?.name
   === category
  );


 }



 if(brand){


  data =
  data.filter(
   item =>
   item.product.brand
   === brand
  );


 }



 if(sortBy==="name"){


  data.sort(
   (a,b)=>
   a.product.name.localeCompare(
    b.product.name
   )
  );


 }



 if(sortBy==="stock"){


  data.sort(
   (a,b)=>
   b.current_stock -
   a.current_stock
  );


 }



 if(sortBy==="updated"){


  data.sort(
   (a,b)=>
   new Date(
    b.updated_at || ""
   ).getTime()
   -
   new Date(
    a.updated_at || ""
   ).getTime()
  );


 }



 return data;



},[
 inventory,
 category,
 brand,
 sortBy
]);






// Category Dropdown Data

const categories =
useMemo(()=>{


 return Array.from(

  new Set(

   inventory
   .map(
    item =>
    item.product.category?.name
   )
   .filter(Boolean)

  )

 );


},[inventory]);






// Brand Dropdown Data

const brands =
useMemo(()=>{


 return Array.from(

  new Set(

   inventory
   .map(
    item =>
    item.product.brand
   )
   .filter(Boolean)

  )

 );


},[inventory]);






// API Calls

useEffect(()=>{


 loadInventory();


},[
 search,
 status
]);



useEffect(()=>{


 loadDashboard();


},[]);

const loadMovements = async()=>{

 const data =
 await getInventoryMovements();

 setMovements(data);

 setMovementOpen(true);

};

// Stock Action Handler

const handleAction = async()=>{


 // Quantity Validation
 if(!form.quantity || form.quantity <= 0){

  alert("Quantity must be greater than 0");

  return;

 }


 // Reason Validation
 if(!form.reason || !form.reason.trim()){

  alert("Please enter reason");

  return;

 }


 // Remove Stock Validation
 if(
  actionType==="remove" &&
  selectedItem &&
  form.quantity > selectedItem.available_stock
 ){

  alert("Cannot remove more than available stock");

  return;

 }



 if(actionType==="add"){

  await addStock(form);

 }


 if(actionType==="remove"){

  await removeStock(form);

 }


 if(actionType==="adjust"){

  await adjustStock(form);

 }


 setOpen(false);


 loadInventory();

 loadDashboard();


};





return (

<Box
 sx={{
  display:"flex",
  minHeight:"100vh",
  bgcolor:"#0F172A",
 }}
>


<Sidebar />



<Box
 sx={{
  flex:1,
  ml:"260px",
 }}
>


<Topbar />



<Container
 maxWidth="xl"
 sx={{
  mt:12,
  pb:4,
 }}
>


{/* Header */}


<Box
 sx={{
  mb:4,
  p:3,
  borderRadius:3,

  background:
  "linear-gradient(90deg,#1E3A8A,#2563EB)",

  boxShadow:
  "0 10px 25px rgba(37,99,235,0.30)",
 }}
>


<Typography
 variant="h4"
 sx={{
  color:"#FFFFFF",
  fontWeight:700,
 }}
>
 Inventory Management
</Typography>



<Typography
 sx={{
  color:"#DBEAFE",
  mt:1,
 }}
>
 Monitor inventory levels, stock movement,
 and warehouse operations.
</Typography>


</Box>





{/* Dashboard Cards */}


<Grid
 container
 spacing={3}
 mb={4}
>


{
[
 {
  title:"Total Products",
  value:
  dashboard.total_products || 0,
  color:"#60A5FA"
 },

 {
  title:"Total Inventory Quantity",
  value:
  dashboard.total_inventory_quantity || 0,
  color:"#22C55E"
 },

 {
  title:"Low Stock Products",
  value:
  dashboard.low_stock_products || 0,
  color:"#FACC15"
 },

 {
  title:"Out Of Stock",
  value:
  dashboard.out_of_stock_products || 0,
  color:"#EF4444"
 }

].map((card)=>(


<Grid
 item
 xs={12}
 sm={6}
 lg={3}
 key={card.title}
>


<Card
 sx={{
  background:
  "linear-gradient(135deg,#1E293B,#334155)",

  color:"#FFFFFF",

  borderRadius:3,

  height:"100%",

  boxShadow:
  "0 8px 20px rgba(0,0,0,.25)",


  transition:"0.3s",


  "&:hover":{
   transform:
   "translateY(-5px)",

   boxShadow:
   "0 10px 25px rgba(37,99,235,.35)",
  }

 }}
>


<CardContent>


<Typography
 color="#CBD5E1"
 fontWeight={600}
>
 {card.title}
</Typography>



<Typography
 variant="h3"
 mt={1}
 fontWeight={700}
 sx={{
  color:card.color
 }}
>
 {card.value}
</Typography>


</CardContent>


</Card>


</Grid>


))

}



</Grid>


{/* Charts Section */}


<Grid
 container
 spacing={3}
 mb={4}
>


{/* Inventory By Category */}


<Grid
 item
 xs={12}
 lg={6}
>


<Card
 sx={{
  bgcolor:"#1E293B",
  borderRadius:3,
  p:2,
  border:"1px solid #334155",
  boxShadow:
  "0 8px 20px rgba(0,0,0,.25)",
 }}
>


<Typography
 variant="h6"
 sx={{
  color:"#FFFFFF",
  fontWeight:700,
  mb:2,
 }}
>
 Inventory By Category
</Typography>



<Box
 sx={{
  width:"100%",
  height:320,
 }}
>


<ResponsiveContainer
 width="100%"
 height="100%"
>


<BarChart
 data={categoryData}
>


<XAxis
 dataKey="name"
 stroke="#CBD5E1"
/>


<YAxis
 stroke="#CBD5E1"
/>


<Tooltip
/>


<Bar
 dataKey="value"
 fill="#2563EB"
 radius={[8,8,0,0]}
/>


</BarChart>


</ResponsiveContainer>


</Box>


</Card>


</Grid>






{/* Stock Status Distribution */}


<Grid
 item
 xs={12}
 lg={6}
>


<Card
 sx={{
  bgcolor:"#1E293B",
  borderRadius:3,
  p:2,
  border:"1px solid #334155",
  boxShadow:
  "0 8px 20px rgba(0,0,0,.25)",
 }}
>


<Typography
 variant="h6"
 sx={{
  color:"#FFFFFF",
  fontWeight:700,
  mb:2,
 }}
>
 Stock Status Distribution
</Typography>



<Box
 sx={{
  width:"100%",
  height:320,
 }}
>


<ResponsiveContainer
 width="100%"
 height="100%"
>


<PieChart>


<Pie
 data={stockStatusData}
 dataKey="value"
 nameKey="name"
 outerRadius={110}
 label
>


{
stockStatusData.map(
(entry,index)=>(

<Cell
 key={`cell-${index}`}
 fill={
 [
 "#22C55E",
 "#FACC15",
 "#EF4444"
 ][index % 3]
 }
/>

))
}


</Pie>


<Tooltip />


</PieChart>


</ResponsiveContainer>


</Box>


</Card>


</Grid>



</Grid>

{/* Search & Filters */}


<Paper
 sx={{
  p:3,
  mb:4,
  borderRadius:3,
  bgcolor:"#1E293B",
  border:"1px solid #334155",
  boxShadow:
  "0 8px 20px rgba(0,0,0,.25)",
 }}
>


<Typography
 variant="h6"
 sx={{
  color:"#FFFFFF",
  fontWeight:700,
  mb:2,
 }}
>
 Search & Filters
</Typography>




<Grid
 container
 spacing={2}
>



{/* Search */}

<Grid
 item
 xs={12}
 md={6}
>

<TextField
  fullWidth
  label="Search Product / SKU"
  value={search}
  onChange={(e) =>
    setSearch(e.target.value)
  }
  sx={{
    backgroundColor: "#FFFFFF",
    borderRadius: 2,

    "& .MuiInputBase-input": {
      color: "#111827",
    },

    "& .MuiInputLabel-root": {
      color: "#475569",
    },

    "& .MuiOutlinedInput-root": {
      backgroundColor: "#FFFFFF",

      "& fieldset": {
        borderColor: "#CBD5E1",
      },

      "&:hover fieldset": {
        borderColor: "#2563EB",
      },

      "&.Mui-focused fieldset": {
        borderColor: "#2563EB",
      },
    },
  }}
/>

</Grid>






{/* Status */}

<Grid
 item
 xs={12}
 md={3}
>


<TextField
 select
 fullWidth
 label="Stock Status"
 value={status}
 onChange={(e)=>
  setStatus(e.target.value)
 }
 InputLabelProps={{
  sx:{
   color:"#CBD5E1"
  }
 }}
 InputProps={{
  sx:{
   color:"#FFFFFF",
   bgcolor:"#0F172A",
   borderRadius:2
  }
 }}
>


<MenuItem value="">
 All
</MenuItem>


<MenuItem value="In Stock">
 In Stock
</MenuItem>


<MenuItem value="Low Stock">
 Low Stock
</MenuItem>


<MenuItem value="Out of Stock">
 Out of Stock
</MenuItem>


</TextField>


</Grid>






{/* Category */}

<Grid
 item
 xs={12}
 md={3}
>


<TextField
 select
 fullWidth
 label="Category"
 value={category}
 onChange={(e)=>
  setCategory(e.target.value)
 }
 InputLabelProps={{
  sx:{
   color:"#CBD5E1"
  }
 }}
 InputProps={{
  sx:{
   color:"#FFFFFF",
   bgcolor:"#0F172A",
   borderRadius:2
  }
 }}
>


<MenuItem value="">
 All Categories
</MenuItem>



{
categories.map((item)=>(

<MenuItem
 key={item}
 value={item}
>
 {item}
</MenuItem>

))
}



</TextField>


</Grid>







{/* Brand */}

<Grid
 item
 xs={12}
 md={3}
>


<TextField
 select
 fullWidth
 label="Brand"
 value={brand}
 onChange={(e)=>
  setBrand(e.target.value)
 }
 InputLabelProps={{
  sx:{
   color:"#CBD5E1"
  }
 }}
 InputProps={{
  sx:{
   color:"#FFFFFF",
   bgcolor:"#0F172A",
   borderRadius:2
  }
 }}
>


<MenuItem value="">
 All Brands
</MenuItem>



{
brands.map((item)=>(

<MenuItem
 key={item}
 value={item}
>
 {item}
</MenuItem>

))
}



</TextField>


</Grid>







{/* Sorting */}

<Grid
 item
 xs={12}
 md={3}
>


<TextField
 select
 fullWidth
 label="Sort By"
 value={sortBy}
 onChange={(e)=>
  setSortBy(e.target.value)
 }
 InputLabelProps={{
  sx:{
   color:"#CBD5E1"
  }
 }}
 InputProps={{
  sx:{
   color:"#FFFFFF",
   bgcolor:"#0F172A",
   borderRadius:2
  }
 }}
>


<MenuItem value="">
 Default
</MenuItem>


<MenuItem value="name">
 Product Name
</MenuItem>


<MenuItem value="stock">
 Current Stock
</MenuItem>


<MenuItem value="updated">
 Recently Updated
</MenuItem>


</TextField>


</Grid>



</Grid>


</Paper>

{/* Inventory Table */}


<TableContainer
 component={Paper}
 sx={{
  bgcolor:"#1E293B",
  borderRadius:3,
  border:"1px solid #334155",
  overflowX:"auto",
  boxShadow:
  "0 10px 24px rgba(0,0,0,.25)",
 }}
>


<Table
 sx={{
  minWidth:900
 }}
>


<TableHead>


<TableRow
 sx={{
  bgcolor:"#2563EB"
 }}
>


{
[
"Product",
"SKU",
"Brand",
"Current Stock",
"Reserved",
"Available",
"Reorder Level",
"Status",
"Actions"

].map((head)=>(


<TableCell
 key={head}
 sx={{
  color:"#FFFFFF",
  fontWeight:700
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
filteredInventory.map((item)=>(


<TableRow
 key={item.id}
 hover
 sx={{
  "&:hover":{
   bgcolor:"#273549"
  }
 }}
>



<TableCell
 sx={{
  color:"#FFFFFF"
 }}
>
 {item.product.name}
</TableCell>



<TableCell
 sx={{
  color:"#CBD5E1"
 }}
>
 {item.product.sku}
</TableCell>




<TableCell
 sx={{
  color:"#CBD5E1"
 }}
>
 {item.product.brand}
</TableCell>





<TableCell
 sx={{
  color:"#60A5FA",
  fontWeight:700
 }}
>
 {item.current_stock}
</TableCell>





<TableCell
 sx={{
  color:"#CBD5E1"
 }}
>
 {item.reserved_stock}
</TableCell>





<TableCell
 sx={{
  color:"#22C55E",
  fontWeight:700
 }}
>
 {item.available_stock}
 </TableCell>

<TableCell
 sx={{
  color:"#FACC15",
  fontWeight:700
 }}
>
 {item.reorder_level}
</TableCell>



<TableCell>


<Chip

label={item.stock_status}


sx={{

fontWeight:700,


color:

item.stock_status==="In Stock"

?

"#22C55E"

:

item.stock_status==="Low Stock"

?

"#FACC15"

:

"#EF4444",



backgroundColor:

item.stock_status==="In Stock"

?

"rgba(34,197,94,.12)"

:

item.stock_status==="Low Stock"

?

"rgba(250,204,21,.12)"

:

"rgba(239,68,68,.12)",


border:

item.stock_status==="In Stock"

?

"1px solid #22C55E"

:

item.stock_status==="Low Stock"

?

"1px solid #FACC15"

:

"1px solid #EF4444"

}}

/>


</TableCell>









<TableCell>

<Button
 size="small"
 variant="contained"
 sx={{
  mr:1,
  bgcolor:"#22C55E",
  textTransform:"none"
 }}

onClick={()=>{

 setActionType("add");

 setForm({

  inventory_id:item.id,

  quantity:0,

  reason:"",

  remarks:""

 });

 setOpen(true);

}}
>
Add
</Button>


<Button
 size="small"
 variant="contained"
 sx={{
  mr:1,
  bgcolor:"#EF4444",
  textTransform:"none"
 }}

onClick={()=>{

 setActionType("remove");

 setForm({

  inventory_id:item.id,

  quantity:0,

  reason:"",

  remarks:""

 });

 setOpen(true);

}}
>
Remove
</Button>


<Button
 size="small"
 variant="contained"
 sx={{
  mr:1,
  bgcolor:"#2563EB",
  textTransform:"none"
 }}

onClick={()=>{

 setSelectedItem(item);

 setReorderValue(item.reorder_level);

 setReorderOpen(true);

}}
>
Reorder
</Button>


<Button
 size="small"
 variant="contained"

sx={{
 bgcolor:"#F59E0B",
 textTransform:"none"
}}

onClick={()=>{


setActionType("adjust");


setForm({

 inventory_id:item.id,

 quantity:item.current_stock,

 reason:"",

 remarks:""

});


setOpen(true);


}}

>

Adjust

</Button>




</TableCell>





</TableRow>


))


}



</TableBody>



</Table>


</TableContainer>

{/* Stock Action Dialog */}


<Dialog

open={open}

onClose={()=>
 setOpen(false)
}

fullWidth

maxWidth="sm"


PaperProps={{

sx:{

bgcolor:"#1E293B",

color:"#FFFFFF",

borderRadius:3

}

}}

>





<DialogTitle

sx={{

fontWeight:700,

background:

"linear-gradient(90deg,#1E3A8A,#2563EB)",

color:"#FFFFFF"

}}

>

{
actionType==="add"

?

"Add Stock"

:

actionType==="remove"

?

"Remove Stock"

:

"Adjust Stock"

}

</DialogTitle>







<DialogContent

sx={{

mt:2

}}

>





<TextField

fullWidth

margin="normal"

label="Quantity"

type="number"

value={form.quantity}


onChange={(e)=>


setForm({

...form,

quantity:Number(
e.target.value
)

})


}



InputLabelProps={{

sx:{

color:"#CBD5E1"

}

}}


InputProps={{

sx:{

color:"#FFFFFF",

bgcolor:"#0F172A",

borderRadius:2

}

}}


/>








<TextField

fullWidth

margin="normal"

label="Reason"


value={form.reason}


onChange={(e)=>


setForm({

...form,

reason:e.target.value

})


}



InputLabelProps={{

sx:{

color:"#CBD5E1"

}

}}


InputProps={{

sx:{

color:"#FFFFFF",

bgcolor:"#0F172A",

borderRadius:2

}

}}


/>









<TextField

fullWidth

margin="normal"

multiline

rows={3}

label="Remarks"


value={form.remarks}


onChange={(e)=>


setForm({

...form,

remarks:e.target.value

})


}



InputLabelProps={{

sx:{

color:"#CBD5E1"

}

}}


InputProps={{

sx:{

color:"#FFFFFF",

bgcolor:"#0F172A",

borderRadius:2

}

}}


/>






</DialogContent>







<DialogActions

sx={{

px:3,

pb:3

}}

>




<Button

onClick={()=>setOpen(false)}

sx={{

color:"#CBD5E1"

}}

>

Cancel

</Button>







<Button

variant="contained"

onClick={handleAction}


sx={{

bgcolor:"#2563EB",

fontWeight:700,

textTransform:"none",


"&:hover":{

bgcolor:"#1D4ED8"

}

}}

>

Save Changes

</Button>





</DialogActions>





</Dialog>

<Dialog
 open={reorderOpen}
 onClose={()=>setReorderOpen(false)}
>

<DialogTitle
 sx={{
  fontWeight:700,
  background:"linear-gradient(90deg,#1E3A8A,#2563EB)",
  color:"#FFFFFF"
 }}
>
 Update Reorder Level
</DialogTitle>


<DialogContent
 sx={{mt:2}}
>

<TextField

 fullWidth

 type="number"

 label="Reorder Level"

 value={reorderValue}

 onChange={(e)=>
  setReorderValue(Number(e.target.value))
 }

 />

</DialogContent>


<DialogActions>

<Button

variant="contained"

onClick={async()=>{


 if(!selectedItem){

  alert("Inventory item not selected");

  return;

 }


 if(reorderValue < 0){

  alert("Reorder level cannot be negative");

  return;

 }


 try{


  await updateReorderLevel(

   selectedItem.id,

   {
    reorder_level: reorderValue
   }

  );


  alert("Reorder level updated successfully");


  setReorderOpen(false);


  loadInventory();


 }
 catch(error){

  console.log(error);

  alert("Failed to update reorder level");

 }


}}

>
Save
</Button>
</DialogActions>


</Dialog>

{/* Movement History Section */}


<Paper

sx={{

mt:4,

p:3,

borderRadius:3,

bgcolor:"#1E293B",

border:"1px solid #334155",

boxShadow:
"0 8px 20px rgba(0,0,0,.25)"

}}

>



<Grid

container

alignItems="center"

justifyContent="space-between"

spacing={2}

>



<Grid

item

xs={12}

md={8}

>


<Typography

variant="h6"

sx={{

color:"#FFFFFF",

fontWeight:700

}}

>

Stock Movement History

</Typography>



<Typography

sx={{

color:"#CBD5E1",

mt:1

}}

>

Track stock additions, removals,
and inventory adjustments.

</Typography>


</Grid>







<Grid

item

xs={12}

md={4}

sx={{

textAlign:{

xs:"left",

md:"right"

}

}}

>


<Button

variant="contained"

sx={{

background:

"linear-gradient(90deg,#1E3A8A,#2563EB)",

fontWeight:700,

textTransform:"none",

px:4,


"&:hover":{

background:

"linear-gradient(90deg,#1D4ED8,#2563EB)"

}

}}

onClick={loadMovements}

// Future Movement History page/dialog


>

View Movement History

</Button>


</Grid>




</Grid>



</Paper>

{/* Movement History Dialog */}

<Dialog
 open={movementOpen}
 onClose={()=>setMovementOpen(false)}
 fullWidth
 maxWidth="md"
 PaperProps={{
  sx:{
   bgcolor:"#1E293B",
   color:"#FFFFFF",
   borderRadius:3
  }
 }}
>

<DialogTitle
 sx={{
  fontWeight:700,
  background:
  "linear-gradient(90deg,#1E3A8A,#2563EB)",
  color:"#FFFFFF"
 }}
>
 Stock Movement History
</DialogTitle>


<DialogContent>

{
movements.length === 0 ?

(

<Typography
 sx={{
  color:"#CBD5E1",
  mt:2
 }}
>
 No movement history found.
</Typography>

)

:

(

<TableContainer
 component={Paper}
 sx={{
  bgcolor:"#0F172A",
  mt:2
 }}
>
<Table>

<TableHead>
<TableRow
 sx={{
  bgcolor:"#2563EB"
 }}
>

{[
"Movement Type",
"Previous Qty",
"Updated Qty",
"Changed",
"Reason",
"Remarks",
"Performed By",
"Date"
].map((head)=>(
<TableCell
 key={head}
 sx={{
  color:"#FFFFFF",
  fontWeight:700
 }}
>
 {head}
</TableCell>
))}

</TableRow>
</TableHead>


<TableBody>

{movements.map((item,index)=>(

<TableRow key={index}>

<TableCell sx={{color:"#FFFFFF"}}>
 {item.movement_type}
</TableCell>


<TableCell sx={{color:"#FFFFFF"}}>
 {item.previous_quantity}
</TableCell>


<TableCell sx={{color:"#22C55E"}}>
 {item.updated_quantity}
</TableCell>


<TableCell sx={{color:"#FACC15"}}>
 {item.quantity_changed}
</TableCell>


<TableCell sx={{color:"#FFFFFF"}}>
 {item.reason}
</TableCell>


<TableCell sx={{color:"#CBD5E1"}}>
 {item.remarks}
</TableCell>


<TableCell sx={{color:"#FFFFFF"}}>
 {item.performed_by}
</TableCell>


<TableCell sx={{color:"#CBD5E1"}}>
 {new Date(item.created_at).toLocaleString()}
</TableCell>


</TableRow>

))}

</TableBody>

</Table>
</TableContainer>
)

}


</DialogContent>


<DialogActions>

<Button
 onClick={()=>setMovementOpen(false)}
 sx={{
  color:"#CBD5E1"
 }}
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