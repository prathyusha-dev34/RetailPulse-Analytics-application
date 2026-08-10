
import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";

import {
  getCustomer,
  updateCustomer,
} from "../../services/customerService";

// ==========================================================
// FORM TYPE
// ==========================================================

interface CustomerForm {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;

  date_of_birth: string;
  gender: string;
  customer_type: string;
  preferred_sales_channel: string;
  status: string;
}

// ==========================================================
// INITIAL FORM
// ==========================================================

const initialForm: CustomerForm = {
  first_name: "",
  last_name: "",
  email: "",
  phone_number: "",
  address: "",
  city: "",
  state: "",
  country: "India",
  postal_code: "",

  date_of_birth: "",
  gender: "",
  customer_type: "Regular",
  preferred_sales_channel: "Online",
  status: "ACTIVE",
};

// ==========================================================
// COMPONENT
// ==========================================================

export default function EditCustomer() {
  const { id } = useParams<{ id: string }>();

  const navigate = useNavigate();

  const [form, setForm] =
    useState<CustomerForm>(initialForm);

  const [errors, setErrors] =
    useState<Record<string, string>>({});

  const [apiError, setApiError] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  // ========================================================
  // LOAD CUSTOMER
  // ========================================================

  const loadCustomer = async () => {
    if (!id) {
      setApiError("Customer ID is missing.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setApiError("");
      setErrors({});

      const response = await getCustomer(id);

      const customer =
        response?.data ?? response;

      // ----------------------------------------------------
      // Backend has full_name
      // Frontend uses first_name + last_name
      // ----------------------------------------------------

      const fullName =
        customer?.full_name?.trim() || "";

      const nameParts =
        fullName.split(/\s+/);

      const firstName =
        nameParts.length > 0
          ? nameParts[0]
          : "";

      const lastName =
        nameParts.length > 1
          ? nameParts.slice(1).join(" ")
          : "";

      setForm({
        first_name:
          customer?.first_name ??
          firstName,

        last_name:
          customer?.last_name ??
          lastName,

        email:
          customer?.email ?? "",

        phone_number:
          customer?.phone_number ?? "",

        address:
          customer?.address ?? "",

        city:
          customer?.city ?? "",

        state:
          customer?.state ?? "",

        country:
          customer?.country ?? "India",

        postal_code:
          customer?.postal_code ?? "",

        date_of_birth:
          customer?.date_of_birth
            ? String(
                customer.date_of_birth
              ).split("T")[0]
            : "",

        gender:
          customer?.gender ?? "",

        customer_type:
          customer?.customer_type ??
          "Regular",

        preferred_sales_channel:
          customer?.preferred_sales_channel ??
          "Online",

        status:
          customer?.status ??
          "ACTIVE",
      });
    } catch (error: any) {
      console.error(
        "Load customer error:",
        error
      );

      const detail =
        error?.response?.data?.detail;

      if (typeof detail === "string") {
        setApiError(detail);
      } else {
        setApiError(
          "Unable to load customer. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // ========================================================
  // LOAD ON PAGE OPEN
  // ========================================================

  useEffect(() => {
    loadCustomer();
  }, [id]);

  // ========================================================
  // HANDLE INPUT
  // ========================================================

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement
    >
  ) => {
    const {
      name,
      value,
    } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setErrors((previous) => ({
      ...previous,
      [name]: "",
    }));

    setApiError("");
  };

  // ========================================================
  // VALIDATION
  // ========================================================

  const validateForm = () => {
    const newErrors: Record<
      string,
      string
    > = {};

    // ------------------------------------------------------
    // FIRST NAME
    // ------------------------------------------------------

    if (!form.first_name.trim()) {
      newErrors.first_name =
        "First Name is required";
    } else if (
      !/^[A-Za-z ]+$/.test(
        form.first_name.trim()
      )
    ) {
      newErrors.first_name =
        "First Name can contain only letters";
    }

    // ------------------------------------------------------
    // LAST NAME
    // ------------------------------------------------------

    if (!form.last_name.trim()) {
      newErrors.last_name =
        "Last Name is required";
    } else if (
      !/^[A-Za-z ]+$/.test(
        form.last_name.trim()
      )
    ) {
      newErrors.last_name =
        "Last Name can contain only letters";
    }

    // ------------------------------------------------------
    // EMAIL
    // ------------------------------------------------------

    if (!form.email.trim()) {
      newErrors.email =
        "Email is required";
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        form.email.trim()
      )
    ) {
      newErrors.email =
        "Enter a valid email address";
    }

    // ------------------------------------------------------
    // PHONE
    // ------------------------------------------------------

    if (!form.phone_number.trim()) {
      newErrors.phone_number =
        "Phone number is required";
    } else if (
      !/^[6-9]\d{9}$/.test(
        form.phone_number.trim()
      )
    ) {
      newErrors.phone_number =
        "Enter a valid 10-digit phone number";
    }

    // ------------------------------------------------------
    // ADDRESS
    // ------------------------------------------------------

    if (!form.address.trim()) {
      newErrors.address =
        "Address is required";
    }

    // ------------------------------------------------------
    // CITY
    // ------------------------------------------------------

    if (!form.city.trim()) {
      newErrors.city =
        "City is required";
    }

    // ------------------------------------------------------
    // STATE
    // ------------------------------------------------------

    if (!form.state.trim()) {
      newErrors.state =
        "State is required";
    }

    // ------------------------------------------------------
    // COUNTRY
    // ------------------------------------------------------

    if (!form.country.trim()) {
      newErrors.country =
        "Country is required";
    }

    // ------------------------------------------------------
    // POSTAL CODE
    // ------------------------------------------------------

    if (!form.postal_code.trim()) {
      newErrors.postal_code =
        "Postal Code is required";
    } else if (
      !/^\d{6}$/.test(
        form.postal_code.trim()
      )
    ) {
      newErrors.postal_code =
        "Enter a valid 6-digit postal code";
    }

    setErrors(newErrors);

    return (
      Object.keys(newErrors).length === 0
    );
  };

  // ========================================================
  // HANDLE UPDATE
  // ========================================================

  const handleSubmit = async () => {
    if (!id) {
      setApiError(
        "Customer ID is missing."
      );
      return;
    }

    setApiError("");

    const isValid =
      validateForm();

    if (!isValid) {
      return;
    }

    try {
      setSaving(true);

      // ----------------------------------------------------
      // Combine first name + last name
      // Backend expects full_name
      // ----------------------------------------------------

      const fullName =
        `${form.first_name.trim()} ${form.last_name.trim()}`;

      const customerData = {
        full_name: fullName,

        email:
          form.email.trim(),

        phone_number:
          form.phone_number.trim(),

        address:
          form.address.trim(),

        city:
          form.city.trim(),

        state:
          form.state.trim(),

        country:
          form.country.trim(),

        postal_code:
          form.postal_code.trim(),

        date_of_birth:
          form.date_of_birth || undefined,

        gender:
          form.gender || undefined,

        customer_type:
          form.customer_type || "Regular",

        preferred_sales_channel:
          form.preferred_sales_channel ||
          "Online",

        status:
          form.status || "ACTIVE",
      };

      await updateCustomer(
        id,
        customerData
      );

      // ----------------------------------------------------
      // SUCCESS
      // ----------------------------------------------------

      navigate("/customers");

    } catch (error: any) {
      console.error(
        "Update customer error:",
        error
      );

      const detail =
        error?.response?.data?.detail;

      // ----------------------------------------------------
      // STRING ERROR
      // ----------------------------------------------------

      if (
        typeof detail === "string"
      ) {
        const lowerDetail =
          detail.toLowerCase();

        if (
          lowerDetail.includes(
            "email"
          )
        ) {
          setErrors({
            email: detail,
          });
        } else if (
          lowerDetail.includes(
            "phone"
          )
        ) {
          setErrors({
            phone_number: detail,
          });
        } else {
          setApiError(detail);
        }

        return;
      }

      // ----------------------------------------------------
      // PYDANTIC VALIDATION ERRORS
      // ----------------------------------------------------

      if (
        Array.isArray(detail)
      ) {
        const fieldErrors: Record<
          string,
          string
        > = {};

        detail.forEach(
          (item: any) => {
            const field =
              item?.loc?.[
                item.loc.length - 1
              ];

            const message =
              item?.msg ||
              "Validation error";

            if (
              typeof field === "string"
            ) {
              fieldErrors[field] =
                message;
            }
          }
        );

        if (
          Object.keys(fieldErrors)
            .length > 0
        ) {
          setErrors(fieldErrors);
        } else {
          setApiError(
            "Validation failed. Please check the entered details."
          );
        }

        return;
      }

      // ----------------------------------------------------
      // DEFAULT ERROR
      // ----------------------------------------------------

      setApiError(
        "Failed to update customer. Please try again."
      );

    } finally {
      setSaving(false);
    }
  };

  // ========================================================
  // CANCEL
  // ========================================================

  const handleCancel = () => {
    if (!saving) {
      navigate("/customers");
    }
  };

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
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <CircularProgress />

        <Typography color="white">
          Loading customer...
        </Typography>
      </Box>
    );
  }

  // ========================================================
  // PAGE
  // ========================================================

  return (
    <Box
      sx={{
        p: 3,
        minHeight: "100vh",
        background: "#0F172A",
      }}
    >
      {/* ================================================== */}
      {/* TITLE */}
      {/* ================================================== */}

      <Typography
        variant="h4"
        fontWeight="bold"
        color="white"
        mb={3}
      >
        Edit Customer
      </Typography>

      {/* ================================================== */}
      {/* CARD */}
      {/* ================================================== */}

      <Card
        sx={{
          background: "#1E293B",
          color: "white",
          maxWidth: 1200,
          mx: "auto",
        }}
      >
        <CardContent
          sx={{
            p: 4,
          }}
        >
          {/* CUSTOMER ID */}

          <Typography
            color="#94A3B8"
            mb={3}
          >
            Customer ID: {id}
          </Typography>

          {/* API ERROR */}

          {apiError && (
            <Alert
              severity="error"
              sx={{
                mb: 3,
              }}
            >
              {apiError}
            </Alert>
          )}

          {/* ================================================= */}
          {/* FORM */}
          {/* ================================================= */}

          <Grid
            container
            spacing={3}
          >
            {/* FIRST NAME */}

            <Grid
              item
              xs={12}
              md={6}
            >
              <TextField
                fullWidth
                required
                label="First Name"
                name="first_name"
                value={
                  form.first_name
                }
                onChange={
                  handleChange
                }
                error={Boolean(
                  errors.first_name
                )}
                helperText={
                  errors.first_name
                }
                sx={{
                  background:
                    "white",
                }}
              />
            </Grid>

            {/* LAST NAME */}

            <Grid
              item
              xs={12}
              md={6}
            >
              <TextField
                fullWidth
                required
                label="Last Name"
                name="last_name"
                value={
                  form.last_name
                }
                onChange={
                  handleChange
                }
                error={Boolean(
                  errors.last_name
                )}
                helperText={
                  errors.last_name
                }
                sx={{
                  background:
                    "white",
                }}
              />
            </Grid>

            {/* EMAIL */}

            <Grid
              item
              xs={12}
              md={6}
            >
              <TextField
                fullWidth
                required
                type="email"
                label="Email"
                name="email"
                value={
                  form.email
                }
                onChange={
                  handleChange
                }
                error={Boolean(
                  errors.email
                )}
                helperText={
                  errors.email
                }
                sx={{
                  background:
                    "white",
                }}
              />
            </Grid>

            {/* PHONE */}

            <Grid
              item
              xs={12}
              md={6}
            >
              <TextField
                fullWidth
                required
                label="Phone Number"
                name="phone_number"
                value={
                  form.phone_number
                }
                onChange={
                  handleChange
                }
                inputProps={{
                  maxLength: 10,
                }}
                error={Boolean(
                  errors.phone_number
                )}
                helperText={
                  errors.phone_number ||
                  "Enter 10-digit mobile number"
                }
                sx={{
                  background:
                    "white",
                }}
              />
            </Grid>

            {/* ADDRESS */}

            <Grid
              item
              xs={12}
            >
              <TextField
                fullWidth
                required
                multiline
                minRows={2}
                label="Address"
                name="address"
                value={
                  form.address
                }
                onChange={
                  handleChange
                }
                error={Boolean(
                  errors.address
                )}
                helperText={
                  errors.address
                }
                sx={{
                  background:
                    "white",
                }}
              />
            </Grid>

            {/* CITY */}

            <Grid
              item
              xs={12}
              md={4}
            >
              <TextField
                fullWidth
                required
                label="City"
                name="city"
                value={
                  form.city
                }
                onChange={
                  handleChange
                }
                error={Boolean(
                  errors.city
                )}
                helperText={
                  errors.city
                }
                sx={{
                  background:
                    "white",
                }}
              />
            </Grid>

            {/* STATE */}

            <Grid
              item
              xs={12}
              md={4}
            >
              <TextField
                fullWidth
                required
                label="State"
                name="state"
                value={
                  form.state
                }
                onChange={
                  handleChange
                }
                error={Boolean(
                  errors.state
                )}
                helperText={
                  errors.state
                }
                sx={{
                  background:
                    "white",
                }}
              />
            </Grid>

            {/* COUNTRY */}

            <Grid
              item
              xs={12}
              md={4}
            >
              <TextField
                fullWidth
                required
                label="Country"
                name="country"
                value={
                  form.country
                }
                onChange={
                  handleChange
                }
                error={Boolean(
                  errors.country
                )}
                helperText={
                  errors.country
                }
                sx={{
                  background:
                    "white",
                }}
              />
            </Grid>

            {/* POSTAL CODE */}

            <Grid
              item
              xs={12}
              md={4}
            >
              <TextField
                fullWidth
                required
                label="Postal Code"
                name="postal_code"
                value={
                  form.postal_code
                }
                onChange={
                  handleChange
                }
                inputProps={{
                  maxLength: 6,
                }}
                error={Boolean(
                  errors.postal_code
                )}
                helperText={
                  errors.postal_code
                }
                sx={{
                  background:
                    "white",
                }}
              />
            </Grid>

            {/* DATE OF BIRTH */}

            <Grid
              item
              xs={12}
              md={4}
            >
              <TextField
                fullWidth
                type="date"
                label="Date Of Birth"
                name="date_of_birth"
                value={
                  form.date_of_birth
                }
                onChange={
                  handleChange
                }
                InputLabelProps={{
                  shrink: true,
                }}
                sx={{
                  background:
                    "white",
                }}
              />
            </Grid>

            {/* GENDER */}

            <Grid
              item
              xs={12}
              md={4}
            >
              <TextField
                select
                fullWidth
                label="Gender"
                name="gender"
                value={
                  form.gender
                }
                onChange={
                  handleChange
                }
                sx={{
                  background:
                    "white",
                }}
              >
                <MenuItem value="">
                  Select Gender
                </MenuItem>

                <MenuItem value="Male">
                  Male
                </MenuItem>

                <MenuItem value="Female">
                  Female
                </MenuItem>

                <MenuItem value="Other">
                  Other
                </MenuItem>
              </TextField>
            </Grid>

            {/* CUSTOMER TYPE */}

            <Grid
              item
              xs={12}
              md={6}
            >
              <TextField
                select
                fullWidth
                label="Customer Type"
                name="customer_type"
                value={
                  form.customer_type
                }
                onChange={
                  handleChange
                }
                sx={{
                  background:
                    "white",
                }}
              >
                <MenuItem value="Regular">
                  Regular
                </MenuItem>

                <MenuItem value="Retail">
                  Retail
                </MenuItem>

                <MenuItem value="Wholesale">
                  Wholesale
                </MenuItem>

                <MenuItem value="VIP">
                  VIP
                </MenuItem>
              </TextField>
            </Grid>

            {/* SALES CHANNEL */}

            <Grid
              item
              xs={12}
              md={6}
            >
              <TextField
                select
                fullWidth
                label="Preferred Sales Channel"
                name="preferred_sales_channel"
                value={
                  form.preferred_sales_channel
                }
                onChange={
                  handleChange
                }
                sx={{
                  background:
                    "white",
                }}
              >
                <MenuItem value="Online">
                  Online
                </MenuItem>

                <MenuItem value="Retail Store">
                  Retail Store
                </MenuItem>

                <MenuItem value="Marketplace">
                  Marketplace
                </MenuItem>
              </TextField>
            </Grid>

            {/* STATUS */}

            <Grid
              item
              xs={12}
              md={6}
            >
              <TextField
                select
                fullWidth
                label="Status"
                name="status"
                value={
                  form.status
                }
                onChange={
                  handleChange
                }
                sx={{
                  background:
                    "white",
                }}
              >
                <MenuItem value="ACTIVE">
                  Active
                </MenuItem>

                <MenuItem value="INACTIVE">
                  Inactive
                </MenuItem>
              </TextField>
            </Grid>
          </Grid>

          {/* ================================================= */}
          {/* BUTTONS */}
          {/* ================================================= */}

          <Box
            display="flex"
            gap={2}
            mt={4}
          >
            {/* UPDATE */}

            <Button
              variant="contained"
              onClick={
                handleSubmit
              }
              disabled={saving}
              startIcon={
                saving ? (
                  <CircularProgress
                    size={18}
                    color="inherit"
                  />
                ) : undefined
              }
            >
              {saving
                ? "Updating..."
                : "Update Customer"}
            </Button>

            {/* CANCEL */}

            <Button
              variant="outlined"
              onClick={
                handleCancel
              }
              disabled={saving}
              sx={{
                color: "white",
                borderColor:
                  "white",
              }}
            >
              Cancel
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

