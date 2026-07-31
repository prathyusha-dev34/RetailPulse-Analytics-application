import { useEffect, useState } from "react";

import { useParams, useNavigate } from "react-router-dom";

import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Divider,
  Chip,
  CircularProgress,
  Alert,
} from "@mui/material";

import { ArrowBack, Edit } from "@mui/icons-material";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { getCustomerProfile } from "../../services/customerService";

export default function CustomerProfile() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const safeArray = (value: any) =>
    Array.isArray(value) ? value : [];

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getCustomerProfile(id as string);

      console.log("CUSTOMER PROFILE RESPONSE:", response);

      if (response?.customer) {
        setCustomer(response.customer);
      } else if (response?.data) {
        setCustomer(response.data);
      } else {
        setCustomer(response);
      }
    } catch (err: any) {
      console.error("CUSTOMER PROFILE ERROR:", err);
      setError("Unable to load customer profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadProfile();
    }
  }, [id]);

  if (loading) {
    return (
      <Box
        sx={{
          p: 3,
          minHeight: "100vh",
          background: "#0F172A",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error || !customer) {
    return (
      <Box
        sx={{
          p: 3,
          minHeight: "100vh",
          background: "#0F172A",
        }}
      >
        <Alert severity="error">
          {error || "Customer not found"}
        </Alert>

        <Button
          sx={{ mt: 2, color: "white" }}
          startIcon={<ArrowBack />}
          onClick={() => navigate("/customers")}
        >
          Back Customers
        </Button>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        p: 3,
        background: "#0F172A",
        minHeight: "100vh",
        color: "white",
      }}
    >

    {/* =====================================================
    HEADER
===================================================== */}

<Box
  sx={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    mb: 3,
    flexWrap: "wrap",
    gap: 2,
  }}
>
  <Box>
    <Typography variant="h4" fontWeight="bold">
      Customer Profile
    </Typography>

    <Typography variant="body2" sx={{ color: "#CBD5E1", mt: 1 }}>
      Customer ID: {customer.customer_id || customer.id || "-"}
    </Typography>
  </Box>

  <Box display="flex" gap={2}>
    <Button
      variant="outlined"
      startIcon={<ArrowBack />}
      onClick={() => navigate("/customers")}
      sx={{
        color: "white",
        borderColor: "#475569",
      }}
    >
      Back
    </Button>

    <Button
      variant="contained"
      startIcon={<Edit />}
      onClick={() =>
        navigate(
          `/customers/${customer.id || customer.customer_id}/edit`
        )
      }
    >
      Edit Customer
    </Button>
  </Box>
</Box>

{/* =====================================================
    PERSONAL DETAILS
===================================================== */}

<Card
  sx={{
    background: "#1E293B",
    color: "white",
    mb: 3,
  }}
>
  <CardContent>
    <Typography variant="h6" mb={3}>
      Personal Details
    </Typography>

    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <Typography color="#94A3B8">Name</Typography>
        <Typography fontWeight="bold">
          {customer.full_name || "-"}
        </Typography>
      </Grid>

      <Grid item xs={12} md={4}>
        <Typography color="#94A3B8">Email</Typography>
        <Typography fontWeight="bold">
          {customer.email || "-"}
        </Typography>
      </Grid>

      <Grid item xs={12} md={4}>
        <Typography color="#94A3B8">Phone</Typography>
        <Typography fontWeight="bold">
          {customer.phone_number || "-"}
        </Typography>
      </Grid>

      <Grid item xs={12} md={4}>
        <Typography color="#94A3B8">
          Date Of Birth
        </Typography>
        <Typography fontWeight="bold">
          {customer.date_of_birth || "-"}
        </Typography>
      </Grid>

      <Grid item xs={12} md={4}>
        <Typography color="#94A3B8">Gender</Typography>
        <Typography fontWeight="bold">
          {customer.gender || "-"}
        </Typography>
      </Grid>

      <Grid item xs={12} md={4}>
        <Typography color="#94A3B8">
          Customer Type
        </Typography>
        <Typography fontWeight="bold">
          {customer.customer_type || "-"}
        </Typography>
      </Grid>

      <Grid item xs={12} md={4}>
        <Typography color="#94A3B8">
          Customer Segment
        </Typography>

        <Chip
          label={customer.customer_segment || "NEW"}
          color="primary"
          size="small"
        />
      </Grid>

      <Grid item xs={12} md={4}>
        <Typography color="#94A3B8">Status</Typography>

        <Chip
          label={customer.status || "UNKNOWN"}
          color={
            customer.status === "ACTIVE"
              ? "success"
              : "error"
          }
          size="small"
        />
      </Grid>

      <Grid item xs={12} md={4}>
        <Typography color="#94A3B8">
          VIP Status
        </Typography>

        <Chip
          label={
            customer.is_vip === true ||
            customer.is_vip === "true"
              ? "VIP"
              : "Regular"
          }
          color={
            customer.is_vip === true ||
            customer.is_vip === "true"
              ? "warning"
              : "default"
          }
          size="small"
        />
      </Grid>
    </Grid>
  </CardContent>
</Card>


{/* =====================================================
    ADDRESS DETAILS
===================================================== */}

<Card
  sx={{
    background: "#1E293B",
    color: "white",
    mb: 3,
  }}
>
  <CardContent>
    <Typography variant="h6" mb={3}>
      Address Details
    </Typography>

    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Typography color="#94A3B8">Address</Typography>
        <Typography fontWeight="bold">
          {customer.address || "-"}
        </Typography>
      </Grid>

      <Grid item xs={12} md={3}>
        <Typography color="#94A3B8">City</Typography>
        <Typography fontWeight="bold">
          {customer.city || "-"}
        </Typography>
      </Grid>

      <Grid item xs={12} md={3}>
        <Typography color="#94A3B8">State</Typography>
        <Typography fontWeight="bold">
          {customer.state || "-"}
        </Typography>
      </Grid>

      <Grid item xs={12} md={3}>
        <Typography color="#94A3B8">Country</Typography>
        <Typography fontWeight="bold">
          {customer.country || "-"}
        </Typography>
      </Grid>

      <Grid item xs={12} md={3}>
        <Typography color="#94A3B8">Postal Code</Typography>
        <Typography fontWeight="bold">
          {customer.postal_code || "-"}
        </Typography>
      </Grid>

      <Grid item xs={12} md={6}>
        <Typography color="#94A3B8">
          Preferred Sales Channel
        </Typography>
        <Typography fontWeight="bold">
          {customer.preferred_sales_channel || "-"}
        </Typography>
      </Grid>
    </Grid>
  </CardContent>
</Card>

{/* =====================================================
    CUSTOMER INFORMATION
===================================================== */}

<Card
  sx={{
    background: "#1E293B",
    color: "white",
    mb: 3,
  }}
>
  <CardContent>
    <Typography variant="h6" mb={3}>
      Customer Information
    </Typography>

    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <Typography color="#94A3B8">
          Customer Since
        </Typography>

        <Typography fontWeight="bold">
          {customer.created_at ||
            customer.customer_since ||
            "-"}
        </Typography>
      </Grid>

      <Grid item xs={12} md={4}>
        <Typography color="#94A3B8">
          Last Purchase
        </Typography>

        <Typography fontWeight="bold">
          {customer.last_purchase_date || "-"}
        </Typography>
      </Grid>

      <Grid item xs={12} md={4}>
        <Typography color="#94A3B8">
          Lifetime Revenue
        </Typography>

        <Typography
          variant="h5"
          fontWeight="bold"
          color="#22C55E"
        >
          ₹{customer.lifetime_revenue || 0}
        </Typography>
      </Grid>

      <Grid item xs={12} md={4}>
        <Typography color="#94A3B8">
          Customer Rating
        </Typography>

        <Typography fontWeight="bold">
          {customer.customer_rating || "-"}
        </Typography>
      </Grid>

      <Grid item xs={12} md={4}>
        <Typography color="#94A3B8">
          Loyalty Points
        </Typography>

        <Typography fontWeight="bold">
          {customer.loyalty_points || 0}
        </Typography>
      </Grid>

      <Grid item xs={12} md={4}>
        <Typography color="#94A3B8">
          Total Visits
        </Typography>

        <Typography fontWeight="bold">
          {customer.total_visits || 0}
        </Typography>
      </Grid>
    </Grid>
  </CardContent>
</Card>

{/* =====================================================
    PURCHASE SUMMARY
===================================================== */}

<Card
  sx={{
    background: "#1E293B",
    color: "white",
    mb: 3,
  }}
>
  <CardContent>
    <Typography variant="h6" mb={3}>
      Purchase Summary
    </Typography>

    <Grid container spacing={3}>
      <Grid item xs={12} md={3}>
        <Typography color="#94A3B8">
          Total Orders
        </Typography>

        <Typography variant="h4" fontWeight="bold">
          {customer.purchase_summary?.total_orders ??
            customer.total_orders ??
            0}
        </Typography>
      </Grid>

      <Grid item xs={12} md={3}>
        <Typography color="#94A3B8">
          Total Revenue
        </Typography>

        <Typography
          variant="h4"
          fontWeight="bold"
          color="#22C55E"
        >
          ₹
          {customer.purchase_summary?.total_revenue ??
            customer.total_revenue ??
            0}
        </Typography>
      </Grid>

      <Grid item xs={12} md={3}>
        <Typography color="#94A3B8">
          Average Order Value
        </Typography>

        <Typography variant="h4" fontWeight="bold">
          ₹
          {customer.purchase_summary
            ?.average_order_value ??
            customer.average_order_value ??
            0}
        </Typography>
      </Grid>

      <Grid item xs={12} md={3}>
        <Typography color="#94A3B8">
          Purchase Frequency
        </Typography>

        <Typography variant="h4" fontWeight="bold">
          {customer.purchase_summary
            ?.purchase_frequency ??
            customer.purchase_frequency ??
            0}
        </Typography>
      </Grid>
    </Grid>
  </CardContent>
</Card>

{/* =====================================================
    FAVOURITE PRODUCTS
===================================================== */}

<Card
  sx={{
    background: "#1E293B",
    color: "white",
    mb: 3,
  }}
>
  <CardContent>
    <Typography variant="h6" mb={2}>
      Favourite Products
    </Typography>

    {safeArray(customer.favourite_products).length > 0 ? (
      safeArray(customer.favourite_products).map(
        (product: any, index: number) => (
          <Box
            key={index}
            sx={{ mb: 2 }}
          >
            <Typography fontWeight="bold">
              {product.product_name ||
                product.name ||
                "Unknown Product"}
            </Typography>

            <Typography>
              Quantity Purchased:{" "}
              {product.quantity ?? 0}
            </Typography>

            <Divider sx={{ my: 1 }} />
          </Box>
        )
      )
    ) : (
      <Typography>
        No favourite products found
      </Typography>
    )}
  </CardContent>
</Card>

{/* =====================================================
    PURCHASE HISTORY
===================================================== */}

<Card
  sx={{
    background: "#1E293B",
    color: "white",
    mb: 3,
  }}
>
  <CardContent>
    <Typography variant="h6" mb={2}>
      Purchase History
    </Typography>

    {safeArray(customer.purchase_history).length > 0 ? (
      safeArray(customer.purchase_history).map(
        (order: any, index: number) => (
          <Box key={index} sx={{ mb: 2 }}>
            <Typography fontWeight="bold">
              Invoice:{" "}
              {order.invoice_number ||
                order.order_id ||
                "-"}
            </Typography>

            <Typography>
              Date:{" "}
              {order.sale_date ||
                order.date ||
                "-"}
            </Typography>

            <Typography>
              Amount: ₹
              {order.total_amount ||
                order.amount ||
                0}
            </Typography>

            <Typography>
              Payment Method:{" "}
              {order.payment_method || "-"}
            </Typography>

            <Typography>
              Channel:{" "}
              {order.sales_channel || "-"}
            </Typography>

            {index !==
              safeArray(customer.purchase_history)
                .length -
                1 && (
              <Divider sx={{ my: 2 }} />
            )}
          </Box>
        )
      )
    ) : (
      <Typography>
        No purchase history available
      </Typography>
    )}
  </CardContent>
</Card>

{/* =====================================================
    TRANSACTION TIMELINE
===================================================== */}

<Card
  sx={{
    background: "#1E293B",
    color: "white",
    mb: 3,
  }}
>
  <CardContent>
    <Typography variant="h6" mb={2}>
      Favourite Products
    </Typography>

    {safeArray(customer.favourite_products).length > 0 ? (
      safeArray(customer.favourite_products).map(
        (product: any, index: number) => (
          <Box key={index} sx={{ mb: 2 }}>
            <Typography fontWeight="bold">
              {product.product_name ??
                product.name ??
                "Unknown Product"}
            </Typography>

            <Typography>
              Quantity Purchased: {product.quantity ?? 0}
            </Typography>

            {index !==
              safeArray(customer.favourite_products).length - 1 && (
              <Divider sx={{ my: 1 }} />
            )}
          </Box>
        )
      )
    ) : (
      <Typography>
        No favourite products found
      </Typography>
    )}
  </CardContent>
</Card>

{/* =====================================================
    CUSTOMER ANALYTICS CHARTS
===================================================== */}

<Card
  sx={{
    background: "#1E293B",
    color: "white",
    mb: 3,
  }}
>
  <CardContent>
    <Typography variant="h6" mb={3}>
      Customer Analytics
    </Typography>

    {/* ================= PURCHASE TREND ================= */}

    <Typography mb={2}>
      Monthly Purchase Trend
    </Typography>

    <Box
      sx={{
        height: 300,
        width: "100%",
      }}
    >
      <ResponsiveContainer
        width="100%"
        height="100%"
      >
        <LineChart
          data={safeArray(customer.purchase_trend)}
        >
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />

          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#3B82F6"
            strokeWidth={3}
          />
        </LineChart>
      </ResponsiveContainer>
    </Box>

    {/* ================= REVENUE DISTRIBUTION ================= */}

    <Typography mt={4} mb={2}>
      Revenue Distribution
    </Typography>

    <Box
      sx={{
        height: 300,
        width: "100%",
      }}
    >
      <ResponsiveContainer
        width="100%"
        height="100%"
      >
        <PieChart>
          <Pie
            data={safeArray(
              customer.revenue_distribution
            )}
            dataKey="value"
            nameKey="name"
            outerRadius={100}
            label
          >
            {safeArray(
              customer.revenue_distribution
            ).map(
              (
                item: any,
                index: number
              ) => (
                <Cell
                  key={index}
                  fill={
                    [
                      "#3B82F6",
                      "#10B981",
                      "#F59E0B",
                      "#EF4444",
                      "#8B5CF6",
                    ][index % 5]
                  }
                />
              )
            )}
          </Pie>

          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </Box>

    {/* ================= ORDER FREQUENCY ================= */}

    <Typography mt={4} mb={2}>
      Order Frequency
    </Typography>

    <Box
      sx={{
        height: 300,
        width: "100%",
      }}
    >
      <ResponsiveContainer
        width="100%"
        height="100%"
      >
        <BarChart
          data={safeArray(
            customer.order_frequency
          )}
        >
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />

          <Bar
            dataKey="orders"
            fill="#10B981"
          />
        </BarChart>
      </ResponsiveContainer>
    </Box>

    {/* ================= SPENDING GROWTH ================= */}

    <Typography mt={4} mb={2}>
      Spending Growth
    </Typography>

    <Box
      sx={{
        height: 300,
        width: "100%",
      }}
    >
      <ResponsiveContainer
        width="100%"
        height="100%"
      >
        <AreaChart
          data={safeArray(
            customer.spending_growth
          )}
        >
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />

          <Area
            type="monotone"
            dataKey="amount"
            stroke="#8B5CF6"
            fill="#8B5CF6"
          />
        </AreaChart>
      </ResponsiveContainer>
    </Box>
  </CardContent>
</Card>


    </Box>
  );
}

