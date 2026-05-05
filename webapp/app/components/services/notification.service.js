// webapp/app/components/services/notification.service.js
import { apiClient } from "../lib/apiClient";
import { NOTIFICATION_ENDPOINTS } from "../lib/endpoints";

export const getNotifications = (limit = 20, offset = 0, isRead = null) => {
  let url = `${NOTIFICATION_ENDPOINTS.GET_NOTIFICATIONS}?limit=${limit}&offset=${offset}`;
  if (isRead !== null) {
    url += `&isRead=${isRead}`;
  }
  return apiClient(url, {
    method: "GET",
  });
};

export const getUnreadNotificationCount = () => {
  return apiClient(NOTIFICATION_ENDPOINTS.GET_UNREAD_COUNT, {
    method: "GET",
  });
};

export const markNotificationAsRead = (notificationId) => {
  return apiClient(`${NOTIFICATION_ENDPOINTS.MARK_AS_READ}/${notificationId}/read`, {
    method: "PUT",
  });
};

export const markAllNotificationsAsRead = () => {
  return apiClient(NOTIFICATION_ENDPOINTS.MARK_ALL_AS_READ, {
    method: "PUT",
  });
};

export const deleteNotification = (notificationId) => {
  return apiClient(`${NOTIFICATION_ENDPOINTS.DELETE_NOTIFICATION}/${notificationId}`, {
    method: "DELETE",
  });
};

export default {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
};
