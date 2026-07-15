import {
  Avatar,
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
        bgcolor: "#1E293B",
        color: "#fff",
        borderRadius: 4,
        border: "1px solid #334155",
        transition: "0.35s",
        cursor: "pointer",

        "&:hover": {
          transform: "translateY(-8px)",
          boxShadow: "0 20px 40px rgba(37,99,235,.25)",
          borderColor: color,
        },
      }}
    >
      <CardContent>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <div>
            <Typography
              sx={{
                color: "#94A3B8",
                fontSize: 14,
              }}
            >
              {title}
            </Typography>

            <Typography
              variant="h3"
              fontWeight={700}
              mt={1}
            >
              {value}
            </Typography>
          </div>

          <Avatar
            sx={{
              bgcolor: color,
              width: 64,
              height: 64,
            }}
          >
            {icon}
          </Avatar>
        </Stack>
      </CardContent>
    </Card>
  );
}