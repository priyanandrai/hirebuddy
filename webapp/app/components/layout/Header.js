"use client";

import { useState } from "react";

export default function Header() {
  return (
    <header className="h-14 bg-white border-b flex items-center justify-between px-6">
      {/* Left */}
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-semibold text-gray-900">
          HireBuddy Dashboard
        </h1>
      </div>

      {/* Right */}
      <div className="flex items-center gap-4">
        <button className="text-sm text-gray-600 hover:text-black">
          Notifications
        </button>

        <div className="flex items-center gap-2 cursor-pointer">
          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center font-semibold">
            A
          </div>
          <span className="text-sm font-medium">Admin</span>
        </div>
      </div>
    </header>
  );
}
