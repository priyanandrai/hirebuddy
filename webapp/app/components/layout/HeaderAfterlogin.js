"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function AuthenticatedHeader() {
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const router = useRouter();
  const { data: session, status } = useSession();

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

  const unreadCount = 3; // example

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
    <header className="fixed top-0 z-50 w-full bg-white shadow-sm h-16">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-6 py-3">
        {/* Logo */}
        <Link href="/dashboard" className="text-xl font-bold text-green-600">
          HireBuddy
        </Link>

        {/* Desktop Search */}
        <div className="hidden flex-1 justify-center px-4 sm:flex">
          <div className="relative w-full max-w-md">
            <input
              type="text"
              placeholder="Search services, tasks, helpers..."
              className="w-full rounded-full border border-gray-300 px-4 py-2 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              🔍
            </span>
          </div>
        </div>

        {/* Right Section */}
        <div className="relative flex items-center gap-4" ref={wrapperRef}>
          {/* Mobile Search Toggle */}
          <button
            onClick={() => setShowMobileSearch(!showMobileSearch)}
            className="sm:hidden text-gray-600 hover:text-black"
          >
            🔍
          </button>

          {/* Post Task */}
          <Link
            href="/dashboard/create-task"
            className="hidden sm:block rounded-md bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700"
          >
            Post a Task
          </Link>

          {/* Notifications */}
          <div className="relative">
            <button
              aria-label="Notifications"
              onClick={() => {
                setNotifOpen(!notifOpen);
                setProfileOpen(false);
              }}
              className={`relative text-gray-600 hover:text-black ${
                notifOpen ? "ring-2 ring-green-200 rounded-full" : ""
              }`}
            >
              🔔
              {unreadCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-xs font-semibold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {notifOpen && (
              <div className="absolute right-0 top-12 w-80 animate-scaleIn">
                {/* Arrow */}
                <div className="absolute -top-2 right-4 h-4 w-4 rotate-45 border-l border-t bg-white"></div>

                <div className="rounded-2xl border bg-white shadow-xl overflow-hidden">
                  <div className="border-b px-4 py-3 text-sm font-semibold">
                    Notifications
                  </div>

                  {/* Notification Items */}
                  <div className="max-h-72 overflow-y-auto">
                    <NotificationItem
                      title="Task accepted"
                      desc="A helper accepted your grocery task"
                      time="2m ago"
                      unread
                    />
                    <NotificationItem
                      title="Task completed"
                      desc="Your medicine delivery is done"
                      time="1h ago"
                    />
                    <NotificationItem
                      title="New message"
                      desc="Helper sent you a message"
                      time="Yesterday"
                    />
                  </div>

                  <div className="border-t text-center">
                    <Link
                      href="/dashboard/notifications"
                      className="block px-4 py-3 text-sm text-green-600 hover:bg-gray-50"
                    >
                      View all notifications
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Profile */}
          <div className="relative">
            <button
              onClick={() => {
                setProfileOpen(!profileOpen);
                setNotifOpen(false);
              }}
              className={`flex items-center gap-2 rounded-full border px-3 py-1 transition ${
                profileOpen
                  ? "bg-gray-100 ring-2 ring-green-200"
                  : "hover:bg-gray-100"
              }`}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-sm font-semibold text-green-700">
              <img src={session?.user?.image}></img>
              </div>
              <span className="hidden sm:block text-sm text-gray-700 capitalize">
                {session?.user?.name}
              </span>
            </button>

            {/* Profile Dropdown */}
            {profileOpen && (
              <div className="absolute right-0 top-14 w-64 animate-scaleIn">
                <div className="absolute -top-2 right-6 h-4 w-4 rotate-45 border-l border-t bg-white"></div>

                <div className="rounded-2xl border bg-white shadow-xl overflow-hidden">
                  <div className="flex items-center gap-3 border-b px-4 py-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 font-semibold text-green-700">
                     <img src={session?.user?.image}></img>
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{session?.user?.name}</p>
                      <p className="text-xs text-gray-500">{session?.user?.email}</p>
                    </div>
                  </div>

                  <DropdownItem href="/dashboard" setOpen={setProfileOpen}>
                    📊 Dashboard
                  </DropdownItem>
                  <DropdownItem
                    href="/dashboard/my-tasks"
                    setOpen={setProfileOpen}
                  >
                    📝 My Tasks
                  </DropdownItem>
                  <DropdownItem
                    href="/dashboard/services"
                    setOpen={setProfileOpen}
                  >
                    🧰 Services
                  </DropdownItem>
                  <DropdownItem
                    href="/dashboard/support"
                    setOpen={setProfileOpen}
                  >
                    💬 Support
                  </DropdownItem>

                  <div className="border-t">
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50"
                    >
                      🚪 Logout
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Search */}
      {showMobileSearch && (
        <div className="border-t bg-white px-4 py-3 sm:hidden animate-slideDown">
          <div className="relative">
            <input
              type="text"
              placeholder="Search services, tasks, helpers..."
              className="w-full rounded-full border px-4 py-2 pl-10 text-sm"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              🔍
            </span>
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
      className="flex items-center gap-2 px-4 py-3 text-sm hover:bg-gray-100"
    >
      {children}
    </Link>
  );
}

function NotificationItem({ title, desc, time, unread }) {
  return (
    <div
      className={`px-4 py-3 text-sm hover:bg-gray-50 ${
        unread ? "bg-green-50" : ""
      }`}
    >
      <p className="font-medium">{title}</p>
      <p className="text-xs text-gray-600">{desc}</p>
      <p className="mt-1 text-xs text-gray-400">{time}</p>
    </div>
  );
}
