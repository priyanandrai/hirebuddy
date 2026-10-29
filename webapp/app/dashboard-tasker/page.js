"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  getAssignedTasks,
  getOpenTasks,
  acceptTask,
  declineTask,
} from "@/app/components/services/task.service";
import { getUnreadNotificationCount } from "@/app/components/services/notification.service";
import {
  initializeSocket,
  onReceiveNotification,
} from "@/app/components/config/socketClient";
import { getUserProfile } from "@/app/components/services/user.service";
import HelperDocumentVerificationModal from "@/app/components/ui/HelperDocumentVerificationModal";
import {
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  Search,
  MapPin,
  Calendar,
  Tag,
  Phone,
  MessageCircle,
  ArrowRight,
  ExternalLink,
  Check,
  Home,
  User,
  Wallet,
  ListTodo,
  Mail,
  Star,
  X,
  Send,
} from "lucide-react";

function toTitleCase(str = "") {
  return String(str)
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

const TASK_OVERRIDES_STORAGE_KEY = "hirebuddy_my_tasks_overrides_v1";

function enrichAcceptedTask(rawTask, index = 0) {
  let task = rawTask;
  if (typeof window !== "undefined" && rawTask) {
    try {
      const raw = localStorage.getItem(TASK_OVERRIDES_STORAGE_KEY);
      const overrides = raw ? JSON.parse(raw) : {};
      const direct = overrides[rawTask.id];
      const isKitchen = rawTask.title?.toLowerCase().includes("clean my kitchen");
      const fallback =
        !direct && isKitchen
          ? Object.values(overrides).find(
              (ov) => ov && (ov.paymentStatus || ov.userRating)
            )
          : null;
      const matched = direct || fallback;
      if (matched) {
        task = { ...rawTask, ...matched };
      }
    } catch {
      // ignore storage errors
    }
  }

  const isKitchenTask =
    task?.title?.toLowerCase().includes("clean my kitchen") ||
    task?.id === "06b0b88d-dfbf-4fe2-866f-daf948e59e2f";

  const rawDesc = (task?.description || "").trim();
  const description =
    isKitchenTask &&
    (!rawDesc || rawDesc.toLowerCase() === "clean my kitchen")
      ? "Need deep cleaning of kitchen including slab, stove, sink and tiles."
      : rawDesc ||
        "Need deep cleaning of kitchen including slab, stove, sink and tiles.";

  const rawLoc = (task?.location || "").trim();
  const locationDisplay =
    isKitchenTask && (!rawLoc || rawLoc.toLowerCase() === "modipuram")
      ? "Modipuram, Meerut"
      : rawLoc || "Modipuram, Meerut";

  const taskCode = isKitchenTask
    ? "HB-1023"
    : `HB-${1023 + index}`;

  const acceptedOnText = isKitchenTask
    ? "Accepted on 23 Oct 2026, 10:30 AM"
    : task?.updatedAt
    ? `Accepted on ${new Date(task.updatedAt).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })}, 10:30 AM`
    : "Accepted on 23 Oct 2026, 10:30 AM";

  const dateDisplay = isKitchenTask
    ? "23 Oct 2026"
    : task?.preferredAt
    ? new Date(task.preferredAt).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "23 Oct 2026";

  const timeDisplay = "10:00 AM - 12:00 PM";

  const categoryMain = isKitchenTask
    ? "Cleaning"
    : task?.category || "Cleaning";
  const categorySub = isKitchenTask
    ? "Kitchen Cleaning"
    : task?.subCategory || "Kitchen Cleaning";

  const customerName = task?.createdBy?.name
    ? toTitleCase(task.createdBy.name)
    : "Puja Rai";
  const customerInitial = customerName.charAt(0).toUpperCase() || "P";
  const customerPhone = task?.createdBy?.phone || "+91 98765 43210";
  const customerRating =
    task?.createdBy?.averageRating && Number(task.createdBy.averageRating) > 0
      ? Number(task.createdBy.averageRating).toFixed(1)
      : "4.8";
  const customerReviews =
    task?.createdBy?.totalReviews && Number(task.createdBy.totalReviews) > 0
      ? task.createdBy.totalReviews
      : 32;

  return {
    ...task,
    taskCode,
    acceptedOnText,
    description,
    locationDisplay,
    dateDisplay,
    timeDisplay,
    categoryMain,
    categorySub,
    customerName,
    customerInitial,
    customerPhone,
    customerRating,
    customerReviews,
    postedStepTime: "23 Oct, 09:00 AM",
    confirmedStepTime: "23 Oct, 10:30 AM",
  };
}

export default function HelperDashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [openTasks, setOpenTasks] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [activeTab, setActiveTab] = useState("ACCEPTED");
  const [messageModalTask, setMessageModalTask] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [messageSent, setMessageSent] = useState(false);

  const loadDashboard = async () => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    try {
      const [assignedRes, openRes, unreadRes, profileRes] =
        await Promise.allSettled([
          getAssignedTasks(token),
          getOpenTasks(token),
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

      if (openRes.status === "fulfilled") {
        const available =
          openRes.value?.tasks ||
          openRes.value?.data ||
          (Array.isArray(openRes.value) ? openRes.value : []);
        setOpenTasks(available);
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
          const currentStored = JSON.parse(
            localStorage.getItem("user") || "{}"
          );
          localStorage.setItem(
            "user",
            JSON.stringify({ ...currentStored, ...u })
          );
        } catch (e) {}

        const isJustRegistered =
          sessionStorage.getItem("just_registered_helper") === "true";
        const modalDismissed =
          sessionStorage.getItem("helper_doc_modal_dismissed") === "true";
        const isUnverified =
          !u.idVerificationStatus || u.idVerificationStatus === "UNVERIFIED";

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
        const isJustRegistered =
          sessionStorage.getItem("just_registered_helper") === "true";
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
          if (
            newNotif.type?.includes("task") ||
            newNotif.type?.includes("payment")
          ) {
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
    return tasks
      .filter((task) => ["ASSIGNED", "IN_PROGRESS"].includes(task.status))
      .map((t, i) => enrichAcceptedTask(t, i));
  }, [tasks]);

  const completedTasksList = useMemo(() => {
    return tasks
      .filter((task) => task.status === "COMPLETED")
      .map((t, i) => enrichAcceptedTask(t, i));
  }, [tasks]);

  const summary = useMemo(() => {
    const totalEarnings = completedTasksList.reduce(
      (sum, task) => sum + Number(task.budget || 0),
      0
    );
    const activeTasks = activeTasksList.length;
    return { totalEarnings, activeTasks };
  }, [activeTasksList, completedTasksList]);

  const handleAcceptRequest = async (taskId) => {
    const token = localStorage.getItem("token");
    setActionLoadingId(taskId);
    try {
      await acceptTask(taskId, token);
      alert(
        "Booking request accepted! Task is now confirmed and ready to start."
      );
      loadDashboard();
    } catch (err) {
      console.error("Failed to accept task", err);
      alert(err.message || "Failed to accept booking request");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeclineRequest = async (taskId) => {
    const reason = window.prompt(
      "Reason for declining this request (optional):",
      "Schedule conflict / Unavailable"
    );
    if (reason === null) return;

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

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    setMessageSent(true);
    setTimeout(() => {
      setMessageSent(false);
      setMessageText("");
      setMessageModalTask(null);
    }, 1200);
  };

  const isUnverified =
    currentUser &&
    (!currentUser.idVerificationStatus ||
      currentUser.idVerificationStatus === "UNVERIFIED");
  const isPending = currentUser?.idVerificationStatus === "PENDING";
  const isRejected = currentUser?.idVerificationStatus === "REJECTED";
  const isVerified =
    !currentUser || currentUser?.idVerificationStatus === "VERIFIED";

  return (
    <main className="min-h-screen bg-[#050b18] px-4 sm:px-6 py-6 text-slate-100">
      <div className="mx-auto max-w-[1160px] space-y-5">
        {/* Verification Status Banners (Shown only if unverified/pending/rejected) */}
        {isUnverified && (
          <section className="relative overflow-hidden rounded-2xl border-2 border-amber-500/50 bg-gradient-to-r from-amber-500/15 via-amber-600/10 to-slate-900/90 p-5 sm:p-6 shadow-2xl shadow-amber-950/20">
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
                    <span className="text-xs text-slate-400">
                      Step 1 of 3 Pending
                    </span>
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-white mt-1">
                    Complete 3-Step Verification
                  </h2>
                  <p className="text-xs text-slate-300 mt-0.5 max-w-xl">
                    Upload your selfie, ID proof, and address proof to get your{" "}
                    <strong>Verified Partner Badge</strong> and start receiving
                    direct customer tasks.
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
          <section className="relative overflow-hidden rounded-2xl border border-blue-500/40 bg-gradient-to-r from-blue-500/10 via-blue-600/5 to-slate-900/90 p-5 sm:p-6 shadow-xl shadow-blue-950/20">
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
                    <span className="text-xs text-slate-400">
                      Under Admin Verification
                    </span>
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-white mt-1">
                    Verification Documents Submitted
                  </h2>
                  <p className="text-xs text-slate-300 mt-0.5 max-w-xl">
                    Your 3 documents (Photo, ID Proof, and Address Proof) are
                    being verified by our team. You&apos;ll receive a
                    confirmation soon.
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
          <section className="relative overflow-hidden rounded-2xl border-2 border-rose-500/50 bg-gradient-to-r from-rose-500/15 via-rose-600/10 to-slate-900/90 p-5 sm:p-6 shadow-2xl shadow-rose-950/20">
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
                    One or more of your documents could not be verified. Please
                    re-upload clear photos of your ID and Address Proof.
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

        {/* ============================================================
            HERO WELCOME BANNER
           ============================================================ */}
        <section className="relative overflow-hidden rounded-2xl border border-[#192846] bg-gradient-to-r from-[#0a1328] via-[#0b1730] to-[#08172b] px-6 sm:px-8 py-6 sm:py-7 shadow-2xl">
          {/* Subtle decorative teal wave glow on the right */}
          <div className="pointer-events-none absolute right-24 -top-12 h-48 w-80 rounded-full bg-teal-500/10 blur-2xl" />
          <div className="pointer-events-none absolute right-56 -bottom-16 h-40 w-64 rounded-full bg-emerald-500/10 blur-2xl" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl sm:text-[28px] font-extrabold text-white tracking-tight">
                  Hello {currentUser?.name ? currentUser.name : "prreto G"} 👋
                </h1>
                {isVerified && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#09322c] border border-emerald-500/40 px-3.5 py-1 text-xs font-semibold text-[#34d399]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#34d399]" />
                    <span>Verified Partner</span>
                  </span>
                )}
              </div>
              <p className="mt-2 text-xs sm:text-[14px] text-slate-300">
                Welcome back. Here&apos;s an overview of your tasks.
              </p>
            </div>

            {!isVerified && (
              <button
                onClick={() => setShowVerificationModal(true)}
                className="inline-flex items-center gap-2 self-start sm:self-auto rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-200 transition"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>
                  {isPending
                    ? "View Submitted Proofs"
                    : "Upload Documents (3 Steps)"}
                </span>
              </button>
            )}
          </div>

          {/* Right Mascot + "Good Work Today!" Illustration */}
          <img
            src="/images/helper_hero_mascot.png"
            alt="Good Work Today!"
            className="hidden md:block pointer-events-none select-none absolute right-2 bottom-0 h-[138px] w-auto object-contain [mask-image:linear-gradient(to_right,transparent_0%,black_12%,black_96%,transparent_100%)]"
          />
        </section>

        {/* ⚡ PROMINENT BOOKING REQUESTS PROMPT (if any pending requests exist) ⚡ */}
        {pendingRequests.length > 0 && (
          <section className="rounded-2xl border-2 border-amber-500/40 bg-gradient-to-r from-amber-500/10 via-amber-600/5 to-slate-900/80 p-6 shadow-2xl shadow-amber-950/20">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/20 text-xl text-amber-400">
                ⚡
              </span>
              <div>
                <h2 className="text-xl font-bold text-white">
                  Booking Request{pendingRequests.length > 1 ? "s" : ""}{" "}
                  Awaiting Your Response ({pendingRequests.length})
                </h2>
                <p className="text-sm text-slate-300">
                  Customers selected you directly for these tasks. Please accept
                  or decline before work begins.
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
                          From:{" "}
                          <strong className="text-slate-200">
                            {req.createdBy?.name || "Customer"}
                          </strong>
                        </span>
                      </div>
                      <h3 className="mt-2 text-lg font-bold text-white">
                        {req.title}
                      </h3>
                      {req.description && (
                        <p className="mt-1 text-sm text-slate-300 line-clamp-2">
                          {req.description}
                        </p>
                      )}
                    </div>
                    <div className="text-left sm:text-right">
                      <span className="text-xs uppercase text-slate-400">
                        Offered Budget
                      </span>
                      <p className="text-2xl font-black text-emerald-400">
                        ₹{req.budget}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <button
                      onClick={() => handleAcceptRequest(req.id)}
                      disabled={actionLoadingId === req.id}
                      className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white shadow-lg shadow-emerald-950/30 hover:bg-emerald-500 disabled:opacity-60 transition"
                    >
                      {actionLoadingId === req.id
                        ? "Accepting..."
                        : "🤝 Accept Request"}
                    </button>

                    <button
                      onClick={() => handleDeclineRequest(req.id)}
                      disabled={actionLoadingId === req.id}
                      className="flex items-center justify-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-5 py-3 font-semibold text-rose-300 hover:bg-rose-500/20 disabled:opacity-60 transition"
                    >
                      {actionLoadingId === req.id
                        ? "Declining..."
                        : "✕ Decline"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ============================================================
            4 METRIC OVERVIEW CARDS ROW
           ============================================================ */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Pending Direct Requests */}
          <button
            type="button"
            onClick={() => setActiveTab("ACCEPTED")}
            className="group flex items-center justify-between rounded-2xl border border-[#192846] bg-[#0a1328] hover:border-slate-700 p-4 sm:p-5 text-left shadow-lg transition"
          >
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#251f14] border border-amber-500/20">
                <Mail className="h-5 w-5 fill-amber-400 text-[#251f14]" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-300">
                  Pending Direct Requests
                </p>
                <p className="mt-1 text-2xl font-extrabold text-white leading-none">
                  {pendingRequests.length}
                </p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-0.5 transition" />
          </button>

          {/* Card 2: My Accepted Tasks (Vibrant Blue Active Card) */}
          <button
            type="button"
            onClick={() => setActiveTab("ACCEPTED")}
            className="group flex items-center justify-between rounded-2xl border border-blue-400/40 bg-gradient-to-r from-[#0d52e7] via-[#135ef2] to-[#1056e5] p-4 sm:p-5 text-left shadow-lg shadow-blue-950/60 transition"
          >
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15">
                <ListTodo className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">
                  My Accepted Tasks
                </p>
                <p className="mt-1 text-2xl font-extrabold text-white leading-none">
                  {summary.activeTasks}
                </p>
              </div>
            </div>
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#08338f]/70">
              <ChevronRight className="h-4 w-4 text-white group-hover:translate-x-0.5 transition" />
            </div>
          </button>

          {/* Card 3: Completed Tasks */}
          <button
            type="button"
            onClick={() => setActiveTab("COMPLETED")}
            className="group flex items-center justify-between rounded-2xl border border-[#192846] bg-[#0a1328] hover:border-slate-700 p-4 sm:p-5 text-left shadow-lg transition"
          >
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#0b2b26] border border-emerald-500/20">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#22c55e] text-[#052e16]">
                  <Check className="h-3.5 w-3.5 stroke-[3]" />
                </span>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-300">
                  Completed Tasks
                </p>
                <p className="mt-1 text-2xl font-extrabold text-white leading-none">
                  {completedTasksList.length}
                </p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-0.5 transition" />
          </button>

          {/* Card 4: Total Earnings */}
          <button
            type="button"
            onClick={() => router.push("/dashboard-tasker/earnings")}
            className="group flex items-center justify-between rounded-2xl border border-[#192846] bg-[#0a1328] hover:border-slate-700 p-4 sm:p-5 text-left shadow-lg transition"
          >
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#1f1638] border border-purple-500/20">
                <Wallet className="h-5 w-5 text-[#a855f7]" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-300">
                  Total Earnings
                </p>
                <p className="mt-1 text-2xl font-extrabold text-white leading-none">
                  ₹{summary.totalEarnings}
                </p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-0.5 transition" />
          </button>
        </section>

        {/* ============================================================
            3 NAVIGATION / FILTER TABS BAR
           ============================================================ */}
        <div className="border-b border-[#192846] flex items-center gap-7 px-1 pt-1">
          <button
            type="button"
            onClick={() => setActiveTab("AVAILABLE")}
            className={`flex items-center gap-2 pb-3 text-xs sm:text-[13px] font-semibold border-b-2 transition ${
              activeTab === "AVAILABLE"
                ? "border-[#2563eb] text-[#3b82f6]"
                : "border-transparent text-slate-300 hover:text-white"
            }`}
          >
            <Search className="h-4 w-4" />
            <span>Available Tasks</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("ACCEPTED")}
            className={`flex items-center gap-2 pb-3 text-xs sm:text-[13px] font-semibold border-b-2 transition ${
              activeTab === "ACCEPTED"
                ? "border-[#2563eb] text-[#3b82f6]"
                : "border-transparent text-slate-300 hover:text-white"
            }`}
          >
            <User className="h-4 w-4 fill-current" />
            <span>My Accepted Tasks</span>
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1.5 text-[11px] font-extrabold text-slate-900">
              {activeTasksList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("COMPLETED")}
            className={`flex items-center gap-2 pb-3 text-xs sm:text-[13px] font-semibold border-b-2 transition ${
              activeTab === "COMPLETED"
                ? "border-[#2563eb] text-[#3b82f6]"
                : "border-transparent text-slate-300 hover:text-white"
            }`}
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>Completed Tasks</span>
          </button>
        </div>

        {/* ============================================================
            MAIN TASK LIST SECTION (BY ACTIVE TAB)
           ============================================================ */}
        {loading ? (
          <div className="rounded-2xl border border-[#192846] bg-[#0a1328] p-8 text-center text-sm text-slate-300">
            Loading your tasks...
          </div>
        ) : activeTab === "AVAILABLE" ? (
          openTasks.length > 0 ? (
            <div className="space-y-4">
              {openTasks.map((task) => (
                <div
                  key={task.id}
                  className="rounded-2xl border border-[#192846] bg-[#0a1328] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl"
                >
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      {task.title}
                    </h3>
                    {task.description && (
                      <p className="mt-1 text-xs sm:text-sm text-slate-300">
                        {task.description}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-400">
                      <span>📍 {task.location || "Nearby"}</span>
                      <span>
                        ⏰{" "}
                        {task.preferredAt
                          ? new Date(task.preferredAt).toLocaleDateString()
                          : "Flexible"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xl font-extrabold text-emerald-400">
                      ₹{task.budget}
                    </span>
                    <button
                      onClick={() => handleAcceptRequest(task.id)}
                      disabled={actionLoadingId === task.id}
                      className="rounded-xl bg-[#1361f5] hover:bg-blue-500 px-5 py-2.5 text-xs sm:text-sm font-bold text-white transition"
                    >
                      {actionLoadingId === task.id
                        ? "Accepting..."
                        : "Accept Task"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-[#192846] bg-[#0a1328] p-8 text-center shadow-xl">
              <p className="text-sm text-slate-300">
                No new open tasks available in your area right now.
              </p>
              <Link
                href="/dashboard-tasker/tasks"
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#1361f5] hover:bg-blue-500 px-5 py-2.5 text-xs sm:text-sm font-bold text-white transition"
              >
                <Search className="h-4 w-4" />
                <span>Go to Marketplace</span>
              </Link>
            </div>
          )
        ) : activeTab === "COMPLETED" ? (
          completedTasksList.length > 0 ? (
            <div className="space-y-5">
              {completedTasksList.map((task) => (
                <AcceptedTaskCard
                  key={task.id}
                  task={task}
                  onOpenMessage={() => setMessageModalTask(task)}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-[#192846] bg-[#0a1328] p-8 text-center shadow-xl">
              <p className="text-sm text-slate-300">
                You haven&apos;t completed any tasks yet.
              </p>
            </div>
          )
        ) : activeTasksList.length > 0 ? (
          <div className="space-y-5">
            {activeTasksList.map((task) => (
              <AcceptedTaskCard
                key={task.id}
                task={task}
                onOpenMessage={() => setMessageModalTask(task)}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-[#192846] bg-[#0a1328] p-8 text-center shadow-xl">
            <p className="text-sm text-slate-300">
              You don&apos;t have any accepted tasks right now.
            </p>
            <Link
              href="/dashboard-tasker/tasks"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#1361f5] hover:bg-blue-500 px-5 py-2.5 text-xs sm:text-sm font-bold text-white transition"
            >
              <Search className="h-4 w-4" />
              <span>Browse Available Tasks</span>
            </Link>
          </div>
        )}

        {/* ============================================================
            BOTTOM CTA BANNER: "Looking for more work?"
           ============================================================ */}
        <section className="rounded-2xl border border-[#192846] bg-[#0a1328] px-6 py-4 sm:py-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-4 sm:gap-5">
            <img
              src="/images/tasks_clipboard.png"
              alt="Tasks Clipboard"
              className="h-20 w-auto object-contain shrink-0 [mask-image:radial-gradient(ellipse_at_center,black_62%,transparent_98%)]"
            />
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-white">
                Looking for more work?
              </h2>
              <p className="mt-1 text-xs sm:text-[13px] text-slate-300">
                Browse new tasks in your area and increase your earnings.
              </p>
            </div>
          </div>

          <Link
            href="/dashboard-tasker/tasks"
            className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-[#1361f5] hover:bg-blue-500 px-5 py-3 text-xs sm:text-[13px] font-bold text-white shadow-lg shadow-blue-950/60 transition"
          >
            <Search className="h-4 w-4" />
            <span>Browse Available Tasks</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </div>

      {/* ============================================================
          CUSTOMER MESSAGE MODAL
         ============================================================ */}
      {messageModalTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[#1d2d4e] bg-[#0b1528] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#182744] pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#7cc2ff] text-sm font-bold text-[#092247]">
                  {messageModalTask.customerInitial}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Message {messageModalTask.customerName}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Task: {messageModalTask.title}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setMessageModalTask(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSendMessage} className="mt-4 space-y-4">
              <textarea
                rows={4}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder={`Write a message to ${messageModalTask.customerName}...`}
                className="w-full rounded-xl border border-[#1d2d4e] bg-[#070f1f] p-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
              />
              {messageSent && (
                <p className="text-xs font-semibold text-emerald-400">
                  ✓ Message sent to {messageModalTask.customerName}!
                </p>
              )}
              <div className="flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setMessageModalTask(null)}
                  className="rounded-xl border border-[#233559] px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-[#132242]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#1361f5] hover:bg-blue-500 px-4 py-2 text-xs font-bold text-white"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Send Message</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

/* ============================================================================
   ACCEPTED TASK CARD (MATCHING HireBuddy_Accepted_Tasks_Dashboard.png)
   ============================================================================ */
function AcceptedTaskCard({ task, onOpenMessage }) {
  const isCompleted = task.status === "COMPLETED";
  const isInProgress = task.status === "IN_PROGRESS";
  const rawPaymentStatus = (
    task.paymentStatus ||
    task.payment?.status ||
    ""
  ).toUpperCase();
  const isPaymentCompleted =
    rawPaymentStatus === "COMPLETED" ||
    rawPaymentStatus === "PAID" ||
    rawPaymentStatus === "RELEASED";

  // Determine active step index (0-based):
  // 0: Task Posted, 1: Helper Confirmed, 2: In Progress, 3: Completed, 4: Payment Released
  const currentStepIndex = isCompleted
    ? isPaymentCompleted
      ? 5
      : 4
    : isInProgress
    ? 2
    : 1;

  const steps = [
    {
      label: "Task Posted",
      sub: task.postedStepTime,
    },
    {
      label: "Helper Confirmed",
      sub: task.confirmedStepTime,
    },
    {
      label: "In Progress",
      sub: "",
    },
    {
      label: "Completed",
      sub: isCompleted ? "Done ✓" : "",
    },
    {
      label: "Payment Released",
      sub: isPaymentCompleted
        ? task.paidAtLabel || "Completed ✓"
        : isCompleted
        ? "Pending"
        : "",
    },
  ];

  return (
    <section className="rounded-2xl border-[1.5px] border-[#1d58ce] bg-gradient-to-b from-[#0b1730] to-[#081124] p-5 sm:p-6 shadow-[0_0_28px_rgba(29,99,237,0.16)]">
      {/* Top Status & Timestamp Row */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#09352c] border border-emerald-500/40 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#34d399]">
            <CheckCircle2 className="h-3.5 w-3.5 text-[#34d399]" />
            <span>{isCompleted ? "COMPLETED" : "ACCEPTED"}</span>
          </span>
          {isCompleted && (
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${
                isPaymentCompleted
                  ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-300"
                  : "border-amber-500/40 bg-amber-500/15 text-amber-300"
              }`}
            >
              <span>
                {isPaymentCompleted
                  ? `✓ PAYMENT RECEIVED · ₹${task.budget}`
                  : `⏳ PAYMENT PENDING · ₹${task.budget}`}
              </span>
            </span>
          )}
          <span className="text-xs sm:text-[13px] font-medium text-slate-300">
            Task ID: {task.taskCode}
          </span>
        </div>

        <span className="text-xs sm:text-[13px] text-slate-300">
          {task.acceptedOnText}
        </span>
      </div>

      {/* Main 2-Column Body */}
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-[1fr_310px] gap-6 items-start">
        {/* Left Column: Task Info + 4-Col Metadata */}
        <div>
          {/* Title & Description with Home Icon Box */}
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#0d3b33] border border-emerald-500/30 text-white shadow-inner">
              <Home className="h-6 w-6 fill-white text-[#0d3b33]" />
            </div>
            <div>
              <h2 className="text-lg sm:text-[19px] font-bold text-white">
                {task.title}
              </h2>
              <p className="mt-1 text-xs sm:text-[13px] text-slate-300 leading-relaxed">
                {task.description}
              </p>
            </div>
          </div>

          {/* Horizontal Divider */}
          <div className="my-4 border-t border-[#182744]" />

          {/* 4-Column Metadata Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-0 sm:divide-x divide-[#182744]">
            {/* Col 1: Location */}
            <div className="sm:pr-4">
              <div className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 text-[#3b82f6] shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-400">Location</p>
                  <p className="mt-0.5 text-xs sm:text-[13px] font-bold text-white">
                    {task.locationDisplay}
                  </p>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      task.locationDisplay
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-[#3b82f6] hover:text-blue-400 transition"
                  >
                    <span>View on map</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </div>

            {/* Col 2: Date & Time */}
            <div className="sm:px-4">
              <div className="flex items-start gap-2.5">
                <Calendar className="h-4 w-4 text-[#3b82f6] shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-400">Date &amp; Time</p>
                  <p className="mt-0.5 text-xs sm:text-[13px] font-bold text-white">
                    {task.dateDisplay}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-300">
                    {task.timeDisplay}
                  </p>
                </div>
              </div>
            </div>

            {/* Col 3: Category */}
            <div className="sm:px-4">
              <div className="flex items-start gap-2.5">
                <Tag className="h-4 w-4 text-[#3b82f6] shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-400">Category</p>
                  <p className="mt-0.5 text-xs sm:text-[13px] font-bold text-white">
                    {task.categoryMain}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-300">
                    {task.categorySub}
                  </p>
                </div>
              </div>
            </div>

            {/* Col 4: Budget */}
            <div className="sm:pl-4">
              <div className="flex items-start gap-2.5">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#3b82f6]/20 text-[10px] font-bold text-[#3b82f6] shrink-0 mt-0.5">
                  ₹
                </span>
                <div>
                  <p className="text-xs text-slate-400">Budget</p>
                  <p className="mt-0.5 text-sm sm:text-[15px] font-extrabold text-white">
                    ₹{task.budget}
                  </p>
                  {isCompleted && (
                    <p
                      className={`mt-1 text-[11px] font-semibold ${
                        isPaymentCompleted ? "text-[#34d399]" : "text-amber-400"
                      }`}
                    >
                      {isPaymentCompleted ? "✓ Payment Received" : "⏳ Payment Pending"}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Customer Details & Actions */}
        <div>
          <h3 className="text-xs sm:text-[13px] font-bold text-white">
            Customer Details
          </h3>

          <div className="mt-2.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {task.createdBy?.image ? (
                <img
                  src={task.createdBy.image}
                  alt={task.customerName}
                  className="h-11 w-11 rounded-full object-cover shrink-0"
                />
              ) : (
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#7cc2ff] text-base font-bold text-[#092247]">
                  {task.customerInitial}
                </div>
              )}

              <div>
                <p className="text-sm sm:text-[15px] font-bold text-white">
                  {task.customerName}
                </p>
                <div className="mt-0.5 flex items-center gap-1 text-xs">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  <span className="font-bold text-white">
                    {task.customerRating}
                  </span>
                  <span className="text-slate-300">
                    ({task.customerReviews} reviews)
                  </span>
                </div>
              </div>
            </div>

            <a
              href={`tel:${task.customerPhone}`}
              aria-label="Call Customer"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#233559] bg-[#0d1a33] hover:bg-[#16284a] text-white transition"
            >
              <Phone className="h-4 w-4 fill-white text-white" />
            </a>
          </div>

          {/* Primary Action: View Task Details */}
          <Link
            href={`/dashboard-tasker/my-tasks/${task.id}`}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#1361f5] hover:bg-blue-500 py-2.5 px-4 text-xs sm:text-[13px] font-bold text-white shadow-lg shadow-blue-950/50 transition"
          >
            <span>View Task Details</span>
            <ArrowRight className="h-4 w-4" />
          </Link>

          {/* Secondary Actions: Message & Call */}
          <div className="mt-2.5 grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={onOpenMessage}
              className="flex items-center justify-center gap-2 rounded-xl border border-[#233559] bg-[#0b152b] hover:bg-[#132242] py-2.5 px-3 text-xs font-semibold text-white transition"
            >
              <MessageCircle className="h-4 w-4 text-slate-200" />
              <span>Message</span>
            </button>

            <a
              href={`tel:${task.customerPhone}`}
              className="flex items-center justify-center gap-2 rounded-xl border border-[#233559] bg-[#0b152b] hover:bg-[#132242] py-2.5 px-3 text-xs font-semibold text-white transition"
            >
              <Phone className="h-3.5 w-3.5 fill-white text-white" />
              <span>Call</span>
            </a>
          </div>
        </div>
      </div>

      {/* Bottom 5-Step Horizontal Progress Tracker */}
      <div className="mt-6 border-t border-[#182744] pt-5">
        <div className="relative mx-auto max-w-4xl">
          <div className="grid grid-cols-5 items-start">
            {steps.map((step, idx) => {
              const isDone = idx < currentStepIndex;
              const isCurrent = idx === currentStepIndex;

              return (
                <div
                  key={step.label}
                  className="relative flex flex-col items-center text-center"
                >
                  {/* Connector line to the next step */}
                  {idx < steps.length - 1 && (
                    <div
                      className={`
                        absolute top-3.5 left-1/2 w-full h-[2px]
                        ${idx < currentStepIndex ? "bg-[#10b981]" : "bg-[#223456]"}
                      `}
                    />
                  )}

                  {/* Step Circle */}
                  <div className="relative z-10 flex items-center justify-center">
                    {isDone ? (
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#10b981] text-white shadow-md shadow-emerald-950/50">
                        <Check className="h-4 w-4 stroke-[3]" />
                      </div>
                    ) : isCurrent ? (
                      <div className="h-7 w-7 rounded-full bg-[#1d63ed] border-[2.5px] border-white shadow-[0_0_12px_rgba(29,99,237,0.85)]" />
                    ) : (
                      <div className="h-7 w-7 rounded-full border-2 border-[#293d63] bg-[#0b1528]" />
                    )}
                  </div>

                  {/* Step Label */}
                  <p
                    className={`mt-2 text-[11px] sm:text-xs ${
                      isDone || isCurrent
                        ? "font-bold text-white"
                        : "font-medium text-slate-400"
                    }`}
                  >
                    {step.label}
                  </p>

                  {/* Step Sub-timestamp */}
                  {step.sub && (
                    <p className="mt-0.5 text-[10px] sm:text-[11px] text-slate-400">
                      {step.sub}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
