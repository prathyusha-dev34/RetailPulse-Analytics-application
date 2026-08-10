
import { useEffect, useState } from "react";

import {
  Alert,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Typography,
} from "@mui/material";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

import {
  getCustomerDashboard,
  getTopCustomers,
  getCustomerRevenueContribution,
  getNewVsReturningCustomers,
  getCustomerGrowthTrend,
  getCustomerSpendingDistribution,
} from "../../services/customerService";


// ==========================================================
// COLORS
// ==========================================================

const COLORS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
  "#06B6D4",
];


// ==========================================================
// TYPES
// ==========================================================

interface ChartItem {
  name: string;
  value: number;
}

interface GrowthItem {
  month: string;
  customers: number;
}

interface NewReturningItem {
  name: string;
  new_customers: number;
  returning_customers: number;
}

interface TopCustomerItem {
  name: string;
  revenue: number;
}


// ==========================================================
// HELPERS
// ==========================================================

const unwrapResponse = (response: any): any => {
  if (response?.data?.data !== undefined) {
    return response.data.data;
  }

  if (response?.data !== undefined) {
    return response.data;
  }

  return response;
};


const normalizeArray = (response: any): any[] => {
  const data = unwrapResponse(response);

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.items)) {
    return data.items;
  }

  if (Array.isArray(data?.results)) {
    return data.results;
  }

  if (Array.isArray(data?.customers)) {
    return data.customers;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  return [];
};


const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
};


// ==========================================================
// COMPONENT
// ==========================================================

