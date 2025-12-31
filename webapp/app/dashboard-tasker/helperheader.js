"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

export default function HelperHeader() {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-white border-b">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3">

        {/* Logo */}
        <Link
          href="/dashboard-tasker"
          className="text-lg font-bold text-green-600"
        >
          HireBuddy
        </Link>

        {/* Right Section */}
        <div
          className="relative flex items-center gap-4"
          ref={dropdownRef}
        >
          {/* Earnings (important for helper) */}
          <Link
            href="/dashboard-tasker/earnings"
            className="text-sm font-medium text-gray-700 hover:text-black"
          >
            ₹ Earnings
          </Link>

          {/* Tasks */}
          <Link
            href="/dashboard-tasker/tasks"
            className="text-sm font-medium text-gray-700 hover:text-black"
          >
            Tasks
          </Link>

          {/* Profile Button */}
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-2 rounded-full border px-3 py-1 hover:bg-gray-100"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-sm font-semibold text-green-700">
              H
            </div>
            <span className="hidden sm:block text-sm text-gray-700">
              Helper
            </span>
          </button>

          {/* Dropdown */}
          {open && (
            <div className="absolute right-0 top-12 w-48 rounded-xl border bg-white shadow-lg">
              
              <Link
                href="/dashboard-tasker/profile"
                className="block px-4 py-3 text-sm hover:bg-gray-100"
                onClick={() => setOpen(false)}
              >
                My Profile
              </Link>

              <Link
                href="/dashboard-tasker/support"
                className="block px-4 py-3 text-sm hover:bg-gray-100"
                onClick={() => setOpen(false)}
              >
                Help & Support
              </Link>

              <div className="border-t" />

              <button
                className="w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50"
                onClick={() => {
                  setOpen(false);
                  alert("Logout clicked");
                }}
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
