
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
  downloadImportTemplate,
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


/* =====================================================
   IMPORT CONFIGURATION
===================================================== */

const REQUIRED: Record<ImportType, string[]> = {
  inventory: ["SKU", "Current Stock"],

  products: [
    "Product Name",
    "SKU",
    "Category",
    "Unit Price",
    "Stock Quantity",
  ],

  customers: [
    "Name",
    "Email",
    "Phone",
  ],

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


/* =====================================================
   SAFE ERROR HANDLING
===================================================== */

const getApiErrorMessage = (
  error: any,
  fallback: string
): string => {
  const detail = error?.response?.data?.detail;

  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    return detail
      .map((item: any) => {
        if (typeof item === "string") {
          return item;
        }

        if (item && typeof item === "object") {
          const location = Array.isArray(item.loc)
            ? item.loc
                .filter(Boolean)
                .join(" → ")
            : "Validation";

          return `${location}: ${
            item.msg || item.message || "Invalid value"
          }`;
        }

        return String(item);
      })
      .join("\n");
  }

  if (detail && typeof detail === "object") {
    return (
      detail.message ||
      detail.msg ||
      fallback
    );
  }

  if (typeof error?.message === "string") {
    return error.message;
  }

  return fallback;
};


/* =====================================================
   SAFE DISPLAY VALUE
===================================================== */

const safeText = (value: unknown): string => {
  if (value === null || value === undefined) {
    return "-";
  }

  if (typeof value === "string") {
    return value;
  }

  if (
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => safeText(item))
      .join(", ");
  }

  if (typeof value === "object") {
    const item = value as Record<string, unknown>;

    return String(
      item.message ||
      item.msg ||
      item.detail ||
      JSON.stringify(value)
    );
  }

  return String(value);
};


/* =====================================================
   STEPPER
===================================================== */

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


/* =====================================================
   VALIDATION SUMMARY
===================================================== */

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


