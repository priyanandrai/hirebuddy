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
    <header className="fixed top-0 z-50 w-full border-b border-slate-800 bg-slate-950/90 backdrop-blur-xl h-16">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-6 py-3">
        <Link href="/dashboard" className="text-xl font-bold text-blue-400">
          HireBuddy
        </Link>

        <div className="hidden flex-1 justify-center px-4 sm:flex">
          <div className="relative w-full max-w-md">
            <input
              type="text"
              placeholder="Search services, tasks, helpers..."
              className="w-full rounded-full border border-slate-700 bg-slate-900/80 px-4 py-2 pl-10 text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              🔍
            </span>
          </div>
        </div>

        <div className="relative flex items-center gap-4" ref={wrapperRef}>
          <button
            onClick={() => setShowMobileSearch(!showMobileSearch)}
            className="sm:hidden text-slate-300 hover:text-white"
          >
            🔍
          </button>

          <Link
            href="/dashboard/create-task"
            className="hidden sm:block rounded-2xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500"
          >
            Post a Task
          </Link>

          <div className="relative">
            <button
              aria-label="Notifications"
              onClick={() => {
                setNotifOpen(!notifOpen);
                setProfileOpen(false);
              }}
              className={`relative rounded-full p-2 text-slate-300 hover:text-white ${
                notifOpen ? "bg-slate-800 ring-2 ring-blue-500/40" : ""
              }`}
            >
              🔔
              {unreadCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-xs font-semibold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 top-12 w-80 animate-scaleIn">
                <div className="absolute -top-2 right-4 h-4 w-4 rotate-45 border-l border-t border-slate-700 bg-slate-900"></div>
                <div className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl shadow-slate-950/40">
                  <div className="border-b border-slate-700 px-4 py-3 text-sm font-semibold text-white">
                    Notifications
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    <NotificationItem title="Task accepted" desc="A helper accepted your grocery task" time="2m ago" unread />
                    <NotificationItem title="Task completed" desc="Your medicine delivery is done" time="1h ago" />
                    <NotificationItem title="New message" desc="Helper sent you a message" time="Yesterday" />
                  </div>
                  <div className="border-t border-slate-700 text-center">
                    <Link href="/dashboard/notifications" className="block px-4 py-3 text-sm text-blue-400 hover:bg-slate-800">
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
              className={`flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-3 py-1 transition ${
                profileOpen ? "ring-2 ring-blue-500/40" : "hover:bg-slate-800"
              }`}
            >
              <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-slate-700 text-sm font-semibold text-slate-100">
                {session?.user?.image ? (
                  <img src={session.user.image} alt={session?.user?.name || "User"} className="h-full w-full object-cover" />
                ) : (
                  <span>{(session?.user?.name || "U").charAt(0).toUpperCase()}</span>
                )}
              </div>
              <span className="hidden sm:block text-sm text-slate-200 capitalize">
                {session?.user?.name}
              </span>
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-14 w-64 animate-scaleIn">
                <div className="absolute -top-2 right-6 h-4 w-4 rotate-45 border-l border-t border-slate-700 bg-slate-900"></div>
                <div className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl shadow-slate-950/40">
                  <div className="flex items-center gap-3 border-b border-slate-700 px-4 py-4">
                    <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-slate-700 font-semibold text-slate-100">
                      {session?.user?.image ? (
                        <img src={session.user.image} alt={session?.user?.name || "User"} className="h-full w-full object-cover" />
                      ) : (
                        <span>{(session?.user?.name || "U").charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{session?.user?.name}</p>
                      <p className="text-xs text-slate-400">{session?.user?.email}</p>
                    </div>
                  </div>

                  <DropdownItem href="/dashboard" setOpen={setProfileOpen}>📊 Dashboard</DropdownItem>
                  <DropdownItem href="/dashboard/my-tasks" setOpen={setProfileOpen}>📝 My Tasks</DropdownItem>
                  <DropdownItem href="/dashboard/services" setOpen={setProfileOpen}>🧰 Services</DropdownItem>
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

function NotificationItem({ title, desc, time, unread }) {
  return (
    <div
      className={`px-4 py-3 text-sm hover:bg-slate-800 ${
        unread ? "bg-blue-500/10" : ""
      }`}
    >
      <p className="font-medium text-white">{title}</p>
      <p className="text-xs text-slate-300">{desc}</p>
      <p className="mt-1 text-xs text-slate-500">{time}</p>
    </div>
  );
}
