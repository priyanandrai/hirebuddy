"use client";
import { useSession, signIn, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { data: session } = useSession();

  const navTextClass = "text-slate-700";
  const linkHoverClass = "hover:text-slate-950";
  const buttonStyle = "rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition";
  const navBgClass = "fixed inset-x-0 top-0 z-50 bg-white/95 shadow-sm backdrop-blur-xl";

  return (
    <>
      <header className={`w-full z-50 transition-all duration-300 ${navBgClass}`}>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-slate-950">
          <span className="text-emerald-600">Hire</span>
          <span>Buddy</span>
        </Link>

        <nav className={`hidden items-center gap-6 text-sm font-medium md:flex ${navTextClass}`}>
          <Link href="/post-task" className={`${linkHoverClass} transition`}>
            Post a Task
          </Link>
          <Link href="/how-it-works" className={`${linkHoverClass} transition`}>
            How it Works
          </Link>
          {session ? (
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className={buttonStyle}
            >
              Log Out
            </button>
          ) : (
            <Link href="/login" className={buttonStyle}>
              Log In
            </Link>
          )}
          <Link
            href="/become-a-helper"
            className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-700 transition"
          >
            Become a Helper
          </Link>
        </nav>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm"
          aria-label="Toggle menu"
        >
          <span className="flex h-5 w-5 flex-col justify-between">
            <span className="block h-0.5 w-full rounded-full bg-slate-700" />
            <span className="block h-0.5 w-full rounded-full bg-slate-700" />
            <span className="block h-0.5 w-full rounded-full bg-slate-700" />
          </span>
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white/95 px-6 py-5 shadow-2xl shadow-slate-950/10 backdrop-blur-xl">
          <div className="space-y-3">
            <Link
              href="/post-task"
              className="block rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Post a Task
            </Link>
            <Link
              href="/how-it-works"
              className="block rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              How it Works
            </Link>
            {session ? (
              <button
                onClick={() => {
                  signOut({ callbackUrl: "/" });
                  setMenuOpen(false);
                }}
                className="block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Log Out
              </button>
            ) : (
              <Link
                href="/login"
                className="block rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Log In
              </Link>
            )}
            <Link
              href="/become-a-helper"
              className="block rounded-2xl bg-emerald-600 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-emerald-700 transition"
            >
              Become a Helper
            </Link>
          </div>
        </div>
      )}
      </header>
      <div className="h-20" />
    </>
  );
}