/* =====================================================
   MAIN COMPONENT
===================================================== */

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


  /* =====================================================
     SNACKBAR
  ===================================================== */

  const show = (
    text: unknown,
    level:
      | "success"
      | "error"
      | "warning" = "success"
  ) => {
    setMessage(safeText(text));
    setSeverity(level);
  };


  /* =====================================================
     LOAD IMPORT HISTORY
  ===================================================== */

  const loadHistory = async () => {
    if (!isAdmin) return;

    try {
      setBusy("history");

      const data = await getImportHistory();

      setHistory(
        Array.isArray(data) ? data : []
      );

    } catch (error: any) {
      show(
        getApiErrorMessage(
          error,
          "Unable to load import history."
        ),
        "error"
      );

    } finally {
      setBusy(null);
    }
  };


  useEffect(() => {
    void loadHistory();
  }, [isAdmin]);


  /* =====================================================
     CLEAR FORM
  ===================================================== */

  const clear = () => {
    setFile(null);
    setImportId(null);
    setColumns([]);
    setPreview([]);
    setMissingColumns([]);
    setValidation(null);
    setResult(null);
  };


  /* =====================================================
     FILE SELECTION
  ===================================================== */

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

    if (selected.size === 0) {
      show(
        "CSV file is empty.",
        "error"
      );
      return;
    }

    if (selected.size > 10 * 1024 * 1024) {
      show(
        "File size must be less than 10 MB.",
        "error"
      );
      return;
    }

    try {
      const local = await parseCsvPreview(selected);

      if (!local.columns || local.columns.length === 0) {
        show(
          "CSV file does not contain valid column headers.",
          "error"
        );
        return;
      }

      const missing = getMissingColumns(
        local.columns,
        REQUIRED[type]
      );

      setFile(selected);
      setColumns(local.columns);
      setPreview(local.rows || []);
      setImportId(null);
      setValidation(null);
      setResult(null);
      setMissingColumns(missing);

      if (missing.length > 0) {
        show(
          `Missing required columns: ${missing.join(", ")}`,
          "error"
        );
        return;
      }

      if (!local.rows || local.rows.length === 0) {
        show(
          "CSV file does not contain any data rows.",
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
        getApiErrorMessage(
          error,
          "Unable to read the CSV file."
        ),
        "error"
      );
    }
  };


  /* =====================================================
     UPLOAD CSV
  ===================================================== */

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

      const data = await uploadImport(
        file,
        type
      );

      if (!data?.success || !data?.import_id) {
        throw new Error(
          data?.message || "Upload failed."
        );
      }

      setImportId(data.import_id);

      setColumns(data.columns || []);
      setPreview(data.preview || []);

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
        getApiErrorMessage(
          error,
          "File upload failed."
        ),
        "error"
      );

    } finally {
      setBusy(null);
    }
  };


  /* =====================================================
     VALIDATE IMPORT
  ===================================================== */

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

      const data = await validateImport(
        importId
      );

      setColumns(data.columns || []);
      setPreview(data.preview || []);

      const errors = Array.isArray(data.errors)
        ? data.errors
        : [];

      setValidation({
        total: Number(data.total_records || 0),
        valid: Number(data.valid_records || 0),
        invalid: Number(data.invalid_records || 0),
        duplicates: Number(data.duplicate_records || 0),
        errors,
      });

      setResult(null);

      if (
        Number(data.invalid_records || 0) > 0 ||
        Number(data.duplicate_records || 0) > 0
      ) {
        show(
          "Validation completed with errors. Review the validation report.",
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
        getApiErrorMessage(
          error,
          "Validation failed."
        ),
        "error"
      );

      await loadHistory();

    } finally {
      setBusy(null);
    }
  };


  /* =====================================================
     PROCESS IMPORT
  ===================================================== */

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

      const data = await processImport(
        importId
      );

      setResult({
        status: safeText(data.status),
        total: Number(data.total_records || 0),
        success: Number(data.successful_records || 0),
        failed: Number(data.failed_records || 0),
        duplicates: Number(data.duplicate_records || 0),
        validationFailures: Number(
          data.validation_failures || 0
        ),
      });

      const hasErrors =
        Number(data.failed_records || 0) > 0 ||
        Number(data.duplicate_records || 0) > 0 ||
        Number(data.validation_failures || 0) > 0;

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
        getApiErrorMessage(
          error,
          "Import processing failed."
        ),
        "error"
      );

      await loadHistory();

    } finally {
      setBusy(null);
    }
  };


  /* =====================================================
     DOWNLOAD ERROR CSV
  ===================================================== */

  const downloadErrors = async (
    id: number
  ) => {
    try {
      const blob = await downloadImportErrors(id);

      if (!(blob instanceof Blob)) {
        throw new Error(
          "Invalid error report response."
        );
      }

      const url = window.URL.createObjectURL(blob);

      const anchor = document.createElement("a");

      anchor.href = url;
      anchor.download = `import_${id}_errors.csv`;

      document.body.appendChild(anchor);

      anchor.click();

      anchor.remove();

      window.URL.revokeObjectURL(url);

      show(
        "Error file downloaded successfully.",
        "success"
      );

    } catch (error: any) {
      show(
        getApiErrorMessage(
          error,
          "Unable to download error file."
        ),
        "error"
      );
    }
  };


  /* =====================================================
     DOWNLOAD TEMPLATE
  ===================================================== */

  const downloadTemplate = async () => {
    try {
      const blob = await downloadImportTemplate(type);

      if (!(blob instanceof Blob)) {
        throw new Error(
          "Invalid template response."
        );
      }

      const url = window.URL.createObjectURL(blob);

      const anchor = document.createElement("a");

      anchor.href = url;
      anchor.download = `${type}_import_template.csv`;

      document.body.appendChild(anchor);

      anchor.click();

      anchor.remove();

      window.URL.revokeObjectURL(url);

      show(
        `${type} template downloaded successfully.`,
        "success"
      );

    } catch (error: any) {
      show(
        getApiErrorMessage(
          error,
          "Unable to download template."
        ),
        "error"
      );
    }
  };


  /* =====================================================
     DELETE IMPORT
  ===================================================== */

  const handleDelete = async (
    item: ImportHistoryItem
  ) => {
    const confirmed = window.confirm(
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
        getApiErrorMessage(
          error,
          "Unable to delete import record."
        ),
        "error"
      );

    } finally {
      setBusy(null);
    }
  };


  /* =====================================================
     CURRENT STEP
  ===================================================== */

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


  /* =====================================================
     AUTHORIZATION
  ===================================================== */

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


  /* =====================================================
     MAIN UI
  ===================================================== */

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
              border: "1px solid #166534",
              fontWeight: 700,
            }}
          />
        </Stack>


        {/* STEPPER */}

        <Paper
          sx={{
            background: "#111827",
            border: "1px solid #1f2937",
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
            border: "1px solid #1f2937",
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

            {/* IMPORT TYPE */}

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
                    event.target.value as ImportType
                  );

                  clear();
                }}
                sx={{
                  color: "#f8fafc",

                  ".MuiOutlinedInput-notchedOutline": {
                    borderColor: "#334155",
                  },

                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#22c55e",
                  },

                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#22c55e",
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

                <MenuItem value="inventory">
                  Inventory
                </MenuItem>

                <MenuItem value="sales">
                  Sales
                </MenuItem>
              </Select>
            </FormControl>


            {/* TEMPLATE */}

            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={() => void downloadTemplate()}
              disabled={busy !== null}
              sx={{
                color: "#86efac",
                borderColor: "#166534",
                whiteSpace: "nowrap",
              }}
            >
              Download Template
            </Button>


            {/* REQUIRED COLUMNS */}

            <Box
              sx={{
                flex: 1,
                border: "1px solid #263244",
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
                {REQUIRED[type].join(" • ")}
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
              background: "rgba(15,23,42,.55)",
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
                  {(file.size / 1024 / 1024).toFixed(2)} MB
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
                startIcon={<CloudUpload />}
                sx={{
                  color: "#86efac",
                  borderColor: "#16a34a",
                  "&:hover": {
                    borderColor: "#22c55e",
                    background: "rgba(34,197,94,.08)",
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
                      event.target.files?.[0] || null;

                    void onFile(selected);

                    event.target.value = "";
                  }}
                />
              </Button>

              {file && (
                <Button
                  variant="outlined"
                  startIcon={<DeleteOutlined />}
                  onClick={clear}
                  sx={{
                    color: "#fca5a5",
                    borderColor: "#7f1d1d",
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
                        sx={{ color: "#fff" }}
                      />
                    ) : (
                      <CloudUpload />
                    )
                  }
                  disabled={
                    busy !== null ||
                    missingColumns.length > 0
                  }
                  onClick={() => void doUpload()}
                  sx={{
                    background: "#16a34a",
                    color: "#fff",
                    fontWeight: 800,
                    "&:hover": {
                      background: "#15803d",
                    },
                  }}
                >
                  Upload File
                </Button>
              )}
            </Stack>

            {missingColumns.length > 0 && (
              <Alert
                severity="error"
                sx={{
                  mt: 2,
                  width: "100%",
                  maxWidth: 900,
                  textAlign: "left",
                }}
              >
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 700 }}
                >
                  Missing required columns
                </Typography>

                <Typography
                  variant="body2"
                  sx={{ mt: 0.4 }}
                >
                  {missingColumns.join(" • ")}
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
              border: "1px solid #1f2937",
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
                    background: "#123322",
                    border: "1px solid #166534",
                  }}
                />
              )}
            </Stack>

            <TableContainer
              sx={{
                border: "1px solid #263244",
                borderRadius: 2,
                maxHeight: 420,
              }}
            >
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell
                      sx={{
                        background: "#0c121c",
                        color: "#94a3b8",
                        fontWeight: 800,
                        borderColor: "#263244",
                      }}
                    >
                      #
                    </TableCell>

                    {columns.map((column) => (
                      <TableCell
                        key={column}
                        sx={{
                          background: "#0c121c",
                          color: "#94a3b8",
                          fontWeight: 800,
                          borderColor: "#263244",
                          whiteSpace: "nowrap",
                          minWidth: 130,
                        }}
                      >
                        {column}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>

                <TableBody>
                  {preview.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length + 1}
                        sx={{
                          color: "#64748b",
                          textAlign: "center",
                          py: 3,
                          borderColor: "#263244",
                        }}
                      >
                        No preview records available.
                      </TableCell>
                    </TableRow>
                  ) : (
                    preview.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell
                          sx={{
                            color: "#64748b",
                            borderColor: "#263244",
                          }}
                        >
                          {index + 1}
                        </TableCell>

                        {columns.map((column) => (
                          <TableCell
                            key={column}
                            sx={{
                              color: "#cbd5e1",
                              borderColor: "#263244",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {safeText(row[column])}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}


        {/* VALIDATION AND IMPORT */}

        {importId && (
          <Paper
            sx={{
              background: "#111827",
              border: "1px solid #1f2937",
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
                        sx={{ color: "#86efac" }}
                      />
                    ) : (
                      <FactCheck />
                    )
                  }
                  disabled={busy !== null}
                  onClick={() => void doValidate()}
                  sx={{
                    color: "#86efac",
                    borderColor: "#16a34a",
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
                        sx={{ color: "#fff" }}
                      />
                    ) : (
                      <PlayArrow />
                    )
                  }
                  disabled={
                    busy !== null ||
                    !validation ||
                    validation.valid === 0
                  }
                  onClick={() => void doProcess()}
                  sx={{
                    background: "#2563eb",
                    color: "#fff",
                    fontWeight: 800,
                    "&:hover": {
                      background: "#1d4ed8",
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
                  total={validation.total}
                  valid={validation.valid}
                  invalid={validation.invalid}
                  duplicates={validation.duplicates}
                />

                {validation.errors.length > 0 && (
                  <Box sx={{ mt: 3 }}>
                    <Typography
                      variant="subtitle1"
                      sx={{
                        color: "#f8fafc",
                        fontWeight: 800,
                        mb: 1.5,
                      }}
                    >
                      Validation Errors
                    </Typography>

                    <TableContainer
                      sx={{
                        border: "1px solid #263244",
                        borderRadius: 2,
                        maxHeight: 420,
                      }}
                    >
                      <Table stickyHeader size="small">
                        <TableHead>
                          <TableRow>
                            {[
                              "Row",
                              "Error Type",
                              "Field",
                              "Message",
                            ].map((heading) => (
                              <TableCell
                                key={heading}
                                sx={{
                                  background: "#0c121c",
                                  color: "#94a3b8",
                                  fontWeight: 800,
                                  borderColor: "#263244",
                                }}
                              >
                                {heading}
                              </TableCell>
                            ))}
                          </TableRow>
                        </TableHead>

                        <TableBody>
                          {validation.errors.map(
                            (error, index) => (
                              <TableRow key={index}>
                                <TableCell
                                  sx={{
                                    color: "#cbd5e1",
                                    borderColor: "#263244",
                                  }}
                                >
                                  {safeText(error.row_number)}
                                </TableCell>

                                <TableCell
                                  sx={{
                                    borderColor: "#263244",
                                  }}
                                >
                                  <Chip
                                    label={safeText(error.error_type)}
                                    size="small"
                                    sx={{
                                      background: "rgba(239,68,68,.12)",
                                      color: "#fca5a5",
                                      border: "1px solid #7f1d1d",
                                    }}
                                  />
                                </TableCell>

                                <TableCell
                                  sx={{
                                    color: "#cbd5e1",
                                    borderColor: "#263244",
                                  }}
                                >
                                  {safeText(error.field)}
                                </TableCell>

                                <TableCell
                                  sx={{
                                    color: "#cbd5e1",
                                    borderColor: "#263244",
                                  }}
                                >
                                  {safeText(error.message)}
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


        {/* IMPORT RESULT */}

        {result && (
          <Paper
            sx={{
              background: "#111827",
              border: "1px solid #166534",
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
                  label={result.status}
                  size="small"
                  sx={{
                    mt: 1,
                    background: "#123322",
                    color: "#86efac",
                    border: "1px solid #166534",
                    fontWeight: 800,
                  }}
                />
              </Box>

              {(result.failed > 0 ||
                result.validationFailures > 0 ||
                result.duplicates > 0) && (
                <Button
                  variant="outlined"
                  startIcon={<Download />}
                  onClick={() =>
                    void downloadErrors(importId!)
                  }
                  sx={{
                    color: "#fde68a",
                    borderColor: "#a16207",
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
                ["Total", result.total],
                ["Successful", result.success],
                ["Failed", result.failed],
                ["Duplicates", result.duplicates],
                ["Validation Failures", result.validationFailures],
              ].map(([label, value]) => (
                <Box
                  key={String(label)}
                  sx={{
                    background: "#0c121c",
                    border: "1px solid #263244",
                    borderRadius: 2,
                    p: 2,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{ color: "#64748b" }}
                  >
                    {label}
                  </Typography>

                  <Typography
                    variant="h6"
                    sx={{
                      color: "#f8fafc",
                      fontWeight: 800,
                      mt: 0.5,
                    }}
                  >
                    {value}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        )}


        {/* IMPORT HISTORY */}

        <Paper
          sx={{
            background: "#111827",
            border: "1px solid #1f2937",
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
                View previous CSV imports and manage import records.
              </Typography>
            </Box>

            <Button
              variant="outlined"
              startIcon={
                busy === "history" ? (
                  <CircularProgress size={18} />
                ) : (
                  <Refresh />
                )
              }
              disabled={busy === "history"}
              onClick={() => void loadHistory()}
              sx={{
                color: "#cbd5e1",
                borderColor: "#475569",
              }}
            >
              Refresh
            </Button>
          </Stack>

          <TableContainer
            sx={{
              border: "1px solid #263244",
              borderRadius: 2,
              overflowX: "auto",
            }}
          >
            <Table
              size="small"
              sx={{ minWidth: 1250 }}
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
                        background: "#0c121c",
                        color: "#94a3b8",
                        fontWeight: 800,
                        borderColor: "#263244",
                        whiteSpace: "nowrap",
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
                {history.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={11}
                      sx={{
                        textAlign: "center",
                        color: "#64748b",
                        borderColor: "#263244",
                        py: 4,
                      }}
                    >
                      No import history available.
                    </TableCell>
                  </TableRow>
                ) : (
                  history.map((item) => {
                    const statusLower =
                      safeText(item.status).toLowerCase();

                    const isPending =
                      statusLower === "pending" ||
                      statusLower === "uploaded";

                    const hasErrors =
                      Number(item.failed_records || 0) > 0 ||
                      Number(item.duplicate_records || 0) > 0 ||
                      statusLower.includes("error") ||
                      statusLower.includes("failed");

                    return (
                      <TableRow
                        key={item.id}
                        hover
                        sx={{
                          "&:hover": {
                            background: "#151e2c",
                          },
                        }}
                      >
                        <TableCell
                          sx={{
                            color: "#cbd5e1",
                            borderColor: "#263244",
                            fontWeight: 700,
                          }}
                        >
                          #{item.id}
                        </TableCell>

                        <TableCell
                          sx={{
                            color: "#cbd5e1",
                            borderColor: "#263244",
                          }}
                        >
                          {safeText(item.import_type)}
                        </TableCell>

                        <TableCell
                          sx={{
                            color: "#f8fafc",
                            borderColor: "#263244",
                            fontWeight: 600,
                          }}
                        >
                          {safeText(item.filename)}
                        </TableCell>

                        <TableCell
                          sx={{
                            color: "#94a3b8",
                            borderColor: "#263244",
                          }}
                        >
                          {safeText(item.uploaded_by)}
                        </TableCell>

                        <TableCell
                          sx={{
                            color: "#cbd5e1",
                            borderColor: "#263244",
                          }}
                        >
                          {safeText(item.total_records)}
                        </TableCell>

                        <TableCell
                          sx={{
                            color: "#86efac",
                            borderColor: "#263244",
                            fontWeight: 700,
                          }}
                        >
                          {isPending
                            ? 0
                            : safeText(item.successful_records)}
                        </TableCell>

                        <TableCell
                          sx={{
                            color:
                              Number(item.failed_records || 0) > 0
                                ? "#fca5a5"
                                : "#cbd5e1",
                            borderColor: "#263244",
                          }}
                        >
                          {isPending
                            ? 0
                            : safeText(item.failed_records)}
                        </TableCell>

                        <TableCell
                          sx={{
                            color:
                              Number(item.duplicate_records || 0) > 0
                                ? "#fde68a"
                                : "#cbd5e1",
                            borderColor: "#263244",
                          }}
                        >
                          {isPending
                            ? 0
                            : safeText(item.duplicate_records)}
                        </TableCell>

                        <TableCell
                          sx={{ borderColor: "#263244" }}
                        >
                          <Chip
                            label={safeText(item.status)}
                            size="small"
                            sx={{
                              background: isPending
                                ? "#1e293b"
                                : hasErrors
                                ? "#3a2b10"
                                : "#123322",

                              color: isPending
                                ? "#cbd5e1"
                                : hasErrors
                                ? "#fde68a"
                                : "#86efac",

                              border: isPending
                                ? "1px solid #475569"
                                : hasErrors
                                ? "1px solid #854d0e"
                                : "1px solid #166534",

                              fontWeight: 700,
                            }}
                          />
                        </TableCell>

                        <TableCell
                          sx={{
                            color: "#94a3b8",
                            borderColor: "#263244",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {item.created_at
                            ? new Date(
                                item.created_at
                              ).toLocaleString()
                            : "-"}
                        </TableCell>

                        <TableCell
                          sx={{
                            borderColor: "#263244",
                            minWidth: 205,
                            whiteSpace: "nowrap",
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
                                startIcon={<Download />}
                                onClick={() =>
                                  void downloadErrors(item.id)
                                }
                                sx={{
                                  minWidth: 82,
                                  color: "#fde68a",
                                  borderColor: "#a16207",
                                  textTransform: "none",
                                }}
                              >
                                Errors
                              </Button>
                            )}

                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<DeleteOutlined />}
                              disabled={busy !== null}
                              onClick={() =>
                                void handleDelete(item)
                              }
                              sx={{
                                minWidth: 88,
                                color: "#fca5a5",
                                borderColor: "#dc2626",
                                textTransform: "none",
                              }}
                            >
                              Delete
                            </Button>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

      </Box>


      {/* SNACKBAR */}

      <Snackbar
        open={!!message}
        autoHideDuration={5000}
        onClose={() => setMessage("")}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
      >
        <Alert
          onClose={() => setMessage("")}
          severity={severity}
          variant="filled"
          sx={{
            width: "100%",
            whiteSpace: "pre-line",
          }}
        >
          {message}
        </Alert>
      </Snackbar>

    </Box>
  );
}

