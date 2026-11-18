// webapp/app/components/services/payment.service.js
import { apiClient } from "../lib/apiClient";
import { PAYMENT_ENDPOINTS } from "../lib/endpoints";
import { openRazorpayCheckout } from "../lib/razorpayCheckout";

export const createPaymentOrder = (taskOrPayload, amountRupees, purpose) => {
  const body =
    taskOrPayload && typeof taskOrPayload === "object" && !Array.isArray(taskOrPayload)
      ? taskOrPayload
      : {
          ...(taskOrPayload ? { taskId: taskOrPayload } : {}),
          amountRupees: Number(amountRupees || 0),
          purpose: purpose || (taskOrPayload ? "TASK_ESCROW" : "MARKETPLACE_ORDER"),
        };

  return apiClient(PAYMENT_ENDPOINTS.CREATE_ORDER, {
    method: "POST",
    body,
  });
};

export const verifyPayment = (
  orderOrPayload,
  razorpayPaymentId,
  razorpaySignature,
  taskId,
  holdInEscrow = true
) => {
  const body =
    orderOrPayload && typeof orderOrPayload === "object" && !Array.isArray(orderOrPayload)
      ? {
          razorpay_order_id:
            orderOrPayload.razorpay_order_id ||
            orderOrPayload.razorpayOrderId ||
            orderOrPayload.orderId,
          razorpay_payment_id:
            orderOrPayload.razorpay_payment_id ||
            orderOrPayload.razorpayPaymentId ||
            orderOrPayload.paymentId,
          razorpay_signature:
            orderOrPayload.razorpay_signature ||
            orderOrPayload.razorpaySignature ||
            orderOrPayload.signature,
          task_id: orderOrPayload.task_id || orderOrPayload.taskId,
          holdInEscrow:
            orderOrPayload.holdInEscrow !== undefined
              ? orderOrPayload.holdInEscrow
              : true,
        }
      : {
          razorpay_order_id: orderOrPayload,
          razorpay_payment_id: razorpayPaymentId,
          razorpay_signature: razorpaySignature,
          task_id: taskId,
          holdInEscrow,
        };

  return apiClient(PAYMENT_ENDPOINTS.VERIFY_PAYMENT, {
    method: "POST",
    body,
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

export const activateSubscription = async (
  planType = "DAILY",
  paymentMethod = "ONLINE",
  extra = {}
) => {
  let paymentDetails = { ...extra };

  if (
    paymentMethod === "ONLINE" &&
    typeof window !== "undefined" &&
    !paymentDetails.razorpayPaymentId &&
    !paymentDetails.razorpay_payment_id
  ) {
    const normalizedPlan = String(planType || "DAILY").toUpperCase();
    const priceRupees = normalizedPlan === "MONTHLY" ? 99 : 5;
    const orderRes = await createPaymentOrder({
      amountRupees: priceRupees,
      purpose: "PARTNER_SUBSCRIPTION",
      notes: { planType: normalizedPlan },
    });

    const rzpRes = await openRazorpayCheckout({
      amountRupees: priceRupees,
      orderId: orderRes?.orderId,
      keyId: orderRes?.keyId,
      title: "HireBuddy Partner Pass",
      description: `${
        normalizedPlan === "MONTHLY" ? "Monthly Pass (30 Days)" : "Daily Pass (24 Hours)"
      } — Zero Commission Task Access`,
    });

    paymentDetails = {
      ...paymentDetails,
      razorpayOrderId: rzpRes.razorpayOrderId,
      razorpayPaymentId: rzpRes.razorpayPaymentId,
      razorpaySignature: rzpRes.razorpaySignature,
    };
  }

  return apiClient(PAYMENT_ENDPOINTS.SUBSCRIPTION_ACTIVATE, {
    method: "POST",
    body: { planType, paymentMethod, ...paymentDetails },
  });
};

export const getWallet = () => {
  return apiClient(PAYMENT_ENDPOINTS.WALLET, {
    method: "GET",
  });
};

export const topupWallet = async (payload = {}) => {
  let enrichedPayload = { ...payload };

  if (
    typeof window !== "undefined" &&
    !enrichedPayload.razorpayPaymentId &&
    !enrichedPayload.razorpay_payment_id
  ) {
    const amountRupees =
      enrichedPayload.amountRupees ??
      (enrichedPayload.amountPaise ? Number(enrichedPayload.amountPaise) / 100 : 0);

    const orderRes = await createPaymentOrder({
      amountRupees,
      amountPaise: enrichedPayload.amountPaise,
      purpose: "WALLET_TOPUP",
      notes: { method: enrichedPayload.method || "UPI" },
    });

    const rzpRes = await openRazorpayCheckout({
      amountRupees,
      amountPaise: orderRes?.amountPaise,
      orderId: orderRes?.orderId,
      keyId: orderRes?.keyId,
      title: "HireBuddy Wallet",
      description: `Add ₹${amountRupees} to HireBuddy Wallet`,
    });

    enrichedPayload = {
      ...enrichedPayload,
      razorpayOrderId: rzpRes.razorpayOrderId,
      razorpayPaymentId: rzpRes.razorpayPaymentId,
      razorpaySignature: rzpRes.razorpaySignature,
    };
  }

  return apiClient(PAYMENT_ENDPOINTS.WALLET_TOPUP, {
    method: "POST",
    body: enrichedPayload,
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
