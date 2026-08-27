import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  Paper,
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
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

import {
  getInventory,
  getInventoryDashboard,
  addStock,
  removeStock,
  adjustStock,
  getInventoryMovements,
  updateReorderLevel,
  getInventoryForecast,
  type ForecastAnalytics,
  type ForecastProduct,
} from "../api/inventoryApi";

// =========================
// Interfaces
// =========================

interface Category {
  name: string;
}

interface Product {
  name: string;
  sku: string;
  brand: string;
  category?: Category;
}

interface InventoryItem {
  id: number;
  current_stock: number;
  reserved_stock: number;
  available_stock: number;
  reorder_level: number;
  stock_status:
    | "IN_STOCK"
    | "LOW_STOCK"
    | "OUT_OF_STOCK";
  updated_at?: string;
  product: Product;
}

interface Dashboard {
  total_products: number;
  total_inventory_quantity: number;
  low_stock_products: number;
  out_of_stock_products: number;
}

interface Movement {
  id: number;
  movement_type: string;
  quantity_changed: number;
  previous_quantity: number;
  updated_quantity: number;
  reason: string;
  remarks?: string;
  performed_by_name?: string;
  created_at: string;
}

// =========================
// Component
// =========================

export default function Inventory() {
  const [inventory, setInventory] =
    useState<InventoryItem[]>([]);

  const [dashboard, setDashboard] =
    useState<Dashboard>({
      total_products: 0,
      total_inventory_quantity: 0,
      low_stock_products: 0,
      out_of_stock_products: 0,
    });

  const [forecast, setForecast] =
    useState<ForecastAnalytics | null>(null);

  const [forecastLoading, setForecastLoading] =
    useState(false);

  const [forecastError, setForecastError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [status, setStatus] =
    useState("");

  const [category, setCategory] =
    useState("");

  const [brand, setBrand] =
    useState("");

  const [sortBy, setSortBy] =
    useState("");

  const [open, setOpen] =
    useState(false);

  const [movementOpen, setMovementOpen] =
    useState(false);

  const [reorderOpen, setReorderOpen] =
    useState(false);

  const [selectedItem, setSelectedItem] =
    useState<InventoryItem | null>(null);

  const [reorderValue, setReorderValue] =
    useState(0);

  const [movements, setMovements] =
    useState<Movement[]>([]);

  const [actionType, setActionType] =
    useState<
      "add" | "remove" | "adjust"
    >("add");

  const [form, setForm] =
    useState({
      inventory_id: 0,
      quantity: 0,
      reason: "",
      remarks: "",
    });

  // =========================
  // Load Inventory
  // =========================

  const loadInventory = async () => {
    try {
      const data = await getInventory({
        search: search || undefined,
        stock_status:
          (status as
            | "IN_STOCK"
            | "LOW_STOCK"
            | "OUT_OF_STOCK"
            | undefined) || undefined,
        sort_by:
          (sortBy as
            | "name"
            | "stock"
            | "recent"
            | undefined) || undefined,
      });

      setInventory(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (error) {
      console.log(
        "Inventory loading failed",
        error
      );

      setInventory([]);
    }
  };

  // =========================
  // Load Dashboard
  // =========================

  const loadDashboard = async () => {
    try {
      const data =
        await getInventoryDashboard();

      setDashboard(data);
    } catch (error) {
      console.log(
        "Dashboard loading failed",
        error
      );
    }
  };

  // =========================
  // Load Forecast
  // =========================

  const loadForecast = async () => {
    try {
      setForecastLoading(true);
      setForecastError("");

      const data =
        await getInventoryForecast();

      setForecast(data);
    } catch (error: any) {
      console.log(
        "Forecast loading failed",
        error
      );

      setForecastError(
        error?.response?.data?.detail ||
          "Failed to load inventory forecast"
      );

      setForecast(null);
    } finally {
      setForecastLoading(false);
    }
  };

  // =========================
  // Load Movements
  // =========================

  const loadMovements = async () => {
    try {
      const data =
        await getInventoryMovements();

      setMovements(
        Array.isArray(data)
          ? data
          : []
      );

      setMovementOpen(true);
    } catch (error) {
      console.log(
        "Movement loading failed",
        error
      );
    }
  };

  // =========================
  // Category Chart Data
  // =========================

  const categoryData =
    useMemo(() => {
      const map: Record<
        string,
        number
      > = {};

      inventory.forEach((item) => {
        const categoryName =
          item.product.category?.name ||
          "Other";

        map[categoryName] =
          (map[categoryName] || 0) +
          item.current_stock;
      });

      return Object.keys(map).map(
        (key) => ({
          name: key,
          value: map[key],
        })
      );
    }, [inventory]);

  // =========================
  // Stock Status Chart Data
  // =========================

  const stockStatusData =
    useMemo(() => {
      const map: Record<
        string,
        number
      > = {};

      inventory.forEach((item) => {
        map[item.stock_status] =
          (map[item.stock_status] || 0) +
          1;
      });

      return Object.keys(map).map(
        (key) => ({
          name: key.replaceAll("_", " "),
          value: map[key],
        })
      );
    }, [inventory]);

  // =========================
  // Forecast Risk Chart
  // =========================

  const forecastRiskData =
    useMemo(() => {
      if (!forecast) {
        return [];
      }

      return [
        {
          name: "Out Of Stock",
          value:
            forecast.risk_summary
              .OUT_OF_STOCK,
        },
        {
          name: "Stockout Risk",
          value:
            forecast.risk_summary
              .STOCKOUT_RISK,
        },
        {
          name: "Low Stock",
          value:
            forecast.risk_summary
              .LOW_STOCK,
        },
        {
          name: "Healthy",
          value:
            forecast.risk_summary
              .HEALTHY,
        },
        {
          name: "Overstock",
          value:
            forecast.risk_summary
              .OVERSTOCK,
        },
      ];
    }, [forecast]);

  // =========================
  // Forecast Category Chart
  // =========================

  const forecastCategoryData =
    useMemo(() => {
      if (!forecast) {
        return [];
      }

      return forecast.categories.map(
        (category) => ({
          name: category.category,
          demand:
            category.forecasted_demand,
          stock:
            category.current_stock,
        })
      );
    }, [forecast]);

  // =========================
  // Frontend Filter + Sort
  // =========================

  const filteredInventory =
    useMemo(() => {
      let data = [...inventory];

      if (category) {
        data = data.filter(
          (item) =>
            item.product.category?.name ===
            category
        );
      }

      if (brand) {
        data = data.filter(
          (item) =>
            item.product.brand === brand
        );
      }

      if (sortBy === "name") {
        data.sort((a, b) =>
          a.product.name.localeCompare(
            b.product.name
          )
        );
      } else if (sortBy === "stock") {
        data.sort(
          (a, b) =>
            b.current_stock -
            a.current_stock
        );
      } else if (sortBy === "recent") {
        data.sort(
          (a, b) =>
            new Date(
              b.updated_at || ""
            ).getTime() -
            new Date(
              a.updated_at || ""
            ).getTime()
        );
      }

      return data;
    }, [
      inventory,
      category,
      brand,
      sortBy,
    ]);

  // =========================
  // Dropdown Values
  // =========================

  const categories =
    useMemo(() => {
      return Array.from(
        new Set(
          inventory
            .map(
              (item) =>
                item.product.category?.name
            )
            .filter(Boolean)
        )
      ) as string[];
    }, [inventory]);

  const brands =
    useMemo(() => {
      return Array.from(
        new Set(
          inventory
            .map(
              (item) =>
                item.product.brand
            )
            .filter(Boolean)
        )
      ) as string[];
    }, [inventory]);

  // =========================
  // Effects
  // =========================

  useEffect(() => {
    loadInventory();
  }, [
    search,
    status,
    sortBy,
  ]);

  useEffect(() => {
    loadDashboard();
    loadForecast();
  }, []);

  // =========================
  // Stock Action Handler
  // =========================

  const handleAction = async () => {
    try {
      if (
        !form.quantity ||
        form.quantity <= 0
      ) {
        alert(
          "Quantity must be greater than 0"
        );
        return;
      }

      if (!form.reason.trim()) {
        alert("Reason is required");
        return;
      }

      if (
        actionType === "remove" &&
        selectedItem &&
        form.quantity >
          selectedItem.available_stock
      ) {
        alert(
          "Cannot remove more than available stock"
        );
        return;
      }

      if (actionType === "add") {
        await addStock(form);
      } else if (
        actionType === "remove"
      ) {
        await removeStock(form);
      } else {
        await adjustStock(form);
      }

      setOpen(false);

      setForm({
        inventory_id: 0,
        quantity: 0,
        reason: "",
        remarks: "",
      });

      await loadInventory();
      await loadDashboard();
      await loadForecast();
    } catch (error: any) {
      console.log(error);

      alert(
        error.response?.data?.detail ||
          "Stock update failed"
      );
    }
  };

  // =========================
  // Forecast Risk Color
  // =========================

  const getRiskColor = (
    risk: string
  ) => {
    switch (risk) {
      case "OUT_OF_STOCK":
        return "error";

      case "STOCKOUT_RISK":
        return "error";

      case "LOW_STOCK":
        return "warning";

      case "HEALTHY":
        return "success";

      case "OVERSTOCK":
        return "info";

      default:
        return "default";
    }
  };

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
            pb: 6,
          }}
        >
          {/* =========================
              Header
          ========================= */}

          <Box
            sx={{
              mb: 4,
              p: 3,
              borderRadius: 3,
              background:
                "linear-gradient(90deg,#1E3A8A,#2563EB)",
              boxShadow:
                "0 10px 25px rgba(37,99,235,.30)",
            }}
          >
            <Typography
              variant="h4"
              sx={{
                color: "#FFFFFF",
                fontWeight: 700,
              }}
            >
              Inventory Management
            </Typography>

            <Typography
              sx={{
                color: "#DBEAFE",
                mt: 1,
              }}
            >
              Monitor inventory levels,
              stock movement, warehouse
              operations, and demand
              forecasting.
            </Typography>
          </Box>

          {/* =========================
              Dashboard Cards
          ========================= */}

          <Grid
            container
            spacing={3}
            mb={4}
          >
            {[
              {
                title: "Total Products",
                value:
                  dashboard.total_products ||
                  0,
                color: "#60A5FA",
              },
              {
                title:
                  "Total Inventory Quantity",
                value:
                  dashboard.total_inventory_quantity ||
                  0,
                color: "#22C55E",
              },
              {
                title:
                  "Low Stock Products",
                value:
                  dashboard.low_stock_products ||
                  0,
                color: "#FACC15",
              },
              {
                title: "Out Of Stock",
                value:
                  dashboard.out_of_stock_products ||
                  0,
                color: "#EF4444",
              },
            ].map((card) => (
              <Grid
                item
                xs={12}
                sm={6}
                lg={3}
                key={card.title}
              >
                <Card
                  sx={{
                    background:
                      "linear-gradient(135deg,#1E293B,#334155)",
                    color: "#FFFFFF",
                    borderRadius: 3,
                    boxShadow:
                      "0 8px 20px rgba(0,0,0,.25)",
                  }}
                >
                  <CardContent>
                    <Typography
                      sx={{
                        color: "#CBD5E1",
                        fontWeight: 600,
                      }}
                    >
                      {card.title}
                    </Typography>

                    <Typography
                      variant="h3"
                      sx={{
                        mt: 1,
                        fontWeight: 700,
                        color: card.color,
                      }}
                    >
                      {card.value}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* =====================================================
              INVENTORY FORECASTING
          ===================================================== */}

          <Box sx={{ mb: 5 }}>
            <Box
              sx={{
                mb: 3,
                p: 3,
                borderRadius: 3,
                background:
                  "linear-gradient(90deg,#312E81,#4F46E5)",
                boxShadow:
                  "0 10px 25px rgba(79,70,229,.30)",
              }}
            >
              <Typography
                variant="h5"
                sx={{
                  color: "#FFFFFF",
                  fontWeight: 700,
                }}
              >
                Inventory Forecasting &
                Smart Replenishment
              </Typography>

              <Typography
                sx={{
                  color: "#E0E7FF",
                  mt: 1,
                }}
              >
                Predict future demand,
                identify stock risks, and
                optimize replenishment.
              </Typography>
            </Box>

            {forecastLoading && (
              <Paper
                sx={{
                  p: 4,
                  mb: 3,
                  bgcolor: "#1E293B",
                  color: "#FFFFFF",
                  textAlign: "center",
                }}
              >
                <Typography>
                  Loading forecast...
                </Typography>
              </Paper>
            )}

            {forecastError && (
              <Paper
                sx={{
                  p: 3,
                  mb: 3,
                  bgcolor: "#451A03",
                  border:
                    "1px solid #F59E0B",
                }}
              >
                <Typography
                  sx={{
                    color: "#FCD34D",
                  }}
                >
                  {forecastError}
                </Typography>
              </Paper>
            )}

            {forecast && (
              <>
                {/* Forecast KPI Cards */}

                <Grid
                  container
                  spacing={3}
                  mb={3}
                >
                  {[
                    {
                      title:
                        "Forecasted Demand",
                      value:
                        forecast.total_forecasted_demand.toFixed(
                          2
                        ),
                      color: "#60A5FA",
                    },
                    {
                      title:
                        "Recommended Quantity",
                      value:
                        forecast.total_recommended_quantity,
                      color: "#22C55E",
                    },
                    {
                      title:
                        "Forecast Growth",
                      value: `${forecast.forecast_growth_percentage.toFixed(
                        2
                      )}%`,
                      color:
                        forecast.forecast_growth_percentage >=
                        0
                          ? "#22C55E"
                          : "#EF4444",
                    },
                    {
                      title:
                        "Confidence Score",
                      value: `${forecast.average_confidence_score.toFixed(
                        2
                      )}%`,
                      color: "#A78BFA",
                    },
                    {
                      title:
                        "Low Stock Risk",
                      value:
                        forecast.low_stock_count,
                      color: "#FACC15",
                    },
                    {
                      title:
                        "Stockout Risk",
                      value:
                        forecast.stockout_risk_count,
                      color: "#FB7185",
                    },
                    {
                      title:
                        "Healthy Stock",
                      value:
                        forecast.healthy_stock_count,
                      color: "#34D399",
                    },
                    {
                      title:
                        "Overstock",
                      value:
                        forecast.overstock_count,
                      color: "#38BDF8",
                    },
                  ].map((card) => (
                    <Grid
                      item
                      xs={12}
                      sm={6}
                      md={3}
                      key={card.title}
                    >
                      <Card
                        sx={{
                          height: "100%",
                          bgcolor: "#1E293B",
                          border:
                            "1px solid #334155",
                          borderRadius: 3,
                        }}
                      >
                        <CardContent>
                          <Typography
                            sx={{
                              color:
                                "#94A3B8",
                              fontWeight: 600,
                            }}
                          >
                            {card.title}
                          </Typography>

                          <Typography
                            variant="h4"
                            sx={{
                              mt: 1,
                              fontWeight: 700,
                              color:
                                card.color,
                            }}
                          >
                            {card.value}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>

                {/* Forecast Summary */}

                <Grid
                  container
                  spacing={3}
                  mb={3}
                >
                  <Grid
                    item
                    xs={12}
                    md={4}
                  >
                    <Card
                      sx={{
                        bgcolor: "#1E293B",
                        borderRadius: 3,
                        border:
                          "1px solid #334155",
                        height: "100%",
                      }}
                    >
                      <CardContent>
                        <Typography
                          variant="h6"
                          sx={{
                            color:
                              "#FFFFFF",
                            fontWeight: 700,
                            mb: 2,
                          }}
                        >
                          Forecast Summary
                        </Typography>

                        <Typography
                          sx={{
                            color:
                              "#CBD5E1",
                            mb: 1,
                          }}
                        >
                          Forecast Period:{" "}
                          <strong>
                            {
                              forecast.forecast_days
                            }{" "}
                            Days
                          </strong>
                        </Typography>

                        <Typography
                          sx={{
                            color:
                              "#CBD5E1",
                            mb: 1,
                          }}
                        >
                          Products:{" "}
                          <strong>
                            {
                              forecast.total_products
                            }
                          </strong>
                        </Typography>

                        <Typography
                          sx={{
                            color:
                              "#CBD5E1",
                            mb: 1,
                          }}
                        >
                          Historical Sales:{" "}
                          <strong>
                            {
                              forecast.total_historical_sales
                            }
                          </strong>
                        </Typography>

                        <Typography
                          sx={{
                            color:
                              "#CBD5E1",
                            mb: 1,
                          }}
                        >
                          Current Stock:{" "}
                          <strong>
                            {
                              forecast.total_current_stock
                            }
                          </strong>
                        </Typography>

                        <Typography
                          sx={{
                            color:
                              "#CBD5E1",
                          }}
                        >
                          Forecast Value:{" "}
                          <strong>
                            ₹
                            {forecast.top_products
                              .reduce(
                                (
                                  total,
                                  product
                                ) =>
                                  total +
                                  product.forecast_value,
                                0
                              )
                              .toLocaleString(
                                "en-IN",
                                {
                                  maximumFractionDigits: 2,
                                }
                              )}
                          </strong>
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Risk Chart */}

                  <Grid
                    item
                    xs={12}
                    md={4}
                  >
                    <Card
                      sx={{
                        bgcolor: "#1E293B",
                        borderRadius: 3,
                        border:
                          "1px solid #334155",
                      }}
                    >
                      <CardContent>
                        <Typography
                          variant="h6"
                          sx={{
                            color:
                              "#FFFFFF",
                            fontWeight: 700,
                            mb: 1,
                          }}
                        >
                          Forecast Risk
                          Distribution
                        </Typography>

                        <Box
                          sx={{
                            height: 280,
                          }}
                        >
                          <ResponsiveContainer
                            width="100%"
                            height="100%"
                          >
                            <PieChart>
                              <Pie
                                data={
                                  forecastRiskData
                                }
                                dataKey="value"
                                nameKey="name"
                                outerRadius={
                                  90
                                }
                                label
                              >
                                {forecastRiskData.map(
                                  (
                                    entry,
                                    index
                                  ) => (
                                    <Cell
                                      key={`risk-${index}`}
                                      fill={
                                        [
                                          "#EF4444",
                                          "#FB7185",
                                          "#FACC15",
                                          "#22C55E",
                                          "#38BDF8",
                                        ][
                                          index %
                                            5
                                        ]
                                      }
                                    />
                                  )
                                )}
                              </Pie>

                              <Tooltip />

                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Category Forecast Chart */}

                  <Grid
                    item
                    xs={12}
                    md={4}
                  >
                    <Card
                      sx={{
                        bgcolor: "#1E293B",
                        borderRadius: 3,
                        border:
                          "1px solid #334155",
                      }}
                    >
                      <CardContent>
                        <Typography
                          variant="h6"
                          sx={{
                            color:
                              "#FFFFFF",
                            fontWeight: 700,
                            mb: 1,
                          }}
                        >
                          Category Demand
                        </Typography>

                        <Box
                          sx={{
                            height: 280,
                          }}
                        >
                          <ResponsiveContainer
                            width="100%"
                            height="100%"
                          >
                            <BarChart
                              data={
                                forecastCategoryData
                              }
                            >
                              <XAxis
                                dataKey="name"
                                tick={{
                                  fill:
                                    "#CBD5E1",
                                }}
                              />

                              <YAxis
                                tick={{
                                  fill:
                                    "#CBD5E1",
                                }}
                              />

                              <Tooltip />

                              <Legend />

                              <Bar
                                dataKey="demand"
                                name="Forecast Demand"
                                fill="#6366F1"
                                radius={[
                                  6,
                                  6,
                                  0,
                                  0,
                                ]}
                              />

                              <Bar
                                dataKey="stock"
                                name="Current Stock"
                                fill="#22C55E"
                                radius={[
                                  6,
                                  6,
                                  0,
                                  0,
                                ]}
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                {/* Top Predicted Products */}

                <Card
                  sx={{
                    bgcolor: "#1E293B",
                    borderRadius: 3,
                    border:
                      "1px solid #334155",
                    mb: 3,
                  }}
                >
                  <CardContent>
                    <Typography
                      variant="h6"
                      sx={{
                        color: "#FFFFFF",
                        fontWeight: 700,
                        mb: 2,
                      }}
                    >
                      Top Predicted Products
                    </Typography>

                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell
                              sx={{
                                color:
                                  "#FFFFFF",
                                fontWeight: 700,
                              }}
                            >
                              Product
                            </TableCell>

                            <TableCell
                              sx={{
                                color:
                                  "#FFFFFF",
                                fontWeight: 700,
                              }}
                            >
                              SKU
                            </TableCell>

                            <TableCell
                              sx={{
                                color:
                                  "#FFFFFF",
                                fontWeight: 700,
                              }}
                            >
                              Category
                            </TableCell>

                            <TableCell
                              align="center"
                              sx={{
                                color:
                                  "#FFFFFF",
                                fontWeight: 700,
                              }}
                            >
                              Historical
                            </TableCell>

                            <TableCell
                              align="center"
                              sx={{
                                color:
                                  "#FFFFFF",
                                fontWeight: 700,
                              }}
                            >
                              Forecast
                            </TableCell>

                            <TableCell
                              align="center"
                              sx={{
                                color:
                                  "#FFFFFF",
                                fontWeight: 700,
                              }}
                            >
                              Current Stock
                            </TableCell>

                            <TableCell
                              align="center"
                              sx={{
                                color:
                                  "#FFFFFF",
                                fontWeight: 700,
                              }}
                            >
                              Recommended
                            </TableCell>

                            <TableCell
                              align="center"
                              sx={{
                                color:
                                  "#FFFFFF",
                                fontWeight: 700,
                              }}
                            >
                              Risk
                            </TableCell>

                            <TableCell
                              align="center"
                              sx={{
                                color:
                                  "#FFFFFF",
                                fontWeight: 700,
                              }}
                            >
                              Reorder
                            </TableCell>
                          </TableRow>
                        </TableHead>

                        <TableBody>
                          {forecast.top_products
                            .length > 0 ? (
                            forecast.top_products.map(
                              (
                                product
                              ) => (
                                <TableRow
                                  key={
                                    product.product_id
                                  }
                                  sx={{
                                    "&:hover":
                                      {
                                        bgcolor:
                                          "#334155",
                                      },
                                  }}
                                >
                                  <TableCell
                                    sx={{
                                      color:
                                        "#FFFFFF",
                                      borderColor:
                                        "#334155",
                                    }}
                                  >
                                    {
                                      product.product
                                    }
                                  </TableCell>

                                  <TableCell
                                    sx={{
                                      color:
                                        "#CBD5E1",
                                      borderColor:
                                        "#334155",
                                    }}
                                  >
                                    {
                                      product.sku
                                    }
                                  </TableCell>

                                  <TableCell
                                    sx={{
                                      color:
                                        "#CBD5E1",
                                      borderColor:
                                        "#334155",
                                    }}
                                  >
                                    {
                                      product.category
                                    }
                                  </TableCell>

                                  <TableCell
                                    align="center"
                                    sx={{
                                      color:
                                        "#CBD5E1",
                                      borderColor:
                                        "#334155",
                                    }}
                                  >
                                    {
                                      product.historical_sales
                                    }
                                  </TableCell>

                                  <TableCell
                                    align="center"
                                    sx={{
                                      color:
                                        "#60A5FA",
                                      fontWeight: 700,
                                      borderColor:
                                        "#334155",
                                    }}
                                  >
                                    {product.forecasted_demand.toFixed(
                                      2
                                    )}
                                  </TableCell>

                                  <TableCell
                                    align="center"
                                    sx={{
                                      color:
                                        "#FFFFFF",
                                      borderColor:
                                        "#334155",
                                    }}
                                  >
                                    {
                                      product.current_stock
                                    }
                                  </TableCell>

                                  <TableCell
                                    align="center"
                                    sx={{
                                      color:
                                        "#22C55E",
                                      fontWeight: 700,
                                      borderColor:
                                        "#334155",
                                    }}
                                  >
                                    {
                                      product.recommended_quantity
                                    }
                                  </TableCell>

                                  <TableCell
                                    align="center"
                                    sx={{
                                      borderColor:
                                        "#334155",
                                    }}
                                  >
                                    <Chip
                                      label={product.stock_risk.replaceAll(
                                        "_",
                                        " "
                                      )}
                                      color={
                                        getRiskColor(
                                          product.stock_risk
                                        ) as
                                          | "error"
                                          | "warning"
                                          | "success"
                                          | "info"
                                          | "default"
                                      }
                                      size="small"
                                    />
                                  </TableCell>

                                  <TableCell
                                    align="center"
                                    sx={{
                                      borderColor:
                                        "#334155",
                                    }}
                                  >
                                    <Chip
                                      label={
                                        product.reorder_required
                                          ? "YES"
                                          : "NO"
                                      }
                                      color={
                                        product.reorder_required
                                          ? "warning"
                                          : "success"
                                      }
                                      size="small"
                                    />
                                  </TableCell>
                                </TableRow>
                              )
                            )
                          ) : (
                            <TableRow>
                              <TableCell
                                colSpan={9}
                                align="center"
                                sx={{
                                  color:
                                    "#94A3B8",
                                  py: 4,
                                }}
                              >
                                No forecast
                                data available.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>

                {/* Category Forecast Table */}

                <Card
                  sx={{
                    bgcolor: "#1E293B",
                    borderRadius: 3,
                    border:
                      "1px solid #334155",
                    mb: 3,
                  }}
                >
                  <CardContent>
                    <Typography
                      variant="h6"
                      sx={{
                        color: "#FFFFFF",
                        fontWeight: 700,
                        mb: 2,
                      }}
                    >
                      Category Forecast
                    </Typography>

                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell
                              sx={{
                                color:
                                  "#FFFFFF",
                                fontWeight: 700,
                              }}
                            >
                              Category
                            </TableCell>

                            <TableCell
                              align="center"
                              sx={{
                                color:
                                  "#FFFFFF",
                                fontWeight: 700,
                              }}
                            >
                              Products
                            </TableCell>

                            <TableCell
                              align="center"
                              sx={{
                                color:
                                  "#FFFFFF",
                                fontWeight: 700,
                              }}
                            >
                              Historical Sales
                            </TableCell>

                            <TableCell
                              align="center"
                              sx={{
                                color:
                                  "#FFFFFF",
                                fontWeight: 700,
                              }}
                            >
                              Forecast Demand
                            </TableCell>

                            <TableCell
                              align="center"
                              sx={{
                                color:
                                  "#FFFFFF",
                                fontWeight: 700,
                              }}
                            >
                              Current Stock
                            </TableCell>

                            <TableCell
                              align="center"
                              sx={{
                                color:
                                  "#FFFFFF",
                                fontWeight: 700,
                              }}
                            >
                              Recommended
                            </TableCell>

                            <TableCell
                              align="center"
                              sx={{
                                color:
                                  "#FFFFFF",
                                fontWeight: 700,
                              }}
                            >
                              Forecast Value
                            </TableCell>
                          </TableRow>
                        </TableHead>

                        <TableBody>
                          {forecast.categories.map(
                            (item) => (
                              <TableRow
                                key={
                                  item.category_id
                                }
                              >
                                <TableCell
                                  sx={{
                                    color:
                                      "#FFFFFF",
                                    borderColor:
                                      "#334155",
                                  }}
                                >
                                  {
                                    item.category
                                  }
                                </TableCell>

                                <TableCell
                                  align="center"
                                  sx={{
                                    color:
                                      "#CBD5E1",
                                    borderColor:
                                      "#334155",
                                  }}
                                >
                                  {
                                    item.product_count
                                  }
                                </TableCell>

                                <TableCell
                                  align="center"
                                  sx={{
                                    color:
                                      "#CBD5E1",
                                    borderColor:
                                      "#334155",
                                  }}
                                >
                                  {
                                    item.historical_sales
                                  }
                                </TableCell>

                                <TableCell
                                  align="center"
                                  sx={{
                                    color:
                                      "#60A5FA",
                                    fontWeight: 700,
                                    borderColor:
                                      "#334155",
                                  }}
                                >
                                  {item.forecasted_demand.toFixed(
                                    2
                                  )}
                                </TableCell>

                                <TableCell
                                  align="center"
                                  sx={{
                                    color:
                                      "#FFFFFF",
                                    borderColor:
                                      "#334155",
                                  }}
                                >
                                  {
                                    item.current_stock
                                  }
                                </TableCell>

                                <TableCell
                                  align="center"
                                  sx={{
                                    color:
                                      "#22C55E",
                                    fontWeight: 700,
                                    borderColor:
                                      "#334155",
                                  }}
                                >
                                  {
                                    item.recommended_quantity
                                  }
                                </TableCell>

                                <TableCell
                                  align="center"
                                  sx={{
                                    color:
                                      "#A78BFA",
                                    fontWeight: 700,
                                    borderColor:
                                      "#334155",
                                  }}
                                >
                                  ₹
                                  {item.forecast_value.toLocaleString(
                                    "en-IN",
                                    {
                                      maximumFractionDigits: 2,
                                    }
                                  )}
                                </TableCell>
                              </TableRow>
                            )
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </>
            )}
          </Box>

          {/* =========================
              Existing Charts
          ========================= */}

          <Grid
            container
            spacing={3}
            mb={4}
          >
            <Grid
              item
              xs={12}
              lg={6}
            >
              <Card
                sx={{
                  bgcolor: "#1E293B",
                  borderRadius: 3,
                  p: 2,
                  border:
                    "1px solid #334155",
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    color: "#FFFFFF",
                    fontWeight: 700,
                    mb: 2,
                  }}
                >
                  Inventory By Category
                </Typography>

                <Box sx={{ height: 320 }}>
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <BarChart
                      data={categoryData}
                    >
                      <XAxis
                        dataKey="name"
                        tick={{
                          fill: "#CBD5E1",
                        }}
                      />

                      <YAxis
                        tick={{
                          fill: "#CBD5E1",
                        }}
                      />

                      <Tooltip />

                      <Bar
                        dataKey="value"
                        fill="#2563EB"
                        radius={[
                          8,
                          8,
                          0,
                          0,
                        ]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Card>
            </Grid>

            <Grid
              item
              xs={12}
              lg={6}
            >
              <Card
                sx={{
                  bgcolor: "#1E293B",
                  borderRadius: 3,
                  p: 2,
                  border:
                    "1px solid #334155",
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    color: "#FFFFFF",
                    fontWeight: 700,
                    mb: 2,
                  }}
                >
                  Stock Status Distribution
                </Typography>

                <Box sx={{ height: 320 }}>
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <PieChart>
                      <Pie
                        data={
                          stockStatusData
                        }
                        dataKey="value"
                        nameKey="name"
                        outerRadius={110}
                        label
                      >
                        {stockStatusData.map(
                          (
                            entry,
                            index
                          ) => (
                            <Cell
                              key={`stock-${index}`}
                              fill={
                                [
                                  "#22C55E",
                                  "#FACC15",
                                  "#EF4444",
                                ][
                                  index % 3
                                ]
                              }
                            />
                          )
                        )}
                      </Pie>

                      <Tooltip />

                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </Card>
            </Grid>
          </Grid>

          {/* =========================
              Search & Filters
          ========================= */}

          <Paper
            sx={{
              p: 3,
              mb: 4,
              bgcolor: "#1E293B",
              borderRadius: 3,
              border:
                "1px solid #334155",
            }}
          >
            <Grid
              container
              spacing={2}
            >
              <Grid
                item
                xs={12}
                md={3}
              >
                <TextField
                  fullWidth
                  label="Search Product / SKU"
                  value={search}
                  onChange={(e) =>
                    setSearch(
                      e.target.value
                    )
                  }
                  sx={{
                    "& .MuiInputLabel-root":
                      {
                        color:
                          "#CBD5E1",
                      },
                    "& .MuiInputLabel-root.Mui-focused":
                      {
                        color:
                          "#60A5FA",
                      },
                    "& .MuiOutlinedInput-root":
                      {
                        color:
                          "#FFFFFF",
                        bgcolor:
                          "#0F172A",
                        "& fieldset":
                          {
                            borderColor:
                              "#475569",
                          },
                        "&:hover fieldset":
                          {
                            borderColor:
                              "#60A5FA",
                          },
                        "&.Mui-focused fieldset":
                          {
                            borderColor:
                              "#2563EB",
                          },
                      },
                  }}
                />
              </Grid>

              <Grid
                item
                xs={12}
                md={2}
              >
                <TextField
                  select
                  fullWidth
                  label="Category"
                  value={category}
                  onChange={(e) =>
                    setCategory(
                      e.target.value
                    )
                  }
                  sx={{
                    "& .MuiInputLabel-root":
                      {
                        color:
                          "#CBD5E1",
                      },
                    "& .MuiOutlinedInput-root":
                      {
                        color:
                          "#FFFFFF",
                        bgcolor:
                          "#0F172A",
                        "& fieldset":
                          {
                            borderColor:
                              "#475569",
                          },
                      },
                    "& .MuiSvgIcon-root":
                      {
                        color:
                          "#FFFFFF",
                      },
                  }}
                >
                  <MenuItem value="">
                    All Categories
                  </MenuItem>

                  {categories.map(
                    (cat) => (
                      <MenuItem
                        key={cat}
                        value={cat}
                      >
                        {cat}
                      </MenuItem>
                    )
                  )}
                </TextField>
              </Grid>

              <Grid
                item
                xs={12}
                md={2}
              >
                <TextField
                  select
                  fullWidth
                  label="Brand"
                  value={brand}
                  onChange={(e) =>
                    setBrand(
                      e.target.value
                    )
                  }
                  sx={{
                    "& .MuiInputLabel-root":
                      {
                        color:
                          "#CBD5E1",
                      },
                    "& .MuiOutlinedInput-root":
                      {
                        color:
                          "#FFFFFF",
                        bgcolor:
                          "#0F172A",
                        "& fieldset":
                          {
                            borderColor:
                              "#475569",
                          },
                      },
                    "& .MuiSvgIcon-root":
                      {
                        color:
                          "#FFFFFF",
                      },
                  }}
                >
                  <MenuItem value="">
                    All Brands
                  </MenuItem>

                  {brands.map(
                    (b) => (
                      <MenuItem
                        key={b}
                        value={b}
                      >
                        {b}
                      </MenuItem>
                    )
                  )}
                </TextField>
              </Grid>

              <Grid
                item
                xs={12}
                md={2}
              >
                <TextField
                  select
                  fullWidth
                  label="Stock Status"
                  value={status}
                  onChange={(e) =>
                    setStatus(
                      e.target.value
                    )
                  }
                  sx={{
                    "& .MuiInputLabel-root":
                      {
                        color:
                          "#CBD5E1",
                      },
                    "& .MuiOutlinedInput-root":
                      {
                        color:
                          "#FFFFFF",
                        bgcolor:
                          "#0F172A",
                        "& fieldset":
                          {
                            borderColor:
                              "#475569",
                          },
                      },
                    "& .MuiSvgIcon-root":
                      {
                        color:
                          "#FFFFFF",
                      },
                  }}
                >
                  <MenuItem value="">
                    All
                  </MenuItem>

                  <MenuItem value="IN_STOCK">
                    In Stock
                  </MenuItem>

                  <MenuItem value="LOW_STOCK">
                    Low Stock
                  </MenuItem>

                  <MenuItem value="OUT_OF_STOCK">
                    Out Of Stock
                  </MenuItem>
                </TextField>
              </Grid>

              <Grid
                item
                xs={12}
                md={2}
              >
                <TextField
                  select
                  fullWidth
                  label="Sort By"
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(
                      e.target.value
                    )
                  }
                  sx={{
                    "& .MuiInputLabel-root":
                      {
                        color:
                          "#CBD5E1",
                      },
                    "& .MuiOutlinedInput-root":
                      {
                        color:
                          "#FFFFFF",
                        bgcolor:
                          "#0F172A",
                        "& fieldset":
                          {
                            borderColor:
                              "#475569",
                          },
                      },
                    "& .MuiSvgIcon-root":
                      {
                        color:
                          "#FFFFFF",
                      },
                  }}
                >
                  <MenuItem value="">
                    Default
                  </MenuItem>

                  <MenuItem value="name">
                    Product Name
                  </MenuItem>

                  <MenuItem value="stock">
                    Current Stock
                  </MenuItem>

                  <MenuItem value="recent">
                    Recently Updated
                  </MenuItem>
                </TextField>
              </Grid>

              <Grid
                item
                xs={12}
                md={1}
              >
                <Button
                  fullWidth
                  variant="contained"
                  sx={{
                    height: "56px",
                    bgcolor:
                      "#2563EB",
                    "&:hover": {
                      bgcolor:
                        "#1D4ED8",
                    },
                  }}
                  onClick={() => {
                    setSearch("");
                    setCategory("");
                    setBrand("");
                    setStatus("");
                    setSortBy("");
                  }}
                >
                  Clear
                </Button>
              </Grid>
            </Grid>
          </Paper>

          {/* =========================
              Inventory Table
          ========================= */}

          <TableContainer
            component={Paper}
            sx={{
              bgcolor: "#1E293B",
              borderRadius: 3,
              border:
                "1px solid #334155",
              mb: 4,
            }}
          >
            <Table
              sx={{
                "& .MuiTableCell-root": {
                  color: "#FFFFFF",
                  borderColor:
                    "#334155",
                },
                "& .MuiTableHead .MuiTableCell-root":
                  {
                    color: "#FFFFFF",
                    fontWeight: 700,
                    backgroundColor:
                      "#1E293B",
                  },
                "& .MuiTableBody .MuiTableRow-root:hover":
                  {
                    backgroundColor:
                      "#334155",
                  },
              }}
            >
              <TableHead>
                <TableRow>
                  <TableCell>
                    Product
                  </TableCell>

                  <TableCell>
                    SKU
                  </TableCell>

                  <TableCell>
                    Category
                  </TableCell>

                  <TableCell>
                    Brand
                  </TableCell>

                  <TableCell align="center">
                    Current
                  </TableCell>

                  <TableCell align="center">
                    Reserved
                  </TableCell>

                  <TableCell align="center">
                    Available
                  </TableCell>

                  <TableCell align="center">
                    Status
                  </TableCell>

                  <TableCell align="center">
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {filteredInventory.length >
                0 ? (
                  filteredInventory.map(
                    (item) => (
                      <TableRow
                        key={item.id}
                      >
                        <TableCell>
                          {
                            item.product
                              .name
                          }
                        </TableCell>

                        <TableCell>
                          {
                            item.product
                              .sku
                          }
                        </TableCell>

                        <TableCell>
                          {item.product
                            .category
                            ?.name ||
                            "-"}
                        </TableCell>

                        <TableCell>
                          {
                            item.product
                              .brand
                          }
                        </TableCell>

                        <TableCell align="center">
                          {
                            item.current_stock
                          }
                        </TableCell>

                        <TableCell align="center">
                          {
                            item.reserved_stock
                          }
                        </TableCell>

                        <TableCell align="center">
                          {
                            item.available_stock
                          }
                        </TableCell>

                        <TableCell align="center">
                          <Chip
                            label={item.stock_status.replaceAll(
                              "_",
                              " "
                            )}
                            color={
                              item.stock_status ===
                              "IN_STOCK"
                                ? "success"
                                : item.stock_status ===
                                  "LOW_STOCK"
                                ? "warning"
                                : "error"
                            }
                            size="small"
                          />
                        </TableCell>

                        <TableCell align="center">
                          <Box
                            sx={{
                              display:
                                "flex",
                              gap: 1,
                              justifyContent:
                                "center",
                              flexWrap:
                                "wrap",
                            }}
                          >
                            <Button
                              size="small"
                              variant="contained"
                              color="success"
                              onClick={() => {
                                setSelectedItem(
                                  item
                                );
                                setActionType(
                                  "add"
                                );
                                setForm({
                                  inventory_id:
                                    item.id,
                                  quantity: 0,
                                  reason: "",
                                  remarks:
                                    "",
                                });
                                setOpen(
                                  true
                                );
                              }}
                            >
                              Add
                            </Button>

                            <Button
                              size="small"
                              variant="contained"
                              color="warning"
                              onClick={() => {
                                setSelectedItem(
                                  item
                                );
                                setActionType(
                                  "remove"
                                );
                                setForm({
                                  inventory_id:
                                    item.id,
                                  quantity: 0,
                                  reason: "",
                                  remarks:
                                    "",
                                });
                                setOpen(
                                  true
                                );
                              }}
                            >
                              Remove
                            </Button>

                            <Button
                              size="small"
                              variant="contained"
                              color="info"
                              onClick={() => {
                                setSelectedItem(
                                  item
                                );
                                setActionType(
                                  "adjust"
                                );
                                setForm({
                                  inventory_id:
                                    item.id,
                                  quantity:
                                    item.current_stock,
                                  reason: "",
                                  remarks:
                                    "",
                                });
                                setOpen(
                                  true
                                );
                              }}
                            >
                              Adjust
                            </Button>

                            <Button
                              size="small"
                              variant="contained"
                              sx={{
                                bgcolor:
                                  "#8B5CF6",
                                color:
                                  "#FFFFFF",
                                "&:hover":
                                  {
                                    bgcolor:
                                      "#7C3AED",
                                  },
                              }}
                              onClick={() => {
                                setSelectedItem(
                                  item
                                );
                                setReorderValue(
                                  item.reorder_level
                                );
                                setReorderOpen(
                                  true
                                );
                              }}
                            >
                              Reorder
                            </Button>
                          </Box>
                        </TableCell>
                      </TableRow>
                    )
                  )
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      align="center"
                      sx={{
                        color:
                          "#94A3B8",
                        py: 4,
                      }}
                    >
                      No inventory records
                      found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* =========================
              Movement History Button
          ========================= */}

          <Box
            sx={{
              display: "flex",
              justifyContent:
                "flex-end",
              mb: 3,
            }}
          >
            <Button
              variant="contained"
              onClick={loadMovements}
            >
              View Movement History
            </Button>
          </Box>

          {/* =========================
              Stock Action Dialog
          ========================= */}

          <Dialog
            open={open}
            onClose={() =>
              setOpen(false)
            }
            fullWidth
            maxWidth="sm"
          >
            <DialogTitle>
              {actionType === "add"
                ? "Add Stock"
                : actionType ===
                  "remove"
                ? "Remove Stock"
                : "Adjust Stock"}
            </DialogTitle>

            <DialogContent>
              <TextField
                fullWidth
                type="number"
                label="Quantity"
                margin="normal"
                value={form.quantity}
                onChange={(e) =>
                  setForm({
                    ...form,
                    quantity:
                      Number(
                        e.target.value
                      ),
                  })
                }
              />

              <TextField
                fullWidth
                label="Reason"
                margin="normal"
                value={form.reason}
                onChange={(e) =>
                  setForm({
                    ...form,
                    reason:
                      e.target.value,
                  })
                }
              />

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Remarks"
                margin="normal"
                value={form.remarks}
                onChange={(e) =>
                  setForm({
                    ...form,
                    remarks:
                      e.target.value,
                  })
                }
              />
            </DialogContent>

            <DialogActions>
              <Button
                onClick={() =>
                  setOpen(false)
                }
              >
                Cancel
              </Button>

              <Button
                variant="contained"
                onClick={
                  handleAction
                }
              >
                Save
              </Button>
            </DialogActions>
          </Dialog>

          {/* =========================
              Reorder Level Dialog
          ========================= */}

          <Dialog
            open={reorderOpen}
            onClose={() =>
              setReorderOpen(false)
            }
          >
            <DialogTitle>
              Update Reorder Level
            </DialogTitle>

            <DialogContent>
              <TextField
                fullWidth
                type="number"
                margin="normal"
                label="Reorder Level"
                value={reorderValue}
                onChange={(e) =>
                  setReorderValue(
                    Number(
                      e.target.value
                    )
                  )
                }
              />
            </DialogContent>

            <DialogActions>
              <Button
                onClick={() =>
                  setReorderOpen(false)
                }
              >
                Cancel
              </Button>

              <Button
                variant="contained"
                sx={{
                  bgcolor:
                    "#8B5CF6",
                  "&:hover": {
                    bgcolor:
                      "#7C3AED",
                  },
                }}
                onClick={async () => {
                  if (!selectedItem) {
                    return;
                  }

                  try {
                    await updateReorderLevel(
                      selectedItem.id,
                      reorderValue
                    );

                    setReorderOpen(
                      false
                    );

                    await loadInventory();
                    await loadDashboard();
                    await loadForecast();
                  } catch (
                    error: any
                  ) {
                    alert(
                      error.response
                        ?.data
                        ?.detail ||
                        "Failed to update reorder level"
                    );
                  }
                }}
              >
                Update
              </Button>
            </DialogActions>
          </Dialog>

          {/* =========================
              Movement History Dialog
          ========================= */}

          <Dialog
            open={movementOpen}
            onClose={() =>
              setMovementOpen(false)
            }
            fullWidth
            maxWidth="lg"
          >
            <DialogTitle>
              Inventory Movement History
            </DialogTitle>

            <DialogContent>
              <TableContainer
                component={Paper}
              >
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>
                        Type
                      </TableCell>

                      <TableCell>
                        Quantity
                      </TableCell>

                      <TableCell>
                        Previous
                      </TableCell>

                      <TableCell>
                        Updated
                      </TableCell>

                      <TableCell>
                        Reason
                      </TableCell>

                      <TableCell>
                        Performed By
                      </TableCell>

                      <TableCell>
                        Date
                      </TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {movements.map(
                      (move) => (
                        <TableRow
                          key={move.id}
                        >
                          <TableCell>
                            {
                              move.movement_type
                            }
                          </TableCell>

                          <TableCell>
                            {
                              move.quantity_changed
                            }
                          </TableCell>

                          <TableCell>
                            {
                              move.previous_quantity
                            }
                          </TableCell>

                          <TableCell>
                            {
                              move.updated_quantity
                            }
                          </TableCell>

                          <TableCell>
                            {move.reason}
                          </TableCell>

                          <TableCell>
                            {move.performed_by_name ||
                              "-"}
                          </TableCell>

                          <TableCell>
                            {new Date(
                              move.created_at
                            ).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      )
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </DialogContent>

            <DialogActions>
              <Button
                onClick={() =>
                  setMovementOpen(
                    false
                  )
                }
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