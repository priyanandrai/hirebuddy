import { apiClient } from "../lib/apiClient";
import { AUTH_ENDPOINTS } from "../lib/endpoints";

export const getHelpers = () => {
    return apiClient(AUTH_ENDPOINTS.GET_ALL_HELPERS, {
      method: "GET"
    });
  };