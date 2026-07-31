import {
  useEffect,
  useState
} from "react";


import {
  useNavigate,
  useParams
} from "react-router-dom";


import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  MenuItem,
  TextField,
  Typography
} from "@mui/material";


import {
  getCustomer,
  updateCustomer
} from "../../services/customerService";



// ================================
// COMPONENT
// ================================


export default function EditCustomer(){


const {
id
}=useParams();


const navigate =
useNavigate();



const [form,setForm] =
useState<any>({});


const [error,setError] =
useState("");

const [loading,setLoading] =
useState(true);




// ================================
// LOAD CUSTOMER
// ================================


const loadCustomer =
async()=>{


try{


const response =
await getCustomer(
id as string
);


setForm(response);


}

catch(err){

console.log(
"Customer load error",
err
);

setError(
"Unable to load customer"
);

}

finally{

setLoading(false);

}


};





useEffect(()=>{

loadCustomer();

},[]);






// ================================
// HANDLE INPUT
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
// UPDATE
// ================================


const handleSubmit =
async()=>{


try{


setError("");



if(!form.full_name){

setError(
"Full name required"
);

return;

}



if(!form.email){

setError(
"Email required"
);

return;

}



await updateCustomer(

id as string,

form

);



navigate(
"/customers"
);



}

catch(error){

console.log(
error
);

setError(
"Update failed"
);

}


};






if(loading){


return (

<Box
sx={{
p:3,
background:"#0F172A",
minHeight:"100vh"
}}
>

<Typography color="white">

Loading...

</Typography>


</Box>

);


}







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

Edit Customer

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
form.full_name || ""
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
form.email || ""
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
form.phone_number || ""
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

type="date"

fullWidth

label="Date Of Birth"

name="date_of_birth"

InputLabelProps={{
shrink:true
}}

value={
form.date_of_birth || ""
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
form.gender || ""
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
form.address || ""
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
form.city || ""
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
form.state || ""
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
form.postal_code || ""
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
form.customer_type || ""
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

label="Status"

name="status"

value={
form.status || ""
}

onChange={
handleChange
}

sx={{
background:"white"
}}

>


<MenuItem value="ACTIVE">
Active
</MenuItem>


<MenuItem value="INACTIVE">
Inactive
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

Update Customer

</Button>




<Button

variant="outlined"

onClick={()=>
navigate("/customers")
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