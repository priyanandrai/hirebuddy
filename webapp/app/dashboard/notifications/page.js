"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  deleteNotification,
} from "@/app/components/services/notification.service";
import {
  initializeSocket,
  onReceiveNotification,
} from "@/app/components/config/socketClient";

function timeAgo(dateString) {
  if (!dateString) return "";
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 30) return "Just now";
  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return "Yesterday";
  if (diffInDays < 7) return `${diffInDays}d ago`;

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getNotificationMeta(type = "") {
  const normalized = type.toLowerCase();
  if (normalized.includes("accepted")) {
    return {
      icon: "🤝",
      label: "Task Accepted",
      badgeClass: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
      accentBorder: "border-l-4 border-l-emerald-500",
    };
  }
  if (normalized.includes("started") || normalized.includes("progress")) {
    return {
      icon: "⏱️",
      label: "In Progress",
      badgeClass: "bg-blue-100 text-blue-800 dark:bg-blue-500/10 dark:text-blue-400 border-blue-200 dark:border-blue-800",
      accentBorder: "border-l-4 border-l-blue-500",
    };
  }
  if (normalized.includes("completed")) {
    return {
      icon: "✅",
      label: "Completed",
      badgeClass: "bg-green-100 text-green-800 dark:bg-green-500/10 dark:text-green-400 border-green-200 dark:border-green-800",
      accentBorder: "border-l-4 border-l-green-500",
    };
  }
  if (normalized.includes("payment")) {
    return {
      icon: "💳",
      label: "Payment",
      badgeClass: "bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-800",
      accentBorder: "border-l-4 border-l-amber-500",
    };
  }
  if (normalized.includes("message")) {
    return {
      icon: "💬",
      label: "Message",
      badgeClass: "bg-sky-100 text-sky-800 dark:bg-sky-500/10 dark:text-sky-400 border-sky-200 dark:border-sky-800",
      accentBorder: "border-l-4 border-l-sky-500",
    };
  }
  if (normalized.includes("cancel")) {
    return {
      icon: "⚠️",
      label: "Cancelled",
      badgeClass: "bg-rose-100 text-rose-800 dark:bg-rose-500/10 dark:text-rose-400 border-rose-200 dark:border-rose-800",
      accentBorder: "border-l-4 border-l-rose-500",
    };
  }
  return {
    icon: "🔔",
    label: "Notification",
    badgeClass: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700",
    accentBorder: "border-l-4 border-l-blue-500",
  };
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const [livePings, setLivePings] = useState(new Set());

  // Initial load
  useEffect(() => {
    loadNotifications();
  }, []);

  // WebSocket real-time listener
  useEffect(() => {
    let unsubscribe = () => {};

    const setupSocket = async () => {
      try {
        await initializeSocket();
        unsubscribe = onReceiveNotification((newNotif) => {
          if (!newNotif || !newNotif.id) return;

          setNotifications((prev) => {
            // Check if already in list
            if (prev.some((n) => n.id === newNotif.id)) return prev;
            return [newNotif, ...prev];
          });

          // Highlight newly arrived alert
          setLivePings((prev) => new Set(prev).add(newNotif.id));
          setTimeout(() => {
            setLivePings((prev) => {
              const updated = new Set(prev);
              updated.delete(newNotif.id);
              return updated;
            });
          }, 4000);
        });
      } catch (err) {
        console.warn("Socket initialization failed on notifications page", err);
      }
    };

    setupSocket();

    return () => {
      unsubscribe();
    };
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const res = await getNotifications(50, 0);
      const items = res?.notifications || res?.data?.notifications || (Array.isArray(res) ? res : []);
      setNotifications(items);
    } catch (error) {
      console.error("Failed to load notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
      );
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
        )
      );
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const handleDelete = async (id, e) => {
    e?.stopPropagation();
    try {
      await deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  const filteredNotifications = useMemo(() => {
    if (activeFilter === "unread") {
      return notifications.filter((n) => !n.isRead);
    }
    if (activeFilter === "tasks") {
      return notifications.filter((n) => {
        const type = (n.type || "").toLowerCase();
        return (
          type.includes("task") ||
          type.includes("accepted") ||
          type.includes("progress") ||
          type.includes("completed")
        );
      });
    }
    if (activeFilter === "payments") {
      return notifications.filter((n) => (n.type || "").toLowerCase().includes("payment"));
    }
    return notifications;
  }, [notifications, activeFilter]);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length;
  }, [notifications]);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
              Notifications
            </h1>
            {unreadCount > 0 && (
              <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800 dark:bg-blue-500/20 dark:text-blue-300">
                {unreadCount} unread
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
            Real-time updates on your tasks, helpers, and payments
          </p>
        </div>

        {notifications.length > 0 && unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="self-start rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-blue-600 shadow-sm transition hover:bg-gray-50 dark:border-slate-800 dark:bg-slate-900 dark:text-blue-400 dark:hover:bg-slate-800 sm:self-auto"
          >
            ✓ Mark all as read
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 flex flex-wrap gap-2 border-b border-gray-200 pb-3 dark:border-slate-800">
        {[
          { key: "all", label: "All", count: notifications.length },
          { key: "unread", label: "Unread", count: unreadCount },
          {
            key: "tasks",
            label: "Tasks",
            count: notifications.filter((n) =>
              (n.type || "").toLowerCase().includes("task") ||
              (n.type || "").toLowerCase().includes("accepted") ||
              (n.type || "").toLowerCase().includes("completed")
            ).length,
          },
          {
            key: "payments",
            label: "Payments",
            count: notifications.filter((n) => (n.type || "").toLowerCase().includes("payment")).length,
          },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key)}
            className={`flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
              activeFilter === tab.key
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-800"
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-semibold ${
                activeFilter === tab.key
                  ? "bg-blue-700/80 text-white"
                  : "bg-gray-200 text-gray-700 dark:bg-slate-700 dark:text-slate-300"
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Content Container */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {loading ? (
          <div className="space-y-4 p-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex animate-pulse gap-4">
                <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-slate-800" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/3 rounded bg-gray-200 dark:bg-slate-800" />
                  <div className="h-3 w-3/4 rounded bg-gray-100 dark:bg-slate-800/60" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredNotifications.length > 0 ? (
          <div className="divide-y divide-gray-100 dark:divide-slate-800/80">
            {filteredNotifications.map((n) => {
              const meta = getNotificationMeta(n.type);
              const isLivePinging = livePings.has(n.id);

              return (
                <div
                  key={n.id}
                  onClick={() => !n.isRead && handleMarkAsRead(n.id)}
                  className={`group relative flex items-start gap-4 p-4 transition sm:p-5 ${
                    n.isRead
                      ? "bg-white hover:bg-gray-50/80 dark:bg-slate-900 dark:hover:bg-slate-850"
                      : "bg-blue-50/40 hover:bg-blue-50/70 dark:bg-blue-950/20 dark:hover:bg-blue-950/30"
                  } ${!n.isRead ? meta.accentBorder : ""} ${
                    isLivePinging ? "ring-2 ring-blue-500 animate-pulse" : ""
                  }`}
                >
                  {/* Icon Avatar */}
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-lg shadow-inner dark:bg-slate-800">
                    {meta.icon}
                  </div>

                  {/* Body */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium ${meta.badgeClass}`}
                      >
                        {meta.label}
                      </span>

                      {!n.isRead && (
                        <span className="inline-flex h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400" />
                      )}

                      <span className="text-xs text-gray-400 dark:text-slate-500">
                        {timeAgo(n.createdAt)}
                      </span>
                    </div>

                    <h2 className="mt-1.5 text-sm font-semibold text-gray-900 dark:text-white">
                      {n.title}
                    </h2>

                    {n.message && (
                      <p className="mt-1 text-sm text-gray-600 dark:text-slate-300 leading-relaxed">
                        {n.message}
                      </p>
                    )}

                    {/* Sender and Task context info */}
                    <div className="mt-2.5 flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-slate-400">
                      {n.sender?.name && (
                        <div className="flex items-center gap-1.5">
                          <span>From:</span>
                          <span className="font-medium text-gray-700 dark:text-slate-200">
                            {n.sender.name}
                          </span>
                        </div>
                      )}

                      {n.task && (
                        <div className="flex items-center gap-1.5">
                          <span>Task:</span>
                          <span className="font-medium text-gray-700 dark:text-slate-200 truncate max-w-xs">
                            {n.task.title}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex shrink-0 items-center gap-2">
                    {n.taskId && (
                      <Link
                        href={`/dashboard/tasks/${n.taskId}`}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:border-slate-700 dark:text-blue-400 dark:hover:bg-slate-800"
                      >
                        View Task
                      </Link>
                    )}

                    {!n.isRead && (
                      <button
                        title="Mark as read"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(n.id);
                        }}
                        className="rounded-lg p-1.5 text-xs text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                      >
                        ✓
                      </button>
                    )}

                    <button
                      title="Delete notification"
                      onClick={(e) => handleDelete(n.id, e)}
                      className="rounded-lg p-1.5 text-xs text-gray-400 opacity-60 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400 group-hover:opacity-100"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-2xl dark:bg-blue-950/30">
              🔔
            </div>
            <h3 className="mt-4 text-base font-semibold text-gray-900 dark:text-white">
              No notifications yet
            </h3>
            <p className="mt-1 max-w-sm text-sm text-gray-500 dark:text-slate-400">
              {activeFilter === "unread"
                ? "You're all caught up! No unread notifications."
                : "You'll be notified here when helpers accept your tasks, status changes, or payments arrive."}
            </p>
            {activeFilter !== "all" && (
              <button
                onClick={() => setActiveFilter("all")}
                className="mt-4 text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
              >
                View all notifications
              </button>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
