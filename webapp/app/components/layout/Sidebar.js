"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Tasks", href: "/tasks" },
  { label: "Workers", href: "/workers" },
  { label: "Orders", href: "/orders" },
  { label: "Reports", href: "/reports" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r h-screen flex flex-col">
      {/* Logo */}
      <div className="h-14 flex items-center px-6 border-b">
        <span className="text-xl font-bold text-black">
          Hire<span className="text-green-600">Buddy</span>
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-4 py-2 rounded-lg text-sm font-medium
                ${
                  isActive
                    ? "bg-green-50 text-green-700"
                    : "text-gray-700 hover:bg-gray-100"
                }
              `}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t text-sm text-gray-500">
        © 2025 HireBuddy
      </div>
    </aside>
  );
}
