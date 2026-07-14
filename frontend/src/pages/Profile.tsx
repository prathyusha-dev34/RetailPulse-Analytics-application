import { useState } from "react";
import {
  Container,
  Paper,
  Typography,
  Grid,
  Button,
  Box,
  TextField,
  Alert,
  Avatar,
  Divider,
  Card,
  CardContent,
  Stack,
  Chip,
} from "@mui/material";

import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import BusinessIcon from "@mui/icons-material/Business";
import BadgeIcon from "@mui/icons-material/Badge";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import LogoutIcon from "@mui/icons-material/Logout";
import LockResetIcon from "@mui/icons-material/LockReset";

import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { changePassword } from "../api/authApi";

interface PasswordForm {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export default function Profile() {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<PasswordForm>();

  const newPassword = watch("new_password");

  const onSubmit = async (data: PasswordForm) => {
    setMessage("");
    setError("");

    try {
      await changePassword({
        current_password: data.current_password,
        new_password: data.new_password,
      });

      setMessage("Password changed successfully.");
      reset();
    } catch (err: any) {
      setError(
        err?.response?.data?.detail || "Failed to change password."
      );
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    navigate("/login");
  };

  return (
    <Container
      maxWidth="lg"
      sx={{
        py: 5,
        minHeight: "100vh",
        bgcolor: "#0d1117",
      }}
    >
      <Paper
        elevation={0}
        sx={{
          borderRadius: 5,
          overflow: "hidden",
          bgcolor: "#161b22",
          color: "#fff",
          border: "1px solid #30363d",
        }}
      >
        {/* Header */}

        <Box
          sx={{
            background:
              "linear-gradient(135deg,#0d1117,#161b22,#1f2937)",
            color: "#fff",
            p: 5,
            textAlign: "center",
          }}
        >
          <Avatar
            sx={{
              width: 110,
              height: 110,
              margin: "auto",
              bgcolor: "#238636",
              color: "#fff",
              fontSize: 45,
              fontWeight: "bold",
            }}
          >
            {user?.name?.charAt(0).toUpperCase()}
          </Avatar>

          <Typography variant="h4" mt={2} fontWeight={700}>
            {user?.name}
          </Typography>

          <Typography sx={{ color: "#8b949e" }}>
            {user?.email}
          </Typography>

          <Chip
            label={user?.role}
            sx={{
              mt: 2,
              bgcolor: "#238636",
              color: "#fff",
            }}
          />
        </Box>

        <Box
          p={4}
          sx={{
            bgcolor: "#0d1117",
            color: "#fff",
          }}
        >
          <Typography
            variant="h5"
            fontWeight={700}
            gutterBottom
          >
            Profile Information
          </Typography>

          <Divider
            sx={{
              mb: 3,
              borderColor: "#30363d",
            }}
          />

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card
                sx={{
                  borderRadius: 4,
                  bgcolor: "#161b22",
                  color: "#fff",
                  border: "1px solid #30363d",
                }}
              >
                <CardContent>
                  <Stack spacing={3}>
                    <Box display="flex" gap={2}>
                      <PersonIcon sx={{ color: "#58a6ff" }} />

                      <Box>
                        <Typography sx={{ color: "#8b949e" }}>
                          Name
                        </Typography>

                        <Typography fontWeight={600}>
                          {user?.name}
                        </Typography>
                      </Box>
                    </Box>

                    <Box display="flex" gap={2}>
                      <EmailIcon sx={{ color: "#58a6ff" }} />

                      <Box>
                        <Typography sx={{ color: "#8b949e" }}>
                          Email
                        </Typography>

                        <Typography fontWeight={600}>
                          {user?.email}
                        </Typography>
                      </Box>
                    </Box>

                    <Box display="flex" gap={2}>
                      <BadgeIcon sx={{ color: "#58a6ff" }} />

                      <Box>
                        <Typography sx={{ color: "#8b949e" }}>
                          Role
                        </Typography>

                        <Typography fontWeight={600}>
                          {user?.role}
                        </Typography>
                      </Box>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Card
                sx={{
                  borderRadius: 4,
                  bgcolor: "#161b22",
                  color: "#fff",
                  border: "1px solid #30363d",
                }}
              >
                <CardContent>
                  <Stack spacing={3}>
                    <Box display="flex" gap={2}>
                      <BusinessIcon sx={{ color: "#58a6ff" }} />

                      <Box>
                        <Typography sx={{ color: "#8b949e" }}>
                          Company
                        </Typography>

                        <Typography fontWeight={600}>
                          {user?.company}
                        </Typography>
                      </Box>
                    </Box>

                    <Box display="flex" gap={2}>
                      <AccessTimeIcon sx={{ color: "#58a6ff" }} />

                      <Box>
                        <Typography sx={{ color: "#8b949e" }}>
                          Last Login
                        </Typography>

                        <Typography fontWeight={600}>
                          {user?.last_login || "N/A"}
                        </Typography>
                      </Box>
                    </Box>

                    <Box display="flex" gap={2}>
                      <CheckCircleIcon sx={{ color: "#3fb950" }} />

                      <Box>
                        <Typography sx={{ color: "#8b949e" }}>
                          Status
                        </Typography>

                        <Typography
                          fontWeight={700}
                          sx={{ color: "#3fb950" }}
                        >
                          {user?.status}
                        </Typography>
                      </Box>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

                  {/* Change Password */}

          <Card
            sx={{
              mt: 5,
              borderRadius: 4,
              bgcolor: "#161b22",
              color: "#fff",
              border: "1px solid #30363d",
            }}
          >
            <CardContent>
              <Typography
                variant="h5"
                fontWeight={700}
                mb={3}
                display="flex"
                alignItems="center"
                gap={1}
              >
                <LockResetIcon sx={{ color: "#58a6ff" }} />
                Change Password
              </Typography>

              {message && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  {message}
                </Alert>
              )}

              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              <form onSubmit={handleSubmit(onSubmit)}>
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      type="password"
                      label="Current Password"
                      {...register("current_password", {
                        required: "Current password is required",
                      })}
                      error={!!errors.current_password}
                      helperText={errors.current_password?.message}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          bgcolor: "#21262d",
                          color: "#fff",
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
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      type="password"
                      label="New Password"
                      {...register("new_password", {
                        required: "New password is required",
                        minLength: {
                          value: 8,
                          message: "Minimum 8 characters",
                        },
                      })}
                      error={!!errors.new_password}
                      helperText={errors.new_password?.message}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          bgcolor: "#21262d",
                          color: "#fff",
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
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      type="password"
                      label="Confirm Password"
                      {...register("confirm_password", {
                        validate: (value) =>
                          value === newPassword ||
                          "Passwords do not match",
                      })}
                      error={!!errors.confirm_password}
                      helperText={errors.confirm_password?.message}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          bgcolor: "#21262d",
                          color: "#fff",
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
                      }}
                    />
                  </Grid>
                </Grid>

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  sx={{
                    mt: 3,
                    px: 5,
                    borderRadius: 3,
                    textTransform: "none",
                    fontWeight: 700,
                    bgcolor: "#238636",
                    "&:hover": {
                      bgcolor: "#2ea043",
                    },
                  }}
                >
                  Change Password
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Logout */}

          <Box
            mt={5}
            display="flex"
            justifyContent="center"
          >
            <Button
              startIcon={<LogoutIcon />}
              variant="contained"
              size="large"
              onClick={handleLogout}
              sx={{
                px: 5,
                py: 1.5,
                borderRadius: 3,
                textTransform: "none",
                fontWeight: 700,
                bgcolor: "#da3633",
                "&:hover": {
                  bgcolor: "#f85149",
                },
              }}
            >
              Logout
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}