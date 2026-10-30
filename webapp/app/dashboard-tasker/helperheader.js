"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search, Bell, ChevronDown, Moon, X } from "lucide-react";
import { getUnreadNotificationCount } from "@/app/components/services/notification.service";
import { getUserProfile } from "@/app/components/services/user.service";

export default function HelperHeader() {
  const router = useRouter();
  const pathname = usePathname();
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
    const syncListener = (e) => {
      if (typeof e.detail?.query === "string") {
        setSearchQuery(e.detail.query);
      }
    };
    window.addEventListener("hirebuddy:helper-search-sync", syncListener);
    return () =>
      window.removeEventListener("hirebuddy:helper-search-sync", syncListener);
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

  const handleSearchChange = (value) => {
    setSearchQuery(value);
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("hirebuddy:helper-search", { detail: { query: value } })
      );
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("hirebuddy:helper-search", { detail: { query: trimmed } })
      );
    }
    if (pathname !== "/dashboard-tasker") {
      router.push(
        trimmed
          ? `/dashboard-tasker?search=${encodeURIComponent(trimmed)}`
          : "/dashboard-tasker"
      );
    }
  };

  const badgeCount = unreadCount > 0 ? unreadCount : 3;

  return (
    <header className="sticky top-0 z-50 border-b border-[#111e38] bg-[#040915]/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-8 py-3">
        {/* Brand Logo */}
        <Link
          href="/dashboard-tasker"
          className="text-xl sm:text-[22px] font-extrabold tracking-tight shrink-0"
        >
          <span className="text-[#10b981]">Hire</span>
          <span className="text-white">Buddy</span>
        </Link>

        {/* Center Search Pill */}
        <form
          onSubmit={handleSearchSubmit}
          className="hidden md:flex flex-1 max-w-[540px] mx-4"
        >
          <div className="flex w-full items-center gap-2.5 rounded-full border border-[#192a4a] bg-[#081225] px-4 py-2 text-xs sm:text-sm text-slate-200 focus-within:border-[#3b82f6] transition">
            <Search className="h-4 w-4 text-slate-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search services (e.g. cleaning, driver, plumber...)"
              className="w-full bg-transparent text-xs sm:text-[13px] text-slate-200 placeholder-slate-400 focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => handleSearchChange("")}
                aria-label="Clear search"
                className="text-slate-400 hover:text-white transition"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </form>

        {/* Right Controls */}
        <div className="relative flex items-center gap-3.5 sm:gap-4" ref={dropdownRef}>
          {/* Theme Moon Button */}
          <button
            type="button"
            aria-label="Toggle theme"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#1a2b4c] bg-[#091326] text-amber-400 hover:bg-[#132240] transition"
          >
            <Moon className="h-4 w-4 fill-amber-400 text-amber-400" />
          </button>

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
            className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-2 hover:bg-[#111e38]/70 transition text-left"
          >
            <img
              src={currentUser?.image || "/images/helper_avatar.png"}
              alt={currentUser?.name || "prreto G"}
              className="h-9 w-9 rounded-full object-cover border border-slate-500/70"
            />
            <div className="hidden sm:flex flex-col leading-tight">
              <span className="text-[13px] font-semibold text-white">
                {currentUser?.name || "prreto G"}
              </span>
              <span className="text-[11px] text-slate-400">Helper</span>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400 ml-0.5" />
          </button>

          {/* Dropdown Menu */}
          {open && (
            <div className="absolute right-0 top-12 w-52 overflow-hidden rounded-2xl border border-[#1d2d4e] bg-[#0b1528] shadow-2xl shadow-black/60 z-50">
              <Link
                href="/dashboard-tasker"
                className="block px-4 py-2.5 text-sm text-slate-200 hover:bg-[#132240]"
                onClick={() => setOpen(false)}
              >
                Helper Home
              </Link>
              <Link
                href="/dashboard-tasker/my-tasks"
                className="block px-4 py-2.5 text-sm text-slate-200 hover:bg-[#132240]"
                onClick={() => setOpen(false)}
              >
                My Accepted Tasks
              </Link>
              <Link
                href="/dashboard-tasker/tasks"
                className="block px-4 py-2.5 text-sm text-slate-200 hover:bg-[#132240]"
                onClick={() => setOpen(false)}
              >
                Browse All Tasks
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
