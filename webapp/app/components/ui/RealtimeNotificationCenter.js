"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { initializeSocket } from "../config/socketClient";
import { markNotificationAsRead } from "../services/notification.service";
import { X, Bell, ExternalLink, Volume2, VolumeX } from "lucide-react";

function playNotificationChime() {
  try {
    if (typeof window === "undefined") return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(587.33, now); // D5
    osc1.frequency.setValueAtTime(880, now + 0.11); // A5
    gain1.gain.setValueAtTime(0.08, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.36);
  } catch {
    // Ignore audio context autoplay restrictions
  }
}

function getToastStyle(type = "") {
  const norm = String(type || "").toLowerCase();
  if (norm.includes("accepted")) {
    return {
      icon: "🤝",
      badge: "Task Accepted",
      badgeClass: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
      accentClass: "border-l-4 border-l-emerald-500",
    };
  }
  if (norm.includes("requested") || norm.includes("new_task")) {
    return {
      icon: "⚡",
      badge: norm.includes("requested") ? "Direct Request" : "New Task Live",
      badgeClass: "bg-blue-500/15 text-blue-400 border-blue-500/30",
      accentClass: "border-l-4 border-l-blue-500",
    };
  }
  if (norm.includes("completed")) {
    return {
      icon: "✅",
      badge: "Completed",
      badgeClass: "bg-green-500/15 text-green-400 border-green-500/30",
      accentClass: "border-l-4 border-l-green-500",
    };
  }
  if (norm.includes("payment")) {
    return {
      icon: "💳",
      badge: "Payment",
      badgeClass: "bg-amber-500/15 text-amber-400 border-amber-500/30",
      accentClass: "border-l-4 border-l-amber-500",
    };
  }
  if (norm.includes("message")) {
    return {
      icon: "💬",
      badge: "New Message",
      badgeClass: "bg-sky-500/15 text-sky-400 border-sky-500/30",
      accentClass: "border-l-4 border-l-sky-500",
    };
  }
  if (norm.includes("review")) {
    return {
      icon: "⭐",
      badge: "New Review",
      badgeClass: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
      accentClass: "border-l-4 border-l-yellow-500",
    };
  }
  if (norm.includes("cancel") || norm.includes("declined")) {
    return {
      icon: "⚠️",
      badge: "Update",
      badgeClass: "bg-rose-500/15 text-rose-400 border-rose-500/30",
      accentClass: "border-l-4 border-l-rose-500",
    };
  }
  return {
    icon: "🔔",
    badge: "Live Alert",
    badgeClass: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
    accentClass: "border-l-4 border-l-indigo-500",
  };
}

