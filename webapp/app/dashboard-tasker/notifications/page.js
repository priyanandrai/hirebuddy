"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/app/components/services/notification.service";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
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
    } catch (error) {
      console.error("Failed to mark notification as read", error);
    }
  };

  return (
    <main className="mx-auto max-w-4xl px-6 py-8 text-slate-100">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Notifications</h1>
          <p className="mt-1 text-sm text-slate-300">Stay updated on your tasks and activities</p>
        </div>

        <button
          onClick={handleMarkAllRead}
          className="text-sm font-medium text-emerald-400 hover:underline"
        >
          Mark all as read
        </button>
      </div>

      <div className="overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-900/80 shadow-2xl shadow-slate-950/30">
        {loading ? (
          <div className="px-4 py-10 text-center text-sm text-slate-400">Loading notifications...</div>
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
