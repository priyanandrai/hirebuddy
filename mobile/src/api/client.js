/**
 * HireBuddy Mobile API Client (React Native / Expo)
 * Battery-friendly architecture: stateless REST + OS Push (FCM) — NO persistent background sockets.
 * Tasks & notifications are fetched cleanly whenever the user opens or resumes the app.
 */

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://localhost:8080/api";

let authToken = null;

export const setMobileAuthToken = (token) => {
  authToken = token;
};

export const mobileApiFetch = async (path, options = {}) => {
  const headers = {
    "Content-Type": "application/json",
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    body:
      options.body && typeof options.body === "object"
        ? JSON.stringify(options.body)
        : options.body,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || data.message || `API Error (${response.status})`);
  }
  return data;
};

export const mobileApi = {
  getOpenTasks: () => mobileApiFetch("/tasks/search?status=OPEN&limit=30"),
  getTasks: () => mobileApiFetch("/tasks/search?status=OPEN&limit=30"),
  getMyTasks: () => mobileApiFetch("/tasks/my"),
  getAssignedTasks: () => mobileApiFetch("/tasks/assigned"),
  acceptTask: (taskId) => mobileApiFetch(`/tasks/${taskId}/accept`, { method: "POST" }),
  declineTask: (taskId, reason = "Helper unavailable") =>
    mobileApiFetch(`/tasks/${taskId}/decline`, {
      method: "POST",
      body: { reason },
    }),
  updateTaskStatus: (taskId, status, otp) =>
    mobileApiFetch(`/tasks/${taskId}/status`, {
      method: "PUT",
      body: { status, ...(otp ? { otp } : {}) },
    }),
  getNotifications: (limit = 20) =>
    mobileApiFetch(`/notifications?limit=${limit}`),
  getMarketplaceProducts: (search = "") =>
    mobileApiFetch(`/marketplace/products${search ? `?search=${encodeURIComponent(search)}` : ""}`),
  placeMarketplaceOrder: (payload) =>
    mobileApiFetch("/marketplace/orders", {
      method: "POST",
      body: payload,
    }),
  registerFcmToken: (fcmToken) =>
    mobileApiFetch("/notifications/fcm-token", {
      method: "POST",
      body: { fcmToken },
    }),
};
