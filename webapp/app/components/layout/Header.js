"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isSticky, setIsSticky] = useState(false);

  // Sticky on scroll
  useEffect(() => {
    const onScroll = () => {
      setIsSticky(window.scrollY > 10);
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`w-full z-50 transition-all ${
        isSticky
          ? "fixed top-0 bg-white shadow-sm border-b"
          : "relative bg-white"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="text-xl font-bold text-gray-900">
          Hire<span className="text-green-700">Buddy</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-700">
          <Link href="/post-task" className="hover:text-black">
            Post a Task
          </Link>
          <Link href="/how-it-works" className="hover:text-black">
            How it Works
          </Link>
          <Link href="/login" className="hover:text-black">
            Log In
          </Link>
          <Link
            href="/become-a-helper"
            className="px-4 py-2 bg-green-700 text-white rounded-md hover:bg-green-800"
          >
            Become a Helper
          </Link>
        </nav>

        {/* Mobile Hamburger */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden flex flex-col gap-1"
        >
          <span className="w-6 h-0.5 bg-gray-800" />
          <span className="w-6 h-0.5 bg-gray-800" />
          <span className="w-6 h-0.5 bg-gray-800" />
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t px-6 py-4 space-y-4">
          <Link href="#" className="block">
            Post a Task
          </Link>
          <Link href="#" className="block">
            How it Works
          </Link>
          <Link href="#" className="block">
            Log In
          </Link>
          <Link
            href="#"
            className="block text-center bg-green-700 text-white py-2 rounded-md"
          >
            Become a Helper
          </Link>
        </div>
      )}
    </header>
  );
}
