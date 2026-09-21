import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

import {
  Download,
  Refresh,
  Visibility,
} from "@mui/icons-material";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  getSalesSummary,
  getSalesTrend,
  getSalesVsOrders,
  getSalesProducts,
  getSalesCustomers,
  getPaymentMethods,
  exportSalesCsv,
  exportSalesPdf,
} from "../api/analyticsApi";

// ============================================================
// TYPES
// ============================================================

interface DashboardData {
  total_revenue: number;
  total_orders: number;
  average_order_value: number;
  total_items_sold: number;
  total_discount: number;
  total_tax: number;
}

interface AnalyticsFilters {
  from_date: string;
  to_date: string;
  period: "daily" | "weekly" | "monthly";
}

const COLORS = [
  "#22C55E",
  "#60A5FA",
  "#F59E0B",
  "#EC4899",
  "#8B5CF6",
  "#14B8A6",
  "#F97316",
];

// Keep the default analytics range useful for the existing sales data.
// The API returns historical sales, so an empty range can otherwise show
// no chart data when the current month has no transactions.
const toDateString = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getDefaultDateRange = () => {
  const end = new Date();
  const start = new Date(end);

  // Last 90 days includes the sample sales dates such as 2026-07-21,
  // 2026-08-06 and 2026-08-07 when the application is opened in Sep 2026.
  start.setDate(start.getDate() - 89);

  return {
    from_date: toDateString(start),
    to_date: toDateString(end),
  };
};

// ============================================================
// RESPONSE NORMALIZERS
// ============================================================

const unwrap = (response: any): any => {
  const value = response?.data;

  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    "data" in value
  ) {
    return value.data;
  }

  return value;
};

const asArray = (response: any): any[] => {
  const value = unwrap(response);

  if (Array.isArray(value)) return value;

  if (
    value &&
    typeof value === "object"
  ) {
    for (const key of [
      "items",
      "results",
      "data",
      "rows",
    ]) {
      if (Array.isArray(value[key])) {
        return value[key];
      }
    }
  }

  return [];
};

const numberValue = (value: any): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getDateValue = (item: any) =>
  String(
    item?.date ??
    item?.period ??
    item?.month ??
    item?.label ??
    ""
  );

const getRevenueValue = (item: any) =>
  numberValue(
    item?.revenue ??
    item?.total_revenue ??
    item?.amount ??
    0
  );

const getOrdersValue = (item: any) =>
  numberValue(
    item?.orders ??
    item?.total_orders ??
    item?.order_count ??
    0
  );

const getQuantityValue = (item: any) =>
  numberValue(
    item?.quantity ??
    item?.total_quantity ??
    item?.items_sold ??
    item?.total_items_sold ??
    0
  );

// ============================================================
// COMPONENT
// ============================================================

