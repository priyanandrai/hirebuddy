"use client";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown, MapPin } from "lucide-react";

export default function Header({ variant = "dark" }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  const [localRole, setLocalRole] = useState(null);
  const { data: session, status } = useSession();
  const isLight = variant === "light";

  useEffect(() => {
    const syncToken = () => {
      try {
        setHasToken(Boolean(localStorage.getItem("token")));
        const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
        setLocalRole(storedUser?.role || null);
      } catch {
        setHasToken(false);
        setLocalRole(null);
      }
    };
    syncToken();
    window.addEventListener("storage", syncToken);
    window.addEventListener("userProfileUpdated", syncToken);
    return () => {
      window.removeEventListener("storage", syncToken);
      window.removeEventListener("userProfileUpdated", syncToken);
    };
  }, []);

  const isLoggedIn =
    hasToken || (status === "authenticated" && Boolean(session?.user));
  const activeRole = localRole || session?.user?.role || "USER";
  const dashboardHref =
    activeRole === "HELPER"
      ? "/dashboard-tasker"
      : activeRole === "SELLER"
      ? "/become-a-seller"
      : "/dashboard";

  const handlePublicLogout = async () => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setHasToken(false);
      window.dispatchEvent(new Event("userProfileUpdated"));
    } catch {}
    await signOut({ callbackUrl: "/" });
  };

  if (isLight) {
    return (
      <>
        <header className="fixed inset-x-0 top-0 z-50 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md transition-all duration-300">
          <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-6">
            <Link href="/" className="flex items-center text-[26px] font-extrabold tracking-tight">
              <span className="text-[#0b8a4e]">Hire</span>
              <span className="text-[#0f172a]">Buddy</span>
            </Link>

            <nav className="hidden items-center gap-7 text-sm font-medium text-slate-800 md:flex">
              <Link href="/post-task" className="hover:text-[#0b8a4e] transition">
                Post a Task
              </Link>
              <Link
                href="/services"
                className="inline-flex items-center gap-1 hover:text-[#0b8a4e] transition"
              >
                <span>Services</span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
              </Link>
              <Link
                href="/marketplace"
                className="inline-flex items-center gap-1.5 rounded-full border border-[#f5dfb8] bg-[#fdf2df] px-3.5 py-1.5 text-sm font-bold text-[#6e2f0e] hover:bg-[#fbe7c6] transition"
              >
                <MapPin className="h-3.5 w-3.5 fill-[#ec4899] text-[#ec4899]" />
                <span>Meerut Market</span>
              </Link>
              <Link href="/how-it-works" className="hover:text-[#0b8a4e] transition">
                How it Works
              </Link>
            </nav>

            <div className="hidden items-center gap-3 md:flex">
              {isLoggedIn ? (
                <>
                  <Link
                    href={dashboardHref}
                    className="px-3 py-2 text-sm font-semibold text-slate-800 hover:text-[#0b8a4e] transition"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={handlePublicLogout}
                    className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-900 shadow-2xs hover:bg-slate-50 transition"
                  >
                    Log Out
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-900 shadow-2xs hover:bg-slate-50 transition"
                >
                  Log In
                </Link>
              )}
              <Link
                href="/become-a-helper"
                className="rounded-full bg-[#0b8a4e] px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#097542] transition"
              >
                Become a Helper
              </Link>
            </div>

            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-800 shadow-2xs"
              aria-label="Toggle menu"
            >
              <span className="flex h-4 w-5 flex-col justify-between">
                <span className="block h-0.5 w-full rounded-full bg-slate-700" />
                <span className="block h-0.5 w-full rounded-full bg-slate-700" />
                <span className="block h-0.5 w-full rounded-full bg-slate-700" />
              </span>
            </button>
          </div>

          {menuOpen && (
            <div className="md:hidden border-t border-slate-200 bg-white px-6 py-5 shadow-xl">
              <div className="space-y-2.5">
                <Link
                  href="/post-task"
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Post a Task
                </Link>
                <Link
                  href="/services"
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Services
                </Link>
                <Link
                  href="/marketplace"
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-xl bg-[#fdf2df] px-4 py-2.5 text-sm font-bold text-[#6e2f0e]"
                >
                  📍 Meerut Market
                </Link>
                <Link
                  href="/become-a-seller"
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Sell Products
                </Link>
                <Link
                  href="/how-it-works"
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  How it Works
                </Link>
                {isLoggedIn ? (
                  <>
                    <Link
                      href={dashboardHref}
                      onClick={() => setMenuOpen(false)}
                      className="block rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Dashboard
                    </Link>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        handlePublicLogout();
                      }}
                      className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-100"
                    >
                      Log Out
                    </button>
                  </>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setMenuOpen(false)}
                    className="block rounded-xl border border-slate-200 px-4 py-2.5 text-center text-sm font-semibold text-slate-800 hover:bg-slate-50"
                  >
                    Log In
                  </Link>
                )}
                <Link
                  href="/become-a-helper"
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-xl bg-[#0b8a4e] px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-[#097542] transition"
                >
                  Become a Helper
                </Link>
              </div>
            </div>
          )}
        </header>
        <div className="h-[76px]" />
      </>
    );
  }

  const navTextClass = "text-white";
  const linkHoverClass = "hover:text-slate-200";
  const buttonStyle = "rounded-full border border-slate-700 bg-slate-900/80 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition";
  const navBgClass = "fixed inset-x-0 top-0 z-50 border-b border-slate-800 bg-slate-950/95 shadow-sm backdrop-blur-xl";

  return (
    <>
      <header className={`w-full z-50 transition-all duration-300 ${navBgClass}`}>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-white">
          <span className="text-emerald-400">Hire</span>
          <span>Buddy</span>
        </Link>

        <nav className={`hidden items-center gap-6 text-sm font-medium md:flex ${navTextClass}`}>
          <Link href="/post-task" className={`${linkHoverClass} transition`}>
            Post a Task
          </Link>
          <Link href="/services" className={`${linkHoverClass} transition`}>
            Services
          </Link>
          <Link href="/hire-buddy" className="rounded-full bg-emerald-500 px-3 py-1 text-sm font-medium text-white hover:bg-emerald-600 transition">
            Hire Buddy
          </Link>
          <Link href="/marketplace" className="rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-sm font-semibold text-amber-300 hover:bg-amber-500/20 transition">
            🛍️ Meerut Market
          </Link>
          <Link href="/become-a-seller" className={`${linkHoverClass} transition`}>
            Sell Products
          </Link>
          <Link href="/how-it-works" className={`${linkHoverClass} transition`}>
            How it Works
          </Link>
          {isLoggedIn ? (
            <>
              <Link href={dashboardHref} className={`${linkHoverClass} transition`}>
                Dashboard
              </Link>
              <button
                onClick={handlePublicLogout}
                className={buttonStyle}
              >
                Log Out
              </button>
            </>
          ) : (
            <Link href="/login" className={buttonStyle}>
              Log In
            </Link>
          )}
          <Link
            href="/become-a-helper"
            className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-700 transition"
          >
            Become a Buddy
          </Link>
        </nav>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-white shadow-sm"
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
            {isLoggedIn ? (
              <>
                <Link
                  href={dashboardHref}
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Dashboard
                </Link>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    handlePublicLogout();
                  }}
                  className="block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  Log Out
                </button>
              </>
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
