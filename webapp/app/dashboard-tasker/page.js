"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getAssignedTasks, acceptTask, declineTask } from "@/app/components/services/task.service";
import { getUnreadNotificationCount } from "@/app/components/services/notification.service";
import { initializeSocket, onReceiveNotification } from "@/app/components/config/socketClient";
import { getUserProfile } from "@/app/components/services/user.service";
import HelperDocumentVerificationModal from "@/app/components/ui/HelperDocumentVerificationModal";
import { ShieldCheck, CheckCircle2, ChevronRight, AlertCircle, Clock } from "lucide-react";

export default function HelperDashboardPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const loadDashboard = async () => {
    try {
      const [assignedRes, unreadRes, profileRes] = await Promise.allSettled([
        getAssignedTasks(),
        getUnreadNotificationCount(),
        getUserProfile(),
      ]);

      if (assignedRes.status === "fulfilled") {
        const assignedTasks =
          assignedRes.value?.tasks ||
          assignedRes.value?.data ||
          (Array.isArray(assignedRes.value) ? assignedRes.value : []);
        setTasks(assignedTasks);
      }

      if (unreadRes.status === "fulfilled") {
        setUnreadCount(
          Number(
            unreadRes.value?.unreadCount ||
              unreadRes.value?.data?.unreadCount ||
              0
          )
        );
      }

      if (profileRes.status === "fulfilled" && profileRes.value?.user) {
        const u = profileRes.value.user;
        setCurrentUser(u);
        try {
          const currentStored = JSON.parse(localStorage.getItem("user") || "{}");
          localStorage.setItem("user", JSON.stringify({ ...currentStored, ...u }));
        } catch (e) {}

        const isJustRegistered = sessionStorage.getItem("just_registered_helper") === "true";
        const modalDismissed = sessionStorage.getItem("helper_doc_modal_dismissed") === "true";
        const isUnverified = !u.idVerificationStatus || u.idVerificationStatus === "UNVERIFIED";

        if (isJustRegistered || (isUnverified && !modalDismissed)) {
          setShowVerificationModal(true);
          sessionStorage.removeItem("just_registered_helper");
        }
      }
    } catch (error) {
      console.error("Failed to load helper dashboard", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        const parsed = JSON.parse(stored);
        setCurrentUser(parsed);
        const isJustRegistered = sessionStorage.getItem("just_registered_helper") === "true";
        if (isJustRegistered) {
          setShowVerificationModal(true);
        }
      }
    } catch (e) {}

    loadDashboard();

    let unsubscribe = () => {};
    const setupSocket = async () => {
      try {
        await initializeSocket();
        unsubscribe = onReceiveNotification((newNotif) => {
          if (!newNotif) return;
          // Refresh dashboard data when a new task request or status change arrives
          if (newNotif.type?.includes("task") || newNotif.type?.includes("payment")) {
            loadDashboard();
          }
        });
      } catch (err) {
        console.warn("Socket connection in helper dashboard error:", err);
      }
    };
    setupSocket();

    return () => {
      unsubscribe();
    };
  }, []);

  const handleCloseVerificationModal = () => {
    setShowVerificationModal(false);
    sessionStorage.setItem("helper_doc_modal_dismissed", "true");
  };

  const handleCompleteVerification = (updatedUser) => {
    setCurrentUser(updatedUser);
    try {
      localStorage.setItem("user", JSON.stringify(updatedUser));
    } catch (e) {}
    setShowVerificationModal(false);
    sessionStorage.setItem("helper_doc_modal_dismissed", "true");
  };

  const pendingRequests = useMemo(() => {
    return tasks.filter((task) => task.status === "REQUESTED");
  }, [tasks]);

  const activeTasksList = useMemo(() => {
    return tasks.filter((task) => ["ASSIGNED", "IN_PROGRESS"].includes(task.status));
  }, [tasks]);

  const summary = useMemo(() => {
    const totalEarnings = tasks
      .filter((t) => t.status === "COMPLETED")
      .reduce((sum, task) => sum + Number(task.budget || 0), 0);
    const activeTasks = activeTasksList.length;
    const nextTask = activeTasksList[0] || pendingRequests[0];

    return { totalEarnings, activeTasks, nextTask };
  }, [tasks, activeTasksList, pendingRequests]);

  const handleAcceptRequest = async (taskId) => {
    const token = localStorage.getItem("token");
    setActionLoadingId(taskId);
    try {
      await acceptTask(taskId, token);
      alert("Booking request accepted! Task is now confirmed and ready to start.");
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: "ASSIGNED" } : t))
      );
    } catch (err) {
      console.error("Failed to accept task", err);
      alert(err.message || "Failed to accept booking request");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeclineRequest = async (taskId) => {
    const reason = window.prompt("Reason for declining this request (optional):", "Schedule conflict / Unavailable");
    if (reason === null) return; // User clicked cancel on prompt

    const token = localStorage.getItem("token");
    setActionLoadingId(taskId);
    try {
      await declineTask(taskId, reason || "Helper unavailable", token);
      alert("Booking request declined.");
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (err) {
      console.error("Failed to decline task", err);
      alert(err.message || "Failed to decline booking request");
    } finally {
      setActionLoadingId(null);
    }
  };

  const isUnverified = !currentUser?.idVerificationStatus || currentUser?.idVerificationStatus === "UNVERIFIED";
  const isPending = currentUser?.idVerificationStatus === "PENDING";
  const isRejected = currentUser?.idVerificationStatus === "REJECTED";
  const isVerified = currentUser?.idVerificationStatus === "VERIFIED";

  return (
    <main className="min-h-screen bg-slate-950 px-4 sm:px-6 py-6 text-slate-100">
      <div className="mx-auto max-w-5xl space-y-5">
        {/* Verification Status Banners */}
        {isUnverified && (
          <section className="relative overflow-hidden rounded-[2rem] border-2 border-amber-500/50 bg-gradient-to-r from-amber-500/15 via-amber-600/10 to-slate-900/90 p-5 sm:p-6 shadow-2xl shadow-amber-950/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/20 text-2xl text-amber-400 border border-amber-500/30">
                  ⚠️
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-amber-300 border border-amber-500/30">
                      Action Required
                    </span>
                    <span className="text-xs text-slate-400">Step 1 of 3 Pending</span>
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-white mt-1">
                    Complete 3-Step Verification
                  </h2>
                  <p className="text-xs text-slate-300 mt-0.5 max-w-xl">
                    Upload your selfie, ID proof, and address proof to get your <strong>Verified Partner Badge</strong> and start receiving direct customer tasks.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowVerificationModal(true)}
                className="shrink-0 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold px-5 py-3 text-xs sm:text-sm shadow-lg shadow-amber-950/30 transition active:scale-95"
              >
                <span>Upload Documents Now (3 Steps)</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </section>
        )}

        {isPending && (
          <section className="relative overflow-hidden rounded-[2rem] border border-blue-500/40 bg-gradient-to-r from-blue-500/10 via-blue-600/5 to-slate-900/90 p-5 sm:p-6 shadow-xl shadow-blue-950/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-500/20 text-2xl text-blue-400 border border-blue-500/30">
                  ⏳
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-blue-500/20 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-blue-300 border border-blue-500/30">
                      In Review
                    </span>
                    <span className="text-xs text-slate-400">Under Admin Verification</span>
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-white mt-1">
                    Verification Documents Submitted
                  </h2>
                  <p className="text-xs text-slate-300 mt-0.5 max-w-xl">
                    Your 3 documents (Photo, ID Proof, and Address Proof) are being verified by our team. You&apos;ll receive a confirmation soon.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowVerificationModal(true)}
                className="shrink-0 flex items-center justify-center gap-2 rounded-2xl border border-blue-500/40 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 font-semibold px-4 py-2.5 text-xs transition"
              >
                <span>Update Documents</span>
              </button>
            </div>
          </section>
        )}

        {isRejected && (
          <section className="relative overflow-hidden rounded-[2rem] border-2 border-rose-500/50 bg-gradient-to-r from-rose-500/15 via-rose-600/10 to-slate-900/90 p-5 sm:p-6 shadow-2xl shadow-rose-950/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-500/20 text-2xl text-rose-400 border border-rose-500/30">
                  ❌
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-rose-500/20 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-rose-300 border border-rose-500/30">
                      Action Required
                    </span>
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-white mt-1">
                    Verification Was Not Approved
                  </h2>
                  <p className="text-xs text-slate-300 mt-0.5 max-w-xl">
                    One or more of your documents could not be verified. Please re-upload clear photos of your ID and Address Proof.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowVerificationModal(true)}
                className="shrink-0 flex items-center justify-center gap-2 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold px-5 py-3 text-xs sm:text-sm shadow-lg shadow-rose-950/30 transition active:scale-95"
              >
                <span>Re-upload Documents (3 Steps)</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </section>
        )}

        {/* Welcome Section */}
        <section className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-6 sm:p-8 shadow-2xl shadow-slate-950/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                Hello {currentUser?.name ? currentUser.name : ""} 👋
              </h1>
              {isVerified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 text-xs font-bold text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Verified Partner
                </span>
              )}
            </div>
            <p className="mt-2 text-sm text-slate-300">Welcome back. What would you like to do today?</p>
          </div>
          {!isVerified && (
            <button
              onClick={() => setShowVerificationModal(true)}
              className="inline-flex items-center gap-2 self-start sm:self-auto rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-200 transition"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>
                {isPending ? "View Submitted Proofs" : "Upload Documents (3 Steps)"}
              </span>
            </button>
          )}
        </section>

        {/* ⚡ PROMINENT BOOKING REQUESTS PROMPT ⚡ */}
        {pendingRequests.length > 0 && (
          <section className="rounded-[2rem] border-2 border-amber-500/40 bg-gradient-to-r from-amber-500/10 via-amber-600/5 to-slate-900/80 p-6 shadow-2xl shadow-amber-950/20">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/20 text-xl text-amber-400">
                ⚡
              </span>
              <div>
                <h2 className="text-xl font-bold text-white">
                  Booking Request{pendingRequests.length > 1 ? "s" : ""} Awaiting Your Response ({pendingRequests.length})
                </h2>
                <p className="text-sm text-slate-300">
                  Customers selected you directly for these tasks. Please accept or decline before work begins.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              {pendingRequests.map((req) => (
                <div
                  key={req.id}
                  className="rounded-2xl border border-amber-500/30 bg-slate-900/90 p-5 shadow-lg shadow-black/40 transition hover:border-amber-500/50"
                >
                  <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-amber-500/20 px-3 py-0.5 text-xs font-semibold text-amber-300 border border-amber-500/30">
                          Direct Booking
                        </span>
                        <span className="text-xs text-slate-400">
                          From: <strong className="text-slate-200">{req.createdBy?.name || "Customer"}</strong>
                        </span>
                      </div>
                      <h3 className="mt-2 text-lg font-bold text-white">{req.title}</h3>
                      {req.description && (
                        <p className="mt-1 text-sm text-slate-300 line-clamp-2">{req.description}</p>
                      )}
                    </div>
                    <div className="text-left sm:text-right">
                      <span className="text-xs uppercase text-slate-400">Offered Budget</span>
                      <p className="text-2xl font-black text-emerald-400">₹{req.budget}</p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-400 border-t border-slate-800/80 pt-3">
                    <span>📍 {req.location || "Location to be confirmed"}</span>
                    <span>⏰ {req.preferredAt ? new Date(req.preferredAt).toLocaleString() : "Flexible time"}</span>
                    <span>🏷️ {req.category || "General"}</span>
                  </div>

                  {/* Accept / Decline Action Buttons */}
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <button
                      onClick={() => handleAcceptRequest(req.id)}
                      disabled={actionLoadingId === req.id}
                      className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white shadow-lg shadow-emerald-950/30 hover:bg-emerald-500 disabled:opacity-60 transition"
                    >
                      {actionLoadingId === req.id ? (
                        "Accepting..."
                      ) : (
                        <>
                          <span>🤝</span> Accept Request
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleDeclineRequest(req.id)}
                      disabled={actionLoadingId === req.id}
                      className="flex items-center justify-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-5 py-3 font-semibold text-rose-300 hover:bg-rose-500/20 disabled:opacity-60 transition"
                    >
                      {actionLoadingId === req.id ? (
                        "Declining..."
                      ) : (
                        <>
                          <span>✕</span> Decline
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Quick Links */}
        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <PrimaryAction title="See Available Tasks" desc="New work near you" href="/dashboard-tasker/tasks" bg="bg-blue-600" />
          <PrimaryAction title="My Accepted Tasks" desc="Work you already accepted" href="/dashboard-tasker/my-tasks" bg="bg-slate-800" />
          <PrimaryAction title="Notifications" desc={`${unreadCount} unread updates`} href="/dashboard-tasker/notifications" bg="bg-emerald-600" />
        </section>

        {/* Metric Overview */}
        <section className="grid gap-4 md:grid-cols-3">
          <MetricCard
            label="Pending Direct Requests"
            value={pendingRequests.length}
            highlight={pendingRequests.length > 0}
          />
          <MetricCard label="Active tasks" value={summary.activeTasks} />
          <MetricCard label="Total Earnings" value={`₹${summary.totalEarnings}`} />
        </section>

        {/* Today's Work / Next Up */}
        <section className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-5 shadow-xl shadow-slate-950/20">
          <h2 className="mb-3 text-lg font-semibold text-white">Today’s Work</h2>
          {loading ? (
            <div className="rounded-[1.5rem] border border-slate-700 bg-slate-950/60 p-4 text-sm text-slate-300">
              Loading your work...
            </div>
          ) : summary.nextTask ? (
            <div className="rounded-[1.5rem] border border-slate-700 bg-slate-950/60 p-5">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-white text-lg">{summary.nextTask.title}</p>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    summary.nextTask.status === "REQUESTED"
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                      : summary.nextTask.status === "IN_PROGRESS"
                      ? "bg-blue-500/20 text-blue-300"
                      : "bg-emerald-500/20 text-emerald-300"
                  }`}
                >
                  {summary.nextTask.status === "REQUESTED" ? "⚡ Needs Acceptance" : summary.nextTask.status}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-300">📍 Location: {summary.nextTask.location || "Coordinated with customer"}</p>
              <p className="mt-1 text-sm text-slate-300">💰 Payment: ₹{summary.nextTask.budget}</p>

              {summary.nextTask.status === "REQUESTED" ? (
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleAcceptRequest(summary.nextTask.id)}
                    disabled={actionLoadingId === summary.nextTask.id}
                    className="rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
                  >
                    Accept Request
                  </button>
                  <button
                    onClick={() => handleDeclineRequest(summary.nextTask.id)}
                    disabled={actionLoadingId === summary.nextTask.id}
                    className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 font-semibold text-rose-300 hover:bg-rose-500/20 disabled:opacity-60"
                  >
                    Decline
                  </button>
                </div>
              ) : (
                <Link
                  href={`/dashboard-tasker/my-tasks/${summary.nextTask.id}`}
                  className="mt-4 block rounded-2xl bg-blue-600 px-4 py-3 text-center text-white hover:bg-blue-500 font-semibold"
                >
                  View Task Details
                </Link>
              )}
            </div>
          ) : (
            <div className="rounded-[1.5rem] border border-slate-700 bg-slate-950/60 p-4 text-sm text-slate-400">
              No active tasks yet.
            </div>
          )}
        </section>

        {/* Earnings */}
        <section className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-5 shadow-xl shadow-slate-950/20">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Your Earnings</h2>
            <Link href="/dashboard-tasker/earnings" className="text-sm text-blue-400 hover:text-blue-300">
              View payments
            </Link>
          </div>
          <p className="mt-1 text-sm text-slate-300">
            Total completed: <span className="font-semibold text-white">₹{summary.totalEarnings || 0}</span>
          </p>
        </section>

        {/* Support */}
        <section className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-5 shadow-xl shadow-slate-950/20">
          <h2 className="text-lg font-semibold text-white">Need Help?</h2>
          <p className="mt-1 text-sm text-slate-300">If you have any problem, contact support.</p>
          <Link
            href="/dashboard-tasker/support"
            className="mt-3 block rounded-2xl bg-slate-100 px-4 py-3 text-center text-slate-900 hover:bg-white font-medium"
          >
            Contact Support
          </Link>
        </section>
      </div>

      {/* Helper 3-Step Document Verification Modal */}
      <HelperDocumentVerificationModal
        isOpen={showVerificationModal}
        onClose={handleCloseVerificationModal}
        onComplete={handleCompleteVerification}
        user={currentUser}
      />
    </main>
  );
}

function PrimaryAction({ title, desc, href, bg }) {
  return (
    <Link href={href} className={`${bg} rounded-[1.5rem] p-5 text-white shadow-lg shadow-slate-950/20`}>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-1 text-sm opacity-90">{desc}</p>
    </Link>
  );
}

function MetricCard({ label, value, highlight }) {
  return (
    <div className={`rounded-[1.5rem] border p-5 shadow-lg shadow-slate-950/20 ${
      highlight ? "border-amber-500/50 bg-amber-500/10" : "border-slate-800 bg-slate-900/80"
    }`}>
      <p className="text-sm text-slate-400">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${highlight ? "text-amber-300" : "text-white"}`}>{value}</p>
    </div>
  );
}
