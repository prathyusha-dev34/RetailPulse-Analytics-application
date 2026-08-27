import { useEffect, useState } from "react";

import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Stack,
  Button,
  TextField,
  MenuItem,
  CircularProgress,
  Alert,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";

import {
  Search,
  Refresh,
  Download,
  Notifications,
  Assessment,
} from "@mui/icons-material";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import api from "../api/axios";

// =====================================================
// TYPES
// =====================================================

interface ProductForecast {
  id: number;
  product_id: number;
  category_id: number;

  product_name: string;
  sku: string;
  category_name: string;
  brand: string;

  current_stock: number;
  available_stock: number;
  reorder_level: number;

  historical_sales: number;
  predicted_demand: number;

  expected_growth_percentage: number;
  confidence_score: number;
  forecast_accuracy: number;

  forecast_period: string;
  recommendation: string;
  forecast_value: string;

  generated_at?: string;
}

interface CategoryForecast {
  category_id: number;
  category_name: string;
  total_historical_sales: number;
  predicted_demand: number;
  expected_growth_percentage: number;
  confidence_score: number;
  forecast_accuracy: number;
  forecast_value: string;
}

interface DashboardData {
  total_predicted_demand: number;
  products_expected_to_run_out: number;
  high_growth_products: number;
  slow_moving_products: number;
  forecast_accuracy: number;
  total_forecasts: number;
}

interface ForecastNotification {
  message: string;
  type: string;
}

// =====================================================
// CONSTANTS
// =====================================================

const FORECAST_PERIODS = [
  {
    label: "Next 7 Days",
    value: "7_days",
  },
  {
    label: "Next 30 Days",
    value: "30_days",
  },
  {
    label: "Next 90 Days",
    value: "90_days",
  },
];

const COLORS = [
  "#38BDF8",
  "#22C55E",
  "#F59E0B",
  "#EF4444",
  "#A855F7",
];

const darkFieldStyle = {
  minWidth: 180,

  "& .MuiInputLabel-root": {
    color: "#CBD5E1",
  },

  "& .MuiInputLabel-root.Mui-focused": {
    color: "#38BDF8",
  },

  "& .MuiOutlinedInput-root": {
    color: "#E2E8F0",

    "& fieldset": {
      borderColor: "#475569",
    },

    "&:hover fieldset": {
      borderColor: "#38BDF8",
    },

    "&.Mui-focused fieldset": {
      borderColor: "#38BDF8",
    },
  },

  "& .MuiSelect-select": {
    color: "#E2E8F0",
  },
};

// =====================================================
// COMPONENT
// =====================================================

