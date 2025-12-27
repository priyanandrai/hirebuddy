"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

export default function Header() {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-6 py-3">
        
        {/* Logo */}
        <Link href="/dashboard" className="text-xl font-bold text-green-600">
          HireBuddy
        </Link>

        {/* Search (Center) */}
        <div className="flex flex-1 justify-center px-4">
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
        <div className="relative flex items-center gap-4" ref={dropdownRef}>
          
          {/* Post Task */}
          <Link
            href="/post-task"
            className="hidden rounded-md bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700 sm:block"
          >
            Post a Task
          </Link>

          {/* Notifications */}
          <button
            aria-label="Notifications"
            className="relative text-gray-600 hover:text-black"
          >
            🔔
            <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-red-500"></span>
          </button>

          {/* Profile Button */}
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-2 rounded-full border px-3 py-1 hover:bg-gray-100"
          >
            <div className="h-8 w-8 rounded-full bg-green-100 text-center text-sm font-semibold leading-8 text-green-700">
              R
            </div>
            <span className="hidden text-sm text-gray-700 sm:block">
              Rahul
            </span>
          </button>

          {/* Dropdown */}
          {open && (
            <div className="absolute right-0 top-12 w-52 rounded-lg border bg-white shadow-lg">
              <DropdownItem href="/dashboard">Dashboard</DropdownItem>
              <DropdownItem href="/tasks">My Tasks</DropdownItem>
              <DropdownItem href="/services">Services</DropdownItem>
              <DropdownItem href="/support">Support</DropdownItem>

              <div className="my-1 border-t" />

              <button className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-50">
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

/* ---------- Dropdown Item ---------- */

function DropdownItem({ href, children }) {
  return (
    <Link
      href={href}
      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
    >
      {children}
    </Link>
  );
}
