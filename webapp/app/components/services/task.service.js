import { apiClient } from "../lib/apiClient";
import { TASK_ENDPOINTS } from "../lib/endpoints";

export const createTask = (payload, token) => {
  return apiClient(TASK_ENDPOINTS.CREATE_TASK, {
    method: "POST",
    body: payload,
    token,
  });
};

export const myTask = (token) => {
  return apiClient(TASK_ENDPOINTS.GET_MY_TASKS, {
    method: "GET",
    token,
  });
};

export const getTaskById = (taskId, token) => {
  return apiClient(`${TASK_ENDPOINTS.GET_TASK_BY_ID}/${taskId}`, {
    method: "GET",
    token,
  });
};

export const getOpenTasks = (token) => {
  return apiClient(`${TASK_ENDPOINTS.SEARCH_TASKS}?status=OPEN&limit=50`, {
    method: "GET",
    token,
  });
};

export const getAssignedTasks = (token) => {
  return apiClient(TASK_ENDPOINTS.GET_ASSIGNED_TASKS, {
    method: "GET",
    token,
  });
};

export const acceptTask = (taskId, token) => {
  return apiClient(`${TASK_ENDPOINTS.ACCEPT_TASK}/${taskId}/accept`, {
    method: "POST",
    token,
  });
};

export const declineTask = (taskId, reason, token) => {
  return apiClient(`${TASK_ENDPOINTS.ACCEPT_TASK}/${taskId}/decline`, {
    method: "POST",
    body: { reason },
    token,
  });
};

export const updateTaskStatus = (taskId, status, token) => {
  return apiClient(`${TASK_ENDPOINTS.UPDATE_TASK_STATUS}/${taskId}/status`, {
    method: "PUT",
    body: { status },
    token,
  });
};

export const cancelTask = (taskId, reason, token) => {
  return apiClient(`${TASK_ENDPOINTS.CANCEL_TASK}/${taskId}/cancel`, {
    method: "PUT",
    body: { reason },
    token,
  });
};

export const getTaskCategories = () => {
  return apiClient(TASK_ENDPOINTS.GET_CATEGORIES, {
    method: "GET",
  });
};

export const createTaskCategory = (data, token) => {
  return apiClient(TASK_ENDPOINTS.GET_CATEGORIES, {
    method: "POST",
    body: typeof data === "string" ? { name: data } : data,
    token,
  });
};

export const getFilteredServices = (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.category) params.set("category", filters.category);
  if (filters.minPrice !== undefined && filters.minPrice !== "") {
    params.set("minPrice", String(filters.minPrice));
  }
  if (filters.maxPrice !== undefined && filters.maxPrice !== "") {
    params.set("maxPrice", String(filters.maxPrice));
  }
  if (filters.minRating !== undefined && filters.minRating !== "" && filters.minRating !== null) {
    params.set("minRating", String(filters.minRating));
  }
  if (filters.sortBy) params.set("sortBy", filters.sortBy);
  if (filters.search) params.set("search", filters.search);
  if (filters.location) params.set("location", filters.location);

  const queryString = params.toString();
  const url = queryString
    ? `${TASK_ENDPOINTS.GET_FILTERED_SERVICES}?${queryString}`
    : TASK_ENDPOINTS.GET_FILTERED_SERVICES;

  return apiClient(url, {
    method: "GET",
  });
};

export const getFilteredHelperTasks = (filters = {}, token) => {
  const params = new URLSearchParams();
  params.set("includeCatalog", "true");
  params.set("status", filters.status || "OPEN");
  if (filters.category && filters.category !== "ALL") {
    params.set("category", filters.category);
  }
  if (filters.search) {
    params.set("search", filters.search);
  }
  if (filters.location && filters.location !== "All Locations") {
    params.set("location", filters.location);
  }
  if (filters.minBudget !== undefined && filters.minBudget !== "") {
    params.set("minBudget", String(filters.minBudget));
  }
  if (filters.maxBudget !== undefined && filters.maxBudget !== "") {
    params.set("maxBudget", String(filters.maxBudget));
  }
  if (filters.sortBy) {
    params.set("sortBy", filters.sortBy);
  }
  if (filters.view) {
    params.set("view", filters.view);
  }
  if (filters.limit) {
    params.set("limit", String(filters.limit));
  }

  return apiClient(`${TASK_ENDPOINTS.SEARCH_TASKS}?${params.toString()}`, {
    method: "GET",
    token,
  });
};



