import { useEffect, useState } from "react";

import {
  Box,
  Container,
  Paper,
  Typography,
} from "@mui/material";

import Grid from "@mui/material/Grid";

import {
  People,
  Business,
  AdminPanelSettings,
  VerifiedUser,
  History,
  Security,
} from "@mui/icons-material";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import StatCard from "../components/StatCard";

import { getAdminDashboard } from "../api/authApi";
import { useAuth } from "../context/AuthContext";

interface DashboardData {
  total_companies: number;
  total_users: number;
  active_users: number;
  admin_users: number;
  total_audit_logs: number;
  total_refresh_tokens: number;
  user: string;
  role: string;
}

export default function Dashboard() {
  const { user } = useAuth();

  const [dashboard, setDashboard] =
    useState<DashboardData>({
      total_companies: 0,
      total_users: 0,
      active_users: 0,
      admin_users: 0,
      total_audit_logs: 0,
      total_refresh_tokens: 0,
      user: "",
      role: "",
    });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      const res = await getAdminDashboard();
      setDashboard(res.data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <Typography
        sx={{
          mt: 10,
          textAlign: "center",
          color: "white",
        }}
      >
        Loading Dashboard...
      </Typography>
    );
  }

  const cards = [
    {
      title: "Companies",
      value: dashboard.total_companies,
      color: "#2563EB",
      icon: <Business />,
    },
    {
      title: "Users",
      value: dashboard.total_users,
      color: "#22C55E",
      icon: <People />,
    },
    {
      title: "Active Users",
      value: dashboard.active_users,
      color: "#F59E0B",
      icon: <VerifiedUser />,
    },
    {
      title: "Admins",
      value: dashboard.admin_users,
      color: "#EC4899",
      icon: <AdminPanelSettings />,
    },
    {
      title: "Audit Logs",
      value: dashboard.total_audit_logs,
      color: "#8B5CF6",
      icon: <History />,
    },
    {
      title: "Refresh Tokens",
      value: dashboard.total_refresh_tokens,
      color: "#06B6D4",
      icon: <Security />,
    },
  ];

  const monthlyData = [
    { month: "Jan", value: 2 },
    { month: "Feb", value: 3 },
    { month: "Mar", value: 4 },
    { month: "Apr", value: 5 },
    { month: "May", value: dashboard.total_users },
  ];

  const pieData = [
    {
      name: "Active",
      value: dashboard.active_users,
    },
    {
      name: "Inactive",
      value:
        dashboard.total_users -
        dashboard.active_users,
    },
  ];

  const COLORS = [
    "#2563EB",
    "#22C55E",
  ];

  return (
    <Box
  sx={{
    display: "flex",
    minHeight: "100vh",
    bgcolor: "#0F172A",
  }}
>
  <Sidebar />

  <Box
    sx={{
      flex: 1,
      ml: "260px",
    }}
  >
    <Topbar />

    <Container
      maxWidth="xl"
      sx={{
        mt: 12,
        pb: 5,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 4,
          mb: 4,
          borderRadius: 4,
          background:
            "linear-gradient(135deg,#2563EB,#4F46E5)",
          color: "#fff",
        }}
      >
        <Typography
          variant="h4"
          fontWeight={700}
        >
          Welcome Back, {user?.name} 👋
        </Typography>

        <Typography
          sx={{
            mt: 1,
            opacity: 0.9,
          }}
        >
          Manage your RetailPulse Analytics Platform
          from one modern dashboard.
        </Typography>
      </Paper>

      <Grid
        container
        spacing={3}
      >
        {cards.map((card) => (
          <Grid
            key={card.title}
            size={{
              xs: 12,
              sm: 6,
              md: 4,
            }}
          >
            <StatCard
              title={card.title}
              value={card.value}
              color={card.color}
              icon={card.icon}
            />
          </Grid>
        ))}
      </Grid>

      <Grid
        container
        spacing={3}
        sx={{ mt: 1 }}
      >
        <Grid
          size={{
            xs: 12,
            md: 8,
          }}
        >
          <Paper
            elevation={0}
            sx={{
              p: 4,
              borderRadius: 4,
              bgcolor: "#1E293B",
              color: "#fff",
              border: "1px solid #334155",
            }}
          >
            <Typography
              variant="h5"
              fontWeight={700}
              mb={3}
            >
              Company Summary
            </Typography>

            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography color="#94A3B8">
                  Logged In User
                </Typography>

                <Typography variant="h6">
                  {dashboard.user}
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography color="#94A3B8">
                  Role
                </Typography>

                <Typography variant="h6">
                  {dashboard.role}
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography color="#94A3B8">
                  Total Companies
                </Typography>

                <Typography variant="h6">
                  {dashboard.total_companies}
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography color="#94A3B8">
                  Active Users
                </Typography>

                <Typography
                  variant="h6"
                  color="#22C55E"
                >
                  {dashboard.active_users}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid
          size={{
            xs: 12,
            md: 4,
          }}
        >
          <Paper
            elevation={0}
            sx={{
              p: 4,
              borderRadius: 4,
              bgcolor: "#1E293B",
              color: "#fff",
              border: "1px solid #334155",
            }}
          >
            <Typography
              variant="h5"
              fontWeight={700}
              mb={3}
            >
              Recent Activity
            </Typography>

            <Typography sx={{ mb: 2 }}>
              ✅ Company Registered
            </Typography>

            <Typography sx={{ mb: 2 }}>
              🔐 User Login Successful
            </Typography>

            <Typography sx={{ mb: 2 }}>
              🛡 JWT Authentication Verified
            </Typography>

            <Typography sx={{ mb: 2 }}>
              📊 Dashboard Loaded
            </Typography>

            <Typography>
              🟢 PostgreSQL Connected
            </Typography>
          </Paper>
        </Grid>
        </Grid>
              <Grid
        container
        spacing={3}
        sx={{ mt: 1 }}
      >
        <Grid
          size={{
            xs: 12,
            lg: 8,
          }}
        >
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 4,
              bgcolor: "#1E293B",
            }}
          >
            <Typography
              color="white"
              variant="h6"
              fontWeight={700}
              mb={2}
            >
              User Growth
            </Typography>

            <ResponsiveContainer
              width="100%"
              height={320}
            >
              <LineChart data={monthlyData}>
                <CartesianGrid stroke="#334155" />

                <XAxis dataKey="month" />

                <YAxis />

                <Tooltip />

                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#3B82F6"
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid
          size={{
            xs: 12,
            lg: 4,
          }}
        >
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 4,
              bgcolor: "#1E293B",
            }}
          >
            <Typography
              color="white"
              variant="h6"
              fontWeight={700}
              mb={2}
            >
              Active Users
            </Typography>

            <ResponsiveContainer
              width="100%"
              height={320}
            >
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  outerRadius={100}
                  label
                >
                  {pieData.map((_, index) => (
                    <Cell
                      key={index}
                      fill={COLORS[index]}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      <Paper
        elevation={0}
        sx={{
          mt: 4,
          p: 4,
          borderRadius: 4,
          background:
            "linear-gradient(135deg,#1E3A8A,#2563EB)",
          color: "#fff",
        }}
      >
        <Typography
          variant="h5"
          fontWeight={700}
          gutterBottom
        >
          RetailPulse Analytics
        </Typography>

        <Typography
          sx={{
            lineHeight: 1.8,
            opacity: 0.9,
          }}
        >
          Secure Multi-Tenant Retail Analytics Platform with
          JWT Authentication, PostgreSQL, Role-Based Access,
          Company Isolation, Audit Logging and Interactive
          Analytics Dashboard.
        </Typography>
      </Paper>

    </Container>

  </Box>

</Box>

);
}


