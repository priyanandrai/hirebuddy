import { apiClient } from "../lib/apiClient";

export const searchTasks = (q, limit = 10, token) => {
  const query = `?q=${encodeURIComponent(q)}&limit=${limit}`;
  return apiClient(`/search/tasks${query}`, { method: "GET", token });
};

export const searchHelpers = (q, limit = 10, token) => {
  const query = `?q=${encodeURIComponent(q)}&limit=${limit}`;
  return apiClient(`/search/helpers${query}`, { method: "GET", token });
};

export default { searchTasks, searchHelpers };
