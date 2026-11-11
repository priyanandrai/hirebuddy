"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { getPromotionalPopupAd } from "../services/marketplace.service";

export default function DailyPromotionalPopup() {
  const { data: session } = useSession();
  const [promoAd, setPromoAd] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [storageKeyUsed, setStorageKeyUsed] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Identify logged-in user (NextAuth session OR localStorage user/token)
    let userIdentifier = session?.user?.email || session?.user?.id || "";
    if (!userIdentifier) {
      try {
        const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
        const token = localStorage.getItem("token");
        userIdentifier =
          storedUser?.id || storedUser?.email || storedUser?.phone || (token ? "auth_user" : "");
      } catch (e) {}
    }

    // Only show popup when a user is logged in
    if (!userIdentifier) return;

    // 2. Check Once-Per-Day frequency lock so user experience is never disturbed
    const todayStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const dailyKey = `hb_daily_promo_shown_${userIdentifier}_${todayStr}`;
    try {
      if (localStorage.getItem(dailyKey) === "1") {
        return;
      }
    } catch (e) {}

    let delayTimer = null;
    let animTimer = null;
    let isCancelled = false;

    // 3. Fetch Admin-configured Promotional Ad (Product or Service)
    getPromotionalPopupAd()
      .then((res) => {
        if (isCancelled) return;
        const ad = res?.ad;
        if (!ad || !ad.isActive) return;

        // Re-check daily lock in case another tab/mount already showed it
        try {
          if (localStorage.getItem(dailyKey) === "1") return;
        } catch (e) {}

        const delayMs = Math.min(60, Math.max(2, Number(ad.delaySeconds || 6))) * 1000;

        // 4. Show smoothly after the Admin-configured delay
        delayTimer = setTimeout(() => {
          if (isCancelled) return;
          try {
            if (localStorage.getItem(dailyKey) === "1") return;
            localStorage.setItem(dailyKey, "1");
          } catch (e) {}

          setStorageKeyUsed(dailyKey);
          setPromoAd(ad);
          setMounted(true);
          animTimer = setTimeout(() => {
            if (!isCancelled) setVisible(true);
          }, 40);
        }, delayMs);
      })
      .catch(() => {});

    return () => {
      isCancelled = true;
      if (delayTimer) clearTimeout(delayTimer);
      if (animTimer) clearTimeout(animTimer);
    };
  }, [session]);

  const handleClose = () => {
    setVisible(false);
    try {
      if (storageKeyUsed) {
        localStorage.setItem(storageKeyUsed, "1");
      }
    } catch (e) {}
    setTimeout(() => {
      setMounted(false);
    }, 350);
  };

  if (!mounted || !promoAd) return null;

  const isServiceAd = promoAd.adType === "SERVICE";

  return (
    <div
      className={`fixed inset-0 z-[70] flex items-center justify-center p-4 transition-all duration-500 ease-out ${
        visible
          ? "bg-black/65 backdrop-blur-sm opacity-100"
          : "bg-black/0 backdrop-blur-none opacity-0 pointer-events-none"
      }`}
      onClick={handleClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-md overflow-hidden rounded-2xl border border-[#1e3156] bg-[#0a1326] text-slate-100 shadow-2xl transition-all duration-500 ease-out ${
          visible
            ? "translate-y-0 scale-100 opacity-100"
            : "translate-y-6 scale-95 opacity-0"
        }`}
      >
        {/* Top Hero Image Banner */}
        <div className="relative h-48 w-full overflow-hidden bg-[#0d182e]">
          <img
            src={promoAd.imageUrl || "/images/service_home_cleaning.png"}
            alt={promoAd.title}
            className="h-full w-full object-cover transition duration-700 hover:scale-105"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0a1326] via-transparent to-transparent opacity-80" />

          {/* Badge Pill */}
          <span className="absolute left-3 top-3 rounded-full border border-emerald-400/40 bg-emerald-600/95 px-3 py-1 text-[11px] font-extrabold text-white shadow-lg">
            {promoAd.badgeText ||
              (isServiceAd ? "🔥 Featured Service Offer" : "✨ Featured Marketplace Deal")}
          </span>

          {/* Discount Pill */}
          {promoAd.discountText && (
            <span className="absolute left-3 bottom-3 rounded-lg bg-amber-500 px-2.5 py-0.5 text-[11px] font-extrabold text-slate-950 shadow">
              {promoAd.discountText}
            </span>
          )}

          {/* Close Button */}
          <button
            type="button"
            aria-label="Close promotional popup"
            onClick={handleClose}
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-slate-950/75 text-slate-200 transition hover:bg-slate-900 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Popup Body */}
        <div className="p-5">
          <div className="flex items-center justify-between gap-2">
            <span className="rounded-md border border-[#1e3154] bg-[#0d182e] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-300">
              {isServiceAd ? "🛠️ Verified Home Service" : "🛍️ Direct Marketplace Product"}
            </span>
            <span className="text-[11px] font-medium text-slate-400">
              Today&apos;s Spotlight
            </span>
          </div>

          <h3 className="mt-2 text-lg font-extrabold text-white leading-snug">
            {promoAd.title}
          </h3>

          {promoAd.subtitle && (
            <p className="mt-1.5 text-xs leading-relaxed text-slate-300 line-clamp-3">
              {promoAd.subtitle}
            </p>
          )}

          {/* Price Highlight Row */}
          {promoAd.offerPriceRupees ? (
            <div className="mt-4 flex items-baseline gap-2.5 rounded-xl border border-[#1c2f52] bg-[#0d182e] px-3.5 py-2.5">
              <span className="text-xs text-slate-300">Special Price:</span>
              <span className="text-xl font-extrabold text-[#22c58b]">
                ₹{promoAd.offerPriceRupees}
              </span>
              {promoAd.mrpRupees && promoAd.mrpRupees > promoAd.offerPriceRupees && (
                <span className="text-xs text-slate-500 line-through">
                  ₹{promoAd.mrpRupees}
                </span>
              )}
            </div>
          ) : null}

          {/* Action Buttons */}
          <div className="mt-5 grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg border border-[#243860] bg-[#0f1c36] py-2.5 text-center text-xs font-semibold text-slate-200 transition hover:bg-[#162749]"
            >
              Maybe Later
            </button>
            <Link
              href={promoAd.ctaUrl || (isServiceAd ? "/dashboard" : "/marketplace")}
              onClick={handleClose}
              className="rounded-lg bg-[#34b27b] py-2.5 text-center text-xs font-bold text-white shadow-md shadow-emerald-950/30 transition hover:bg-[#2ca16d]"
            >
              {promoAd.ctaText || (isServiceAd ? "Book Service →" : "Buy Now →")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
