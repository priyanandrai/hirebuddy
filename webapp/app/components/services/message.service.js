// webapp/app/components/services/message.service.js
import { apiClient } from "../lib/apiClient";
import { MESSAGE_ENDPOINTS } from "../lib/endpoints";

export const sendMessage = (taskId, receiverId, message, messageType = "TEXT", mediaUrl = null) => {
  return apiClient(MESSAGE_ENDPOINTS.SEND_MESSAGE, {
    method: "POST",
    body: {
      taskId,
      receiverId,
      message,
      messageType,
      mediaUrl,
    },
  });
};

export const getTaskMessages = (taskId, limit = 50, offset = 0) => {
  return apiClient(`${MESSAGE_ENDPOINTS.GET_TASK_MESSAGES}/${taskId}?limit=${limit}&offset=${offset}`, {
    method: "GET",
  });
};

export const getConversations = (limit = 20, offset = 0) => {
  return apiClient(`${MESSAGE_ENDPOINTS.GET_CONVERSATIONS}?limit=${limit}&offset=${offset}`, {
    method: "GET",
  });
};

export const markMessagesAsRead = (taskId) => {
  return apiClient(`${MESSAGE_ENDPOINTS.MARK_AS_READ}/${taskId}/read`, {
    method: "PUT",
  });
};

export const getUnreadMessageCount = () => {
  return apiClient(MESSAGE_ENDPOINTS.GET_UNREAD_COUNT, {
    method: "GET",
  });
};

export const deleteMessage = (messageId) => {
  return apiClient(`${MESSAGE_ENDPOINTS.DELETE_MESSAGE}/${messageId}`, {
    method: "DELETE",
  });
};

export default {
  sendMessage,
  getTaskMessages,
  getConversations,
  markMessagesAsRead,
  getUnreadMessageCount,
  deleteMessage,
};
