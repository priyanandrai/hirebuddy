"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getPaymentHistory } from "@/app/components/services/payment.service";
import { getUserProfile } from "@/app/components/services/user.service";
import HelperDocumentVerificationModal from "@/app/components/ui/HelperDocumentVerificationModal";
import {
  Lock,
  Clock,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";

export default function TaskerEarningsPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);

  const loadData = async () => {
    try {
      const [paymentsRes, profileRes] = await Promise.allSettled([
        getPaymentHistory(),
        getUserProfile(),
      ]);

      if (paymentsRes.status === "fulfilled") {
        const response = paymentsRes.value;
        const data = response?.payments || response?.data?.payments || response?.data || [];
        setPayments(data);
      }

      if (profileRes.status === "fulfilled" && profileRes.value?.user) {
        const u = profileRes.value.user;
        setCurrentUser(u);
        try {
          const currentStored = JSON.parse(localStorage.getItem("user") || "{}");
          localStorage.setItem("user", JSON.stringify({ ...currentStored, ...u }));
        } catch (e) {}
      }
    } catch (error) {
      console.error("Failed to fetch earnings page data", error);
    } finally {
      setLoading(false);
      setUserLoading(false);
    }
  };

  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        setCurrentUser(JSON.parse(stored));
      }
    } catch (e) {}

    loadData();
  }, []);

  async function checkVerificationStatus() {
    setCheckingStatus(true);
    try {
      const res = await getUserProfile();
      if (res?.user) {
        setCurrentUser(res.user);
        try {
          const currentStored = JSON.parse(localStorage.getItem("user") || "{}");
          localStorage.setItem("user", JSON.stringify({ ...currentStored, ...res.user }));
        } catch (e) {}

        if (res.user.idVerificationStatus === "VERIFIED") {
          alert("🎉 Congratulations! Your account has been verified! Earnings are now unlocked.");
        } else {
          alert(`Current status: ${res.user.idVerificationStatus}. Please wait while admin reviews your documents.`);
        }
      }
    } catch (err) {
      console.error("Failed to refresh status", err);
    } finally {
      setCheckingStatus(false);
    }
  }

  const isVerified = currentUser?.idVerificationStatus === "VERIFIED";
  const isPending = currentUser?.idVerificationStatus === "PENDING";
  const isRejected = currentUser?.idVerificationStatus === "REJECTED";

  const summary = useMemo(() => {
    const total = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const completed = payments.filter((payment) => payment.status === "COMPLETED").length;
    const latest = payments[0];

    return { total, completed, latest };
  }, [payments]);

  return (
    <main className="relative min-h-screen bg-slate-950 px-5 py-6 text-slate-100 overflow-hidden">
      {/* ========================================================
          BACKGROUND CONTENT (BLURRED WHEN HELPER IS NOT VERIFIED)
         ======================================================== */}
      <div
        className={`transition-all duration-300 ${
          !isVerified && !userLoading
            ? "filter blur-md select-none pointer-events-none opacity-40 grayscale-[20%]"
            : ""
        }`}
      >
        <section className="mb-6 mx-auto max-w-4xl">
          <h1 className="text-2xl font-bold text-white">My Earnings</h1>
          <p className="text-sm text-slate-300">Money you earned by completing tasks</p>
        </section>

        <section className="mx-auto mb-8 grid max-w-4xl grid-cols-2 gap-4">
          <EarningCard label="Total" value={summary.total} />
          <EarningCard label="Completed" value={summary.completed} />
        </section>

        <section className="mx-auto max-w-4xl rounded-[2rem] border border-slate-800 bg-slate-900/80 p-5 shadow-2xl shadow-slate-950/30">
          <h2 className="mb-4 text-lg font-semibold text-white">Recent Payments</h2>

          {loading ? (
            <div className="rounded-2xl border border-slate-700 bg-slate-950/60 p-4 text-sm text-slate-300">
              Loading payment history...
            </div>
          ) : payments.length > 0 ? (
            <div className="space-y-3">
              {payments.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/60 p-3">
                  <div>
                    <p className="font-medium text-white">{item.task?.title || "Task payment"}</p>
                    <p className="text-xs text-slate-400">{new Date(item.createdAt).toLocaleDateString()} • {item.status}</p>
                  </div>

                  <p className="font-semibold text-emerald-400">₹{Number(item.amount || 0)}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/60 p-6 text-sm text-slate-400">
              No payment activity yet.
            </div>
          )}
        </section>

        <section className="mx-auto mt-6 max-w-4xl rounded-[2rem] border border-slate-800 bg-slate-900/80 p-4 shadow-xl shadow-slate-950/20">
          <p className="text-sm text-slate-300">{summary.latest ? `Latest payment: ₹${Number(summary.latest.amount || 0)}` : "Payment will be transferred to your bank account."}</p>

          <Link href="/dashboard-tasker/support" className="mt-3 block text-sm text-emerald-400 underline">
            Payment issue? Contact support
          </Link>
        </section>

        <div className="mt-6 text-center">
          <Link href="/dashboard-tasker" className="text-sm text-slate-300 underline hover:text-white">
            Back to Dashboard
          </Link>
        </div>
      </div>

      {/* ========================================================
          VERIFICATION BARRIER OVERLAY (SHOWN UNTIL HELPER IS VERIFIED)
         ======================================================== */}
      {!isVerified && !userLoading && (
        <div className="fixed inset-0 top-[57px] z-30 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl border border-slate-700/80 bg-slate-900/95 p-6 sm:p-8 text-center shadow-2xl shadow-slate-950/90 backdrop-blur-2xl space-y-5">
            {/* ---------------- PENDING STATE ---------------- */}
            {isPending ? (
              <>
                <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-500/15 border border-blue-500/30 text-blue-400 shadow-xl shadow-blue-950/30">
                  <Clock className="h-10 w-10 text-blue-400 animate-pulse" />
                  <span className="absolute -top-1 -right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-blue-500" />
                  </span>
                </div>

                <div>
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/15 border border-blue-500/30 px-3 py-1 text-xs font-semibold text-blue-300">
                    <span>⏳ In Review · Under Admin Verification</span>
                  </div>
                  <h2 className="mt-3 text-xl sm:text-2xl font-bold text-white tracking-tight">
                    Earnings Locked During Verification
                  </h2>
                  <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Your verification documents are currently under review by our admin team.
                    Earnings and payout history will unlock automatically once your helper account is approved.
                  </p>
                </div>

                <div className="flex flex-col gap-2.5 pt-2">
                  <button
                    onClick={() => setShowVerificationModal(true)}
                    className="w-full rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 py-3.5 px-4 text-xs sm:text-sm font-semibold text-slate-200 transition flex items-center justify-center gap-2"
                  >
                    <span>View / Update Uploaded Documents</span>
                  </button>

                  <button
                    onClick={checkVerificationStatus}
                    disabled={checkingStatus}
                    className="w-full rounded-2xl bg-blue-600 hover:bg-blue-500 py-3.5 px-4 text-xs sm:text-sm font-bold text-white transition flex items-center justify-center gap-2 shadow-lg shadow-blue-950/40"
                  >
                    <RefreshCw className={`w-4 h-4 ${checkingStatus ? "animate-spin" : ""}`} />
                    <span>
                      {checkingStatus ? "Checking Status..." : "Check Verification Status"}
                    </span>
                  </button>

                  <Link
                    href="/dashboard-tasker"
                    className="w-full rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 py-3 px-4 text-xs font-medium text-slate-400 hover:text-slate-200 transition flex items-center justify-center gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Helper Dashboard</span>
                  </Link>
                </div>
              </>
            ) : isRejected ? (
              /* ---------------- REJECTED STATE ---------------- */
              <>
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-rose-500/15 border border-rose-500/30 text-rose-400 shadow-xl shadow-rose-950/30">
                  <AlertTriangle className="h-10 w-10 text-rose-400" />
                </div>

                <div>
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/15 border border-rose-500/30 px-3 py-1 text-xs font-semibold text-rose-300">
                    <span>⚠️ Action Required · Documents Rejected</span>
                  </div>
                  <h2 className="mt-3 text-xl sm:text-2xl font-bold text-white tracking-tight">
                    Document Verification Rejected
                  </h2>
                  <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Your verification documents were not approved by the admin team. Please re-upload clear and valid documents to access earnings and work on tasks.
                  </p>
                </div>

                <div className="flex flex-col gap-2.5 pt-2">
                  <button
                    onClick={() => setShowVerificationModal(true)}
                    className="w-full rounded-2xl bg-rose-600 hover:bg-rose-500 py-3.5 px-4 text-xs sm:text-sm font-bold text-white transition flex items-center justify-center gap-2 shadow-lg shadow-rose-950/40"
                  >
                    <span>Re-upload Documents (3 Steps)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <Link
                    href="/dashboard-tasker"
                    className="w-full rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 py-3.5 px-4 text-xs sm:text-sm font-semibold text-slate-300 transition flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Helper Dashboard</span>
                  </Link>
                </div>
              </>
            ) : (
              /* ---------------- UNVERIFIED STATE ---------------- */
              <>
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-500/15 border border-amber-500/30 text-amber-400 shadow-xl shadow-amber-950/30">
                  <Lock className="h-10 w-10 text-amber-400" />
                </div>

                <div>
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 px-3 py-1 text-xs font-semibold text-amber-300">
                    <span>🔒 Verification Required · Partner Safety</span>
                  </div>
                  <h2 className="mt-3 text-xl sm:text-2xl font-bold text-white tracking-tight">
                    Verify Account to View Earnings
                  </h2>
                  <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
                    To maintain security and trust, earnings and payout information are only available to verified helpers. Complete our simple 3-step verification (Selfie, ID Proof, and Address Proof) to get started.
                  </p>
                </div>

                <div className="flex flex-col gap-2.5 pt-2">
                  <button
                    onClick={() => setShowVerificationModal(true)}
                    className="w-full rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 py-3.5 px-4 text-xs sm:text-sm font-bold text-slate-950 transition flex items-center justify-center gap-2 shadow-lg shadow-amber-950/40 active:scale-[0.98]"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Complete Verification Now (3 Steps)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <Link
                    href="/dashboard-tasker"
                    className="w-full rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 py-3.5 px-4 text-xs sm:text-sm font-semibold text-slate-300 transition flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Helper Dashboard</span>
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Helper 3-Step Document Verification Modal */}
      <HelperDocumentVerificationModal
        isOpen={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
        onComplete={(updatedUser) => {
          setCurrentUser(updatedUser);
          setShowVerificationModal(false);
        }}
        user={currentUser}
      />
    </main>
  );
}

function EarningCard({ label, value }) {
  return (
    <div className="rounded-[1.5rem] border border-slate-800 bg-slate-900/80 p-4 text-center shadow-lg shadow-slate-950/20">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-1 text-xl font-bold text-white">₹{value}</p>
    </div>
  );
}
