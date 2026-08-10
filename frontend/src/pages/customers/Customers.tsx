
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  CircularProgress,
  Alert,
  InputAdornment,
} from "@mui/material";

import {
  Visibility,
  Edit,
  Delete,
  CheckCircle,
  Cancel,
  Search,
  Download,
  Clear,
} from "@mui/icons-material";

import {
  getCustomers,
  searchCustomers,
  filterCustomers,
  deleteCustomer,
  activateCustomer,
  deactivateCustomer,
  getCustomerDashboard,
  exportCustomersCSV,
  exportCustomersPDF,
  exportCustomerAnalyticsPDF,
} from "../../services/customerService";

// =====================================================
// TYPES
// =====================================================

interface Customer {
  id?: number;
  customer_id?: string;

  full_name?: string;
  email?: string;
  phone_number?: string;

  customer_type?: string;
  customer_segment?: string;
  status?: string;

  total_orders?: number;
  total_quantity_purchased?: number;

  lifetime_revenue?: number;
  total_revenue?: number;
  total_purchase_amount?: number;

  average_order_value?: number;
  purchase_frequency?: number;

  last_purchase_date?: string;
  created_at?: string;

  is_vip?: string | boolean;
}

interface Dashboard {
  total_customers?: number;
  active_customers?: number;
  inactive_customers?: number;
  vip_customers?: number;
  total_revenue_generated?: number;
}

// =====================================================
// COMPONENT
// =====================================================

