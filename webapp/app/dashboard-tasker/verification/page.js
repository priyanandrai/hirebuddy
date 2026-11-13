"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Clock,
  AlertTriangle,
  Lock,
  Camera,
  FileText,
  MapPin,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { getUserProfile } from "@/app/components/services/user.service";
import HelperDocumentVerificationModal from "@/app/components/ui/HelperDocumentVerificationModal";
import { swalAlert } from "@/app/components/lib/swal";

export default function HelperVerificationPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  const loadProfile = async (isManual = false) => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      router.replace("/login");
      return;
    }

    if (isManual) setRefreshing(true);
    try {
      const res = await getUserProfile();
      const profileUser = res?.user || res?.data || null;
      if (profileUser) {
        setUser(profileUser);
        try {
          const prev = JSON.parse(localStorage.getItem("user") || "{}");
          localStorage.setItem(
            "user",
            JSON.stringify({ ...prev, ...profileUser })
          );
          window.dispatchEvent(new Event("userProfileUpdated"));
        } catch {}

        if (isManual) {
          if (profileUser.idVerificationStatus === "VERIFIED") {
            await swalAlert(
              "Congratulations! Your account is now verified. You can accept tasks immediately.",
              {
                title: "Account Verified!",
                icon: "success",
              }
            );
          } else {
            await swalAlert(
              `Current verification status: ${
                profileUser.idVerificationStatus || "UNVERIFIED"
              }. ${
                profileUser.idVerificationStatus === "PENDING"
                  ? "Please wait while our admin team reviews your submitted documents."
                  : "Please upload your documents below to submit for admin approval."
              }`,
              {
                title: "Verification Status",
                icon: "info",
              }
            );
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch verification status", err);
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch {}
    loadProfile(false);
  }, []);

  const verificationStatus = user?.idVerificationStatus || "UNVERIFIED";
  const isVerified = verificationStatus === "VERIFIED";
  const isPending = verificationStatus === "PENDING";
  const isRejected = verificationStatus === "REJECTED";

  const steps = [
    {
      step: 1,
      title: "Live Selfie / Profile Photo",
      description:
        "Clear front-facing photo so customers can recognize their assigned Helper Partner.",
      icon: Camera,
      done: Boolean(user?.image),
      meta: user?.image ? "Photo uploaded" : "Not uploaded yet",
    },
    {
      step: 2,
      title: "Government ID Proof",
      description:
        "Upload Aadhaar Card, PAN Card, Driving License, or Voter ID for identity verification.",
      icon: FileText,
      done: Boolean(user?.idDocumentUrl),
      meta: user?.idDocumentUrl
        ? user?.idDocumentType || "ID document uploaded"
        : "Not uploaded yet",
    },
    {
      step: 3,
      title: "Address Proof",
      description:
        "Upload Aadhaar Back Side, Utility Bill, or Rent Agreement to confirm your local service area.",
      icon: MapPin,
      done: Boolean(user?.addressProofUrl),
      meta: user?.addressProofUrl
        ? user?.addressProofType || "Address proof uploaded"
        : "Not uploaded yet",
    },
  ];

  const completedCount = steps.filter((s) => s.done).length;

  return (
    <main className="min-h-screen bg-[#030814] px-4 sm:px-8 py-6 sm:py-10 text-slate-100">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Top Navigation Row */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/dashboard-tasker"
            className="inline-flex items-center gap-2 rounded-xl border border-[#192c4e] bg-[#081226] px-4 py-2 text-xs sm:text-sm font-semibold text-slate-200 hover:bg-[#10203d] transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Helper Dashboard</span>
          </Link>

          <button
            type="button"
            onClick={() => loadProfile(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-[#192c4e] bg-[#081226] px-4 py-2 text-xs sm:text-sm font-semibold text-slate-200 hover:bg-[#10203d] transition disabled:opacity-60"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                refreshing ? "animate-spin text-blue-400" : "text-blue-400"
              }`}
            />
            <span>{refreshing ? "Checking Status..." : "Refresh Status"}</span>
          </button>
        </div>

        {/* Hero Status Banner */}
        <section
          className={`relative overflow-hidden rounded-3xl border p-6 sm:p-8 shadow-2xl ${
            isVerified
              ? "border-emerald-500/35 bg-gradient-to-br from-emerald-500/15 via-[#071428] to-[#050d1c]"
              : isPending
              ? "border-blue-500/35 bg-gradient-to-br from-blue-500/15 via-[#071428] to-[#050d1c]"
              : isRejected
              ? "border-rose-500/35 bg-gradient-to-br from-rose-500/15 via-[#071428] to-[#050d1c]"
              : "border-amber-500/40 bg-gradient-to-br from-amber-500/15 via-[#071428] to-[#050d1c]"
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-slate-200">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                <span>Partner Verification Center</span>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {isVerified
                    ? "You Are a Verified Partner"
                    : isPending
                    ? "Documents Under Admin Review"
                    : isRejected
                    ? "Verification Rejected — Re-upload Needed"
                    : "Complete Your 3-Step Verification"}
                </h1>

                {isVerified ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-300">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Verified
                  </span>
                ) : isPending ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-400/40 bg-blue-500/20 px-3 py-1 text-xs font-bold text-blue-300">
                    <Clock className="h-3.5 w-3.5 animate-pulse" />
                    Pending Review
                  </span>
                ) : isRejected ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-400/40 bg-rose-500/20 px-3 py-1 text-xs font-bold text-rose-300">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Rejected
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-500/20 px-3 py-1 text-xs font-bold text-amber-300">
                    <Lock className="h-3.5 w-3.5" />
                    Unverified ({completedCount}/3 Uploaded)
                  </span>
                )}
              </div>

              <p className="text-sm text-slate-300 leading-relaxed">
                {isVerified
                  ? "Your government ID and address documents have been verified by HireBuddy Admin. You have full access to accept tasks, receive direct bookings, and withdraw earnings."
                  : isPending
                  ? "Thank you for submitting your documents! Our admin verification team is reviewing your Selfie, ID Proof, and Address Proof. As soon as approved, you can accept tasks immediately."
                  : isRejected
                  ? `Your previous verification submission requires attention${
                      user?.idVerificationNotes
                        ? ` ("${user.idVerificationNotes}")`
                        : ""
                    }. Please upload clear, readable photos of your documents below.`
                  : "To keep customers and helpers safe on HireBuddy, all partners must complete a quick 3-step verification before accepting tasks."}
              </p>
            </div>

            <div className="shrink-0">
              {isVerified ? (
                <Link
                  href="/dashboard-tasker"
                  className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 hover:bg-emerald-400 px-6 py-3.5 text-sm font-extrabold text-slate-950 shadow-lg shadow-emerald-950/50 transition"
                >
                  <span>Browse & Accept Tasks</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowVerificationModal(true)}
                  disabled={loading}
                  className={`inline-flex items-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-extrabold shadow-lg transition ${
                    isPending
                      ? "border border-slate-700 bg-slate-800 text-white hover:bg-slate-700"
                      : isRejected
                      ? "bg-rose-600 text-white hover:bg-rose-500 shadow-rose-950/50"
                      : "bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-amber-950/50"
                  }`}
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span>
                    {isPending
                      ? "View / Update Documents"
                      : isRejected
                      ? "Re-upload Documents Now"
                      : "Start 3-Step Verification"}
                  </span>
                </button>
              )}
            </div>
          </div>
        </section>

        {/* 3-Step Checklist Cards */}
        <section className="rounded-3xl border border-[#152544] bg-[#071124] p-6 sm:p-8 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white">
                Required Verification Steps
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                Upload from your device or use the built-in live camera capture.
              </p>
            </div>
            <span className="rounded-full border border-[#1d325a] bg-[#0b1830] px-3.5 py-1 text-xs font-bold text-blue-300">
              {isVerified ? "3 / 3 Verified" : `${completedCount} / 3 Uploaded`}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {steps.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.step}
                  onClick={() => {
                    if (!isVerified) setShowVerificationModal(true);
                  }}
                  className={`rounded-2xl border p-5 transition ${
                    !isVerified ? "cursor-pointer hover:border-blue-500/50" : ""
                  } ${
                    item.done || isVerified
                      ? "border-emerald-500/30 bg-emerald-500/5"
                      : "border-[#182a4d] bg-[#0a162d]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-400">
                      <Icon className="h-5 w-5" />
                    </span>

                    {item.done || isVerified ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-bold text-emerald-400">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Uploaded
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-bold text-amber-300">
                        Step {item.step}
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-white">
                    {item.title}
                  </h3>
                  <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
                    {item.description}
                  </p>
                  <p className="mt-3 text-xs font-semibold text-slate-300">
                    {item.meta}
                  </p>
                </div>
              );
            })}
          </div>

          {!isVerified && (
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-[#17294a] bg-[#050d1c] p-4">
              <p className="text-xs sm:text-sm text-slate-300">
                {isPending
                  ? "Need to replace a blurry document while your review is pending? You can update your files anytime."
                  : "Ready to unlock tasks? Complete all 3 steps in under 2 minutes."}
              </p>
              <button
                type="button"
                onClick={() => setShowVerificationModal(true)}
                className="w-full sm:w-auto shrink-0 rounded-xl bg-[#0d6efd] hover:bg-blue-600 px-5 py-2.5 text-xs sm:text-sm font-bold text-white transition"
              >
                {isPending ? "Update Submitted Documents" : "Upload Documents"}
              </button>
            </div>
          )}
        </section>
      </div>

      <HelperDocumentVerificationModal
        isOpen={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
        onComplete={(updatedUser) => {
          setUser((prev) => ({ ...(prev || {}), ...updatedUser }));
          try {
            const prevStored = JSON.parse(localStorage.getItem("user") || "{}");
            localStorage.setItem(
              "user",
              JSON.stringify({ ...prevStored, ...updatedUser })
            );
            window.dispatchEvent(new Event("userProfileUpdated"));
          } catch {}
          setShowVerificationModal(false);
        }}
        user={user}
      />
    </main>
  );
}
