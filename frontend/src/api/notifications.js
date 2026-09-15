import apiClient from "./client.js";

export function listNotifications({ unreadOnly, limit, offset } = {}) {
  const params = {};
  if (unreadOnly) params.unread_only = true;
  if (limit) params.limit = limit;
  if (offset) params.offset = offset;
  return apiClient.get("/api/v1/notifications", { params }).then((res) => res.data);
}

export function markNotificationRead(notificationId) {
  return apiClient.put(`/api/v1/notifications/${notificationId}/read`).then((res) => res.data);
}

export function markAllNotificationsRead() {
  return apiClient.put("/api/v1/notifications/read-all").then((res) => res.data);
}
