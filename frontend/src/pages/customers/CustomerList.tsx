
import { useEffect, useMemo, useState } from "react";

import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Alert,
  IconButton,
  Tooltip,
} from "@mui/material";

import {
  Add,
  Delete,
  Edit,
  Visibility,
  Search,
  Refresh,
} from "@mui/icons-material";

import { useNavigate } from "react-router-dom";

import {
  getCustomers,
  deleteCustomer,
} from "../../services/customerService";


// ======================================================
// CUSTOMER LIST
// ======================================================

export default function CustomerList() {

  const navigate = useNavigate();

  // ====================================================
  // STATE
  // ====================================================

  const [customers, setCustomers] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [segment, setSegment] = useState("");

  const [status, setStatus] = useState("");

  const [deletingId, setDeletingId] =
    useState<number | null>(null);


  // ====================================================
  // LOAD CUSTOMERS
  // ====================================================

  const loadCustomers = async () => {

    try {

      setLoading(true);
      setError("");

      const response = await getCustomers();

      const data =
        Array.isArray(response)
          ? response
          : Array.isArray(response?.data)
          ? response.data
          : [];

      setCustomers(data);

    } catch (err: any) {

      console.error(
        "Customer loading error:",
        err
      );

      setError(
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        "Failed to load customers."
      );

    } finally {

      setLoading(false);

    }
  };


  // ====================================================
  // INITIAL LOAD
  // ====================================================

  useEffect(() => {

    loadCustomers();

  }, []);


  // ====================================================
  // DELETE CUSTOMER
  // ====================================================

  const handleDelete = async (
    customerId: number
  ) => {

    const confirmed = window.confirm(
      "Are you sure you want to deactivate this customer?"
    );

    if (!confirmed) {
      return;
    }

    try {

      setDeletingId(customerId);

      setError("");

      await deleteCustomer(customerId);

      await loadCustomers();

    } catch (err: any) {

      console.error(
        "Delete customer error:",
        err
      );

      setError(
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        "Failed to deactivate customer."
      );

    } finally {

      setDeletingId(null);

    }
  };


  // ====================================================
  // FILTER CUSTOMERS
  // ====================================================

  const filteredCustomers = useMemo(() => {

    const searchText =
      search.trim().toLowerCase();

    return customers.filter(
      (customer) => {

        // ----------------------------------------------
        // SEARCH BY NAME OR EMAIL
        // ----------------------------------------------

        const matchesSearch =
          !searchText ||
          String(
            customer.full_name ?? ""
          )
            .toLowerCase()
            .includes(searchText) ||
          String(
            customer.email ?? ""
          )
            .toLowerCase()
            .includes(searchText);

        // ----------------------------------------------
        // SEGMENT
        // ----------------------------------------------

        const matchesSegment =
          !segment ||
          String(
            customer.customer_segment ?? "New"
          ).toLowerCase() ===
            segment.toLowerCase();

        // ----------------------------------------------
        // STATUS
        // ----------------------------------------------

        const customerStatus =
          String(
            customer.status ?? ""
          ).toUpperCase();

        const matchesStatus =
          !status ||
          customerStatus === status;

        return (
          matchesSearch &&
          matchesSegment &&
          matchesStatus
        );
      }
    );

  }, [
    customers,
    search,
    segment,
    status,
  ]);


  // ====================================================
  // SEGMENT COLOR
  // ====================================================

  const getSegmentColor = (
    value?: string
  ) => {

    switch (
      String(value ?? "New").toLowerCase()
    ) {

      case "vip":
        return "error";

      case "loyal":
        return "warning";

      case "regular":
        return "info";

      case "new":
        return "success";

      default:
        return "default";
    }
  };


  // ====================================================
  // STATUS COLOR
  // ====================================================

  const getStatusColor = (
    value?: string
  ) => {

    return String(value ?? "")
      .toUpperCase() === "ACTIVE"
      ? "success"
      : "default";
  };


  // ====================================================
  // CLEAR FILTERS
  // ====================================================

  const clearFilters = () => {

    setSearch("");
    setSegment("");
    setStatus("");

  };


  // ====================================================
  // LOADING
  // ====================================================

  if (loading) {

    return (

      <Box
        sx={{
          minHeight: "100vh",
          background: "#0F172A",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >

        <Box
          textAlign="center"
        >

          <CircularProgress />

          <Typography
            color="white"
            mt={2}
          >
            Loading customers...
          </Typography>

        </Box>

      </Box>

    );
  }


  // ====================================================
  // PAGE
  // ====================================================

  return (

    <Box
      sx={{
        minHeight: "100vh",
        background: "#0F172A",
        p: {
          xs: 2,
          md: 3,
        },
      }}
    >

      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
        flexWrap="wrap"
        gap={2}
      >

        <Box>

          <Typography
            variant="h4"
            fontWeight="bold"
            color="white"
          >
            Customers
          </Typography>

          <Typography
            color="#94A3B8"
            mt={0.5}
          >
            Manage your customer database
          </Typography>

        </Box>


        <Box
          display="flex"
          gap={1}
        >

          <Tooltip title="Refresh">

            <IconButton
              onClick={loadCustomers}
              sx={{
                color: "white",
                border: "1px solid #475569",
              }}
            >

              <Refresh />

            </IconButton>

          </Tooltip>


          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() =>
              navigate("/customers/add")
            }
          >
            Add Customer
          </Button>

        </Box>

      </Box>


      {/* ================================================= */}
      {/* ERROR */}
      {/* ================================================= */}

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


      {/* ================================================= */}
      {/* FILTER CARD */}
      {/* ================================================= */}

      <Card
        sx={{
          background: "#1E293B",
          mb: 3,
        }}
      >

        <CardContent>

          <Grid
            container
            spacing={2}
            alignItems="center"
          >

            {/* SEARCH */}

            <Grid
              item
              xs={12}
              md={6}
            >

              <TextField
                fullWidth
                label="Search customer name or email"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                InputProps={{
                  startAdornment: (
                    <Search
                      sx={{
                        mr: 1,
                        color: "#64748B",
                      }}
                    />
                  ),
                }}
                sx={{
                  background: "white",
                  borderRadius: 1,
                }}
              />

            </Grid>


            {/* SEGMENT */}

            <Grid
              item
              xs={12}
              sm={6}
              md={2.5}
            >

              <FormControl
                fullWidth
                sx={{
                  background: "white",
                  borderRadius: 1,
                }}
              >

                <InputLabel>
                  Segment
                </InputLabel>

                <Select
                  value={segment}
                  label="Segment"
                  onChange={(e) =>
                    setSegment(
                      e.target.value
                    )
                  }
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

                </Select>

              </FormControl>

            </Grid>


            {/* STATUS */}

            <Grid
              item
              xs={12}
              sm={6}
              md={2.5}
            >

              <FormControl
                fullWidth
                sx={{
                  background: "white",
                  borderRadius: 1,
                }}
              >

                <InputLabel>
                  Status
                </InputLabel>

                <Select
                  value={status}
                  label="Status"
                  onChange={(e) =>
                    setStatus(
                      e.target.value
                    )
                  }
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

                </Select>

              </FormControl>

            </Grid>


            {/* CLEAR */}

            <Grid
              item
              xs={12}
              md={1}
            >

              <Button
                fullWidth
                variant="outlined"
                onClick={clearFilters}
                sx={{
                  height: 56,
                }}
              >
                Clear
              </Button>

            </Grid>

          </Grid>

        </CardContent>

      </Card>


      {/* ================================================= */}
      {/* SUMMARY */}
      {/* ================================================= */}

      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >

        <Typography
          color="#CBD5E1"
        >
          Showing{" "}
          <strong>
            {filteredCustomers.length}
          </strong>{" "}
          of{" "}
          <strong>
            {customers.length}
          </strong>{" "}
          customers
        </Typography>

      </Box>


      {/* ================================================= */}
      {/* TABLE CARD */}
      {/* ================================================= */}

      <Card
        sx={{
          background: "#1E293B",
          overflow: "hidden",
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

          {filteredCustomers.length === 0 ? (

            /* =========================================== */
            /* EMPTY STATE */
            /* =========================================== */

            <Box
              sx={{
                py: 10,
                px: 3,
                textAlign: "center",
              }}
            >

              <Typography
                variant="h6"
                color="white"
              >
                No customers found
              </Typography>

              <Typography
                color="#94A3B8"
                mt={1}
              >
                {customers.length === 0
                  ? "No customers have been added yet."
                  : "Try changing your search or filters."}
              </Typography>

              {customers.length === 0 && (

                <Button
                  variant="contained"
                  startIcon={<Add />}
                  sx={{
                    mt: 3,
                  }}
                  onClick={() =>
                    navigate(
                      "/customers/add"
                    )
                  }
                >
                  Add First Customer
                </Button>

              )}

            </Box>

          ) : (

            <TableContainer
              sx={{
                overflowX: "auto",
              }}
            >

              <Table
                sx={{
                  minWidth: 1100,
                }}
              >

                {/* ===================================== */}
                {/* HEADER */}
                {/* ===================================== */}

                <TableHead>

                  <TableRow
                    sx={{
                      background: "#0F172A",
                    }}
                  >

                    <TableCell
                      sx={{
                        color: "#CBD5E1",
                        fontWeight: "bold",
                      }}
                    >
                      Customer Name
                    </TableCell>


                    <TableCell
                      sx={{
                        color: "#CBD5E1",
                        fontWeight: "bold",
                      }}
                    >
                      Email
                    </TableCell>


                    <TableCell
                      sx={{
                        color: "#CBD5E1",
                        fontWeight: "bold",
                      }}
                    >
                      Phone Number
                    </TableCell>


                    <TableCell
                      sx={{
                        color: "#CBD5E1",
                        fontWeight: "bold",
                      }}
                    >
                      Customer Segment
                    </TableCell>


                    <TableCell
                      sx={{
                        color: "#CBD5E1",
                        fontWeight: "bold",
                      }}
                    >
                      Total Purchases
                    </TableCell>


                    <TableCell
                      sx={{
                        color: "#CBD5E1",
                        fontWeight: "bold",
                      }}
                    >
                      Total Spend
                    </TableCell>


                    <TableCell
                      sx={{
                        color: "#CBD5E1",
                        fontWeight: "bold",
                      }}
                    >
                      Status
                    </TableCell>


                    <TableCell
                      align="center"
                      sx={{
                        color: "#CBD5E1",
                        fontWeight: "bold",
                      }}
                    >
                      Actions
                    </TableCell>

                  </TableRow>

                </TableHead>


                {/* ===================================== */}
                {/* BODY */}
                {/* ===================================== */}

                <TableBody>

                  {filteredCustomers.map(
                    (customer) => (

                      <TableRow
                        key={customer.id}
                        hover
                        sx={{
                          "&:hover": {
                            background:
                              "#263449",
                          },
                        }}
                      >

                        {/* CUSTOMER NAME */}

                        <TableCell
                          sx={{
                            color: "white",
                          }}
                        >

                          <Typography
                            fontWeight="bold"
                          >
                            {customer.full_name ||
                              "N/A"}
                          </Typography>

                          <Typography
                            variant="caption"
                            color="#64748B"
                          >
                            {customer.customer_id ||
                              ""}
                          </Typography>

                        </TableCell>


                        {/* EMAIL */}

                        <TableCell
                          sx={{
                            color: "#CBD5E1",
                          }}
                        >
                          {customer.email ||
                            "N/A"}
                        </TableCell>


                        {/* PHONE */}

                        <TableCell
                          sx={{
                            color: "#CBD5E1",
                          }}
                        >
                          {customer.phone_number ||
                            "N/A"}
                        </TableCell>


                        {/* SEGMENT */}

                        <TableCell>

                          <Chip
                            label={
                              customer.customer_segment ||
                              "New"
                            }
                            color={
                              getSegmentColor(
                                customer.customer_segment
                              ) as any
                            }
                            size="small"
                          />

                        </TableCell>


                        {/* TOTAL PURCHASES */}

                        <TableCell
                          sx={{
                            color: "white",
                            fontWeight: 500,
                          }}
                        >
                          {customer.total_orders ??
                            0}
                        </TableCell>


                        {/* TOTAL SPEND */}

                        <TableCell
                          sx={{
                            color: "white",
                            fontWeight: 500,
                          }}
                        >

                          ₹{" "}

                          {Number(
                            customer.lifetime_revenue ??
                            customer.total_purchase_amount ??
                            0
                          ).toLocaleString(
                            "en-IN",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          )}

                        </TableCell>


                        {/* STATUS */}

                        <TableCell>

                          <Chip
                            label={
                              String(
                                customer.status ??
                                "INACTIVE"
                              ).toUpperCase() ===
                              "ACTIVE"
                                ? "Active"
                                : "Inactive"
                            }
                            color={
                              getStatusColor(
                                customer.status
                              ) as any
                            }
                            size="small"
                          />

                        </TableCell>


                        {/* ACTIONS */}

                        <TableCell>

                          <Box
                            display="flex"
                            justifyContent="center"
                            gap={1}
                          >

                            {/* VIEW */}

                            <Tooltip
                              title="View Customer"
                            >

                              <IconButton
                                size="small"
                                sx={{
                                  color:
                                    "#60A5FA",
                                  border:
                                    "1px solid #60A5FA",
                                }}
                                onClick={() =>
                                  navigate(
                                    `/customers/${customer.id}`
                                  )
                                }
                              >

                                <Visibility
                                  fontSize="small"
                                />

                              </IconButton>

                            </Tooltip>


                            {/* EDIT */}

                            <Tooltip
                              title="Edit Customer"
                            >

                              <IconButton
                                size="small"
                                sx={{
                                  color:
                                    "#FBBF24",
                                  border:
                                    "1px solid #FBBF24",
                                }}
                                onClick={() =>
                                  navigate(
                                    `/customers/${customer.id}/edit`
                                  )
                                }
                              >

                                <Edit
                                  fontSize="small"
                                />

                              </IconButton>

                            </Tooltip>


                            {/* DELETE */}

                            <Tooltip
                              title="Deactivate Customer"
                            >

                              <span>

                                <IconButton
                                  size="small"
                                  disabled={
                                    deletingId ===
                                    customer.id
                                  }
                                  sx={{
                                    color:
                                      "#F87171",
                                    border:
                                      "1px solid #F87171",
                                  }}
                                  onClick={() =>
                                    handleDelete(
                                      customer.id
                                    )
                                  }
                                >

                                  {deletingId ===
                                  customer.id ? (

                                    <CircularProgress
                                      size={18}
                                    />

                                  ) : (

                                    <Delete
                                      fontSize="small"
                                    />

                                  )}

                                </IconButton>

                              </span>

                            </Tooltip>

                          </Box>

                        </TableCell>

                      </TableRow>

                    )
                  )}

                </TableBody>

              </Table>

            </TableContainer>

          )}

        </CardContent>

      </Card>

    </Box>
  );
}


