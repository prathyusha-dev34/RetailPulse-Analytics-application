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
} from "@mui/icons-material";

import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Topbar() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        bgcolor: "#0F172A",
        borderBottom: "1px solid #1E293B",
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
            py: 0.5,
            width: 350,
            bgcolor: "#1E293B",
            borderRadius: 3,
            boxShadow: "none",
          }}
        >
          <Search sx={{ color: "#94A3B8" }} />

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
            gap: 3,
          }}
        >
          <IconButton>
            <Badge badgeContent={3} color="error">
              <Notifications sx={{ color: "#fff" }} />
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
              {user?.name}
            </Typography>

            <Typography
              fontSize={12}
              color="#94A3B8"
            >
              {user?.role}
            </Typography>
          </Box>

          <Avatar
            sx={{
              bgcolor: "#2563EB",
              cursor: "pointer",
            }}
            onClick={() => navigate("/profile")}
          >
            {user?.name?.charAt(0).toUpperCase()}
          </Avatar>
        </Box>
      </Toolbar>
    </AppBar>
  );
}