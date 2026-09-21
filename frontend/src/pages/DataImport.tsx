
import { useEffect, useMemo, useState } from "react";

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

import {
  CloudUpload,
  DeleteOutlined,
  Download,
  PlayArrow,
  Refresh,
  FactCheck,
  DescriptionOutlined,
  CheckCircle,
} from "@mui/icons-material";

import { useAuth } from "../context/AuthContext";

import {
  deleteImport,
  downloadImportErrors,
  getImportHistory,
  processImport,
  uploadImport,
  validateImport,
} from "../api/dataImportApi";

import type {
  ImportErrorRow,
  ImportHistoryItem,
  ImportType,
} from "../api/dataImportApi";

import {
  getMissingColumns,
  parseCsvPreview,
} from "../utils/csvUtils";

const REQUIRED: Record<ImportType, string[]> = {
  products: [
    "Product Name",
    "SKU",
    "Category",
    "Unit Price",
    "Stock Quantity",
  ],
  customers: ["Name", "Email", "Phone"],
  sales: [
    "Customer",
    "Product",
    "Quantity",
    "Unit Price",
    "Sale Date",
  ],
};

const STEPS = [
  "Upload",
  "Validate",
  "Import",
  "Complete",
];

function stepFor(
  hasUpload: boolean,
  hasValidation: boolean,
  hasResult: boolean
) {
  if (hasResult) return 3;
  if (hasValidation) return 2;
  if (hasUpload) return 1;
  return 0;
}

function ValidationSummary({
  total,
  valid,
  invalid,
  duplicates,
}: {
  total: number;
  valid: number;
  invalid: number;
  duplicates: number;
}) {
  const cards = [
    {
      label: "Total Records",
      value: total,
      icon: <DescriptionOutlined />,
      bg: "#111827",
    },
    {
      label: "Valid Records",
      value: valid,
      icon: <CheckCircle />,
      bg: "#0f2f24",
    },
    {
      label: "Invalid Records",
      value: invalid,
      icon: <FactCheck />,
      bg: "#321b1b",
    },
    {
      label: "Duplicate Records",
      value: duplicates,
      icon: <DeleteOutlined />,
      bg: "#302511",
    },
  ];

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          sm: "repeat(2, 1fr)",
          md: "repeat(4, 1fr)",
        },
        gap: 1.5,
        mt: 2,
      }}
    >
      {cards.map((card) => (
        <Box
          key={card.label}
          sx={{
            background: card.bg,
            border: "1px solid #263244",
            borderRadius: 2,
            p: 2,
          }}
        >
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Box>
              <Typography
                variant="caption"
                sx={{
                  color: "#94a3b8",
                  display: "block",
                }}
              >
                {card.label}
              </Typography>

              <Typography
                variant="h5"
                sx={{
                  color: "#f8fafc",
                  fontWeight: 800,
                  mt: 0.5,
                }}
              >
                {card.value}
              </Typography>
            </Box>

            <Box
              sx={{
                color: "#94a3b8",
                display: "flex",
              }}
            >
              {card.icon}
            </Box>
          </Stack>
        </Box>
      ))}
    </Box>
  );
}

