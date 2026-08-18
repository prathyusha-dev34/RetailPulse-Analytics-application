import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

import {
  Download,
  Refresh,
  TrendingUp,
  ShoppingCart,
  Inventory2,
  ReceiptLong,
  Percent,
  AccountBalanceWallet,
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

import type {
  AnalyticsFilters,
  ProductSort,
} from "../api/analyticsApi";

import {
  clearAnalyticsCache,
  exportSalesCsv,
  exportSalesPdf,
  getPaymentMethods,
  getSalesCustomers,
  getSalesProducts,
  getSalesSummary,
  getSalesTrend,
  getSalesVsOrders,
} from "../api/analyticsApi";

interface DashboardData {
  total_revenue: number;
  total_orders: number;
  average_order_value: number;
  total_items_sold: number;
  total_discount: number;
  total_tax: number;
}

type Preset =
  | "today"
  | "last7"
  | "last30"
  | "thisMonth"
  | "lastMonth"
  | "custom";

const COLORS = [
  "#22C55E",
  "#3B82F6",
  "#F59E0B",
  "#EC4899",
  "#8B5CF6",
  "#14B8A6",
  "#F97316",
];

const EMPTY_DASHBOARD: DashboardData = {
  total_revenue: 0,
  total_orders: 0,
  average_order_value: 0,
  total_items_sold: 0,
  total_discount: 0,
  total_tax: 0,
};

const numberValue = (value: any): number => {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : 0;
};

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

  if (Array.isArray(value)) {
    return value;
  }

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
      item?.total_spend ??
      0
  );

const getOrdersValue = (item: any) =>
  numberValue(
    item?.orders ??
      item?.total_orders ??
      item?.order_count ??
      item?.transactions ??
      item?.transaction_count ??
      0
  );

const getQuantityValue = (item: any) =>
  numberValue(
    item?.quantity ??
      item?.total_quantity ??
      item?.items_sold ??
      item?.total_items_sold ??
      item?.quantity_sold ??
      0
  );

