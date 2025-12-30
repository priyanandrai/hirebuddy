"use client";

import { useState } from "react";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "Task accepted",
      message: "A helper accepted your grocery task",
      time: "2 minutes ago",
      read: false,
    },
    {
      id: 2,
      title: "Task completed",
      message: "Your medicine delivery has been completed",
      time: "1 hour ago",
      read: false,
    },
    {
      id: 3,
      title: "New message",
      message: "Helper sent you a message regarding your task",
      time: "Yesterday",
      read: true,
    },
    {
      id: 4,
      title: "Payment successful",
      message: "₹500 has been paid successfully",
      time: "2 days ago",
      read: true,
    },
  ]);

  function markAllAsRead() {
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read: true }))
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Notifications
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Stay updated on your tasks and activities
          </p>
        </div>

        <button
          onClick={markAllAsRead}
          className="text-sm font-medium text-green-600 hover:underline"
        >
          Mark all as read
        </button>
      </div>

      {/* Notifications List */}
      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`flex gap-4 border-b px-4 py-4 text-sm ${
              n.read ? "bg-white" : "bg-green-50"
            }`}
          >
            {/* Indicator */}
            {!n.read && (
              <span className="mt-2 h-2 w-2 rounded-full bg-green-600"></span>
            )}

            {/* Content */}
            <div className="flex-1">
              <p className="font-medium text-gray-900">
                {n.title}
              </p>
              <p className="mt-1 text-gray-600">
                {n.message}
              </p>
              <p className="mt-1 text-xs text-gray-400">
                {n.time}
              </p>
            </div>
          </div>
        ))}

        {/* Empty State */}
        {notifications.length === 0 && (
          <div className="px-4 py-10 text-center text-sm text-gray-500">
            You have no notifications.
          </div>
        )}
      </div>
    </main>
  );
}
