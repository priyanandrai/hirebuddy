"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Bell, ChevronDown, Moon } from "lucide-react";
import { getUnreadNotificationCount } from "@/app/components/services/notification.service";
import { getUserProfile } from "@/app/components/services/user.service";

export default function HelperHeader() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
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

    const loadData = async () => {
      try {
        const stored = localStorage.getItem("user");
        if (stored && active) {
          setCurrentUser(JSON.parse(stored));
        }
      } catch (e) {}

      try {
        const [notifRes, profileRes] = await Promise.allSettled([
          getUnreadNotificationCount(),
          getUserProfile(),
        ]);

        if (active && notifRes.status === "fulfilled") {
          const count = Number(
            notifRes.value?.unreadCount ||
              notifRes.value?.data?.unreadCount ||
              0
          );
          setUnreadCount(count);
        }

        if (active && profileRes.status === "fulfilled" && profileRes.value?.user) {
          const user = profileRes.value.user;
          setCurrentUser(user);
          try {
            const currentStored = JSON.parse(localStorage.getItem("user") || "{}");
            localStorage.setItem("user", JSON.stringify({ ...currentStored, ...user }));
          } catch (e) {}
        }
      } catch (error) {
        console.error("Failed to fetch header data", error);
      }
    };

    loadData();

    const handleProfileUpdate = () => {
      try {
        const stored = localStorage.getItem("user");
        if (stored) {
          setCurrentUser(JSON.parse(stored));
        }
      } catch (e) {}
    };

    window.addEventListener("storage", handleProfileUpdate);
    window.addEventListener("userProfileUpdated", handleProfileUpdate);

    return () => {
      active = false;
      window.removeEventListener("storage", handleProfileUpdate);
      window.removeEventListener("userProfileUpdated", handleProfileUpdate);
    };
  }, []);

  const isVerified = currentUser?.idVerificationStatus === "VERIFIED";

  const handleLogout = () => {
    setOpen(false);
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    } catch (e) {}
    window.location.href = "/login";
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/dashboard-tasker/tasks?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push("/dashboard-tasker/tasks");
    }
  };

  const badgeCount = unreadCount > 0 ? unreadCount : 1;

  return (
    <header className="sticky top-0 z-50 border-b border-[#13203b] bg-[#060c1a]/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1160px] items-center justify-between gap-4 px-4 sm:px-6 py-3">
        {/* Brand Logo */}
        <Link
          href="/dashboard-tasker"
          className="text-xl sm:text-[22px] font-extrabold tracking-tight shrink-0"
        >
          <span className="text-[#2dd4bf]">Hire</span>
          <span className="text-white">Buddy</span>
        </Link>

        {/* Center Search Pill */}
        <form
          onSubmit={handleSearchSubmit}
          className="hidden md:flex flex-1 max-w-[430px] mx-4"
        >
          <div className="flex w-full items-center gap-2.5 rounded-full border border-[#1d2d4e] bg-[#0a1326] px-4 py-2 text-xs sm:text-sm text-slate-200 focus-within:border-blue-500/60 transition">
            <Search className="h-4 w-4 text-slate-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search services, tasks, helpers..."
              className="w-full bg-transparent text-xs sm:text-[13px] text-slate-200 placeholder-slate-400 focus:outline-none"
            />
          </div>
        </form>

        {/* Right Controls */}
        <div className="relative flex items-center gap-3 sm:gap-3.5" ref={dropdownRef}>
          {/* Theme Moon Button */}
          <button
            type="button"
            aria-label="Toggle theme"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#1d2d4e] bg-[#0b1528] text-amber-400 hover:bg-[#132240] transition"
          >
            <Moon className="h-4 w-4 fill-amber-400 text-amber-400" />
          </button>

          {/* Post a Task Pill Button */}
          <Link
            href="/dashboard/create-task"
            className="rounded-full bg-[#1961f0] hover:bg-blue-600 px-4 sm:px-5 py-2 text-xs sm:text-[13px] font-bold text-white shadow-md shadow-blue-950/50 transition"
          >
            Post a Task
          </Link>

          {/* Notification Bell with Red Badge */}
          <Link
            href="/dashboard-tasker/notifications"
            className="relative flex h-9 w-9 items-center justify-center rounded-full text-slate-200 hover:bg-[#111e38] transition"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5 text-slate-200" />
            <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ef4444] px-1 text-[10px] font-bold text-white shadow">
              {badgeCount}
            </span>
          </Link>

          {/* User Profile Trigger */}
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-2 hover:bg-[#111e38]/70 transition"
          >
            <img
              src={currentUser?.image || "/images/helper_avatar.png"}
              alt={currentUser?.name || "prreto G"}
              className="h-9 w-9 rounded-full object-cover border border-slate-500/70"
            />
            <span className="hidden sm:block text-sm font-semibold text-white">
              {currentUser?.name || "prreto G"}
            </span>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </button>

          {/* Dropdown Menu */}
          {open && (
            <div className="absolute right-0 top-12 w-52 overflow-hidden rounded-2xl border border-[#1d2d4e] bg-[#0b1528] shadow-2xl shadow-black/60 z-50">
              <Link
                href="/dashboard-tasker"
                className="block px-4 py-2.5 text-sm text-slate-200 hover:bg-[#132240]"
                onClick={() => setOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                href="/dashboard-tasker/tasks"
                className="block px-4 py-2.5 text-sm text-slate-200 hover:bg-[#132240]"
                onClick={() => setOpen(false)}
              >
                Available Tasks
              </Link>
              <Link
                href="/dashboard-tasker/my-tasks"
                className="block px-4 py-2.5 text-sm text-slate-200 hover:bg-[#132240]"
                onClick={() => setOpen(false)}
              >
                My Accepted Tasks
              </Link>
              {isVerified && (
                <Link
                  href="/dashboard-tasker/earnings"
                  className="block px-4 py-2.5 text-sm text-slate-200 hover:bg-[#132240]"
                  onClick={() => setOpen(false)}
                >
                  ₹ Earnings
                </Link>
              )}
              <Link
                href="/dashboard-tasker/profile"
                className="block px-4 py-2.5 text-sm text-slate-200 hover:bg-[#132240]"
                onClick={() => setOpen(false)}
              >
                My Profile
              </Link>
              <Link
                href="/dashboard-tasker/support"
                className="block px-4 py-2.5 text-sm text-slate-200 hover:bg-[#132240]"
                onClick={() => setOpen(false)}
              >
                Help & Support
              </Link>

              <div className="border-t border-[#1d2d4e]" />

              <button
                className="w-full px-4 py-2.5 text-left text-sm text-rose-400 hover:bg-[#132240]"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
