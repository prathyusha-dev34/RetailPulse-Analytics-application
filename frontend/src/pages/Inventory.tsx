import { Box, Container, Paper, Typography } from "@mui/material";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

export default function Inventory() {
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
            pb: 4,
          }}
        >
          <Typography
            variant="h4"
            color="white"
            fontWeight={700}
            mb={3}
          >
            Inventory
          </Typography>

          <Paper
            sx={{
              p: 4,
              bgcolor: "#1E293B",
              color: "white",
              borderRadius: 3,
            }}
          >
            <Typography variant="h6">
              Inventory Management
            </Typography>

            <Typography
              sx={{
                mt: 2,
                color: "#CBD5E1",
              }}
            >
              Inventory dashboard will be connected to backend in the next step.
            </Typography>
          </Paper>
        </Container>
      </Box>
    </Box>
  );
}