// src/services/task.service.js (frontend)
import { apiClient } from "../lib/apiClient";
import { AUTH_ENDPOINTS } from "../lib/endpoints";

export const createTask = (payload, token) => {
  return apiClient(AUTH_ENDPOINTS.CRETAE_TASK, {
    method: "POST",
    body: payload,
    token, // 👈 session token
  });
};

export const myTask = (payload, token) => {
    return apiClient(AUTH_ENDPOINTS.MY_TASK, {
      method: "Get",
      token, // 👈 session token
    });
  };

  export const getTaskById = (taskId, token) => {
    return apiClient(`${AUTH_ENDPOINTS.CRETAE_TASK}/${taskId}`, {
      method: "GET",
      token,
    });
  };


