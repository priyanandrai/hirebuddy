export const AUTH_ENDPOINTS = {
    SIGNUP: "/auth/signup",
    LOGIN: "/auth/login",
    SEND_OTP: "/auth/send-otp",
    VERIFY_OTP: "/auth/verify-otp",
    GOOGLE_AUTH: "/auth/google",
    REGISTER_HELPER: "/auth/register-helper",
};

export const UPLOAD_ENDPOINTS = {
  DOCUMENT: "/upload/document",
};

export const USER_ENDPOINTS = {
  GET_ALL_HELPERS: "/user/helpers",
  GET_HELPER_BY_ID: "/user/helper",
  GET_PROFILE: "/user/profile",
  UPDATE_PROFILE: "/user/profile",
  UPDATE_HELPER_PROFILE: "/user/helper-profile",
  SUBMIT_ID: "/user/id/submit",
  VERIFY_ID: "/user/id",
  PENDING_IDS: "/user/pending-ids",
};

export const TASK_ENDPOINTS = {
  CREATE_TASK: "/tasks",
  GET_MY_TASKS: "/tasks/my",
  GET_CREATED_TASKS: "/tasks/created",
  GET_ASSIGNED_TASKS: "/tasks/assigned",
  GET_TASK_BY_ID: "/tasks",
  ACCEPT_TASK: "/tasks",
  GET_NEARBY_TASKS: "/tasks/nearby",
  SEARCH_TASKS: "/tasks/search",
  UPDATE_TASK_STATUS: "/tasks",
  CANCEL_TASK: "/tasks",
  GET_CATEGORIES: "/tasks/categories",
  GET_TASK_STATS: "/tasks/stats",
  GET_FILTERED_SERVICES: "/categories/services",
};

export const MESSAGE_ENDPOINTS = {
  SEND_MESSAGE: "/messages",
  GET_TASK_MESSAGES: "/messages/task",
  GET_CONVERSATIONS: "/messages/conversations",
  MARK_AS_READ: "/messages/task",
  GET_UNREAD_COUNT: "/messages/unread-count",
  DELETE_MESSAGE: "/messages",
};

export const PAYMENT_ENDPOINTS = {
  CALCULATE_BREAKDOWN: "/payments/calculate-breakdown",
  CREATE_ORDER: "/payments/create-order",
  VERIFY_PAYMENT: "/payments/verify",
  RELEASE_ESCROW: "/payments/release-escrow",
  SUBSCRIPTION_STATUS: "/payments/subscription/status",
  SUBSCRIPTION_ACTIVATE: "/payments/subscription/activate",
  WALLET: "/payments/wallet",
  WALLET_TOPUP: "/payments/wallet/topup",
  WALLET_WITHDRAW: "/payments/wallet/withdraw",
  WALLET_PAY_TASK: "/payments/wallet/pay-task",
  GET_PAYMENT_HISTORY: "/payments/history",
  GET_BOOKING_PAYMENT: "/payments/booking",
  GET_PAYMENT_DETAILS: "/payments",
  REFUND_PAYMENT: "/payments",
  HELPER_EARNINGS: "/helpers/earnings",
  HELPER_PAYOUTS: "/helpers/payouts",
  HELPER_PAYOUT_REQUEST: "/helpers/payouts/request",
  HELPER_TAX_PROFILE: "/helpers/tax-profile",
  HELPER_BANK_ACCOUNT: "/helpers/bank-account",
};

export const MARKETPLACE_ENDPOINTS = {
  GET_PRODUCTS: "/marketplace/products",
  SELLER_ONBOARD: "/marketplace/seller/onboard",
  SELLER_DASHBOARD: "/marketplace/seller/dashboard",
  SELLER_PRODUCTS: "/marketplace/seller/products",
  PLACE_ORDER: "/marketplace/orders",
  MY_ORDERS: "/marketplace/orders/my",
  ORDER_STATUS: "/marketplace/orders",
};

export const SUPPORT_ENDPOINTS = {
  CREATE_TICKET: "/support/tickets",
  MY_TICKETS: "/support/my-tickets",
};

export const HIRE_ENDPOINTS = {
  HIRE_BUDDY: '/hire',
};

export const REVIEW_ENDPOINTS = {
  CREATE_REVIEW: "/reviews",
  GET_USER_REVIEWS: "/reviews/user",
  GET_MY_REVIEWS: "/reviews/my-reviews",
  GET_REVIEW: "/reviews",
  UPDATE_REVIEW: "/reviews",
  DELETE_REVIEW: "/reviews",
  GET_TOP_HELPERS: "/reviews/top-helpers",
};

export const NOTIFICATION_ENDPOINTS = {
  GET_NOTIFICATIONS: "/notifications",
  GET_UNREAD_COUNT: "/notifications/unread-count",
  MARK_AS_READ: "/notifications",
  MARK_ALL_AS_READ: "/notifications/mark/read-all",
  DELETE_NOTIFICATION: "/notifications",
  FCM_TOKEN: "/notifications/fcm-token",
  TEST_PUSH: "/notifications/test-push",
};
  