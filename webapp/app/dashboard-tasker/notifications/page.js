"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  sendTestPushNotification,
} from "@/app/components/services/notification.service";
import {
  initializeSocket,
  onReceiveNotification,
} from "@/app/components/config/socketClient";
import {
  initializeFirebasePush,
  showServiceWorkerNotification,
} from "@/app/components/config/firebaseClient";
import { getCurrentUser } from "@/app/components/services/auth.service";
import { NotificationRowShimmer } from "@/app/components/ui/Shimmer";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [testingPush, setTestingPush] = useState(false);

  useEffect(() => {
    loadNotifications();
    initializeSocket().catch(() => {});
    getCurrentUser()
      .then((res) => {
        const uid = res?.data?.id || res?.id;
        if (uid) initializeFirebasePush(uid).catch(() => {});
      })
      .catch(() => {});

    const handleLiveNotif = (e) => {
      const newNotif = e.detail;
      if (!newNotif || !newNotif.id) return;
      setNotifications((prev) => {
        if (prev.some((n) => n.id === newNotif.id)) return prev;
        return [newNotif, ...prev];
      });
    };

    window.addEventListener("hirebuddy:notification-received", handleLiveNotif);
    return () => {
      window.removeEventListener("hirebuddy:notification-received", handleLiveNotif);
    };
  }, []);

  const loadNotifications = async () => {
    try {
      const response = await getNotifications();
      const data = response?.notifications || response?.data?.notifications || response?.data || [];
      setNotifications(data);
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
      window.dispatchEvent(new CustomEvent("hirebuddy:notifications-updated"));
    } catch (error) {
      console.error("Failed to mark notifications as read", error);
    }
  };

  const handleMarkRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === notificationId ? { ...item, isRead: true } : item
        )
      );
      window.dispatchEvent(new CustomEvent("hirebuddy:notifications-updated"));
    } catch (error) {
      console.error("Failed to mark notification as read", error);
    }
  };

  const handleSendTestPush = async () => {
    try {
      setTestingPush(true);
      if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
        await Notification.requestPermission().catch(() => {});
      }
      const res = await sendTestPushNotification();
      const created = res?.data?.notification || res?.notification;
      if (created?.id) {
        setNotifications((prev) =>
          prev.some((n) => n.id === created.id) ? prev : [created, ...prev]
        );
      }
      await showServiceWorkerNotification(
        "🔔 Firebase Push Connected",
        "Helper real-time & background push notifications are active!",
        { id: created?.id || `test-${Date.now()}`, clickUrl: "/dashboard-tasker/notifications" }
      );
    } catch (error) {
      console.error("Failed to send test push", error);
    } finally {
      setTestingPush(false);
    }
  };

  return (
    <main className="mx-auto max-w-4xl px-6 py-8 text-slate-100">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Notifications</h1>
          <p className="mt-1 text-sm text-slate-300">Stay updated on your tasks and activities</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSendTestPush}
            disabled={testingPush}
            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/20 disabled:opacity-50"
          >
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            {testingPush ? "Sending Push..." : "Test Firebase Push"}
          </button>

          <button
            onClick={handleMarkAllRead}
            className="text-sm font-medium text-emerald-400 hover:underline"
          >
            Mark all as read
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-900/80 shadow-2xl shadow-slate-950/30">
        {loading ? (
          <div className="p-5">
            <NotificationRowShimmer count={4} />
          </div>
        ) : notifications.length > 0 ? (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`flex gap-4 border-b border-slate-800 px-4 py-4 text-sm ${n.isRead ? "bg-slate-900/60" : "bg-emerald-500/5"}`}
            >
              {!n.isRead && <span className="mt-2 h-2.5 w-2.5 rounded-full bg-emerald-400" />}

              <div className="flex-1">
                <p className="font-medium text-white">{n.title}</p>
                <p className="mt-1 text-slate-300">{n.message}</p>
                <p className="mt-1 text-xs text-slate-400">{new Date(n.createdAt).toLocaleString()}</p>
              </div>

              {!n.isRead && (
                <button
                  onClick={() => handleMarkRead(n.id)}
                  className="text-xs font-medium text-blue-400 hover:text-blue-300"
                >
                  Mark read
                </button>
              )}
            </div>
          ))
        ) : (
          <div className="px-4 py-10 text-center text-sm text-slate-400">You have no notifications.</div>
        )}
      </div>

      <div className="mt-6 text-center">
        <Link href="/dashboard-tasker" className="text-sm text-slate-300 underline hover:text-white">Back to Dashboard</Link>
      </div>
    </main>
  );
}
