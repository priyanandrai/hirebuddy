// webapp/app/components/services/payment.service.js
import { apiClient } from "../lib/apiClient";
import { PAYMENT_ENDPOINTS } from "../lib/endpoints";

export const createPaymentOrder = (taskId, amount) => {
  return apiClient(PAYMENT_ENDPOINTS.CREATE_ORDER, {
    method: "POST",
    body: {
      taskId,
      amount, // in paise
    },
  });
};

export const verifyPayment = (razorpayOrderId, razorpayPaymentId, razorpaySignature, taskId) => {
  return apiClient(PAYMENT_ENDPOINTS.VERIFY_PAYMENT, {
    method: "POST",
    body: {
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: razorpaySignature,
      task_id: taskId,
    },
  });
};

export const getPaymentHistory = (limit = 20, offset = 0) => {
  return apiClient(`${PAYMENT_ENDPOINTS.GET_PAYMENT_HISTORY}?limit=${limit}&offset=${offset}`, {
    method: "GET",
  });
};

export const getPaymentDetails = (paymentId) => {
  return apiClient(`${PAYMENT_ENDPOINTS.GET_PAYMENT_DETAILS}/${paymentId}`, {
    method: "GET",
  });
};

export const refundPayment = (paymentId, reason = "Task cancelled") => {
  return apiClient(`${PAYMENT_ENDPOINTS.REFUND_PAYMENT}/${paymentId}/refund`, {
    method: "POST",
    body: { reason },
  });
};

export default {
  createPaymentOrder,
  verifyPayment,
  getPaymentHistory,
  getPaymentDetails,
  refundPayment,
};
