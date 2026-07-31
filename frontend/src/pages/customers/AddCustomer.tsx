import {
  useState
} from "react";


import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";


import {
  useNavigate
} from "react-router-dom";


import {
  createCustomer
} from "../../services/customerService";



// ================================
// COMPONENT
// ================================


export default function AddCustomer(){


const navigate = useNavigate();



const [form,setForm] =
useState<any>({

full_name:"",
email:"",
phone_number:"",
date_of_birth:"",
gender:"",
address:"",
city:"",
state:"",
country:"India",
postal_code:"",
customer_type:"Retail",
preferred_sales_channel:"Online",
status:"ACTIVE"

});



const [error,setError] =
useState("");




// ================================
// INPUT HANDLER
// ================================


const handleChange =
(
e:any
)=>{


setForm({

...form,

[e.target.name]:
e.target.value

});


};





// ================================
// SUBMIT
// ================================


const handleSubmit =
async()=>{


try{


setError("");



if(!form.full_name){

setError(
"Full Name is required"
);

return;

}



if(!form.email){

setError(
"Email is required"
);

return;

}



if(!form.phone_number){

setError(
"Phone number is required"
);

return;

}



await createCustomer(
form
);



navigate(
"/customers"
);



}

catch(err:any){


console.log(
err
);


setError(
"Failed to create customer"
);


}


};




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

Add Customer

</Typography>




<Card

sx={{

background:"#1E293B",

color:"white"

}}

>


<CardContent>



<Grid

container

spacing={3}

>



<Grid item xs={12} md={6}>


<TextField

fullWidth

label="Full Name"

name="full_name"

value={
form.full_name
}

onChange={
handleChange
}

sx={{
background:"white"
}}

/>


</Grid>





<Grid item xs={12} md={6}>


<TextField

fullWidth

label="Email"

name="email"

value={
form.email
}

onChange={
handleChange
}

sx={{
background:"white"
}}

/>


</Grid>





<Grid item xs={12} md={6}>


<TextField

fullWidth

label="Phone Number"

name="phone_number"

value={
form.phone_number
}

onChange={
handleChange
}

sx={{
background:"white"
}}

/>


</Grid>





<Grid item xs={12} md={6}>


<TextField

fullWidth

type="date"

label="Date Of Birth"

name="date_of_birth"

InputLabelProps={{
shrink:true
}}

value={
form.date_of_birth
}

onChange={
handleChange
}

sx={{
background:"white"
}}

/>


</Grid>






<Grid item xs={12} md={6}>


<TextField

select

fullWidth

label="Gender"

name="gender"

value={
form.gender
}

onChange={
handleChange
}

sx={{
background:"white"
}}

>


<MenuItem value="Male">
Male
</MenuItem>


<MenuItem value="Female">
Female
</MenuItem>


<MenuItem value="Other">
Other
</MenuItem>


</TextField>


</Grid>





<Grid item xs={12}>


<TextField

fullWidth

label="Address"

name="address"

value={
form.address
}

onChange={
handleChange
}

sx={{
background:"white"
}}

/>


</Grid>





<Grid item xs={12} md={4}>


<TextField

fullWidth

label="City"

name="city"

value={
form.city
}

onChange={
handleChange
}

sx={{
background:"white"
}}

/>


</Grid>





<Grid item xs={12} md={4}>


<TextField

fullWidth

label="State"

name="state"

value={
form.state
}

onChange={
handleChange
}

sx={{
background:"white"
}}

/>


</Grid>





<Grid item xs={12} md={4}>


<TextField

fullWidth

label="Postal Code"

name="postal_code"

value={
form.postal_code
}

onChange={
handleChange
}

sx={{
background:"white"
}}

/>


</Grid>






<Grid item xs={12} md={6}>


<TextField

select

fullWidth

label="Customer Type"

name="customer_type"

value={
form.customer_type
}

onChange={
handleChange
}

sx={{
background:"white"
}}

>


<MenuItem value="Retail">
Retail
</MenuItem>


<MenuItem value="Wholesale">
Wholesale
</MenuItem>


<MenuItem value="VIP">
VIP
</MenuItem>


</TextField>


</Grid>






<Grid item xs={12} md={6}>


<TextField

select

fullWidth

label="Preferred Sales Channel"

name="preferred_sales_channel"

value={
form.preferred_sales_channel
}

onChange={
handleChange
}

sx={{
background:"white"
}}

>


<MenuItem value="Online">
Online
</MenuItem>


<MenuItem value="Retail Store">
Retail Store
</MenuItem>


<MenuItem value="Marketplace">
Marketplace
</MenuItem>


</TextField>


</Grid>






</Grid>





{
error &&

<Typography

color="error"

mt={3}

>

{error}

</Typography>

}





<Box

display="flex"

gap={2}

mt={4}

>



<Button

variant="contained"

onClick={
handleSubmit
}

>

Save Customer

</Button>




<Button

variant="outlined"

onClick={()=>
navigate(
"/customers"
)
}

>

Cancel

</Button>



</Box>




</CardContent>


</Card>



</Box>


);


}