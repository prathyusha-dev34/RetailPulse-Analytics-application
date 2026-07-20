import {
  Box,
  Container,
  Paper,
  Typography,
  Grid,
} from "@mui/material";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

export default function Reports() {
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
            mb={4}
          >
            Reports
          </Typography>

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper
                sx={{
                  p: 3,
                  bgcolor: "#1E293B",
                  color: "white",
                  borderRadius: 3,
                }}
              >
                <Typography
                  variant="h6"
                  mb={2}
                >
                  Sales Report
                </Typography>

                <Typography color="#CBD5E1">
                  Sales report data will be
                  displayed here.
                </Typography>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Paper
                sx={{
                  p: 3,
                  bgcolor: "#1E293B",
                  color: "white",
                  borderRadius: 3,
                }}
              >
                <Typography
                  variant="h6"
                  mb={2}
                >
                  Inventory Report
                </Typography>

                <Typography color="#CBD5E1">
                  Inventory report data will
                  be displayed here.
                </Typography>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Paper
                sx={{
                  p: 3,
                  bgcolor: "#1E293B",
                  color: "white",
                  borderRadius: 3,
                }}
              >
                <Typography
                  variant="h6"
                  mb={2}
                >
                  Analytics
                </Typography>

                <Typography color="#CBD5E1">
                  Charts and analytics will be
                  connected after backend
                  integration.
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
}