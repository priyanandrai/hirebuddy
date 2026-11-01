// webapp/app/components/config/socketClient.js
import io from "socket.io-client";
import { getAuthToken } from "../lib/getSessionToken";

let socket = null;
let initPromise = null;
let globalEventsBound = false;

const bindGlobalBridgeEvents = (sock) => {
  if (!sock || globalEventsBound || typeof window === "undefined") return;
  globalEventsBound = true;

  sock.on("receive_notification", (notif) => {
    window.dispatchEvent(
      new CustomEvent("hirebuddy:notification-received", { detail: notif })
    );
  });

  sock.on("new_task_available", (payload) => {
    window.dispatchEvent(
      new CustomEvent("hirebuddy:new-task-available", { detail: payload })
    );
  });

  sock.on("task_status_changed", (payload) => {
    window.dispatchEvent(
      new CustomEvent("hirebuddy:task-status-changed", { detail: payload })
    );
  });

  sock.on("task_updated", (payload) => {
    window.dispatchEvent(
      new CustomEvent("hirebuddy:task-status-changed", { detail: payload })
    );
  });

  sock.on("message_notification", (payload) => {
    window.dispatchEvent(
      new CustomEvent("hirebuddy:message-notification", { detail: payload })
    );
  });

  sock.on("payment_notification", (payload) => {
    window.dispatchEvent(
      new CustomEvent("hirebuddy:payment-notification", { detail: payload })
    );
  });
};

export const initializeSocket = async () => {
  if (socket && (socket.connected || socket.active)) {
    bindGlobalBridgeEvents(socket);
    return socket;
  }

  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    try {
      const token = await getAuthToken();
      if (!token) {
        return null;
      }

      const rawUrl =
        process.env.NEXT_PUBLIC_SOCKET_URL ||
        process.env.NEXT_PUBLIC_API_URL ||
        "http://localhost:8080";
      const SOCKET_URL = rawUrl.replace(/\/api\/?$/, "");

      if (socket) {
        socket.disconnect();
        globalEventsBound = false;
      }

      socket = io(SOCKET_URL, {
        auth: {
          token: token.startsWith("Bearer ") ? token : `Bearer ${token}`,
        },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 10,
        transports: ["websocket", "polling"],
      });

      bindGlobalBridgeEvents(socket);

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
    } finally {
      initPromise = null;
    }
  })();

  return initPromise;
};

export const getSocket = () => {
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    globalEventsBound = false;
  }
};

export const onNewTaskAvailable = (callback) => {
  const socket = getSocket();
  if (socket) {
    socket.on("new_task_available", callback);
    return () => socket.off("new_task_available", callback);
  }
  return () => {};
};

// Event listeners for real-time features

export const onNewMessage = (callback) => {
  const socket = getSocket();
  if (socket) {
    socket.on("new_message", callback);
    return () => socket.off("new_message", callback);
  }
  return () => {};
};

export const onTaskUpdate = (callback) => {
  const socket = getSocket();
  if (socket) {
    socket.on("task_status_changed", callback);
    socket.on("task_updated", callback);
    return () => {
      socket.off("task_status_changed", callback);
      socket.off("task_updated", callback);
    };
  }
  return () => {};
};

export const onReceiveNotification = (callback) => {
  const socket = getSocket();
  if (socket) {
    socket.on("receive_notification", callback);
    return () => socket.off("receive_notification", callback);
  }
  return () => {};
};

export const offReceiveNotification = (callback) => {
  const socket = getSocket();
  if (socket) {
    socket.off("receive_notification", callback);
  }
};

export const onTypingIndicator = (callback) => {
  const socket = getSocket();
  if (socket) {
    socket.on("user_typing", callback);
    return () => socket.off("user_typing", callback);
  }
  return () => {};
};

export const onPaymentUpdate = (callback) => {
  const socket = getSocket();
  if (socket) {
    socket.on("payment_notification", callback);
    socket.on("payment_alert", callback);
    return () => {
      socket.off("payment_notification", callback);
      socket.off("payment_alert", callback);
    };
  }
  return () => {};
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
  onNewTaskAvailable,
  onReceiveNotification,
  onTypingIndicator,
  onPaymentUpdate,
  emitJoinTask,
  emitLeaveTask,
  emitSendMessage,
  emitTyping,
  emitStopTyping,
};