export default function Analytics() {
  const [dashboard, setDashboard] =
    useState<DashboardData>({
      total_revenue: 0,
      total_orders: 0,
      average_order_value: 0,
      total_items_sold: 0,
      total_discount: 0,
      total_tax: 0,
    });

  const [filters, setFilters] =
    useState<AnalyticsFilters>({
      ...getDefaultDateRange(),
      period: "daily",
    });

  const [salesTrend, setSalesTrend] =
    useState<any[]>([]);

  const [salesVsOrders, setSalesVsOrders] =
    useState<any[]>([]);

  const [products, setProducts] =
    useState<any[]>([]);

  const [customers, setCustomers] =
    useState<any[]>([]);

  const [paymentMethods, setPaymentMethods] =
    useState<any[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [drillOpen, setDrillOpen] =
    useState(false);

  const [drillTitle, setDrillTitle] =
    useState("");

  const [drillData, setDrillData] =
    useState<any[]>([]);

  // ==========================================================
  // HELPERS
  // ==========================================================

  const formatCurrency = (value: any) =>
    `₹${numberValue(value).toLocaleString(
      "en-IN",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    )}`;

  const openDrillDown = (
    title: string,
    data: any[]
  ) => {
    setDrillTitle(title);
    setDrillData(data);
    setDrillOpen(true);
  };

  const closeDrillDown = () =>
    setDrillOpen(false);

  const handleFilterChange = (
    event: any
  ) => {
    const {
      name,
      value,
    } = event.target;

    setFilters((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      from_date: "",
      to_date: "",
      period: "daily",
    });
  };

  // ==========================================================
  // LOAD DATA
  // ==========================================================

  const loadAnalytics = useCallback(
    async () => {
      try {
        setLoading(true);
        setError("");

        const params = {
          from_date: filters.from_date,
          to_date: filters.to_date,
          period: filters.period,
        };

        const [
          summaryRes,
          trendRes,
          salesOrdersRes,
          productsRes,
          customersRes,
          paymentRes,
        ] = await Promise.all([
          getSalesSummary(params),
          getSalesTrend(params),
          getSalesVsOrders(params),
          getSalesProducts(params),
          getSalesCustomers(params),
          getPaymentMethods(params),
        ]);

        const summary =
          unwrap(summaryRes) || {};

        setDashboard({
          total_revenue:
            numberValue(
              summary.total_revenue
            ),

          total_orders:
            numberValue(
              summary.total_orders
            ),

          average_order_value:
            numberValue(
              summary.average_order_value
            ),

          total_items_sold:
            numberValue(
              summary.total_items_sold ??
              summary.total_products_sold
            ),

          total_discount:
            numberValue(
              summary.total_discount
            ),

          total_tax:
            numberValue(
              summary.total_tax
            ),
        });

        setSalesTrend(
          asArray(trendRes)
        );

        setSalesVsOrders(
          asArray(salesOrdersRes)
        );

        setProducts(
          asArray(productsRes)
        );

        setCustomers(
          asArray(customersRes)
        );

        setPaymentMethods(
          asArray(paymentRes)
        );
      } catch (err) {
        console.error(
          "Analytics error:",
          err
        );

        setError(
          "Failed to load analytics data. Check the browser console and backend API."
        );
      } finally {
        setLoading(false);
      }
    },
    [
      filters.from_date,
      filters.to_date,
      filters.period,
    ]
  );

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  // ==========================================================
  // EXPORTS
  // ==========================================================

  const downloadBlob = (
    blob: Blob,
    filename: string
  ) => {
    const url =
      window.URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;
    link.download = filename;

    document.body.appendChild(link);
    link.click();
    link.remove();

    window.URL.revokeObjectURL(url);
  };

  const handleExportCsv = async () => {
    try {
      const response =
        await exportSalesCsv(filters);

      downloadBlob(
        response.data,
        "RetailPulse_Sales_Analytics.csv"
      );
    } catch (err) {
      console.error(
        "CSV export error:",
        err
      );

      setError(
        "CSV export failed."
      );
    }
  };

  const handleExportPdf = async () => {
    try {
      const response =
        await exportSalesPdf(filters);

      downloadBlob(
        response.data,
        "RetailPulse_Sales_Analytics.pdf"
      );
    } catch (err) {
      console.error(
        "PDF export error:",
        err
      );

      setError(
        "PDF export failed."
      );
    }
  };

  // ==========================================================
  // CHART DATA
  // ==========================================================

  const revenueChart =
    salesTrend.map((item) => ({
      date: getDateValue(item),
      revenue: getRevenueValue(item),
    }));

  const salesOrdersChart =
    salesVsOrders.map((item) => ({
      date: getDateValue(item),
      revenue: getRevenueValue(item),
      orders: getOrdersValue(item),
    }));

  const productChart =
    products.map((item) => ({
      name:
        item?.product_name ??
        item?.name ??
        item?.sku ??
        "Unknown",
      quantity:
        getQuantityValue(item),
      revenue:
        getRevenueValue(item),
    }));

  const customerChart =
    customers.map((item) => ({
      name:
        item?.customer_name ??
        item?.name ??
        item?.email ??
        "Unknown",
      revenue:
        getRevenueValue(item),
      orders:
        getOrdersValue(item),
    }));

  const paymentChart =
    paymentMethods.map((item) => ({
      method:
        item?.method ??
        item?.payment_method ??
        item?.name ??
        "Unknown",
      amount:
        getRevenueValue(item),
      orders:
        getOrdersValue(item),
    }));

  // ==========================================================
  // JSX
  // ==========================================================

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
        component="main"
        sx={{
          flexGrow: 1,
          ml: "80px",
        }}
      >
        <Topbar />

        <Container
          maxWidth="xl"
          sx={{
            mt: 10,
            pb: 5,
          }}
        >
          {error && (
            <Alert
              severity="error"
              sx={{ mb: 3 }}
              onClose={() =>
                setError("")
              }
            >
              {error}
            </Alert>
          )}

          {/* HEADER */}

          <Stack
            direction={{
              xs: "column",
              md: "row",
            }}
            justifyContent="space-between"
            alignItems={{
              xs: "flex-start",
              md: "center",
            }}
            gap={2}
            mb={4}
          >
            <Box>
              <Typography
                variant="h4"
                fontWeight={800}
                color="white"
              >
                Retail Analytics Dashboard
              </Typography>

              <Typography
                sx={{
                  color:
                    "rgba(255,255,255,0.65)",
                  mt: 1,
                }}
              >
                Sales Analytics & Business Insights
              </Typography>
            </Box>

            <Stack
              direction={{
                xs: "column",
                sm: "row",
              }}
              spacing={1}
            >
              <Button
                variant="contained"
                startIcon={
                  <Download />
                }
                onClick={
                  handleExportCsv
                }
              >
                Export CSV
              </Button>

              <Button
                variant="contained"
                color="success"
                startIcon={
                  <Download />
                }
                onClick={
                  handleExportPdf
                }
              >
                Export PDF
              </Button>

              <Button
                variant="outlined"
                startIcon={
                  <Refresh />
                }
                onClick={
                  loadAnalytics
                }
              >
                Refresh
              </Button>
            </Stack>
          </Stack>

          {/* FILTERS */}

          <Paper
            sx={{
              p: 3,
              mb: 4,
              bgcolor: "#1E293B",
              borderRadius: 3,
            }}
          >
            <Typography
              variant="h6"
              fontWeight={700}
              color="white"
              mb={3}
            >
              Sales Filters
            </Typography>

            <Grid
              container
              spacing={2}
            >
              <Grid
                size={{
                  xs: 12,
                  sm: 4,
                }}
              >
                <TextField
                  fullWidth
                  type="date"
                  label="From Date"
                  name="from_date"
                  value={
                    filters.from_date
                  }
                  onChange={
                    handleFilterChange
                  }
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>

              <Grid
                size={{
                  xs: 12,
                  sm: 4,
                }}
              >
                <TextField
                  fullWidth
                  type="date"
                  label="To Date"
                  name="to_date"
                  value={
                    filters.to_date
                  }
                  onChange={
                    handleFilterChange
                  }
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>

              <Grid
                size={{
                  xs: 12,
                  sm: 4,
                }}
              >
                <FormControl
                  fullWidth
                >
                  <InputLabel>
                    Period
                  </InputLabel>

                  <Select
                    label="Period"
                    name="period"
                    value={
                      filters.period
                    }
                    onChange={
                      handleFilterChange
                    }
                  >
                    <MenuItem value="daily">
                      Daily
                    </MenuItem>

                    <MenuItem value="weekly">
                      Weekly
                    </MenuItem>

                    <MenuItem value="monthly">
                      Monthly
                    </MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid
                size={{ xs: 12 }}
              >
                <Button
                  variant="outlined"
                  color="warning"
                  onClick={
                    clearFilters
                  }
                >
                  Clear Filters
                </Button>
              </Grid>
            </Grid>
          </Paper>

          {/* KPI */}

          <Grid
            container
            spacing={3}
            mb={4}
          >
            {[
              [
                "Total Revenue",
                formatCurrency(
                  dashboard.total_revenue
                ),
              ],
              [
                "Total Orders",
                dashboard.total_orders,
              ],
              [
                "Total Items Sold",
                dashboard.total_items_sold,
              ],
              [
                "Average Order Value",
                formatCurrency(
                  dashboard.average_order_value
                ),
              ],
              [
                "Total Discount",
                formatCurrency(
                  dashboard.total_discount
                ),
              ],
              [
                "Total Tax",
                formatCurrency(
                  dashboard.total_tax
                ),
              ],
            ].map(
              ([title, value]) => (
                <Grid
                  key={String(title)}
                  size={{
                    xs: 12,
                    sm: 6,
                    md: 4,
                  }}
                >
                  <Card
                    onClick={() =>
                      openDrillDown(
                        String(title),
                        [
                          {
                            metric:
                              title,
                            value,
                          },
                        ]
                      )
                    }
                    sx={{
                      cursor:
                        "pointer",
                      bgcolor:
                        "#1E293B",
                      color:
                        "white",
                      borderRadius: 3,
                      transition:
                        "0.2s",
                      "&:hover": {
                        transform:
                          "translateY(-4px)",
                      },
                    }}
                  >
                    <CardContent>
                      <Typography
                        color="#CBD5E1"
                        fontWeight={700}
                      >
                        {title}
                      </Typography>

                      <Typography
                        variant="h4"
                        mt={2}
                        fontWeight={800}
                      >
                        {value}
                      </Typography>

                      <Button
                        size="small"
                        startIcon={
                          <Visibility />
                        }
                        sx={{
                          mt: 1,
                          color:
                            "#CBD5E1",
                        }}
                      >
                        View Details
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              )
            )}
          </Grid>

          {/* REVENUE + SALES/ORDERS */}

          <Grid
            container
            spacing={3}
            mb={4}
          >
            <Grid
              size={{
                xs: 12,
                md: 6,
              }}
            >
              <Paper
                sx={{
                  p: 3,
                  bgcolor:
                    "#1E293B",
                  color:
                    "white",
                  borderRadius: 3,
                  height: 400,
                }}
              >
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  mb={2}
                >
                  <Typography
                    variant="h6"
                    fontWeight={700}
                  >
                    Revenue Trend
                  </Typography>

                  <Button
                    size="small"
                    onClick={() =>
                      openDrillDown(
                        "Revenue Trend",
                        revenueChart
                      )
                    }
                  >
                    View
                  </Button>
                </Stack>

                {revenueChart.length ===
                0 ? (
                  <EmptyState />
                ) : (
                  <ResponsiveContainer
                    width="100%"
                    height="85%"
                  >
                    <LineChart
                      data={
                        revenueChart
                      }
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                      />

                      <XAxis
                        dataKey="date"
                      />

                      <YAxis />

                      <Tooltip
                        formatter={(
                          value: any
                        ) =>
                          formatCurrency(
                            value
                          )
                        }
                      />

                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="#22C55E"
                        strokeWidth={3}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </Paper>
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 6,
              }}
            >
              <Paper
                sx={{
                  p: 3,
                  bgcolor:
                    "#1E293B",
                  color:
                    "white",
                  borderRadius: 3,
                  height: 400,
                }}
              >
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  mb={2}
                >
                  <Typography
                    variant="h6"
                    fontWeight={700}
                  >
                    Sales vs Orders
                  </Typography>

                  <Button
                    size="small"
                    onClick={() =>
                      openDrillDown(
                        "Sales vs Orders",
                        salesOrdersChart
                      )
                    }
                  >
                    View
                  </Button>
                </Stack>

                {salesOrdersChart.length ===
                0 ? (
                  <EmptyState />
                ) : (
                  <ResponsiveContainer
                    width="100%"
                    height="85%"
                  >
                    <LineChart
                      data={
                        salesOrdersChart
                      }
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                      />

                      <XAxis
                        dataKey="date"
                      />

                      <YAxis />

                      <Tooltip />

                      <Legend />

                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="#22C55E"
                        strokeWidth={3}
                      />

                      <Line
                        type="monotone"
                        dataKey="orders"
                        stroke="#60A5FA"
                        strokeWidth={3}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </Paper>
            </Grid>
          </Grid>

          {/* PRODUCTS + CUSTOMERS */}

          <Grid
            container
            spacing={3}
            mb={4}
          >
            <Grid
              size={{
                xs: 12,
                md: 6,
              }}
            >
              <Paper
                sx={{
                  p: 3,
                  bgcolor:
                    "#1E293B",
                  color:
                    "white",
                  borderRadius: 3,
                  height: 420,
                }}
              >
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  mb={2}
                >
                  <Typography
                    variant="h6"
                    fontWeight={700}
                  >
                    Sales Products
                  </Typography>

                  <Button
                    size="small"
                    onClick={() =>
                      openDrillDown(
                        "Sales Products",
                        products
                      )
                    }
                  >
                    View
                  </Button>
                </Stack>

                {productChart.length ===
                0 ? (
                  <EmptyState />
                ) : (
                  <ResponsiveContainer
                    width="100%"
                    height="85%"
                  >
                    <BarChart
                      data={
                        productChart
                      }
                      layout="vertical"
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                      />

                      <XAxis
                        type="number"
                      />

                      <YAxis
                        type="category"
                        dataKey="name"
                        width={130}
                      />

                      <Tooltip />

                      <Bar
                        dataKey="quantity"
                        fill="#F59E0B"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Paper>
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 6,
              }}
            >
              <Paper
                sx={{
                  p: 3,
                  bgcolor:
                    "#1E293B",
                  color:
                    "white",
                  borderRadius: 3,
                  height: 420,
                }}
              >
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  mb={2}
                >
                  <Typography
                    variant="h6"
                    fontWeight={700}
                  >
                    Sales Customers
                  </Typography>

                  <Button
                    size="small"
                    onClick={() =>
                      openDrillDown(
                        "Sales Customers",
                        customers
                      )
                    }
                  >
                    View
                  </Button>
                </Stack>

                {customerChart.length ===
                0 ? (
                  <EmptyState />
                ) : (
                  <ResponsiveContainer
                    width="100%"
                    height="85%"
                  >
                    <BarChart
                      data={
                        customerChart
                      }
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                      />

                      <XAxis
                        dataKey="name"
                      />

                      <YAxis />

                      <Tooltip />

                      <Bar
                        dataKey="revenue"
                        fill="#8B5CF6"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Paper>
            </Grid>
          </Grid>

          {/* PAYMENT METHODS */}

          <Grid
            container
            spacing={3}
            mb={4}
          >
            <Grid
              size={{ xs: 12 }}
            >
              <Paper
                sx={{
                  p: 3,
                  bgcolor:
                    "#1E293B",
                  color:
                    "white",
                  borderRadius: 3,
                  height: 400,
                }}
              >
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  mb={2}
                >
                  <Typography
                    variant="h6"
                    fontWeight={700}
                  >
                    Sales By Payment Method
                  </Typography>

                  <Button
                    size="small"
                    onClick={() =>
                      openDrillDown(
                        "Payment Methods",
                        paymentMethods
                      )
                    }
                  >
                    View
                  </Button>
                </Stack>

                {paymentChart.length ===
                0 ? (
                  <EmptyState />
                ) : (
                  <ResponsiveContainer
                    width="100%"
                    height="85%"
                  >
                    <PieChart>
                      <Pie
                        data={
                          paymentChart
                        }
                        dataKey="amount"
                        nameKey="method"
                        outerRadius={120}
                        label
                      >
                        {paymentChart.map(
                          (
                            _,
                            index
                          ) => (
                            <Cell
                              key={
                                index
                              }
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
                        formatter={(
                          value: any
                        ) =>
                          formatCurrency(
                            value
                          )
                        }
                      />

                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </Paper>
            </Grid>
          </Grid>

          {/* DETAIL TABLES */}

          <DetailTable
            title="Sales Products Details"
            data={products}
          />

          <DetailTable
            title="Sales Customers Details"
            data={customers}
          />

          {/* LOADING */}

          {loading && (
            <Box
              sx={{
                position:
                  "fixed",
                inset: 0,
                display:
                  "flex",
                alignItems:
                  "center",
                justifyContent:
                  "center",
                background:
                  "rgba(15,23,42,0.55)",
                zIndex: 9999,
              }}
            >
              <CircularProgress />
            </Box>
          )}

          {/* DRILL DOWN */}

          <Dialog
            open={drillOpen}
            onClose={
              closeDrillDown
            }
            maxWidth="md"
            fullWidth
          >
            <DialogTitle
              sx={{
                bgcolor:
                  "#1E293B",
                color:
                  "white",
                fontWeight: 700,
              }}
            >
              {drillTitle}
            </DialogTitle>

            <DialogContent
              sx={{
                bgcolor:
                  "#0F172A",
              }}
            >
              {drillData.length ===
              0 ? (
                <Typography
                  color="#94A3B8"
                  mt={2}
                >
                  No detailed records available
                </Typography>
              ) : (
                <Table
                  sx={{ mt: 2 }}
                >
                  <TableHead>
                    <TableRow>
                      <TableCell
                        sx={{
                          color:
                            "white",
                        }}
                      >
                        Field
                      </TableCell>

                      <TableCell
                        sx={{
                          color:
                            "white",
                        }}
                      >
                        Value
                      </TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {Object.entries(
                      drillData[0]
                    ).map(
                      ([
                        key,
                        value,
                      ]) => (
                        <TableRow
                          key={key}
                        >
                          <TableCell
                            sx={{
                              color:
                                "white",
                            }}
                          >
                            {key}
                          </TableCell>

                          <TableCell
                            sx={{
                              color:
                                "white",
                            }}
                          >
                            {String(
                              value
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    )}
                  </TableBody>
                </Table>
              )}
            </DialogContent>

            <DialogActions
              sx={{
                bgcolor:
                  "#1E293B",
              }}
            >
              <Button
                onClick={
                  closeDrillDown
                }
                color="warning"
              >
                Close
              </Button>
            </DialogActions>
          </Dialog>
        </Container>
      </Box>
    </Box>
  );
}

// ============================================================
// EMPTY STATE
// ============================================================

function EmptyState() {
  return (
    <Box
      height="85%"
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <Typography
        color="#94A3B8"
      >
        No data available
      </Typography>
    </Box>
  );
}

// ============================================================
// DETAIL TABLE
// ============================================================

function DetailTable({
  title,
  data,
}: {
  title: string;
  data: any[];
}) {
  if (!data.length) {
    return null;
  }

  const columns =
    Object.keys(
      data[0] || {}
    );

  return (
    <Paper
      sx={{
        p: 3,
        mb: 4,
        bgcolor:
          "#1E293B",
        borderRadius: 3,
        overflowX:
          "auto",
      }}
    >
      <Typography
        variant="h6"
        fontWeight={700}
        color="white"
        mb={2}
      >
        {title}
      </Typography>

      <Table>
        <TableHead>
          <TableRow>
            {columns.map(
              (column) => (
                <TableCell
                  key={column}
                  sx={{
                    color:
                      "white",
                    fontWeight: 700,
                  }}
                >
                  {column}
                </TableCell>
              )
            )}
          </TableRow>
        </TableHead>

        <TableBody>
          {data
            .slice(0, 10)
            .map(
              (
                row,
                index
              ) => (
                <TableRow
                  key={index}
                >
                  {columns.map(
                    (column) => (
                      <TableCell
                        key={
                          column
                        }
                        sx={{
                          color:
                            "#CBD5E1",
                        }}
                      >
                        {String(
                          row[
                            column
                          ] ??
                            ""
                        )}
                      </TableCell>
                    )
                  )}
                </TableRow>
              )
            )}
        </TableBody>
      </Table>
    </Paper>
  );
}
