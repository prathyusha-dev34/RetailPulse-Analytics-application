import {
  Dashboard,
  Category,
  Inventory2,
  Assessment,
  Analytics,
  Warehouse,
  Person,
  PointOfSale,
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

import {
  Link,
  useLocation,
} from "react-router-dom";

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
    text: "Sales",
    icon: <PointOfSale />,
    path: "/sales",
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
        borderRight: "1px solid #1E293B",
      }}
    >
      <Toolbar>
        <Typography
          variant="h6"
          fontWeight={700}
          color="#FFFFFF"
        >
          RetailPulse
        </Typography>
      </Toolbar>

      <Divider
        sx={{
          bgcolor: "#334155",
        }}
      />

      <List
        sx={{
          mt: 1,
          px: 1,
        }}
      >
        {menus.map((item) => (
          <ListItemButton
            key={item.text}
            component={Link}
            to={item.path}
            selected={location.pathname === item.path}
            sx={{
              mb: 0.8,
              borderRadius: "12px",
              color: "#CBD5E1",
              transition: "all 0.25s ease",

              "& .MuiListItemIcon-root": {
                color: "#CBD5E1",
                minWidth: 40,
                transition: "all 0.25s ease",
              },

              "& .MuiListItemText-primary": {
                fontWeight: 500,
              },

              "&.Mui-selected": {
                background:
                  "linear-gradient(90deg, #2563EB 0%, #3B82F6 100%)",
                color: "#FFFFFF",
                boxShadow:
                  "0 6px 16px rgba(37,99,235,0.35)",

                "& .MuiListItemIcon-root": {
                  color: "#FFFFFF",
                },

                "& .MuiListItemText-primary": {
                  fontWeight: 700,
                },
              },

              "&.Mui-selected:hover": {
                background:
                  "linear-gradient(90deg, #2563EB 0%, #3B82F6 100%)",
              },

              "&:hover": {
                bgcolor: "#1E293B",
                color: "#FFFFFF",

                "& .MuiListItemIcon-root": {
                  color: "#FFFFFF",
                },
              },
            }}
          >
            <ListItemIcon
              sx={{
                color: "inherit",
                minWidth: 40,
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