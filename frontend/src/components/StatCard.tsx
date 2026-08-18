import {
  Avatar,
  Box,
  Card,
  CardContent,
  Stack,
  Typography,
} from "@mui/material";

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
}

export default function StatCard({
  title,
  value,
  icon,
  color,
}: StatCardProps) {
  return (
    <Card
      elevation={0}
      sx={{
        height: "100%",
        minHeight: 148,
        bgcolor: "#111827",
        color: "#fff",
        borderRadius: 3.5,
        border: "1px solid #263449",
        overflow: "hidden",
        position: "relative",
        transition: "all 0.25s ease",

        "&:before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          bgcolor: color,
          opacity: 0.9,
        },

        "&:hover": {
          transform: "translateY(-5px)",
          borderColor: color,
          boxShadow: `0 16px 35px ${color}22`,
        },
      }}
    >
      <CardContent
        sx={{
          p: 2.5,
          "&:last-child": {
            pb: 2.5,
          },
        }}
      >
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          spacing={2}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography
              sx={{
                color: "#64748B",
                fontSize: 12,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: 0.6,
                whiteSpace: "nowrap",
              }}
            >
              {title}
            </Typography>

            <Typography
              sx={{
                color: "#F8FAFC",
                fontSize: { xs: 28, md: 32 },
                fontWeight: 800,
                lineHeight: 1.2,
                mt: 1,
                letterSpacing: "-0.8px",
              }}
            >
              {value}
            </Typography>

            <Box
              sx={{
                width: 34,
                height: 3,
                borderRadius: 5,
                bgcolor: color,
                mt: 1.3,
                opacity: 0.7,
              }}
            />
          </Box>

          <Avatar
            sx={{
              width: 54,
              height: 54,
              flexShrink: 0,
              bgcolor: `${color}18`,
              color: color,
              border: `1px solid ${color}35`,
              borderRadius: 2.5,
            }}
          >
            {icon}
          </Avatar>
        </Stack>
      </CardContent>
    </Card>
  );
}