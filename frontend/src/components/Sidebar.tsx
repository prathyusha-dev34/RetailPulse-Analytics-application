import {
  Drawer,
  Toolbar,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
} from "@mui/material";

import DashboardIcon from "@mui/icons-material/Dashboard";
import PersonIcon from "@mui/icons-material/Person";
import BusinessIcon from "@mui/icons-material/Business";
import LogoutIcon from "@mui/icons-material/Logout";

import { useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { logoutUser } from "../api/authApi";

interface SidebarProps {
  mobileOpen: boolean;
  drawerWidth: number;
  onClose: () => void;
}

export default function Sidebar({
  mobileOpen,
  drawerWidth,
  onClose,
}: SidebarProps) {
  const navigate = useNavigate();

  const location = useLocation();

  const { logout } = useAuth();

  const menuItems = [
    {
      text: "Dashboard",
      icon: <DashboardIcon />,
      path: "/dashboard",
    },
    {
      text: "Profile",
      icon: <PersonIcon />,
      path: "/profile",
    },
    {
      text: "Company",
      icon: <BusinessIcon />,
      path: "/company",
    },
  ];

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch {}

    logout();

    navigate("/login");
  };

  const drawer = (
    <>
      <Toolbar>
        <Typography
          variant="h5"
          fontWeight="bold"
          color="primary"
        >
          RetailPulse
        </Typography>
      </Toolbar>

      <Box sx={{ mt: 2 }}>
        <List>
          {menuItems.map((item) => (
            <ListItemButton
              key={item.text}
              selected={location.pathname === item.path}
              onClick={() => {
                navigate(item.path);
                onClose();
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>

              <ListItemText primary={item.text} />
            </ListItemButton>
          ))}

          <ListItemButton onClick={handleLogout}>
            <ListItemIcon>
              <LogoutIcon color="error" />
            </ListItemIcon>

            <ListItemText
              primary="Logout"
              primaryTypographyProps={{
                color: "error",
              }}
            />
          </ListItemButton>
        </List>
      </Box>
    </>
  );

  return (
    <>
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onClose}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: {
            xs: "block",
            md: "none",
          },
          "& .MuiDrawer-paper": {
            width: drawerWidth,
          },
        }}
      >
        {drawer}
      </Drawer>

      <Drawer
        variant="permanent"
        open
        sx={{
          display: {
            xs: "none",
            md: "block",
          },
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            borderRight: "1px solid #e5e7eb",
          },
        }}
      >
        {drawer}
      </Drawer>
    </>
  );
}