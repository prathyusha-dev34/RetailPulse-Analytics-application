
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import VisibilityIcon from "@mui/icons-material/Visibility";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import HistoryIcon from "@mui/icons-material/History";

import {
  getAuditLogs,
  getAuditLog,
} from "../api/authApi";

import type {
  AuditLog,
} from "../api/authApi";


/* =========================================================
   CONSTANTS
========================================================= */

const API_BASE_URL =
  "http://127.0.0.1:8000/api";


const filterInputSx = {
  "& .MuiInputLabel-root": {
    color: "#ffffff",
  },

  "& .MuiInputLabel-root.Mui-focused": {
    color: "#ffffff",
  },

  "& .MuiOutlinedInput-root": {
    color: "#ffffff",

    "& fieldset": {
      borderColor: "rgba(255,255,255,0.35)",
    },

    "&:hover fieldset": {
      borderColor: "rgba(255,255,255,0.65)",
    },

    "&.Mui-focused fieldset": {
      borderColor: "#ffffff",
    },
  },

  "& .MuiInputBase-input": {
    color: "#ffffff",
  },

  "& .MuiInputBase-input::placeholder": {
    color: "rgba(255,255,255,0.65)",
    opacity: 1,
  },

  "& input[type='date']::-webkit-calendar-picker-indicator": {
    filter: "invert(1)",
  },
};


const selectInputSx = {
  color: "#ffffff",

  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(255,255,255,0.35)",
  },

  "&:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(255,255,255,0.65)",
  },

  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: "#ffffff",
  },

  "& .MuiSvgIcon-root": {
    color: "#ffffff",
  },
};


const menuProps = {
  PaperProps: {
    sx: {
      backgroundColor: "#1f2937",
      color: "#ffffff",

      "& .MuiMenuItem-root": {
        color: "#ffffff",
      },

      "& .MuiMenuItem-root:hover": {
        backgroundColor: "rgba(255,255,255,0.10)",
      },

      "& .MuiMenuItem-root.Mui-selected": {
        backgroundColor: "rgba(255,255,255,0.15)",
      },

      "& .MuiMenuItem-root.Mui-selected:hover": {
        backgroundColor: "rgba(255,255,255,0.20)",
      },
    },
  },
};


/* =========================================================
   COMPONENT
========================================================= */

