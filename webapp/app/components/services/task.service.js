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

export const updateTaskStatus = (taskId, status, token) => {
  return apiClient(`${TASK_ENDPOINTS.UPDATE_TASK_STATUS}/${taskId}/status`, {
    method: "PUT",
    body: { status },
    token,
  });
};