const toDateString = (date: Date) => {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getPresetDates = (
  preset: Preset
) => {
  const today = new Date();

  const end = new Date(today);
  const start = new Date(today);

  if (preset === "today") {
    return {
      from_date: toDateString(start),
      to_date: toDateString(end),
    };
  }

  if (preset === "last7") {
    start.setDate(
      start.getDate() - 6
    );

    return {
      from_date: toDateString(start),
      to_date: toDateString(end),
    };
  }

  if (preset === "last30") {
    start.setDate(
      start.getDate() - 29
    );

    return {
      from_date: toDateString(start),
      to_date: toDateString(end),
    };
  }

  if (preset === "thisMonth") {
    start.setDate(1);

    return {
      from_date: toDateString(start),
      to_date: toDateString(end),
    };
  }

  if (preset === "lastMonth") {
    const firstDayCurrent = new Date(
      today.getFullYear(),
      today.getMonth(),
      1
    );

    const lastDayPrevious = new Date(
      firstDayCurrent
    );

    lastDayPrevious.setDate(
      lastDayPrevious.getDate() - 1
    );

    const firstDayPrevious = new Date(
      lastDayPrevious.getFullYear(),
      lastDayPrevious.getMonth(),
      1
    );

    return {
      from_date: toDateString(
        firstDayPrevious
      ),
      to_date: toDateString(
        lastDayPrevious
      ),
    };
  }

  return {
    from_date: "",
    to_date: "",
  };
};

export default function Analytics() {
  const [
    dashboard,
    setDashboard,
  ] = useState<DashboardData>(
    EMPTY_DASHBOARD
  );

  const [
    preset,
    setPreset,
  ] = useState<Preset>("last30");

  const [
    filters,
    setFilters,
  ] = useState<AnalyticsFilters>({
    period: "daily",
    ...getPresetDates("last30"),
  });

  const [
    salesTrend,
    setSalesTrend,
  ] = useState<any[]>([]);

  const [
    salesVsOrders,
    setSalesVsOrders,
  ] = useState<any[]>([]);

  const [
    products,
    setProducts,
  ] = useState<any[]>([]);

  const [
    customers,
    setCustomers,
  ] = useState<any[]>([]);

  const [
    paymentMethods,
    setPaymentMethods,
  ] = useState<any[]>([]);

  const [
    loadingSummary,
    setLoadingSummary,
  ] = useState(false);

  const [
    loadingTrend,
    setLoadingTrend,
  ] = useState(false);

  const [
    loadingSalesOrders,
    setLoadingSalesOrders,
  ] = useState(false);

  const [
    loadingProducts,
    setLoadingProducts,
  ] = useState(false);

  const [
    loadingCustomers,
    setLoadingCustomers,
  ] = useState(false);

  const [
    loadingPayments,
    setLoadingPayments,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    productSort,
    setProductSort,
  ] = useState<ProductSort>(
    "revenue"
  );

  const formatCurrency = useCallback(
    (value: any) =>
      `₹${numberValue(
        value
      ).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
    []
  );

  const handlePresetChange = (
    value: Preset
  ) => {
    setPreset(value);

    if (value === "custom") {
      return;
    }

    setFilters((previous) => ({
      ...previous,
      ...getPresetDates(value),
    }));
  };

  const handleDateChange = (
    field:
      | "from_date"
      | "to_date",
    value: string
  ) => {
    setPreset("custom");

    setFilters((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleOptionalFilter = (
    field:
      | "product_id"
      | "category_id"
      | "customer_id"
      | "payment_method",
    value: string
  ) => {
    setFilters((previous) => ({
      ...previous,
      [field]:
        value === ""
          ? undefined
          : value,
    }));
  };

  const clearFilters = () => {
    setPreset("last30");

    setFilters({
      period: "daily",
      ...getPresetDates("last30"),
    });
  };

  const validateDates = () => {
    if (
      filters.from_date &&
      filters.to_date &&
      filters.from_date >
        filters.to_date
    ) {
      setError(
        "Invalid date range. From Date cannot be after To Date."
      );

      return false;
    }

    return true;
  };

  const commonParams = useMemo(
    () => ({
      from_date: filters.from_date,
      to_date: filters.to_date,
      period: filters.period,
      product_id: filters.product_id,
      category_id: filters.category_id,
      customer_id: filters.customer_id,
      payment_method:
        filters.payment_method,
    }),
    [filters]
  );

  const productParams = useMemo(
    () => ({
      ...commonParams,
      sort_by: productSort,
    }),
    [
      commonParams,
      productSort,
    ]
  );

  const customerParams = useMemo(
    () => ({
      ...commonParams,
    }),
    [commonParams]
  );

  const loadSummary = useCallback(
    async () => {
      setLoadingSummary(true);

      try {
        const response =
          await getSalesSummary(
            commonParams
          );

        const summary =
          unwrap(response) || {};

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
              summary.total_items_sold
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
      } catch (err) {
        console.error(
          "Analytics summary error:",
          err
        );

        setError(
          "Unable to load sales summary."
        );
      } finally {
        setLoadingSummary(false);
      }
    },
    [commonParams]
  );

  const loadTrend = useCallback(
    async () => {
      setLoadingTrend(true);

      try {
        const response =
          await getSalesTrend(
            commonParams
          );

        setSalesTrend(
          asArray(response)
        );
      } catch (err) {
        console.error(
          "Sales trend error:",
          err
        );

        setSalesTrend([]);

        setError(
          "Unable to load sales trend."
        );
      } finally {
        setLoadingTrend(false);
      }
    },
    [commonParams]
  );

  const loadSalesOrders =
    useCallback(
      async () => {
        setLoadingSalesOrders(true);

        try {
          const response =
            await getSalesVsOrders(
              commonParams
            );

          setSalesVsOrders(
            asArray(response)
          );
        } catch (err) {
          console.error(
            "Sales vs orders error:",
            err
          );

          setSalesVsOrders([]);

          setError(
            "Unable to load sales vs orders."
          );
        } finally {
          setLoadingSalesOrders(
            false
          );
        }
      },
      [commonParams]
    );

  const loadProducts = useCallback(
    async () => {
      setLoadingProducts(true);

      try {
        const response =
          await getSalesProducts(
            productParams
          );

        setProducts(
          asArray(response)
        );
      } catch (err) {
        console.error(
          "Products analytics error:",
          err
        );

        setProducts([]);

        setError(
          "Unable to load product analytics."
        );
      } finally {
        setLoadingProducts(false);
      }
    },
    [productParams]
  );

  const loadCustomers =
    useCallback(
      async () => {
        setLoadingCustomers(true);

        try {
          const response =
            await getSalesCustomers(
              customerParams
            );

          setCustomers(
            asArray(response)
          );
        } catch (err) {
          console.error(
            "Customers analytics error:",
            err
          );

          setCustomers([]);

          setError(
            "Unable to load customer analytics."
          );
        } finally {
          setLoadingCustomers(
            false
          );
        }
      },
      [customerParams]
    );

  const loadPayments = useCallback(
    async () => {
      setLoadingPayments(true);

      try {
        const response =
          await getPaymentMethods(
            commonParams
          );

        setPaymentMethods(
          asArray(response)
        );
      } catch (err) {
        console.error(
          "Payment analytics error:",
          err
        );

        setPaymentMethods([]);

        setError(
          "Unable to load payment analytics."
        );
      } finally {
        setLoadingPayments(false);
      }
    },
    [commonParams]
  );

  const loadAnalytics = useCallback(
    async () => {
      if (!validateDates()) {
        return;
      }

      setError("");

      await Promise.all([
        loadSummary(),
        loadTrend(),
        loadSalesOrders(),
        loadProducts(),
        loadCustomers(),
        loadPayments(),
      ]);
    },
    [
      loadSummary,
      loadTrend,
      loadSalesOrders,
      loadProducts,
      loadCustomers,
      loadPayments,
      filters.from_date,
      filters.to_date,
    ]
  );

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const refreshAnalytics = async () => {
    clearAnalyticsCache();
    await loadAnalytics();
  };

  const revenueChart = useMemo(
    () =>
      salesTrend.map((item) => ({
        date: getDateValue(item),
        revenue:
          getRevenueValue(item),
      })),
    [salesTrend]
  );

  const salesOrdersChart =
    useMemo(
      () =>
        salesVsOrders.map(
          (item) => ({
            date:
              getDateValue(item),
            revenue:
              getRevenueValue(item),
            orders:
              getOrdersValue(item),
          })
        ),
      [salesVsOrders]
    );

  const productChart = useMemo(
    () =>
      products.map((item) => ({
        name:
          item?.product_name ??
          item?.product ??
          item?.name ??
          item?.sku ??
          "Unknown",
        quantity:
          getQuantityValue(item),
        revenue:
          getRevenueValue(item),
      })),
    [products]
  );

  const customerChart = useMemo(
    () =>
      customers.map((item) => ({
        name:
          item?.customer_name ??
          item?.full_name ??
          item?.name ??
          item?.email ??
          "Unknown",
        revenue:
          getRevenueValue(item),
        orders:
          getOrdersValue(item),
      })),
    [customers]
  );

  const paymentChart = useMemo(
    () =>
      paymentMethods.map(
        (item) => ({
          method:
            item?.method ??
            item?.payment_method ??
            item?.name ??
            "Other",
          revenue:
            getRevenueValue(item),
          transactions:
            getOrdersValue(item),
        })
      ),
    [paymentMethods]
  );

  const downloadBlob = (
    blob: Blob,
    filename: string
  ) => {
    const url =
      window.URL.createObjectURL(
        blob
      );

    const link =
      document.createElement("a");

    link.href = url;
    link.download = filename;

    document.body.appendChild(link);

    link.click();

    link.remove();

    window.URL.revokeObjectURL(
      url
    );
  };

  const handleExportCsv = async () => {
    try {
      const response =
        await exportSalesCsv(
          commonParams
        );

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
        await exportSalesPdf(
          commonParams
        );

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

  const kpis = [
    {
      title: "Total Revenue",
      value: formatCurrency(
        dashboard.total_revenue
      ),
      icon: <TrendingUp />,
      accent: "#22C55E",
    },
    {
      title: "Total Orders",
      value:
        dashboard.total_orders.toLocaleString(
          "en-IN"
        ),
      icon: <ShoppingCart />,
      accent: "#3B82F6",
    },
    {
      title: "Average Order Value",
      value: formatCurrency(
        dashboard.average_order_value
      ),
      icon: <ReceiptLong />,
      accent: "#8B5CF6",
    },
    {
      title: "Total Items Sold",
      value:
        dashboard.total_items_sold.toLocaleString(
          "en-IN"
        ),
      icon: <Inventory2 />,
      accent: "#F59E0B",
    },
    {
      title: "Total Discount",
      value: formatCurrency(
        dashboard.total_discount
      ),
      icon: <Percent />,
      accent: "#EC4899",
    },
    {
      title: "Total Tax",
      value: formatCurrency(
        dashboard.total_tax
      ),
      icon: (
        <AccountBalanceWallet />
      ),
      accent: "#14B8A6",
    },
  ];

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        bgcolor: "#0B1120",
      }}
    >
      <Sidebar />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          ml: {
            xs: 0,
            md: "80px",
          },
          minWidth: 0,
        }}
      >
        <Topbar />

        <Container
          maxWidth="xl"
          sx={{
            mt: {
              xs: 9,
              md: 10,
            },
            pb: 6,
          }}
        >
          {error && (
            <Alert
              severity="error"
              onClose={() =>
                setError("")
              }
              sx={{
                mb: 3,
                borderRadius: 2,
              }}
            >
              {error}
            </Alert>
          )}

          <Stack
            direction={{
              xs: "column",
              lg: "row",
            }}
            justifyContent="space-between"
            alignItems={{
              xs: "flex-start",
              lg: "center",
            }}
            spacing={3}
            mb={4}
          >
            <Box>
              <Typography
                sx={{
                  color: "#FFFFFF",
                  fontWeight: 800,
                  fontSize: {
                    xs: 28,
                    md: 34,
                  },
                  lineHeight: 1.2,
                }}
              >
                Sales Analytics
              </Typography>

              <Typography
                sx={{
                  color: "#94A3B8",
                  mt: 1,
                  fontSize: 15,
                }}
              >
                Monitor revenue,
                orders, products
                and customer
                performance.
              </Typography>
            </Box>

            <Stack
              direction={{
                xs: "column",
                sm: "row",
              }}
              spacing={1.5}
              width={{
                xs: "100%",
                sm: "auto",
              }}
            >
              <Button
                variant="outlined"
                startIcon={<Download />}
                onClick={
                  handleExportCsv
                }
                sx={{
                  color: "#E2E8F0",
                  borderColor:
                    "#475569",
                  textTransform:
                    "none",
                  fontWeight: 700,
                  borderRadius: 2,
                  "&:hover": {
                    borderColor:
                      "#22C55E",
                  },
                }}
              >
                Export CSV
              </Button>

              <Button
                variant="contained"
                startIcon={<Download />}
                onClick={
                  handleExportPdf
                }
                sx={{
                  bgcolor: "#22C55E",
                  color: "#052E16",
                  textTransform:
                    "none",
                  fontWeight: 800,
                  borderRadius: 2,
                  boxShadow: "none",
                  "&:hover": {
                    bgcolor: "#16A34A",
                    boxShadow: "none",
                  },
                }}
              >
                Export PDF
              </Button>

              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={
                  refreshAnalytics
                }
                sx={{
                  color: "#CBD5E1",
                  borderColor:
                    "#475569",
                  textTransform:
                    "none",
                  fontWeight: 700,
                  borderRadius: 2,
                }}
              >
                Refresh
              </Button>
            </Stack>
          </Stack>

          {/* FILTERS */}

          <Paper
            sx={{
              p: {
                xs: 2,
                md: 3,
              },
              mb: 4,
              bgcolor: "#111827",
              border:
                "1px solid #263449",
              borderRadius: 3,
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                mx: {
                  xs: -2,
                  md: -3,
                },
                mt: {
                  xs: -2,
                  md: -3,
                },
                mb: 3,
                px: {
                  xs: 2,
                  md: 3,
                },
                py: 2.2,
                background:
                  "linear-gradient(135deg, #172033 0%, #111827 100%)",
                borderBottom:
                  "1px solid #334155",
              }}
            >
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
              >
                <Box>
                  <Typography
                    sx={{
                      color: "#FFFFFF",
                      fontWeight: 800,
                      fontSize: 19,
                    }}
                  >
                    Sales Filters
                  </Typography>

                  <Typography
                    sx={{
                      color: "#A5B4FC",
                      fontSize: 13,
                      mt: 0.5,
                    }}
                  >
                    Refine the analytics
                    by date and sales
                    attributes.
                  </Typography>
                </Box>

                <Button
                  size="small"
                  onClick={
                    clearFilters
                  }
                  sx={{
                    color: "#F59E0B",
                    textTransform:
                      "none",
                    fontWeight: 700,
                  }}
                >
                  Reset
                </Button>
              </Stack>
            </Box>

            <Grid
              container
              spacing={2}
            >
              <Grid
                size={{
                  xs: 12,
                  sm: 6,
                  md: 3,
                }}
              >
                <DarkSelect
                  label="Date Range"
                  value={preset}
                  onChange={(event: any) =>
                    handlePresetChange(
                      event.target
                        .value as Preset
                    )
                  }
                >
                  <MenuItem value="today">
                    Today
                  </MenuItem>

                  <MenuItem value="last7">
                    Last 7 Days
                  </MenuItem>

                  <MenuItem value="last30">
                    Last 30 Days
                  </MenuItem>

                  <MenuItem value="thisMonth">
                    This Month
                  </MenuItem>

                  <MenuItem value="lastMonth">
                    Last Month
                  </MenuItem>

                  <MenuItem value="custom">
                    Custom Range
                  </MenuItem>
                </DarkSelect>
              </Grid>

              <Grid
                size={{
                  xs: 12,
                  sm: 6,
                  md: 3,
                }}
              >
                <DarkDateField
                  label="From Date"
                  value={
                    filters.from_date ??
                    ""
                  }
                  onChange={(
                    event: any
                  ) =>
                    handleDateChange(
                      "from_date",
                      event.target
                        .value
                    )
                  }
                />
              </Grid>

              <Grid
                size={{
                  xs: 12,
                  sm: 6,
                  md: 3,
                }}
              >
                <DarkDateField
                  label="To Date"
                  value={
                    filters.to_date ??
                    ""
                  }
                  onChange={(
                    event: any
                  ) =>
                    handleDateChange(
                      "to_date",
                      event.target
                        .value
                    )
                  }
                />
              </Grid>

              <Grid
                size={{
                  xs: 12,
                  sm: 6,
                  md: 3,
                }}
              >
                <DarkSelect
                  label="Period"
                  value={
                    filters.period ??
                    "daily"
                  }
                  onChange={(
                    event: any
                  ) =>
                    setFilters(
                      (previous) => ({
                        ...previous,
                        period:
                          event.target
                            .value,
                      })
                    )
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
                </DarkSelect>
              </Grid>

              <Grid
                size={{
                  xs: 12,
                  sm: 6,
                  md: 3,
                }}
              >
                <DarkTextField
                  label="Product ID"
                  placeholder="Optional"
                  value={
                    filters.product_id ??
                    ""
                  }
                  onChange={(
                    event: any
                  ) =>
                    handleOptionalFilter(
                      "product_id",
                      event.target
                        .value
                    )
                  }
                />
              </Grid>

              <Grid
                size={{
                  xs: 12,
                  sm: 6,
                  md: 3,
                }}
              >
                <DarkTextField
                  label="Category ID"
                  placeholder="Optional"
                  value={
                    filters.category_id ??
                    ""
                  }
                  onChange={(
                    event: any
                  ) =>
                    handleOptionalFilter(
                      "category_id",
                      event.target
                        .value
                    )
                  }
                />
              </Grid>

              <Grid
                size={{
                  xs: 12,
                  sm: 6,
                  md: 3,
                }}
              >
                <DarkTextField
                  label="Customer ID"
                  placeholder="Optional"
                  value={
                    filters.customer_id ??
                    ""
                  }
                  onChange={(
                    event: any
                  ) =>
                    handleOptionalFilter(
                      "customer_id",
                      event.target
                        .value
                    )
                  }
                />
              </Grid>

              <Grid
                size={{
                  xs: 12,
                  sm: 6,
                  md: 3,
                }}
              >
                <DarkSelect
                  label="Payment Method"
                  value={
                    filters.payment_method ??
                    ""
                  }
                  onChange={(
                    event: any
                  ) =>
                    handleOptionalFilter(
                      "payment_method",
                      event.target
                        .value
                    )
                  }
                >
                  <MenuItem value="">
                    All Methods
                  </MenuItem>

                  <MenuItem value="Cash">
                    Cash
                  </MenuItem>

                  <MenuItem value="Card">
                    Card
                  </MenuItem>

                  <MenuItem value="UPI">
                    UPI
                  </MenuItem>

                  <MenuItem value="Bank Transfer">
                    Bank Transfer
                  </MenuItem>

                  <MenuItem value="Other">
                    Other
                  </MenuItem>
                </DarkSelect>
              </Grid>
            </Grid>
          </Paper>

          {/* KPI CARDS */}

          <Grid
            container
            spacing={2}
            mb={4}
          >
            {kpis.map((kpi) => (
              <Grid
                key={kpi.title}
                size={{
                  xs: 12,
                  sm: 6,
                  md: 4,
                  lg: 2,
                }}
              >
                <Card
                  sx={{
                    height: "100%",
                    bgcolor: "#111827",
                    border:
                      "1px solid #1E293B",
                    borderRadius: 3,
                    position:
                      "relative",
                    overflow: "hidden",
                  }}
                >
                  <Box
                    sx={{
                      position:
                        "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 3,
                      bgcolor:
                        kpi.accent,
                    }}
                  />

                  <CardContent
                    sx={{
                      p: 2.5,
                      "&:last-child": {
                        pb: 2.5,
                      },
                    }}
                  >
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="flex-start"
                    >
                      <Box>
                        <Typography
                          sx={{
                            color:
                              "#94A3B8",
                            fontSize: 13,
                            fontWeight:
                              700,
                          }}
                        >
                          {kpi.title}
                        </Typography>

                        {loadingSummary ? (
                          <Skeleton
                            width={110}
                            height={42}
                            sx={{
                              bgcolor:
                                "#1E293B",
                            }}
                          />
                        ) : (
                          <Typography
                            sx={{
                              color:
                                "#F8FAFC",
                              fontSize: 20,
                              fontWeight:
                                800,
                              mt: 1,
                            }}
                          >
                            {kpi.value}
                          </Typography>
                        )}
                      </Box>

                      <Box
                        sx={{
                          width: 38,
                          height: 38,
                          borderRadius: 2,
                          display:
                            "flex",
                          alignItems:
                            "center",
                          justifyContent:
                            "center",
                          color:
                            kpi.accent,
                          bgcolor: `${kpi.accent}18`,
                        }}
                      >
                        {kpi.icon}
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* CHARTS */}

          <Grid
            container
            spacing={3}
            mb={3}
          >
            <Grid
              size={{
                xs: 12,
                md: 6,
              }}
            >
              <AnalyticsCard
                title="Revenue Trend"
                subtitle="Revenue generated over time"
                loading={loadingTrend}
                empty={
                  revenueChart.length ===
                  0
                }
              >
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <LineChart
                    data={
                      revenueChart
                    }
                    margin={{
                      top: 10,
                      right: 10,
                      left: 0,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid
                      stroke="#243244"
                      strokeDasharray="4 4"
                    />

                    <XAxis
                      dataKey="date"
                      tick={{
                        fill: "#94A3B8",
                        fontSize: 11,
                      }}
                      axisLine={{
                        stroke:
                          "#334155",
                      }}
                      tickLine={false}
                    />

                    <YAxis
                      tick={{
                        fill: "#94A3B8",
                        fontSize: 11,
                      }}
                      axisLine={false}
                      tickLine={false}
                    />

                    <Tooltip
                      contentStyle={{
                        background:
                          "#0F172A",
                        border:
                          "1px solid #334155",
                        borderRadius: 8,
                        color:
                          "#FFFFFF",
                      }}
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
                      dot={{
                        r: 3,
                        fill:
                          "#22C55E",
                      }}
                      activeDot={{
                        r: 6,
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </AnalyticsCard>
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 6,
              }}
            >
              <AnalyticsCard
                title="Sales vs Orders"
                subtitle="Revenue and order volume comparison"
                loading={
                  loadingSalesOrders
                }
                empty={
                  salesOrdersChart.length ===
                  0
                }
              >
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <LineChart
                    data={
                      salesOrdersChart
                    }
                    margin={{
                      top: 10,
                      right: 10,
                      left: 0,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid
                      stroke="#243244"
                      strokeDasharray="4 4"
                    />

                    <XAxis
                      dataKey="date"
                      tick={{
                        fill: "#94A3B8",
                        fontSize: 11,
                      }}
                      axisLine={{
                        stroke:
                          "#334155",
                      }}
                      tickLine={false}
                    />

                    <YAxis
                      tick={{
                        fill: "#94A3B8",
                        fontSize: 11,
                      }}
                      axisLine={false}
                      tickLine={false}
                    />

                    <Tooltip
                      contentStyle={{
                        background:
                          "#0F172A",
                        border:
                          "1px solid #334155",
                        borderRadius: 8,
                      }}
                    />

                    <Legend
                      wrapperStyle={{
                        color:
                          "#CBD5E1",
                      }}
                    />

                    <Line
                      type="monotone"
                      dataKey="revenue"
                      name="Revenue"
                      stroke="#22C55E"
                      strokeWidth={3}
                      dot={false}
                    />

                    <Line
                      type="monotone"
                      dataKey="orders"
                      name="Orders"
                      stroke="#3B82F6"
                      strokeWidth={3}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </AnalyticsCard>
            </Grid>
          </Grid>

          <Grid
            container
            spacing={3}
            mb={3}
          >
            <Grid
              size={{
                xs: 12,
                md: 6,
              }}
            >
              <AnalyticsCard
                title="Top Performing Products"
                subtitle="Best products by selected metric"
                loading={
                  loadingProducts
                }
                empty={
                  productChart.length ===
                  0
                }
                height={440}
                action={
                  <FormControl
                    size="small"
                    sx={{
                      minWidth: 145,
                    }}
                  >
                    <Select
                      value={
                        productSort
                      }
                      onChange={(
                        event
                      ) =>
                        setProductSort(
                          event.target
                            .value as ProductSort
                        )
                      }
                      sx={{
                        color:
                          "#E2E8F0",
                        bgcolor:
                          "#0F172A",
                        borderRadius: 2,
                        ".MuiOutlinedInput-notchedOutline":
                          {
                            borderColor:
                              "#334155",
                          },
                        "&:hover .MuiOutlinedInput-notchedOutline":
                          {
                            borderColor:
                              "#475569",
                          },
                        ".MuiSvgIcon-root":
                          {
                            color:
                              "#94A3B8",
                          },
                      }}
                    >
                      <MenuItem value="revenue">
                        Revenue
                      </MenuItem>

                      <MenuItem value="quantity">
                        Quantity Sold
                      </MenuItem>
                    </Select>
                  </FormControl>
                }
              >
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <BarChart
                    data={
                      productChart
                    }
                    layout="vertical"
                    margin={{
                      top: 5,
                      right: 20,
                      left: 10,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid
                      stroke="#243244"
                      strokeDasharray="4 4"
                    />

                    <XAxis
                      type="number"
                      tick={{
                        fill: "#94A3B8",
                        fontSize: 11,
                      }}
                      axisLine={false}
                      tickLine={false}
                    />

                    <YAxis
                      type="category"
                      dataKey="name"
                      width={125}
                      tick={{
                        fill: "#CBD5E1",
                        fontSize: 11,
                      }}
                      axisLine={false}
                      tickLine={false}
                    />

                    <Tooltip
                      contentStyle={{
                        background:
                          "#0F172A",
                        border:
                          "1px solid #334155",
                        borderRadius: 8,
                      }}
                      formatter={(
                        value: any
                      ) =>
                        productSort ===
                        "revenue"
                          ? formatCurrency(
                              value
                            )
                          : numberValue(
                              value
                            ).toLocaleString(
                              "en-IN"
                            )
                      }
                    />

                    <Bar
                      dataKey={
                        productSort
                      }
                      fill={
                        productSort ===
                        "revenue"
                          ? "#22C55E"
                          : "#F59E0B"
                      }
                      radius={[
                        0,
                        5,
                        5,
                        0,
                      ]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </AnalyticsCard>
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 6,
              }}
            >
              <AnalyticsCard
                title="Top Customers"
                subtitle="Customers generating the most revenue"
                loading={
                  loadingCustomers
                }
                empty={
                  customerChart.length ===
                  0
                }
                height={440}
              >
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <BarChart
                    data={
                      customerChart
                    }
                    margin={{
                      top: 10,
                      right: 10,
                      left: 0,
                      bottom: 40,
                    }}
                  >
                    <CartesianGrid
                      stroke="#243244"
                      strokeDasharray="4 4"
                    />

                    <XAxis
                      dataKey="name"
                      tick={{
                        fill: "#CBD5E1",
                        fontSize: 10,
                      }}
                      axisLine={{
                        stroke:
                          "#334155",
                      }}
                      tickLine={false}
                      interval={0}
                      angle={-25}
                      textAnchor="end"
                    />

                    <YAxis
                      tick={{
                        fill: "#94A3B8",
                        fontSize: 11,
                      }}
                      axisLine={false}
                      tickLine={false}
                    />

                    <Tooltip
                      contentStyle={{
                        background:
                          "#0F172A",
                        border:
                          "1px solid #334155",
                        borderRadius: 8,
                      }}
                      formatter={(
                        value: any
                      ) =>
                        formatCurrency(
                          value
                        )
                      }
                    />

                    <Bar
                      dataKey="revenue"
                      name="Revenue"
                      fill="#8B5CF6"
                      radius={[
                        5,
                        5,
                        0,
                        0,
                      ]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </AnalyticsCard>
            </Grid>
          </Grid>

          <Grid
            container
            spacing={3}
            mb={3}
          >
            <Grid
              size={{
                xs: 12,
              }}
            >
              <AnalyticsCard
                title="Payment Method Analysis"
                subtitle="Revenue distribution by payment method"
                loading={
                  loadingPayments
                }
                empty={
                  paymentChart.length ===
                  0
                }
                height={400}
              >
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <PieChart>
                    <Pie
                      data={
                        paymentChart
                      }
                      dataKey="revenue"
                      nameKey="method"
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={125}
                      paddingAngle={3}
                      label
                    >
                      {paymentChart.map(
                        (
                          _,
                          index
                        ) => (
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
                      contentStyle={{
                        background:
                          "#0F172A",
                        border:
                          "1px solid #334155",
                        borderRadius: 8,
                      }}
                      formatter={(
                        value: any,
                        _name: any,
                        props: any
                      ) => [
                        formatCurrency(
                          value
                        ),
                        `Revenue • ${numberValue(
                          props
                            ?.payload
                            ?.transactions
                        )} transactions`,
                      ]}
                    />

                    <Legend
                      wrapperStyle={{
                        color:
                          "#CBD5E1",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </AnalyticsCard>
            </Grid>
          </Grid>

          {/* PRODUCT TABLE */}

          <AnalyticsTable
            title="Top Performing Products"
            subtitle="Detailed product performance"
            loading={
              loadingProducts
            }
            headers={[
              "Product",
              "Units Sold",
              "Revenue",
            ]}
            empty={
              products.length === 0
            }
          >
            {products.map(
              (item, index) => (
                <TableRow
                  key={
                    item.product_id ??
                    item.id ??
                    index
                  }
                  hover
                >
                  <StyledTableCell>
                    <Typography
                      color="#F8FAFC"
                      fontWeight={700}
                    >
                      {item.product_name ??
                        item.product ??
                        item.name ??
                        item.sku ??
                        "Unknown"}
                    </Typography>

                    {item.sku && (
                      <Typography
                        color="#64748B"
                        fontSize={12}
                      >
                        {item.sku}
                      </Typography>
                    )}
                  </StyledTableCell>

                  <StyledTableCell align="right">
                    {getQuantityValue(
                      item
                    ).toLocaleString(
                      "en-IN"
                    )}
                  </StyledTableCell>

                  <StyledTableCell align="right">
                    {formatCurrency(
                      getRevenueValue(
                        item
                      )
                    )}
                  </StyledTableCell>
                </TableRow>
              )
            )}
          </AnalyticsTable>

          {/* CUSTOMER TABLE */}

          <AnalyticsTable
            title="Customer Revenue Analysis"
            subtitle="Detailed customer purchasing performance"
            loading={
              loadingCustomers
            }
            headers={[
              "Customer",
              "Orders",
              "Total Spend",
              "Average Order Value",
            ]}
            empty={
              customers.length === 0
            }
          >
            {customers.map(
              (item, index) => {
                const revenue =
                  getRevenueValue(item);

                const orders =
                  getOrdersValue(item);

                const aov =
                  numberValue(
                    item.average_order_value ??
                      item.avg_order_value ??
                      (orders
                        ? revenue /
                          orders
                        : 0)
                  );

                return (
                  <TableRow
                    key={
                      item.customer_id ??
                      item.id ??
                      index
                    }
                    hover
                  >
                    <StyledTableCell>
                      <Typography
                        color="#F8FAFC"
                        fontWeight={700}
                      >
                        {item.customer_name ??
                          item.full_name ??
                          item.name ??
                          item.email ??
                          "Unknown"}
                      </Typography>
                    </StyledTableCell>

                    <StyledTableCell align="right">
                      {orders.toLocaleString(
                        "en-IN"
                      )}
                    </StyledTableCell>

                    <StyledTableCell align="right">
                      {formatCurrency(
                        revenue
                      )}
                    </StyledTableCell>

                    <StyledTableCell align="right">
                      {formatCurrency(
                        aov
                      )}
                    </StyledTableCell>
                  </TableRow>
                );
              }
            )}
          </AnalyticsTable>

          {/* PAYMENT TABLE */}

          <AnalyticsTable
            title="Payment Method Details"
            subtitle="Transaction and revenue breakdown"
            loading={
              loadingPayments
            }
            headers={[
              "Payment Method",
              "Transactions",
              "Revenue",
            ]}
            empty={
              paymentMethods.length ===
              0
            }
          >
            {paymentMethods.map(
              (item, index) => (
                <TableRow
                  key={
                    item.payment_method ??
                    item.method ??
                    index
                  }
                  hover
                >
                  <StyledTableCell>
                    <Typography
                      color="#F8FAFC"
                      fontWeight={700}
                    >
                      {item.method ??
                        item.payment_method ??
                        item.name ??
                        "Other"}
                    </Typography>
                  </StyledTableCell>

                  <StyledTableCell align="right">
                    {getOrdersValue(
                      item
                    ).toLocaleString(
                      "en-IN"
                    )}
                  </StyledTableCell>

                  <StyledTableCell align="right">
                    {formatCurrency(
                      getRevenueValue(
                        item
                      )
                    )}
                  </StyledTableCell>
                </TableRow>
              )
            )}
          </AnalyticsTable>
        </Container>
      </Box>
    </Box>
  );
}

/* ------------------------------------------------ */
/* DARK TEXT FIELD */
/* ------------------------------------------------ */

function DarkTextField({
  label,
  ...props
}: any) {
  return (
    <TextField
      {...props}
      fullWidth
      label={label}
      sx={{
        "& .MuiInputLabel-root": {
          color: "#94A3B8",
        },

        "& .MuiInputLabel-root.Mui-focused":
          {
            color: "#22C55E",
          },

        "& .MuiOutlinedInput-root": {
          color: "#F8FAFC",
          bgcolor: "#0F172A",
          borderRadius: 2,

          "& fieldset": {
            borderColor: "#334155",
          },

          "&:hover fieldset": {
            borderColor: "#475569",
          },

          "&.Mui-focused fieldset":
            {
              borderColor: "#22C55E",
            },
        },

        "& input::placeholder": {
          color: "#64748B",
          opacity: 1,
        },
      }}
    />
  );
}

/* ------------------------------------------------ */
/* DARK DATE FIELD */
/* ------------------------------------------------ */

function DarkDateField({
  label,
  ...props
}: any) {
  return (
    <TextField
      {...props}
      fullWidth
      type="date"
      label={label}
      InputLabelProps={{
        shrink: true,
      }}
      sx={{
        "& .MuiInputLabel-root": {
          color: "#94A3B8",
        },

        "& .MuiInputLabel-root.Mui-focused":
          {
            color: "#22C55E",
          },

        "& .MuiOutlinedInput-root": {
          color: "#F8FAFC",
          bgcolor: "#0F172A",
          borderRadius: 2,

          "& fieldset": {
            borderColor: "#334155",
          },

          "&:hover fieldset": {
            borderColor: "#475569",
          },

          "&.Mui-focused fieldset":
            {
              borderColor: "#22C55E",
            },
        },

        "& input::-webkit-calendar-picker-indicator":
          {
            filter: "invert(1)",
            opacity: 0.8,
          },
      }}
    />
  );
}

/* ------------------------------------------------ */
/* DARK SELECT */
/* ------------------------------------------------ */

function DarkSelect({
  label,
  children,
  ...props
}: any) {
  return (
    <FormControl fullWidth>
      <InputLabel
        sx={{
          color: "#94A3B8",

          "&.Mui-focused": {
            color: "#22C55E",
          },
        }}
      >
        {label}
      </InputLabel>

      <Select
        {...props}
        label={label}
        sx={{
          color: "#F8FAFC",
          bgcolor: "#0F172A",
          borderRadius: 2,

          ".MuiOutlinedInput-notchedOutline":
            {
              borderColor: "#334155",
            },

          "&:hover .MuiOutlinedInput-notchedOutline":
            {
              borderColor: "#475569",
            },

          "&.Mui-focused .MuiOutlinedInput-notchedOutline":
            {
              borderColor: "#22C55E",
            },

          ".MuiSvgIcon-root": {
            color: "#94A3B8",
          },
        }}
      >
        {children}
      </Select>
    </FormControl>
  );
}

/* ------------------------------------------------ */
/* ANALYTICS CARD */
/* ------------------------------------------------ */

function AnalyticsCard({
  title,
  subtitle,
  loading,
  empty,
  children,
  height = 400,
  action,
}: {
  title: string;
  subtitle?: string;
  loading: boolean;
  empty: boolean;
  children: ReactNode;
  height?: number;
  action?: ReactNode;
}) {
  return (
    <Paper
      sx={{
        p: {
          xs: 2,
          md: 3,
        },
        bgcolor: "#111827",
        color: "white",
        border:
          "1px solid #1E293B",
        borderRadius: 3,
        height,
        overflow: "hidden",
      }}
    >
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="flex-start"
        gap={2}
        mb={2}
      >
        <Box>
          <Typography
            fontSize={18}
            fontWeight={800}
            color="#FFFFFF"
          >
            {title}
          </Typography>

          {subtitle && (
            <Typography
              color="#A5B4FC"
              fontSize={12}
              mt={0.5}
            >
              {subtitle}
            </Typography>
          )}
        </Box>

        {action}
      </Stack>

      <Box
        sx={{
          height:
            "calc(100% - 55px)",
          minHeight: 0,
        }}
      >
        {loading ? (
          <Box
            sx={{
              height: "100%",
              display: "flex",
              alignItems:
                "center",
              justifyContent:
                "center",
            }}
          >
            <CircularProgress
              size={32}
              sx={{
                color: "#22C55E",
              }}
            />
          </Box>
        ) : empty ? (
          <Box
            sx={{
              height: "100%",
              display: "flex",
              alignItems:
                "center",
              justifyContent:
                "center",
              textAlign: "center",
              px: 3,
            }}
          >
            <Typography
              color="#64748B"
              fontSize={14}
            >
              No sales data
              available for the
              selected period.
            </Typography>
          </Box>
        ) : (
          children
        )}
      </Box>
    </Paper>
  );
}

/* ------------------------------------------------ */
/* ANALYTICS TABLE */
/* ------------------------------------------------ */

function AnalyticsTable({
  title,
  subtitle,
  headers,
  loading,
  empty,
  children,
}: {
  title: string;
  subtitle?: string;
  headers: string[];
  loading: boolean;
  empty: boolean;
  children: ReactNode;
}) {
  return (
    <Paper
      sx={{
        bgcolor: "#111827",
        border:
          "1px solid #263449",
        borderRadius: 3,
        mb: 3,
        overflow: "hidden",
        boxShadow:
          "0 8px 30px rgba(0,0,0,0.18)",
      }}
    >
      {/* SECTION TITLE */}

      <Box
        sx={{
          px: {
            xs: 2,
            md: 3,
          },
          py: 2.5,
          background:
            "linear-gradient(135deg, #172033 0%, #111827 100%)",
          borderBottom:
            "1px solid #334155",
        }}
      >
        <Typography
          sx={{
            color: "#FFFFFF",
            fontSize: 19,
            fontWeight: 800,
            letterSpacing: 0.2,
          }}
        >
          {title}
        </Typography>

        {subtitle && (
          <Typography
            sx={{
              color: "#A5B4FC",
              fontSize: 13,
              mt: 0.6,
              fontWeight: 500,
            }}
          >
            {subtitle}
          </Typography>
        )}
      </Box>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              {headers.map(
                (header, index) => (
                  <TableCell
                    key={header}
                    align={
                      index === 0
                        ? "left"
                        : "right"
                    }
                    sx={{
                      background:
                        "#1E293B",
                      color:
                        "#E2E8F0",
                      fontWeight: 900,
                      fontSize: 12,
                      textTransform:
                        "uppercase",
                      letterSpacing: 0.8,
                      borderBottom:
                        "2px solid #334155",
                      py: 1.8,
                      px: {
                        xs: 1.5,
                        md: 2.5,
                      },
                      whiteSpace:
                        "nowrap",
                    }}
                  >
                    {header}
                  </TableCell>
                )
              )}
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={
                    headers.length
                  }
                >
                  <Stack
                    spacing={1.5}
                    py={2}
                  >
                    <Skeleton
                      sx={{
                        bgcolor:
                          "#1E293B",
                      }}
                    />

                    <Skeleton
                      sx={{
                        bgcolor:
                          "#1E293B",
                      }}
                    />

                    <Skeleton
                      sx={{
                        bgcolor:
                          "#1E293B",
                      }}
                    />
                  </Stack>
                </TableCell>
              </TableRow>
            ) : empty ? (
              <TableRow>
                <TableCell
                  colSpan={
                    headers.length
                  }
                  align="center"
                  sx={{
                    py: 6,
                    color:
                      "#64748B",
                    borderBottom:
                      "none",
                  }}
                >
                  No data available
                  for the selected
                  period.
                </TableCell>
              </TableRow>
            ) : (
              children
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}

/* ------------------------------------------------ */
/* TABLE CELL */
/* ------------------------------------------------ */

const StyledTableCell = (
  props: any
) => (
  <TableCell
    {...props}
    sx={{
      color: "#CBD5E1",
      borderBottom:
        "1px solid #1E293B",
      py: 2,
      px: {
        xs: 1.5,
        md: 2.5,
      },
      ...props.sx,
    }}
  />
);