import {
  useEffect,
  useMemo,
  useState
} from "react";


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



// =========================
// Interfaces
// =========================


interface Category {

  name:string;

}



interface Product {

  name:string;

  sku:string;

  brand:string;

  category?:Category;

}



interface InventoryItem {

  id:number;

  current_stock:number;

  reserved_stock:number;

  available_stock:number;

  reorder_level:number;

  stock_status:
  "IN_STOCK" |
  "LOW_STOCK" |
  "OUT_OF_STOCK";


  updated_at?:string;


  product:Product;

}



interface Dashboard {

  total_products:number;

  total_inventory_quantity:number;

  low_stock_products:number;

  out_of_stock_products:number;

}



interface Movement {

  id:number;

  movement_type:string;

  quantity_changed:number;

  previous_quantity:number;

  updated_quantity:number;

  reason:string;

  remarks?:string;

  performed_by_name?:string;

  created_at:string;

}


// =========================
// Component
// =========================


export default function Inventory(){


const [inventory,setInventory] =
useState<InventoryItem[]>([]);



const [dashboard,setDashboard] =
useState<Dashboard>({
  total_products:0,
  total_inventory_quantity:0,
  low_stock_products:0,
  out_of_stock_products:0
});



const [search,setSearch] =
useState("");



const [status,setStatus] =
useState("");



const [category,setCategory] =
useState("");



const [brand,setBrand] =
useState("");



const [sortBy,setSortBy] =
useState("");



const [open,setOpen] =
useState(false);



const [movementOpen,setMovementOpen] =
useState(false);



const [reorderOpen,setReorderOpen] =
useState(false);



const [selectedItem,setSelectedItem] =
useState<InventoryItem | null>(null);



const [reorderValue,setReorderValue] =
useState(0);



const [movements,setMovements] =
useState<Movement[]>([]);



const [actionType,setActionType] =
useState<
"add" |
"remove" |
"adjust"
>("add");



const [form,setForm] =
useState({

 inventory_id:0,

 quantity:0,

 reason:"",

 remarks:""

});


// =========================
// Load Inventory
// =========================

const loadInventory = async()=>{

  try{

    const data = await getInventory({

      search:
      search || undefined,


      stock_status:
      status || undefined,


      sort_by:
      sortBy || undefined,

    });



    setInventory(
      Array.isArray(data)
      ? data
      : []
    );


  }
  catch(error){

    console.log(
      "Inventory loading failed",
      error
    );

    setInventory([]);

  }

};



// =========================
// Load Dashboard
// =========================

const loadDashboard = async()=>{

  try{

    const data =
    await getInventoryDashboard();


    setDashboard(data);


  }
  catch(error){

    console.log(
      "Dashboard loading failed",
      error
    );

  }

};



// =========================
// Load Movements
// =========================

const loadMovements = async()=>{

  try{

    const data =
    await getInventoryMovements();


    setMovements(
      Array.isArray(data)
      ? data
      : []
    );


    setMovementOpen(true);


  }
  catch(error){

    console.log(
      "Movement loading failed",
      error
    );

  }

};



// =========================
// Category Chart Data
// =========================

const categoryData =
useMemo(()=>{

  const map:
  Record<string,number> = {};


  inventory.forEach((item)=>{


    const categoryName =
    item.product.category?.name
    ||
    "Other";


    map[categoryName] =
    (
      map[categoryName]
      ||
      0
    )
    +
    item.current_stock;


  });


  return Object.keys(map)
  .map((key)=>({

    name:key,

    value:map[key]

  }));


},[inventory]);



// =========================
// Stock Status Chart Data
// =========================

const stockStatusData =
useMemo(()=>{


  const map:
  Record<string,number> = {};


  inventory.forEach((item)=>{


    map[item.stock_status] =
    (
      map[item.stock_status]
      ||
      0
    )
    +
    1;


  });



  return Object.keys(map)
  .map((key)=>({

    name:key,

    value:map[key]

  }));


},[inventory]);



// =========================
// Frontend Filter + Sort
// =========================

const filteredInventory =
useMemo(()=>{


 let data =
 [...inventory];



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



 else if(sortBy==="stock"){


  data.sort(
    (a,b)=>
    b.current_stock -
    a.current_stock
  );


 }



 else if(sortBy==="recent"){


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



// =========================
// Category Dropdown
// =========================

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



// =========================
// Brand Dropdown
// =========================

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


// =========================
// Effects
// =========================


useEffect(()=>{

  loadInventory();

},[
  search,
  status,
  sortBy
]);



useEffect(()=>{

  loadDashboard();

},[]);





// =========================
// Stock Action Handler
// =========================


const handleAction = async()=>{


 try{


  if(
    !form.quantity ||
    form.quantity <= 0
  ){

    alert(
      "Quantity must be greater than 0"
    );

    return;

  }



  if(
    !form.reason.trim()
  ){

    alert(
      "Reason is required"
    );

    return;

  }




  if(
    actionType === "remove" &&
    selectedItem &&
    form.quantity >
    selectedItem.available_stock
  ){

    alert(
      "Cannot remove more than available stock"
    );

    return;

  }





  if(actionType==="add"){


    await addStock(form);


  }


  else if(actionType==="remove"){


    await removeStock(form);


  }


  else if(actionType==="adjust"){


    await adjustStock(form);


  }




  setOpen(false);



  setForm({

    inventory_id:0,

    quantity:0,

    reason:"",

    remarks:""

  });



  await loadInventory();

  await loadDashboard();



 }
 catch(error:any){


  console.log(error);


  alert(
    error.response?.data?.detail
    ||
    "Stock update failed"
  );


 }


};




// =========================
// RETURN UI
// =========================


return (

<Box

sx={{

display:"flex",

minHeight:"100vh",

bgcolor:"#0F172A"

}}

>


<Sidebar />



<Box

sx={{

flex:1,

ml:"260px"

}}

>


<Topbar />



<Container

maxWidth="xl"

sx={{

mt:12,

pb:4

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
"0 10px 25px rgba(37,99,235,.30)"

}}

>


<Typography

variant="h4"

sx={{

color:"#FFFFFF",

fontWeight:700

}}

>

Inventory Management

</Typography>



<Typography

sx={{

color:"#DBEAFE",

mt:1

}}

>

Monitor inventory levels, stock movement,
and warehouse operations.

</Typography>



</Box>


{/* ===========================
    Dashboard Cards
=========================== */}


<Grid

container

spacing={3}

mb={4}

>


{

[

{
 title:"Total Products",
 value:dashboard.total_products || 0,
 color:"#60A5FA"
},

{
 title:"Total Inventory Quantity",
 value:dashboard.total_inventory_quantity || 0,
 color:"#22C55E"
},

{
 title:"Low Stock Products",
 value:dashboard.low_stock_products || 0,
 color:"#FACC15"
},

{
 title:"Out Of Stock",
 value:dashboard.out_of_stock_products || 0,
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


boxShadow:
"0 8px 20px rgba(0,0,0,.25)",



"&:hover":{

transform:
"translateY(-5px)"

}


}}

>


<CardContent>


<Typography

sx={{

color:"#CBD5E1",

fontWeight:600

}}

>

{card.title}

</Typography>



<Typography

variant="h3"

sx={{

mt:1,

fontWeight:700,

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





{/* ===========================
    Charts Section
=========================== */}



<Grid

container

spacing={3}

mb={4}

>


{/* Category Chart */}


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

border:
"1px solid #334155"

}}

>


<Typography

variant="h6"

sx={{

color:"#FFFFFF",

fontWeight:700,

mb:2

}}

>

Inventory By Category

</Typography>



<Box

sx={{

height:320

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

/>



<YAxis />



<Tooltip />



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





{/* Stock Status Chart */}


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

border:
"1px solid #334155"

}}

>


<Typography

variant="h6"

sx={{

color:"#FFFFFF",

fontWeight:700,

mb:2

}}

>

Stock Status Distribution

</Typography>



<Box

sx={{

height:320

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

key={
`cell-${index}`
}

fill={

[
"#22C55E",
"#FACC15",
"#EF4444"
][index % 3]

}

/>


)

)

}


</Pie>



<Tooltip />



</PieChart>


</ResponsiveContainer>


</Box>


</Card>


</Grid>


</Grid>



{/* ===========================
    Search & Filters
=========================== */}


<Paper

sx={{

p:3,

mb:4,

borderRadius:3,

bgcolor:"#1E293B",

border:
"1px solid #334155"

}}

>


<Typography

variant="h6"

sx={{

color:"#FFFFFF",

fontWeight:700,

mb:2

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

md={4}

>


<TextField

fullWidth

label="Search Product / SKU"

value={search}

onChange={(e)=>

setSearch(
e.target.value
)

}


sx={{

backgroundColor:"#FFFFFF",

borderRadius:2,


"& .MuiInputBase-input":{

color:"#111827"

},


"& .MuiInputLabel-root":{

color:"#475569"

}

}}


/>


</Grid>





{/* Stock Status */}

<Grid

item

xs={12}

md={2}

>


<TextField

select

fullWidth

label="Stock Status"

value={status}


onChange={(e)=>

setStatus(
e.target.value
)

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
   borderRadius:2,

   "& .MuiSvgIcon-root":{
     color:"#FFFFFF"
   }
 }
}}


>


<MenuItem value="IN_STOCK">
  In Stock
</MenuItem>


<MenuItem value="LOW_STOCK">
  Low Stock
</MenuItem>


<MenuItem value="OUT_OF_STOCK">
  Out of Stock
</MenuItem>

</TextField>


</Grid>





{/* Category */}

<Grid

item

xs={12}

md={2}

>


<TextField

select

fullWidth

label="Category"

value={category}


onChange={(e)=>

setCategory(
e.target.value
)

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
   borderRadius:2,

   "& .MuiSvgIcon-root":{
     color:"#FFFFFF"
   }
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

md={2}

>


<TextField

select

fullWidth

label="Brand"

value={brand}


onChange={(e)=>

setBrand(
e.target.value
)

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
   borderRadius:2,

   "& .MuiSvgIcon-root":{
     color:"#FFFFFF"
   }
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





{/* Sort */}

<Grid

item

xs={12}

md={2}

>


<TextField

select

fullWidth

label="Sort By"

value={sortBy}


onChange={(e)=>

setSortBy(
e.target.value
)

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
   borderRadius:2,

   "& .MuiSvgIcon-root":{
     color:"#FFFFFF"
   }
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


<MenuItem value="recent">

Recently Updated

</MenuItem>


</TextField>


</Grid>



</Grid>


</Paper>

{/* ===========================
    Inventory Table
=========================== */}


<TableContainer

component={Paper}

sx={{

bgcolor:"#1E293B",

borderRadius:3,

border:
"1px solid #334155",

overflowX:"auto"

}}

>


<Table

sx={{

minWidth:1100

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

{item.product.brand || "-"}

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

label={
  item.stock_status === "IN_STOCK"
    ? "In Stock"
    : item.stock_status === "LOW_STOCK"
    ? "Low Stock"
    : "Out of Stock"
}

sx={{

fontWeight:700,


color:

item.stock_status==="IN_STOCK"

?

"#22C55E"

:

item.stock_status==="LOW_STOCK"

?

"#FACC15"

:

"#EF4444",



backgroundColor:

item.stock_status==="IN_STOCK"

?

"rgba(34,197,94,.12)"

:

item.stock_status==="LOW_STOCK"

?

"rgba(250,204,21,.12)"

:

"rgba(239,68,68,.12)"


}}


/>
</TableCell>





<TableCell>


<Button

size="small"

variant="contained"

sx={{

mr:1,

mb:1,

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


setSelectedItem(item);


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

mb:1,

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


setSelectedItem(item);


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

mb:1,

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


setSelectedItem(item);


setOpen(true);


}}

>

Adjust

</Button>





<Button

size="small"

variant="contained"

sx={{

bgcolor:"#2563EB",

textTransform:"none"

}}

onClick={()=>{


setSelectedItem(item);


setReorderValue(
item.reorder_level
);


setReorderOpen(true);


}}

>

Reorder

</Button>


</TableCell>



</TableRow>


))


}


</TableBody>


</Table>


</TableContainer>

{/* ===========================
    Stock Action Dialog
=========================== */}


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

color:"#FFFFFF"

}

}}

>


<DialogTitle

sx={{

background:
"linear-gradient(90deg,#1E3A8A,#2563EB)",

color:"#FFFFFF",

fontWeight:700

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





<DialogContent>



<TextField

fullWidth

margin="normal"

type="number"

label="Quantity"

value={form.quantity}


onChange={(e)=>

setForm({

...form,

quantity:Number(
e.target.value
)

})

}


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


/>



</DialogContent>





<DialogActions>


<Button

onClick={()=>setOpen(false)}

>

Cancel

</Button>



<Button

variant="contained"

onClick={handleAction}

sx={{

bgcolor:"#2563EB",

textTransform:"none"

}}

>

Save Changes

</Button>



</DialogActions>



</Dialog>







{/* ===========================
    Reorder Dialog
=========================== */}



<Dialog

open={reorderOpen}

onClose={()=>

setReorderOpen(false)

}

>



<DialogTitle>

Update Reorder Level

</DialogTitle>




<DialogContent>


<TextField

fullWidth

type="number"

label="Reorder Level"

value={reorderValue}


onChange={(e)=>

setReorderValue(
Number(e.target.value)
)

}


/>



</DialogContent>





<DialogActions>


<Button

onClick={()=>setReorderOpen(false)}

>

Cancel

</Button>




<Button

variant="contained"

onClick={async()=>{


if(!selectedItem){

alert(
"Select inventory item"
);

return;

}



try{


await updateReorderLevel(

selectedItem.id,

{

reorder_level:
reorderValue

}

);



setReorderOpen(false);



await loadInventory();



}

catch(error){

console.log(error);

alert(
"Reorder update failed"
);

}



}}

>

Save

</Button>



</DialogActions>



</Dialog>


{/* ===========================
    Movement History Card
=========================== */}


<Paper

sx={{

mt:4,

p:3,

borderRadius:3,

bgcolor:"#1E293B",

border:
"1px solid #334155"

}}

>


<Box

display="flex"

justifyContent="space-between"

alignItems="center"

>


<Box>


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

color:"#CBD5E1"

}}

>

Track stock additions, removals and adjustments.

</Typography>


</Box>




<Button

variant="contained"

onClick={loadMovements}

sx={{

bgcolor:"#2563EB",

textTransform:"none"

}}

>

View Movement History

</Button>



</Box>


</Paper>







{/* ===========================
    Movement History Dialog
=========================== */}



<Dialog

open={movementOpen}

onClose={()=>
setMovementOpen(false)
}

fullWidth

maxWidth="md"

>



<DialogTitle

sx={{

fontWeight:700

}}

>

Stock Movement History

</DialogTitle>





<DialogContent>


{

movements.length === 0

?

<Typography>

No movement history found.

</Typography>


:

<TableContainer

component={Paper}

>


<Table>



<TableHead>


<TableRow>


{

[

"Type",

"Previous",

"Updated",

"Changed",

"Reason",

"Remarks",

"Performed By",

"Date"

].map((head)=>(


<TableCell

key={head}

>

{head}

</TableCell>


))


}


</TableRow>


</TableHead>





<TableBody>


{

movements.map((item)=>(


<TableRow

key={item.id}

>


<TableCell>

{item.movement_type}

</TableCell>



<TableCell>

{item.previous_quantity}

</TableCell>



<TableCell>

{item.updated_quantity}

</TableCell>



<TableCell>

{item.quantity_changed}

</TableCell>



<TableCell>

{item.reason}

</TableCell>


<TableCell>

{item.remarks || "-"}

</TableCell>


<TableCell>

{item.performed_by_name || "-"}

</TableCell>


<TableCell>

{
new Date(
item.created_at
).toLocaleString()
}

</TableCell>



</TableRow>


))


}


</TableBody>


</Table>


</TableContainer>


}



</DialogContent>





<DialogActions>


<Button

onClick={()=>setMovementOpen(false)}

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

