import { apiClient } from "../lib/apiClient";
import { AUTH_ENDPOINTS } from "../lib/endpoints";

export const getHelpers = () => {
    return apiClient(AUTH_ENDPOINTS.GET_ALL_HELPERS, {
      method: "GET"
    });
  };

export const getHelperByID = (id) => {
    return apiClient(AUTH_ENDPOINTS.GET_ALL_HELPER_BY_ID+id, {
      method: "GET"
    });
  };

  