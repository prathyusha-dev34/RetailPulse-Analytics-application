import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
} from "@mui/material";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

export default function Analytics() {
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
            Analytics
          </Typography>

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper
                sx={{
                  p: 3,
                  bgcolor: "#1E293B",
                  color: "white",
                  borderRadius: 3,
                  minHeight: 220,
                }}
              >
                <Typography variant="h6">
                  Sales Analytics
                </Typography>

                <Typography
                  sx={{
                    mt: 2,
                    color: "#CBD5E1",
                  }}
                >
                  Sales charts will be displayed here.
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
                  minHeight: 220,
                }}
              >
                <Typography variant="h6">
                  Product Analytics
                </Typography>

                <Typography
                  sx={{
                    mt: 2,
                    color: "#CBD5E1",
                  }}
                >
                  Product performance charts will appear here.
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
                  minHeight: 300,
                }}
              >
                <Typography variant="h6">
                  Business Insights
                </Typography>

                <Typography
                  sx={{
                    mt: 2,
                    color: "#CBD5E1",
                  }}
                >
                  Advanced analytics and reports will be connected to the backend.
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
}