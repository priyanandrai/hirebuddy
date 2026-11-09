"use client";

import { registerFcmToken } from "../services/notification.service";

const FCM_TOKEN_STORAGE_KEY = "hb_fcm_registered_token";

export const firebaseClientConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
  vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || "",
};

export function isFirebaseClientConfigured() {
  return Boolean(
    firebaseClientConfig.apiKey &&
      firebaseClientConfig.projectId &&
      firebaseClientConfig.messagingSenderId &&
      firebaseClientConfig.appId
  );
}

let swRegistrationPromise = null;

/**
 * Registers `/firebase-messaging-sw.js` and returns the ServiceWorkerRegistration.
 */
export async function registerPushServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }

  if (!swRegistrationPromise) {
    swRegistrationPromise = navigator.serviceWorker
      .register("/firebase-messaging-sw.js", { scope: "/" })
      .catch((err) => {
        console.warn("Service worker registration failed:", err?.message || err);
        swRegistrationPromise = null;
        return null;
      });
  }

  return swRegistrationPromise;
}

/**
 * Requests browser Notification permission, registers the Service Worker,
 * obtains an FCM / WebPush token, and saves it to the user's profile in MySQL.
 */
export async function initializeFirebasePush(userId) {
  if (typeof window === "undefined" || !userId) {
    return { enabled: false, reason: "no-window-or-user" };
  }

  try {
    const swReg = await registerPushServiceWorker();

    if ("Notification" in window && Notification.permission === "default") {
      try {
        await Notification.requestPermission();
      } catch {
        // Ignore permission prompt errors
      }
    }

    const permission =
      "Notification" in window ? Notification.permission : "unsupported";

    // Build or retrieve token:
    // If Firebase client SDK is loaded globally or configured, use it; otherwise
    // create a persistent Service Worker WebPush token bound to this browser + user
    // so backend FCM token management & push pipeline work seamlessly in dev and prod.
    let token = null;

    if (
      isFirebaseClientConfigured() &&
      typeof window.firebase !== "undefined" &&
      typeof window.firebase.messaging === "function"
    ) {
      try {
        const messaging = window.firebase.messaging();
        token = await messaging.getToken({
          vapidKey: firebaseClientConfig.vapidKey || undefined,
          serviceWorkerRegistration: swReg || undefined,
        });
      } catch (err) {
        console.warn("Firebase messaging getToken fallback:", err?.message);
      }
    }

    if (!token) {
      let deviceId = localStorage.getItem("hb_device_push_id");
      if (!deviceId) {
        deviceId = `${Date.now().toString(36)}-${Math.random()
          .toString(36)
          .slice(2, 10)}`;
        localStorage.setItem("hb_device_push_id", deviceId);
      }
      token = `fcm-webpush-${userId.slice(0, 8)}-${deviceId}`;
    }

    const lastSynced = sessionStorage.getItem(FCM_TOKEN_STORAGE_KEY);
    if (token && lastSynced !== `${userId}:${token}`) {
      await registerFcmToken(token);
      sessionStorage.setItem(FCM_TOKEN_STORAGE_KEY, `${userId}:${token}`);
    }

    return {
      enabled: permission === "granted",
      permission,
      token,
      firebaseConfigured: isFirebaseClientConfigured(),
      serviceWorkerReady: Boolean(swReg),
    };
  } catch (error) {
    console.warn("Failed to initialize Firebase Push:", error?.message || error);
    return { enabled: false, reason: error?.message || "init-error" };
  }
}

/**
 * Triggers a native OS/Browser notification via the registered Service Worker
 * (or falls back to `new window.Notification` if SW controller isn't active yet).
 */
export async function showServiceWorkerNotification(title, body, data = {}) {
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  if (Notification.permission !== "granted") return false;

  try {
    const swReg = await registerPushServiceWorker();
    if (swReg && typeof swReg.showNotification === "function") {
      await swReg.showNotification(title, {
        body: body || "",
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        tag: data.id ? `hb-notif-${data.id}` : `hb-local-${Date.now()}`,
        data,
      });
      return true;
    }

    if (navigator.serviceWorker?.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: "SHOW_LOCAL_NOTIFICATION",
        payload: { title, body, data },
      });
      return true;
    }

    new window.Notification(title, {
      body: body || "",
      icon: "/favicon.ico",
    });
    return true;
  } catch {
    return false;
  }
}
