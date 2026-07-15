import { useState } from "react";
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  Box,
  InputAdornment,
  IconButton,
  Avatar,
  Stack,
} from "@mui/material";
import {
  Email,
  Lock,
  Visibility,
  VisibilityOff,
  Business,
} from "@mui/icons-material";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";

import { login } from "../api/authApi";
import { useAuth } from "../context/AuthContext";

interface LoginForm {
  email: string;
  password: string;
}

export default function Login() {
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
  setError("");

  try {
    setLoading(true);

    const response = await login(data);

    console.log("LOGIN RESPONSE:", response.data);

    await authLogin(
      response.data.access_token,
      response.data.refresh_token
    );

    navigate("/dashboard");
  } catch (err: any) {
    console.log("LOGIN ERROR:", err.response?.data);

    setError(
      err?.response?.data?.detail || "Invalid email or password"
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
      px: 2,
    }}
  >
    <Container maxWidth="sm">
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
        <Stack spacing={2} alignItems="center">
          <Avatar
            sx={{
              bgcolor: "#238636",
              width: 80,
              height: 80,
              boxShadow: "0 0 25px rgba(35,134,54,.45)",
            }}
          >
            <Business sx={{ fontSize: 42 }} />
          </Avatar>

          <Typography
            variant="h4"
            fontWeight={700}
            color="#fff"
          >
            RetailPulse
          </Typography>

          <Typography sx={{ color: "#8b949e" }}>
            Sign in to your account
          </Typography>
        </Stack>

        {error && (
          <Alert severity="error" sx={{ mt: 3 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>

          <TextField
            fullWidth
            margin="normal"
            label="Email Address"
            {...register("email", {
              required: "Email is required",
            })}
            error={!!errors.email}
            helperText={errors.email?.message}
            sx={{
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
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Email sx={{ color: "#58a6ff" }} />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            fullWidth
            margin="normal"
            label="Password"
            type={showPassword ? "text" : "password"}
            {...register("password", {
              required: "Password is required",
            })}
            error={!!errors.password}
            helperText={errors.password?.message}
            sx={{
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
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock sx={{ color: "#58a6ff" }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() =>
                      setShowPassword(!showPassword)
                    }
                    sx={{ color: "#8b949e" }}
                  >
                    {showPassword ? (
                      <VisibilityOff />
                    ) : (
                      <Visibility />
                    )}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
                      <Button
            fullWidth
            variant="contained"
            size="large"
            type="submit"
            disabled={loading}
            sx={{
              mt: 4,
              py: 1.7,
              borderRadius: 3,
              fontWeight: 700,
              fontSize: 16,
              textTransform: "none",
              bgcolor: "#238636",
              transition: ".3s",

              "&:hover": {
                bgcolor: "#2ea043",
                transform: "translateY(-2px)",
                boxShadow: "0 10px 25px rgba(35,134,54,.35)",
              },

              "&:disabled": {
                bgcolor: "#30363d",
                color: "#8b949e",
              },
            }}
          >
            {loading ? "Signing In..." : "Login"}
          </Button>

        </form>

        <Typography
          align="center"
          sx={{
            mt: 4,
            color: "#8b949e",
            fontSize: 15,
          }}
        >
          Don't have a company account?{" "}

          <Link
            to="/register"
            style={{
              color: "#58a6ff",
              textDecoration: "none",
              fontWeight: 700,
            }}
          >
            Register Company
          </Link>
        </Typography>
      </Paper>
    </Container>
  </Box>
);
}