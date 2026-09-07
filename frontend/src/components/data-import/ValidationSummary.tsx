
import {
  Box,
  Chip,
  Paper,
  Typography,
} from "@mui/material";

interface Props {
  total: number;
  valid: number;
  invalid: number;
  duplicates: number;
}

export default function ValidationSummary({
  total,
  valid,
  invalid,
  duplicates,
}: Props) {
  const cards = [
    ["Total Records", total, "default"],
    ["Valid Records", valid, "success"],
    ["Invalid Records", invalid, "error"],
    ["Duplicate Records", duplicates, "warning"],
  ] as const;

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns:
          "repeat(auto-fit,minmax(170px,1fr))",
        gap: 1.5,
      }}
    >
      {cards.map(([label, value, color]) => (
        <Paper
          key={label}
          variant="outlined"
          sx={{
            p: 2,
            borderRadius: 2,
          }}
        >
          <Typography
            variant="body2"
            color="text.secondary"
          >
            {label}
          </Typography>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              mt: 1,
            }}
          >
            <Typography
              variant="h5"
              sx={{ fontWeight: 800 }}
            >
              {value}
            </Typography>

            <Chip
              size="small"
              color={color}
              label={label.replace(" Records", "")}
            />
          </Box>
        </Paper>
      ))}
    </Box>
  );
}

