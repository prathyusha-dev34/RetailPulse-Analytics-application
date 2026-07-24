import { useEffect, useState } from "react";

import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Typography,
  Stack,
} from "@mui/material";

import {
  getNotifications,
  markNotificationRead,
} from "../api/notificationApi";


interface Notification {
  id: number;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}


const Notifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);


  const fetchNotifications = async () => {
    try {
      const data = await getNotifications();

      setNotifications(
        Array.isArray(data)
          ? data
          : data.notifications || data.data || []
      );

    } catch (error) {
      console.error("Failed to fetch notifications", error);
    }
  };


  useEffect(() => {
    fetchNotifications();
  }, []);


  const handleRead = async (id: number) => {
    try {
      await markNotificationRead(id);

      setNotifications((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, is_read: true }
            : item
        )
      );

    } catch (error) {
      console.error("Failed to mark notification read", error);
    }
  };


  return (
    <Container maxWidth="lg">

      <Typography
        variant="h4"
        sx={{
          mb: 3,
          fontWeight: 700,
        }}
      >
        Notifications
      </Typography>


      {notifications.length === 0 ? (

        <Card>
          <CardContent>
            <Typography>
              No notifications available
            </Typography>
          </CardContent>
        </Card>

      ) : (

        <Stack spacing={2}>

          {notifications.map((notification) => (

            <Card
              key={notification.id}
              sx={{
                backgroundColor: notification.is_read
                  ? "background.paper"
                  : "rgba(33,150,243,0.15)",
                borderLeft: notification.is_read
                  ? "none"
                  : "4px solid #2196f3",
              }}
            >

              <CardContent>

                <Typography
                  variant="h6"
                  fontWeight={600}
                >
                  {notification.title}
                </Typography>


                <Typography
                  sx={{ mt: 1 }}
                >
                  {notification.message}
                </Typography>


                <Typography
                  variant="caption"
                  color="text.secondary"
                >
                  {new Date(
                    notification.created_at
                  ).toLocaleString()}
                </Typography>


                {!notification.is_read && (

                  <Box mt={2}>

                    <Button
                      variant="contained"
                      size="small"
                      onClick={() =>
                        handleRead(notification.id)
                      }
                    >
                      Mark as Read
                    </Button>

                  </Box>

                )}

              </CardContent>

            </Card>

          ))}

        </Stack>

      )}

    </Container>
  );
};


export default Notifications;