import { apiClient } from "../lib/apiClient";
import { MARKETPLACE_ENDPOINTS, SUPPORT_ENDPOINTS } from "../lib/endpoints";

export const getMarketplaceProducts = (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.category && filters.category !== "All") params.set("category", filters.category);
  if (filters.deliveryMode) params.set("deliveryMode", filters.deliveryMode);
  if (filters.sortBy) params.set("sortBy", filters.sortBy);
  const qs = params.toString();
  return apiClient(qs ? `${MARKETPLACE_ENDPOINTS.GET_PRODUCTS}?${qs}` : MARKETPLACE_ENDPOINTS.GET_PRODUCTS, {
    method: "GET",
  });
};

export const onboardSeller = (payload, token) => {
  return apiClient(MARKETPLACE_ENDPOINTS.SELLER_ONBOARD, {
    method: "POST",
    body: payload,
    token,
  });
};

export const getSellerDashboard = (token) => {
  return apiClient(MARKETPLACE_ENDPOINTS.SELLER_DASHBOARD, {
    method: "GET",
    token,
  });
};

export const addSellerProduct = (payload, token) => {
  return apiClient(MARKETPLACE_ENDPOINTS.SELLER_PRODUCTS, {
    method: "POST",
    body: payload,
    token,
  });
};

export const placeMarketplaceOrder = (payload, token) => {
  return apiClient(MARKETPLACE_ENDPOINTS.PLACE_ORDER, {
    method: "POST",
    body: payload,
    token,
  });
};

export const getCustomerMarketplaceOrders = (token) => {
  return apiClient(MARKETPLACE_ENDPOINTS.MY_ORDERS, {
    method: "GET",
    token,
  });
};

export const updateMarketplaceOrderStatus = (orderId, orderStatus, token) => {
  return apiClient(`${MARKETPLACE_ENDPOINTS.ORDER_STATUS}/${orderId}/status`, {
    method: "PATCH",
    body: { orderStatus },
    token,
  });
};

export const createSupportTicket = (payload, token) => {
  return apiClient(SUPPORT_ENDPOINTS.CREATE_TICKET, {
    method: "POST",
    body: payload,
    token,
  });
};

export const getMySupportTickets = (token) => {
  return apiClient(SUPPORT_ENDPOINTS.MY_TICKETS, {
    method: "GET",
    token,
  });
};
