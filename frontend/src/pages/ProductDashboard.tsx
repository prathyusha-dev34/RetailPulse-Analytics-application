import { useEffect, useState } from "react";

import {
  Box,
  Card,
  CardContent,
  Container,
  Grid,
  Typography,
} from "@mui/material";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

import { getProductDashboardSummary } from "../api/productApi";

interface Summary {
  total_products: number;
  active_products: number;
  inactive_products: number;
  low_stock: number;
  total_categories: number;
}

export default function ProductDashboard() {
  const [summary, setSummary] = useState<Summary>({
    total_products: 0,
    active_products: 0,
    inactive_products: 0,
    low_stock: 0,
    total_categories: 0,
  });

  useEffect(() => {
    loadSummary();
  }, []);

  async function loadSummary() {
    try {
      const res = await getProductDashboardSummary();
      setSummary(res.data);
    } catch (err) {
      console.log(err);
    }
  }

  const cards = [
    {
      title: "Total Products",
      value: summary.total_products,
    },
    {
      title: "Active Products",
      value: summary.active_products,
    },
    {
      title: "Inactive Products",
      value: summary.inactive_products,
    },
    {
      title: "Low Stock",
      value: summary.low_stock,
    },
    {
      title: "Categories",
      value: summary.total_categories,
    },
  ];

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
            Product Dashboard
          </Typography>

          <Grid container spacing={3}>
            {cards.map((card) => (
              <Grid
                size={{ xs: 12, sm: 6, md: 4 }}
                key={card.title}
              >
                <Card
                  sx={{
                    bgcolor: "#1E293B",
                    color: "white",
                    borderRadius: 3,
                    height: "100%",
                  }}
                >
                  <CardContent>
                    <Typography
                      variant="subtitle1"
                      color="#CBD5E1"
                    >
                      {card.title}
                    </Typography>

                    <Typography
                      variant="h4"
                      fontWeight={700}
                      mt={2}
                    >
                      {card.value}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>
    </Box>
  );
}