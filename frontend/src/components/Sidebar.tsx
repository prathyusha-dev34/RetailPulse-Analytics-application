import {
  Dashboard,
  Category,
  Inventory2,
  Assessment,
  Analytics,
  Warehouse,
  Person,
} from "@mui/icons-material";

import {
  Box,
  Divider,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
} from "@mui/material";

import { Link, useLocation } from "react-router-dom";

const menus = [
  {
    text: "Dashboard",
    icon: <Dashboard />,
    path: "/",
  },
  {
    text: "Categories",
    icon: <Category />,
    path: "/categories",
  },
  {
    text: "Products",
    icon: <Inventory2 />,
    path: "/products",
  },
  {
    text: "Product Dashboard",
    icon: <Assessment />,
    path: "/product-dashboard",
  },
  {
    text: "Inventory",
    icon: <Warehouse />,
    path: "/inventory",
  },
  {
    text: "Reports",
    icon: <Assessment />,
    path: "/reports",
  },
  {
    text: "Analytics",
    icon: <Analytics />,
    path: "/analytics",
  },
  {
    text: "Profile",
    icon: <Person />,
    path: "/profile",
  },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <Box
      sx={{
        width: 260,
        height: "100vh",
        bgcolor: "#111827",
        color: "white",
        position: "fixed",
        left: 0,
        top: 0,
      }}
    >
      <Toolbar>
        <Typography
          variant="h6"
          fontWeight={700}
        >
          RetailPulse
        </Typography>
      </Toolbar>

      <Divider sx={{ bgcolor: "#334155" }} />

      <List>
        {menus.map((item) => (
          <ListItemButton
            key={item.text}
            component={Link}
            to={item.path}
            selected={
              location.pathname === item.path
            }
            sx={{
              mx: 1,
              my: 0.5,
              borderRadius: 2,
              color: "white",

              "&.Mui-selected": {
                bgcolor: "#2563EB",
              },

              "&.Mui-selected:hover": {
                bgcolor: "#2563EB",
              },

              "&:hover": {
                bgcolor: "#1E293B",
              },
            }}
          >
            <ListItemIcon
              sx={{
                color: "white",
              }}
            >
              {item.icon}
            </ListItemIcon>

            <ListItemText
              primary={item.text}
            />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );
}