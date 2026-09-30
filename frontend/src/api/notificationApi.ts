
import axiosInstance from "./axios";

export interface NotificationItem {
  id: number;
  company_id: number;
  user_id: number;
  title: string;
  message: string;
  notification_type: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  resource_type?: string | null;
  resource_id?: number | null;
  is_read: boolean;
  created_at: string;
  read_at?: string | null;
  expires_at?: string | null;
}

export interface NotificationListResponse {
  items: NotificationItem[];
  total: number;
  page: number;
  page_size: number;
  unread_count: number;
}

export interface NotificationFilters {
  page?: number;
  page_size?: number;
  is_read?: boolean;
  notification_type?: string;
  priority?: string;
}

export const getNotifications = async (
  filters: NotificationFilters = {}
): Promise<NotificationListResponse> => {
  const response = await axiosInstance.get("/notifications/", {
    params: filters,
  });

  return response.data;
};

export const getUnreadCount = async (): Promise<number> => {
  const response = await axiosInstance.get("/notifications/unread-count");

  return Number(response.data?.unread_count || 0);
};

export const getUnreadNotifications = async (): Promise<
  NotificationItem[]
> => {
  const response = await axiosInstance.get("/notifications/unread");

  return response.data;
};

export const markNotificationRead = async (
  notificationId: number
): Promise<NotificationItem> => {
  const response = await axiosInstance.patch(
    `/notifications/${notificationId}/read`
  );

  return response.data as NotificationItem;
};

export const markAllNotificationsRead = async (): Promise<{
  success: boolean;
  updated_count: number;
}> => {
  const response = await axiosInstance.patch(
    "/notifications/read-all"
  );

  return response.data as {
    success: boolean;
    updated_count: number;
  };
};

