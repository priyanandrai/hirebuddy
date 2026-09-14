import { apiClient } from "../lib/apiClient";
import { USER_ENDPOINTS } from "../lib/endpoints";

export const getHelpers = () => {
  return apiClient(USER_ENDPOINTS.GET_ALL_HELPERS, { method: "GET" });
};

export const getHelperByID = (id) => {
  return apiClient(`${USER_ENDPOINTS.GET_HELPER_BY_ID}/${id}`, { method: "GET" });
};

export const submitIdDocument = (payload) => {
  return apiClient(USER_ENDPOINTS.SUBMIT_ID, {
    method: "POST",
    body: payload,
  });
};

export const verifyUserId = (id, payload) => {
  return apiClient(`${USER_ENDPOINTS.VERIFY_ID}/${id}/verify`, {
    method: "PATCH",
    body: payload,
  });
};

export const getPendingIdSubmissions = (adminToken) => {
  const q = adminToken ? `?adminToken=${encodeURIComponent(adminToken)}` : "";
  return apiClient(`${USER_ENDPOINTS.PENDING_IDS}${q}`, { method: "GET" });
};
  
