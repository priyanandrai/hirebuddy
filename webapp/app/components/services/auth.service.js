import { apiClient } from "@/lib/apiClient";
import { AUTH_ENDPOINTS } from "@/lib/endpoints";

export const signupUser = (payload) => {
  return apiClient(AUTH_ENDPOINTS.SIGNUP, {
    method: "POST",
    body: payload,
  });
};

export const loginUser = (payload) => {
  return apiClient(AUTH_ENDPOINTS.LOGIN, {
    method: "POST",
    body: payload,
  });
};

export const sendOtp = (payload) => {
  return apiClient(AUTH_ENDPOINTS.SEND_OTP, {
    method: "POST",
    body: payload,
  });
};
