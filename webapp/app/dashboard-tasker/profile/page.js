"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getUserProfile } from "@/app/components/services/user.service";
import HelperDocumentVerificationModal from "@/app/components/ui/HelperDocumentVerificationModal";
import { HelperProfilePageShimmer } from "@/app/components/ui/Shimmer";
import {
  User,
  Phone,
  Mail,
  MapPin,
  Star,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Lock,
  ShieldCheck,
  Edit3,
  ArrowLeft,
  Briefcase,
  Calendar,
  Sparkles,
  RefreshCw,
  FileText,
} from "lucide-react";

export default function TaskerProfilePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  const fetchProfile = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    try {
      const res = await getUserProfile();
      if (res?.user) {
        setUser(res.user);
        try {
          const currentStored = JSON.parse(localStorage.getItem("user") || "{}");
          localStorage.setItem("user", JSON.stringify({ ...currentStored, ...res.user }));
        } catch (e) {}
      }
    } catch (err) {
      console.error("Failed to load helper profile from API", err);
    } finally {
      setLoading(false);
      if (isManualRefresh) setRefreshing(false);
    }
  };

  useEffect(() => {
    // Load initial user state immediately from localStorage to avoid layout flicker
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch (e) {}

    fetchProfile();

    const handleProfileUpdate = () => {
      try {
        const stored = localStorage.getItem("user");
        if (stored) {
          setUser(JSON.parse(stored));
        }
      } catch (e) {}
    };

    window.addEventListener("storage", handleProfileUpdate);
    window.addEventListener("userProfileUpdated", handleProfileUpdate);

    return () => {
      window.removeEventListener("storage", handleProfileUpdate);
      window.removeEventListener("userProfileUpdated", handleProfileUpdate);
    };
  }, []);

  const verificationStatus = user?.idVerificationStatus || "UNVERIFIED";
  const isVerified = verificationStatus === "VERIFIED";
  const isPending = verificationStatus === "PENDING";
  const isRejected = verificationStatus === "REJECTED";

  const skillsList = (() => {
    if (!user?.skills) return [];
    if (Array.isArray(user.skills)) return user.skills.filter(Boolean);
    if (typeof user.skills === "string") {
      return user.skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
    return [];
  })();

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-IN", {
        month: "short",
        year: "numeric",
      })
    : "Recently Joined";

  return (
    <main className="min-h-screen bg-slate-950 px-4 sm:px-6 py-6 sm:py-8 text-slate-100">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Top Header */}
        <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Helper Partner Profile</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              My Profile
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Your details shown to customers and verification status
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchProfile(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition shadow-sm disabled:opacity-60"
              title="Refresh profile data from server"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-blue-400" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <Link
              href="/dashboard-tasker/profile/edit"
              className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit Profile</span>
            </Link>
          </div>
        </section>

        {/* Hero Card */}
        {(loading && !user) || refreshing ? (
          <HelperProfilePageShimmer />
        ) : (
        <>
        <section className="relative overflow-hidden rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6 sm:p-8 shadow-2xl shadow-slate-950/40 backdrop-blur-xl">
          {/* Subtle Ambient Glow */}
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="pointer-events-none absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />

          <div className="relative flex flex-col sm:flex-row sm:items-center gap-6">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              {user?.image ? (
                <img
                  src={user.image}
                  alt={user.name || "Helper"}
                  className="h-20 w-20 sm:h-24 sm:w-24 rounded-3xl object-cover border-2 border-slate-700/80 shadow-2xl"
                />
              ) : (
                <div className="flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-600 border-2 border-slate-700 text-3xl font-extrabold text-white shadow-2xl shadow-blue-600/30">
                  {user?.name ? user.name.charAt(0).toUpperCase() : "H"}
                </div>
              )}

              {/* Status Dot */}
              <div
                className={`absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-slate-900 ${
                  isVerified
                    ? "bg-emerald-500"
                    : isPending
                    ? "bg-blue-400"
                    : isRejected
                    ? "bg-rose-500"
                    : "bg-amber-500"
                }`}
                title={`Status: ${verificationStatus}`}
              />
            </div>

            {/* Name, Verification & Location */}
            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {user?.name || (loading ? "Loading profile..." : "Helper Partner")}
                </h2>

                {/* Verification Badge */}
                {isVerified ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-400 shadow-sm">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Verified Helper</span>
                  </span>
                ) : isPending ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/15 px-3 py-1 text-xs font-semibold text-blue-400 shadow-sm">
                    <Clock className="h-3.5 w-3.5 text-blue-400 animate-pulse" />
                    <span>Under Review</span>
                  </span>
                ) : isRejected ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/15 px-3 py-1 text-xs font-semibold text-rose-400 shadow-sm">
                    <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
                    <span>Verification Rejected</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-400 shadow-sm">
                    <Lock className="h-3.5 w-3.5 text-amber-400" />
                    <span>Unverified</span>
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm text-slate-400">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-slate-500" />
                  <span>{user?.city || user?.address || "Location not set"}</span>
                </span>

                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-slate-500" />
                  <span>Member since {memberSince}</span>
                </span>

                {user?.isAvailable !== false ? (
                  <span className="inline-flex items-center gap-1.5 font-medium text-emerald-400">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Available for work</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 font-medium text-slate-400">
                    <span className="h-2 w-2 rounded-full bg-slate-500" />
                    <span>Currently busy</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            {/* Rating Card */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 shadow-lg text-center">
              <div className="inline-flex items-center justify-center gap-1 text-lg sm:text-xl font-bold text-amber-400">
                <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                <span>{Number(user?.averageRating || 5.0).toFixed(1)}</span>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                {user?.totalReviews ? `${user.totalReviews} Reviews` : "Customer Rating"}
              </p>
            </div>

            {/* Tasks Completed Card */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 shadow-lg text-center">
              <p className="text-lg sm:text-xl font-bold text-white">
                {user?.tasksCompleted ?? 0}
              </p>
              <p className="mt-1 text-xs text-slate-400">Tasks Completed</p>
            </div>

            {/* Experience / Rate Card */}
            <div className="col-span-2 sm:col-span-1 rounded-2xl border border-slate-800 bg-slate-950/60 p-4 shadow-lg text-center">
              <p className="text-lg sm:text-xl font-bold text-emerald-400">
                {user?.hourlyRate ? `₹${user.hourlyRate / 100}/hr` : user?.experience ? `${user.experience} Years` : "Standard"}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {user?.hourlyRate ? "Hourly Rate" : user?.experience ? "Experience" : "Partner Rate"}
              </p>
            </div>
          </div>
        </section>

        {/* Verification Status Banner if not verified */}
        {!isVerified && (
          <section className={`rounded-[2rem] border p-5 shadow-xl ${
            isPending
              ? "border-blue-500/30 bg-blue-500/10"
              : isRejected
              ? "border-rose-500/30 bg-rose-500/10"
              : "border-amber-500/30 bg-amber-500/10"
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className={`mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl border ${
                  isPending
                    ? "border-blue-500/30 bg-blue-500/20 text-blue-300"
                    : isRejected
                    ? "border-rose-500/30 bg-rose-500/20 text-rose-300"
                    : "border-amber-500/30 bg-amber-500/20 text-amber-300"
                }`}>
                  {isPending ? (
                    <Clock className="w-5 h-5 animate-pulse" />
                  ) : isRejected ? (
                    <AlertTriangle className="w-5 h-5" />
                  ) : (
                    <Lock className="w-5 h-5" />
                  )}
                </div>

                <div>
                  <h3 className="text-base font-bold text-white">
                    {isPending
                      ? "Verification Documents Under Review"
                      : isRejected
                      ? "Verification Rejected · Please Re-upload"
                      : "Account Verification Required"}
                  </h3>
                  <p className="mt-1 text-xs sm:text-sm text-slate-300 max-w-xl">
                    {isPending
                      ? "Your Selfie, ID Proof, and Address Proof are being reviewed by the admin team. Once approved, you can accept tasks and access earnings."
                      : isRejected
                      ? "Your submitted documents were rejected. Please update your documents to unlock tasks and earnings."
                      : "Complete your 3-step verification (Selfie, ID Proof, and Address Proof) to unlock tasks and start receiving job requests."}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowVerificationModal(true)}
                className={`flex-shrink-0 rounded-2xl px-5 py-3 text-xs sm:text-sm font-bold transition shadow-lg ${
                  isPending
                    ? "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                    : isRejected
                    ? "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/40"
                    : "bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-950/40"
                }`}
              >
                {isPending ? "View / Update Documents" : isRejected ? "Re-upload Documents" : "Verify Account (3 Steps)"}
              </button>
            </div>
          </section>
        )}

        {/* Contact Information & Account Details */}
        <section className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-6 sm:p-8 shadow-xl shadow-slate-950/30">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-400" />
            <span>Contact & Account Details</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Phone */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
              <p className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>Mobile Number</span>
              </p>
              <p className="mt-1.5 text-sm sm:text-base font-semibold text-white">
                {user?.phone ? (
                  user.phone.startsWith("+") ? user.phone : `+91 ${user.phone}`
                ) : (
                  <span className="text-slate-500 font-normal">Not provided</span>
                )}
              </p>
            </div>

            {/* Email */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
              <p className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>Email Address</span>
              </p>
              <p className="mt-1.5 text-sm sm:text-base font-semibold text-white truncate">
                {user?.email || <span className="text-slate-500 font-normal">Not provided</span>}
              </p>
            </div>

            {/* Location */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
              <p className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>Service City & Address</span>
              </p>
              <p className="mt-1.5 text-sm sm:text-base font-semibold text-white">
                {user?.city || user?.address || (
                  <span className="text-slate-500 font-normal">Not provided</span>
                )}
              </p>
            </div>

            {/* Helper ID */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
              <p className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span>Helper Partner ID</span>
              </p>
              <p className="mt-1.5 text-sm sm:text-base font-mono font-semibold text-blue-400">
                {user?.id ? user.id.slice(0, 13).toUpperCase() : "..."}
              </p>
            </div>
          </div>
        </section>

        {/* Work I Can Do (Skills & Services) */}
        <section className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-6 sm:p-8 shadow-xl shadow-slate-950/30">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-emerald-400" />
              <span>Work I Can Do</span>
            </h3>

            <Link
              href="/dashboard-tasker/profile/edit"
              className="text-xs sm:text-sm font-semibold text-blue-400 hover:text-blue-300"
            >
              Update Services
            </Link>
          </div>

          {skillsList.length > 0 ? (
            <div className="flex flex-wrap gap-2.5">
              {skillsList.map((skill) => (
                <div
                  key={skill}
                  className="inline-flex items-center gap-1.5 rounded-2xl border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-xs sm:text-sm font-medium text-blue-300 shadow-sm"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                  <span>{skill}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-950/40 p-6 text-center">
              <p className="text-sm text-slate-400">
                No specific services selected yet.
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Add skills like Delivery, Shopping, Doctor Visit, or Home Help so customers can find you.
              </p>
              <Link
                href="/dashboard-tasker/profile/edit"
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Select Services Now</span>
              </Link>
            </div>
          )}
        </section>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link
            href="/dashboard-tasker/profile/edit"
            className="flex-1 rounded-2xl bg-blue-600 py-3.5 px-6 text-center text-sm font-bold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition"
          >
            Edit Profile Details
          </Link>

          <Link
            href="/dashboard-tasker"
            className="flex-1 rounded-2xl border border-slate-800 bg-slate-900 py-3.5 px-6 text-center text-sm font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition"
          >
            Back to Dashboard
          </Link>
        </div>
        </>
        )}
      </div>

      {/* Helper 3-Step Document Verification Modal */}
      <HelperDocumentVerificationModal
        isOpen={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
        onComplete={(updatedUser) => {
          setUser(updatedUser);
          setShowVerificationModal(false);
        }}
        user={user}
      />
    </main>
  );
}
