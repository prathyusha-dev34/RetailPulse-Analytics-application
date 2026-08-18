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
  ArrowUpward,
  CheckCircle,
  Login,
  Shield,
  Storage,
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

const SIDEBAR_WIDTH = 280;

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

  const cards = [
    {
      title: "Companies",
      value: dashboard.total_companies,
      color: "#3B82F6",
      icon: <Business />,
    },
    {
      title: "Total Users",
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
      title: "Administrators",
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

  const inactiveUsers = Math.max(
    0,
    dashboard.total_users - dashboard.active_users
  );

  const pieData = [
    {
      name: "Active",
      value: dashboard.active_users,
    },
    {
      name: "Inactive",
      value: inactiveUsers,
    },
  ];

  const COLORS = ["#3B82F6", "#334155"];

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          bgcolor: "#0F172A",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Box sx={{ textAlign: "center" }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 3,
              mx: "auto",
              mb: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background:
                "linear-gradient(135deg,#2563EB,#4F46E5)",
              boxShadow:
                "0 10px 30px rgba(37,99,235,0.25)",
            }}
          >
            <Typography
              sx={{
                color: "#fff",
                fontWeight: 800,
              }}
            >
              R
            </Typography>
          </Box>

          <Typography
            sx={{
              color: "#CBD5E1",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            Loading Dashboard...
          </Typography>

          <Typography
            sx={{
              color: "#64748B",
              fontSize: 12,
              mt: 0.5,
            }}
          >
            Preparing your analytics
          </Typography>
        </Box>
      </Box>
    );
  }

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
          minWidth: 0,
          ml: `${SIDEBAR_WIDTH}px`,
        }}
      >
        <Topbar />

        <Container
          maxWidth="xl"
          sx={{
            mt: "72px",
            py: { xs: 2.5, md: 3.5 },
            px: { xs: 2, sm: 3, lg: 4 },
          }}
        >
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, md: 4 },
              mb: 3,
              borderRadius: 4,
              position: "relative",
              overflow: "hidden",
              color: "#fff",
              background:
                "linear-gradient(135deg,#1D4ED8 0%,#4338CA 55%,#312E81 100%)",
              boxShadow:
                "0 18px 45px rgba(30,64,175,0.18)",

              "&:after": {
                content: '""',
                position: "absolute",
                width: 220,
                height: 220,
                borderRadius: "50%",
                right: -70,
                top: -100,
                bgcolor: "rgba(255,255,255,0.08)",
              },
            }}
          >
            <Box
              sx={{
                position: "relative",
                zIndex: 1,
                maxWidth: 720,
              }}
            >
              <Typography
                sx={{
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: 1.1,
                  textTransform: "uppercase",
                  opacity: 0.75,
                  mb: 1,
                }}
              >
                Admin Dashboard
              </Typography>

              <Typography
                sx={{
                  fontSize: { xs: 27, md: 34 },
                  fontWeight: 800,
                  lineHeight: 1.2,
                  letterSpacing: "-0.8px",
                }}
              >
                Welcome back, {user?.name || "User"} 👋
              </Typography>

              <Typography
                sx={{
                  mt: 1.2,
                  color: "rgba(255,255,255,0.78)",
                  fontSize: 14,
                  lineHeight: 1.7,
                }}
              >
                Monitor your RetailPulse platform, users,
                companies and system activity from one
                centralized dashboard.
              </Typography>
            </Box>
          </Paper>

          <Box sx={{ mb: 2 }}>
            <Typography
              sx={{
                color: "#F8FAFC",
                fontSize: 19,
                fontWeight: 800,
              }}
            >
              Platform Overview
            </Typography>

            <Typography
              sx={{
                color: "#64748B",
                fontSize: 12,
                mt: 0.4,
              }}
            >
              Key metrics from your retail analytics platform
            </Typography>
          </Box>

          <Grid container spacing={2.5}>
            {cards.map((card) => (
              <Grid
                key={card.title}
                size={{
                  xs: 12,
                  sm: 6,
                  md: 4,
                  xl: 2,
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
            spacing={2.5}
            sx={{ mt: 0 }}
          >
            <Grid
              size={{
                xs: 12,
                md: 7,
              }}
            >
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 2.5, md: 3 },
                  height: "100%",
                  borderRadius: 3.5,
                  bgcolor: "#111827",
                  border: "1px solid #263449",
                }}
              >
                <Typography
                  sx={{
                    color: "#F8FAFC",
                    fontSize: 17,
                    fontWeight: 800,
                  }}
                >
                  Company Summary
                </Typography>

                <Typography
                  sx={{
                    color: "#64748B",
                    fontSize: 12,
                    mt: 0.5,
                    mb: 3,
                  }}
                >
                  Current platform account information
                </Typography>

                <Grid container spacing={2}>
                  {[
                    {
                      label: "Logged In User",
                      value: dashboard.user || user?.name || "User",
                    },
                    {
                      label: "Role",
                      value: dashboard.role || user?.role || "Viewer",
                    },
                    {
                      label: "Total Companies",
                      value: dashboard.total_companies,
                    },
                    {
                      label: "Active Users",
                      value: dashboard.active_users,
                    },
                  ].map((item) => (
                    <Grid
                      key={item.label}
                      size={{ xs: 12, sm: 6 }}
                    >
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: 2.5,
                          bgcolor: "#0F172A",
                          border: "1px solid #1E293B",
                        }}
                      >
                        <Typography
                          sx={{
                            color: "#64748B",
                            fontSize: 11,
                            fontWeight: 600,
                            textTransform: "uppercase",
                            letterSpacing: 0.5,
                          }}
                        >
                          {item.label}
                        </Typography>

                        <Typography
                          sx={{
                            color:
                              item.label === "Active Users"
                                ? "#22C55E"
                                : "#E2E8F0",
                            fontSize: 18,
                            fontWeight: 700,
                            mt: 0.8,
                          }}
                        >
                          {item.value}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 5,
              }}
            >
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 2.5, md: 3 },
                  height: "100%",
                  borderRadius: 3.5,
                  bgcolor: "#111827",
                  border: "1px solid #263449",
                }}
              >
                <Typography
                  sx={{
                    color: "#F8FAFC",
                    fontSize: 17,
                    fontWeight: 800,
                  }}
                >
                  Recent Activity
                </Typography>

                <Typography
                  sx={{
                    color: "#64748B",
                    fontSize: 12,
                    mt: 0.5,
                    mb: 2.5,
                  }}
                >
                  System status and recent events
                </Typography>

                {[
                  {
                    icon: <CheckCircle fontSize="small" />,
                    title: "Company Registered",
                    subtitle: "Platform event",
                    color: "#22C55E",
                  },
                  {
                    icon: <Login fontSize="small" />,
                    title: "User Login Successful",
                    subtitle: "Authentication event",
                    color: "#3B82F6",
                  },
                  {
                    icon: <Shield fontSize="small" />,
                    title: "JWT Authentication Verified",
                    subtitle: "Security event",
                    color: "#8B5CF6",
                  },
                  {
                    icon: <ArrowUpward fontSize="small" />,
                    title: "Dashboard Loaded",
                    subtitle: "System event",
                    color: "#F59E0B",
                  },
                  {
                    icon: <Storage fontSize="small" />,
                    title: "Database Connected",
                    subtitle: "Infrastructure status",
                    color: "#06B6D4",
                  },
                ].map((activity) => (
                  <Box
                    key={activity.title}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      py: 1.15,
                      borderBottom: "1px solid #1E293B",

                      "&:last-child": {
                        borderBottom: "none",
                      },
                    }}
                  >
                    <Box
                      sx={{
                        width: 34,
                        height: 34,
                        flexShrink: 0,
                        borderRadius: 2,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        bgcolor: `${activity.color}15`,
                        color: activity.color,
                      }}
                    >
                      {activity.icon}
                    </Box>

                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        sx={{
                          color: "#E2E8F0",
                          fontSize: 12.5,
                          fontWeight: 600,
                        }}
                      >
                        {activity.title}
                      </Typography>

                      <Typography
                        sx={{
                          color: "#64748B",
                          fontSize: 10.5,
                          mt: 0.2,
                        }}
                      >
                        {activity.subtitle}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Paper>
            </Grid>
          </Grid>

          <Grid
            container
            spacing={2.5}
            sx={{ mt: 0 }}
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
                  p: { xs: 2.5, md: 3 },
                  borderRadius: 3.5,
                  bgcolor: "#111827",
                  border: "1px solid #263449",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 2,
                  }}
                >
                  <Box>
                    <Typography
                      sx={{
                        color: "#F8FAFC",
                        fontSize: 17,
                        fontWeight: 800,
                      }}
                    >
                      User Growth
                    </Typography>

                    <Typography
                      sx={{
                        color: "#64748B",
                        fontSize: 12,
                        mt: 0.4,
                      }}
                    >
                      Monthly user activity overview
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      px: 1.5,
                      py: 0.7,
                      borderRadius: 2,
                      bgcolor: "#172554",
                      color: "#60A5FA",
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    Users
                  </Box>
                </Box>

                <ResponsiveContainer
                  width="100%"
                  height={320}
                >
                  <LineChart
                    data={monthlyData}
                    margin={{
                      top: 10,
                      right: 10,
                      left: -15,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid
                      stroke="#1E293B"
                      vertical={false}
                    />

                    <XAxis
                      dataKey="month"
                      tick={{
                        fill: "#64748B",
                        fontSize: 11,
                      }}
                      axisLine={{
                        stroke: "#263449",
                      }}
                      tickLine={false}
                    />

                    <YAxis
                      allowDecimals={false}
                      tick={{
                        fill: "#64748B",
                        fontSize: 11,
                      }}
                      axisLine={false}
                      tickLine={false}
                    />

                    <Tooltip
                      contentStyle={{
                        background: "#0F172A",
                        border: "1px solid #334155",
                        borderRadius: 10,
                        color: "#FFFFFF",
                      }}
                      labelStyle={{
                        color: "#94A3B8",
                      }}
                    />

                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#3B82F6"
                      strokeWidth={3}
                      dot={{
                        r: 4,
                        fill: "#3B82F6",
                        strokeWidth: 0,
                      }}
                      activeDot={{
                        r: 6,
                      }}
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
                  p: { xs: 2.5, md: 3 },
                  borderRadius: 3.5,
                  bgcolor: "#111827",
                  border: "1px solid #263449",
                }}
              >
                <Typography
                  sx={{
                    color: "#F8FAFC",
                    fontSize: 17,
                    fontWeight: 800,
                  }}
                >
                  User Status
                </Typography>

                <Typography
                  sx={{
                    color: "#64748B",
                    fontSize: 12,
                    mt: 0.4,
                  }}
                >
                  Active vs inactive users
                </Typography>

                <ResponsiveContainer
                  width="100%"
                  height={260}
                >
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={88}
                      innerRadius={55}
                      paddingAngle={3}
                      label
                    >
                      {pieData.map((_, index) => (
                        <Cell
                          key={index}
                          fill={COLORS[index]}
                        />
                      ))}
                    </Pie>

                    <Tooltip
                      contentStyle={{
                        background: "#0F172A",
                        border: "1px solid #334155",
                        borderRadius: 10,
                        color: "#FFFFFF",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    gap: 3,
                    mt: -1,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.8,
                    }}
                  >
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        bgcolor: "#3B82F6",
                      }}
                    />

                    <Typography
                      sx={{
                        color: "#94A3B8",
                        fontSize: 11,
                      }}
                    >
                      Active
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.8,
                    }}
                  >
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        bgcolor: "#334155",
                      }}
                    />

                    <Typography
                      sx={{
                        color: "#94A3B8",
                        fontSize: 11,
                      }}
                    >
                      Inactive
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>
          </Grid>

          <Paper
            elevation={0}
            sx={{
              mt: 2.5,
              p: { xs: 2.5, md: 3 },
              borderRadius: 3.5,
              background:
                "linear-gradient(135deg,#172554 0%,#1E3A8A 55%,#1D4ED8 100%)",
              border: "1px solid rgba(96,165,250,0.2)",
              color: "#fff",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                position: "relative",
                zIndex: 1,
              }}
            >
              <Typography
                sx={{
                  fontSize: 19,
                  fontWeight: 800,
                  mb: 0.8,
                }}
              >
                RetailPulse Analytics
              </Typography>

              <Typography
                sx={{
                  maxWidth: 900,
                  color: "rgba(255,255,255,0.75)",
                  fontSize: 13,
                  lineHeight: 1.8,
                }}
              >
                Secure multi-tenant retail analytics platform
                with JWT authentication, PostgreSQL,
                role-based access, company isolation, audit
                logging and interactive analytics dashboards.
              </Typography>
            </Box>
          </Paper>
        </Container>
      </Box>
    </Box>
  );
}