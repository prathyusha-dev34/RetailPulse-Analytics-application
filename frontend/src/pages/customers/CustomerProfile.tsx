
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Grid,
  Typography,
  Chip,
} from "@mui/material";

import {
  getCustomerProfile,
} from "../../services/customerService";

interface CustomerProfileData {
  id: number;
  full_name?: string;
  email?: string;
  phone_number?: string;

  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;

  date_of_birth?: string;
  gender?: string;

  customer_type?: string;
  customer_segment?: string;

  total_orders?: number;
  total_spend?: number;
  total_revenue?: number;

  last_purchase_date?: string;

  status?: string;

  recent_purchases?: any[];
}

export default function CustomerProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [customer, setCustomer] =
    useState<CustomerProfileData | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const loadProfile = async () => {
    if (!id) {
      setError("Customer ID is missing.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await getCustomerProfile(id);

      const data =
        response?.data ??
        response;

      setCustomer(data);
    } catch (err: any) {
      console.error(
        "Customer profile error:",
        err
      );

      setError(
        err?.response?.data?.detail ||
        "Unable to load customer profile."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [id]);

  const getSegmentColor = (
    segment?: string
  ) => {
    switch (
      segment?.toUpperCase()
    ) {
      case "VIP":
        return "error";

      case "LOYAL":
        return "success";

      case "REGULAR":
        return "primary";

      case "NEW":
        return "warning";

      default:
        return "default";
    }
  };

  const formatDate = (
    date?: string
  ) => {
    if (!date) {
      return "N/A";
    }

    try {
      return new Date(
        date
      ).toLocaleDateString();
    } catch {
      return date;
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          background: "#0F172A",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <CircularProgress />

        <Typography color="white">
          Loading customer profile...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          background: "#0F172A",
          p: 3,
        }}
      >
        <Alert
          severity="error"
          sx={{ mb: 3 }}
        >
          {error}
        </Alert>

        <Button
          variant="contained"
          onClick={() =>
            navigate("/customers")
          }
        >
          Back to Customers
        </Button>
      </Box>
    );
  }

  if (!customer) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          background: "#0F172A",
          p: 3,
        }}
      >
        <Alert severity="warning">
          Customer not found.
        </Alert>

        <Button
          sx={{ mt: 2 }}
          variant="contained"
          onClick={() =>
            navigate("/customers")
          }
        >
          Back to Customers
        </Button>
      </Box>
    );
  }

  const segment =
    customer.customer_segment ??
    customer.customer_type ??
    "New";

  const totalSpend =
    customer.total_spend ??
    customer.total_revenue ??
    0;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "#0F172A",
        p: 3,
      }}
    >
      {/* HEADER */}

      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography
          variant="h4"
          fontWeight="bold"
          color="white"
        >
          Customer Details
        </Typography>

        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            onClick={() =>
              navigate(
                `/customers/${customer.id}/edit`
              )
            }
          >
            Edit
          </Button>

          <Button
            variant="outlined"
            onClick={() =>
              navigate("/customers")
            }
          >
            Back
          </Button>
        </Box>
      </Box>

      {/* CUSTOMER INFORMATION */}

      <Card
        sx={{
          background: "#1E293B",
          color: "white",
          mb: 3,
        }}
      >
        <CardContent>
          <Typography
            variant="h6"
            fontWeight="bold"
            mb={3}
          >
            Customer Information
          </Typography>

          <Grid
            container
            spacing={3}
          >
            <Grid
              size={{
                xs: 12,
                md: 6,
              }}
            >
              <Typography color="#94A3B8">
                Customer Name
              </Typography>

              <Typography variant="h6">
                {customer.full_name ||
                  "N/A"}
              </Typography>
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 3,
              }}
            >
              <Typography color="#94A3B8">
                Customer ID
              </Typography>

              <Typography>
                {customer.id}
              </Typography>
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 3,
              }}
            >
              <Typography color="#94A3B8">
                Status
              </Typography>

              <Chip
                label={
                  customer.status ??
                  "ACTIVE"
                }
                color={
                  customer.status ===
                  "INACTIVE"
                    ? "default"
                    : "success"
                }
                size="small"
              />
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 6,
              }}
            >
              <Typography color="#94A3B8">
                Customer Segment
              </Typography>

              <Chip
                label={segment}
                color={
                  getSegmentColor(
                    segment
                  ) as any
                }
              />
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 6,
              }}
            >
              <Typography color="#94A3B8">
                Customer Type
              </Typography>

              <Typography>
                {customer.customer_type ??
                  "N/A"}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* CONTACT DETAILS */}

      <Card
        sx={{
          background: "#1E293B",
          color: "white",
          mb: 3,
        }}
      >
        <CardContent>
          <Typography
            variant="h6"
            fontWeight="bold"
            mb={3}
          >
            Contact Details
          </Typography>

          <Grid
            container
            spacing={3}
          >
            <Grid
              size={{
                xs: 12,
                md: 6,
              }}
            >
              <Typography color="#94A3B8">
                Email
              </Typography>

              <Typography>
                {customer.email ||
                  "N/A"}
              </Typography>
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 6,
              }}
            >
              <Typography color="#94A3B8">
                Phone Number
              </Typography>

              <Typography>
                {customer.phone_number ||
                  "N/A"}
              </Typography>
            </Grid>

            <Grid
              size={{
                xs: 12,
              }}
            >
              <Typography color="#94A3B8">
                Address
              </Typography>

              <Typography>
                {customer.address ||
                  "N/A"}
              </Typography>
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 4,
              }}
            >
              <Typography color="#94A3B8">
                City
              </Typography>

              <Typography>
                {customer.city ||
                  "N/A"}
              </Typography>
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 4,
              }}
            >
              <Typography color="#94A3B8">
                State
              </Typography>

              <Typography>
                {customer.state ||
                  "N/A"}
              </Typography>
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 4,
              }}
            >
              <Typography color="#94A3B8">
                Country
              </Typography>

              <Typography>
                {customer.country ||
                  "N/A"}
              </Typography>
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 4,
              }}
            >
              <Typography color="#94A3B8">
                Postal Code
              </Typography>

              <Typography>
                {customer.postal_code ||
                  "N/A"}
              </Typography>
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 4,
              }}
            >
              <Typography color="#94A3B8">
                Gender
              </Typography>

              <Typography>
                {customer.gender ||
                  "N/A"}
              </Typography>
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 4,
              }}
            >
              <Typography color="#94A3B8">
                Date of Birth
              </Typography>

              <Typography>
                {formatDate(
                  customer.date_of_birth
                )}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* ANALYTICS SUMMARY */}

      <Grid
        container
        spacing={3}
        mb={3}
      >
        <Grid
          size={{
            xs: 12,
            md: 4,
          }}
        >
          <Card
            sx={{
              background: "#1E293B",
              color: "white",
            }}
          >
            <CardContent>
              <Typography color="#94A3B8">
                Total Orders
              </Typography>

              <Typography
                variant="h4"
                fontWeight="bold"
              >
                {customer.total_orders ??
                  0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid
          size={{
            xs: 12,
            md: 4,
          }}
        >
          <Card
            sx={{
              background: "#1E293B",
              color: "white",
            }}
          >
            <CardContent>
              <Typography color="#94A3B8">
                Total Spend
              </Typography>

              <Typography
                variant="h4"
                fontWeight="bold"
              >
                ₹{" "}
                {Number(
                  totalSpend
                ).toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid
          size={{
            xs: 12,
            md: 4,
          }}
        >
          <Card
            sx={{
              background: "#1E293B",
              color: "white",
            }}
          >
            <CardContent>
              <Typography color="#94A3B8">
                Last Purchase
              </Typography>

              <Typography
                variant="h6"
                fontWeight="bold"
              >
                {formatDate(
                  customer.last_purchase_date
                )}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* RECENT PURCHASE HISTORY */}

      <Card
        sx={{
          background: "#1E293B",
          color: "white",
        }}
      >
        <CardContent>
          <Typography
            variant="h6"
            fontWeight="bold"
            mb={2}
          >
            Recent Purchase History
          </Typography>

          <Divider
            sx={{
              mb: 2,
              borderColor:
                "#334155",
            }}
          />

          {customer.recent_purchases &&
          customer.recent_purchases.length >
            0 ? (
            customer.recent_purchases.map(
              (purchase: any, index) => (
                <Box
                  key={
                    purchase.id ??
                    index
                  }
                  sx={{
                    p: 2,
                    mb: 1,
                    background:
                      "#0F172A",
                    borderRadius: 1,
                  }}
                >
                  <Typography>
                    Invoice:{" "}
                    {purchase.invoice_number ??
                      "N/A"}
                  </Typography>

                  <Typography color="#94A3B8">
                    Date:{" "}
                    {formatDate(
                      purchase.sale_date
                    )}
                  </Typography>

                  <Typography color="#94A3B8">
                    Amount: ₹{" "}
                    {Number(
                      purchase.total_amount ??
                        0
                    ).toLocaleString()}
                  </Typography>
                </Box>
              )
            )
          ) : (
            <Typography color="#94A3B8">
              No recent purchase history
              available.
            </Typography>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
