import {
  Dashboard,
  Category,
  Inventory2,
  Assessment,
  Analytics,
  Warehouse,
  Person,
  PointOfSale,
  History,
  People,
  Insights,
  TrendingUp,
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

const SIDEBAR_WIDTH = 280;

const menus = [
  { text: "Dashboard", icon: <Dashboard />, path: "/" },
  { text: "Categories", icon: <Category />, path: "/categories" },
  { text: "Products", icon: <Inventory2 />, path: "/products" },
  { text: "Product Dashboard", icon: <Assessment />, path: "/product-dashboard" },
  { text: "Inventory", icon: <Warehouse />, path: "/inventory" },
  { text: "Sales", icon: <PointOfSale />, path: "/sales" },
  { text: "Customers", icon: <People />, path: "/customers" },
  { text: "Customer Analytics", icon: <Insights />, path: "/customers/analytics" },
  { text: "Reports", icon: <Assessment />, path: "/reports" },
  { text: "Analytics", icon: <Analytics />, path: "/analytics" },
  { text: "Demand Forecast", icon: <TrendingUp />, path: "/forecast" },
  { text: "Audit Logs", icon: <History />, path: "/audit-logs" },
  { text: "Profile", icon: <Person />, path: "/profile" },
];

export { SIDEBAR_WIDTH };

export default function Sidebar() {
  const location = useLocation();

  const isSelected = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }

    if (path === "/customers") {
      return location.pathname === "/customers";
    }

    return location.pathname.startsWith(path);
  };

  return (
    <Box
      sx={{
        width: SIDEBAR_WIDTH,
        height: "100vh",
        bgcolor: "#0B1220",
        color: "white",
        position: "fixed",
        left: 0,
        top: 0,
        zIndex: 1200,
        borderRight: "1px solid #1E293B",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <Toolbar
        sx={{
          minHeight: "72px !important",
          px: 2.5,
        }}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mr: 1.5,
            background: "linear-gradient(135deg, #2563EB, #4F46E5)",
            boxShadow: "0 8px 20px rgba(37,99,235,0.3)",
          }}
        >
          <Typography
            sx={{
              fontWeight: 800,
              fontSize: 17,
            }}
          >
            R
          </Typography>
        </Box>

        <Box>
          <Typography
            sx={{
              fontWeight: 800,
              fontSize: 18,
              lineHeight: 1.1,
              letterSpacing: "-0.3px",
            }}
          >
            RetailPulse
          </Typography>

          <Typography
            sx={{
              fontSize: 10,
              color: "#64748B",
              mt: 0.4,
              letterSpacing: 1.2,
              textTransform: "uppercase",
            }}
          >
            Analytics Platform
          </Typography>
        </Box>
      </Toolbar>

      <Divider sx={{ borderColor: "#1E293B" }} />

      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          px: 1.5,
          py: 2,
          "&::-webkit-scrollbar": {
            width: 5,
          },
          "&::-webkit-scrollbar-track": {
            background: "transparent",
          },
          "&::-webkit-scrollbar-thumb": {
            background: "#334155",
            borderRadius: 10,
          },
        }}
      >
        <Typography
          sx={{
            px: 1.5,
            mb: 1,
            color: "#64748B",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: 1.2,
            textTransform: "uppercase",
          }}
        >
          Main Menu
        </Typography>

        <List disablePadding>
          {menus.map((item) => {
            const selected = isSelected(item.path);

            return (
              <ListItemButton
                key={item.text}
                component={Link}
                to={item.path}
                selected={selected}
                sx={{
                  minHeight: 46,
                  mb: 0.7,
                  px: 1.5,
                  borderRadius: 2.5,
                  color: "#94A3B8",
                  position: "relative",
                  transition: "all 0.2s ease",

                  "& .MuiListItemIcon-root": {
                    color: "#64748B",
                    minWidth: 38,
                    transition: "all 0.2s ease",
                  },

                  "& .MuiListItemText-primary": {
                    fontSize: 13.5,
                    fontWeight: 500,
                    transition: "all 0.2s ease",
                  },

                  "&:hover": {
                    bgcolor: "#172033",
                    color: "#F8FAFC",
                    transform: "translateX(2px)",

                    "& .MuiListItemIcon-root": {
                      color: "#60A5FA",
                    },
                  },

                  "&.Mui-selected": {
                    background:
                      "linear-gradient(90deg, rgba(37,99,235,0.95), rgba(79,70,229,0.9))",
                    color: "#FFFFFF",
                    boxShadow: "0 8px 22px rgba(37,99,235,0.22)",

                    "& .MuiListItemIcon-root": {
                      color: "#FFFFFF",
                    },

                    "& .MuiListItemText-primary": {
                      fontWeight: 700,
                    },

                    "&:before": {
                      content: '""',
                      position: "absolute",
                      left: 0,
                      top: 9,
                      bottom: 9,
                      width: 3,
                      borderRadius: 5,
                      bgcolor: "#FFFFFF",
                    },
                  },

                  "&.Mui-selected:hover": {
                    background:
                      "linear-gradient(90deg, rgba(37,99,235,0.95), rgba(79,70,229,0.9))",
                  },
                }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>

                <ListItemText primary={item.text} />
              </ListItemButton>
            );
          })}
        </List>
      </Box>

      <Box
        sx={{
          p: 1.5,
          borderTop: "1px solid #1E293B",
        }}
      >
        <Box
          sx={{
            px: 1.5,
            py: 1.2,
            borderRadius: 2.5,
            bgcolor: "#111827",
            border: "1px solid #1E293B",
          }}
        >
          <Typography
            sx={{
              color: "#64748B",
              fontSize: 10,
              textTransform: "uppercase",
              letterSpacing: 1,
              fontWeight: 700,
            }}
          >
            Platform
          </Typography>

          <Typography
            sx={{
              color: "#CBD5E1",
              fontSize: 12,
              mt: 0.5,
            }}
          >
            Secure Retail Analytics
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}