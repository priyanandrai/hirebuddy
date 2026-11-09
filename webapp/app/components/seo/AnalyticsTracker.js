"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const FORBIDDEN_PII_KEYS = [
  "phone",
  "email",
  "password",
  "pan",
  "gstin",
  "bankAccount",
  "accountNumber",
  "token",
  "razorpaySignature",
];

/**
 * Sanitize analytics payload so PII, passwords, or payment credentials are NEVER sent to GA4 / GTM
 */
export function sanitizeAnalyticsPayload(payload = {}) {
  const clean = {};
  for (const [key, val] of Object.entries(payload || {})) {
    if (FORBIDDEN_PII_KEYS.some((forbidden) => key.toLowerCase().includes(forbidden.toLowerCase()))) {
      continue;
    }
    if (typeof val === "string" && (val.includes("@") || /\b\d{10,16}\b/.test(val))) {
      continue;
    }
    clean[key] = val;
  }
  return clean;
}

/**
 * Fire privacy-safe GA4 / GTM event (Phase 14)
 * Supported events:
 * - page_view
 * - service_page_visit
 * - location_page_visit
 * - search_interaction
 * - booking_cta_click
 * - booking_started
 * - booking_completed
 * - customer_registration
 */
export function trackSeoEvent(eventName, params = {}) {
  if (typeof window === "undefined") return;
  const safeParams = sanitizeAnalyticsPayload(params);

  if (Array.isArray(window.dataLayer)) {
    window.dataLayer.push({
      event: eventName,
      ...safeParams,
    });
  }
  if (typeof window.gtag === "function") {
    window.gtag("event", eventName, safeParams);
  }
}

export default function AnalyticsTracker({ pageEvent = null, eventProps = {} }) {
  const pathname = usePathname();

  useEffect(() => {
    trackSeoEvent("page_view", { page_path: pathname });
    if (pageEvent) {
      trackSeoEvent(pageEvent, { page_path: pathname, ...eventProps });
    }
  }, [pathname, pageEvent]);

  return null;
}
