"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { acceptTask, getOpenTasks } from "@/app/components/services/task.service";
import { getUserProfile } from "@/app/components/services/user.service";
import HelperDocumentVerificationModal from "@/app/components/ui/HelperDocumentVerificationModal";
import {
  Lock,
  Clock,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

// Realistic sample preview tasks shown under the blur if no tasks are currently open in DB
const SAMPLE_PREVIEW_TASKS = [
  {
    id: "preview-1",
    title: "Test Decline Flow",
    location: "Indiranagar, Bangalore",
    preferredAt: null,
    budget: 1200,
  },
  {
    id: "preview-2",
    title: "Assemble IKEA Bookshelf",
    location: "Modipuram, Meerut",
    preferredAt: null,
    budget: 500,
  },
  {
    id: "preview-3",
    title: "Flow Check Task",
    location: "Meerut",
    preferredAt: "2026-08-21T05:30:00.000Z",
    budget: 800,
  },
];

export default function HelperTasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLoading, setUserLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [acceptingId, setAcceptingId] = useState(null);

  const loadData = async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      setLoading(false);
      setUserLoading(false);
      return;
    }

    try {
      const [profileRes, tasksRes] = await Promise.allSettled([
        getUserProfile(),
        getOpenTasks(token),
      ]);

      if (profileRes.status === "fulfilled" && profileRes.value?.user) {
        const u = profileRes.value.user;
        setCurrentUser(u);
        try {
          const currentStored = JSON.parse(localStorage.getItem("user") || "{}");
          localStorage.setItem("user", JSON.stringify({ ...currentStored, ...u }));
        } catch (e) {}
      }

      if (tasksRes.status === "fulfilled") {
        const res = tasksRes.value;
        const data = res.tasks || res.data || (Array.isArray(res) ? res : []);
        setTasks(data);
      }
    } catch (error) {
      console.error("Failed to load helper tasks or profile", error);
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
          alert("🎉 Congratulations! Your account has been verified! Available tasks are now unlocked.");
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
  const isUnverified =
    !currentUser?.idVerificationStatus ||
    currentUser?.idVerificationStatus === "UNVERIFIED";

  async function handleAcceptTask(taskId) {
    if (!isVerified) {
      alert("You must be a verified helper to accept tasks. Please complete your document verification.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login to accept a task");
      return;
    }

    setAcceptingId(taskId);
    try {
      await acceptTask(taskId, token);
      setTasks((prev) => prev.filter((task) => task.id !== taskId));
      alert("Task accepted successfully!");
    } catch (error) {
      alert(error.message || "Unable to accept task");
    } finally {
      setAcceptingId(null);
    }
  }

  function ignoreTask(taskId) {
    setTasks((prev) => prev.filter((task) => task.id !== taskId));
  }

  // Display either real tasks or sample preview tasks behind blur when tasks array is empty
  const tasksToRender =
    !isVerified && tasks.length === 0 ? SAMPLE_PREVIEW_TASKS : tasks;

  return (
    <main className="relative min-h-screen bg-slate-950 px-5 py-6 text-slate-100 overflow-hidden">
      {/* ========================================================
          BACKGROUND CONTENT (BLURRED WHEN HELPER IS NOT VERIFIED)
         ======================================================== */}
      <section
        className={`mx-auto max-w-4xl transition-all duration-300 ${
          !isVerified && !userLoading
            ? "filter blur-md select-none pointer-events-none opacity-40 grayscale-[20%]"
            : ""
        }`}
      >
        <div className="mb-6 rounded-[2rem] border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-slate-950/30">
          <h1 className="text-2xl font-bold text-white">Available Tasks</h1>
          <p className="mt-1 text-sm text-slate-300">
            Choose a task you want to work on
          </p>
        </div>

        <section className="space-y-4">
          {loading ? (
            <div className="rounded-[1.5rem] border border-slate-800 bg-slate-900/80 p-6 text-sm text-slate-300">
              Loading available tasks...
            </div>
          ) : tasksToRender.length > 0 ? (
            tasksToRender.map((task) => (
              <div
                key={task.id}
                className="rounded-[1.5rem] border border-slate-800 bg-slate-900/80 p-5 shadow-lg shadow-slate-950/20"
              >
                <p className="text-lg font-semibold text-white">{task.title}</p>
                <p className="mt-1 text-sm text-slate-300">📍 {task.location}</p>
                <p className="mt-1 text-sm text-slate-300">
                  ⏰{" "}
                  {task.preferredAt
                    ? new Date(task.preferredAt).toLocaleString()
                    : "Flexible"}
                </p>
                <p className="mt-2 text-lg font-bold text-blue-400">
                  ₹{task.budget}
                </p>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleAcceptTask(task.id)}
                    disabled={acceptingId === task.id || !isVerified}
                    className="rounded-2xl bg-blue-600 px-4 py-3 font-medium text-white transition hover:bg-blue-500 disabled:opacity-60"
                  >
                    {acceptingId === task.id ? "Accepting..." : "Accept"}
                  </button>

                  <button
                    onClick={() => ignoreTask(task.id)}
                    disabled={!isVerified}
                    className="rounded-2xl bg-slate-700 px-4 py-3 font-medium text-slate-200 hover:bg-slate-600"
                  >
                    Ignore
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-[1.5rem] border border-slate-800 bg-slate-900/80 p-6 text-center shadow-xl shadow-slate-950/30">
              <p className="text-slate-200">No tasks available right now.</p>
              <p className="mt-1 text-sm text-slate-400">
                Please check again later.
              </p>
              <Link
                href="/dashboard-tasker"
                className="mt-4 inline-block rounded-2xl bg-blue-600 px-4 py-3 text-white font-medium hover:bg-blue-500 transition"
              >
                Go Back
              </Link>
            </div>
          )}
        </section>
      </section>

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
                    Verification in Progress
                  </h2>
                  <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Your 3 verification documents (Photo, ID Proof, Address Proof)
                    have been submitted and are currently being reviewed by our team.
                  </p>
                  <p className="mt-1.5 text-xs text-slate-400">
                    Available tasks will automatically unlock once your helper
                    account is approved.
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
                    <RefreshCw
                      className={`w-4 h-4 ${checkingStatus ? "animate-spin" : ""}`}
                    />
                    <span>
                      {checkingStatus
                        ? "Checking Status..."
                        : "Check Verification Status"}
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
                    Your verification documents were not approved by the admin
                    team. Please re-upload clear and valid documents to access and
                    accept tasks.
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
                    Verify Account to Unlock Tasks
                  </h2>
                  <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
                    To maintain customer trust and safety, helpers must complete
                    our quick 3-step verification (Selfie, ID Proof, and Address
                    Proof) before viewing task details or accepting tasks.
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

      {/* ========================================================
          DOCUMENT VERIFICATION MODAL
         ======================================================== */}
      {showVerificationModal && (
        <HelperDocumentVerificationModal
          user={currentUser}
          onClose={() => setShowVerificationModal(false)}
          onComplete={(updatedUser) => {
            setCurrentUser(updatedUser);
            setShowVerificationModal(false);
            try {
              localStorage.setItem("user", JSON.stringify(updatedUser));
            } catch (e) {}
          }}
        />
      )}
    </main>
  );
}
