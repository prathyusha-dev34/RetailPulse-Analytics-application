import { useState, type ChangeEvent } from "react";

import {
  Box,
  Button,
  Card,
  CardContent,
  MenuItem,
  TextField,
  Typography,
  Alert,
  CircularProgress,
} from "@mui/material";

import { useNavigate } from "react-router-dom";

import { createCustomer } from "../../services/customerService";

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
};

// ==========================================================
// COMPONENT
// ==========================================================

export default function AddCustomer() {
  const navigate = useNavigate();

  const [form, setForm] =
    useState<CustomerForm>(initialForm);

  const [errors, setErrors] =
    useState<Record<string, string>>({});

  const [apiError, setApiError] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  // ========================================================
  // INPUT HANDLER
  // ========================================================

  const handleChange = (
    e: ChangeEvent<
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
    const newErrors: Record<string, string> = {};

    // FIRST NAME
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

    // LAST NAME
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

    // EMAIL
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

    // PHONE
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

    // ADDRESS
    if (!form.address.trim()) {
      newErrors.address =
        "Address is required";
    }

    // CITY
    if (!form.city.trim()) {
      newErrors.city =
        "City is required";
    }

    // STATE
    if (!form.state.trim()) {
      newErrors.state =
        "State is required";
    }

    // COUNTRY
    if (!form.country.trim()) {
      newErrors.country =
        "Country is required";
    }

    // POSTAL CODE
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
  // SUBMIT
  // ========================================================

  const handleSubmit = async () => {
    setApiError("");

    const isValid =
      validateForm();

    if (!isValid) {
      return;
    }

    try {
      setLoading(true);

      // Combine first + last name
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

        status: "ACTIVE",
      };

      await createCustomer(
        customerData
      );

      // Success
      navigate("/customers");

    } catch (error: any) {
      console.error(
        "Create customer error:",
        error
      );

      const detail =
        error?.response?.data?.detail;

      if (
        typeof detail === "string"
      ) {
        const lowerDetail =
          detail.toLowerCase();

        if (
          lowerDetail.includes("email")
        ) {
          setErrors({
            email: detail,
          });
        } else if (
          lowerDetail.includes("phone")
        ) {
          setErrors({
            phone_number: detail,
          });
        } else {
          setApiError(detail);
        }
      } else {
        setApiError(
          "Failed to create customer. Please try again."
        );
      }

    } finally {
      setLoading(false);
    }
  };

  // ========================================================
  // CANCEL
  // ========================================================

  const handleCancel = () => {
    navigate("/customers");
  };

  // ========================================================
  // COMMON TEXT FIELD STYLE
  // ========================================================

  const fieldStyle = {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: "4px",

    "& .MuiInputBase-root": {
      backgroundColor: "#FFFFFF",
    },

    "& .MuiInputBase-input": {
      color: "#1F2937",
    },

    "& .MuiInputLabel-root": {
      color: "#64748B",
    },

    "& .MuiInputLabel-root.Mui-focused": {
      color: "#1976D2",
    },

    "& .MuiFormHelperText-root": {
      backgroundColor: "transparent",
      marginLeft: 0,
    },
  };

  // ========================================================
  // FORM GRID STYLE
  // ========================================================

  const twoColumnGrid = {
    display: "grid",
    gridTemplateColumns: {
      xs: "1fr",
      md: "repeat(2, minmax(0, 1fr))",
    },
    gap: 3,
  };

  const threeColumnGrid = {
    display: "grid",
    gridTemplateColumns: {
      xs: "1fr",
      sm: "repeat(2, minmax(0, 1fr))",
      md: "repeat(3, minmax(0, 1fr))",
    },
    gap: 3,
  };

  // ========================================================
  // UI
  // ========================================================

  return (
    <Box
      sx={{
        p: {
          xs: 2,
          md: 3,
        },

        backgroundColor: "#0F172A",

        minHeight: "100vh",

        boxSizing: "border-box",
      }}
    >
      {/* ==================================================
          PAGE TITLE
      ================================================== */}

      <Typography
        variant="h4"
        fontWeight="bold"
        color="white"
        mb={3}
      >
        Add Customer
      </Typography>

      {/* ==================================================
          CARD
      ================================================== */}

      <Card
        sx={{
          backgroundColor: "#1E293B",
          color: "white",
          borderRadius: 2,
        }}
      >
        <CardContent
          sx={{
            p: {
              xs: 2,
              md: 3,
            },
          }}
        >
          {/* =================================================
              API ERROR
          ================================================= */}

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

          {/* =================================================
              FIRST ROW
              FIRST NAME + LAST NAME
          ================================================= */}

          <Box sx={twoColumnGrid}>

            {/* FIRST NAME */}

            <TextField
              fullWidth
              required
              label="First Name"
              name="first_name"
              value={form.first_name}
              onChange={handleChange}
              error={Boolean(
                errors.first_name
              )}
              helperText={
                errors.first_name
              }
              InputLabelProps={{
                shrink: true,
              }}
              sx={fieldStyle}
            />

            {/* LAST NAME */}

            <TextField
              fullWidth
              required
              label="Last Name"
              name="last_name"
              value={form.last_name}
              onChange={handleChange}
              error={Boolean(
                errors.last_name
              )}
              helperText={
                errors.last_name
              }
              InputLabelProps={{
                shrink: true,
              }}
              sx={fieldStyle}
            />

            {/* EMAIL */}

            <TextField
              fullWidth
              required
              type="email"
              label="Email"
              name="email"
              value={form.email}
              onChange={handleChange}
              error={Boolean(
                errors.email
              )}
              helperText={
                errors.email
              }
              InputLabelProps={{
                shrink: true,
              }}
              sx={fieldStyle}
            />

            {/* PHONE */}

            <TextField
              fullWidth
              required
              label="Phone Number"
              name="phone_number"
              value={form.phone_number}
              onChange={handleChange}
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
              InputLabelProps={{
                shrink: true,
              }}
              sx={fieldStyle}
            />
          </Box>

          {/* =================================================
              ADDRESS
          ================================================= */}

          <Box sx={{ mt: 3 }}>
            <TextField
              fullWidth
              required
              multiline
              minRows={2}
              label="Address"
              name="address"
              value={form.address}
              onChange={handleChange}
              error={Boolean(
                errors.address
              )}
              helperText={
                errors.address
              }
              InputLabelProps={{
                shrink: true,
              }}
              sx={fieldStyle}
            />
          </Box>

          {/* =================================================
              CITY / STATE / COUNTRY
          ================================================= */}

          <Box
            sx={{
              ...threeColumnGrid,
              mt: 3,
            }}
          >
            {/* CITY */}

            <TextField
              fullWidth
              required
              label="City"
              name="city"
              value={form.city}
              onChange={handleChange}
              error={Boolean(
                errors.city
              )}
              helperText={
                errors.city
              }
              InputLabelProps={{
                shrink: true,
              }}
              sx={fieldStyle}
            />

            {/* STATE */}

            <TextField
              fullWidth
              required
              label="State"
              name="state"
              value={form.state}
              onChange={handleChange}
              error={Boolean(
                errors.state
              )}
              helperText={
                errors.state
              }
              InputLabelProps={{
                shrink: true,
              }}
              sx={fieldStyle}
            />

            {/* COUNTRY */}

            <TextField
              fullWidth
              required
              label="Country"
              name="country"
              value={form.country}
              onChange={handleChange}
              error={Boolean(
                errors.country
              )}
              helperText={
                errors.country
              }
              InputLabelProps={{
                shrink: true,
              }}
              sx={fieldStyle}
            />
          </Box>

          {/* =================================================
              POSTAL / DOB / GENDER
          ================================================= */}

          <Box
            sx={{
              ...threeColumnGrid,
              mt: 3,
            }}
          >
            {/* POSTAL CODE */}

            <TextField
              fullWidth
              required
              label="Postal Code"
              name="postal_code"
              value={form.postal_code}
              onChange={handleChange}
              inputProps={{
                maxLength: 6,
              }}
              error={Boolean(
                errors.postal_code
              )}
              helperText={
                errors.postal_code
              }
              InputLabelProps={{
                shrink: true,
              }}
              sx={fieldStyle}
            />

            {/* DATE OF BIRTH */}

            <TextField
              fullWidth
              type="date"
              label="Date Of Birth"
              name="date_of_birth"
              value={form.date_of_birth}
              onChange={handleChange}
              InputLabelProps={{
                shrink: true,
              }}
              sx={fieldStyle}
            />

            {/* GENDER */}

            <TextField
              select
              fullWidth
              label="Gender"
              name="gender"
              value={form.gender}
              onChange={handleChange}
              InputLabelProps={{
                shrink: true,
              }}
              sx={fieldStyle}
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
          </Box>

          {/* =================================================
              CUSTOMER TYPE / SALES CHANNEL
          ================================================= */}

          <Box
            sx={{
              ...twoColumnGrid,
              mt: 3,
            }}
          >
            {/* CUSTOMER TYPE */}

            <TextField
              select
              fullWidth
              label="Customer Type"
              name="customer_type"
              value={form.customer_type}
              onChange={handleChange}
              InputLabelProps={{
                shrink: true,
              }}
              sx={fieldStyle}
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
            </TextField>

            {/* SALES CHANNEL */}

            <TextField
              select
              fullWidth
              label="Preferred Sales Channel"
              name="preferred_sales_channel"
              value={
                form.preferred_sales_channel
              }
              onChange={handleChange}
              InputLabelProps={{
                shrink: true,
              }}
              sx={fieldStyle}
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
          </Box>

          {/* =================================================
              BUTTONS
          ================================================= */}

          <Box
            sx={{
              display: "flex",
              gap: 2,
              mt: 4,
              flexWrap: "wrap",
            }}
          >
            {/* SAVE */}

            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={loading}
              startIcon={
                loading ? (
                  <CircularProgress
                    size={18}
                    color="inherit"
                  />
                ) : undefined
              }
              sx={{
                minWidth: 150,
              }}
            >
              {loading
                ? "Saving..."
                : "Save Customer"}
            </Button>

            {/* CANCEL */}

            <Button
              variant="outlined"
              onClick={handleCancel}
              disabled={loading}
              sx={{
                color: "white",
                borderColor: "white",

                "&:hover": {
                  borderColor: "white",
                  backgroundColor:
                    "rgba(255,255,255,0.08)",
                },
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