export default function RealtimeNotificationCenter({ role = "USER" }) {
  const [toasts, setToasts] = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const seenKeysRef = useRef(new Set());

  const pushToast = useCallback(
    (item) => {
      const dedupeKey =
        item.id || `${item.type || "notif"}-${item.taskId || ""}-${item.title || ""}`;
      if (seenKeysRef.current.has(dedupeKey)) return;
      seenKeysRef.current.add(dedupeKey);
      setTimeout(() => {
        seenKeysRef.current.delete(dedupeKey);
      }, 8000);

      const toastId = item.id || `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const newToast = {
        ...item,
        toastId,
        createdAt: item.createdAt || new Date().toISOString(),
      };

      setToasts((prev) => [newToast, ...prev].slice(0, 4));

      if (soundEnabled) {
        playNotificationChime();
      }

      // Trigger native OS Browser Notification if tab is hidden and permission granted
      try {
        if (
          typeof window !== "undefined" &&
          "Notification" in window &&
          window.Notification.permission === "granted" &&
          document.hidden
        ) {
          new window.Notification(newToast.title || "HireBuddy Update", {
            body: newToast.message || "You have a new real-time notification",
            icon: "/favicon.ico",
          });
        }
      } catch {
        // ignore browser notification errors
      }

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.toastId !== toastId));
      }, 6500);
    },
    [soundEnabled]
  );

  useEffect(() => {
    initializeSocket().catch(() => {});

    // Request native browser notification permission unobtrusively on first user interaction
    const requestBrowserPermOnce = () => {
      try {
        if (
          typeof window !== "undefined" &&
          "Notification" in window &&
          window.Notification.permission === "default"
        ) {
          window.Notification.requestPermission().catch(() => {});
        }
      } catch {}
      window.removeEventListener("click", requestBrowserPermOnce);
    };
    window.addEventListener("click", requestBrowserPermOnce, { once: true });

    const onNotifReceived = (e) => {
      const notif = e.detail;
      if (!notif) return;
      pushToast({
        id: notif.id,
        taskId: notif.taskId,
        type: notif.type || "notification",
        title: notif.title || "New Notification",
        message: notif.message || "",
        createdAt: notif.createdAt,
      });
    };

    const onNewTaskLive = (e) => {
      if (role !== "HELPER") return;
      const payload = e.detail;
      const task = payload?.task;
      if (!task?.id) return;

      // Avoid showing a duplicate toast if receive_notification already arrived for this taskId
      const existingTaskKey = `task-live-${task.id}`;
      if (seenKeysRef.current.has(existingTaskKey)) return;
      seenKeysRef.current.add(existingTaskKey);

      const budgetRupees =
        Number(task.budget || 0) >= 1000
          ? (Number(task.budget) / 100).toFixed(0)
          : Number(task.budget || 0);

      pushToast({
        id: `live-task-${task.id}`,
        taskId: task.id,
        type: "new_task_posted",
        title: `New ${task.category || "Service"} Task Posted!`,
        message: `"${task.title}" in ${task.location || "your area"} • ₹${budgetRupees}`,
      });
    };

    const onMessageAlert = (e) => {
      const payload = e.detail;
      if (!payload) return;
      pushToast({
        id: `msg-${payload.taskId}-${Date.now()}`,
        taskId: payload.taskId,
        type: "new_message",
        title: "New Chat Message",
        message: payload.message || "You received a new message on your task.",
      });
    };

    window.addEventListener("hirebuddy:notification-received", onNotifReceived);
    window.addEventListener("hirebuddy:new-task-available", onNewTaskLive);
    window.addEventListener("hirebuddy:message-notification", onMessageAlert);

    return () => {
      window.removeEventListener("click", requestBrowserPermOnce);
      window.removeEventListener("hirebuddy:notification-received", onNotifReceived);
      window.removeEventListener("hirebuddy:new-task-available", onNewTaskLive);
      window.removeEventListener("hirebuddy:message-notification", onMessageAlert);
    };
  }, [pushToast, role]);

  const dismissToast = (toastId) => {
    setToasts((prev) => prev.filter((t) => t.toastId !== toastId));
  };

  const getTargetHref = (toast) => {
    const isHelper = role === "HELPER";
    if (toast.type?.includes("message") && toast.taskId) {
      return isHelper
        ? `/dashboard-tasker/messages?taskId=${toast.taskId}`
        : `/dashboard/messages?taskId=${toast.taskId}`;
    }
    if (toast.taskId) {
      return isHelper
        ? `/dashboard-tasker/tasks/${toast.taskId}`
        : `/dashboard/tasks/${toast.taskId}`;
    }
    return isHelper ? "/dashboard-tasker/notifications" : "/dashboard/notifications";
  };

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed top-20 right-4 z-[90] flex w-full max-w-sm flex-col gap-3 pointer-events-none px-2 sm:px-0"
    >
      {toasts.map((toast) => {
        const style = getToastStyle(toast.type);
        const href = getTargetHref(toast);

        return (
          <div
            key={toast.toastId}
            className={`pointer-events-auto overflow-hidden rounded-2xl border border-slate-700/90 bg-[#0b1528]/95 p-4 text-slate-100 shadow-2xl shadow-black/70 backdrop-blur-xl transition-all duration-300 ${style.accentClass}`}
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-800/90 border border-slate-700 text-lg">
                {style.icon}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${style.badgeClass}`}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
                    {style.badge}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setSoundEnabled((s) => !s)}
                      title={soundEnabled ? "Mute notification sound" : "Unmute notification sound"}
                      className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition"
                    >
                      {soundEnabled ? (
                        <Volume2 className="h-3.5 w-3.5" />
                      ) : (
                        <VolumeX className="h-3.5 w-3.5" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => dismissToast(toast.toastId)}
                      aria-label="Dismiss notification"
                      className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <p className="mt-1.5 text-sm font-bold text-white leading-snug">
                  {toast.title}
                </p>
                {toast.message && (
                  <p className="mt-0.5 text-xs text-slate-300 line-clamp-2 leading-relaxed">
                    {toast.message}
                  </p>
                )}

                <div className="mt-2.5 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Bell className="h-3 w-3 text-blue-400" />
                    Just now
                  </span>

                  <Link
                    href={href}
                    onClick={() => {
                      if (toast.id && !String(toast.id).startsWith("live-")) {
                        markNotificationAsRead(toast.id)
                          .then(() => {
                            window.dispatchEvent(
                              new CustomEvent("hirebuddy:notifications-updated")
                            );
                          })
                          .catch(() => {});
                      }
                      dismissToast(toast.toastId);
                    }}
                    className="inline-flex items-center gap-1 rounded-lg bg-blue-600/20 border border-blue-500/30 px-2.5 py-1 text-[11px] font-semibold text-blue-300 hover:bg-blue-600 hover:text-white transition"
                  >
                    <span>View Details</span>
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
