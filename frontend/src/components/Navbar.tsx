import { useState } from "react";

import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
  Badge,
  Menu,
  MenuItem,
  Box,
  Tooltip,
  Divider,
  useTheme,
  useMediaQuery,
} from "@mui/material";


import MenuIcon from "@mui/icons-material/Menu";
import NotificationsIcon from "@mui/icons-material/Notifications";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LogoutIcon from "@mui/icons-material/Logout";


import { useNavigate } from "react-router-dom";


import { useAuth } from "../context/AuthContext";

import { logoutUser } from "../api/authApi";



interface NavbarProps {

  drawerWidth: number;

  onDrawerToggle: () => void;

}




export default function Navbar({
  drawerWidth,
  onDrawerToggle,
}: NavbarProps) {


  const navigate = useNavigate();


  const theme = useTheme();


  const mobile =
    useMediaQuery(
      theme.breakpoints.down("md")
    );



  const {
    user,
    logout
  } = useAuth();




  const [anchorEl, setAnchorEl] =
    useState<null | HTMLElement>(null);



  const open = Boolean(anchorEl);




  const handleOpen = (
    event: React.MouseEvent<HTMLElement>
  ) => {

    setAnchorEl(
      event.currentTarget
    );

  };




  const handleClose = () => {

    setAnchorEl(null);

  };





  const handleLogout = async () => {

    try {

      await logoutUser();

    } catch {

      console.log(
        "Logout API failed"
      );

    }


    logout();


    navigate("/login");

  };







  return (

    <AppBar

      position="fixed"

      elevation={0}

      sx={{

        width: mobile
          ? "100%"
          : `calc(100% - ${drawerWidth}px)`,

        ml: mobile
          ? 0
          : `${drawerWidth}px`,

        background:"#fff",

        color:"#111827",

        borderBottom:
          "1px solid #e5e7eb",

      }}

    >



      <Toolbar>



        {
          mobile && (

            <IconButton

              onClick={
                onDrawerToggle
              }

              edge="start"

            >

              <MenuIcon />

            </IconButton>

          )
        }





        <Typography

          variant="h6"

          sx={{

            fontWeight:700,

            flexGrow:1,

          }}

        >

          RetailPulse Dashboard


        </Typography>







        <IconButton>


          <Badge

            badgeContent={4}

            color="error"

          >

            <NotificationsIcon />


          </Badge>


        </IconButton>








        <Tooltip title="Account">


          <IconButton

            onClick={handleOpen}

          >


            <Avatar

              sx={{

                bgcolor:"#1976d2",

                fontWeight:700,

              }}

            >

              {
                user?.name
                ? user.name
                    .charAt(0)
                    .toUpperCase()
                : "U"
              }


            </Avatar>


          </IconButton>


        </Tooltip>









        <Menu


          anchorEl={anchorEl}


          open={open}


          onClose={handleClose}



          anchorOrigin={{

            vertical:"bottom",

            horizontal:"right",

          }}



          transformOrigin={{

            vertical:"top",

            horizontal:"right",

          }}



        >





          <MenuItem

            onClick={() => {

              navigate("/profile");

              handleClose();

            }}

          >


            <AccountCircleIcon

              sx={{
                mr:1
              }}

            />


            Profile


          </MenuItem>








          <Divider />








          <MenuItem


            onClick={async () => {


              handleClose();


              await handleLogout();


            }}


          >


            <LogoutIcon

              sx={{
                mr:1
              }}

            />

            Logout


          </MenuItem>






        </Menu>





      </Toolbar>



    </AppBar>


  );

}