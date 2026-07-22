import { Box } from "@mui/material";

import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

import { useState } from "react";


export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {

  const drawerWidth = 260;

  const [mobileOpen,setMobileOpen] =
    useState(false);


  return (

    <Box
sx={{
  minHeight:"100vh",

  background:
  "linear-gradient(135deg,#020617,#0f172a,#1e293b)",

}}
>

<Sidebar />

<Navbar
 drawerWidth={drawerWidth}
 onDrawerToggle={()=>
 setMobileOpen(!mobileOpen)
}
/>


<Box
component="main"
sx={{

ml:`${drawerWidth}px`,

pt:10,

px:4,

minHeight:"100vh",

background:
"linear-gradient(135deg,#020617,#0f172a,#1e293b)",

}}
>

{children}

</Box>


</Box>