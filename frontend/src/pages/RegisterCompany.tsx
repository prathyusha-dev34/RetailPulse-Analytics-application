import { useState } from "react";
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Alert,
} from "@mui/material";
import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import { registerCompany } from "../api/authApi";

interface RegisterForm {
  company_name: string;
  industry: string;
  company_email: string;
  address: string;
  phone: string;
  owner_name: string;
  owner_email: string;
  password: string;
  confirm_password: string;
}

export default function RegisterCompany() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>();

  const password = watch("password");

  const darkField = {
    "& .MuiOutlinedInput-root": {
      bgcolor: "#21262d",
      color: "#fff",
      borderRadius: 3,

      "& fieldset": {
        borderColor: "#30363d",
      },

      "&:hover fieldset": {
        borderColor: "#58a6ff",
      },

      "&.Mui-focused fieldset": {
        borderColor: "#58a6ff",
      },
    },

    "& .MuiInputLabel-root": {
      color: "#8b949e",
    },

    "& .MuiFormHelperText-root": {
      color: "#8b949e",
    },
  };

  const onSubmit = async (data: RegisterForm) => {
    setError("");

    try {
      setLoading(true);

      await registerCompany(data);

      alert("Company Registered Successfully");

      navigate("/login");
    } catch (err: any) {
      setError(
        err?.response?.data?.detail || "Registration Failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg,#05070d,#0d1117,#161b22)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        py: 5,
        px: 2,
      }}
    >
      <Container maxWidth="md">
        <Paper
          elevation={0}
          sx={{
            p: 5,
            borderRadius: 5,
            bgcolor: "#161b22",
            color: "#fff",
            border: "1px solid #30363d",
            boxShadow: "0 20px 60px rgba(0,0,0,.6)",
          }}
        >
          <Typography
            variant="h4"
            align="center"
            fontWeight={700}
            color="#fff"
            gutterBottom
          >
            Company Registration
          </Typography>

          <Typography
            align="center"
            sx={{
              mb: 4,
              color: "#8b949e",
            }}
          >
            Create your RetailPulse company account
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={3}>

              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Company Name"
                  {...register("company_name", {
                    required: "Company Name is required",
                  })}
                  error={!!errors.company_name}
                  helperText={errors.company_name?.message}
                  sx={darkField}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Industry"
                  {...register("industry", {
                    required: "Industry is required",
                  })}
                  error={!!errors.industry}
                  helperText={errors.industry?.message}
                  sx={darkField}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Company Email"
                  {...register("company_email", {
                    required: "Company Email is required",
                  })}
                  error={!!errors.company_email}
                  helperText={errors.company_email?.message}
                  sx={darkField}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Company Phone"
                  {...register("phone")}
                  sx={darkField}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Company Address"
                  {...register("address")}
                  sx={darkField}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Owner Name"
                  {...register("owner_name", {
                    required: "Owner Name is required",
                  })}
                  error={!!errors.owner_name}
                  helperText={errors.owner_name?.message}
                  sx={darkField}
                />
              </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Owner Email"
                  {...register("owner_email", {
                    required: "Owner Email is required",
                  })}
                  error={!!errors.owner_email}
                  helperText={errors.owner_email?.message}
                  sx={darkField}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  type="password"
                  label="Password"
                  {...register("password", {
                    required: "Password is required",
                    minLength: {
                      value: 8,
                      message: "Minimum 8 characters",
                    },
                  })}
                  error={!!errors.password}
                  helperText={errors.password?.message}
                  sx={darkField}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  type="password"
                  label="Confirm Password"
                  {...register("confirm_password", {
                    validate: (value) =>
                      value === password ||
                      "Passwords do not match",
                  })}
                  error={!!errors.confirm_password}
                  helperText={errors.confirm_password?.message}
                  sx={darkField}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Button
                  fullWidth
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={loading}
                  sx={{
                    mt: 2,
                    py: 1.6,
                    borderRadius: 3,
                    fontWeight: 700,
                    fontSize: 16,
                    textTransform: "none",
                    bgcolor: "#238636",
                    transition: ".3s",

                    "&:hover": {
                      bgcolor: "#2ea043",
                      transform: "translateY(-2px)",
                      boxShadow:
                        "0 10px 25px rgba(35,134,54,.35)",
                    },

                    "&:disabled": {
                      bgcolor: "#30363d",
                      color: "#8b949e",
                    },
                  }}
                >
                  {loading
                    ? "Registering..."
                    : "Register Company"}
                </Button>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Typography
                  align="center"
                  sx={{
                    mt: 2,
                    color: "#8b949e",
                  }}
                >
                  Already have an account?{" "}

                  <Link
                    to="/login"
                    style={{
                      color: "#58a6ff",
                      textDecoration: "none",
                      fontWeight: 700,
                    }}
                  >
                    Login
                  </Link>
                </Typography>
              </Grid>

            </Grid>
          </form>
        </Paper>
      </Container>
    </Box>
  );
}