export default function CustomerAnalytics() {

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [dashboard, setDashboard] =
    useState<any>({});

  const [topCustomers, setTopCustomers] =
    useState<TopCustomerItem[]>([]);

  const [revenueContribution, setRevenueContribution] =
    useState<ChartItem[]>([]);

  const [newReturning, setNewReturning] =
    useState<NewReturningItem[]>([]);

  const [growth, setGrowth] =
    useState<GrowthItem[]>([]);

  const [spending, setSpending] =
    useState<ChartItem[]>([]);


  // ========================================================
  // LOAD ANALYTICS
  // ========================================================

  const loadAnalytics = async () => {

    try {

      setLoading(true);
      setError("");


      const results = await Promise.allSettled([

        getCustomerDashboard(),

        getTopCustomers(),

        getCustomerRevenueContribution(),

        getNewVsReturningCustomers(),

        getCustomerGrowthTrend(),

        getCustomerSpendingDistribution(),

      ]);


      // ====================================================
      // DASHBOARD
      // ====================================================

      if (results[0].status === "fulfilled") {

        const data =
          unwrapResponse(results[0].value);

        setDashboard(data || {});
      }


      // ====================================================
      // TOP CUSTOMERS
      // ====================================================

      if (results[1].status === "fulfilled") {

        const data =
          normalizeArray(results[1].value);

        setTopCustomers(

          data.map((item: any) => ({

            name:
              item.customer_name ??
              item.name ??
              item.full_name ??
              item.customer_id ??
              "Customer",

            revenue:
              Number(
                item.lifetime_revenue ??
                item.total_revenue ??
                item.total_spend ??
                item.revenue ??
                item.amount ??
                0
              ),

          }))
          .filter(
            (item) => item.revenue > 0
          )
        );
      }


      // ====================================================
      // REVENUE CONTRIBUTION
      // ====================================================

      if (results[2].status === "fulfilled") {

        const data =
          normalizeArray(results[2].value);

        setRevenueContribution(

          data.map((item: any) => ({

            name:
              item.customer_name ??
              item.name ??
              item.full_name ??
              item.customer_type ??
              "Customer",

            value:
              Number(
                item.revenue ??
                item.total_revenue ??
                item.lifetime_revenue ??
                item.amount ??
                item.value ??
                0
              ),

          }))
          .filter(
            (item) => item.value > 0
          )
        );
      }


      // ====================================================
      // NEW VS RETURNING
      // ====================================================

      if (results[3].status === "fulfilled") {

        const raw =
          unwrapResponse(results[3].value);


        if (Array.isArray(raw)) {

          setNewReturning(

            raw.map((item: any) => ({

              name:
                item.name ??
                item.month ??
                item.period ??
                item.customer_type ??
                "Customers",

              new_customers:
                Number(
                  item.new_customers ??
                  item.new ??
                  item.new_customer_count ??
                  0
                ),

              returning_customers:
                Number(
                  item.returning_customers ??
                  item.returning ??
                  item.returning_customer_count ??
                  0
                ),

            }))
          );

        } else {

          setNewReturning([

            {
              name: "Customers",

              new_customers:
                Number(
                  raw?.new_customers ??
                  raw?.new ??
                  raw?.new_customer_count ??
                  0
                ),

              returning_customers:
                Number(
                  raw?.returning_customers ??
                  raw?.returning ??
                  raw?.returning_customer_count ??
                  0
                ),
            },

          ]);
        }
      }


      // ====================================================
      // CUSTOMER GROWTH
      // ====================================================

      if (results[4].status === "fulfilled") {

        const data =
          normalizeArray(results[4].value);

        setGrowth(

          data.map((item: any) => ({

            month:
              item.month ??
              item.date ??
              item.period ??
              item.label ??
              "",

            customers:
              Number(
                item.total_customers ??
                item.customer_count ??
                item.customers ??
                item.count ??
                0
              ),

          }))
        );
      }


      // ====================================================
      // SPENDING DISTRIBUTION
      // ====================================================

      if (results[5].status === "fulfilled") {

        const raw =
          unwrapResponse(results[5].value);


        if (Array.isArray(raw)) {

          setSpending(

            raw.map((item: any) => ({

              name:
                item.name ??
                item.customer_type ??
                item.segment ??
                item.category ??
                "Unknown",

              value:
                Number(
                  item.value ??
                  item.amount ??
                  item.revenue ??
                  item.total_spend ??
                  0
                ),

            }))
            .filter(
              (item) => item.value > 0
            )
          );

        } else {

          setSpending(

            Object.entries(raw || {})

              .filter(
                ([, value]) =>
                  Number(value) > 0
              )

              .map(([key, value]) => ({

                name: key,

                value: Number(value),

              }))
          );
        }
      }


      // ====================================================
      // CHECK FAILURES
      // ====================================================

      const failed =
        results.filter(
          (result) =>
            result.status === "rejected"
        );


      if (failed.length === results.length) {

        setError(
          "Unable to load customer analytics. Please check the backend API."
        );
      }

    } catch (err) {

      console.error(
        "Customer analytics error:",
        err
      );

      setError(
        "Unable to load customer analytics."
      );

    } finally {

      setLoading(false);

    }
  };


  // ========================================================
  // LOAD PAGE
  // ========================================================

  useEffect(() => {

    loadAnalytics();

  }, []);


  // ========================================================
  // LOADING
  // ========================================================

  if (loading) {

    return (

      <Box
        sx={{
          minHeight: "100vh",
          background: "#0F172A",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
          gap: 2,
        }}
      >

        <CircularProgress />

        <Typography color="white">
          Loading Customer Analytics...
        </Typography>

      </Box>
    );
  }


  // ========================================================
  // EMPTY MESSAGE
  // ========================================================

  const EmptyChart = ({
    message = "No data available",
  }: {
    message?: string;
  }) => (

    <Box
      sx={{
        height: 300,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >

      <Typography color="#94A3B8">
        {message}
      </Typography>

    </Box>
  );


  // ========================================================
  // PAGE
  // ========================================================

  return (

    <Box
      sx={{
        p: 3,
        minHeight: "100vh",
        background: "#0F172A",
        color: "white",
      }}
    >

      <Typography
        variant="h4"
        fontWeight="bold"
        mb={3}
      >
        Customer Analytics Dashboard
      </Typography>


      {error && (

        <Alert
          severity="warning"
          sx={{ mb: 3 }}
        >
          {error}
        </Alert>

      )}


      {/* ==================================================
          KPI CARDS
      ================================================== */}

      <Grid
        container
        spacing={3}
      >

        <Grid item xs={12} sm={6} md={3}>

          <Card
            sx={{
              background: "#1E293B",
              color: "white",
            }}
          >

            <CardContent>

              <Typography color="#94A3B8">
                Total Customers
              </Typography>

              <Typography variant="h4">

                {dashboard.total_customers ??
                  dashboard.customer_count ??
                  dashboard.total_customer_count ??
                  0}

              </Typography>

            </CardContent>

          </Card>

        </Grid>


        <Grid item xs={12} sm={6} md={3}>

          <Card
            sx={{
              background: "#1E293B",
              color: "white",
            }}
          >

            <CardContent>

              <Typography color="#94A3B8">
                Total Revenue
              </Typography>

              <Typography variant="h5">

                {formatCurrency(

                  Number(
                    dashboard.total_revenue_generated ??
                    dashboard.total_revenue ??
                    dashboard.lifetime_revenue ??
                    dashboard.revenue ??
                    0
                  )

                )}

              </Typography>

            </CardContent>

          </Card>

        </Grid>


        <Grid item xs={12} sm={6} md={3}>

          <Card
            sx={{
              background: "#1E293B",
              color: "white",
            }}
          >

            <CardContent>

              <Typography color="#94A3B8">
                Average Customer Spend
              </Typography>

              <Typography variant="h5">

                {formatCurrency(

                  Number(
                    dashboard.average_customer_spend ??
                    dashboard.average_spend ??
                    dashboard.average_order_value ??
                    0
                  )

                )}

              </Typography>

            </CardContent>

          </Card>

        </Grid>


        <Grid item xs={12} sm={6} md={3}>

          <Card
            sx={{
              background: "#1E293B",
              color: "white",
            }}
          >

            <CardContent>

              <Typography color="#94A3B8">
                VIP Customers
              </Typography>

              <Typography variant="h4">

                {dashboard.vip_customers ??
                  dashboard.vip_customer_count ??
                  dashboard.total_vip_customers ??
                  0}

              </Typography>

            </CardContent>

          </Card>

        </Grid>

      </Grid>


      {/* ==================================================
          CUSTOMER GROWTH
      ================================================== */}

      <Card
        sx={{
          mt: 3,
          background: "#1E293B",
          color: "white",
        }}
      >

        <CardContent>

          <Typography
            variant="h6"
            mb={2}
          >
            Customer Growth Trend
          </Typography>


          {growth.length === 0 ? (

            <EmptyChart />

          ) : (

            <Box sx={{ height: 350 }}>

              <ResponsiveContainer
                width="100%"
                height="100%"
              >

                <LineChart data={growth}>

                  <XAxis
                    dataKey="month"
                    stroke="#CBD5E1"
                  />

                  <YAxis
                    stroke="#CBD5E1"
                  />

                  <Tooltip />

                  <Legend />

                  <Line
                    type="monotone"
                    dataKey="customers"
                    name="Customers"
                    stroke="#3B82F6"
                    strokeWidth={3}
                  />

                </LineChart>

              </ResponsiveContainer>

            </Box>

          )}

        </CardContent>

      </Card>


      {/* ==================================================
          TOP CUSTOMERS
      ================================================== */}

      <Card
        sx={{
          mt: 3,
          background: "#1E293B",
          color: "white",
        }}
      >

        <CardContent>

          <Typography
            variant="h6"
            mb={2}
          >
            Top Customers by Revenue
          </Typography>


          {topCustomers.length === 0 ? (

            <EmptyChart />

          ) : (

            <Box sx={{ height: 350 }}>

              <ResponsiveContainer
                width="100%"
                height="100%"
              >

                <BarChart
                  data={topCustomers}
                  margin={{
                    top: 20,
                    right: 20,
                    left: 20,
                    bottom: 70,
                  }}
                >

                  <XAxis
                    dataKey="name"
                    interval={0}
                    angle={-25}
                    textAnchor="end"
                    stroke="#CBD5E1"
                  />

                  <YAxis
                    stroke="#CBD5E1"
                  />

                  <Tooltip
                    formatter={(value) =>
                      formatCurrency(Number(value))
                    }
                  />

                  <Legend />

                  <Bar
                    dataKey="revenue"
                    name="Revenue"
                    fill="#10B981"
                  />

                </BarChart>

              </ResponsiveContainer>

            </Box>

          )}

        </CardContent>

      </Card>


      {/* ==================================================
          REVENUE CONTRIBUTION
      ================================================== */}

      <Card
        sx={{
          mt: 3,
          background: "#1E293B",
          color: "white",
        }}
      >

        <CardContent>

          <Typography
            variant="h6"
            mb={2}
          >
            Customer Revenue Contribution
          </Typography>


          {revenueContribution.length === 0 ? (

            <EmptyChart />

          ) : (

            <Box sx={{ height: 350 }}>

              <ResponsiveContainer
                width="100%"
                height="100%"
              >

                <PieChart>

                  <Pie
                    data={revenueContribution}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={120}
                    label
                  >

                    {revenueContribution.map(
                      (_, index) => (

                        <Cell
                          key={index}
                          fill={
                            COLORS[
                              index %
                              COLORS.length
                            ]
                          }
                        />

                      )
                    )}

                  </Pie>

                  <Tooltip
                    formatter={(value) =>
                      formatCurrency(Number(value))
                    }
                  />

                  <Legend />

                </PieChart>

              </ResponsiveContainer>

            </Box>

          )}

        </CardContent>

      </Card>


      {/* ==================================================
          NEW VS RETURNING
      ================================================== */}

      <Card
        sx={{
          mt: 3,
          background: "#1E293B",
          color: "white",
        }}
      >

        <CardContent>

          <Typography
            variant="h6"
            mb={2}
          >
            New vs Returning Customers
          </Typography>


          {newReturning.length === 0 ? (

            <EmptyChart />

          ) : (

            <Box sx={{ height: 350 }}>

              <ResponsiveContainer
                width="100%"
                height="100%"
              >

                <BarChart
                  data={newReturning}
                >

                  <XAxis
                    dataKey="name"
                    stroke="#CBD5E1"
                  />

                  <YAxis
                    stroke="#CBD5E1"
                  />

                  <Tooltip />

                  <Legend />

                  <Bar
                    dataKey="new_customers"
                    name="New Customers"
                    fill="#3B82F6"
                  />

                  <Bar
                    dataKey="returning_customers"
                    name="Returning Customers"
                    fill="#10B981"
                  />

                </BarChart>

              </ResponsiveContainer>

            </Box>

          )}

        </CardContent>

      </Card>


      {/* ==================================================
          SPENDING DISTRIBUTION
      ================================================== */}

      <Card
        sx={{
          mt: 3,
          background: "#1E293B",
          color: "white",
        }}
      >

        <CardContent>

          <Typography
            variant="h6"
            mb={2}
          >
            Customer Spending Distribution
          </Typography>


          {spending.length === 0 ? (

            <EmptyChart />

          ) : (

            <Box sx={{ height: 350 }}>

              <ResponsiveContainer
                width="100%"
                height="100%"
              >

                <PieChart>

                  <Pie
                    data={spending}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={120}
                    label
                  >

                    {spending.map(
                      (_, index) => (

                        <Cell
                          key={index}
                          fill={
                            COLORS[
                              index %
                              COLORS.length
                            ]
                          }
                        />

                      )
                    )}

                  </Pie>

                  <Tooltip
                    formatter={(value) =>
                      formatCurrency(Number(value))
                    }
                  />

                  <Legend />

                </PieChart>

              </ResponsiveContainer>

            </Box>

          )}

        </CardContent>

      </Card>

    </Box>
  );
}
