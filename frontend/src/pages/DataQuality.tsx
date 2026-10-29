
import { useCallback, useEffect, useState } from "react";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

import {
  Refresh,
  PlayArrow,
  Search,
  FactCheck,
  WarningAmber,
  TaskAlt,
} from "@mui/icons-material";

import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

// ======================================================
// TYPES
// ======================================================

type Issue = {
  id: number;
  company_id: number;
  issue_key: string;
  issue_type: string;
  severity: string;
  module: string;
  record_type: string;
  record_id: string;
  title: string;
  description: string;
  details?: Record<string, unknown> | null;
  status: string;
  detected_at: string;
  last_seen_at?: string | null;
  resolution_note?: string | null;
  resolved_by?: number | null;
  resolved_at?: string | null;
};

type Run = {
  id: number;
  company_id: number;
  triggered_by?: number | null;
  started_at: string;
  completed_at?: string | null;
  records_checked: number;
  issues_detected: number;
  issues_resolved: number;
  failed_checks: number;
  status: string;
  summary?: Record<string, unknown> | null;
  failure_reason?: string | null;
};

type Dashboard = {
  total_issues: number;
  open_issues: number;
  resolved_issues: number;
  critical_issues: number;
  warning_issues: number;
};

type PaginatedIssues = {
  items: Issue[];
  pagination?: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
  };
};

type PaginatedRuns = {
  items: Run[];
  pagination?: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
  };
};

const initialDashboard: Dashboard = {
  total_issues: 0,
  open_issues: 0,
  resolved_issues: 0,
  critical_issues: 0,
  warning_issues: 0,
};

const niceDate = (value?: string | null) => {
  if (!value) return "—";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString();
};

const getErrorMessage = (error: any, fallback: string) => {
  const detail = error?.response?.data?.detail;

  if (typeof detail === "string") return detail;

  if (Array.isArray(detail)) {
    return detail
      .map((item: any) => item.msg || JSON.stringify(item))
      .join(", ");
  }

  return fallback;
};

// ======================================================
// DATA QUALITY PAGE
// ======================================================

