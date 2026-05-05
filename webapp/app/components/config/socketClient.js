// webapp/app/components/config/socketClient.js
import io from "socket.io-client";
import { getAuthToken } from "../lib/getSessionToken";

let socket = null;

export const initializeSocket = async () => {
  if (socket && socket.connected) {
    return socket;
  }

  try {
    const token = await getAuthToken();
    const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

    socket = io(SOCKET_URL, {
      auth: {
        token: `Bearer ${token}`,
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      console.log("WebSocket connected:", socket.id);
    });

    socket.on("disconnect", (reason) => {
      console.log("WebSocket disconnected:", reason);
    });

    socket.on("error", (error) => {
      console.error("WebSocket error:", error);
    });

    return socket;
  } catch (error) {
    console.error("Error initializing socket:", error);
    return null;
  }
};

export const getSocket = () => {
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// Event listeners for real-time features

export const onNewMessage = (callback) => {
  const socket = getSocket();
  if (socket) {
    socket.on("new_message", callback);
  }
};

export const onTaskUpdate = (callback) => {
  const socket = getSocket();
  if (socket) {
    socket.on("task_updated", callback);
  }
};

export const onReceiveNotification = (callback) => {
  const socket = getSocket();
  if (socket) {
    socket.on("receive_notification", callback);
  }
};

export const onTypingIndicator = (callback) => {
  const socket = getSocket();
  if (socket) {
    socket.on("user_typing", callback);
  }
};

export const onPaymentUpdate = (callback) => {
  const socket = getSocket();
  if (socket) {
    socket.on("payment_alert", callback);
  }
};

// Emit events

export const emitJoinTask = (taskId) => {
  const socket = getSocket();
  if (socket) {
    socket.emit("join_task", { taskId });
  }
};

export const emitLeaveTask = (taskId) => {
  const socket = getSocket();
  if (socket) {
    socket.emit("leave_task", { taskId });
  }
};

export const emitSendMessage = (taskId, receiverId, message, messageType = "TEXT") => {
  const socket = getSocket();
  if (socket) {
    socket.emit("send_message", {
      taskId,
      receiverId,
      message,
      messageType,
    });
  }
};

export const emitTyping = (taskId, receiverId) => {
  const socket = getSocket();
  if (socket) {
    socket.emit("typing", { taskId, receiverId });
  }
};

export const emitStopTyping = (taskId, receiverId) => {
  const socket = getSocket();
  if (socket) {
    socket.emit("stop_typing", { taskId, receiverId });
  }
};

export default {
  initializeSocket,
  getSocket,
  disconnectSocket,
  onNewMessage,
  onTaskUpdate,
  onReceiveNotification,
  onTypingIndicator,
  onPaymentUpdate,
  emitJoinTask,
  emitLeaveTask,
  emitSendMessage,
  emitTyping,
  emitStopTyping,
};
