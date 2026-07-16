import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Container,
  Paper,
  TextField,
  Typography,
} from "@mui/material";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    setMessage(
      "Password reset functionality will be available soon."
    );
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#0f172a",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={8}
          sx={{
            p: 4,
            bgcolor: "#1e293b",
            color: "white",
            borderRadius: 3,
          }}
        >
          <Typography
            variant="h4"
            fontWeight="bold"
            textAlign="center"
            mb={3}
          >
            Forgot Password
          </Typography>

          <Typography
            variant="body2"
            color="gray"
            textAlign="center"
            mb={3}
          >
            Enter your registered email address.
          </Typography>

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
            />

            <Button
              fullWidth
              type="submit"
              variant="contained"
              size="large"
              sx={{
                mt: 2,
                py: 1.5,
              }}
            >
              Send Reset Link
            </Button>
          </form>

          {message && (
            <Alert
              severity="info"
              sx={{ mt: 3 }}
            >
              {message}
            </Alert>
          )}
        </Paper>
      </Container>
    </Box>
  );
}