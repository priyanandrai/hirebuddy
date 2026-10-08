"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Header from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";
import HireButton from "../../components/hire/HireButton";
import { getHelperByID } from "../../components/services/user.service";

export default function PublicHelperProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const [helper, setHelper] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (!id) return;

    let isMounted = true;
    setLoading(true);

    getHelperByID(id)
      .then((res) => {
        if (!isMounted) return;
        const data = res?.data || res;
        setHelper(data);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("Failed to load helper profile:", err);
        setError("Could not load helper details.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  const rawPrice = helper?.hourlyRate ?? helper?.price;
  const displayPrice = rawPrice ? (rawPrice > 1000 ? Math.round(rawPrice / 100) : rawPrice) : 200;
  const rating = Number(helper?.averageRating || helper?.rating || 4.8).toFixed(1);
  const reviewCount = helper?.totalReviews ?? helper?.reviews ?? 0;
  const initials = (helper?.name || "H")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const skills = Array.isArray(helper?.skills)
    ? helper.skills
    : helper?.skills
    ? String(helper.skills).split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      <Header />

      <div className="max-w-5xl mx-auto px-6 py-10 w-full flex-1">
        {/* Breadcrumb */}
        <nav className="text-sm text-slate-400 mb-6 flex items-center gap-2">
          <Link href="/" className="hover:text-emerald-400 transition-colors">
            Home
          </Link>
          <span>›</span>
          <button
            onClick={() => router.back()}
            className="hover:text-emerald-400 transition-colors"
          >
            Services
          </button>
          <span>›</span>
          <span className="text-slate-200">{helper?.name || "Helper Profile"}</span>
        </nav>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-400 text-sm">Loading helper profile...</p>
          </div>
        ) : error || !helper ? (
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-12 text-center max-w-xl mx-auto">
            <div className="text-4xl mb-3">🔍</div>
            <h2 className="text-xl font-bold text-white mb-2">Helper Not Found</h2>
            <p className="text-slate-400 text-sm mb-6">
              The helper you are looking for might have been moved or is currently unavailable.
            </p>
            <Link
              href="/"
              className="inline-flex items-center px-5 py-2.5 rounded-xl bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition-colors text-sm"
            >
              Browse Categories
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left 2 Cols: Helper Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Profile Card Header */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl backdrop-blur-sm">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                  {helper.image && !imgError ? (
                    <img
                      src={helper.image}
                      alt={helper.name}
                      onError={() => setImgError(true)}
                      className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover ring-4 ring-emerald-500/20 shadow-lg"
                    />
                  ) : (
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 text-white font-bold text-3xl flex items-center justify-center ring-4 ring-emerald-500/20 shadow-lg">
                      {initials}
                    </div>
                  )}

                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                        {helper.name}
                      </h1>
                      {helper.isVerified ? (
                        <span className="inline-flex items-center gap-1.5 text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-medium">
                          ✓ Govt ID Verified
                        </span>
                      ) : null}
                    </div>

                    <p className="text-slate-300 text-sm mt-2 flex items-center gap-2">
                      <span>📍</span> {helper.city || "Meerut Region"}
                    </p>

                    <div className="mt-3 flex items-center gap-4 text-sm flex-wrap">
                      <div className="flex items-center gap-1 text-amber-400 font-semibold">
                        ★ {rating}
                        <span className="text-slate-400 font-normal">
                          ({reviewCount} reviews)
                        </span>
                      </div>
                      <span className="text-slate-600">•</span>
                      <div className="text-slate-300">
                        {helper.experience || 3}+ years experience
                      </div>
                      <span className="text-slate-600">•</span>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            helper.isAvailable ? "bg-emerald-400 animate-pulse" : "bg-slate-500"
                          }`}
                        />
                        <span className={helper.isAvailable ? "text-emerald-400 font-medium" : "text-slate-400"}>
                          {helper.isAvailable ? "Available Now" : "Busy with Task"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Badges strip */}
                <div className="mt-6 pt-6 border-t border-slate-800 grid grid-cols-3 gap-4 text-center">
                  <div className="bg-slate-950/50 rounded-xl p-3 border border-slate-800/80">
                    <div className="text-emerald-400 font-bold text-lg sm:text-xl">
                      {reviewCount > 0 ? `${reviewCount}+` : "20+"}
                    </div>
                    <div className="text-slate-400 text-xs mt-0.5">Tasks Completed</div>
                  </div>
                  <div className="bg-slate-950/50 rounded-xl p-3 border border-slate-800/80">
                    <div className="text-amber-400 font-bold text-lg sm:text-xl">
                      ★ {rating}
                    </div>
                    <div className="text-slate-400 text-xs mt-0.5">Customer Rating</div>
                  </div>
                  <div className="bg-slate-950/50 rounded-xl p-3 border border-slate-800/80">
                    <div className="text-white font-bold text-lg sm:text-xl">
                      {helper.experience || 3} Yrs
                    </div>
                    <div className="text-slate-400 text-xs mt-0.5">Field Experience</div>
                  </div>
                </div>
              </div>

              {/* Skills and Services */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <span>🛠️</span> Skills & Specialties
                </h3>
                <div className="flex flex-wrap gap-2.5">
                  {skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-800 text-emerald-300 border border-slate-700/80 text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                  {skills.length === 0 && (
                    <p className="text-slate-400 text-sm">General helper services</p>
                  )}
                </div>
              </div>

              {/* Trust & Safety */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <span>🛡️</span> HireBuddy Trust & Safety Guarantee
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-slate-300">
                  <div className="flex items-start gap-3">
                    <span className="text-emerald-400 text-lg">✓</span>
                    <div>
                      <strong className="text-white block">Identity Verified</strong>
                      Govt issued photo ID verified by HireBuddy team.
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-emerald-400 text-lg">✓</span>
                    <div>
                      <strong className="text-white block">Escrow Protected</strong>
                      Payment released only after you approve completion.
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-emerald-400 text-lg">✓</span>
                    <div>
                      <strong className="text-white block">Direct Chat</strong>
                      Message and coordinate live inside HireBuddy.
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-emerald-400 text-lg">✓</span>
                    <div>
                      <strong className="text-white block">Transparent Pricing</strong>
                      No hidden fees or unexpected post-service charges.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Col: Booking & Rate Card */}
            <div className="lg:col-span-1">
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl sticky top-24 space-y-6">
                <div>
                  <span className="text-xs uppercase tracking-wider font-semibold text-emerald-400">
                    Standard Hourly Rate
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl sm:text-4xl font-extrabold text-white">
                      ₹{displayPrice}
                    </span>
                    <span className="text-slate-400 text-sm">/ hour</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Inclusive of basic tools and travel within city area.
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800 space-y-3">
                  <HireButton
                    helperId={helper.id}
                    helperName={helper.name}
                    defaultBudget={displayPrice}
                    disabled={!helper.isAvailable}
                    className="w-full py-3.5 rounded-xl font-semibold text-base bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:pointer-events-none text-white shadow-lg shadow-emerald-500/20 transition-all text-center"
                  />

                  <button
                    onClick={() => router.back()}
                    className="w-full py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-sm font-medium transition-colors"
                  >
                    ← Back to Helpers List
                  </button>
                </div>

                <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800/80 text-xs text-slate-400 space-y-2">
                  <div className="flex items-center gap-2 text-slate-300 font-medium">
                    <span>⚡</span> Instant Booking
                  </div>
                  <p>
                    Once submitted, {helper.name.split(" ")[0]} will receive an instant task notification and respond promptly.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}
