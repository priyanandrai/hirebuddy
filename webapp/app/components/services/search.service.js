import { apiClient } from "../lib/apiClient";

export const searchTasks = (q, limit = 10, token) => {
  const query = `?q=${encodeURIComponent(q)}&limit=${limit}`;
  return apiClient(`/search/tasks${query}`, { method: "GET", token });
};

export const searchHelpers = (q, limit = 10, token) => {
  const query = `?q=${encodeURIComponent(q)}&limit=${limit}`;
  return apiClient(`/search/helpers${query}`, { method: "GET", token });
};

export const logUserSearch = async ({
  query = "",
  category = null,
  location = null,
  section = "SERVICES",
  resultsCount = 0,
} = {}) => {
  try {
    const cleanQ = String(query || category || "").trim();
    if (!cleanQ && !location) return null;

    let storedUser = null;
    if (typeof window !== "undefined") {
      try {
        storedUser = JSON.parse(localStorage.getItem("user") || "null");
      } catch {
        storedUser = null;
      }
    }

    return await apiClient("/search/log", {
      method: "POST",
      body: {
        query: cleanQ || `Location: ${location}`,
        category: category && category !== "ALL" ? category : null,
        location: location && location !== "ALL" ? location : null,
        section,
        resultsCount,
        userId: storedUser?.id || null,
        userName: storedUser?.name || null,
        userPhone: storedUser?.phone || storedUser?.email || null,
        userRole: storedUser?.role || "USER",
      },
    });
  } catch {
    return null;
  }
};

export default { searchTasks, searchHelpers, logUserSearch };
