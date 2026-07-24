import axiosInstance from "./axios";


export const getNotifications = async () => {
  const response = await axiosInstance.get("/notifications/");
  return response.data;
};


export const getUnreadNotifications = async () => {
  const response = await axiosInstance.get("/notifications/unread");
  return response.data;
};


export const markNotificationRead = async (
  notificationId: number
) => {
  const response = await axiosInstance.patch(
    `/notifications/${notificationId}/read`
  );

  return response.data;
};