const AuditLogs: React.FC = () => {
  /* -------------------------------------------------------
     DATA
  ------------------------------------------------------- */

  const [logs, setLogs] = useState<AuditLog[]>([]);

  const [selectedLog, setSelectedLog] =
    useState<AuditLog | null>(null);


  /* -------------------------------------------------------
     LOADING / ERROR
  ------------------------------------------------------- */

  const [loading, setLoading] =
    useState<boolean>(true);

  const [error, setError] =
    useState<string>("");


  /* -------------------------------------------------------
     SEARCH / FILTERS
  ------------------------------------------------------- */

  const [search, setSearch] =
    useState<string>("");

  const [action, setAction] =
    useState<string>("");

  const [resourceType, setResourceType] =
    useState<string>("");

  const [status, setStatus] =
    useState<string>("");

  const [userId, setUserId] =
    useState<string>("");

  const [startDate, setStartDate] =
    useState<string>("");

  const [endDate, setEndDate] =
    useState<string>("");


  /* -------------------------------------------------------
     PAGINATION
  ------------------------------------------------------- */

  const [page, setPage] =
    useState<number>(0);

  const [rowsPerPage, setRowsPerPage] =
    useState<number>(25);


  /* -------------------------------------------------------
     SORTING
  ------------------------------------------------------- */

  const [sortBy, setSortBy] =
    useState<string>("created_at");

  const [sortOrder, setSortOrder] =
    useState<"asc" | "desc">("desc");


  /* -------------------------------------------------------
     DETAILS DIALOG
  ------------------------------------------------------- */

  const [detailsOpen, setDetailsOpen] =
    useState<boolean>(false);

  const [detailsLoading, setDetailsLoading] =
    useState<boolean>(false);


  /* =======================================================
     FETCH AUDIT LOGS
  ======================================================= */

  const fetchLogs = useCallback(
    async (showLoader = true) => {
      try {
        if (showLoader) {
          setLoading(true);
        }

        setError("");

        const params: Record<string, unknown> = {
          page: page + 1,
          page_size: rowsPerPage,
          sort_by: sortBy,
          sort_order: sortOrder,
        };

        if (search.trim()) {
          params.search = search.trim();
        }

        if (action) {
          params.action = action;
        }

        if (resourceType) {
          params.resource_type = resourceType;
        }

        if (status) {
          params.status = status;
        }

        if (userId.trim()) {
          const parsedUserId =
            Number(userId);

          if (!Number.isNaN(parsedUserId)) {
            params.user_id = parsedUserId;
          }
        }

        if (startDate) {
          params.start_date =
            `${startDate}T00:00:00`;
        }

        if (endDate) {
          params.end_date =
            `${endDate}T23:59:59`;
        }

        const response =
          await getAuditLogs(params);

        setLogs(
          Array.isArray(response.data)
            ? response.data
            : []
        );
      } catch (err: any) {
        console.error(
          "Failed to load audit logs:",
          err
        );

        setError(
          err?.response?.data?.detail ||
            "Failed to load audit logs."
        );

        setLogs([]);
      } finally {
        if (showLoader) {
          setLoading(false);
        }
      }
    },
    [
      page,
      rowsPerPage,
      search,
      action,
      resourceType,
      status,
      userId,
      startDate,
      endDate,
      sortBy,
      sortOrder,
    ]
  );


  /* =======================================================
     INITIAL LOAD + FILTER CHANGE
  ======================================================= */

  useEffect(() => {
    fetchLogs(true);
  }, [fetchLogs]);


  /* =======================================================
     REAL-TIME POLLING
  ======================================================= */

  useEffect(() => {
    const interval =
      window.setInterval(() => {
        fetchLogs(false);
      }, 15000);

    return () => {
      window.clearInterval(interval);
    };
  }, [fetchLogs]);


  /* =======================================================
     OPEN DETAILS
  ======================================================= */

  const handleViewDetails = async (
    logId: number
  ) => {
    try {
      setDetailsLoading(true);
      setDetailsOpen(true);

      const response =
        await getAuditLog(logId);

      setSelectedLog(response.data);
    } catch (err: any) {
      console.error(
        "Failed to load audit log:",
        err
      );

      setError(
        err?.response?.data?.detail ||
          "Failed to load audit log details."
      );

      setDetailsOpen(false);
    } finally {
      setDetailsLoading(false);
    }
  };


  /* =======================================================
     CLOSE DETAILS
  ======================================================= */

  const handleCloseDetails = () => {
    setDetailsOpen(false);
    setSelectedLog(null);
  };


  /* =======================================================
     CLEAR FILTERS
  ======================================================= */

  const handleClearFilters = () => {
    setSearch("");
    setAction("");
    setResourceType("");
    setStatus("");
    setUserId("");
    setStartDate("");
    setEndDate("");

    setPage(0);
  };


  /* =======================================================
     SORT
  ======================================================= */

  const handleSort = (
    column: string
  ) => {
    if (sortBy === column) {
      setSortOrder(
        (previous) =>
          previous === "asc"
            ? "desc"
            : "asc"
      );
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }

    setPage(0);
  };


  /* =======================================================
     CSV EXPORT
  ======================================================= */

  const handleCsvExport = async () => {
    try {
      const token =
        localStorage.getItem(
          "accessToken"
        );

      const params =
        new URLSearchParams();

      if (search.trim()) {
        params.append(
          "search",
          search.trim()
        );
      }

      if (action) {
        params.append(
          "action",
          action
        );
      }

      if (resourceType) {
        params.append(
          "resource_type",
          resourceType
        );
      }

      if (status) {
        params.append(
          "status",
          status
        );
      }

      if (userId.trim()) {
        params.append(
          "user_id",
          userId.trim()
        );
      }

      if (startDate) {
        params.append(
          "start_date",
          `${startDate}T00:00:00`
        );
      }

      if (endDate) {
        params.append(
          "end_date",
          `${endDate}T23:59:59`
        );
      }

      params.append(
        "sort_by",
        sortBy
      );

      params.append(
        "sort_order",
        sortOrder
      );

      const response =
        await fetch(
          `${API_BASE_URL}/audit/logs/export/csv?${params.toString()}`,
          {
            method: "GET",

            headers: token
              ? {
                  Authorization:
                    `Bearer ${token}`,
                }
              : {},
          }
        );

      if (!response.ok) {
        throw new Error(
          "CSV export failed"
        );
      }

      const blob =
        await response.blob();

      const url =
        window.URL.createObjectURL(
          blob
        );

      const link =
        document.createElement("a");

      link.href = url;

      link.download =
        `audit_logs_${new Date()
          .toISOString()
          .slice(0, 10)}.csv`;

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(
        "CSV export failed:",
        err
      );

      setError(
        "CSV export failed."
      );
    }
  };


  /* =======================================================
     PDF EXPORT
  ======================================================= */

  const handlePdfExport = async () => {
    try {
      const token =
        localStorage.getItem(
          "accessToken"
        );

      const params =
        new URLSearchParams();

      if (search.trim()) {
        params.append(
          "search",
          search.trim()
        );
      }

      if (action) {
        params.append(
          "action",
          action
        );
      }

      if (resourceType) {
        params.append(
          "resource_type",
          resourceType
        );
      }

      if (status) {
        params.append(
          "status",
          status
        );
      }

      if (userId.trim()) {
        params.append(
          "user_id",
          userId.trim()
        );
      }

      if (startDate) {
        params.append(
          "start_date",
          `${startDate}T00:00:00`
        );
      }

      if (endDate) {
        params.append(
          "end_date",
          `${endDate}T23:59:59`
        );
      }

      params.append(
        "sort_by",
        sortBy
      );

      params.append(
        "sort_order",
        sortOrder
      );

      const response =
        await fetch(
          `${API_BASE_URL}/audit/logs/export/pdf?${params.toString()}`,
          {
            method: "GET",

            headers: token
              ? {
                  Authorization:
                    `Bearer ${token}`,
                }
              : {},
          }
        );

      if (!response.ok) {
        throw new Error(
          "PDF export failed"
        );
      }

      const blob =
        await response.blob();

      const url =
        window.URL.createObjectURL(
          blob
        );

      const link =
        document.createElement("a");

      link.href = url;

      link.download =
        `audit_logs_${new Date()
          .toISOString()
          .slice(0, 10)}.pdf`;

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(
        "PDF export failed:",
        err
      );

      setError(
        "PDF export failed."
      );
    }
  };


  /* =======================================================
     UNIQUE FILTER VALUES
  ======================================================= */

  const actionOptions =
    useMemo(() => {
      const values =
        logs
          .map(
            (log) =>
              log.action
          )
          .filter(Boolean);

      return Array.from(
        new Set(values)
      ).sort();
    }, [logs]);


  const resourceOptions =
    useMemo(() => {
      const values =
        logs
          .map(
            (log) =>
              log.resource_type
          )
          .filter(Boolean) as string[];

      return Array.from(
        new Set(values)
      ).sort();
    }, [logs]);


  const statusOptions =
    useMemo(() => {
      const values =
        logs
          .map(
            (log) =>
              log.status
          )
          .filter(Boolean) as string[];

      return Array.from(
        new Set(values)
      ).sort();
    }, [logs]);


  /* =======================================================
     SUMMARY
  ======================================================= */

  const successCount =
    logs.filter(
      (log) =>
        log.status === "SUCCESS"
    ).length;

  const loginCount =
    logs.filter(
      (log) =>
        log.action
          ?.toLowerCase()
          .includes("login")
    ).length;


  /* =======================================================
     STATUS CHIP
  ======================================================= */

  const renderStatus = (
    value?: string | null
  ) => {
    const normalized =
      value?.toUpperCase() ||
      "UNKNOWN";

    return (
      <Chip
        label={normalized}
        size="small"
        sx={{
          fontWeight: 700,
          color: "#ffffff",
          backgroundColor:
            normalized === "SUCCESS"
              ? "#166534"
              : normalized === "FAILED"
              ? "#991b1b"
              : "#374151",
        }}
      />
    );
  };


  /* =======================================================
     SORT ICON
  ======================================================= */

  const renderSortIcon = (
    column: string
  ) => {
    if (sortBy !== column) {
      return null;
    }

    return sortOrder === "asc" ? (
      <ArrowUpwardIcon
        sx={{
          fontSize: 15,
          ml: 0.5,
        }}
      />
    ) : (
      <ArrowDownwardIcon
        sx={{
          fontSize: 15,
          ml: 0.5,
        }}
      />
    );
  };


  /* =======================================================
     TABLE HEADER STYLE
  ======================================================= */

  const headerCellSx = {
    color: "#ffffff",
    fontWeight: 700,
    backgroundColor: "#111827",
    whiteSpace: "nowrap",
    borderBottom:
      "1px solid rgba(255,255,255,0.15)",
  };


  /* =======================================================
     TABLE BODY STYLE
  ======================================================= */

  const bodyCellSx = {
    color: "#ffffff",
    borderBottom:
      "1px solid rgba(255,255,255,0.08)",
  };


  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "#0f172a",
        color: "#ffffff",
        p: 3,
      }}
    >

      {/* ===================================================
          HEADER
      =================================================== */}

      <Stack
        direction={{
          xs: "column",
          md: "row",
        }}
        justifyContent="space-between"
        alignItems={{
          xs: "flex-start",
          md: "center",
        }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
          >
            <HistoryIcon
              sx={{
                color: "#ffffff",
                fontSize: 30,
              }}
            />

            <Typography
              variant="h4"
              sx={{
                color: "#ffffff",
                fontWeight: 700,
              }}
            >
              Audit Logs
            </Typography>
          </Stack>

          <Typography
            sx={{
              color:
                "rgba(255,255,255,0.65)",
              mt: 0.5,
            }}
          >
            Monitor user activities and
            system actions
          </Typography>
        </Box>


        <Stack
          direction="row"
          spacing={1}
          flexWrap="wrap"
        >
          <Button
            variant="outlined"
            startIcon={
              <RefreshIcon />
            }
            onClick={() =>
              fetchLogs(true)
            }
            sx={{
              color: "#ffffff",
              borderColor:
                "rgba(255,255,255,0.4)",
            }}
          >
            Refresh
          </Button>

          <Button
            variant="outlined"
            startIcon={
              <FileDownloadIcon />
            }
            onClick={
              handleCsvExport
            }
            sx={{
              color: "#ffffff",
              borderColor:
                "rgba(255,255,255,0.4)",
            }}
          >
            CSV
          </Button>

          <Button
            variant="outlined"
            startIcon={
              <PictureAsPdfIcon />
            }
            onClick={
              handlePdfExport
            }
            sx={{
              color: "#ffffff",
              borderColor:
                "rgba(255,255,255,0.4)",
            }}
          >
            PDF
          </Button>
        </Stack>
      </Stack>


      {/* ===================================================
          ERROR
      =================================================== */}

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          onClose={() =>
            setError("")
          }
        >
          {error}
        </Alert>
      )}


      {/* ===================================================
          SUMMARY CARDS
      =================================================== */}

      <Grid
        container
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Grid
          size={{
            xs: 12,
            sm: 4,
          }}
        >
          <Paper
            sx={{
              p: 2,
              backgroundColor:
                "#1e293b",
              color: "#ffffff",
              border:
                "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <Typography
              sx={{
                color:
                  "rgba(255,255,255,0.65)",
                fontSize: 13,
              }}
            >
              Current Page Records
            </Typography>

            <Typography
              variant="h4"
              sx={{
                color: "#ffffff",
                fontWeight: 700,
                mt: 0.5,
              }}
            >
              {logs.length}
            </Typography>
          </Paper>
        </Grid>


        <Grid
          size={{
            xs: 12,
            sm: 4,
          }}
        >
          <Paper
            sx={{
              p: 2,
              backgroundColor:
                "#1e293b",
              color: "#ffffff",
              border:
                "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <Typography
              sx={{
                color:
                  "rgba(255,255,255,0.65)",
                fontSize: 13,
              }}
            >
              Successful Actions
            </Typography>

            <Typography
              variant="h4"
              sx={{
                color: "#ffffff",
                fontWeight: 700,
                mt: 0.5,
              }}
            >
              {successCount}
            </Typography>
          </Paper>
        </Grid>


        <Grid
          size={{
            xs: 12,
            sm: 4,
          }}
        >
          <Paper
            sx={{
              p: 2,
              backgroundColor:
                "#1e293b",
              color: "#ffffff",
              border:
                "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <Typography
              sx={{
                color:
                  "rgba(255,255,255,0.65)",
                fontSize: 13,
              }}
            >
              Login Activities
            </Typography>

            <Typography
              variant="h4"
              sx={{
                color: "#ffffff",
                fontWeight: 700,
                mt: 0.5,
              }}
            >
              {loginCount}
            </Typography>
          </Paper>
        </Grid>
      </Grid>


      {/* ===================================================
          SEARCH & FILTERS
      =================================================== */}

      <Paper
        sx={{
          p: 2.5,
          mb: 3,
          backgroundColor:
            "#1e293b",
          color: "#ffffff",
          border:
            "1px solid rgba(255,255,255,0.08)",
        }}
      >

        <Typography
          variant="h6"
          sx={{
            color: "#ffffff",
            fontWeight: 700,
            mb: 2,
          }}
        >
          Search & Filters
        </Typography>


        <Grid
          container
          spacing={2}
        >

          {/* SEARCH */}

          <Grid
            size={{
              xs: 12,
              md: 4,
            }}
          >
            <TextField
              fullWidth
              label="Search"
              placeholder="Search action, resource, ID, description..."
              value={search}
              onChange={(event) => {
                setSearch(
                  event.target.value
                );
                setPage(0);
              }}
              sx={filterInputSx}
              slotProps={{
                input: {
                  startAdornment: (
                    <SearchIcon
                      sx={{
                        color:
                          "rgba(255,255,255,0.7)",
                        mr: 1,
                      }}
                    />
                  ),
                },
              }}
            />
          </Grid>


          {/* ACTION */}

          <Grid
            size={{
              xs: 12,
              sm: 6,
              md: 2,
            }}
          >
            <FormControl
              fullWidth
            >
              <InputLabel
                sx={{
                  color: "#ffffff",
                  "&.Mui-focused": {
                    color: "#ffffff",
                  },
                }}
              >
                Action
              </InputLabel>

              <Select
                value={action}
                label="Action"
                onChange={(event) => {
                  setAction(
                    event.target.value
                  );
                  setPage(0);
                }}
                sx={selectInputSx}
                MenuProps={menuProps}
              >
                <MenuItem value="">
                  All Actions
                </MenuItem>

                {actionOptions.map(
                  (value) => (
                    <MenuItem
                      key={value}
                      value={value}
                    >
                      {value}
                    </MenuItem>
                  )
                )}
              </Select>
            </FormControl>
          </Grid>


          {/* RESOURCE TYPE */}

          <Grid
            size={{
              xs: 12,
              sm: 6,
              md: 2,
            }}
          >
            <FormControl
              fullWidth
            >
              <InputLabel
                sx={{
                  color: "#ffffff",
                  "&.Mui-focused": {
                    color: "#ffffff",
                  },
                }}
              >
                Resource Type
              </InputLabel>

              <Select
                value={resourceType}
                label="Resource Type"
                onChange={(event) => {
                  setResourceType(
                    event.target.value
                  );
                  setPage(0);
                }}
                sx={selectInputSx}
                MenuProps={menuProps}
              >
                <MenuItem value="">
                  All Resources
                </MenuItem>

                {resourceOptions.map(
                  (value) => (
                    <MenuItem
                      key={value}
                      value={value}
                    >
                      {value}
                    </MenuItem>
                  )
                )}
              </Select>
            </FormControl>
          </Grid>


          {/* STATUS */}

          <Grid
            size={{
              xs: 12,
              sm: 6,
              md: 2,
            }}
          >
            <FormControl
              fullWidth
            >
              <InputLabel
                sx={{
                  color: "#ffffff",
                  "&.Mui-focused": {
                    color: "#ffffff",
                  },
                }}
              >
                Status
              </InputLabel>

              <Select
                value={status}
                label="Status"
                onChange={(event) => {
                  setStatus(
                    event.target.value
                  );
                  setPage(0);
                }}
                sx={selectInputSx}
                MenuProps={menuProps}
              >
                <MenuItem value="">
                  All Status
                </MenuItem>

                {statusOptions.map(
                  (value) => (
                    <MenuItem
                      key={value}
                      value={value}
                    >
                      {value}
                    </MenuItem>
                  )
                )}
              </Select>
            </FormControl>
          </Grid>


          {/* USER ID */}

          <Grid
            size={{
              xs: 12,
              sm: 6,
              md: 2,
            }}
          >
            <TextField
              fullWidth
              label="User ID"
              type="number"
              value={userId}
              onChange={(event) => {
                setUserId(
                  event.target.value
                );
                setPage(0);
              }}
              sx={filterInputSx}
            />
          </Grid>


          {/* START DATE */}

          <Grid
            size={{
              xs: 12,
              sm: 6,
              md: 3,
            }}
          >
            <TextField
              fullWidth
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(event) => {
                setStartDate(
                  event.target.value
                );
                setPage(0);
              }}
              sx={filterInputSx}
              slotProps={{
                inputLabel: {
                  shrink: true,
                },
              }}
            />
          </Grid>


          {/* END DATE */}

          <Grid
            size={{
              xs: 12,
              sm: 6,
              md: 3,
            }}
          >
            <TextField
              fullWidth
              label="End Date"
              type="date"
              value={endDate}
              onChange={(event) => {
                setEndDate(
                  event.target.value
                );
                setPage(0);
              }}
              sx={filterInputSx}
              slotProps={{
                inputLabel: {
                  shrink: true,
                },
              }}
            />
          </Grid>


          {/* CLEAR */}

          <Grid
            size={{
              xs: 12,
              md: 2,
            }}
          >
            <Button
              fullWidth
              variant="outlined"
              startIcon={
                <ClearIcon />
              }
              onClick={
                handleClearFilters
              }
              sx={{
                height: "56px",
                color: "#ffffff",
                borderColor:
                  "rgba(255,255,255,0.35)",
                "&:hover": {
                  borderColor:
                    "#ffffff",
                },
              }}
            >
              Clear Filters
            </Button>
          </Grid>

        </Grid>
      </Paper>


      {/* ===================================================
          TABLE
      =================================================== */}

      <Paper
        sx={{
          backgroundColor:
            "#1e293b",
          color: "#ffffff",
          border:
            "1px solid rgba(255,255,255,0.08)",
          overflow: "hidden",
        }}
      >

        <TableContainer
          sx={{
            maxHeight: 650,
          }}
        >

          <Table
            stickyHeader
            size="small"
          >

            <TableHead>

              <TableRow>

                <TableCell
                  sx={headerCellSx}
                >
                  ID
                </TableCell>


                <TableCell
                  sx={headerCellSx}
                  onClick={() =>
                    handleSort(
                      "action"
                    )
                  }
                >
                  <Stack
                    direction="row"
                    alignItems="center"
                    sx={{
                      cursor:
                        "pointer",
                    }}
                  >
                    Action
                    {renderSortIcon(
                      "action"
                    )}
                  </Stack>
                </TableCell>


                <TableCell
                  sx={headerCellSx}
                >
                  User ID
                </TableCell>


                <TableCell
                  sx={headerCellSx}
                  onClick={() =>
                    handleSort(
                      "resource_type"
                    )
                  }
                >
                  <Stack
                    direction="row"
                    alignItems="center"
                    sx={{
                      cursor:
                        "pointer",
                    }}
                  >
                    Resource Type
                    {renderSortIcon(
                      "resource_type"
                    )}
                  </Stack>
                </TableCell>


                <TableCell
                  sx={headerCellSx}
                >
                  Resource ID
                </TableCell>


                <TableCell
                  sx={headerCellSx}
                >
                  Description
                </TableCell>


                <TableCell
                  sx={headerCellSx}
                >
                  IP Address
                </TableCell>


                <TableCell
                  sx={headerCellSx}
                >
                  Status
                </TableCell>


                <TableCell
                  sx={headerCellSx}
                  onClick={() =>
                    handleSort(
                      "created_at"
                    )
                  }
                >
                  <Stack
                    direction="row"
                    alignItems="center"
                    sx={{
                      cursor:
                        "pointer",
                    }}
                  >
                    Timestamp
                    {renderSortIcon(
                      "created_at"
                    )}
                  </Stack>
                </TableCell>


                <TableCell
                  sx={headerCellSx}
                  align="center"
                >
                  Details
                </TableCell>

              </TableRow>

            </TableHead>


            <TableBody>

              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={10}
                    align="center"
                    sx={{
                      ...bodyCellSx,
                      py: 8,
                    }}
                  >
                    <CircularProgress
                      size={32}
                      sx={{
                        color:
                          "#ffffff",
                      }}
                    />

                    <Typography
                      sx={{
                        color:
                          "rgba(255,255,255,0.7)",
                        mt: 2,
                      }}
                    >
                      Loading audit logs...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={10}
                    align="center"
                    sx={{
                      ...bodyCellSx,
                      py: 8,
                    }}
                  >
                    <Typography
                      sx={{
                        color:
                          "rgba(255,255,255,0.7)",
                      }}
                    >
                      No audit logs found.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                logs.map(
                  (log) => (
                    <TableRow
                      key={log.id}
                      hover
                      sx={{
                        "&:hover": {
                          backgroundColor:
                            "rgba(255,255,255,0.04)",
                        },
                      }}
                    >

                      <TableCell
                        sx={bodyCellSx}
                      >
                        {log.id}
                      </TableCell>


                      <TableCell
                        sx={{
                          ...bodyCellSx,
                          fontWeight: 600,
                        }}
                      >
                        {log.action ||
                          "-"}
                      </TableCell>


                      <TableCell
                        sx={bodyCellSx}
                      >
                        {log.user_id ??
                          "-"}
                      </TableCell>


                      <TableCell
                        sx={bodyCellSx}
                      >
                        {log.resource_type ||
                          log.entity_name ||
                          "-"}
                      </TableCell>


                      <TableCell
                        sx={bodyCellSx}
                      >
                        {log.resource_id ||
                          "-"}
                      </TableCell>


                      <TableCell
                        sx={{
                          ...bodyCellSx,
                          maxWidth: 280,
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{
                            color:
                              "#ffffff",
                            overflow:
                              "hidden",
                            textOverflow:
                              "ellipsis",
                            whiteSpace:
                              "nowrap",
                          }}
                        >
                          {log.description ||
                            "-"}
                        </Typography>
                      </TableCell>


                      <TableCell
                        sx={bodyCellSx}
                      >
                        {log.ip_address ||
                          "-"}
                      </TableCell>


                      <TableCell
                        sx={bodyCellSx}
                      >
                        {renderStatus(
                          log.status
                        )}
                      </TableCell>


                      <TableCell
                        sx={{
                          ...bodyCellSx,
                          whiteSpace:
                            "nowrap",
                        }}
                      >
                        {log.created_at
                          ? new Date(
                              log.created_at
                            ).toLocaleString()
                          : "-"}
                      </TableCell>


                      <TableCell
                        sx={bodyCellSx}
                        align="center"
                      >
                        <Tooltip
                          title="View Details"
                        >
                          <IconButton
                            onClick={() =>
                              handleViewDetails(
                                log.id
                              )
                            }
                            sx={{
                              color:
                                "#ffffff",
                            }}
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>

                    </TableRow>
                  )
                )
              )}

            </TableBody>

          </Table>

        </TableContainer>


        {/* =================================================
            PAGINATION
        ================================================= */}

        <TablePagination
          component="div"
          count={
            logs.length < rowsPerPage
              ? page *
                  rowsPerPage +
                logs.length
              : (page + 2) *
                rowsPerPage
          }
          page={page}
          onPageChange={(
            _event,
            newPage
          ) => {
            setPage(newPage);
          }}
          rowsPerPage={
            rowsPerPage
          }
          onRowsPerPageChange={(
            event
          ) => {
            setRowsPerPage(
              Number(
                event.target.value
              )
            );
            setPage(0);
          }}
          rowsPerPageOptions={[
            10,
            25,
            50,
            100,
          ]}
          sx={{
            color: "#ffffff",

            "& .MuiTablePagination-selectLabel":
              {
                color:
                  "rgba(255,255,255,0.8)",
              },

            "& .MuiTablePagination-displayedRows":
              {
                color:
                  "rgba(255,255,255,0.8)",
              },

            "& .MuiSelect-select":
              {
                color:
                  "#ffffff",
              },

            "& .MuiSvgIcon-root":
              {
                color:
                  "#ffffff",
              },
          }}
        />

      </Paper>


      {/* ===================================================
          DETAILS DIALOG
      =================================================== */}

      <Dialog
        open={detailsOpen}
        onClose={
          handleCloseDetails
        }
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            backgroundColor:
              "#1e293b",
            color: "#ffffff",
          },
        }}
      >

        <DialogTitle
          sx={{
            color: "#ffffff",
            fontWeight: 700,
          }}
        >
          Audit Log Details
        </DialogTitle>


        <DialogContent dividers>

          {detailsLoading ? (
            <Box
              sx={{
                display: "flex",
                justifyContent:
                  "center",
                py: 5,
              }}
            >
              <CircularProgress
                sx={{
                  color:
                    "#ffffff",
                }}
              />
            </Box>
          ) : selectedLog ? (
            <Stack
              spacing={2}
            >

              <Grid
                container
                spacing={2}
              >

                <Grid
                  size={{
                    xs: 12,
                    sm: 6,
                  }}
                >
                  <Typography
                    sx={{
                      color:
                        "rgba(255,255,255,0.6)",
                      fontSize: 13,
                    }}
                  >
                    ID
                  </Typography>

                  <Typography
                    sx={{
                      color:
                        "#ffffff",
                    }}
                  >
                    {selectedLog.id}
                  </Typography>
                </Grid>


                <Grid
                  size={{
                    xs: 12,
                    sm: 6,
                  }}
                >
                  <Typography
                    sx={{
                      color:
                        "rgba(255,255,255,0.6)",
                      fontSize: 13,
                    }}
                  >
                    User ID
                  </Typography>

                  <Typography
                    sx={{
                      color:
                        "#ffffff",
                    }}
                  >
                    {selectedLog.user_id ??
                      "-"}
                  </Typography>
                </Grid>


                <Grid
                  size={{
                    xs: 12,
                    sm: 6,
                  }}
                >
                  <Typography
                    sx={{
                      color:
                        "rgba(255,255,255,0.6)",
                      fontSize: 13,
                    }}
                  >
                    Action
                  </Typography>

                  <Typography
                    sx={{
                      color:
                        "#ffffff",
                        fontWeight: 600,
                    }}
                  >
                    {selectedLog.action ||
                      "-"}
                  </Typography>
                </Grid>


                <Grid
                  size={{
                    xs: 12,
                    sm: 6,
                  }}
                >
                  <Typography
                    sx={{
                      color:
                        "rgba(255,255,255,0.6)",
                      fontSize: 13,
                    }}
                  >
                    Resource Type
                  </Typography>

                  <Typography
                    sx={{
                      color:
                        "#ffffff",
                    }}
                  >
                    {selectedLog.resource_type ||
                      selectedLog.entity_name ||
                      "-"}
                  </Typography>
                </Grid>


                <Grid
                  size={{
                    xs: 12,
                    sm: 6,
                  }}
                >
                  <Typography
                    sx={{
                      color:
                        "rgba(255,255,255,0.6)",
                      fontSize: 13,
                    }}
                  >
                    Resource ID
                  </Typography>

                  <Typography
                    sx={{
                      color:
                        "#ffffff",
                    }}
                  >
                    {selectedLog.resource_id ||
                      "-"}
                  </Typography>
                </Grid>


                <Grid
                  size={{
                    xs: 12,
                    sm: 6,
                  }}
                >
                  <Typography
                    sx={{
                      color:
                        "rgba(255,255,255,0.6)",
                      fontSize: 13,
                    }}
                  >
                    Status
                  </Typography>

                  <Box sx={{ mt: 0.5 }}>
                    {renderStatus(
                      selectedLog.status
                    )}
                  </Box>
                </Grid>


                <Grid
                  size={{
                    xs: 12,
                    sm: 6,
                  }}
                >
                  <Typography
                    sx={{
                      color:
                        "rgba(255,255,255,0.6)",
                      fontSize: 13,
                    }}
                  >
                    IP Address
                  </Typography>

                  <Typography
                    sx={{
                      color:
                        "#ffffff",
                    }}
                  >
                    {selectedLog.ip_address ||
                      "-"}
                  </Typography>
                </Grid>


                <Grid
                  size={{
                    xs: 12,
                    sm: 6,
                  }}
                >
                  <Typography
                    sx={{
                      color:
                        "rgba(255,255,255,0.6)",
                      fontSize: 13,
                    }}
                  >
                    Browser
                  </Typography>

                  <Typography
                    sx={{
                      color:
                        "#ffffff",
                        wordBreak:
                          "break-word",
                    }}
                  >
                    {selectedLog.browser ||
                      "-"}
                  </Typography>
                </Grid>


                <Grid
                  size={{
                    xs: 12,
                  }}
                >
                  <Typography
                    sx={{
                      color:
                        "rgba(255,255,255,0.6)",
                      fontSize: 13,
                    }}
                  >
                    User Agent
                  </Typography>

                  <Typography
                    sx={{
                      color:
                        "#ffffff",
                      wordBreak:
                        "break-word",
                    }}
                  >
                    {selectedLog.user_agent ||
                      "-"}
                  </Typography>
                </Grid>


                <Grid
                  size={{
                    xs: 12,
                  }}
                >
                  <Typography
                    sx={{
                      color:
                        "rgba(255,255,255,0.6)",
                      fontSize: 13,
                    }}
                  >
                    Description
                  </Typography>

                  <Typography
                    sx={{
                      color:
                        "#ffffff",
                    }}
                  >
                    {selectedLog.description ||
                      "-"}
                  </Typography>
                </Grid>


                <Grid
                  size={{
                    xs: 12,
                  }}
                >
                  <Typography
                    sx={{
                      color:
                        "rgba(255,255,255,0.6)",
                      fontSize: 13,
                    }}
                  >
                    Timestamp
                  </Typography>

                  <Typography
                    sx={{
                      color:
                        "#ffffff",
                    }}
                  >
                    {selectedLog.created_at
                      ? new Date(
                          selectedLog.created_at
                        ).toLocaleString()
                      : "-"}
                  </Typography>
                </Grid>

              </Grid>


              <Divider
                sx={{
                  borderColor:
                    "rgba(255,255,255,0.12)",
                }}
              />


              {/* BEFORE VALUES */}

              <Box>
                <Typography
                  variant="subtitle1"
                  sx={{
                    color:
                      "#ffffff",
                    fontWeight: 700,
                    mb: 1,
                  }}
                >
                  Before Values
                </Typography>

                <Box
                  sx={{
                    p: 2,
                    backgroundColor:
                      "#0f172a",
                    borderRadius: 1,
                    overflowX:
                      "auto",
                  }}
                >
                  <pre
                    style={{
                      margin: 0,
                      color: "#ffffff",
                      fontSize:
                        "13px",
                    }}
                  >
                    {selectedLog.before_values
                      ? JSON.stringify(
                          selectedLog.before_values,
                          null,
                          2
                        )
                      : "No before values recorded."}
                  </pre>
                </Box>
              </Box>


              {/* AFTER VALUES */}

              <Box>
                <Typography
                  variant="subtitle1"
                  sx={{
                    color:
                      "#ffffff",
                    fontWeight: 700,
                    mb: 1,
                  }}
                >
                  After Values
                </Typography>

                <Box
                  sx={{
                    p: 2,
                    backgroundColor:
                      "#0f172a",
                    borderRadius: 1,
                    overflowX:
                      "auto",
                  }}
                >
                  <pre
                    style={{
                      margin: 0,
                      color: "#ffffff",
                      fontSize:
                        "13px",
                    }}
                  >
                    {selectedLog.after_values
                      ? JSON.stringify(
                          selectedLog.after_values,
                          null,
                          2
                        )
                      : "No after values recorded."}
                  </pre>
                </Box>
              </Box>

            </Stack>
          ) : null}

        </DialogContent>


        <DialogActions>
          <Button
            onClick={
              handleCloseDetails
            }
            sx={{
              color: "#ffffff",
            }}
          >
            Close
          </Button>
        </DialogActions>

      </Dialog>

    </Box>
  );
};


export default AuditLogs;

