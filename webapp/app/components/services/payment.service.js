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

export const verifyPayment = (
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
  taskId,
  holdInEscrow = true
) => {
  return apiClient(PAYMENT_ENDPOINTS.VERIFY_PAYMENT, {
    method: "POST",
    body: {
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: razorpaySignature,
      task_id: taskId,
      holdInEscrow,
    },
  });
};

export const releaseEscrowPayment = (taskId, options = {}) => {
  return apiClient(PAYMENT_ENDPOINTS.RELEASE_ESCROW, {
    method: "POST",
    body: { taskId, ...options },
  });
};

export const getSubscriptionStatus = () => {
  return apiClient(PAYMENT_ENDPOINTS.SUBSCRIPTION_STATUS, {
    method: "GET",
  });
};

export const activateSubscription = (planType = "DAILY", paymentMethod = "ONLINE") => {
  return apiClient(PAYMENT_ENDPOINTS.SUBSCRIPTION_ACTIVATE, {
    method: "POST",
    body: { planType, paymentMethod },
  });
};

export const getWallet = () => {
  return apiClient(PAYMENT_ENDPOINTS.WALLET, {
    method: "GET",
  });
};

export const topupWallet = (payload = {}) => {
  return apiClient(PAYMENT_ENDPOINTS.WALLET_TOPUP, {
    method: "POST",
    body: payload,
  });
};

export const withdrawWallet = (payload = {}) => {
  return apiClient(PAYMENT_ENDPOINTS.WALLET_WITHDRAW, {
    method: "POST",
    body: payload,
  });
};

export const payTaskWithWallet = (payload = {}) => {
  return apiClient(PAYMENT_ENDPOINTS.WALLET_PAY_TASK, {
    method: "POST",
    body: payload,
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

export const calculateBookingBreakdown = (payload = {}) => {
  return apiClient(PAYMENT_ENDPOINTS.CALCULATE_BREAKDOWN, {
    method: "POST",
    body: payload,
  });
};

export const getBookingPaymentDetails = (bookingId) => {
  return apiClient(`${PAYMENT_ENDPOINTS.GET_BOOKING_PAYMENT}/${bookingId}`, {
    method: "GET",
  });
};

export const getHelperEarningsLedger = () => {
  return apiClient(PAYMENT_ENDPOINTS.HELPER_EARNINGS, {
    method: "GET",
  });
};

export const getHelperPayouts = () => {
  return apiClient(PAYMENT_ENDPOINTS.HELPER_PAYOUTS, {
    method: "GET",
  });
};

export const requestHelperPayout = (payload = {}) => {
  return apiClient(PAYMENT_ENDPOINTS.HELPER_PAYOUT_REQUEST, {
    method: "POST",
    body: payload,
  });
};

export const saveHelperTaxProfile = (payload = {}) => {
  return apiClient(PAYMENT_ENDPOINTS.HELPER_TAX_PROFILE, {
    method: "POST",
    body: payload,
  });
};

export const saveHelperBankAccount = (payload = {}) => {
  return apiClient(PAYMENT_ENDPOINTS.HELPER_BANK_ACCOUNT, {
    method: "POST",
    body: payload,
  });
};

export default {
  calculateBookingBreakdown,
  createPaymentOrder,
  verifyPayment,
  releaseEscrowPayment,
  getSubscriptionStatus,
  activateSubscription,
  getWallet,
  topupWallet,
  withdrawWallet,
  payTaskWithWallet,
  getPaymentHistory,
  getBookingPaymentDetails,
  getPaymentDetails,
  refundPayment,
  getHelperEarningsLedger,
  getHelperPayouts,
  requestHelperPayout,
  saveHelperTaxProfile,
  saveHelperBankAccount,
};
