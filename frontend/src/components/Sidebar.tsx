import {
  Avatar,
  Box,
  Divider,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material";

import {
  Dashboard,
  People,
  Inventory2,
  Assessment,
  Analytics,
  Settings,
  Logout,
  Business,
} from "@mui/icons-material";

import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logoutUser, user } = useAuth();

  const menu = [
    {
      text: "Dashboard",
      icon: <Dashboard />,
      path: "/dashboard",
    },
    {
      text: "Users",
      icon: <People />,
      path: "/users",
    },
    {
      text: "Products",
      icon: <Inventory2 />,
      path: "/products",
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
      text: "Settings",
      icon: <Settings />,
      path: "/profile",
    },
  ];

  return (
    <Box
      sx={{
        width: 260,
        height: "100vh",
        bgcolor: "#111827",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        borderRight: "1px solid #1F2937",
        position: "fixed",
        left: 0,
        top: 0,
      }}
    >
      {/* Logo */}

      <Box
        sx={{
          p: 3,
          display: "flex",
          alignItems: "center",
          gap: 2,
        }}
      >
        <Avatar
          sx={{
            bgcolor: "#2563EB",
            width: 52,
            height: 52,
          }}
        >
          <Business />
        </Avatar>

        <Box>
          <Typography fontWeight={700} fontSize={20}>
            RetailPulse
          </Typography>

          <Typography
            fontSize={12}
            color="#9CA3AF"
          >
            Analytics
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ borderColor: "#374151" }} />

      {/* Menu */}

      <List sx={{ mt: 2, px: 1 }}>
        {menu.map((item) => (
          <ListItemButton
            key={item.text}
            selected={location.pathname === item.path}
            onClick={() => navigate(item.path)}
            sx={{
              borderRadius: 3,
              mb: 1,

              "&.Mui-selected": {
                bgcolor: "#2563EB",
              },

              "&.Mui-selected:hover": {
                bgcolor: "#2563EB",
              },

              "&:hover": {
                bgcolor: "#1F2937",
              },
            }}
          >
            <ListItemIcon
              sx={{
                color: "#fff",
                minWidth: 42,
              }}
            >
              {item.icon}
            </ListItemIcon>

            <ListItemText primary={item.text} />
          </ListItemButton>
        ))}
      </List>

      <Box sx={{ flexGrow: 1 }} />

      <Divider sx={{ borderColor: "#374151" }} />

      {/* User */}

      <Box sx={{ p: 3 }}>
        <Typography fontWeight={600}>
          {user?.name}
        </Typography>

        <Typography
          color="#9CA3AF"
          fontSize={13}
        >
          {user?.role}
        </Typography>

        <ListItemButton
          onClick={async () => {
            await logoutUser();
            navigate("/login");
          }}
          sx={{
            mt: 2,
            borderRadius: 2,
            bgcolor: "#DC2626",

            "&:hover": {
              bgcolor: "#B91C1C",
            },
          }}
        >
          <ListItemIcon sx={{ color: "#fff" }}>
            <Logout />
          </ListItemIcon>

          <ListItemText primary="Logout" />
        </ListItemButton>
      </Box>
    </Box>
  );
}