export default function Forecast() {
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  const [forecastPeriod, setForecastPeriod] =
    useState("30_days");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [searchText, setSearchText] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("");
  const [sortBy, setSortBy] = useState("");

  const [dashboard, setDashboard] =
    useState<DashboardData | null>(null);

  const [products, setProducts] =
    useState<ProductForecast[]>([]);

  const [allProducts, setAllProducts] =
    useState<ProductForecast[]>([]);

  const [categories, setCategories] =
    useState<CategoryForecast[]>([]);

  const [productChartData, setProductChartData] =
    useState<any[]>([]);

  const [growthChartData, setGrowthChartData] =
    useState<any[]>([]);

  const [productTrendData, setProductTrendData] =
    useState<any[]>([]);

  const [topProductsData, setTopProductsData] =
    useState<any[]>([]);

  const [seasonalData, setSeasonalData] =
    useState<any[]>([]);

  const [categoryChartData, setCategoryChartData] =
    useState<any[]>([]);

  const [showNotifications, setShowNotifications] =
    useState(false);

  const [notifications, setNotifications] =
    useState<ForecastNotification[]>([]);

  // =====================================================
  // HELPERS
  // =====================================================

  const getNumber = (value: unknown): number => {
    const number = Number(value);

    return Number.isFinite(number) ? number : 0;
  };

  const getRecommendedReorder = (
    predictedDemand: number,
    currentStock: number,
    reorderLevel: number
  ): number => {
    const demand = getNumber(predictedDemand);
    const stock = getNumber(currentStock);
    const threshold = getNumber(reorderLevel);

    if (stock <= threshold) {
      return Math.max(
        0,
        Math.ceil(demand + threshold - stock)
      );
    }

    return Math.max(
      0,
      Math.ceil(demand - stock)
    );
  };

  const getRisk = (
    currentStock: number,
    reorderLevel: number,
    predictedDemand: number
  ): string => {
    const stock = getNumber(currentStock);
    const threshold = getNumber(reorderLevel);
    const demand = getNumber(predictedDemand);

    if (stock <= threshold) {
      return "LOW STOCK";
    }

    if (demand <= 0 && stock > 0) {
      return "OVERSTOCK";
    }

    if (stock < demand) {
      return "REORDER";
    }

    if (stock > demand * 2) {
      return "OVERSTOCK";
    }

    return "NORMAL";
  };

  const getRiskColor = (risk: string): string => {
    switch (risk) {
      case "LOW STOCK":
        return "#991B1B";

      case "REORDER":
        return "#92400E";

      case "OVERSTOCK":
        return "#334155";

      default:
        return "#166534";
    }
  };

  // =====================================================
  // LOAD FORECAST DATA
  // =====================================================

  const fetchForecastData = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        "/forecast/analytics"
      );

      const data = response.data;

      console.log(
        "FORECAST ANALYTICS RESPONSE:",
        data
      );

      // =================================================
      // DASHBOARD
      // =================================================

      setDashboard(data.dashboard ?? null);

      // =================================================
      // PRODUCT DATA
      // =================================================

      const productData: ProductForecast[] =
        Array.isArray(data.product_forecasts)
          ? data.product_forecasts
          : [];

      // =================================================
      // CATEGORY DATA
      // =================================================

      const categoryData: CategoryForecast[] =
        Array.isArray(data.category_forecasts)
          ? data.category_forecasts
          : [];

      setAllProducts(productData);
      setProducts(productData);
      setCategories(categoryData);

      // =================================================
      // HISTORICAL VS PREDICTED
      // =================================================

      const historicalForecastData =
        productData.map((item) => ({
          name:
            item.product_name ||
            "Unknown Product",

          historical:
            getNumber(item.historical_sales),

          predicted:
            getNumber(item.predicted_demand),
        }));

      setProductChartData(
        historicalForecastData
      );

      // =================================================
      // PRODUCT GROWTH
      // =================================================

      const growthData =
        productData.map((item) => ({
          name:
            item.product_name ||
            "Unknown Product",

          growth:
            getNumber(
              item.expected_growth_percentage
            ),
        }));

      setGrowthChartData(growthData);

      // =================================================
      // PRODUCT DEMAND TREND
      // =================================================

      const trendData =
        productData.map((item) => ({
          name:
            item.product_name ||
            "Unknown Product",

          historical:
            getNumber(item.historical_sales),

          forecast:
            getNumber(item.predicted_demand),
        }));

      setProductTrendData(trendData);

      // =================================================
      // TOP PREDICTED PRODUCTS
      // =================================================

      const topData =
        [...productData]
          .sort(
            (a, b) =>
              getNumber(b.predicted_demand) -
              getNumber(a.predicted_demand)
          )
          .slice(0, 5)
          .map((item) => ({
            name:
              item.product_name ||
              "Unknown Product",

            demand:
              getNumber(item.predicted_demand),
          }));

      setTopProductsData(topData);

      // =================================================
      // SEASONAL DATA
      // =================================================

      const seasonal =
        productData.map((item) => ({
          month:
            item.forecast_period ||
            "Forecast",

          sales:
            getNumber(item.historical_sales),

          forecast:
            getNumber(item.predicted_demand),
        }));

      setSeasonalData(seasonal);

      // =================================================
      // CATEGORY CHART
      // =================================================

      const categoryDataForChart =
        categoryData.map((item) => ({
          name:
            item.category_name ||
            "Unknown Category",

          demand:
            getNumber(item.predicted_demand),
        }));

      setCategoryChartData(
        categoryDataForChart
      );
    } catch (error: any) {
      console.error(
        "Forecast Load Error:",
        error
      );

      if (error?.response?.status === 401) {
        setError(
          "Session expired. Please login again."
        );
      } else {
        setError(
          error?.response?.data?.detail ||
            "Failed to load forecast data."
        );
      }

      setDashboard(null);
      setProducts([]);
      setAllProducts([]);
      setCategories([]);
      setProductChartData([]);
      setGrowthChartData([]);
      setProductTrendData([]);
      setTopProductsData([]);
      setSeasonalData([]);
      setCategoryChartData([]);
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    fetchForecastData();
  }, []);

  // =====================================================
  // GENERATE FORECAST
  // =====================================================

  const generateForecast = async () => {
    try {
      setGenerating(true);
      setError("");

      if (
        forecastPeriod === "custom" &&
        (!startDate || !endDate)
      ) {
        setError(
          "Start Date and End Date are required."
        );
        return;
      }

      await api.post(
        "/forecast/generate",
        {
          forecast_period:
            forecastPeriod,

          start_date:
            startDate || null,

          end_date:
            endDate || null,
        }
      );

      await fetchForecastData();
    } catch (error: any) {
      console.error(
        "Forecast Generate Error:",
        error
      );

      setError(
        error?.response?.data?.detail ||
          "Forecast generation failed."
      );
    } finally {
      setGenerating(false);
    }
  };

  // =====================================================
  // SEARCH / FILTER / SORT
  // =====================================================

  const handleSearch = () => {
    let filtered = [...allProducts];

    if (searchText.trim()) {
      filtered =
        filtered.filter((item) =>
          item.product_name
            ?.toLowerCase()
            .includes(
              searchText.toLowerCase()
            )
        );
    }

    if (brand.trim()) {
      filtered =
        filtered.filter((item) =>
          item.brand
            ?.toLowerCase()
            .includes(
              brand.toLowerCase()
            )
        );
    }

    if (category) {
      filtered =
        filtered.filter(
          (item) =>
            item.category_name ===
            category
        );
    }

    if (sortBy === "demand") {
      filtered.sort(
        (a, b) =>
          getNumber(b.predicted_demand) -
          getNumber(a.predicted_demand)
      );
    }

    if (sortBy === "stock") {
      filtered.sort(
        (a, b) =>
          getNumber(a.current_stock) -
          getNumber(b.current_stock)
      );
    }

    if (sortBy === "growth") {
      filtered.sort(
        (a, b) =>
          getNumber(
            b.expected_growth_percentage
          ) -
          getNumber(
            a.expected_growth_percentage
          )
      );
    }

    if (sortBy === "accuracy") {
      filtered.sort(
        (a, b) =>
          getNumber(
            b.forecast_accuracy
          ) -
          getNumber(
            a.forecast_accuracy
          )
      );
    }

    setProducts(filtered);
  };

  // =====================================================
  // REFRESH
  // =====================================================

  const handleRefresh = () => {
    setSearchText("");
    setBrand("");
    setCategory("");
    setSortBy("");
    setForecastPeriod("30_days");
    setStartDate("");
    setEndDate("");

    fetchForecastData();
  };

  // =====================================================
  // NOTIFICATIONS
  // =====================================================

  const toggleNotifications = async () => {
    const value = !showNotifications;

    setShowNotifications(value);

    if (value) {
      try {
        const response = await api.get(
          "/notifications/forecast"
        );

        setNotifications(
          Array.isArray(response.data)
            ? response.data
            : []
        );
      } catch (error) {
        console.error(
          "Notification Error:",
          error
        );

        setNotifications([]);
      }
    }
  };

  // =====================================================
  // DOWNLOAD FILE
  // =====================================================

  const downloadFile = (
    data: Blob,
    fileName: string
  ) => {
    const url =
      window.URL.createObjectURL(data);

    const link =
      document.createElement("a");

    link.href = url;
    link.download = fileName;

    document.body.appendChild(link);

    link.click();

    link.remove();

    window.URL.revokeObjectURL(url);
  };

  // =====================================================
  // EXPORT PRODUCT CSV
  // =====================================================

  const exportProductsCSV = async () => {
    try {
      const response = await api.get(
        "/forecast/export/products/csv",
        {
          responseType: "blob",
        }
      );

      downloadFile(
        response.data,
        "product_forecast.csv"
      );
    } catch (error) {
      console.error(
        "CSV Export Error:",
        error
      );

      setError(
        "Product CSV export failed."
      );
    }
  };

  // =====================================================
  // EXPORT CATEGORY CSV
  // =====================================================

  const exportCategoriesCSV = async () => {
    try {
      const response = await api.get(
        "/forecast/export/categories/csv",
        {
          responseType: "blob",
        }
      );

      downloadFile(
        response.data,
        "category_forecast.csv"
      );
    } catch (error) {
      console.error(
        "Category Export Error:",
        error
      );

      setError(
        "Category CSV export failed."
      );
    }
  };

  // =====================================================
  // EXPORT PRODUCT PDF
  // =====================================================

  const exportProductsPDF = async () => {
    try {
      const response = await api.get(
        "/forecast/export/products/pdf",
        {
          responseType: "blob",
        }
      );

      downloadFile(
        response.data,
        "product_forecast.pdf"
      );
    } catch (error) {
      console.error(
        "PDF Export Error:",
        error
      );

      setError(
        "Product PDF export failed."
      );
    }
  };

  // =====================================================
  // CATEGORY RECOMMENDATION
  // =====================================================

  const getCategoryRecommendation = (
    growth: number
  ) => {
    if (growth > 20) {
      return "Increase Stock";
    }

    if (growth > 0) {
      return "Monitor Growth";
    }

    if (growth < -20) {
      return "Reduce Stock";
    }

    if (growth < 0) {
      return "Decrease Demand";
    }

    return "Stable Demand";
  };

  // =====================================================
  // CATEGORY CHIP COLOR
  // =====================================================

  const getCategoryRecommendationColor = (
    growth: number
  ) => {
    if (growth > 20) {
      return "#166534";
    }

    if (growth > 0) {
      return "#14532D";
    }

    if (growth < -20) {
      return "#991B1B";
    }

    if (growth < 0) {
      return "#92400E";
    }

    return "#334155";
  };

  // =====================================================
  // EMPTY CHART
  // =====================================================

  const EmptyChart = ({
    message,
  }: {
    message: string;
  }) => (
    <Box
      sx={{
        height: 350,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Typography
        sx={{
          color: "#94A3B8",
        }}
      >
        {message}
      </Typography>
    </Box>
  );

  // =====================================================
  // RETURN
  // =====================================================

  return (
    <Box
      sx={{
        p: 3,
        width: "100%",
        minHeight: "100vh",
        overflowX: "hidden",
        background: "#0F172A",
        boxSizing: "border-box",
      }}
    >
      {/* TITLE */}

      <Typography
        variant="h4"
        fontWeight={700}
        sx={{
          color: "#FFFFFF",
          mb: 3,
        }}
      >
        Demand Forecasting & Predictive Analytics
      </Typography>

      {/* ERROR */}

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
        >
          {error}
        </Alert>
      )}

      {/* LOADING */}

      {loading && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            mb: 3,
          }}
        >
          <CircularProgress />
        </Box>
      )}

      {/* =====================================================
          DASHBOARD CARDS
      ===================================================== */}

      <Grid
        container
        spacing={2}
        sx={{ mb: 3 }}
      >
        {[
          [
            "Total Forecasts",
            dashboard?.total_forecasts ?? 0,
          ],
          [
            "Predicted Demand",
            dashboard?.total_predicted_demand ?? 0,
          ],
          [
            "Run Out Risk",
            dashboard?.products_expected_to_run_out ?? 0,
          ],
          [
            "High Growth",
            dashboard?.high_growth_products ?? 0,
          ],
          [
            "Slow Moving",
            dashboard?.slow_moving_products ?? 0,
          ],
          [
            "Accuracy",
            `${dashboard?.forecast_accuracy ?? 0}%`,
          ],
        ].map((item, index) => (
          <Grid
            key={index}
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
                background: "#1E293B",
              }}
            >
              <CardContent>
                <Typography
                  variant="subtitle2"
                  sx={{
                    color: "#94A3B8",
                  }}
                >
                  {item[0]}
                </Typography>

                <Typography
                  variant="h4"
                  fontWeight={700}
                  sx={{
                    color: "#FFFFFF",
                    mt: 1,
                  }}
                >
                  {item[1]}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* =====================================================
          FILTER SECTION
      ===================================================== */}

      <Stack
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Stack
          direction="row"
          spacing={2}
          sx={{
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <TextField
            select
            label="Forecast Period"
            value={forecastPeriod}
            onChange={(e) =>
              setForecastPeriod(
                e.target.value
              )
            }
            sx={darkFieldStyle}
          >
            {FORECAST_PERIODS.map((item) => (
              <MenuItem
                key={item.value}
                value={item.value}
              >
                {item.label}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            type="date"
            label="Start Date"
            value={startDate}
            onChange={(e) =>
              setStartDate(
                e.target.value
              )
            }
            slotProps={{
              inputLabel: {
                shrink: true,
              },
            }}
            sx={darkFieldStyle}
          />

          <TextField
            type="date"
            label="End Date"
            value={endDate}
            onChange={(e) =>
              setEndDate(
                e.target.value
              )
            }
            slotProps={{
              inputLabel: {
                shrink: true,
              },
            }}
            sx={darkFieldStyle}
          />

          <TextField
            label="Search Product"
            value={searchText}
            onChange={(e) =>
              setSearchText(
                e.target.value
              )
            }
            sx={darkFieldStyle}
          />

          <TextField
            label="Brand"
            value={brand}
            onChange={(e) =>
              setBrand(e.target.value)
            }
            sx={darkFieldStyle}
          />

          <TextField
            select
            label="Category"
            value={category}
            onChange={(e) =>
              setCategory(
                e.target.value
              )
            }
            sx={darkFieldStyle}
          >
            <MenuItem value="">
              All Categories
            </MenuItem>

            {[
              ...new Set(
                allProducts.map(
                  (item) =>
                    item.category_name
                )
              ),
            ].map((cat) => (
              <MenuItem
                key={cat}
                value={cat}
              >
                {cat}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Sort By"
            value={sortBy}
            onChange={(e) =>
              setSortBy(
                e.target.value
              )
            }
            sx={darkFieldStyle}
          >
            <MenuItem value="">
              Default
            </MenuItem>

            <MenuItem value="demand">
              Highest Predicted Demand
            </MenuItem>

            <MenuItem value="stock">
              Lowest Stock
            </MenuItem>

            <MenuItem value="growth">
              Highest Growth
            </MenuItem>

            <MenuItem value="accuracy">
              Forecast Accuracy
            </MenuItem>
          </TextField>
        </Stack>

        {/* BUTTONS */}

        <Stack
          direction="row"
          spacing={2}
          sx={{
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Button
            variant="contained"
            startIcon={<Search />}
            onClick={handleSearch}
          >
            Search
          </Button>

          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={handleRefresh}
            sx={{
              color: "#FFFFFF",
              borderColor: "#64748B",
            }}
          >
            Refresh
          </Button>

          <Button
            variant="contained"
            startIcon={<Assessment />}
            onClick={generateForecast}
            disabled={generating}
          >
            {generating
              ? "Generating..."
              : "Generate Forecast"}
          </Button>

          <Button
            variant="outlined"
            startIcon={<Notifications />}
            onClick={
              toggleNotifications
            }
            sx={{
              color: "#FFFFFF",
              borderColor: "#64748B",
            }}
          >
            Notifications
          </Button>
        </Stack>
      </Stack>

      {/* =====================================================
          HISTORICAL VS FORECAST
      ===================================================== */}

      <Card
        sx={{
          mb: 3,
          background: "#1E293B",
        }}
      >
        <CardContent>
          <Typography
            variant="h6"
            fontWeight={700}
            sx={{
              color: "#FFFFFF",
              mb: 2,
            }}
          >
            Historical Sales vs Forecast
          </Typography>

          {productChartData.length === 0 ? (
            <EmptyChart
              message="No historical or forecast data available"
            />
          ) : (
            <Box
              sx={{
                height: 350,
                width: "100%",
              }}
            >
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <BarChart
                  data={productChartData}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 20,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#334155"
                  />

                  <XAxis
                    dataKey="name"
                    tick={{
                      fill: "#E2E8F0",
                    }}
                  />

                  <YAxis
                    tick={{
                      fill: "#E2E8F0",
                    }}
                  />

                  <Tooltip
                    contentStyle={{
                      background: "#111827",
                      border:
                        "1px solid #334155",
                    }}
                    labelStyle={{
                      color: "#FFFFFF",
                    }}
                    itemStyle={{
                      color: "#FFFFFF",
                    }}
                  />

                  <Legend />

                  <Bar
                    dataKey="historical"
                    name="Historical Sales"
                    fill="#38BDF8"
                    radius={[
                      5,
                      5,
                      0,
                      0,
                    ]}
                  />

                  <Bar
                    dataKey="predicted"
                    name="Predicted Demand"
                    fill="#22C55E"
                    radius={[
                      5,
                      5,
                      0,
                      0,
                    ]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* =====================================================
          PRODUCT GROWTH FORECAST
      ===================================================== */}

      <Card
        sx={{
          mb: 3,
          background: "#1E293B",
        }}
      >
        <CardContent>
          <Typography
            variant="h6"
            fontWeight={700}
            sx={{
              color: "#FFFFFF",
              mb: 2,
            }}
          >
            Product Growth Forecast
          </Typography>

          {growthChartData.length === 0 ? (
            <EmptyChart
              message="No growth forecast data available"
            />
          ) : (
            <ResponsiveContainer
              width="100%"
              height={350}
            >
              <BarChart
                data={growthChartData}
                margin={{
                  top: 30,
                  right: 30,
                  left: 20,
                  bottom: 20,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#334155"
                />

                <XAxis
                  dataKey="name"
                  tick={{
                    fill: "#E2E8F0",
                  }}
                />

                <YAxis
                  tick={{
                    fill: "#E2E8F0",
                  }}
                  tickFormatter={(value) =>
                    `${value}%`
                  }
                />

                <Tooltip
                  formatter={(value: number) => [
                    `${Number(value).toFixed(
                      2
                    )}%`,
                    "Growth",
                  ]}
                  contentStyle={{
                    background: "#111827",
                    border:
                      "1px solid #334155",
                  }}
                  labelStyle={{
                    color: "#FFFFFF",
                  }}
                  itemStyle={{
                    color: "#FFFFFF",
                  }}
                />

                <Bar
                  dataKey="growth"
                  name="Growth %"
                  fill="#F59E0B"
                  minPointSize={10}
                  radius={[
                    6,
                    6,
                    0,
                    0,
                  ]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* =====================================================
          PRODUCT DEMAND TREND
      ===================================================== */}

      <Card
        sx={{
          mb: 3,
          background: "#1E293B",
        }}
      >
        <CardContent>
          <Typography
            variant="h6"
            fontWeight={700}
            sx={{
              color: "#FFFFFF",
              mb: 2,
            }}
          >
            Product Demand Trend
          </Typography>

          {productTrendData.length === 0 ? (
            <EmptyChart
              message="No demand trend data available"
            />
          ) : (
            <ResponsiveContainer
              width="100%"
              height={350}
            >
              <LineChart
                data={productTrendData}
                margin={{
                  top: 30,
                  right: 30,
                  left: 20,
                  bottom: 20,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#334155"
                />

                <XAxis
                  dataKey="name"
                  tick={{
                    fill: "#E2E8F0",
                  }}
                />

                <YAxis
                  tick={{
                    fill: "#E2E8F0",
                  }}
                />

                <Tooltip
                  contentStyle={{
                    background: "#111827",
                    border:
                      "1px solid #334155",
                  }}
                  labelStyle={{
                    color: "#FFFFFF",
                  }}
                  itemStyle={{
                    color: "#FFFFFF",
                  }}
                />

                <Legend />

                <Line
                  type="monotone"
                  dataKey="historical"
                  name="Historical"
                  stroke="#38BDF8"
                  strokeWidth={3}
                />

                <Line
                  type="monotone"
                  dataKey="forecast"
                  name="Forecast"
                  stroke="#22C55E"
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* =====================================================
          TOP PREDICTED PRODUCTS
      ===================================================== */}

      <Card
        sx={{
          mb: 3,
          background: "#1E293B",
        }}
      >
        <CardContent>
          <Typography
            variant="h6"
            fontWeight={700}
            sx={{
              color: "#FFFFFF",
              mb: 2,
            }}
          >
            Top Predicted Products
          </Typography>

          {topProductsData.length === 0 ? (
            <EmptyChart
              message="No predicted product data available"
            />
          ) : (
            <ResponsiveContainer
              width="100%"
              height={350}
            >
              <BarChart
                data={topProductsData}
                margin={{
                  top: 30,
                  right: 30,
                  left: 20,
                  bottom: 20,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#334155"
                />

                <XAxis
                  dataKey="name"
                  tick={{
                    fill: "#E2E8F0",
                  }}
                />

                <YAxis
                  tick={{
                    fill: "#E2E8F0",
                  }}
                />

                <Tooltip
                  contentStyle={{
                    background: "#111827",
                    border:
                      "1px solid #334155",
                  }}
                  labelStyle={{
                    color: "#FFFFFF",
                  }}
                  itemStyle={{
                    color: "#FFFFFF",
                  }}
                />

                <Bar
                  dataKey="demand"
                  name="Predicted Demand"
                  fill="#A855F7"
                  radius={[
                    6,
                    6,
                    0,
                    0,
                  ]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* =====================================================
          SEASONAL SALES PATTERN
      ===================================================== */}

      <Card
        sx={{
          mb: 3,
          background: "#1E293B",
        }}
      >
        <CardContent>
          <Typography
            variant="h6"
            fontWeight={700}
            sx={{
              color: "#FFFFFF",
              mb: 2,
            }}
          >
            Seasonal Sales Pattern
          </Typography>

          {seasonalData.length === 0 ? (
            <EmptyChart
              message="No seasonal sales data available"
            />
          ) : (
            <ResponsiveContainer
              width="100%"
              height={350}
            >
              <LineChart
                data={seasonalData}
                margin={{
                  top: 30,
                  right: 30,
                  left: 20,
                  bottom: 20,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#334155"
                />

                <XAxis
                  dataKey="month"
                  tick={{
                    fill: "#E2E8F0",
                  }}
                />

                <YAxis
                  tick={{
                    fill: "#E2E8F0",
                  }}
                />

                <Tooltip
                  contentStyle={{
                    background: "#111827",
                    border:
                      "1px solid #334155",
                  }}
                  labelStyle={{
                    color: "#FFFFFF",
                  }}
                  itemStyle={{
                    color: "#FFFFFF",
                  }}
                />

                <Legend />

                <Line
                  type="monotone"
                  dataKey="sales"
                  name="Historical Sales"
                  stroke="#38BDF8"
                  strokeWidth={3}
                />

                <Line
                  type="monotone"
                  dataKey="forecast"
                  name="Forecast"
                  stroke="#22C55E"
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* =====================================================
          CATEGORY DEMAND DISTRIBUTION
      ===================================================== */}

      <Card
        sx={{
          mb: 3,
          background: "#1E293B",
        }}
      >
        <CardContent>
          <Typography
            variant="h6"
            fontWeight={700}
            sx={{
              color: "#FFFFFF",
              mb: 2,
            }}
          >
            Category Demand Distribution
          </Typography>

          {categoryChartData.length === 0 ? (
            <EmptyChart
              message="No category demand data available"
            />
          ) : (
            <Box
              sx={{
                height: 350,
                width: "100%",
              }}
            >
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <PieChart>
                  <Pie
                    data={categoryChartData}
                    dataKey="demand"
                    nameKey="name"
                    outerRadius={120}
                    label
                  >
                    {categoryChartData.map(
                      (item, index) => (
                        <Cell
                          key={`${item.name}-${index}`}
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
                      background: "#111827",
                      border:
                        "1px solid #334155",
                    }}
                    labelStyle={{
                      color: "#FFFFFF",
                    }}
                    itemStyle={{
                      color: "#FFFFFF",
                    }}
                  />

                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* =====================================================
          PRODUCT FORECAST DETAILS
      ===================================================== */}

      <Card
        sx={{
          mb: 3,
          background: "#1E293B",
        }}
      >
        <CardContent>
          <Typography
            variant="h6"
            fontWeight={700}
            sx={{
              color: "#FFFFFF",
              mb: 2,
            }}
          >
            Product Forecast Details
          </Typography>

          <TableContainer
            component={Paper}
            sx={{
              background: "#111827",
              overflowX: "auto",
            }}
          >
            <Table>
              <TableHead>
                <TableRow>
                  {[
                    "Product",
                    "SKU",
                    "Category",
                    "Historical",
                    "Forecast Demand",
                    "Current Stock",
                    "Reorder Threshold",
                    "Recommended Reorder",
                    "Risk",
                  ].map((heading) => (
                    <TableCell
                      key={heading}
                      sx={{
                        color: "#FFFFFF",
                        fontWeight: 700,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {heading}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>

              <TableBody>
                {products.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      align="center"
                      sx={{
                        color: "#CBD5E1",
                      }}
                    >
                      No Product Forecast Data
                      Available
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((row) => {
                    const currentStock =
                      getNumber(
                        row.current_stock
                      );

                    const reorderLevel =
                      getNumber(
                        row.reorder_level
                      );

                    const predictedDemand =
                      getNumber(
                        row.predicted_demand
                      );

                    const recommendedReorder =
                      getRecommendedReorder(
                        predictedDemand,
                        currentStock,
                        reorderLevel
                      );

                    const risk = getRisk(
                      currentStock,
                      reorderLevel,
                      predictedDemand
                    );

                    return (
                      <TableRow key={row.id}>
                        <TableCell
                          sx={{
                            color: "#E2E8F0",
                            fontWeight: 600,
                            whiteSpace:
                              "nowrap",
                          }}
                        >
                          {row.product_name ||
                            "Unknown Product"}
                        </TableCell>

                        <TableCell
                          sx={{
                            color: "#CBD5E1",
                            whiteSpace:
                              "nowrap",
                          }}
                        >
                          {row.sku || "-"}
                        </TableCell>

                        <TableCell
                          sx={{
                            color: "#CBD5E1",
                            whiteSpace:
                              "nowrap",
                          }}
                        >
                          {row.category_name ||
                            "-"}
                        </TableCell>

                        <TableCell
                          sx={{
                            color: "#E2E8F0",
                          }}
                        >
                          {getNumber(
                            row.historical_sales
                          ).toFixed(0)}
                        </TableCell>

                        <TableCell
                          sx={{
                            color: "#38BDF8",
                            fontWeight: 700,
                          }}
                        >
                          {predictedDemand.toFixed(
                            2
                          )}
                        </TableCell>

                        <TableCell
                          sx={{
                            color: "#E2E8F0",
                            fontWeight: 600,
                          }}
                        >
                          {currentStock.toFixed(
                            0
                          )}
                        </TableCell>

                        <TableCell
                          sx={{
                            color: "#F59E0B",
                            fontWeight: 700,
                          }}
                        >
                          {reorderLevel.toFixed(
                            0
                          )}
                        </TableCell>

                        <TableCell
                          sx={{
                            color: "#4ADE80",
                            fontWeight: 700,
                          }}
                        >
                          {recommendedReorder}
                        </TableCell>

                        <TableCell>
                          <Chip
                            label={risk}
                            size="small"
                            sx={{
                              background:
                                getRiskColor(
                                  risk
                                ),
                              color:
                                "#FFFFFF",
                              fontWeight: 700,
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* =====================================================
          CATEGORY FORECAST DETAILS
      ===================================================== */}

      <Card
        sx={{
          mb: 3,
          background: "#1E293B",
        }}
      >
        <CardContent>
          <Typography
            variant="h6"
            fontWeight={700}
            sx={{
              color: "#FFFFFF",
              mb: 2,
            }}
          >
            Category Forecast Details
          </Typography>

          <TableContainer
            component={Paper}
            sx={{
              background: "#111827",
              overflowX: "auto",
            }}
          >
            <Table>
              <TableHead>
                <TableRow>
                  {[
                    "Category",
                    "Products",
                    "Historical Sales",
                    "Forecast Demand",
                    "Current Stock",
                    "Recommended",
                    "Forecast Value",
                  ].map((heading) => (
                    <TableCell
                      key={heading}
                      sx={{
                        color: "#FFFFFF",
                        fontWeight: 700,
                        whiteSpace:
                          "nowrap",
                      }}
                    >
                      {heading}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>

              <TableBody>
                {categories.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      align="center"
                      sx={{
                        color: "#CBD5E1",
                      }}
                    >
                      No Category Forecast Data
                      Available
                    </TableCell>
                  </TableRow>
                ) : (
                  categories.map((row) => {
                    const growth =
                      getNumber(
                        row.expected_growth_percentage
                      );

                    const categoryProducts =
                      allProducts.filter(
                        (product) =>
                          product.category_id ===
                          row.category_id
                      );

                    const currentStock =
                      categoryProducts.reduce(
                        (total, product) =>
                          total +
                          getNumber(
                            product.current_stock
                          ),
                        0
                      );

                    const predictedDemand =
                      getNumber(
                        row.predicted_demand
                      );

                    const reorderThreshold =
                      categoryProducts.reduce(
                        (total, product) =>
                          total +
                          getNumber(
                            product.reorder_level
                          ),
                        0
                      );

                    const recommended =
                      getRecommendedReorder(
                        predictedDemand,
                        currentStock,
                        reorderThreshold
                      );

                    const recommendation =
                      getCategoryRecommendation(
                        growth
                      );

                    return (
                      <TableRow
                        key={
                          row.category_id
                        }
                      >
                        <TableCell
                          sx={{
                            color: "#E2E8F0",
                            fontWeight: 600,
                          }}
                        >
                          {row.category_name}
                        </TableCell>

                        <TableCell
                          sx={{
                            color: "#CBD5E1",
                          }}
                        >
                          {
                            categoryProducts.length
                          }
                        </TableCell>

                        <TableCell
                          sx={{
                            color: "#E2E8F0",
                          }}
                        >
                          {getNumber(
                            row.total_historical_sales
                          ).toFixed(0)}
                        </TableCell>

                        <TableCell
                          sx={{
                            color: "#38BDF8",
                            fontWeight: 700,
                          }}
                        >
                          {predictedDemand.toFixed(
                            2
                          )}
                        </TableCell>

                        <TableCell
                          sx={{
                            color: "#E2E8F0",
                          }}
                        >
                          {currentStock.toFixed(
                            0
                          )}
                        </TableCell>

                        <TableCell>
                          <Chip
                            label={
                              recommended
                            }
                            size="small"
                            sx={{
                              background:
                                "#166534",
                              color:
                                "#FFFFFF",
                              fontWeight: 700,
                            }}
                          />
                        </TableCell>

                        <TableCell
                          sx={{
                            color: "#4ADE80",
                            fontWeight: 700,
                          }}
                        >
                          {row.forecast_value ||
                            "₹0"}
                        </TableCell>

                        <TableCell>
                          <Chip
                            label={
                              recommendation
                            }
                            size="small"
                            sx={{
                              background:
                                getCategoryRecommendationColor(
                                  growth
                                ),
                              color:
                                "#FFFFFF",
                              fontWeight: 600,
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* =====================================================
          EXPORT FORECAST REPORTS
      ===================================================== */}

      <Card
        sx={{
          mb: 3,
          background: "#1E293B",
        }}
      >
        <CardContent>
          <Typography
            variant="h6"
            fontWeight={700}
            sx={{
              color: "#FFFFFF",
              mb: 2,
            }}
          >
            Export Forecast Reports
          </Typography>

          <Stack
            direction="row"
            spacing={2}
            sx={{
              flexWrap: "wrap",
              gap: 2,
            }}
          >
            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={
                exportProductsCSV
              }
              sx={{
                color: "#FFFFFF",
                borderColor: "#64748B",
              }}
            >
              Product CSV
            </Button>

            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={
                exportProductsPDF
              }
              sx={{
                color: "#FFFFFF",
                borderColor: "#64748B",
              }}
            >
              Product PDF
            </Button>

            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={
                exportCategoriesCSV
              }
              sx={{
                color: "#FFFFFF",
                borderColor: "#64748B",
              }}
            >
              Category CSV
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* =====================================================
          NOTIFICATIONS
      ===================================================== */}

      {showNotifications && (
        <Card
          sx={{
            mb: 3,
            background: "#1E293B",
          }}
        >
          <CardContent>
            <Typography
              variant="h6"
              fontWeight={700}
              sx={{
                color: "#FFFFFF",
                mb: 2,
              }}
            >
              Forecast Notifications
            </Typography>

            {notifications.length === 0 ? (
              <Typography
                sx={{
                  color: "#CBD5E1",
                }}
              >
                No new forecast notifications
              </Typography>
            ) : (
              notifications.map(
                (item, index) => (
                  <Card
                    key={index}
                    sx={{
                      mb: 1,
                      background: "#334155",
                    }}
                  >
                    <CardContent>
                      <Typography
                        sx={{
                          color: "#FFFFFF",
                          fontWeight: 600,
                        }}
                      >
                        {item.message}
                      </Typography>

                      <Typography
                        sx={{
                          color: "#CBD5E1",
                        }}
                      >
                        {item.type}
                      </Typography>
                    </CardContent>
                  </Card>
                )
              )
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
}