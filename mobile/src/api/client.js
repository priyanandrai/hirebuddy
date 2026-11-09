/**
 * HireBuddy Mobile API Client (React Native / Expo)
 * Connects to the HireBuddy Express Backend + Socket.IO + FCM Push Registry
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
  getTasks: () => mobileApiFetch("/tasks/open"),
  getMyTasks: () => mobileApiFetch("/tasks/my"),
  getAssignedTasks: () => mobileApiFetch("/tasks/assigned"),
  acceptTask: (taskId) => mobileApiFetch(`/tasks/${taskId}/accept`, { method: "POST" }),
  updateTaskStatus: (taskId, status, otp) =>
    mobileApiFetch(`/tasks/${taskId}/status`, {
      method: "PATCH",
      body: { status, ...(otp ? { otp } : {}) },
    }),
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
