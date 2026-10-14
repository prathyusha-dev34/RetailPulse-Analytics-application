
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Pagination,
  Paper,
  Select,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

import {
  Add,
  Delete,
  Download,
  Edit,
  PictureAsPdf,
  Refresh,
  ToggleOff,
  ToggleOn,
} from "@mui/icons-material";

import {
  createScheduledReport,
  deleteScheduledReport,
  downloadReportHistory,
  exportReport,
  generateReport,
  getReportHistory,
  getReportTypes,
  getScheduledReports,
  toggleScheduledReport,
  updateScheduledReport,
  type CreateScheduleRequest,
  type ReportFilters,
  type ReportHistoryItem,
  type ReportResponse,
  type ReportType,
  type ScheduleReport,
} from "../api/reportingApi";

// =====================================================
// CONSTANTS
// =====================================================

const PAGE_SIZE = 10;

const REPORT_FILTER_LABELS: Record<string, string> = {
  date_from: "From Date",
  date_to: "To Date",
  product: "Product",
  category: "Category",
  brand: "Brand",
  customer: "Customer",
  sales_status: "Sales Status",
  stock_status: "Stock Status",
  user: "User",
  company: "Company",
};

// =====================================================
// COMPONENT
// =====================================================

export default function Reports() {
  // ===================================================
  // REPORT STATE
  // ===================================================

  const [reportTypes, setReportTypes] = useState<ReportType[]>([]);
  const [selectedReportType, setSelectedReportType] =
    useState("sales");

  const [report, setReport] =
    useState<ReportResponse | null>(null);

  const [reportLoading, setReportLoading] =
    useState(false);

  const [reportError, setReportError] =
    useState("");

  const [page, setPage] = useState(1);

  const [sortBy, setSortBy] =
    useState("");

  const [sortOrder, setSortOrder] =
    useState<"asc" | "desc">("desc");

  // ===================================================
  // FILTER STATE
  // ===================================================

  const [dateFrom, setDateFrom] =
    useState("");

  const [dateTo, setDateTo] =
    useState("");

  const [product, setProduct] =
    useState("");

  const [category, setCategory] =
    useState("");

  const [brand, setBrand] =
    useState("");

  const [customer, setCustomer] =
    useState("");

  const [salesStatus, setSalesStatus] =
    useState("");

  const [stockStatus, setStockStatus] =
    useState("");

  const [user, setUser] =
    useState("");

  const [company, setCompany] =
    useState("");

  // ===================================================
  // HISTORY STATE
  // ===================================================

  const [history, setHistory] =
    useState<ReportHistoryItem[]>([]);

  const [historyLoading, setHistoryLoading] =
    useState(false);

  // ===================================================
  // SCHEDULE STATE
  // ===================================================

  const [schedules, setSchedules] =
    useState<ScheduleReport[]>([]);

  const [scheduleLoading, setScheduleLoading] =
    useState(false);

  const [scheduleDialogOpen, setScheduleDialogOpen] =
    useState(false);

  const [editingScheduleId, setEditingScheduleId] =
    useState<number | null>(null);

  const [scheduleName, setScheduleName] =
    useState("");

  const [scheduleFrequency, setScheduleFrequency] =
    useState<"DAILY" | "WEEKLY" | "MONTHLY">(
      "DAILY"
    );

  const [scheduleTime, setScheduleTime] =
    useState("09:00");

  const [scheduleRecipients, setScheduleRecipients] =
    useState("");

  const [scheduleFormat, setScheduleFormat] =
    useState<"CSV" | "PDF">("CSV");

  const [scheduleActive, setScheduleActive] =
    useState(true);

  // ===================================================
  // GENERAL STATE
  // ===================================================

  const [exportLoading, setExportLoading] =
    useState(false);

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    type: "success" | "error";
  }>({
    open: false,
    message: "",
    type: "success",
  });

  // ===================================================
  // STYLE
  // ===================================================

  const textFieldStyle = {
    "& .MuiInputLabel-root": {
      color: "#cbd5e1",
    },

    "& .MuiInputLabel-root.Mui-focused": {
      color: "#60a5fa",
    },

    "& .MuiOutlinedInput-root": {
      color: "#fff",
      backgroundColor: "#1e293b",

      "& fieldset": {
        borderColor: "#475569",
      },

      "&:hover fieldset": {
        borderColor: "#60a5fa",
      },

      "&.Mui-focused fieldset": {
        borderColor: "#3b82f6",
      },
    },

    "& .MuiSelect-icon": {
      color: "#fff",
    },

    "& input::placeholder": {
      color: "#94a3b8",
      opacity: 1,
    },
  };

  const tableHeaderStyle = {
    background: "#1e293b",
    color: "#fff",
    fontWeight: 700,
    borderColor: "#334155",
  };

  const tableCellStyle = {
    color: "#fff",
    borderColor: "#334155",
  };

  // ===================================================
  // BUILD FILTER OBJECT
  // ===================================================

  const buildFilters = (): ReportFilters => {
    const filters: ReportFilters = {};

    if (dateFrom.trim()) {
      filters.date_from = dateFrom.trim();
    }

    if (dateTo.trim()) {
      filters.date_to = dateTo.trim();
    }

    if (product.trim()) {
      filters.product = product.trim();
    }

    if (category.trim()) {
      filters.category = category.trim();
    }

    if (brand.trim()) {
      filters.brand = brand.trim();
    }

    if (customer.trim()) {
      filters.customer = customer.trim();
    }

    if (salesStatus.trim()) {
      filters.sales_status = salesStatus.trim();
    }

    if (stockStatus.trim()) {
      filters.stock_status = stockStatus.trim();
    }

    if (user.trim()) {
      filters.user = user.trim();
    }

    if (company.trim()) {
      filters.company = company.trim();
    }

    return filters;
  };

  // ===================================================
  // LOAD REPORT TYPES
  // ===================================================

  const loadReportTypes = async () => {
    try {
      const data = await getReportTypes();

      setReportTypes(
        Array.isArray(data) ? data : []
      );
    } catch (error: any) {
      console.error(
        "Load report types error:",
        error
      );

      setSnackbar({
        open: true,
        message:
          error?.response?.data?.detail ||
          "Failed to load report types",
        type: "error",
      });
    }
  };

  // ===================================================
  // LOAD REPORT HISTORY
  // ===================================================

  const loadHistory = async () => {
    try {
      setHistoryLoading(true);

      const response =
        await getReportHistory();

      setHistory(
        Array.isArray(response?.items)
          ? response.items
          : []
      );
    } catch (error: any) {
      console.error(
        "Load report history error:",
        error
      );

      setSnackbar({
        open: true,
        message:
          error?.response?.data?.detail ||
          "Failed to load report history",
        type: "error",
      });
    } finally {
      setHistoryLoading(false);
    }
  };

  // ===================================================
  // LOAD SCHEDULES
  // ===================================================

  const loadSchedules = async () => {
    try {
      setScheduleLoading(true);

      const data =
        await getScheduledReports();

      setSchedules(
        Array.isArray(data) ? data : []
      );
    } catch (error: any) {
      console.error(
        "Load schedules error:",
        error
      );

      setSnackbar({
        open: true,
        message:
          error?.response?.data?.detail ||
          "Failed to load scheduled reports",
        type: "error",
      });
    } finally {
      setScheduleLoading(false);
    }
  };

  // ===================================================
  // INITIAL LOAD
  // ===================================================

  useEffect(() => {
    loadReportTypes();
    loadHistory();
    loadSchedules();
  }, []);

  // ===================================================
  // GENERATE REPORT
  // ===================================================

  const handleGenerateReport = async (
    requestedPage = page
  ) => {
    try {
      setReportLoading(true);
      setReportError("");

      const filters = buildFilters();

      const response =
        await generateReport({
          report_type: selectedReportType,
          filters,
          page: requestedPage,
          page_size: PAGE_SIZE,
          sort_by: sortBy,
          sort_order: sortOrder,
        });

      setReport(response);
      setPage(
        Number(response?.page || requestedPage)
      );

      await loadHistory();

      setSnackbar({
        open: true,
        message: "Report generated successfully",
        type: "success",
      });
    } catch (error: any) {
      console.error(
        "Generate report error:",
        error
      );

      const message =
        error?.response?.data?.detail ||
        "Failed to generate report";

      setReportError(message);

      setSnackbar({
        open: true,
        message,
        type: "error",
      });
    } finally {
      setReportLoading(false);
    }
  };

  // ===================================================
  // APPLY FILTERS
  // ===================================================

  const handleApplyFilters = async () => {
    setPage(1);
    await handleGenerateReport(1);
  };

  // ===================================================
  // CLEAR FILTERS
  // ===================================================

  const handleClearFilters = async () => {
    setDateFrom("");
    setDateTo("");
    setProduct("");
    setCategory("");
    setBrand("");
    setCustomer("");
    setSalesStatus("");
    setStockStatus("");
    setUser("");
    setCompany("");

    setPage(1);

    try {
      setReportLoading(true);

      const response =
        await generateReport({
          report_type: selectedReportType,
          filters: {},
          page: 1,
          page_size: PAGE_SIZE,
          sort_by: sortBy,
          sort_order: sortOrder,
        });

      setReport(response);

      await loadHistory();
    } catch (error: any) {
      console.error(
        "Clear filters error:",
        error
      );

      setSnackbar({
        open: true,
        message:
          error?.response?.data?.detail ||
          "Failed to clear filters",
        type: "error",
      });
    } finally {
      setReportLoading(false);
    }
  };

  // ===================================================
  // REPORT TYPE CHANGE
  // ===================================================

  const handleReportTypeChange = async (
    value: string
  ) => {
    setSelectedReportType(value);
    setReport(null);
    setPage(1);
  };

  // ===================================================
  // SORT
  // ===================================================

  const handleSort = async (
    field: string
  ) => {
    const newOrder =
      sortBy === field
        ? sortOrder === "asc"
          ? "desc"
          : "asc"
        : "desc";

    setSortBy(field);
    setSortOrder(newOrder);
    setPage(1);

    try {
      setReportLoading(true);

      const response =
        await generateReport({
          report_type: selectedReportType,
          filters: buildFilters(),
          page: 1,
          page_size: PAGE_SIZE,
          sort_by: field,
          sort_order: newOrder,
        });

      setReport(response);
    } catch (error: any) {
      console.error(
        "Sort report error:",
        error
      );

      setSnackbar({
        open: true,
        message:
          error?.response?.data?.detail ||
          "Failed to sort report",
        type: "error",
      });
    } finally {
      setReportLoading(false);
    }
  };

  // ===================================================
  // EXPORT REPORT
  // ===================================================

  const handleExport = async (
    format: "CSV" | "PDF"
  ) => {
    try {
      setExportLoading(true);

      const blob =
        await exportReport({
          report_type: selectedReportType,
          filters: buildFilters(),
          export_format: format,
          sort_by: sortBy,
          sort_order: sortOrder,
        });

      const url =
        window.URL.createObjectURL(blob);

      const link =
        document.createElement("a");

      link.href = url;

      link.download =
        `${selectedReportType}_${new Date()
          .toISOString()
          .replace(/[:.]/g, "-")}.${format === "CSV" ? "csv" : "pdf"}`;

      document.body.appendChild(link);

      link.click();

      document.body.removeChild(link);

      window.URL.revokeObjectURL(url);

      await loadHistory();

      setSnackbar({
        open: true,
        message:
          `${format} report exported successfully`,
        type: "success",
      });
    } catch (error: any) {
      console.error(
        "Export report error:",
        error
      );

      setSnackbar({
        open: true,
        message:
          error?.response?.data?.detail ||
          `Failed to export ${format} report`,
        type: "error",
      });
    } finally {
      setExportLoading(false);
    }
  };

  // ===================================================
  // DOWNLOAD HISTORY
  // ===================================================

  const handleDownloadHistory = async (
    item: ReportHistoryItem
  ) => {
    try {
      const blob =
        await downloadReportHistory(item.id);

      const url =
        window.URL.createObjectURL(blob);

      const link =
        document.createElement("a");

      link.href = url;

      link.download =
        `${item.report_type}_${item.id}.${item.format.toLowerCase()}`;

      document.body.appendChild(link);

      link.click();

      document.body.removeChild(link);

      window.URL.revokeObjectURL(url);

      setSnackbar({
        open: true,
        message: "Report downloaded successfully",
        type: "success",
      });
    } catch (error: any) {
      console.error(
        "Download history error:",
        error
      );

      setSnackbar({
        open: true,
        message:
          error?.response?.data?.detail ||
          "Failed to download report",
        type: "error",
      });
    }
  };

  // ===================================================
  // OPEN CREATE SCHEDULE
  // ===================================================

  const handleOpenCreateSchedule = () => {
    setEditingScheduleId(null);

    setScheduleName(
      report?.report_name ||
      `${selectedReportType} Scheduled Report`
    );

    setScheduleFrequency("DAILY");
    setScheduleTime("09:00");
    setScheduleRecipients("");
    setScheduleFormat("CSV");
    setScheduleActive(true);

    setScheduleDialogOpen(true);
  };

  // ===================================================
  // OPEN EDIT SCHEDULE
  // ===================================================

  const handleOpenEditSchedule = (
    schedule: ScheduleReport
  ) => {
    setEditingScheduleId(schedule.id);

    setScheduleName(schedule.report_name);
    setScheduleFrequency(
      schedule.frequency
    );

    setScheduleTime(
      schedule.execution_time?.slice(0, 5) ||
      "09:00"
    );

    setScheduleRecipients(
      schedule.recipients.join(", ")
    );

    setScheduleFormat(
      schedule.export_format
    );

    setScheduleActive(
      schedule.is_active
    );

    setSelectedReportType(
      schedule.report_type
    );

    setScheduleDialogOpen(true);
  };

  // ===================================================
  // SAVE SCHEDULE
  // ===================================================

  const handleSaveSchedule = async () => {
    try {
      if (!scheduleName.trim()) {
        setSnackbar({
          open: true,
          message: "Please enter report name",
          type: "error",
        });
        return;
      }

      const recipients =
        scheduleRecipients
          .split(",")
          .map((email) => email.trim())
          .filter(Boolean);

      if (recipients.length === 0) {
        setSnackbar({
          open: true,
          message:
            "Please enter at least one recipient email",
          type: "error",
        });
        return;
      }

      const payload: CreateScheduleRequest = {
        report_type: selectedReportType,
        report_name: scheduleName.trim(),
        filters: buildFilters(),
        frequency: scheduleFrequency,
        execution_time:
          scheduleTime.length === 5
            ? `${scheduleTime}:00`
            : scheduleTime,
        recipients,
        export_format: scheduleFormat,
        is_active: scheduleActive,
      };

      if (editingScheduleId) {
        await updateScheduledReport(
          editingScheduleId,
          payload
        );

        setSnackbar({
          open: true,
          message:
            "Scheduled report updated successfully",
          type: "success",
        });
      } else {
        await createScheduledReport(
          payload
        );

        setSnackbar({
          open: true,
          message:
            "Scheduled report created successfully",
          type: "success",
        });
      }

      setScheduleDialogOpen(false);

      await loadSchedules();
    } catch (error: any) {
      console.error(
        "Save schedule error:",
        error
      );

      setSnackbar({
        open: true,
        message:
          error?.response?.data?.detail ||
          "Failed to save scheduled report",
        type: "error",
      });
    }
  };

  // ===================================================
  // TOGGLE SCHEDULE
  // ===================================================

  const handleToggleSchedule = async (
    scheduleId: number
  ) => {
    try {
      await toggleScheduledReport(
        scheduleId
      );

      await loadSchedules();

      setSnackbar({
        open: true,
        message:
          "Scheduled report status updated",
        type: "success",
      });
    } catch (error: any) {
      console.error(
        "Toggle schedule error:",
        error
      );

      setSnackbar({
        open: true,
        message:
          error?.response?.data?.detail ||
          "Failed to update schedule status",
        type: "error",
      });
    }
  };

  // ===================================================
  // DELETE SCHEDULE
  // ===================================================

  const handleDeleteSchedule = async (
    scheduleId: number
  ) => {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this scheduled report?"
      );

    if (!confirmed) {
      return;
    }

    try {
      await deleteScheduledReport(
        scheduleId
      );

      await loadSchedules();

      setSnackbar({
        open: true,
        message:
          "Scheduled report deleted successfully",
        type: "success",
      });
    } catch (error: any) {
      console.error(
        "Delete schedule error:",
        error
      );

      setSnackbar({
        open: true,
        message:
          error?.response?.data?.detail ||
          "Failed to delete scheduled report",
        type: "error",
      });
    }
  };

  // ===================================================
  // REFRESH
  // ===================================================

  const handleRefresh = async () => {
    await Promise.all([
      loadReportTypes(),
      loadHistory(),
      loadSchedules(),
    ]);

    if (report) {
      await handleGenerateReport(page);
    }
  };

  // ===================================================
  // FORMATTERS
  // ===================================================

  const formatDateTime = (
    value?: string | null
  ) => {
    if (!value) {
      return "-";
    }

    const date =
      new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString(
      "en-IN"
    );
  };

  const formatCurrency = (
    value: unknown
  ) => {
    const number =
      Number(value || 0);

    return `₹${number.toLocaleString(
      "en-IN",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    )}`;
  };

  const formatCellValue = (
    value: unknown,
    key: string
  ) => {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return "-";
    }

    if (
      key.toLowerCase().includes("date")
    ) {
      return formatDateTime(
        String(value)
      );
    }

    if (
      [
        "total",
        "unit price",
        "discount",
        "tax",
        "revenue",
        "amount",
        "price",
        "aov",
      ].some((term) =>
        key
          .toLowerCase()
          .includes(term)
      )
    ) {
      if (
        typeof value === "number" ||
        !Number.isNaN(Number(value))
      ) {
        return formatCurrency(value);
      }
    }

    return String(value);
  };

  const columns = useMemo(() => {
    if (
      !report ||
      !Array.isArray(report.items) ||
      report.items.length === 0
    ) {
      return [];
    }

    const keys = Object.keys(
      report.items[0]
    );

    return keys;
  }, [report]);

  const appliedFilterEntries =
    Object.entries(
      report?.applied_filters || {}
    );

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg,#020617,#0f172a,#1e293b)",
        py: 4,
      }}
    >
      <Container
        maxWidth="xl"
        sx={{
          width: "100%",
        }}
      >
        {/* =================================================
            HEADER
        ================================================= */}

        <Paper
          sx={{
            p: {
              xs: 3,
              md: 4,
            },
            mb: 3,
            background: "#111827",
            border:
              "1px solid #334155",
            borderRadius: 4,
            color: "#fff",
            boxShadow:
              "0 10px 30px rgba(0,0,0,0.35)",
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems: {
                xs: "flex-start",
                md: "center",
              },
              flexDirection: {
                xs: "column",
                md: "row",
              },
              gap: 2,
            }}
          >
            <Box>
              <Typography
                variant="h3"
                sx={{
                  fontSize: {
                    xs: "2rem",
                    md: "2.5rem",
                  },
                  fontWeight: 700,
                  mb: 1,
                }}
              >
                Reports
              </Typography>

              <Typography
                sx={{
                  color: "#cbd5e1",
                }}
              >
                Generate, export and schedule
                business reports
              </Typography>
            </Box>

            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={handleRefresh}
              disabled={
                reportLoading ||
                historyLoading ||
                scheduleLoading
              }
              sx={{
                color: "#fff",
                borderColor:
                  "#64748b",
                textTransform:
                  "none",
              }}
            >
              Refresh
            </Button>
          </Box>
        </Paper>

        {/* =================================================
            REPORT GENERATOR
        ================================================= */}

        <Paper
          sx={{
            p: {
              xs: 2,
              md: 3,
            },
            mb: 3,
            background: "#111827",
            border:
              "1px solid #334155",
            borderRadius: 3,
            color: "#fff",
          }}
        >
          <Typography
            variant="h6"
            fontWeight={700}
            mb={2}
          >
            Report Generator
          </Typography>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                lg: "repeat(4, 1fr)",
              },
              gap: 2,
              mb: 2,
            }}
          >
            <TextField
              select
              label="Report Type"
              value={
                selectedReportType
              }
              onChange={(e) =>
                handleReportTypeChange(
                  e.target.value
                )
              }
              sx={textFieldStyle}
              fullWidth
            >
              {reportTypes.map(
                (type) => (
                  <MenuItem
                    key={type.value}
                    value={type.value}
                  >
                    {type.label}
                  </MenuItem>
                )
              )}
            </TextField>

            <TextField
              label="From Date"
              type="date"
              value={dateFrom}
              onChange={(e) =>
                setDateFrom(
                  e.target.value
                )
              }
              slotProps={{
                inputLabel: {
                  shrink: true,
                },
              }}
              sx={textFieldStyle}
              fullWidth
            />

            <TextField
              label="To Date"
              type="date"
              value={dateTo}
              onChange={(e) =>
                setDateTo(
                  e.target.value
                )
              }
              slotProps={{
                inputLabel: {
                  shrink: true,
                },
              }}
              sx={textFieldStyle}
              fullWidth
            />

            <TextField
              label="Product"
              value={product}
              onChange={(e) =>
                setProduct(
                  e.target.value
                )
              }
              placeholder="Product name / SKU"
              sx={textFieldStyle}
              fullWidth
            />

            <TextField
              label="Category"
              value={category}
              onChange={(e) =>
                setCategory(
                  e.target.value
                )
              }
              sx={textFieldStyle}
              fullWidth
            />

            <TextField
              label="Brand"
              value={brand}
              onChange={(e) =>
                setBrand(
                  e.target.value
                )
              }
              sx={textFieldStyle}
              fullWidth
            />

            <TextField
              label="Customer"
              value={customer}
              onChange={(e) =>
                setCustomer(
                  e.target.value
                )
              }
              sx={textFieldStyle}
              fullWidth
            />

            <TextField
              select
              label="Sales Status"
              value={salesStatus}
              onChange={(e) =>
                setSalesStatus(
                  e.target.value
                )
              }
              sx={textFieldStyle}
              fullWidth
            >
              <MenuItem value="">
                All Sales Statuses
              </MenuItem>
              <MenuItem value="PAID">
                Paid
              </MenuItem>
              <MenuItem value="PENDING">
                Pending
              </MenuItem>
              <MenuItem value="PARTIAL">
                Partial
              </MenuItem>
              <MenuItem value="CANCELLED">
                Cancelled
              </MenuItem>
            </TextField>

            <TextField
              select
              label="Stock Status"
              value={stockStatus}
              onChange={(e) =>
                setStockStatus(
                  e.target.value
                )
              }
              sx={textFieldStyle}
              fullWidth
            >
              <MenuItem value="">
                All Stock Statuses
              </MenuItem>
              <MenuItem value="IN_STOCK">
                In Stock
              </MenuItem>
              <MenuItem value="LOW_STOCK">
                Low Stock
              </MenuItem>
              <MenuItem value="OUT_OF_STOCK">
                Out of Stock
              </MenuItem>
              <MenuItem value="OVERSTOCK">
                Overstock
              </MenuItem>
            </TextField>

            <TextField
              label="User"
              value={user}
              onChange={(e) =>
                setUser(
                  e.target.value
                )
              }
              sx={textFieldStyle}
              fullWidth
            />

            <TextField
              label="Company"
              value={company}
              onChange={(e) =>
                setCompany(
                  e.target.value
                )
              }
              sx={textFieldStyle}
              fullWidth
            />

            <TextField
              select
              label="Sort By"
              value={sortBy}
              onChange={(e) => {
                const value =
                  e.target.value;

                setSortBy(value);
              }}
              sx={textFieldStyle}
              fullWidth
            >
              <MenuItem value="">
                Default
              </MenuItem>

              {columns.map(
                (column) => (
                  <MenuItem
                    key={column}
                    value={column}
                  >
                    {column}
                  </MenuItem>
                )
              )}
            </TextField>

            <TextField
              select
              label="Sort Order"
              value={sortOrder}
              onChange={(e) =>
                setSortOrder(
                  e.target.value as
                    | "asc"
                    | "desc"
                )
              }
              sx={textFieldStyle}
              fullWidth
            >
              <MenuItem value="desc">
                Descending
              </MenuItem>

              <MenuItem value="asc">
                Ascending
              </MenuItem>
            </TextField>
          </Box>

          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 2,
            }}
          >
            <Button
              variant="contained"
              onClick={
                handleApplyFilters
              }
              disabled={
                reportLoading
              }
              sx={{
                textTransform:
                  "none",
                fontWeight: 700,
                background:
                  "#2563eb",
              }}
            >
              {reportLoading
                ? "Generating..."
                : "Generate Report"}
            </Button>

            <Button
              variant="outlined"
              onClick={
                handleClearFilters
              }
              disabled={
                reportLoading
              }
              sx={{
                color: "#fff",
                borderColor:
                  "#64748b",
                textTransform:
                  "none",
              }}
            >
              Clear Filters
            </Button>

            <Button
              variant="outlined"
              startIcon={
                <DescriptionIcon />
              }
              onClick={() =>
                handleExport("CSV")
              }
              disabled={
                exportLoading
              }
              sx={{
                color: "#34d399",
                borderColor:
                  "#34d399",
                textTransform:
                  "none",
              }}
            >
              Export CSV
            </Button>

            <Button
              variant="outlined"
              startIcon={
                <PictureAsPdf />
              }
              onClick={() =>
                handleExport("PDF")
              }
              disabled={
                exportLoading
              }
              sx={{
                color: "#f87171",
                borderColor:
                  "#f87171",
                textTransform:
                  "none",
              }}
            >
              Export PDF
            </Button>

            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={
                handleOpenCreateSchedule
              }
              sx={{
                textTransform:
                  "none",
                fontWeight: 700,
              }}
            >
              Schedule Report
            </Button>
          </Box>
        </Paper>

        {/* =================================================
            APPLIED FILTERS / PERIOD
        ================================================= */}

        {report && (
          <Paper
            sx={{
              p: 2,
              mb: 3,
              background: "#111827",
              border:
                "1px solid #334155",
              borderRadius: 3,
              color: "#fff",
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems:
                  "flex-start",
                flexWrap: "wrap",
                gap: 2,
              }}
            >
              <Box>
                <Typography
                  variant="h6"
                  fontWeight={700}
                >
                  {report.report_name}
                </Typography>

                <Typography
                  sx={{
                    color: "#94a3b8",
                    mt: 0.5,
                  }}
                >
                  Report Period:{" "}
                  {report.period}
                </Typography>
              </Box>

              <Chip
                label={`Total Rows: ${
                  report.total
                }`}
                sx={{
                  color: "#fff",
                  background:
                    "#2563eb",
                  fontWeight: 700,
                }}
              />
            </Box>

            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 1,
                mt: 2,
              }}
            >
              {appliedFilterEntries.length >
              0 ? (
                appliedFilterEntries.map(
                  ([key, value]) => (
                    <Chip
                      key={key}
                      label={`${REPORT_FILTER_LABELS[key] || key}: ${String(value)}`}
                      sx={{
                        color: "#fff",
                        background:
                          "#334155",
                      }}
                    />
                  )
                )
              ) : (
                <Chip
                  label="No filters applied"
                  sx={{
                    color: "#cbd5e1",
                    background:
                      "#1e293b",
                  }}
                />
              )}
            </Box>
          </Paper>
        )}

        {/* =================================================
            REPORT ERROR
        ================================================= */}

        {reportError && (
          <Alert
            severity="error"
            sx={{ mb: 3 }}
            onClose={() =>
              setReportError("")
            }
          >
            {reportError}
          </Alert>
        )}

        {/* =================================================
            REPORT TABLE
        ================================================= */}

        <Paper
          sx={{
            mb: 3,
            background: "#111827",
            border:
              "1px solid #334155",
            borderRadius: 3,
            overflow: "hidden",
          }}
        >
          <TableContainer
            sx={{
              maxHeight: 600,
            }}
          >
            <Table
              stickyHeader
              sx={{
                minWidth: 1200,
              }}
            >
              <TableHead>
                <TableRow>
                  {columns.map(
                    (column) => (
                      <TableCell
                        key={column}
                        onClick={() =>
                          handleSort(
                            column
                          )
                        }
                        sx={{
                          ...tableHeaderStyle,
                          cursor:
                            "pointer",
                          whiteSpace:
                            "nowrap",
                        }}
                      >
                        {column}

                        {sortBy ===
                          column &&
                          ` ${
                            sortOrder ===
                            "asc"
                              ? "↑"
                              : "↓"
                          }`}
                      </TableCell>
                    )
                  )}
                </TableRow>
              </TableHead>

              <TableBody>
                {reportLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={
                        Math.max(
                          columns.length,
                          1
                        )
                      }
                      align="center"
                      sx={{
                        color:
                          "#cbd5e1",
                        py: 5,
                        borderColor:
                          "#334155",
                      }}
                    >
                      Generating report...
                    </TableCell>
                  </TableRow>
                ) : !report ? (
                  <TableRow>
                    <TableCell
                      colSpan={1}
                      align="center"
                      sx={{
                        color:
                          "#cbd5e1",
                        py: 5,
                        borderColor:
                          "#334155",
                      }}
                    >
                      Select filters and
                      click Generate Report
                    </TableCell>
                  </TableRow>
                ) : report.items
                    .length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={
                        Math.max(
                          columns.length,
                          1
                        )
                      }
                      align="center"
                      sx={{
                        color:
                          "#cbd5e1",
                        py: 5,
                        borderColor:
                          "#334155",
                      }}
                    >
                      No report data found
                    </TableCell>
                  </TableRow>
                ) : (
                  report.items.map(
                    (row, rowIndex) => (
                      <TableRow
                        key={rowIndex}
                        hover
                        sx={{
                          "&:hover": {
                            background:
                              "#172033",
                          },
                        }}
                      >
                        {columns.map(
                          (column) => (
                            <TableCell
                              key={column}
                              sx={{
                                ...tableCellStyle,
                                whiteSpace:
                                  "nowrap",
                              }}
                            >
                              {formatCellValue(
                                row[column],
                                column
                              )}
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

          {report &&
            report.total_pages > 1 && (
              <Box
                sx={{
                  p: 2,
                  display: "flex",
                  justifyContent:
                    "center",
                  borderTop:
                    "1px solid #334155",
                }}
              >
                <Pagination
                  count={
                    report.total_pages
                  }
                  page={page}
                  onChange={(
                    _event,
                    value
                  ) => {
                    setPage(value);
                    handleGenerateReport(
                      value
                    );
                  }}
                  sx={{
                    "& .MuiPaginationItem-root":
                      {
                        color: "#fff",
                      },
                  }}
                />
              </Box>
            )}
        </Paper>

        {/* =================================================
            REPORT HISTORY
        ================================================= */}

        <Paper
          sx={{
            mb: 3,
            background: "#111827",
            border:
              "1px solid #334155",
            borderRadius: 3,
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              p: 3,
              display: "flex",
              justifyContent:
                "space-between",
              alignItems:
                "center",
            }}
          >
            <Box>
              <Typography
                variant="h6"
                fontWeight={700}
                sx={{
                  color: "#fff",
                }}
              >
                Report History
              </Typography>

              <Typography
                sx={{
                  color: "#94a3b8",
                  mt: 0.5,
                }}
              >
                Generated reports and export
                status
              </Typography>
            </Box>

            <IconButton
              onClick={loadHistory}
              sx={{
                color: "#60a5fa",
              }}
            >
              <Refresh />
            </IconButton>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell
                    sx={tableHeaderStyle}
                  >
                    Report
                  </TableCell>

                  <TableCell
                    sx={tableHeaderStyle}
                  >
                    Generated At
                  </TableCell>

                  <TableCell
                    sx={tableHeaderStyle}
                  >
                    Period
                  </TableCell>

                  <TableCell
                    sx={tableHeaderStyle}
                  >
                    Format
                  </TableCell>

                  <TableCell
                    sx={tableHeaderStyle}
                  >
                    Rows
                  </TableCell>

                  <TableCell
                    sx={tableHeaderStyle}
                  >
                    Status
                  </TableCell>

                  <TableCell
                    align="center"
                    sx={tableHeaderStyle}
                  >
                    Action
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {historyLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      align="center"
                      sx={{
                        color:
                          "#cbd5e1",
                        py: 4,
                      }}
                    >
                      Loading history...
                    </TableCell>
                  </TableRow>
                ) : history.length ===
                  0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      align="center"
                      sx={{
                        color:
                          "#cbd5e1",
                        py: 4,
                      }}
                    >
                      No report history found
                    </TableCell>
                  </TableRow>
                ) : (
                  history.map(
                    (item) => (
                      <TableRow
                        key={item.id}
                        hover
                      >
                        <TableCell
                          sx={
                            tableCellStyle
                          }
                        >
                          <Typography
                            fontWeight={700}
                            sx={{
                              color:
                                "#60a5fa",
                            }}
                          >
                            {
                              item.report_name
                            }
                          </Typography>

                          <Typography
                            variant="caption"
                            sx={{
                              color:
                                "#94a3b8",
                            }}
                          >
                            History ID:{" "}
                            {item.id}
                          </Typography>
                        </TableCell>

                        <TableCell
                          sx={
                            tableCellStyle
                          }
                        >
                          {formatDateTime(
                            item.generated_at
                          )}
                        </TableCell>

                        <TableCell
                          sx={
                            tableCellStyle
                          }
                        >
                          {
                            item.report_period
                          }
                        </TableCell>

                        <TableCell
                          sx={
                            tableCellStyle
                          }
                        >
                          <Chip
                            label={
                              item.format
                            }
                            size="small"
                            sx={{
                              color:
                                "#fff",
                              background:
                                item.format ===
                                "PDF"
                                  ? "#dc2626"
                                  : item.format ===
                                    "CSV"
                                  ? "#059669"
                                  : "#475569",
                            }}
                          />
                        </TableCell>

                        <TableCell
                          sx={
                            tableCellStyle
                          }
                        >
                          {item.row_count}
                        </TableCell>

                        <TableCell
                          sx={
                            tableCellStyle
                          }
                        >
                          <Chip
                            label={
                              item.status
                            }
                            size="small"
                            color={
                              item.status ===
                              "SUCCESS"
                                ? "success"
                                : "error"
                            }
                          />
                        </TableCell>

                        <TableCell
                          align="center"
                          sx={
                            tableCellStyle
                          }
                        >
                          {item.download_available ? (
                            <IconButton
                              title="Download Report"
                              onClick={() =>
                                handleDownloadHistory(
                                  item
                                )
                              }
                              sx={{
                                color:
                                  "#34d399",
                              }}
                            >
                              <Download />
                            </IconButton>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  )
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* =================================================
            SCHEDULED REPORTS
        ================================================= */}

        <Paper
          sx={{
            mb: 3,
            background: "#111827",
            border:
              "1px solid #334155",
            borderRadius: 3,
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              p: 3,
              display: "flex",
              justifyContent:
                "space-between",
              alignItems:
                "center",
              gap: 2,
            }}
          >
            <Box>
              <Typography
                variant="h6"
                fontWeight={700}
                sx={{
                  color: "#fff",
                }}
              >
                Scheduled Reports
              </Typography>

              <Typography
                sx={{
                  color: "#94a3b8",
                  mt: 0.5,
                }}
              >
                Manage recurring report delivery
              </Typography>
            </Box>

            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={
                handleOpenCreateSchedule
              }
              sx={{
                textTransform:
                  "none",
                fontWeight: 700,
              }}
            >
              Add Schedule
            </Button>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell
                    sx={tableHeaderStyle}
                  >
                    Report
                  </TableCell>

                  <TableCell
                    sx={tableHeaderStyle}
                  >
                    Frequency
                  </TableCell>

                  <TableCell
                    sx={tableHeaderStyle}
                  >
                    Execution Time
                  </TableCell>

                  <TableCell
                    sx={tableHeaderStyle}
                  >
                    Recipients
                  </TableCell>

                  <TableCell
                    sx={tableHeaderStyle}
                  >
                    Format
                  </TableCell>

                  <TableCell
                    sx={tableHeaderStyle}
                  >
                    Next Run
                  </TableCell>

                  <TableCell
                    sx={tableHeaderStyle}
                  >
                    Last Status
                  </TableCell>

                  <TableCell
                    sx={tableHeaderStyle}
                  >
                    Status
                  </TableCell>

                  <TableCell
                    align="center"
                    sx={tableHeaderStyle}
                  >
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {scheduleLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      align="center"
                      sx={{
                        color:
                          "#cbd5e1",
                        py: 4,
                      }}
                    >
                      Loading scheduled reports...
                    </TableCell>
                  </TableRow>
                ) : schedules.length ===
                  0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      align="center"
                      sx={{
                        color:
                          "#cbd5e1",
                        py: 4,
                      }}
                    >
                      No scheduled reports found
                    </TableCell>
                  </TableRow>
                ) : (
                  schedules.map(
                    (schedule) => (
                      <TableRow
                        key={
                          schedule.id
                        }
                        hover
                      >
                        <TableCell
                          sx={
                            tableCellStyle
                          }
                        >
                          <Typography
                            fontWeight={700}
                          >
                            {
                              schedule.report_name
                            }
                          </Typography>

                          <Typography
                            variant="caption"
                            sx={{
                              color:
                                "#94a3b8",
                            }}
                          >
                            {
                              schedule.report_type
                            }
                          </Typography>
                        </TableCell>

                        <TableCell
                          sx={
                            tableCellStyle
                          }
                        >
                          {
                            schedule.frequency
                          }
                        </TableCell>

                        <TableCell
                          sx={
                            tableCellStyle
                          }
                        >
                          {
                            schedule.execution_time?.slice(
                              0,
                              5
                            )
                          }
                        </TableCell>

                        <TableCell
                          sx={{
                            ...tableCellStyle,
                            maxWidth: 250,
                          }}
                        >
                          {schedule.recipients.join(
                            ", "
                          )}
                        </TableCell>

                        <TableCell
                          sx={
                            tableCellStyle
                          }
                        >
                          {
                            schedule.export_format
                          }
                        </TableCell>

                        <TableCell
                          sx={
                            tableCellStyle
                          }
                        >
                          {formatDateTime(
                            schedule.next_run_at
                          )}
                        </TableCell>

                        <TableCell
                          sx={
                            tableCellStyle
                          }
                        >
                          {schedule.last_status ||
                            "-"}
                        </TableCell>

                        <TableCell
                          sx={
                            tableCellStyle
                          }
                        >
                          <Chip
                            label={
                              schedule.is_active
                                ? "ACTIVE"
                                : "INACTIVE"
                            }
                            size="small"
                            sx={{
                              color:
                                "#fff",
                              background:
                                schedule.is_active
                                  ? "#16a34a"
                                  : "#64748b",
                              fontWeight:
                                700,
                            }}
                          />
                        </TableCell>

                        <TableCell
                          align="center"
                          sx={
                            tableCellStyle
                          }
                        >
                          <Box
                            sx={{
                              display:
                                "flex",
                              justifyContent:
                                "center",
                              alignItems:
                                "center",
                            }}
                          >
                            <IconButton
                              title="Edit"
                              onClick={() =>
                                handleOpenEditSchedule(
                                  schedule
                                )
                              }
                              sx={{
                                color:
                                  "#fbbf24",
                              }}
                            >
                              <Edit />
                            </IconButton>

                            <IconButton
                              title={
                                schedule.is_active
                                  ? "Disable"
                                  : "Enable"
                              }
                              onClick={() =>
                                handleToggleSchedule(
                                  schedule.id
                                )
                              }
                              sx={{
                                color:
                                  schedule.is_active
                                    ? "#f59e0b"
                                    : "#34d399",
                              }}
                            >
                              {schedule.is_active ? (
                                <ToggleOn />
                              ) : (
                                <ToggleOff />
                              )}
                            </IconButton>

                            <IconButton
                              title="Delete"
                              onClick={() =>
                                handleDeleteSchedule(
                                  schedule.id
                                )
                              }
                              sx={{
                                color:
                                  "#ef4444",
                              }}
                            >
                              <Delete />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    )
                  )
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Container>

      {/* =================================================
          SCHEDULE DIALOG
      ================================================= */}

      <Dialog
        open={scheduleDialogOpen}
        onClose={() =>
          setScheduleDialogOpen(false)
        }
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            background: "#111827",
            color: "#fff",
            border:
              "1px solid #334155",
          },
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: 700,
            color: "#fff",
          }}
        >
          {editingScheduleId
            ? "Edit Scheduled Report"
            : "Create Scheduled Report"}
        </DialogTitle>

        <DialogContent>
          <Box
            sx={{
              display: "grid",
              gap: 2,
              mt: 1,
            }}
          >
            <TextField
              select
              label="Report Type"
              value={
                selectedReportType
              }
              onChange={(e) =>
                setSelectedReportType(
                  e.target.value
                )
              }
              sx={textFieldStyle}
              fullWidth
            >
              {reportTypes.map(
                (type) => (
                  <MenuItem
                    key={type.value}
                    value={type.value}
                  >
                    {type.label}
                  </MenuItem>
                )
              )}
            </TextField>

            <TextField
              label="Report Name"
              value={scheduleName}
              onChange={(e) =>
                setScheduleName(
                  e.target.value
                )
              }
              sx={textFieldStyle}
              fullWidth
            />

            <TextField
              select
              label="Frequency"
              value={
                scheduleFrequency
              }
              onChange={(e) =>
                setScheduleFrequency(
                  e.target.value as
                    | "DAILY"
                    | "WEEKLY"
                    | "MONTHLY"
                )
              }
              sx={textFieldStyle}
              fullWidth
            >
              <MenuItem value="DAILY">
                Daily
              </MenuItem>

              <MenuItem value="WEEKLY">
                Weekly
              </MenuItem>

              <MenuItem value="MONTHLY">
                Monthly
              </MenuItem>
            </TextField>

            <TextField
              label="Execution Time"
              type="time"
              value={
                scheduleTime
              }
              onChange={(e) =>
                setScheduleTime(
                  e.target.value
                )
              }
              slotProps={{
                inputLabel: {
                  shrink: true,
                },
              }}
              sx={textFieldStyle}
              fullWidth
            />

            <TextField
              label="Recipients"
              value={
                scheduleRecipients
              }
              onChange={(e) =>
                setScheduleRecipients(
                  e.target.value
                )
              }
              placeholder="email1@example.com, email2@example.com"
              helperText="Enter multiple emails separated by commas"
              sx={{
                ...textFieldStyle,
                "& .MuiFormHelperText-root":
                  {
                    color:
                      "#94a3b8",
                  },
              }}
              fullWidth
            />

            <TextField
              select
              label="Export Format"
              value={
                scheduleFormat
              }
              onChange={(e) =>
                setScheduleFormat(
                  e.target.value as
                    | "CSV"
                    | "PDF"
                )
              }
              sx={textFieldStyle}
              fullWidth
            >
              <MenuItem value="CSV">
                CSV
              </MenuItem>

              <MenuItem value="PDF">
                PDF
              </MenuItem>
            </TextField>

            <FormControl
              fullWidth
            >
              <InputLabel
                sx={{
                  color:
                    "#cbd5e1",
                }}
              >
                Status
              </InputLabel>

              <Select
                value={
                  scheduleActive
                    ? "ACTIVE"
                    : "INACTIVE"
                }
                label="Status"
                onChange={(e) =>
                  setScheduleActive(
                    e.target.value ===
                      "ACTIVE"
                  )
                }
                sx={{
                  color: "#fff",
                  background:
                    "#1e293b",

                  "& .MuiOutlinedInput-notchedOutline":
                    {
                      borderColor:
                        "#475569",
                    },

                  "& .MuiSvgIcon-root":
                    {
                      color:
                        "#fff",
                    },
                }}
              >
                <MenuItem value="ACTIVE">
                  Active
                </MenuItem>

                <MenuItem value="INACTIVE">
                  Inactive
                </MenuItem>
              </Select>
            </FormControl>

            <Paper
              sx={{
                p: 2,
                background:
                  "#0f172a",
                border:
                  "1px solid #334155",
                color: "#cbd5e1",
              }}
            >
              <Typography
                variant="body2"
              >
                Current filters will be saved
                with this scheduled report.
              </Typography>

              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  mt: 1,
                  color:
                    "#64748b",
                }}
              >
                {Object.keys(
                  buildFilters()
                ).length > 0
                  ? JSON.stringify(
                      buildFilters()
                    )
                  : "No filters applied"}
              </Typography>
            </Paper>
          </Box>
        </DialogContent>

        <DialogActions
          sx={{
            p: 2,
            borderTop:
              "1px solid #334155",
          }}
        >
          <Button
            onClick={() =>
              setScheduleDialogOpen(
                false
              )
            }
            sx={{
              color: "#cbd5e1",
              textTransform:
                "none",
            }}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={
              handleSaveSchedule
            }
            sx={{
              textTransform:
                "none",
              fontWeight: 700,
            }}
          >
            {editingScheduleId
              ? "Update Schedule"
              : "Create Schedule"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* =================================================
          SNACKBAR
      ================================================= */}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3500}
        onClose={() =>
          setSnackbar({
            ...snackbar,
            open: false,
          })
        }
      >
        <Alert
          severity={snackbar.type}
          variant="filled"
          onClose={() =>
            setSnackbar({
              ...snackbar,
              open: false,
            })
          }
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

// =====================================================
// SMALL ICON ALIAS
// =====================================================

function DescriptionIcon() {
  return <Download />;
}

