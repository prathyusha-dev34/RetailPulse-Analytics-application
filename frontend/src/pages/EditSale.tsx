import {
  useEffect,
  useMemo,
  useState,
} from "react";


import {
  Alert,
  Box,
  Button,
  Container,
  MenuItem,
  Paper,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";


import {
  useNavigate,
  useParams,
} from "react-router-dom";


import {
  getSale,
  updateSale,
} from "../api/salesApi";


import {
  getProducts,
} from "../api/productApi";





export default function EditSale(){


const navigate =
useNavigate();


const {id}=useParams();





const [products,setProducts]=
useState<any[]>([]);




const [customerName,setCustomerName]=
useState("");



const [productId,setProductId]=
useState("");



const [productName,setProductName]=
useState("");



const [category,setCategory]=
useState("");



const [sku,setSku]=
useState("");



const [availableStock,setAvailableStock]=
useState(0);




const [quantity,setQuantity]=
useState(1);



const [unitPrice,setUnitPrice]=
useState(0);



const [discount,setDiscount]=
useState(0);



const [tax,setTax]=
useState(0);





const [salesChannel,setSalesChannel]=
useState("Retail Store");



const [paymentMethod,setPaymentMethod]=
useState("Cash");





const [loading,setLoading]=
useState(false);




const [snackbar,setSnackbar]=useState({

open:false,

message:"",

type:"success" as
"success"|"error"

});





const textFieldStyle={


"& .MuiInputLabel-root":{
color:"#cbd5e1"
},


"& .MuiOutlinedInput-root":{

color:"#fff",

background:"#1e293b",

"& fieldset":{
borderColor:"#475569"
}

}

};







useEffect(()=>{


loadProducts();


loadSale();


},[id]);








const loadProducts=async()=>{


try{


const response:any=
await getProducts();



const list=

response.data.products ??

response.data.data ??

response.data.items ??

response.data;



setProducts(list);



}

catch(error){

console.log(
"Products loading error",
error
);

}


};







const loadSale=async()=>{


try{


const response:any=
await getSale(
Number(id)
);



const sale =

response.data.sale ??

response.data.data ??

response.data;



setCustomerName(
sale.customer_name || ""
);



setSalesChannel(
sale.sales_channel ||
"Retail Store"
);



setPaymentMethod(
sale.payment_method ||
"Cash"
);



const item =
sale.items?.[0];



if(item){


setProductId(
String(item.product_id)
);



setQuantity(
Number(item.quantity)
);



setUnitPrice(
Number(item.unit_price)
);



setDiscount(
Number(item.discount || 0)
);



setTax(
Number(item.tax || 0)
);



}



}

catch(error){

console.log(
"Sale loading error",
error
);


}



};






const handleProductChange=(value:string)=>{


setProductId(value);



const product =
products.find(
(p:any)=>
p.id===Number(value)
);



if(product){


setProductName(
product.name
);



setCategory(

product.category?.name ??

product.category_name ??

"-"

);



setSku(
product.sku || "-"
);



setAvailableStock(

Number(

product.stock_quantity ??

product.stock ??

0

)

);



setUnitPrice(

Number(
product.unit_price || 0
)

);



}



};







const subtotal =
useMemo(()=>{


return quantity * unitPrice;


},[
quantity,
unitPrice
]);




const discountAmount =
useMemo(()=>{


return (
subtotal *
discount
)/100;


},[
subtotal,
discount
]);




const taxAmount =
useMemo(()=>{


return (

(
subtotal -
discountAmount
)
*
tax

)/100;


},[
subtotal,
discountAmount,
tax
]);




const totalAmount =
useMemo(()=>{


return (

subtotal -
discountAmount +
taxAmount

);


},[
subtotal,
discountAmount,
taxAmount
]);

const handleUpdate = async()=>{


if(!customerName.trim()){


setSnackbar({

open:true,

message:
"Customer name required",

type:"error"

});


return;


}





if(!productId){


setSnackbar({

open:true,

message:
"Please select product",

type:"error"

});


return;


}






if(quantity<=0){


setSnackbar({

open:true,

message:
"Quantity must be greater than zero",

type:"error"

});


return;


}






if(quantity>availableStock){


setSnackbar({

open:true,

message:
"Insufficient stock available",

type:"error"

});


return;


}






if(unitPrice<0){


setSnackbar({

open:true,

message:
"Unit price cannot be negative",

type:"error"

});


return;


}






if(discount<0 || discount>100){


setSnackbar({

open:true,

message:
"Invalid discount",

type:"error"

});


return;


}






if(tax<0){


setSnackbar({

open:true,

message:
"Tax cannot be negative",

type:"error"

});


return;


}





if(discountAmount>subtotal){


setSnackbar({

open:true,

message:
"Discount exceeds product value",

type:"error"

});


return;


}






try{


setLoading(true);





await updateSale(

Number(id),

{


customer_name:
customerName,


sales_channel:
salesChannel,


payment_method:
paymentMethod,



items:[

{

product_id:
Number(productId),


quantity,


unit_price:
unitPrice,


discount,


tax

}

]


}

);







setSnackbar({

open:true,

message:
"Sale updated successfully",

type:"success"

});






setTimeout(()=>{


navigate("/sales");


},1000);





}

catch(error){


console.log(error);



setSnackbar({

open:true,

message:
"Failed to update sale",

type:"error"

});



}

finally{


setLoading(false);


}



};









return (



<Box

sx={{

minHeight:"100vh",

background:
"linear-gradient(135deg,#020617,#0f172a)",

py:5

}}

>



<Container maxWidth="md">





<Paper

sx={{

p:5,

background:"#111827",

borderRadius:4

}}

>





<Typography

variant="h4"

fontWeight="700"

color="white"

mb={4}

>

Edit Sale

</Typography>







<Box

display="flex"

flexDirection="column"

gap={3}

>







<TextField

label="Customer Name"

value={customerName}

fullWidth

onChange={(e)=>

setCustomerName(
e.target.value
)

}

sx={textFieldStyle}

/>









<TextField

select

label="Product"

value={productId}

fullWidth

onChange={(e)=>

handleProductChange(
e.target.value
)

}

sx={textFieldStyle}

>




{

products.length>0 ?


products.map((product:any)=>(


<MenuItem

key={product.id}

value={product.id}

>


{product.name}


</MenuItem>


))


:


<MenuItem disabled>

No products available

</MenuItem>



}



</TextField>

<TextField

label="Category"

value={category}

fullWidth

InputProps={{

readOnly:true

}}

sx={textFieldStyle}

/>







<TextField

label="SKU"

value={sku}

fullWidth

InputProps={{

readOnly:true

}}

sx={textFieldStyle}

/>








<TextField

label="Available Stock"

value={availableStock}

fullWidth

InputProps={{

readOnly:true

}}

sx={textFieldStyle}

/>







<TextField

label="Quantity"

type="number"

value={quantity}

fullWidth

onChange={(e)=>

setQuantity(
Number(
e.target.value
)

)

}

sx={textFieldStyle}

/>







<TextField

label="Unit Price"

type="number"

value={unitPrice}

fullWidth

onChange={(e)=>

setUnitPrice(
Number(
e.target.value
)

)

}

sx={textFieldStyle}

/>







<TextField

label="Discount (%)"

type="number"

value={discount}

fullWidth

onChange={(e)=>

setDiscount(
Number(
e.target.value
)

)

}

sx={textFieldStyle}

/>







<TextField

label="Tax (%)"

type="number"

value={tax}

fullWidth

onChange={(e)=>

setTax(
Number(
e.target.value
)

)

}

sx={textFieldStyle}

/>








<TextField

select

label="Sales Channel"

value={salesChannel}

fullWidth

onChange={(e)=>

setSalesChannel(
e.target.value
)

}

sx={textFieldStyle}

>



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

label="Payment Method"

value={paymentMethod}

fullWidth

onChange={(e)=>

setPaymentMethod(
e.target.value
)

}

sx={textFieldStyle}

>



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









<Paper

sx={{

p:3,

background:"#1e293b",

color:"#fff",

borderRadius:3

}}

>



<Typography

variant="h6"

fontWeight="700"

mb={2}

>

Invoice Summary

</Typography>







<Typography>

Product :

{" "}

{productName || "-"}

</Typography>






<Typography

mt={1}

>

Category :

{" "}

{category || "-"}

</Typography>







<Typography

mt={1}

>

Subtotal :

₹{subtotal.toFixed(2)}

</Typography>








<Typography

mt={1}

>

Discount :

₹{discountAmount.toFixed(2)}

</Typography>








<Typography

mt={1}

>

Tax :

₹{taxAmount.toFixed(2)}

</Typography>









<Typography

fontWeight="700"

fontSize="20px"

mt={2}

>

Final Amount :

₹{totalAmount.toFixed(2)}

</Typography>





</Paper>


<Box

display="flex"

justifyContent="flex-end"

gap={2}

mt={2}

>




<Button

variant="outlined"

onClick={()=>navigate("/sales")}

sx={{

color:"#fff",

borderColor:"#64748b"

}}

>


Cancel

</Button>







<Button

variant="contained"

disabled={

loading ||

quantity > availableStock

}

onClick={handleUpdate}

>


{

loading

?

"Updating..."

:

"Update Sale"

}



</Button>






</Box>






</Box>






</Paper>






</Container>






<Snackbar


open={snackbar.open}



autoHideDuration={3000}



onClose={()=>


setSnackbar({

...snackbar,

open:false

})


}



>



<Alert


severity={snackbar.type}



onClose={()=>


setSnackbar({

...snackbar,

open:false

})


}



variant="filled"

>



{snackbar.message}



</Alert>



</Snackbar>







</Box>



);



}