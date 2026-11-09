/* eslint-disable no-restricted-globals */
/**
 * HireBuddy Firebase Cloud Messaging & Web Push Service Worker
 * Handles:
 * 1. Background push notifications delivered via FCM / Web Push API
 * 2. Local notification bridge dispatched from foreground/background tabs
 * 3. Notification click routing to the corresponding dashboard page
 */

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

function buildTargetUrl(data = {}) {
  const clickUrl = data.clickUrl || data.url;
  if (clickUrl) return clickUrl;
  if (data.taskId) {
    return `/dashboard/my-tasks/${data.taskId}`;
  }
  return "/dashboard/notifications";
}

// 1. Handle standard Web Push / Firebase Cloud Messaging push events
self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload = {};
  try {
    payload = event.data.json();
  } catch {
    payload = {
      notification: {
        title: "HireBuddy Notification",
        body: event.data.text(),
      },
    };
  }

  const notification = payload.notification || {};
  const data = payload.data || {};
  const title = notification.title || data.title || "HireBuddy Update";
  const body = notification.body || data.message || "You have a new update on HireBuddy.";
  const targetUrl = buildTargetUrl(data);

  const options = {
    body,
    icon: notification.icon || "/favicon.ico",
    badge: "/favicon.ico",
    tag: data.notificationId ? `hb-notif-${data.notificationId}` : `hb-push-${Date.now()}`,
    data: {
      ...data,
      url: targetUrl,
    },
    requireInteraction: false,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// 2. Handle messages from the client tab to show OS-level Service Worker notifications
self.addEventListener("message", (event) => {
  const msg = event.data;
  if (!msg || msg.type !== "SHOW_LOCAL_NOTIFICATION") return;

  const { title, body, data = {} } = msg.payload || {};
  if (!title) return;

  const targetUrl = buildTargetUrl(data);
  const options = {
    body: body || "",
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    tag: data.id ? `hb-notif-${data.id}` : `hb-local-${Date.now()}`,
    data: {
      ...data,
      url: targetUrl,
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// 3. Handle notification click -> focus existing HireBuddy tab or open a new window
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification?.data?.url || "/dashboard/notifications";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            client.focus();
            if ("navigate" in client) {
              client.navigate(targetUrl).catch(() => {});
            }
            return;
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
  );
});