export default function DataImport() {
  const { user } = useAuth();

  const isAdmin =
    user?.role === "COMPANY_ADMIN";

  const [type, setType] =
    useState<ImportType>("products");

  const [file, setFile] =
    useState<File | null>(null);

  const [importId, setImportId] =
    useState<number | null>(null);

  const [columns, setColumns] =
    useState<string[]>([]);

  const [preview, setPreview] =
    useState<Record<string, string>[]>([]);

  const [missingColumns, setMissingColumns] =
    useState<string[]>([]);

  const [validation, setValidation] =
    useState<{
      total: number;
      valid: number;
      invalid: number;
      duplicates: number;
      errors: ImportErrorRow[];
    } | null>(null);

  const [result, setResult] =
    useState<{
      status: string;
      total: number;
      success: number;
      failed: number;
      duplicates: number;
      validationFailures: number;
    } | null>(null);

  const [history, setHistory] =
    useState<ImportHistoryItem[]>([]);

  const [busy, setBusy] =
    useState<
      "upload" |
      "validate" |
      "process" |
      "history" |
      null
    >(null);

  const [message, setMessage] =
    useState("");

  const [severity, setSeverity] =
    useState<
      "success" |
      "error" |
      "warning"
    >("success");

  const show = (
    text: string,
    level:
      | "success"
      | "error"
      | "warning" = "success"
  ) => {
    setMessage(text);
    setSeverity(level);
  };

  const loadHistory = async () => {
    if (!isAdmin) return;

    try {
      setBusy("history");

      const data =
        await getImportHistory();

      setHistory(
        Array.isArray(data) ? data : []
      );
    } catch (error: any) {
      show(
        error?.response?.data?.detail ||
          "Unable to load import history.",
        "error"
      );
    } finally {
      setBusy(null);
    }
  };

  useEffect(() => {
    void loadHistory();
  }, [isAdmin]);

  const clear = () => {
    setFile(null);
    setImportId(null);
    setColumns([]);
    setPreview([]);
    setMissingColumns([]);
    setValidation(null);
    setResult(null);
  };

  const onFile = async (
    selected: File | null
  ) => {
    if (!selected) return;

    if (
      !selected.name
        .toLowerCase()
        .endsWith(".csv")
    ) {
      show(
        "Please select a CSV file.",
        "error"
      );
      return;
    }

    if (
      selected.size >
      10 * 1024 * 1024
    ) {
      show(
        "File size must be less than 10 MB.",
        "error"
      );
      return;
    }

    try {
      const local =
        await parseCsvPreview(selected);

      const missing =
        getMissingColumns(
          local.columns,
          REQUIRED[type]
        );

      setFile(selected);
      setColumns(local.columns);
      setPreview(local.rows);
      setImportId(null);
      setValidation(null);
      setResult(null);
      setMissingColumns(missing);

      if (missing.length > 0) {
        show(
          `Missing required columns: ${missing.join(
            ", "
          )}`,
          "error"
        );
        return;
      }

      show(
        "CSV file selected successfully.",
        "success"
      );
    } catch (error: any) {
      show(
        error?.message ||
          "Unable to read the CSV file.",
        "error"
      );
    }
  };

  const doUpload = async () => {
    if (!file) {
      show(
        "Please select a CSV file first.",
        "warning"
      );
      return;
    }

    if (missingColumns.length > 0) {
      show(
        "Please fix the missing required columns before uploading.",
        "error"
      );
      return;
    }

    try {
      setBusy("upload");

      const data =
        await uploadImport(
          file,
          type
        );

      setImportId(
        data.import_id
      );

      setColumns(data.columns);
      setPreview(data.preview);
      setMissingColumns([]);
      setValidation(null);
      setResult(null);

      show(
        `File uploaded successfully. Import ID: ${data.import_id}`,
        "success"
      );

      await loadHistory();
    } catch (error: any) {
      show(
        error?.response?.data?.detail ||
          "File upload failed.",
        "error"
      );
    } finally {
      setBusy(null);
    }
  };

  const doValidate = async () => {
    if (!importId) {
      show(
        "Please upload the file first.",
        "warning"
      );
      return;
    }

    try {
      setBusy("validate");

      const data =
        await validateImport(
          importId
        );

      setColumns(data.columns);
      setPreview(data.preview);

      setValidation({
        total: data.total_records,
        valid: data.valid_records,
        invalid: data.invalid_records,
        duplicates:
          data.duplicate_records,
        errors: data.errors || [],
      });

      setResult(null);

      if (
        data.invalid_records > 0 ||
        data.duplicate_records > 0
      ) {
        show(
          "Validation completed with errors.",
          "warning"
        );
      } else {
        show(
          "Validation completed successfully.",
          "success"
        );
      }

      await loadHistory();
    } catch (error: any) {
      show(
        error?.response?.data?.detail ||
          "Validation failed.",
        "error"
      );

      await loadHistory();
    } finally {
      setBusy(null);
    }
  };

  const doProcess = async () => {
    if (
      !importId ||
      !validation ||
      validation.valid === 0
    ) {
      show(
        "There are no valid records available for import.",
        "warning"
      );
      return;
    }

    try {
      setBusy("process");

      const data =
        await processImport(
          importId
        );

      setResult({
        status: data.status,
        total: data.total_records,
        success:
          data.successful_records,
        failed:
          data.failed_records,
        duplicates:
          data.duplicate_records,
        validationFailures:
          data.validation_failures,
      });

      const hasErrors =
        data.failed_records > 0 ||
        data.duplicate_records > 0 ||
        data.validation_failures > 0;

      if (
        data.success &&
        !hasErrors
      ) {
        show(
          "Import completed successfully.",
          "success"
        );
      } else {
        show(
          data.message ||
            "Import completed with errors.",
          "warning"
        );
      }

      await loadHistory();
    } catch (error: any) {
      show(
        error?.response?.data?.detail ||
          "Import processing failed.",
        "error"
      );

      await loadHistory();
    } finally {
      setBusy(null);
    }
  };

  const downloadErrors = async (
    id: number
  ) => {
    try {
      const blob =
        await downloadImportErrors(id);

      const url =
        window.URL.createObjectURL(
          blob
        );

      const anchor =
        document.createElement("a");

      anchor.href = url;
      anchor.download =
        `import_${id}_errors.csv`;

      document.body.appendChild(
        anchor
      );

      anchor.click();

      anchor.remove();

      window.URL.revokeObjectURL(
        url
      );

      show(
        "Error file downloaded successfully.",
        "success"
      );
    } catch (error: any) {
      show(
        error?.response?.data?.detail ||
          "Unable to download error file.",
        "error"
      );
    }
  };

  const handleDelete = async (
    item: ImportHistoryItem
  ) => {
    const confirmed =
      window.confirm(
        `Are you sure you want to delete Import #${item.id}?`
      );

    if (!confirmed) return;

    try {
      setBusy("history");

      await deleteImport(item.id);

      if (importId === item.id) {
        clear();
      }

      show(
        `Import #${item.id} deleted successfully.`,
        "success"
      );

      await loadHistory();
    } catch (error: any) {
      show(
        error?.response?.data?.detail ||
          "Unable to delete import record.",
        "error"
      );
    } finally {
      setBusy(null);
    }
  };

  const currentStep = useMemo(
    () =>
      stepFor(
        !!importId,
        !!validation,
        !!result
      ),
    [
      importId,
      validation,
      result,
    ]
  );

  if (!isAdmin) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          background: "#090d14",
          p: 4,
        }}
      >
        <Alert severity="error">
          Company Admin access is required
          for Data Import & Integration.
        </Alert>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "#090d14",
        color: "#f8fafc",
        px: {
          xs: 2,
          md: 3,
        },
        py: 3,
      }}
    >
      <Box
        sx={{
          maxWidth: 1500,
          mx: "auto",
        }}
      >
        {/* HEADER */}

        <Stack
          direction={{
            xs: "column",
            sm: "row",
          }}
          justifyContent="space-between"
          alignItems={{
            xs: "flex-start",
            sm: "center",
          }}
          spacing={2}
          mb={3}
        >
          <Stack
            direction="row"
            spacing={1.5}
            alignItems="center"
          >
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background:
                  "linear-gradient(135deg,#16a34a,#22c55e)",
                color: "#fff",
              }}
            >
              <CloudUpload />
            </Box>

            <Box>
              <Typography
                variant="caption"
                sx={{
                  color: "#22c55e",
                  fontWeight: 800,
                  letterSpacing: 1.5,
                }}
              >
                DATA MANAGEMENT
              </Typography>

              <Typography
                variant="h4"
                sx={{
                  fontWeight: 800,
                  color: "#f8fafc",
                  lineHeight: 1.15,
                }}
              >
                Data Import & Integration
              </Typography>

              <Typography
                variant="body2"
                sx={{
                  color: "#94a3b8",
                  mt: 0.5,
                }}
              >
                Upload, validate and import
                business data using CSV files.
              </Typography>
            </Box>
          </Stack>

          <Chip
            label="Company Admin"
            sx={{
              background: "#123322",
              color: "#86efac",
              border:
                "1px solid #166534",
              fontWeight: 700,
            }}
          />
        </Stack>

        {/* STEPPER */}

        <Paper
          sx={{
            background: "#111827",
            border:
              "1px solid #1f2937",
            borderRadius: 3,
            p: 2.5,
            mb: 3,
          }}
        >
          <Stepper
            activeStep={currentStep}
            alternativeLabel
          >
            {STEPS.map((step) => (
              <Step key={step}>
                <StepLabel
                  sx={{
                    "& .MuiStepLabel-label": {
                      color: "#64748b",
                    },
                    "& .MuiStepLabel-label.Mui-active": {
                      color: "#22c55e",
                      fontWeight: 700,
                    },
                    "& .MuiStepLabel-label.Mui-completed": {
                      color: "#86efac",
                    },
                    "& .MuiStepIcon-root.Mui-active": {
                      color: "#22c55e",
                    },
                    "& .MuiStepIcon-root.Mui-completed": {
                      color: "#16a34a",
                    },
                  }}
                >
                  {step}
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Paper>

        {/* START NEW IMPORT */}

        <Paper
          sx={{
            background: "#111827",
            border:
              "1px solid #1f2937",
            borderRadius: 3,
            p: {
              xs: 2,
              md: 3,
            },
            mb: 3,
          }}
        >
          <Typography
            variant="h6"
            sx={{
              color: "#f8fafc",
              fontWeight: 800,
              mb: 2,
            }}
          >
            Start New Import
          </Typography>

          <Divider
            sx={{
              borderColor: "#1f2937",
              mb: 2.5,
            }}
          />

          <Stack
            direction={{
              xs: "column",
              md: "row",
            }}
            spacing={2}
            mb={2.5}
          >
            <FormControl
              size="small"
              sx={{
                minWidth: 220,
              }}
            >
              <InputLabel
                sx={{
                  color: "#94a3b8",
                  "&.Mui-focused": {
                    color: "#22c55e",
                  },
                }}
              >
                Import Type
              </InputLabel>

              <Select
                value={type}
                label="Import Type"
                onChange={(event) => {
                  setType(
                    event.target
                      .value as ImportType
                  );

                  clear();
                }}
                sx={{
                  color: "#f8fafc",

                  ".MuiOutlinedInput-notchedOutline": {
                    borderColor:
                      "#334155",
                  },

                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor:
                      "#22c55e",
                  },

                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor:
                      "#22c55e",
                  },

                  ".MuiSvgIcon-root": {
                    color: "#94a3b8",
                  },
                }}
              >
                <MenuItem value="products">
                  Products
                </MenuItem>

                <MenuItem value="customers">
                  Customers
                </MenuItem>

                <MenuItem value="sales">
                  Sales
                </MenuItem>
              </Select>
            </FormControl>

            <Box
              sx={{
                flex: 1,
                border:
                  "1px solid #263244",
                borderRadius: 2,
                px: 2,
                py: 1.2,
                background: "#0c121c",
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: "#64748b",
                  display: "block",
                  mb: 0.5,
                }}
              >
                Required Columns
              </Typography>

              <Typography
                variant="body2"
                sx={{
                  color: "#cbd5e1",
                  fontWeight: 600,
                }}
              >
                {REQUIRED[type].join(
                  " • "
                )}
              </Typography>
            </Box>
          </Stack>

          {/* UPLOAD AREA */}

          <Box
            sx={{
              minHeight: 255,
              border: "2px dashed",
              borderColor: file
                ? "#16a34a"
                : "#334155",
              borderRadius: 3,
              background:
                "rgba(15,23,42,.55)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              px: 2,
              py: 3,
            }}
          >
            <Box
              sx={{
                width: 58,
                height: 58,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: file
                  ? "rgba(34,197,94,.15)"
                  : "rgba(71,85,105,.15)",
                color: file
                  ? "#4ade80"
                  : "#94a3b8",
                mb: 1.5,
              }}
            >
              <CloudUpload fontSize="large" />
            </Box>

            {file ? (
              <>
                <Typography
                  sx={{
                    color: "#f8fafc",
                    fontWeight: 700,
                  }}
                >
                  {file.name}
                </Typography>

                <Typography
                  variant="caption"
                  sx={{
                    color: "#94a3b8",
                    mt: 0.5,
                  }}
                >
                  {(
                    file.size /
                    1024 /
                    1024
                  ).toFixed(2)}{" "}
                  MB
                </Typography>
              </>
            ) : (
              <>
                <Typography
                  sx={{
                    color: "#e2e8f0",
                    fontWeight: 700,
                  }}
                >
                  Select a CSV file
                </Typography>

                <Typography
                  variant="body2"
                  sx={{
                    color: "#64748b",
                    mt: 0.5,
                  }}
                >
                  Maximum file size: 10 MB
                </Typography>
              </>
            )}

            <Stack
              direction={{
                xs: "column",
                sm: "row",
              }}
              spacing={1.5}
              mt={2}
            >
              <Button
                component="label"
                variant="outlined"
                startIcon={
                  <CloudUpload />
                }
                sx={{
                  color: "#86efac",
                  borderColor:
                    "#16a34a",
                  "&:hover": {
                    borderColor:
                      "#22c55e",
                    background:
                      "rgba(34,197,94,.08)",
                  },
                }}
              >
                Select CSV

                <input
                  hidden
                  type="file"
                  accept=".csv,text/csv"
                  onChange={(event) => {
                    const selected =
                      event.target
                        .files?.[0] ||
                      null;

                    void onFile(
                      selected
                    );

                    event.target.value =
                      "";
                  }}
                />
              </Button>

              {file && (
                <Button
                  variant="outlined"
                  startIcon={
                    <DeleteOutlined />
                  }
                  onClick={clear}
                  sx={{
                    color: "#fca5a5",
                    borderColor:
                      "#7f1d1d",
                    "&:hover": {
                      borderColor:
                        "#ef4444",
                      background:
                        "rgba(239,68,68,.08)",
                    },
                  }}
                >
                  Remove
                </Button>
              )}

              {file && !importId && (
                <Button
                  variant="contained"
                  startIcon={
                    busy === "upload" ? (
                      <CircularProgress
                        size={18}
                        sx={{
                          color: "#fff",
                        }}
                      />
                    ) : (
                      <CloudUpload />
                    )
                  }
                  disabled={
                    busy !== null ||
                    missingColumns.length >
                      0
                  }
                  onClick={() =>
                    void doUpload()
                  }
                  sx={{
                    background:
                      "#16a34a",
                    color: "#fff",
                    fontWeight: 800,

                    "&:hover": {
                      background:
                        "#15803d",
                    },

                    "&.Mui-disabled": {
                      background:
                        "#1f2937",
                      color:
                        "#64748b",
                    },
                  }}
                >
                  Upload File
                </Button>
              )}
            </Stack>

            {missingColumns.length >
              0 && (
              <Alert
                severity="error"
                sx={{
                  mt: 2,
                  width: "100%",
                  maxWidth: 900,
                  textAlign: "left",
                  borderRadius: 2,
                  background:
                    "rgba(239,68,68,.08)",
                  color: "#fecaca",
                  border:
                    "1px solid #7f1d1d",

                  "& .MuiAlert-icon": {
                    color: "#f87171",
                  },
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 700,
                  }}
                >
                  Missing required columns
                </Typography>

                <Typography
                  variant="body2"
                  sx={{
                    mt: 0.4,
                    color: "#fca5a5",
                  }}
                >
                  {missingColumns.join(
                    " • "
                  )}
                </Typography>
              </Alert>
            )}
          </Box>
        </Paper>

        {/* CSV PREVIEW */}

        {columns.length > 0 && (
          <Paper
            sx={{
              background: "#111827",
              border:
                "1px solid #1f2937",
              borderRadius: 3,
              p: {
                xs: 2,
                md: 3,
              },
              mb: 3,
            }}
          >
            <Stack
              direction={{
                xs: "column",
                sm: "row",
              }}
              justifyContent="space-between"
              alignItems={{
                xs: "flex-start",
                sm: "center",
              }}
              spacing={1}
              mb={2}
            >
              <Typography
                variant="h6"
                sx={{
                  color: "#f8fafc",
                  fontWeight: 800,
                }}
              >
                CSV Preview
              </Typography>

              {importId && (
                <Chip
                  label={`Import ID: ${importId}`}
                  size="small"
                  sx={{
                    color: "#86efac",
                    background:
                      "#123322",
                    border:
                      "1px solid #166534",
                    fontWeight: 700,
                  }}
                />
              )}
            </Stack>

            <TableContainer
              sx={{
                border:
                  "1px solid #263244",
                borderRadius: 2,
                maxHeight: 420,
              }}
            >
              <Table
                stickyHeader
                size="small"
              >
                <TableHead>
                  <TableRow>
                    <TableCell
                      sx={{
                        background:
                          "#0c121c",
                        color: "#94a3b8",
                        fontWeight: 800,
                        borderColor:
                          "#263244",
                      }}
                    >
                      #
                    </TableCell>

                    {columns.map(
                      (column) => (
                        <TableCell
                          key={column}
                          sx={{
                            background:
                              "#0c121c",
                            color:
                              "#94a3b8",
                            fontWeight:
                              800,
                            borderColor:
                              "#263244",
                            whiteSpace:
                              "nowrap",
                            minWidth: 130,
                          }}
                        >
                          {column}
                        </TableCell>
                      )
                    )}
                  </TableRow>
                </TableHead>

                <TableBody>
                  {preview.length ===
                  0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={
                          columns.length +
                          1
                        }
                        sx={{
                          color:
                            "#64748b",
                          borderColor:
                            "#263244",
                          textAlign:
                            "center",
                          py: 3,
                        }}
                      >
                        No preview
                        records
                        available.
                      </TableCell>
                    </TableRow>
                  ) : (
                    preview.map(
                      (
                        row,
                        index
                      ) => (
                        <TableRow
                          key={index}
                          hover
                          sx={{
                            "&:hover": {
                              background:
                                "#151e2c",
                            },
                          }}
                        >
                          <TableCell
                            sx={{
                              color:
                                "#64748b",
                              borderColor:
                                "#263244",
                            }}
                          >
                            {index + 1}
                          </TableCell>

                          {columns.map(
                            (
                              column
                            ) => (
                              <TableCell
                                key={
                                  column
                                }
                                sx={{
                                  color:
                                    "#cbd5e1",
                                  borderColor:
                                    "#263244",
                                  whiteSpace:
                                    "nowrap",
                                }}
                              >
                                {row[
                                  column
                                ] ?? ""}
                              </TableCell>
                            )
                          )}
                        </TableRow>
                      )
                    )
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}

        {/* VALIDATION & IMPORT */}

        {importId && (
          <Paper
            sx={{
              background: "#111827",
              border:
                "1px solid #1f2937",
              borderRadius: 3,
              p: {
                xs: 2,
                md: 3,
              },
              mb: 3,
            }}
          >
            <Stack
              direction={{
                xs: "column",
                sm: "row",
              }}
              justifyContent="space-between"
              alignItems={{
                xs: "flex-start",
                sm: "center",
              }}
              spacing={2}
              mb={2}
            >
              <Box>
                <Typography
                  variant="h6"
                  sx={{
                    color: "#f8fafc",
                    fontWeight: 800,
                  }}
                >
                  Validation & Import
                </Typography>

                <Typography
                  variant="body2"
                  sx={{
                    color: "#64748b",
                    mt: 0.4,
                  }}
                >
                  Import ID: {importId}
                </Typography>
              </Box>

              <Stack
                direction={{
                  xs: "column",
                  sm: "row",
                }}
                spacing={1}
              >
                <Button
                  variant="outlined"
                  startIcon={
                    busy === "validate" ? (
                      <CircularProgress
                        size={18}
                        sx={{
                          color:
                            "#86efac",
                        }}
                      />
                    ) : (
                      <FactCheck />
                    )
                  }
                  disabled={
                    busy !== null
                  }
                  onClick={() =>
                    void doValidate()
                  }
                  sx={{
                    color: "#86efac",
                    borderColor:
                      "#16a34a",
                    fontWeight: 700,

                    "&:hover": {
                      borderColor:
                        "#22c55e",
                      background:
                        "rgba(34,197,94,.08)",
                    },

                    "&.Mui-disabled": {
                      color:
                        "#64748b",
                      borderColor:
                        "#334155",
                    },
                  }}
                >
                  Validate File
                </Button>

                <Button
                  variant="contained"
                  startIcon={
                    busy === "process" ? (
                      <CircularProgress
                        size={18}
                        sx={{
                          color: "#fff",
                        }}
                      />
                    ) : (
                      <PlayArrow />
                    )
                  }
                  disabled={
                    busy !== null ||
                    !validation ||
                    validation.valid ===
                      0
                  }
                  onClick={() =>
                    void doProcess()
                  }
                  sx={{
                    background:
                      "#2563eb",
                    color: "#fff",
                    fontWeight: 800,

                    "&:hover": {
                      background:
                        "#1d4ed8",
                    },

                    "&.Mui-disabled": {
                      background:
                        "#1f2937",
                      color:
                        "#64748b",
                    },
                  }}
                >
                  Import Data
                </Button>
              </Stack>
            </Stack>

            {validation && (
              <>
                <ValidationSummary
                  total={
                    validation.total
                  }
                  valid={
                    validation.valid
                  }
                  invalid={
                    validation.invalid
                  }
                  duplicates={
                    validation.duplicates
                  }
                />

                {validation.errors
                  .length > 0 && (
                  <Box sx={{ mt: 3 }}>
                    <Typography
                      variant="subtitle1"
                      sx={{
                        color:
                          "#f8fafc",
                        fontWeight:
                          800,
                        mb: 1.5,
                      }}
                    >
                      Validation Errors
                    </Typography>

                    <TableContainer
                      sx={{
                        border:
                          "1px solid #263244",
                        borderRadius: 2,
                        maxHeight: 420,
                      }}
                    >
                      <Table
                        stickyHeader
                        size="small"
                      >
                        <TableHead>
                          <TableRow>
                            {[
                              "Row",
                              "Error Type",
                              "Field",
                              "Message",
                            ].map(
                              (
                                heading
                              ) => (
                                <TableCell
                                  key={
                                    heading
                                  }
                                  sx={{
                                    background:
                                      "#0c121c",
                                    color:
                                      "#94a3b8",
                                    fontWeight:
                                      800,
                                    borderColor:
                                      "#263244",
                                  }}
                                >
                                  {
                                    heading
                                  }
                                </TableCell>
                              )
                            )}
                          </TableRow>
                        </TableHead>

                        <TableBody>
                          {validation.errors.map(
                            (
                              error,
                              index
                            ) => (
                              <TableRow
                                key={`${error.row_number}-${index}`}
                              >
                                <TableCell
                                  sx={{
                                    color:
                                      "#cbd5e1",
                                    borderColor:
                                      "#263244",
                                  }}
                                >
                                  {
                                    error.row_number
                                  }
                                </TableCell>

                                <TableCell
                                  sx={{
                                    borderColor:
                                      "#263244",
                                  }}
                                >
                                  <Chip
                                    label={
                                      error.error_type
                                    }
                                    size="small"
                                    sx={{
                                      background:
                                        "rgba(239,68,68,.12)",
                                      color:
                                        "#fca5a5",
                                      border:
                                        "1px solid #7f1d1d",
                                      fontWeight:
                                        700,
                                    }}
                                  />
                                </TableCell>

                                <TableCell
                                  sx={{
                                    color:
                                      "#cbd5e1",
                                    borderColor:
                                      "#263244",
                                  }}
                                >
                                  {error.field ||
                                    "-"}
                                </TableCell>

                                <TableCell
                                  sx={{
                                    color:
                                      "#cbd5e1",
                                    borderColor:
                                      "#263244",
                                  }}
                                >
                                  {
                                    error.message
                                  }
                                </TableCell>
                              </TableRow>
                            )
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                )}
              </>
            )}
          </Paper>
        )}

        {/* RESULT */}

        {result && (
          <Paper
            sx={{
              background: "#111827",
              border: `1px solid ${
                result.failed === 0 &&
                result.duplicates ===
                  0 &&
                result.validationFailures ===
                  0
                  ? "#166534"
                  : "#854d0e"
              }`,
              borderRadius: 3,
              p: {
                xs: 2,
                md: 3,
              },
              mb: 3,
            }}
          >
            <Stack
              direction={{
                xs: "column",
                sm: "row",
              }}
              justifyContent="space-between"
              alignItems={{
                xs: "flex-start",
                sm: "center",
              }}
              spacing={2}
            >
              <Box>
                <Typography
                  variant="h6"
                  sx={{
                    color: "#f8fafc",
                    fontWeight: 800,
                  }}
                >
                  Import Result
                </Typography>

                <Chip
                  label={
                    result.failed ===
                      0 &&
                    result.duplicates ===
                      0 &&
                    result.validationFailures ===
                      0
                      ? "Completed Successfully"
                      : result.status
                  }
                  size="small"
                  sx={{
                    mt: 1,
                    background:
                      result.failed ===
                        0 &&
                      result.duplicates ===
                        0 &&
                      result.validationFailures ===
                        0
                        ? "#123322"
                        : "#3a2b10",
                    color:
                      result.failed ===
                        0 &&
                      result.duplicates ===
                        0 &&
                      result.validationFailures ===
                        0
                        ? "#86efac"
                        : "#fde68a",
                    border:
                      result.failed ===
                        0 &&
                      result.duplicates ===
                        0 &&
                      result.validationFailures ===
                        0
                        ? "1px solid #166534"
                        : "1px solid #854d0e",
                    fontWeight: 800,
                  }}
                />
              </Box>

              {(result.failed > 0 ||
                result.validationFailures >
                  0 ||
                result.duplicates >
                  0) && (
                <Button
                  variant="outlined"
                  startIcon={
                    <Download />
                  }
                  onClick={() =>
                    void downloadErrors(
                      importId!
                    )
                  }
                  sx={{
                    color: "#fde68a",
                    borderColor:
                      "#a16207",
                    background:
                      "rgba(161,98,7,.08)",
                    fontWeight: 800,

                    "&:hover": {
                      color:
                        "#fff7ed",
                      borderColor:
                        "#eab308",
                      background:
                        "rgba(234,179,8,.14)",
                    },
                  }}
                >
                  Download Errors
                </Button>
              )}
            </Stack>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(3, 1fr)",
                  md: "repeat(5, 1fr)",
                },
                gap: 1.5,
                mt: 2.5,
              }}
            >
              {[
                [
                  "Total",
                  result.total,
                ],
                [
                  "Successful",
                  result.success,
                ],
                [
                  "Failed",
                  result.failed,
                ],
                [
                  "Duplicates",
                  result.duplicates,
                ],
                [
                  "Validation Failures",
                  result.validationFailures,
                ],
              ].map(
                ([label, value]) => (
                  <Box
                    key={String(label)}
                    sx={{
                      background:
                        "#0c121c",
                      border:
                        "1px solid #263244",
                      borderRadius: 2,
                      p: 2,
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        color:
                          "#64748b",
                      }}
                    >
                      {label}
                    </Typography>

                    <Typography
                      variant="h6"
                      sx={{
                        color:
                          "#f8fafc",
                        fontWeight:
                          800,
                        mt: 0.5,
                      }}
                    >
                      {value}
                    </Typography>
                  </Box>
                )
              )}
            </Box>
          </Paper>
        )}

        {/* HISTORY */}

        <Paper
          sx={{
            background: "#111827",
            border:
              "1px solid #1f2937",
            borderRadius: 3,
            p: {
              xs: 2,
              md: 3,
            },
          }}
        >
          <Stack
            direction={{
              xs: "column",
              sm: "row",
            }}
            justifyContent="space-between"
            alignItems={{
              xs: "flex-start",
              sm: "center",
            }}
            spacing={2}
            mb={2}
          >
            <Box>
              <Typography
                variant="h6"
                sx={{
                  color: "#f8fafc",
                  fontWeight: 800,
                }}
              >
                Import History
              </Typography>

              <Typography
                variant="body2"
                sx={{
                  color: "#64748b",
                  mt: 0.4,
                }}
              >
                View previous CSV imports
                and manage import records.
              </Typography>
            </Box>

            <Button
              variant="outlined"
              startIcon={
                busy === "history" ? (
                  <CircularProgress
                    size={18}
                    sx={{
                      color: "#cbd5e1",
                    }}
                  />
                ) : (
                  <Refresh />
                )
              }
              disabled={
                busy === "history"
              }
              onClick={() =>
                void loadHistory()
              }
              sx={{
                color: "#cbd5e1",
                borderColor:
                  "#475569",
                background:
                  "rgba(71,85,105,.08)",
                fontWeight: 700,

                "&:hover": {
                  color: "#fff",
                  borderColor:
                    "#94a3b8",
                  background:
                    "rgba(148,163,184,.12)",
                },

                "&.Mui-disabled": {
                  color: "#64748b",
                  borderColor:
                    "#334155",
                },
              }}
            >
              Refresh
            </Button>
          </Stack>

          <TableContainer
            sx={{
              border:
                "1px solid #263244",
              borderRadius: 2,
              overflowX: "auto",
            }}
          >
            <Table
              size="small"
              sx={{
                minWidth: 1250,
              }}
            >
              <TableHead>
                <TableRow>
                  {[
                    "ID",
                    "Type",
                    "Filename",
                    "Uploaded By",
                    "Total",
                    "Success",
                    "Failed",
                    "Duplicates",
                    "Status",
                    "Date",
                    "Actions",
                  ].map((heading) => (
                    <TableCell
                      key={heading}
                      sx={{
                        background:
                          "#0c121c",
                        color:
                          "#94a3b8",
                        fontWeight: 800,
                        borderColor:
                          "#263244",
                        whiteSpace:
                          "nowrap",
                        px: 1.5,
                        py: 1.5,
                      }}
                    >
                      {heading}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>

              <TableBody>
                {history.length ===
                0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={11}
                      sx={{
                        textAlign:
                          "center",
                        color:
                          "#64748b",
                        borderColor:
                          "#263244",
                        py: 4,
                      }}
                    >
                      No import history
                      available.
                    </TableCell>
                  </TableRow>
                ) : (
                  history.map(
                    (item) => {
                      const isPending =
                        item.status
                          ?.toLowerCase() ===
                        "pending";

                      const statusLower =
                        item.status
                          ?.toLowerCase() ||
                        "";

                      const hasErrors =
                        item.failed_records >
                          0 ||
                        item.duplicate_records >
                          0 ||
                        statusLower.includes(
                          "error"
                        ) ||
                        statusLower.includes(
                          "failed"
                        );

                      return (
                        <TableRow
                          key={item.id}
                          hover
                          sx={{
                            "&:hover": {
                              background:
                                "#151e2c",
                            },
                          }}
                        >
                          <TableCell
                            sx={{
                              color:
                                "#cbd5e1",
                              borderColor:
                                "#263244",
                              fontWeight:
                                700,
                            }}
                          >
                            #{item.id}
                          </TableCell>

                          <TableCell
                            sx={{
                              color:
                                "#cbd5e1",
                              borderColor:
                                "#263244",
                            }}
                          >
                            {item.import_type}
                          </TableCell>

                          <TableCell
                            sx={{
                              color:
                                "#f8fafc",
                              borderColor:
                                "#263244",
                              fontWeight:
                                600,
                            }}
                          >
                            {item.filename}
                          </TableCell>

                          <TableCell
                            sx={{
                              color:
                                "#94a3b8",
                              borderColor:
                                "#263244",
                            }}
                          >
                            {
                              item.uploaded_by
                            }
                          </TableCell>

                          <TableCell
                            sx={{
                              color:
                                "#cbd5e1",
                              borderColor:
                                "#263244",
                            }}
                          >
                            {
                              item.total_records
                            }
                          </TableCell>

                          <TableCell
                            sx={{
                              color:
                                "#86efac",
                              borderColor:
                                "#263244",
                              fontWeight:
                                700,
                            }}
                          >
                            {isPending
                              ? 0
                              : item.successful_records}
                          </TableCell>

                          <TableCell
                            sx={{
                              color:
                                item.failed_records >
                                0
                                  ? "#fca5a5"
                                  : "#cbd5e1",
                              borderColor:
                                "#263244",
                              fontWeight:
                                item.failed_records >
                                0
                                  ? 700
                                  : 400,
                            }}
                          >
                            {isPending
                              ? 0
                              : item.failed_records}
                          </TableCell>

                          <TableCell
                            sx={{
                              color:
                                item.duplicate_records >
                                0
                                  ? "#fde68a"
                                  : "#cbd5e1",
                              borderColor:
                                "#263244",
                              fontWeight:
                                item.duplicate_records >
                                0
                                  ? 700
                                  : 400,
                            }}
                          >
                            {isPending
                              ? 0
                              : item.duplicate_records}
                          </TableCell>

                          <TableCell
                            sx={{
                              borderColor:
                                "#263244",
                            }}
                          >
                            <Chip
                              label={
                                item.status
                              }
                              size="small"
                              sx={{
                                background:
                                  isPending
                                    ? "#1e293b"
                                    : hasErrors
                                    ? "#3a2b10"
                                    : "#123322",

                                color:
                                  isPending
                                    ? "#cbd5e1"
                                    : hasErrors
                                    ? "#fde68a"
                                    : "#86efac",

                                border:
                                  isPending
                                    ? "1px solid #475569"
                                    : hasErrors
                                    ? "1px solid #854d0e"
                                    : "1px solid #166534",

                                fontWeight:
                                  700,
                              }}
                            />
                          </TableCell>

                          <TableCell
                            sx={{
                              color:
                                "#94a3b8",
                              borderColor:
                                "#263244",
                              whiteSpace:
                                "nowrap",
                            }}
                          >
                            {new Date(
                              item.created_at
                            ).toLocaleString()}
                          </TableCell>

                          {/* ACTIONS */}

                          <TableCell
                            sx={{
                              borderColor:
                                "#263244",
                              minWidth: 205,
                              whiteSpace:
                                "nowrap",
                            }}
                          >
                            <Stack
                              direction="row"
                              spacing={1}
                              alignItems="center"
                            >
                              {hasErrors && (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  startIcon={
                                    <Download fontSize="small" />
                                  }
                                  onClick={() =>
                                    void downloadErrors(
                                      item.id
                                    )
                                  }
                                  sx={{
                                    minWidth: 82,
                                    color:
                                      "#fde68a",
                                    borderColor:
                                      "#a16207",
                                    background:
                                      "rgba(161,98,7,.10)",
                                    fontWeight:
                                      800,
                                    textTransform:
                                      "none",

                                    "&:hover":
                                      {
                                        color:
                                          "#fff7ed",
                                        borderColor:
                                          "#eab308",
                                        background:
                                          "rgba(234,179,8,.18)",
                                      },
                                  }}
                                >
                                  Errors
                                </Button>
                              )}

                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={
                                  <DeleteOutlined fontSize="small" />
                                }
                                disabled={
                                  busy !== null
                                }
                                onClick={() =>
                                  void handleDelete(
                                    item
                                  )
                                }
                                sx={{
                                  minWidth:
                                    88,
                                  color:
                                    "#fca5a5",
                                  borderColor:
                                    "#dc2626",
                                  background:
                                    "rgba(220,38,38,.08)",
                                  fontWeight:
                                    800,
                                  textTransform:
                                    "none",

                                  "&:hover":
                                    {
                                      color:
                                        "#fff",
                                      borderColor:
                                        "#ef4444",
                                      background:
                                        "rgba(239,68,68,.20)",
                                    },

                                  "&.Mui-disabled":
                                    {
                                      color:
                                        "#64748b",
                                      borderColor:
                                        "#334155",
                                    },
                                }}
                              >
                                Delete
                              </Button>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      );
                    }
                  )
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>

      {/* SNACKBAR */}

      <Snackbar
        open={!!message}
        autoHideDuration={4000}
        onClose={() =>
          setMessage("")
        }
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
      >
        <Alert
          onClose={() =>
            setMessage("")
          }
          severity={severity}
          variant="filled"
          sx={{
            width: "100%",
          }}
        >
          {message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

