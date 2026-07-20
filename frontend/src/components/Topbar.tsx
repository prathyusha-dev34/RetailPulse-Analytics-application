import {
  AppBar,
  Avatar,
  Badge,
  Box,
  IconButton,
  InputBase,
  Paper,
  Toolbar,
  Typography,
} from "@mui/material";

import {
  Notifications,
  Search,
  Logout,
} from "@mui/icons-material";

import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Topbar() {
  const navigate = useNavigate();

  const { user } = useAuth();

  function handleLogout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");

    navigate("/login");
  }

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        bgcolor: "#0F172A",
        borderBottom: "1px solid #334155",
        ml: "260px",
        width: "calc(100% - 260px)",
      }}
    >
      <Toolbar
        sx={{
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        {/* Search */}

        <Paper
          sx={{
            display: "flex",
            alignItems: "center",
            px: 2,
            py: 0.7,
            width: 350,
            bgcolor: "#1E293B",
            borderRadius: 3,
            border: "1px solid #334155",
            boxShadow: "none",
          }}
        >
          <Search
            sx={{
              color: "#94A3B8",
            }}
          />

          <InputBase
            placeholder="Search..."
            sx={{
              ml: 1,
              color: "#fff",
              flex: 1,
            }}
          />
        </Paper>

        {/* Right Side */}

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
        >
          <IconButton
            sx={{
              bgcolor: "#1E293B",
              "&:hover": {
                bgcolor: "#334155",
              },
            }}
          >
            <Badge
              badgeContent={3}
              color="error"
            >
              <Notifications
                sx={{
                  color: "#fff",
                }}
              />
            </Badge>
          </IconButton>

          <Box
            sx={{
              textAlign: "right",
            }}
          >
            <Typography
              fontWeight={700}
              color="#fff"
            >
              {user?.name || "User"}
            </Typography>

            <Typography
              fontSize={12}
              color="#94A3B8"
            >
              {user?.role || "Viewer"}
            </Typography>
          </Box>

          <Avatar
            sx={{
              bgcolor: "#3B82F6",
              fontWeight: 700,
              cursor: "pointer",
            }}
            onClick={() =>
              navigate("/profile")
            }
          >
            {user?.name?.[0]?.toUpperCase() ||
              "U"}
          </Avatar>

          <IconButton
            onClick={handleLogout}
            sx={{
              bgcolor: "#1E293B",
              "&:hover": {
                bgcolor: "#334155",
              },
            }}
          >
            <Logout
              sx={{
                color: "#fff",
              }}
            />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
}