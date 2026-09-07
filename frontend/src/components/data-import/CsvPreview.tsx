
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

interface Props {
  columns: string[];
  rows: Record<string, string>[];
}

export default function CsvPreview({
  columns,
  rows,
}: Props) {
  if (!columns.length) return null;

  return (
    <TableContainer
      component={Paper}
      variant="outlined"
      sx={{
        maxHeight: 380,
        borderRadius: 2,
      }}
    >
      <Table stickyHeader size="small">
        <TableHead>
          <TableRow>
            <TableCell
              sx={{
                fontWeight: 700,
                minWidth: 70,
              }}
            >
              #
            </TableCell>

            {columns.map((column) => (
              <TableCell
                key={column}
                sx={{
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                }}
              >
                {column}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>

        <TableBody>
          {rows.length ? (
            rows.map((row, index) => (
              <TableRow
                key={index}
                hover
              >
                <TableCell>
                  {index + 2}
                </TableCell>

                {columns.map((column) => (
                  <TableCell key={column}>
                    {row[column] || "—"}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={columns.length + 1}
              >
                <Typography sx={{ p: 2 }}>
                  No records found.
                </Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

