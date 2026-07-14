import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import {
  People,
  Inventory2,
  ShoppingCart,
  Assessment,
  Analytics,
  Visibility,
  ArrowForward,
} from "@mui/icons-material";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getAdminDashboard } from "../api/authApi";
import { useAuth } from "../context/AuthContext";

interface DashboardData {
  total_users?: number;
  total_products?: number;
  total_sales?: number;
  total_reports?: number;
  total_analysts?: number;
  total_viewers?: number;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [dashboard, setDashboard] = useState<DashboardData>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const res = await getAdminDashboard();
      setDashboard(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container sx={{ mt: 10 }}>
        <Typography variant="h5" textAlign="center">
          Loading Dashboard...
        </Typography>
      </Container>
    );
  }

  const cards = [
    {
      title: "Users",
      value: dashboard.total_users ?? 0,
      icon: <People sx={{ fontSize: 35 }} />,
      color: "#2563EB",
    },
    {
      title: "Products",
      value: dashboard.total_products ?? 0,
      icon: <Inventory2 sx={{ fontSize: 35 }} />,
      color: "#16A34A",
    },
    {
      title: "Sales",
      value: dashboard.total_sales ?? 0,
      icon: <ShoppingCart sx={{ fontSize: 35 }} />,
      color: "#EA580C",
    },
    {
      title: "Reports",
      value: dashboard.total_reports ?? 0,
      icon: <Assessment sx={{ fontSize: 35 }} />,
      color: "#7C3AED",
    },
    {
      title: "Analysts",
      value: dashboard.total_analysts ?? 0,
      icon: <Analytics sx={{ fontSize: 35 }} />,
      color: "#DB2777",
    },
    {
      title: "Viewers",
      value: dashboard.total_viewers ?? 0,
      icon: <Visibility sx={{ fontSize: 35 }} />,
      color: "#0891B2",
    },
  ];

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "#F5F7FB",
        py: 5,
      }}
    >
      <Container maxWidth="xl">

        {/* Header */}

        <Paper
          elevation={0}
          sx={{
            mb: 5,
            p: 4,
            borderRadius: 4,
            background:
              "linear-gradient(135deg,#2563EB,#4F46E5)",
            color: "#fff",
          }}
        >
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar
                sx={{
                  width: 64,
                  height: 64,
                  bgcolor: "#fff",
                  color: "#2563EB",
                  fontWeight: 700,
                  fontSize: 28,
                }}
              >
                {user?.name?.charAt(0)}
              </Avatar>

              <Box>
                <Typography variant="h4" fontWeight={700}>
                  Welcome, {user?.name}
                </Typography>

                <Typography sx={{ opacity: 0.9 }}>
                  RetailPulse Analytics Dashboard
                </Typography>
              </Box>
            </Stack>

            <Button
              variant="contained"
              endIcon={<ArrowForward />}
              onClick={() => navigate("/profile")}
              sx={{
                bgcolor: "#fff",
                color: "#2563EB",
                borderRadius: 3,
                px: 3,
                fontWeight: 600,
                "&:hover": {
                  bgcolor: "#EEF2FF",
                },
              }}
            >
              My Profile
            </Button>
          </Stack>
        </Paper>

        {/* Cards */}

        <Grid container spacing={3}>
          {cards.map((card) => (
            <Grid item xs={12} sm={6} md={4} key={card.title}>
              <Card
                sx={{
                  borderRadius: 4,
                  transition: "0.3s",
                  "&:hover": {
                    transform: "translateY(-6px)",
                    boxShadow: 8,
                  },
                }}
              >
                <CardContent>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Box>
                      <Typography
                        color="text.secondary"
                        gutterBottom
                      >
                        {card.title}
                      </Typography>

                      <Typography
                        variant="h3"
                        fontWeight={700}
                      >
                        {card.value}
                      </Typography>
                    </Box>

                    <Avatar
                      sx={{
                        bgcolor: card.color,
                        width: 60,
                        height: 60,
                      }}
                    >
                      {card.icon}
                    </Avatar>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Bottom Welcome Card */}

        <Paper
          sx={{
            mt: 5,
            p: 4,
            borderRadius: 4,
          }}
        >
          <Typography
            variant="h5"
            fontWeight={700}
            gutterBottom
          >
            Welcome to RetailPulse 🚀
          </Typography>

          <Typography color="text.secondary">
            Monitor users, products, sales, reports and analytics from
            one modern dashboard. This panel gives you a quick overview
            of your platform activity.
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
}