import crypto from "crypto";
import prisma from "../utils/prisma.js";

let cachedAccessToken = null;
let cachedTokenExpiry = 0;

/**
 * Resolve Firebase Service Account credentials from environment variables
 */
const getFirebaseCredentials = () => {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
      const parsed = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      if (parsed.project_id && parsed.client_email && parsed.private_key) {
        return {
          projectId: parsed.project_id,
          clientEmail: parsed.client_email,
          privateKey: String(parsed.private_key).replace(/\\n/g, "\n"),
        };
      }
    } catch (err) {
      console.warn("Invalid FIREBASE_SERVICE_ACCOUNT_JSON:", err?.message);
    }
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (
    projectId &&
    clientEmail &&
    rawPrivateKey &&
    !projectId.startsWith("your_") &&
    !clientEmail.startsWith("your_")
  ) {
    return {
      projectId,
      clientEmail,
      privateKey: rawPrivateKey.replace(/\\n/g, "\n"),
    };
  }

  return null;
};

export const isFirebaseConfigured = () => Boolean(getFirebaseCredentials());

/**
 * Generate Google OAuth2 Access Token for Firebase Cloud Messaging HTTP v1 API
 */
const getGoogleAccessToken = async (creds) => {
  const nowSec = Math.floor(Date.now() / 1000);
  if (cachedAccessToken && cachedTokenExpiry > nowSec + 60) {
    return cachedAccessToken;
  }

  const header = Buffer.from(
    JSON.stringify({ alg: "RS256", typ: "JWT" })
  ).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      iss: creds.clientEmail,
      scope: "https://www.googleapis.com/auth/firebase.messaging",
      aud: "https://oauth2.googleapis.com/token",
      iat: nowSec,
      exp: nowSec + 3600,
    })
  ).toString("base64url");

  const unsignedJwt = `${header}.${payload}`;
  const signer = crypto.createSign("RSA-SHA256");
  signer.update(unsignedJwt);
  signer.end();
  const signature = signer.sign(creds.privateKey, "base64url");
  const assertion = `${unsignedJwt}.${signature}`;

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`FCM OAuth2 token exchange failed: ${errText}`);
  }

  const data = await response.json();
  cachedAccessToken = data.access_token;
  cachedTokenExpiry = nowSec + Number(data.expires_in || 3600);
  return cachedAccessToken;
};

/**
 * Send a push notification to a specific FCM device token
 */
export const sendFcmPushToToken = async (
  fcmToken,
  { title, body, data = {}, link = "/dashboard/notifications" }
) => {
  if (!fcmToken || typeof fcmToken !== "string") {
    return { sent: false, reason: "missing_token" };
  }

  // If token is a local Web Push Service Worker bridge token and Firebase credentials are not configured yet
  const creds = getFirebaseCredentials();
  if (!creds) {
    return {
      sent: false,
      simulated: true,
      reason: "firebase_env_not_configured",
      tokenPreview: `${fcmToken.slice(0, 16)}...`,
    };
  }

  if (fcmToken.startsWith("webpush-local-") || fcmToken.startsWith("fcm-webpush-")) {
    return {
      sent: false,
      simulated: true,
      reason: "local_sw_token_only",
    };
  }

  try {
    const accessToken = await getGoogleAccessToken(creds);
    const fcmEndpoint = `https://fcm.googleapis.com/v1/projects/${creds.projectId}/messages:send`;

    const stringifiedData = {};
    for (const [k, v] of Object.entries(data || {})) {
      if (v !== undefined && v !== null) {
        stringifiedData[k] = String(v);
      }
    }
    stringifiedData.link = String(link || "/dashboard/notifications");

    const response = await fetch(fcmEndpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: {
          token: fcmToken,
          notification: {
            title: title || "HireBuddy Update",
            body: body || "You have a new notification on HireBuddy",
          },
          data: stringifiedData,
          webpush: {
            fcm_options: {
              link: String(link || "/dashboard/notifications"),
            },
            notification: {
              icon: "/favicon.ico",
              badge: "/favicon.ico",
            },
          },
        },
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.warn("FCM HTTP v1 send warning:", errBody);
      return { sent: false, error: errBody };
    }

    const resData = await response.json();
    return { sent: true, messageId: resData.name };
  } catch (error) {
    console.warn("Failed to send FCM push notification:", error?.message);
    return { sent: false, error: error?.message };
  }
};

/**
 * Look up user's fcmToken and send a Firebase Push Notification
 */
export const sendFcmPushToUser = async (
  userId,
  { title, body, taskId = null, type = "notification" }
) => {
  if (!userId) return { sent: false, reason: "no_user_id" };

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, fcmToken: true, role: true },
    });

    if (!user?.fcmToken) {
      return { sent: false, reason: "user_has_no_fcm_token" };
    }

    const isHelper = user.role === "HELPER";
    const link = taskId
      ? isHelper
        ? `/dashboard-tasker/tasks?taskId=${taskId}`
        : `/dashboard/my-tasks/${taskId}`
      : isHelper
        ? "/dashboard-tasker/notifications"
        : "/dashboard/notifications";

    return await sendFcmPushToToken(user.fcmToken, {
      title,
      body,
      data: {
        taskId: taskId || "",
        type: type || "notification",
        link,
      },
      link,
    });
  } catch (error) {
    console.warn("sendFcmPushToUser warning:", error?.message);
    return { sent: false, error: error?.message };
  }
};

export default {
  isFirebaseConfigured,
  sendFcmPushToToken,
  sendFcmPushToUser,
};
