import {
  AppBar,
  Avatar,
  Badge,
  Box,
  IconButton,
  InputBase,
  Paper,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";

import {
  Notifications,
  Search,
  Logout,
} from "@mui/icons-material";

import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import { useEffect, useState } from "react";
import { getUnreadNotifications } from "../api/notificationApi";

const SIDEBAR_WIDTH = 280;

export default function Topbar() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnreadNotifications = async () => {
      try {
        const data = await getUnreadNotifications();

        const notifications = Array.isArray(data)
          ? data
          : data.notifications || data.data || [];

        setUnreadCount(notifications.length);
      } catch (error) {
        console.error(
          "Failed to fetch unread notifications",
          error
        );
      }
    };

    fetchUnreadNotifications();

    const interval = setInterval(() => {
      fetchUnreadNotifications();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  function handleLogout() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");

    navigate("/login");
  }

  const userName = user?.name || "User";
  const userRole = user?.role || "Viewer";
  const avatarLetter = userName[0]?.toUpperCase() || "U";

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        ml: `${SIDEBAR_WIDTH}px`,
        width: `calc(100% - ${SIDEBAR_WIDTH}px)`,
        bgcolor: "rgba(15,23,42,0.94)",
        backdropFilter: "blur(14px)",
        borderBottom: "1px solid #1E293B",
        zIndex: 1100,
      }}
    >
      <Toolbar
        sx={{
          minHeight: "72px !important",
          px: { xs: 2, md: 3 },
          display: "flex",
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            display: "flex",
            alignItems: "center",
            px: 1.5,
            py: 0.3,
            width: { xs: 180, sm: 280, md: 360 },
            height: 42,
            bgcolor: "#111827",
            borderRadius: 2.5,
            border: "1px solid #263449",
            transition: "all 0.2s ease",

            "&:focus-within": {
              borderColor: "#3B82F6",
              boxShadow: "0 0 0 3px rgba(59,130,246,0.12)",
            },
          }}
        >
          <Search
            sx={{
              color: "#64748B",
              fontSize: 21,
            }}
          />

          <InputBase
            placeholder="Search dashboard..."
            sx={{
              ml: 1,
              color: "#F8FAFC",
              flex: 1,
              fontSize: 13,

              "& input::placeholder": {
                color: "#64748B",
                opacity: 1,
              },
            }}
          />
        </Paper>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: { xs: 0.8, sm: 1.5 },
          }}
        >
          <Tooltip title="Notifications">
            <IconButton
              onClick={() => navigate("/notifications")}
              sx={{
                width: 42,
                height: 42,
                color: "#CBD5E1",
                bgcolor: "#111827",
                border: "1px solid #263449",
                borderRadius: 2.5,

                "&:hover": {
                  bgcolor: "#1E293B",
                  color: "#FFFFFF",
                  borderColor: "#334155",
                },
              }}
            >
              <Badge
                badgeContent={unreadCount}
                color="error"
                invisible={unreadCount === 0}
                max={99}
              >
                <Notifications fontSize="small" />
              </Badge>
            </IconButton>
          </Tooltip>

          <Box
            sx={{
              display: { xs: "none", sm: "block" },
              width: "1px",
              height: 32,
              bgcolor: "#263449",
              mx: 0.5,
            }}
          />

          <Box
            onClick={() => navigate("/profile")}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.2,
              px: 1,
              py: 0.6,
              borderRadius: 2.5,
              cursor: "pointer",
              transition: "all 0.2s ease",

              "&:hover": {
                bgcolor: "#111827",
              },
            }}
          >
            <Box
              sx={{
                display: { xs: "none", sm: "block" },
                textAlign: "right",
              }}
            >
              <Typography
                sx={{
                  color: "#F8FAFC",
                  fontSize: 13,
                  fontWeight: 700,
                  lineHeight: 1.3,
                }}
              >
                {userName}
              </Typography>

              <Typography
                sx={{
                  color: "#64748B",
                  fontSize: 11,
                  mt: 0.2,
                  textTransform: "capitalize",
                }}
              >
                {userRole}
              </Typography>
            </Box>

            <Avatar
              sx={{
                width: 38,
                height: 38,
                bgcolor: "#2563EB",
                background:
                  "linear-gradient(135deg,#2563EB,#4F46E5)",
                fontSize: 14,
                fontWeight: 800,
                boxShadow: "0 5px 15px rgba(37,99,235,0.25)",
              }}
            >
              {avatarLetter}
            </Avatar>
          </Box>

          <Tooltip title="Logout">
            <IconButton
              onClick={handleLogout}
              sx={{
                width: 42,
                height: 42,
                color: "#94A3B8",
                bgcolor: "#111827",
                border: "1px solid #263449",
                borderRadius: 2.5,

                "&:hover": {
                  bgcolor: "rgba(239,68,68,0.12)",
                  color: "#F87171",
                  borderColor: "rgba(239,68,68,0.3)",
                },
              }}
            >
              <Logout fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
}