export default function DataQuality() {
  const { user } = useAuth();

  // Use the logged-in user's company.
  const companyId = Number(
    user?.company_id ??
      user?.companyId ??
      localStorage.getItem("company_id") ??
      3
  );

  const [tab, setTab] = useState(0);

  const [dashboard, setDashboard] =
    useState<Dashboard>(initialDashboard);

  const [issues, setIssues] = useState<Issue[]>([]);
  const [history, setHistory] = useState<Run[]>([]);

  const [totalIssues, setTotalIssues] = useState(0);
  const [totalRuns, setTotalRuns] = useState(0);

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState("");
  const [moduleFilter, setModuleFilter] = useState("");
  const [status, setStatus] = useState("");

  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [selected, setSelected] = useState<Issue | null>(null);
  const [details, setDetails] = useState<Issue | null>(null);

  const [resolutionNote, setResolutionNote] = useState("");
  const [savingStatus, setSavingStatus] = useState(false);

  // ====================================================
  // LOAD SUMMARY
  // Backend: GET /data-quality/summary
  // ====================================================

  const loadDashboard = useCallback(async () => {
    const response = await api.get("/data-quality/summary", {
      params: {
        company_id: companyId,
      },
    });

    setDashboard({
      total_issues: Number(response.data.total_issues ?? 0),
      open_issues: Number(response.data.open_issues ?? 0),
      resolved_issues: Number(response.data.resolved_issues ?? 0),
      critical_issues: Number(response.data.critical_issues ?? 0),
      warning_issues: Number(response.data.warning_issues ?? 0),
    });
  }, [companyId]);

  // ====================================================
  // LOAD ISSUES
  // Backend: GET /data-quality/issues
  // ====================================================

  const loadIssues = useCallback(async () => {
    const params: Record<string, string | number> = {
      company_id: companyId,
      page: page + 1,
      page_size: pageSize,
    };

    if (search.trim()) {
      params.search = search.trim();
    }

    if (severity) {
      params.severity = severity;
    }

    if (moduleFilter) {
      params.module = moduleFilter;
    }

    if (status) {
      params.status = status;
    }

    const response = await api.get<PaginatedIssues>(
      "/data-quality/issues",
      { params }
    );

    const responseItems = response.data.items ?? [];

    setIssues(responseItems);

    // Backend returns total under pagination.total.
    setTotalIssues(
      Number(
        response.data.pagination?.total ??
          responseItems.length
      )
    );
  }, [
    companyId,
    page,
    pageSize,
    search,
    severity,
    moduleFilter,
    status,
  ]);

  // ====================================================
  // LOAD RECONCILIATION HISTORY
  // Backend: GET /data-quality/reconciliation-runs
  // ====================================================

  const loadHistory = useCallback(async () => {
    const response = await api.get<PaginatedRuns>(
      "/data-quality/reconciliation-runs",
      {
        params: {
          company_id: companyId,
          page: 1,
          page_size: 100,
        },
      }
    );

    const runs = response.data.items ?? [];

    setHistory(runs);

    setTotalRuns(
      Number(
        response.data.pagination?.total ?? runs.length
      )
    );
  }, [companyId]);

  // ====================================================
  // REFRESH PAGE
  // ====================================================

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      await Promise.all([
        loadDashboard(),
        loadIssues(),
        loadHistory(),
      ]);
    } catch (e: any) {
      setError(
        getErrorMessage(
          e,
          "Could not load data quality information."
        )
      );
    } finally {
      setLoading(false);
    }
  }, [loadDashboard, loadIssues, loadHistory]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // ====================================================
  // RUN RECONCILIATION
  // Backend: POST /data-quality/reconciliation/run
  // ====================================================

  const runReconciliation = async () => {
    setRunning(true);
    setError("");
    setNotice("");

    try {
      const response = await api.post(
        "/data-quality/reconciliation/run",
        null,
        {
          params: {
            company_id: companyId,
          },
        }
      );

      const result = response.data;

      setNotice(
        `Reconciliation ${String(result.status ?? "SUCCESS")
          .toLowerCase()
          .replaceAll("_", " ")} completed. ` +
          `Checked ${result.records_checked ?? 0} records; ` +
          `${result.new_issues_detected ?? 0} new issues detected.`
      );

      // Refresh all information after reconciliation.
      await Promise.all([
        loadDashboard(),
        loadIssues(),
        loadHistory(),
      ]);

      setTab(1);
    } catch (e: any) {
      setError(
        getErrorMessage(
          e,
          "Reconciliation failed. Please try again."
        )
      );
    } finally {
      setRunning(false);
    }
  };

  // ====================================================
  // OPEN ISSUE DETAILS
  // Backend: GET /data-quality/issues/{issue_id}
  // ====================================================

  const openIssue = async (issue: Issue) => {
    setSelected(issue);
    setDetails(null);
    setResolutionNote(issue.resolution_note ?? "");
    setError("");

    try {
      const response = await api.get<Issue>(
        `/data-quality/issues/${issue.id}`,
        {
          params: {
            company_id: companyId,
          },
        }
      );

      setDetails(response.data);
      setResolutionNote(
        response.data.resolution_note ?? ""
      );
    } catch (e: any) {
      setError(
        getErrorMessage(
          e,
          "Could not load issue details."
        )
      );
    }
  };

  // ====================================================
  // RESOLVE ISSUE
  // Backend:
  // PATCH /data-quality/issues/{issue_id}/resolve
  // resolution_note and company_id are query parameters.
  // ====================================================

  const resolveIssue = async () => {
    if (!selected) return;

    if (!resolutionNote.trim()) {
      setError("Please enter a resolution note.");
      return;
    }

    setSavingStatus(true);
    setError("");
    setNotice("");

    try {
      await api.patch(
        `/data-quality/issues/${selected.id}/resolve`,
        null,
        {
          params: {
            company_id: companyId,
            resolution_note: resolutionNote.trim(),
            ...(user?.id ? { resolved_by: user.id } : {}),
          },
        }
      );

      setNotice(
        `Issue ${selected.issue_key} resolved successfully.`
      );

      setSelected(null);
      setDetails(null);

      await Promise.all([
        loadDashboard(),
        loadIssues(),
        loadHistory(),
      ]);
    } catch (e: any) {
      setError(
        getErrorMessage(
          e,
          "Could not resolve the issue."
        )
      );
    } finally {
      setSavingStatus(false);
    }
  };

  // ====================================================
  // CLEAR FILTERS
  // ====================================================

  const clearFilters = () => {
    setSearch("");
    setSeverity("");
    setModuleFilter("");
    setStatus("");
    setPage(0);
  };

  // ====================================================
  // KPI CARDS
  // ====================================================

  const latestRun = history[0];

  const kpis = [
    {
      label: "Records Checked",
      value: latestRun?.records_checked ?? 0,
      icon: <FactCheck />,
      color: "#2563eb",
    },
    {
      label: "Open Issues",
      value: dashboard.open_issues,
      icon: <WarningAmber />,
      color: "#d97706",
    },
    {
      label: "Critical Issues",
      value: dashboard.critical_issues,
      icon: <WarningAmber />,
      color: "#dc2626",
    },
    {
      label: "Warnings",
      value: dashboard.warning_issues,
      icon: <WarningAmber />,
      color: "#b45309",
    },
    {
      label: "Resolved Issues",
      value: dashboard.resolved_issues,
      icon: <TaskAlt />,
      color: "#059669",
    },
  ];

  const severityColor = (
    value: string
  ): "error" | "warning" | "info" => {
    if (value === "CRITICAL" || value === "ERROR") {
      return "error";
    }

    if (value === "WARNING") {
      return "warning";
    }

    return "info";
  };

  const statusColor = (
    value: string
  ): "error" | "warning" | "success" | "default" => {
    if (value === "OPEN") return "error";
    if (value === "INVESTIGATING") return "warning";
    if (value === "RESOLVED") return "success";

    return "default";
  };

  // ====================================================
  // UI
  // ====================================================

  return (
    <Box
      sx={{
        p: { xs: 2, md: 3 },
        maxWidth: 1600,
        mx: "auto",
      }}
    >
      {/* PAGE HEADER */}

      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", sm: "center" }}
        spacing={2}
        sx={{ mb: 2.5 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Data Quality & Reconciliation
          </Typography>

          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            Find, investigate, and track inconsistencies across
            RetailPulse data.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => void refresh()}
            disabled={loading || running}
          >
            Refresh
          </Button>

          <Button
            variant="contained"
            startIcon={
              running ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                <PlayArrow />
              )
            }
            onClick={() => void runReconciliation()}
            disabled={running || loading}
          >
            {running ? "Reconciling..." : "Run Reconciliation"}
          </Button>
        </Stack>
      </Stack>

      {/* ERROR / SUCCESS MESSAGES */}

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          onClose={() => setError("")}
        >
          {error}
        </Alert>
      )}

      {notice && (
        <Alert
          severity="success"
          sx={{ mb: 2 }}
          onClose={() => setNotice("")}
        >
          {notice}
        </Alert>
      )}

      {/* SUMMARY CARDS */}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            lg: "repeat(5, 1fr)",
          },
          gap: 2,
          mb: 2.5,
        }}
      >
        {kpis.map((item) => (
          <Card
            key={item.label}
            variant="outlined"
            sx={{ borderRadius: 3 }}
          >
            <CardContent
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
              }}
            >
              <Box
                sx={{
                  p: 1.2,
                  borderRadius: 2,
                  color: item.color,
                  bgcolor: `${item.color}14`,
                  display: "flex",
                }}
              >
                {item.icon}
              </Box>

              <Box>
                <Typography
                  color="text.secondary"
                  variant="body2"
                >
                  {item.label}
                </Typography>

                <Typography variant="h5" fontWeight={800}>
                  {loading
                    ? "—"
                    : item.value.toLocaleString()}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* LAST RECONCILIATION */}

      <Card
        variant="outlined"
        sx={{ borderRadius: 3, mb: 2.5 }}
      >
        <CardContent
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Box sx={{ flexGrow: 1 }}>
            <Typography fontWeight={700}>
              Last Reconciliation
            </Typography>

            <Typography
              color="text.secondary"
              variant="body2"
            >
              {niceDate(latestRun?.started_at)}
              {" · "}
              Status: {latestRun?.status ?? "Not run yet"}
            </Typography>

            <Typography
              color="text.secondary"
              variant="body2"
              sx={{ mt: 0.5 }}
            >
              Total recorded runs: {totalRuns}
              {" · "}
              Total issues: {dashboard.total_issues}
            </Typography>
          </Box>

          <Chip
            label={`${dashboard.open_issues} open issues`}
            color={
              dashboard.open_issues > 0
                ? "warning"
                : "success"
            }
          />
        </CardContent>
      </Card>

      {/* ISSUES AND HISTORY */}

      <Card variant="outlined" sx={{ borderRadius: 3 }}>
        <Tabs
          value={tab}
          onChange={(_, value) => setTab(value)}
          sx={{
            px: 2,
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
          <Tab label={`Issues (${totalIssues})`} />
          <Tab label="Reconciliation History" />
        </Tabs>

        {/* ISSUES TAB */}

        {tab === 0 && (
          <Box sx={{ p: 2 }}>
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={1.2}
              useFlexGap
              flexWrap="wrap"
              sx={{ mb: 2 }}
            >
              <TextField
                size="small"
                label="Search issues"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(0);
                }}
                InputProps={{
                  startAdornment: (
                    <Search
                      sx={{
                        mr: 1,
                        color: "text.secondary",
                      }}
                    />
                  ),
                }}
                sx={{ minWidth: 210 }}
              />

              <FormControl
                size="small"
                sx={{ minWidth: 145 }}
              >
                <InputLabel>Severity</InputLabel>

                <Select
                  label="Severity"
                  value={severity}
                  onChange={(event) => {
                    setSeverity(event.target.value);
                    setPage(0);
                  }}
                >
                  <MenuItem value="">All severities</MenuItem>
                  <MenuItem value="CRITICAL">Critical</MenuItem>
                  <MenuItem value="WARNING">Warning</MenuItem>
                  <MenuItem value="ERROR">Error</MenuItem>
                  <MenuItem value="INFO">Info</MenuItem>
                </Select>
              </FormControl>

              <FormControl
                size="small"
                sx={{ minWidth: 155 }}
              >
                <InputLabel>Module</InputLabel>

                <Select
                  label="Module"
                  value={moduleFilter}
                  onChange={(event) => {
                    setModuleFilter(event.target.value);
                    setPage(0);
                  }}
                >
                  <MenuItem value="">All modules</MenuItem>

                  {[
                    "PRODUCTS",
                    "INVENTORY",
                    "SALES",
                    "CUSTOMERS",
                    "STOCK_MOVEMENTS",
                    "REPORTS",
                  ].map((value) => (
                    <MenuItem key={value} value={value}>
                      {value.replaceAll("_", " ")}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl
                size="small"
                sx={{ minWidth: 145 }}
              >
                <InputLabel>Status</InputLabel>

                <Select
                  label="Status"
                  value={status}
                  onChange={(event) => {
                    setStatus(event.target.value);
                    setPage(0);
                  }}
                >
                  <MenuItem value="">All statuses</MenuItem>
                  <MenuItem value="OPEN">Open</MenuItem>
                  <MenuItem value="RESOLVED">Resolved</MenuItem>
                </Select>
              </FormControl>

              <Button onClick={clearFilters}>
                Clear Filters
              </Button>
            </Stack>

            <Divider sx={{ mb: 1 }} />

            {loading ? (
              <Box sx={{ py: 8, textAlign: "center" }}>
                <CircularProgress />

                <Typography
                  sx={{ mt: 1 }}
                  color="text.secondary"
                >
                  Loading data quality issues...
                </Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      {[
                        "Issue ID",
                        "Issue",
                        "Severity",
                        "Module",
                        "Record",
                        "Detected",
                        "Status",
                        "Actions",
                      ].map((heading) => (
                        <TableCell
                          key={heading}
                          sx={{
                            fontWeight: 800,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {heading}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {issues.map((issue) => (
                      <TableRow hover key={issue.id}>
                        <TableCell>
                          {issue.issue_key}
                        </TableCell>

                        <TableCell sx={{ minWidth: 240 }}>
                          <Typography
                            fontWeight={700}
                            variant="body2"
                          >
                            {issue.title}
                          </Typography>

                          <Typography
                            variant="caption"
                            color="text.secondary"
                          >
                            {issue.description}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Chip
                            size="small"
                            label={issue.severity}
                            color={severityColor(issue.severity)}
                          />
                        </TableCell>

                        <TableCell>
                          {issue.module.replaceAll("_", " ")}
                        </TableCell>

                        <TableCell>
                          {issue.record_type} #{issue.record_id}
                        </TableCell>

                        <TableCell sx={{ whiteSpace: "nowrap" }}>
                          {niceDate(issue.detected_at)}
                        </TableCell>

                        <TableCell>
                          <Chip
                            size="small"
                            label={issue.status}
                            color={statusColor(issue.status)}
                          />
                        </TableCell>

                        <TableCell>
                          <Button
                            size="small"
                            onClick={() => void openIssue(issue)}
                          >
                            Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}

                    {issues.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} align="center">
                          <Box sx={{ py: 5 }}>
                            <TaskAlt
                              sx={{
                                fontSize: 42,
                                color: "success.main",
                              }}
                            />

                            <Typography fontWeight={700}>
                              No issues found
                            </Typography>

                            <Typography
                              variant="body2"
                              color="text.secondary"
                            >
                              No matching issues were found.
                              Run reconciliation to scan your data.
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            <TablePagination
              component="div"
              count={totalIssues}
              page={page}
              onPageChange={(_, nextPage) =>
                setPage(nextPage)
              }
              rowsPerPage={pageSize}
              onRowsPerPageChange={(event) => {
                setPageSize(Number(event.target.value));
                setPage(0);
              }}
              rowsPerPageOptions={[10, 20, 50, 100]}
            />
          </Box>
        )}

        {/* RECONCILIATION HISTORY TAB */}

        {tab === 1 && (
          <Box sx={{ p: 2 }}>
            {loading ? (
              <Box sx={{ py: 6, textAlign: "center" }}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      {[
                        "Run ID",
                        "Started",
                        "Completed",
                        "Triggered By",
                        "Records Checked",
                        "Issues Detected",
                        "Issues Resolved",
                        "Failed Checks",
                        "Status",
                      ].map((heading) => (
                        <TableCell
                          key={heading}
                          sx={{
                            fontWeight: 800,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {heading}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {history.map((run) => (
                      <TableRow key={run.id} hover>
                        <TableCell>
                          DQ-RUN-{run.id}
                        </TableCell>

                        <TableCell sx={{ whiteSpace: "nowrap" }}>
                          {niceDate(run.started_at)}
                        </TableCell>

                        <TableCell sx={{ whiteSpace: "nowrap" }}>
                          {niceDate(run.completed_at)}
                        </TableCell>

                        <TableCell>
                          {run.triggered_by ?? "System"}
                        </TableCell>

                        <TableCell>
                          {run.records_checked}
                        </TableCell>

                        <TableCell>
                          {run.issues_detected}
                        </TableCell>

                        <TableCell>
                          {run.issues_resolved}
                        </TableCell>

                        <TableCell>
                          {run.failed_checks}
                        </TableCell>

                        <TableCell>
                          <Chip
                            size="small"
                            label={run.status}
                            color={
                              run.status === "FAILED"
                                ? "error"
                                : run.status === "SUCCESS"
                                  ? "success"
                                  : "warning"
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ))}

                    {history.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={9} align="center">
                          <Box sx={{ py: 5 }}>
                            <Typography fontWeight={700}>
                              No reconciliation runs yet
                            </Typography>

                            <Typography
                              variant="body2"
                              color="text.secondary"
                            >
                              Select Run Reconciliation to start
                              the first check.
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        )}
      </Card>

      {/* ISSUE DETAILS DIALOG */}

      <Dialog
        open={Boolean(selected)}
        onClose={() => {
          setSelected(null);
          setDetails(null);
        }}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          Issue Details
          {selected ? ` · ${selected.issue_key}` : ""}
        </DialogTitle>

        <DialogContent dividers>
          {selected && (
            <Stack spacing={1.5}>
              <Typography variant="h6" fontWeight={800}>
                {selected.title}
              </Typography>

              <Typography>
                {selected.description}
              </Typography>

              <Stack
                direction="row"
                spacing={1}
                flexWrap="wrap"
              >
                <Chip
                  label={selected.severity}
                  color={severityColor(selected.severity)}
                />

                <Chip label={selected.module} />

                <Chip
                  label={selected.status}
                  color={statusColor(selected.status)}
                />
              </Stack>

              <Typography
                variant="body2"
                color="text.secondary"
              >
                Detected: {niceDate(selected.detected_at)}
              </Typography>

              <Divider />

              <Typography fontWeight={700}>
                Record Context
              </Typography>

              {details === null ? (
                <CircularProgress size={24} />
              ) : (
                <Box
                  component="pre"
                  sx={{
                    p: 1.5,
                    bgcolor: "action.hover",
                    borderRadius: 2,
                    whiteSpace: "pre-wrap",
                    overflowWrap: "anywhere",
                    fontSize: 12,
                  }}
                >
                  {JSON.stringify(
                    details.details ?? {},
                    null,
                    2
                  )}
                </Box>
              )}

              <Divider />

              <Typography fontWeight={700}>
                Resolve Issue
              </Typography>

              <TextField
                label="Resolution Note"
                value={resolutionNote}
                onChange={(event) =>
                  setResolutionNote(event.target.value)
                }
                multiline
                minRows={3}
                fullWidth
                required
                disabled={selected.status === "RESOLVED"}
                helperText="Enter the action taken to resolve this issue."
              />

              {selected.resolution_note && (
                <Alert severity="info">
                  Existing resolution note:{" "}
                  {selected.resolution_note}
                </Alert>
              )}
            </Stack>
          )}
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() => {
              setSelected(null);
              setDetails(null);
            }}
          >
            Close
          </Button>

          {selected?.status !== "RESOLVED" && (
            <Button
              variant="contained"
              onClick={() => void resolveIssue()}
              disabled={
                savingStatus ||
                !resolutionNote.trim() ||
                details === null
              }
            >
              {savingStatus
                ? "Saving..."
                : "Resolve Issue"}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}

