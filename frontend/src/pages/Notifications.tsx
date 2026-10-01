
import { useEffect, useMemo, useState } from "react";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";

import type { SelectChangeEvent } from "@mui/material";

import DoneAllIcon from "@mui/icons-material/DoneAll";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";

import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../api/notificationApi";

import type { NotificationItem } from "../api/notificationApi";

type NotificationTab = "all" | "unread" | "read";

const getPriorityColor = (
  priority: string
): "default" | "error" | "warning" | "info" => {
  if (priority === "CRITICAL") {
    return "error";
  }

  if (priority === "HIGH") {
    return "warning";
  }

  if (priority === "MEDIUM") {
    return "info";
  }

  return "default";
};

const getPriorityBorder = (priority: string): string => {
  if (priority === "CRITICAL") {
    return "5px solid #d32f2f";
  }

  if (priority === "HIGH") {
    return "5px solid #ed6c02";
  }

  if (priority === "MEDIUM") {
    return "5px solid #0288d1";
  }

  return "5px solid #64748b";
};

const formatType = (value: string): string => {
  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

export default function Notifications() {
  const [notifications, setNotifications] = useState<
    NotificationItem[]
  >([]);

  const [loading, setLoading] = useState<boolean>(true);

  const [error, setError] = useState<string>("");

  const [tab, setTab] = useState<NotificationTab>("all");

  const [type, setType] = useState<string>("");

  const [priority, setPriority] = useState<string>("");

  const [unreadCount, setUnreadCount] = useState<number>(0);

  const [markingReadId, setMarkingReadId] = useState<number | null>(
    null
  );

  const [markingAllRead, setMarkingAllRead] =
    useState<boolean>(false);

  const readFilter = useMemo(() => {
    if (tab === "unread") {
      return false;
    }

    if (tab === "read") {
      return true;
    }

    return undefined;
  }, [tab]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError("");

      const result = await getNotifications({
        page: 1,
        page_size: 100,
        is_read: readFilter,
        notification_type: type || undefined,
        priority: priority || undefined,
      });

      setNotifications(result.items || []);
      setUnreadCount(result.unread_count || 0);
    } catch (err) {
      console.error("Failed to load notifications:", err);

      setError(
        "Unable to load notifications. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadNotifications();

    const intervalId = window.setInterval(() => {
      void loadNotifications();
    }, 15000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [readFilter, type, priority]);

  const handleTabChange = (
    _event: React.SyntheticEvent,
    value: NotificationTab
  ) => {
    setTab(value);
  };

  const handleTypeChange = (
    event: SelectChangeEvent<string>
  ) => {
    setType(event.target.value);
  };

  const handlePriorityChange = (
    event: SelectChangeEvent<string>
  ) => {
    setPriority(event.target.value);
  };

  const handleRead = async (id: number) => {
    if (markingReadId !== null) {
      return;
    }

    try {
      setMarkingReadId(id);
      setError("");

      await markNotificationRead(id);

      setNotifications((current) => {
        if (tab === "unread") {
          return current.filter(
            (notification) => notification.id !== id
          );
        }

        return current.map((notification) => {
          if (notification.id !== id) {
            return notification;
          }

          return {
            ...notification,
            is_read: true,
            read_at: new Date().toISOString(),
          };
        });
      });

      setUnreadCount((count) => Math.max(0, count - 1));
    } catch (err) {
      console.error(
        "Failed to mark notification as read:",
        err
      );

      setError(
        "Unable to mark the notification as read."
      );
    } finally {
      setMarkingReadId(null);
    }
  };

  const handleReadAll = async () => {
    if (unreadCount === 0 || markingAllRead) {
      return;
    }

    try {
      setMarkingAllRead(true);
      setError("");

      const result = await markAllNotificationsRead();

      setNotifications((current) => {
        if (tab === "unread") {
          return [];
        }

        return current.map((notification) => {
          if (notification.is_read) {
            return notification;
          }

          return {
            ...notification,
            is_read: true,
            read_at:
              notification.read_at ||
              new Date().toISOString(),
          };
        });
      });

      setUnreadCount(0);

      console.log(
        "Notifications marked as read:",
        result.updated_count
      );
    } catch (err) {
      console.error(
        "Failed to mark all notifications as read:",
        err
      );

      setError(
        "Unable to mark all notifications as read."
      );
    } finally {
      setMarkingAllRead(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: {
            xs: "flex-start",
            sm: "center",
          },
          gap: 2,
          mb: 3,
          flexDirection: {
            xs: "column",
            sm: "row",
          },
        }}
      >
        <Box>
          <Typography
            variant="h4"
            fontWeight={700}
          >
            Notification Center
          </Typography>

          <Typography color="text.secondary">
            {unreadCount} unread notification
            {unreadCount === 1 ? "" : "s"}
          </Typography>
        </Box>

        <Button
          variant="outlined"
          startIcon={
            markingAllRead ? (
              <CircularProgress size={18} />
            ) : (
              <DoneAllIcon />
            )
          }
          disabled={
            unreadCount === 0 || markingAllRead
          }
          onClick={() => void handleReadAll()}
        >
          {markingAllRead
            ? "Marking..."
            : "Mark All as Read"}
        </Button>
      </Box>

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack
            direction={{
              xs: "column",
              md: "row",
            }}
            spacing={2}
          >
            <Tabs
              value={tab}
              onChange={handleTabChange}
            >
              <Tab
                value="all"
                label="All"
              />

              <Tab
                value="unread"
                label={`Unread (${unreadCount})`}
              />

              <Tab
                value="read"
                label="Read"
              />
            </Tabs>

            <FormControl
              size="small"
              sx={{ minWidth: 180 }}
            >
              <InputLabel id="notification-type-label">
                Type
              </InputLabel>

              <Select
                labelId="notification-type-label"
                value={type}
                label="Type"
                onChange={handleTypeChange}
              >
                <MenuItem value="">
                  All Types
                </MenuItem>

                <MenuItem value="STOCKOUT">
                  Stockout
                </MenuItem>

                <MenuItem value="LOW_STOCK">
                  Low Stock
                </MenuItem>

                <MenuItem value="STOCKOUT_RISK">
                  Stockout Risk
                </MenuItem>

                <MenuItem value="OVERSTOCK">
                  Overstock
                </MenuItem>

                <MenuItem value="IMPORT_COMPLETED">
                  Import Completed
                </MenuItem>

                <MenuItem value="IMPORT_COMPLETED_WITH_ERRORS">
                  Import With Errors
                </MenuItem>

                <MenuItem value="IMPORT_FAILED">
                  Import Failed
                </MenuItem>

                <MenuItem value="SALES_ALERT">
                  Sales Alert
                </MenuItem>

                <MenuItem value="SYSTEM_ALERT">
                  System Alert
                </MenuItem>
              </Select>
            </FormControl>

            <FormControl
              size="small"
              sx={{ minWidth: 140 }}
            >
              <InputLabel id="notification-priority-label">
                Priority
              </InputLabel>

              <Select
                labelId="notification-priority-label"
                value={priority}
                label="Priority"
                onChange={handlePriorityChange}
              >
                <MenuItem value="">
                  All Priorities
                </MenuItem>

                <MenuItem value="CRITICAL">
                  Critical
                </MenuItem>

                <MenuItem value="HIGH">
                  High
                </MenuItem>

                <MenuItem value="MEDIUM">
                  Medium
                </MenuItem>

                <MenuItem value="LOW">
                  Low
                </MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </CardContent>
      </Card>

      {/* Loading */}
      {loading && (
        <Box
          sx={{
            textAlign: "center",
            py: 8,
          }}
        >
          <CircularProgress />

          <Typography
            sx={{ mt: 2 }}
            color="text.secondary"
          >
            Loading notifications...
          </Typography>
        </Box>
      )}

      {/* Empty State */}
      {!loading &&
        notifications.length === 0 && (
          <Card>
            <CardContent
              sx={{
                textAlign: "center",
                py: 8,
              }}
            >
              <NotificationsNoneIcon
                sx={{
                  fontSize: 52,
                  color: "text.secondary",
                }}
              />

              <Typography
                variant="h6"
                sx={{ mt: 1 }}
              >
                You're all caught up.
              </Typography>

              <Typography color="text.secondary">
                No notifications match the selected
                filters.
              </Typography>
            </CardContent>
          </Card>
        )}

      {/* Notification List */}
      {!loading &&
        notifications.length > 0 && (
          <Stack spacing={2}>
            {notifications.map((notification) => (
              <Card
                key={notification.id}
                sx={{
                  borderLeft: getPriorityBorder(
                    notification.priority
                  ),
                  opacity: notification.is_read
                    ? 0.82
                    : 1,
                  transition: "0.2s",

                  "&:hover": {
                    transform: "translateY(-2px)",
                  },
                }}
              >
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 2,
                      alignItems: "flex-start",
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      {/* Title */}
                      <Stack
                        direction="row"
                        spacing={1}
                        flexWrap="wrap"
                      >
                        <Typography
                          variant="h6"
                          fontWeight={700}
                        >
                          {notification.title}
                        </Typography>

                        {!notification.is_read && (
                          <Chip
                            label="Unread"
                            size="small"
                            color="primary"
                          />
                        )}
                      </Stack>

                      {/* Message */}
                      <Typography
                        sx={{ mt: 1 }}
                        color="text.secondary"
                      >
                        {notification.message}
                      </Typography>

                      {/* Type / Priority / Resource */}
                      <Stack
                        direction="row"
                        spacing={1}
                        sx={{ mt: 2 }}
                        flexWrap="wrap"
                      >
                        <Chip
                          size="small"
                          label={formatType(
                            notification.notification_type
                          )}
                        />

                        <Chip
                          size="small"
                          label={notification.priority}
                          color={getPriorityColor(
                            notification.priority
                          )}
                        />

                        {notification.resource_type && (
                          <Chip
                            size="small"
                            variant="outlined"
                            label={
                              notification.resource_id !=
                              null
                                ? `${notification.resource_type} ${notification.resource_id}`
                                : notification.resource_type
                            }
                          />
                        )}
                      </Stack>

                      {/* Created Time */}
                      <Typography
                        variant="caption"
                        display="block"
                        sx={{ mt: 1.5 }}
                        color="text.secondary"
                      >
                        {new Date(
                          notification.created_at
                        ).toLocaleString()}
                      </Typography>
                    </Box>

                    {/* Mark Read */}
                    {!notification.is_read && (
                      <Button
                        size="small"
                        variant="contained"
                        disabled={
                          markingReadId === notification.id
                        }
                        onClick={() =>
                          void handleRead(
                            notification.id
                          )
                        }
                      >
                        {markingReadId ===
                        notification.id ? (
                          <CircularProgress
                            size={18}
                            color="inherit"
                          />
                        ) : (
                          "Mark as Read"
                        )}
                      </Button>
                    )}
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Stack>
        )}
    </Container>
  );
}

