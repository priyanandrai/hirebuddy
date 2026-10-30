"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useContext } from "react";
import { ThemeContext } from "../../providers";
import Image from "next/image";
import {
  getNotifications,
  getUnreadNotificationCount,
} from "../services/notification.service";
import { getUserProfile } from "../services/user.service";
import {
  initializeSocket,
  onReceiveNotification,
} from "../config/socketClient";

export default function AuthenticatedHeader({
  initialQuery = "",
  searchValue,
  onSearchChange,
  onSearchClear,
}) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [internalSearchText, setInternalSearchText] = useState(initialQuery);
  const router = useRouter();
  const { data: session, status } = useSession();

  const isControlled = searchValue !== undefined;
  const searchText = isControlled ? searchValue : internalSearchText;

  const updateSearchText = (val) => {
    if (!isControlled) {
      setInternalSearchText(val);
    }
    if (onSearchChange) {
      onSearchChange(val);
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("hirebuddy:search-change", { detail: val })
      );
    }
  };

  const handleClearSearch = () => {
    updateSearchText("");
    if (onSearchClear) {
      onSearchClear();
    }
  };

  const handleLogout = async () => {
    // 1. Clear backend JWT
    localStorage.removeItem("token");

    // 2. Close dropdown
    setProfileOpen(false);

    // 3. Sign out from NextAuth (Google)
    await signOut({
      redirect: false,
    });

    // 4. Redirect to signup / home
    router.push("/");
  };

  const [unreadCount, setUnreadCount] = useState(0);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  // Sync user profile from localStorage, API, and userProfileUpdated events
  useEffect(() => {
    const syncLocalUser = () => {
      try {
        const stored = localStorage.getItem("user");
        if (stored) {
          setCurrentUser(JSON.parse(stored));
        }
      } catch (e) {}
    };

    syncLocalUser();

    getUserProfile()
      .then((res) => {
        if (res?.user) {
          setCurrentUser((prev) => ({ ...(prev || {}), ...res.user }));
          try {
            const prevStored = JSON.parse(localStorage.getItem("user") || "{}");
            localStorage.setItem(
              "user",
              JSON.stringify({ ...prevStored, ...res.user })
            );
          } catch (e) {}
        }
      })
      .catch(() => {});

    window.addEventListener("storage", syncLocalUser);
    window.addEventListener("userProfileUpdated", syncLocalUser);

    return () => {
      window.removeEventListener("storage", syncLocalUser);
      window.removeEventListener("userProfileUpdated", syncLocalUser);
    };
  }, [session]);

  const displayUser = {
    ...(session?.user || {}),
    ...(currentUser || {}),
    name: currentUser?.name || session?.user?.name || "Puja Rai",
    email: currentUser?.email || session?.user?.email || "",
    image:
      currentUser?.image !== undefined
        ? currentUser.image
        : session?.user?.image || "",
    role: currentUser?.role || session?.user?.role || "USER",
    city: currentUser?.city || "",
    address: currentUser?.address || "",
  };

  // Fetch real notifications and listen to socket events
  useEffect(() => {
    let unsubscribe = () => {};

    const loadData = async () => {
      try {
        const [countRes, notifRes] = await Promise.allSettled([
          getUnreadNotificationCount(),
          getNotifications(5, 0),
        ]);

        if (countRes.status === "fulfilled") {
          const count = countRes.value?.unreadCount ?? countRes.value?.count ?? 0;
          setUnreadCount(typeof count === "number" ? count : 0);
        }

        if (notifRes.status === "fulfilled") {
          const list = notifRes.value?.notifications || notifRes.value?.data?.notifications || [];
          setRecentNotifications(list);
        }
      } catch (e) {
        // Unauthenticated or network error
      }
    };

    const setupSocket = async () => {
      try {
        await initializeSocket();
        unsubscribe = onReceiveNotification((newNotif) => {
          if (!newNotif) return;
          setUnreadCount((c) => c + 1);
          setRecentNotifications((prev) => [newNotif, ...prev.slice(0, 4)]);
        });
      } catch (err) {
        // Socket setup failed silently
      }
    };

    loadData();
    setupSocket();

    return () => {
      unsubscribe();
    };
  }, [session]);

  const wrapperRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setProfileOpen(false);
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close on ESC
  useEffect(() => {
    function onEsc(e) {
      if (e.key === "Escape") {
        setProfileOpen(false);
        setNotifOpen(false);
      }
    }
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, []);

  return (
    <header className="fixed top-0 z-50 w-full border-b bg-[#060c1b]/95 backdrop-blur-xl h-16 border-[#152238]">
      <div className="mx-auto flex max-w-[1360px] items-center justify-between gap-4 px-6 h-full">
        <Link href="/dashboard" className="text-[22px] font-extrabold tracking-tight shrink-0">
          <span className="text-[#10b981]">Hire</span>
          <span className="text-white">Buddy</span>
        </Link>

        <div className="hidden flex-1 justify-center px-4 sm:flex">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const q = searchText.trim();
              if (q) {
                router.push(`/dashboard/search?q=${encodeURIComponent(q)}`);
              } else {
                handleClearSearch();
              }
            }}
            className="relative w-full max-w-[580px]"
          >
            <button
              type="submit"
              aria-label="Search"
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            <input
              name="search"
              type="text"
              value={searchText}
              onChange={(e) => updateSearchText(e.target.value)}
              placeholder="Search services (e.g. cleaning, driver, plumber...)"
              className="w-full rounded-full border border-[#1d2d4e] bg-[#0a1326] py-2 pl-11 pr-10 text-sm text-white placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
            />
            {searchText && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={handleClearSearch}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </form>
        </div>

        <div className="relative flex items-center gap-3.5 shrink-0" ref={wrapperRef}>
          {/* Theme toggle */}
          <ThemeButton />

          <button
            onClick={() => setShowMobileSearch(!showMobileSearch)}
            className="sm:hidden text-slate-300 hover:text-white"
          >
            🔍
          </button>

          <Link
            href="/dashboard/create-task"
            className="hidden sm:inline-flex items-center justify-center gap-1.5 rounded-full bg-[#1361f5] px-5 py-2 text-xs font-bold text-white shadow-md shadow-blue-600/25 transition hover:bg-blue-600"
          >
            <span className="text-sm leading-none font-normal">+</span>
            <span>Post a Task</span>
          </Link>

          <div className="relative">
            <button
              aria-label="Notifications"
              onClick={() => {
                setNotifOpen(!notifOpen);
                setProfileOpen(false);
              }}
              className={`relative rounded-full p-2 text-slate-300 hover:text-white transition ${notifOpen ? "bg-slate-800 ring-2 ring-blue-500/40" : ""
                }`}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute right-0.5 top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#ef4444] px-1 text-[10px] font-bold text-white">
                {unreadCount > 9 ? "9+" : unreadCount > 0 ? unreadCount : 2}
              </span>
            </button>

            {notifOpen && (
              <div className="absolute right-0 top-12 w-80 animate-scaleIn">
                <div className="absolute -top-2 right-4 h-4 w-4 rotate-45 border-l border-t border-slate-700 bg-slate-900"></div>
                <div className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl shadow-slate-950/40">
                  <div className="border-b border-slate-700 px-4 py-3 text-sm font-semibold text-white">
                    Notifications
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-800">
                    {recentNotifications.length > 0 ? (
                      recentNotifications.map((n) => (
                        <NotificationItem
                          key={n.id}
                          title={n.title}
                          desc={n.message}
                          time={new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          unread={!n.isRead}
                          taskId={n.taskId}
                          onClick={() => setNotifOpen(false)}
                        />
                      ))
                    ) : (
                      <div className="px-4 py-8 text-center text-xs text-slate-400">
                        No notifications yet
                      </div>
                    )}
                  </div>
                  <div className="border-t border-slate-700 text-center">
                    <Link
                      href="/dashboard/notifications"
                      onClick={() => setNotifOpen(false)}
                      className="block px-4 py-3 text-sm font-medium text-blue-400 hover:bg-slate-800 transition"
                    >
                      View all notifications
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => {
                setProfileOpen(!profileOpen);
                setNotifOpen(false);
              }}
              className={`flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-3 py-1 transition ${profileOpen ? "ring-2 ring-blue-500/40" : "hover:bg-slate-800"
                }`}
            >
              <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-slate-700 text-sm font-semibold text-slate-100">
                {displayUser.image ? (
                  <img
                    src={displayUser.image}
                    alt={displayUser.name || "User"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span>{(displayUser.name || "U").charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="hidden sm:flex flex-col items-start leading-tight text-left">
                <span className="text-xs font-semibold text-slate-100 capitalize">
                  {displayUser.name}
                </span>
                <span className="text-[10.5px] text-slate-400">
                  {displayUser.role === "USER" ? "User" : "Helper"}
                </span>
              </div>
              <svg
                className="hidden sm:block h-3.5 w-3.5 text-slate-400 ml-0.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-14 w-64 animate-scaleIn">
                <div className="absolute -top-2 right-6 h-4 w-4 rotate-45 border-l border-t border-slate-700 bg-slate-900"></div>
                <div className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl shadow-slate-950/40">
                  <div className="flex items-center gap-3 border-b border-slate-700 px-4 py-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-700 font-semibold text-slate-100">
                      {displayUser.image ? (
                        <img src={displayUser.image} alt={displayUser.name || "User"} className="h-full w-full object-cover" />
                      ) : (
                        <span>{(displayUser.name || "U").charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-white truncate">{displayUser.name}</p>
                      <p className="text-xs text-slate-400 truncate">{displayUser.email}</p>
                      {(displayUser.city || displayUser.address) && (
                        <p className="text-[11px] text-emerald-400 truncate mt-0.5">
                          📍 {displayUser.city || displayUser.address}
                        </p>
                      )}
                    </div>
                  </div>

                  <DropdownItem href="/dashboard" setOpen={setProfileOpen}>📊 Dashboard</DropdownItem>
                  <DropdownItem href="/dashboard/my-tasks" setOpen={setProfileOpen}>📝 My Tasks</DropdownItem>
                  <DropdownItem href="/dashboard/services" setOpen={setProfileOpen}>🧰 Services</DropdownItem>
                  <DropdownItem href="/dashboard/settings" setOpen={setProfileOpen}>⚙️ Settings</DropdownItem>
                  <DropdownItem href="/dashboard/support" setOpen={setProfileOpen}>💬 Support</DropdownItem>

                  <div className="border-t border-slate-700">
                    <button onClick={handleLogout} className="w-full px-4 py-3 text-left text-sm text-red-400 hover:bg-slate-800">
                      🚪 Logout
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showMobileSearch && (
        <div className="border-t border-slate-800 bg-slate-950 px-4 py-3 sm:hidden animate-slideDown">
          <div className="relative">
            <input
              type="text"
              placeholder="Search services, tasks, helpers..."
              className="w-full rounded-full border border-slate-700 bg-slate-900 px-4 py-2 pl-10 text-sm text-slate-100 placeholder:text-slate-400"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
          </div>
        </div>
      )}
    </header>
  );
}

/* ---------- Components ---------- */

function DropdownItem({ href, children, setOpen }) {
  return (
    <Link
      href={href}
      onClick={() => setOpen(false)}
      className="flex items-center gap-2 px-4 py-3 text-sm text-slate-200 hover:bg-slate-800"
    >
      {children}
    </Link>
  );
}

function NotificationItem({ title, desc, time, unread, taskId, onClick }) {
  return (
    <Link
      href={taskId ? `/dashboard/tasks/${taskId}` : "/dashboard/notifications"}
      onClick={onClick}
      className={`block px-4 py-3 text-sm hover:bg-slate-800 transition ${
        unread ? "bg-blue-500/10" : ""
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="font-medium text-white truncate">{title}</p>
        {unread && <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />}
      </div>
      <p className="text-xs text-slate-300 line-clamp-2 mt-0.5">{desc}</p>
      <p className="mt-1 text-[11px] text-slate-500">{time}</p>
    </Link>
  );
}

function ThemeButton() {
  const { theme, toggleTheme } = useContext(ThemeContext);
  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="rounded-full p-2 text-slate-300 hover:text-white"
      title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
    >
      {theme === "dark" ? "🌙" : "☀️"}
    </button>
  );
}