export default function Customers() {
  const navigate = useNavigate();

  // =====================================================
  // STATE
  // =====================================================

  const [customers, setCustomers] = useState<Customer[]>([]);

  const [dashboard, setDashboard] =
    useState<Dashboard>({});

  const [loading, setLoading] =
    useState<boolean>(true);

  const [error, setError] =
    useState<string>("");

  const [search, setSearch] =
    useState<string>("");

  const [segment, setSegment] =
    useState<string>("");

  const [status, setStatus] =
    useState<string>("");

  const [sortBy, setSortBy] =
    useState<string>("");

  const [actionLoading, setActionLoading] =
    useState<number | string | null>(null);

  // =====================================================
  // NORMALIZE RESPONSE
  // =====================================================

  const extractCustomerList = (
    response: any
  ): Customer[] => {
    if (Array.isArray(response)) {
      return response;
    }

    if (Array.isArray(response?.data)) {
      return response.data;
    }

    if (Array.isArray(response?.customers)) {
      return response.customers;
    }

    if (Array.isArray(response?.items)) {
      return response.items;
    }

    if (Array.isArray(response?.results)) {
      return response.results;
    }

    return [];
  };

  // =====================================================
  // NORMALIZE CUSTOMER
  // =====================================================

  const normalizeCustomers = (
    list: Customer[]
  ): Customer[] => {
    return list.map((customer) => ({
      ...customer,

      full_name:
        customer.full_name ??
        "-",

      email:
        customer.email ??
        "",

      phone_number:
        customer.phone_number ??
        "",

      customer_segment:
        customer.customer_segment ??
        "New",

      status:
        customer.status ??
        "ACTIVE",

      total_orders:
        Number(
          customer.total_orders ?? 0
        ),

      lifetime_revenue:
        Number(
          customer.lifetime_revenue ??
          customer.total_revenue ??
          customer.total_purchase_amount ??
          0
        ),
    }));
  };

  // =====================================================
  // LOAD DASHBOARD
  // =====================================================

  const loadDashboard = async () => {
    try {
      const response =
        await getCustomerDashboard();

      const data =
        response?.data ??
        response ??
        {};

      setDashboard(data);
    } catch (err) {
      console.error(
        "Dashboard error:",
        err
      );

      setDashboard({});
    }
  };

  // =====================================================
  // LOAD CUSTOMERS
  // =====================================================

  const loadCustomers = async () => {
    try {
      setLoading(true);
      setError("");

      let response: any;

      // -----------------------------------------------
      // SEARCH
      // -----------------------------------------------

      if (search.trim()) {
        response =
          await searchCustomers(
            search.trim()
          );
      }

      // -----------------------------------------------
      // FILTER
      // -----------------------------------------------

      else if (
        segment ||
        status
      ) {
        response =
          await filterCustomers({
            customer_segment:
              segment || undefined,

            status:
              status || undefined,
          });
      }

      // -----------------------------------------------
      // SORT
      // -----------------------------------------------

      else if (sortBy) {
        response =
          await filterCustomers({
            sort_by: sortBy,
            order: "desc",
          });
      }

      // -----------------------------------------------
      // GET ALL
      // -----------------------------------------------

      else {
        response =
          await getCustomers();
      }

      console.log(
        "CUSTOMER RESPONSE:",
        response
      );

      const list =
        extractCustomerList(response);

      setCustomers(
        normalizeCustomers(list)
      );
    } catch (err: any) {
      console.error(
        "Customer loading error:",
        err
      );

      setCustomers([]);

      const backendMessage =
        err?.response?.data?.detail ??
        err?.response?.data?.message;

      setError(
        backendMessage ||
        "Failed to load customers. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    loadCustomers();
    loadDashboard();
  }, []);

  // =====================================================
  // APPLY FILTERS
  // =====================================================

  const handleApplyFilters = () => {
    loadCustomers();
  };

  // =====================================================
  // CLEAR FILTERS
  // =====================================================

  const handleClearFilters = () => {
    setSearch("");
    setSegment("");
    setStatus("");
    setSortBy("");

    setTimeout(() => {
      loadCustomers();
    }, 0);
  };

  // =====================================================
  // DELETE CUSTOMER
  // =====================================================

  const handleDelete = async (
    id: number | string
  ) => {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this customer?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoading(id);
      setError("");

      await deleteCustomer(id);

      await loadCustomers();
      await loadDashboard();
    } catch (err: any) {
      console.error(
        "Delete customer error:",
        err
      );

      const message =
        err?.response?.data?.detail ??
        err?.response?.data?.message ??
        "Failed to delete customer.";

      setError(message);
    } finally {
      setActionLoading(null);
    }
  };

  // =====================================================
  // ACTIVATE / DEACTIVATE
  // =====================================================

  const handleStatusChange = async (
    id: number | string,
    currentStatus?: string
  ) => {
    try {
      setActionLoading(id);
      setError("");

      if (
        currentStatus === "ACTIVE"
      ) {
        await deactivateCustomer(id);
      } else {
        await activateCustomer(id);
      }

      await loadCustomers();
      await loadDashboard();
    } catch (err: any) {
      console.error(
        "Status change error:",
        err
      );

      const message =
        err?.response?.data?.detail ??
        err?.response?.data?.message ??
        "Failed to update customer status.";

      setError(message);
    } finally {
      setActionLoading(null);
    }
  };

  // =====================================================
  // DOWNLOAD HELPER
  // =====================================================

  const downloadFile = (
    data: Blob,
    filename: string
  ) => {
    const blob =
      data instanceof Blob
        ? data
        : new Blob([data]);

    const url =
      window.URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;
    link.download = filename;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    window.URL.revokeObjectURL(url);
  };

  // =====================================================
  // EXPORT CSV
  // =====================================================

  const handleExportCSV = async () => {
    try {
      setError("");

      const data =
        await exportCustomersCSV();

      downloadFile(
        data,
        "customers.csv"
      );
    } catch (err) {
      console.error(
        "CSV export error:",
        err
      );

      setError(
        "Failed to export customer CSV."
      );
    }
  };

  // =====================================================
  // EXPORT PDF
  // =====================================================

  const handleExportPDF = async () => {
    try {
      setError("");

      const data =
        await exportCustomersPDF();

      downloadFile(
        data,
        "customers.pdf"
      );
    } catch (err) {
      console.error(
        "PDF export error:",
        err
      );

      setError(
        "Failed to export customer PDF."
      );
    }
  };

  // =====================================================
  // EXPORT ANALYTICS PDF
  // =====================================================

  const handleAnalyticsPDF =
    async () => {
      try {
        setError("");

        const data =
          await exportCustomerAnalyticsPDF();

        downloadFile(
          data,
          "customer-analytics.pdf"
        );
      } catch (err) {
        console.error(
          "Analytics PDF error:",
          err
        );

        setError(
          "Failed to export analytics PDF."
        );
      }
    };

  // =====================================================
  // SEGMENT COLOR
  // =====================================================

  const getSegmentColor = (
    value?: string
  ):
    | "default"
    | "primary"
    | "secondary"
    | "success"
    | "warning"
    | "error" => {
    switch (
      (value || "New").toLowerCase()
    ) {
      case "vip":
        return "warning";

      case "loyal":
        return "success";

      case "regular":
        return "primary";

      case "new":
      default:
        return "default";
    }
  };

  // =====================================================
  // SEGMENT STYLE
  // =====================================================

  const getSegmentStyle = (
    value?: string
  ) => {
    switch (
      (value || "New").toLowerCase()
    ) {
      case "vip":
        return {
          background: "#F59E0B",
          color: "#111827",
          fontWeight: "bold",
        };

      case "loyal":
        return {
          background: "#10B981",
          color: "white",
          fontWeight: "bold",
        };

      case "regular":
        return {
          background: "#3B82F6",
          color: "white",
          fontWeight: "bold",
        };

      case "new":
      default:
        return {
          background: "#64748B",
          color: "white",
          fontWeight: "bold",
        };
    }
  };

  // =====================================================
  // FORMAT MONEY
  // =====================================================

  const formatMoney = (
    value?: number
  ) => {
    return Number(
      value ?? 0
    ).toLocaleString(
      "en-IN",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    );
  };

  // =====================================================
  // FORMAT DATE
  // =====================================================

  const formatDate = (
    value?: string
  ) => {
    if (!value) {
      return "-";
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return value;
    }

    return date.toLocaleDateString(
      "en-IN"
    );
  };

  // =====================================================
  // LOADING STATE
  // =====================================================

  if (
    loading &&
    customers.length === 0
  ) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          background: "#0F172A",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Box
          sx={{
            textAlign: "center",
          }}
        >
          <CircularProgress />

          <Typography
            sx={{
              mt: 2,
              color: "white",
            }}
          >
            Loading customers...
          </Typography>
        </Box>
      </Box>
    );
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <Box
      sx={{
        p: {
          xs: 2,
          md: 3,
        },
        minHeight: "100vh",
        background: "#0F172A",
        color: "white",
      }}
    >
      {/* =================================================
          HEADER
      ================================================= */}

      <Box
        sx={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 2,
          mb: 3,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            fontWeight="bold"
          >
            Customer Management
          </Typography>

          <Typography
            sx={{
              color: "#94A3B8",
              mt: 0.5,
            }}
          >
            Manage customers, segments,
            purchases and customer status.
          </Typography>
        </Box>

        <Button
          variant="contained"
          onClick={() =>
            navigate(
              "/customers/add"
            )
          }
        >
          + Add Customer
        </Button>
      </Box>

      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <Alert
          severity="error"
          sx={{
            mb: 3,
          }}
          onClose={() =>
            setError("")
          }
        >
          {error}
        </Alert>
      )}

      {/* =================================================
          DASHBOARD
      ================================================= */}

      <Grid
        container
        spacing={3}
        sx={{
          mb: 4,
        }}
      >
        {/* TOTAL CUSTOMERS */}

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background:
                "#1E293B",
              color: "white",
            }}
          >
            <CardContent>
              <Typography
                color="#94A3B8"
              >
                Total Customers
              </Typography>

              <Typography
                variant="h4"
                fontWeight="bold"
                sx={{
                  mt: 1,
                }}
              >
                {dashboard.total_customers ??
                  customers.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* ACTIVE */}

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background:
                "#1E293B",
              color: "white",
            }}
          >
            <CardContent>
              <Typography
                color="#94A3B8"
              >
                Active Customers
              </Typography>

              <Typography
                variant="h4"
                fontWeight="bold"
                sx={{
                  mt: 1,
                }}
              >
                {dashboard.active_customers ??
                  customers.filter(
                    (customer) =>
                      customer.status ===
                      "ACTIVE"
                  ).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* VIP */}

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background:
                "#1E293B",
              color: "white",
            }}
          >
            <CardContent>
              <Typography
                color="#94A3B8"
              >
                VIP Customers
              </Typography>

              <Typography
                variant="h4"
                fontWeight="bold"
                sx={{
                  mt: 1,
                }}
              >
                {dashboard.vip_customers ??
                  customers.filter(
                    (customer) =>
                      customer.customer_segment
                        ?.toLowerCase() ===
                      "vip"
                  ).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* TOTAL SPEND */}

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background:
                "#1E293B",
              color: "white",
            }}
          >
            <CardContent>
              <Typography
                color="#94A3B8"
              >
                Total Spend
              </Typography>

              <Typography
                variant="h4"
                fontWeight="bold"
                sx={{
                  mt: 1,
                }}
              >
                ₹
                {formatMoney(
                  dashboard.total_revenue_generated
                )}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* =================================================
          SEARCH & FILTERS
      ================================================= */}

      <Card
        sx={{
          background:
            "#1E293B",
          color: "white",
          mb: 3,
        }}
      >
        <CardContent>
          <Typography
            variant="h6"
            fontWeight="bold"
            sx={{
              mb: 2,
            }}
          >
            Search & Filters
          </Typography>

          <Grid
            container
            spacing={2}
          >
            {/* SEARCH */}

            <Grid item xs={12} md={5}>
              <TextField
                fullWidth
                label="Search by name or email"
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter"
                  ) {
                    handleApplyFilters();
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  background:
                    "white",
                }}
              />
            </Grid>

            {/* SEGMENT */}

            <Grid item xs={12} sm={6} md={2}>
              <TextField
                select
                fullWidth
                label="Segment"
                value={segment}
                onChange={(e) =>
                  setSegment(
                    e.target.value
                  )
                }
                sx={{
                  background:
                    "white",
                }}
              >
                <MenuItem value="">
                  All Segments
                </MenuItem>

                <MenuItem value="New">
                  New
                </MenuItem>

                <MenuItem value="Regular">
                  Regular
                </MenuItem>

                <MenuItem value="Loyal">
                  Loyal
                </MenuItem>

                <MenuItem value="VIP">
                  VIP
                </MenuItem>
              </TextField>
            </Grid>

            {/* STATUS */}

            <Grid item xs={12} sm={6} md={2}>
              <TextField
                select
                fullWidth
                label="Status"
                value={status}
                onChange={(e) =>
                  setStatus(
                    e.target.value
                  )
                }
                sx={{
                  background:
                    "white",
                }}
              >
                <MenuItem value="">
                  All Status
                </MenuItem>

                <MenuItem value="ACTIVE">
                  Active
                </MenuItem>

                <MenuItem value="INACTIVE">
                  Inactive
                </MenuItem>
              </TextField>
            </Grid>

            {/* SORT */}

            <Grid item xs={12} sm={6} md={3}>
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
                  background:
                    "white",
                }}
              >
                <MenuItem value="">
                  Default
                </MenuItem>

                <MenuItem value="name">
                  Customer Name
                </MenuItem>

                <MenuItem value="total_orders">
                  Total Orders
                </MenuItem>

                <MenuItem value="total_spend">
                  Total Spend
                </MenuItem>

                <MenuItem value="last_purchase">
                  Last Purchase
                </MenuItem>
              </TextField>
            </Grid>

            {/* BUTTONS */}

            <Grid
              item
              xs={12}
              sx={{
                display: "flex",
                gap: 2,
                flexWrap: "wrap",
              }}
            >
              <Button
                variant="contained"
                startIcon={<Search />}
                onClick={
                  handleApplyFilters
                }
                disabled={loading}
              >
                Search
              </Button>

              <Button
                variant="outlined"
                startIcon={<Clear />}
                onClick={
                  handleClearFilters
                }
                sx={{
                  color: "white",
                  borderColor:
                    "#94A3B8",
                }}
              >
                Clear
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* =================================================
          EXPORT
      ================================================= */}

      <Box
        sx={{
          display: "flex",
          gap: 2,
          flexWrap: "wrap",
          mb: 3,
        }}
      >
        <Button
          variant="contained"
          startIcon={<Download />}
          onClick={
            handleExportCSV
          }
        >
          Export CSV
        </Button>

        <Button
          variant="contained"
          startIcon={<Download />}
          onClick={
            handleExportPDF
          }
        >
          Export PDF
        </Button>

        <Button
          variant="contained"
          startIcon={<Download />}
          onClick={
            handleAnalyticsPDF
          }
        >
          Analytics PDF
        </Button>
      </Box>

      {/* =================================================
          CUSTOMER TABLE
      ================================================= */}

      <Card
        sx={{
          background:
            "#1E293B",
          color: "white",
        }}
      >
        <CardContent
          sx={{
            p: 0,
            "&:last-child": {
              pb: 0,
            },
          }}
        >
          <TableContainer
            component={Paper}
            sx={{
              background:
                "#1E293B",
              overflowX:
                "auto",
            }}
          >
            <Table
              stickyHeader
              sx={{
                minWidth: 1100,
              }}
            >
              <TableHead>
                <TableRow>
                  <TableCell>
                    Customer Name
                  </TableCell>

                  <TableCell>
                    Email
                  </TableCell>

                  <TableCell>
                    Phone Number
                  </TableCell>

                  <TableCell>
                    Customer Segment
                  </TableCell>

                  <TableCell>
                    Total Purchases
                  </TableCell>

                  <TableCell>
                    Total Spend
                  </TableCell>

                  <TableCell>
                    Last Purchase
                  </TableCell>

                  <TableCell>
                    Status
                  </TableCell>

                  <TableCell>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {customers.map(
                  (customer) => {
                    const customerKey =
                      customer.id ??
                      customer.customer_id ??
                      Math.random();

                    const isProcessing =
                      actionLoading ===
                      customer.id;

                    return (
                      <TableRow
                        key={
                          customerKey
                        }
                        hover
                      >
                        {/* NAME */}

                        <TableCell
                          sx={{
                            color:
                              "white",
                            fontWeight:
                              "bold",
                          }}
                        >
                          {customer.full_name ??
                            "-"}

                          {customer.customer_id && (
                            <Typography
                              variant="caption"
                              display="block"
                              sx={{
                                color:
                                  "#94A3B8",
                              }}
                            >
                              {
                                customer.customer_id
                              }
                            </Typography>
                          )}
                        </TableCell>

                        {/* EMAIL */}

                        <TableCell
                          sx={{
                            color:
                              "white",
                          }}
                        >
                          {customer.email ||
                            "-"}
                        </TableCell>

                        {/* PHONE */}

                        <TableCell
                          sx={{
                            color:
                              "white",
                          }}
                        >
                          {customer.phone_number ||
                            "-"}
                        </TableCell>

                        {/* SEGMENT */}

                        <TableCell>
                          <Chip
                            label={
                              customer.customer_segment ??
                              "New"
                            }
                            size="small"
                            sx={getSegmentStyle(
                              customer.customer_segment
                            )}
                          />
                        </TableCell>

                        {/* TOTAL PURCHASES */}

                        <TableCell
                          sx={{
                            color:
                              "white",
                          }}
                        >
                          {customer.total_orders ??
                            0}
                        </TableCell>

                        {/* TOTAL SPEND */}

                        <TableCell
                          sx={{
                            color:
                              "white",
                            fontWeight:
                              "bold",
                          }}
                        >
                          ₹
                          {formatMoney(
                            customer.lifetime_revenue
                          )}
                        </TableCell>

                        {/* LAST PURCHASE */}

                        <TableCell
                          sx={{
                            color:
                              "white",
                          }}
                        >
                          {formatDate(
                            customer.last_purchase_date
                          )}
                        </TableCell>

                        {/* STATUS */}

                        <TableCell>
                          <Chip
                            label={
                              customer.status ===
                              "ACTIVE"
                                ? "Active"
                                : "Inactive"
                            }
                            color={
                              customer.status ===
                              "ACTIVE"
                                ? "success"
                                : "error"
                            }
                            size="small"
                          />
                        </TableCell>

                        {/* ACTIONS */}

                        <TableCell>
                          <Box
                            sx={{
                              display:
                                "flex",
                              alignItems:
                                "center",
                            }}
                          >
                            {/* VIEW */}

                            <IconButton
                              color="info"
                              title="View Customer"
                              onClick={() =>
                                navigate(
                                  `/customers/${customer.id}/profile`
                                )
                              }
                            >
                              <Visibility />
                            </IconButton>

                            {/* EDIT */}

                            <IconButton
                              color="warning"
                              title="Edit Customer"
                              onClick={() =>
                                navigate(
                                  `/customers/${customer.id}/edit`
                                )
                              }
                            >
                              <Edit />
                            </IconButton>

                            {/* DELETE */}

                            <IconButton
                              color="error"
                              title="Delete Customer"
                              disabled={
                                isProcessing
                              }
                              onClick={() =>
                                handleDelete(
                                  customer.id as number
                                )
                              }
                            >
                              {isProcessing ? (
                                <CircularProgress
                                  size={20}
                                />
                              ) : (
                                <Delete />
                              )}
                            </IconButton>

                            {/* ACTIVATE /
                                DEACTIVATE */}

                            <IconButton
                              color="success"
                              title={
                                customer.status ===
                                "ACTIVE"
                                  ? "Deactivate Customer"
                                  : "Activate Customer"
                              }
                              disabled={
                                isProcessing
                              }
                              onClick={() =>
                                handleStatusChange(
                                  customer.id as number,
                                  customer.status
                                )
                              }
                            >
                              {customer.status ===
                              "ACTIVE" ? (
                                <Cancel />
                              ) : (
                                <CheckCircle />
                              )}
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  }
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* =================================================
              EMPTY STATE
          ================================================= */}

          {!loading &&
            customers.length ===
              0 && (
              <Box
                sx={{
                  textAlign:
                    "center",
                  py: 8,
                  px: 3,
                }}
              >
                <Typography
                  variant="h6"
                  fontWeight="bold"
                  sx={{
                    color:
                      "white",
                  }}
                >
                  No Customers Found
                </Typography>

                <Typography
                  sx={{
                    color:
                      "#94A3B8",
                    mt: 1,
                  }}
                >
                  No customers match
                  your current
                  search or filters.
                </Typography>

                <Button
                  variant="contained"
                  sx={{
                    mt: 3,
                  }}
                  onClick={() =>
                    navigate(
                      "/customers/add"
                    )
                  }
                >
                  Add Customer
                </Button>
              </Box>
            )}
        </CardContent>
      </Card>

      {/* =================================================
          QUICK LINKS
      ================================================= */}

      <Box
        sx={{
          mt: 4,
          display: "flex",
          gap: 2,
          flexWrap: "wrap",
        }}
      >
        <Button
          variant="outlined"
          sx={{
            color: "white",
            borderColor:
              "#94A3B8",
          }}
          onClick={() =>
            navigate(
              "/customers/analytics"
            )
          }
        >
          Customer Analytics
        </Button>

        <Button
          variant="outlined"
          sx={{
            color: "white",
            borderColor:
              "#94A3B8",
          }}
          onClick={() =>
            navigate(
              "/customers/top-customers"
            )
          }
        >
          Top Customers
        </Button>
      </Box>
    </Box>
  );
}
