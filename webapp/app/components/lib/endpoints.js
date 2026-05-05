export const AUTH_ENDPOINTS = {
    SIGNUP: "/auth/signup",
    LOGIN: "/auth/login",
    SEND_OTP: "/auth/send-otp",
    VERIFY_OTP: "/auth/verify-otp",
    GOOGLE_AUTH: "/auth/google",
};

export const USER_ENDPOINTS = {
  GET_ALL_HELPERS: "/user/helpers",
  GET_HELPER_BY_ID: "/user/helper",
  GET_PROFILE: "/user/profile",
  UPDATE_PROFILE: "/user/profile",
  UPDATE_HELPER_PROFILE: "/user/helper-profile",
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
  CREATE_ORDER: "/payments/create-order",
  VERIFY_PAYMENT: "/payments/verify",
  GET_PAYMENT_HISTORY: "/payments/history",
  GET_PAYMENT_DETAILS: "/payments",
  REFUND_PAYMENT: "/payments",
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
};
  