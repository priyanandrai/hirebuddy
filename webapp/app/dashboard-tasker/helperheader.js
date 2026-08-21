"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { getUnreadNotificationCount } from "@/app/components/services/notification.service";

export default function HelperHeader() {
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    let active = true;

    const loadUnread = async () => {
      try {
        const response = await getUnreadNotificationCount();
        const count = Number(response?.unreadCount || response?.data?.unreadCount || 0);
        if (active) setUnreadCount(count);
      } catch (error) {
        console.error("Failed to fetch unread notifications", error);
      }
    };

    loadUnread();
    return () => {
      active = false;
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3">
        <Link href="/dashboard-tasker" className="text-lg font-bold text-blue-400">
          HireBuddy
        </Link>

        <div className="relative flex items-center gap-4" ref={dropdownRef}>
          <Link href="/dashboard-tasker/earnings" className="text-sm font-medium text-slate-300 hover:text-white">
            ₹ Earnings
          </Link>

          <Link href="/dashboard-tasker/tasks" className="text-sm font-medium text-slate-300 hover:text-white">
            Tasks
          </Link>

          <Link href="/dashboard-tasker/notifications" className="relative text-sm font-medium text-slate-300 hover:text-white">
            Notifications
            {unreadCount > 0 && (
              <span className="absolute -right-3 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-semibold text-slate-950">
                {unreadCount}
              </span>
            )}
          </Link>

          <button onClick={() => setOpen(!open)} className="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-3 py-1 hover:bg-slate-800">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/15 text-sm font-semibold text-blue-300">
              H
            </div>
            <span className="hidden sm:block text-sm text-slate-200">Helper</span>
          </button>

          {open && (
            <div className="absolute right-0 top-12 w-48 rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl shadow-slate-950/40">
              <Link href="/dashboard-tasker/profile" className="block px-4 py-3 text-sm text-slate-200 hover:bg-slate-800" onClick={() => setOpen(false)}>
                My Profile
              </Link>
              <Link href="/dashboard-tasker/support" className="block px-4 py-3 text-sm text-slate-200 hover:bg-slate-800" onClick={() => setOpen(false)}>
                Help & Support
              </Link>

              <div className="border-t border-slate-700" />

              <button className="w-full px-4 py-3 text-left text-sm text-red-400 hover:bg-slate-800" onClick={() => { setOpen(false); alert("Logout clicked"); }}>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
