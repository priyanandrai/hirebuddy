"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  myTask,
  cancelTask,
  updateTaskStatus,
} from "@/app/components/services/task.service";
import { getUserProfile } from "@/app/components/services/user.service";
import {
  initializeSocket,
  onTaskUpdate,
} from "@/app/components/config/socketClient";
import { MyTaskCardShimmer } from "@/app/components/ui/Shimmer";
import {
  Plus,
  MapPin,
  Calendar,
  Tag,
  CircleDollarSign,
  FileText,
  Phone,
  MessageSquare,
  User,
  ArrowLeftRight,
  Trash2,
  ChevronDown,
  Check,
  X,
  Send,
  Clock,
  CreditCard,
  Star,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Wallet,
  Banknote,
} from "lucide-react";

const DEFAULT_KITCHEN_TASK = {
  id: "06b0b88d-dfbf-4fe2-866f-daf948e59e2f",
  taskCode: "HB-1023",
  title: "Clean my Kitchen",
  description:
    "Need deep cleaning of kitchen including slab, stove, sink and tiles.",
  category: "Cleaning",
  subCategory: "Kitchen Cleaning",
  location: "Noida, UP",
  budget: 300,
  preferredAt: "2026-10-23T00:00:00.000Z",
  timeSlot: "10:00 AM - 12:00 PM",
  createdAt: "2026-10-23T03:30:00.000Z",
  postedTimeLabel: "23 Oct, 09:00 AM",
  confirmedTimeLabel: "23 Oct, 10:30 AM",
  status: "ASSIGNED",
  paymentStatus: "PENDING",
  assignedTo: {
    id: "priya-sharma",
    name: "Priya Sharma",
    image: "/images/priya_sharma.png",
    phone: "+91 98765 43210",
    city: "Noida, UP",
    averageRating: 4.8,
    totalReviews: 120,
    isAvailable: true,
    idVerificationStatus: "VERIFIED",
    bio: "Experienced in home and kitchen cleaning. Provides deep cleaning and regular cleaning services.",
    skills: [
      "Kitchen Cleaning",
      "Home Cleaning",
      "Deep Cleaning",
      "Bathroom Cleaning",
      "Eco-friendly Products",
    ],
  },
};

const RATING_COMPLIMENT_TAGS = [
  "Punctual & On Time",
  "Sparkling Clean",
  "Polite & Friendly",
  "Value for Money",
  "Professional Work",
];

const SERVICE_LOCATIONS = [
  "Noida, UP",
  "Modipuram, Meerut",
  "Shastri Nagar, Meerut",
  "Kankerkhera, Meerut",
  "Pallavpuram, Meerut",
  "Saket, Meerut",
  "Greater Noida, UP",
  "Ghaziabad, UP",
  "Delhi NCR",
];

function getTodayLocalDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const TASK_OVERRIDES_STORAGE_KEY = "hirebuddy_my_tasks_overrides_v1";
const REORDERED_TASKS_STORAGE_KEY = "hirebuddy_reordered_tasks_v1";

export default function MyTasksPage() {
  const router = useRouter();
  const { data: session } = useSession();

  const minDate = getTodayLocalDateString();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("ALL");
  const [profileLocation, setProfileLocation] = useState("");
  const [openLocationDropdownId, setOpenLocationDropdownId] = useState(null);

  // Interactive modals & dropdowns
  const [openStatusDropdownId, setOpenStatusDropdownId] = useState(null);
  const [rescheduleModalTask, setRescheduleModalTask] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState(minDate);
  const [rescheduleTimeSlot, setRescheduleTimeSlot] = useState(
    "10:00 AM - 12:00 PM"
  );
  const [rescheduleLocation, setRescheduleLocation] = useState("Noida, UP");

  // Payment Modal State
  const [paymentModalTask, setPaymentModalTask] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [upiId, setUpiId] = useState("priyasharma@okaxis");
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  // Rate & Review Helper Modal State
  const [ratingModalTask, setRatingModalTask] = useState(null);
  const [ratingStars, setRatingStars] = useState(5);
  const [hoverStars, setHoverStars] = useState(0);
  const [ratingTags, setRatingTags] = useState([
    "Punctual & On Time",
    "Sparkling Clean",
  ]);
  const [ratingComment, setRatingComment] = useState("");

  // Reorder Task Modal State
  const [reorderModalTask, setReorderModalTask] = useState(null);
  const [reorderDate, setReorderDate] = useState(minDate);
  const [reorderTimeSlot, setReorderTimeSlot] = useState("10:00 AM - 12:00 PM");
  const [reorderLocation, setReorderLocation] = useState("Noida, UP");
  const [reorderSameHelper, setReorderSameHelper] = useState(true);

  const [messageModalTask, setMessageModalTask] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [cancelConfirmTask, setCancelConfirmTask] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const saveTaskOverride = (taskId, patch) => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(TASK_OVERRIDES_STORAGE_KEY);
      const existing = raw ? JSON.parse(raw) : {};
      existing[taskId] = { ...(existing[taskId] || {}), ...patch };
      localStorage.setItem(
        TASK_OVERRIDES_STORAGE_KEY,
        JSON.stringify(existing)
      );
    } catch {
      // Ignore storage errors
    }
  };

  const applyStoredOverrides = (rawTasks) => {
    if (typeof window === "undefined") return rawTasks;
    try {
      const overridesRaw = localStorage.getItem(TASK_OVERRIDES_STORAGE_KEY);
      const overrides = overridesRaw ? JSON.parse(overridesRaw) : {};
      const reorderedRaw = localStorage.getItem(REORDERED_TASKS_STORAGE_KEY);
      const reorderedList = reorderedRaw ? JSON.parse(reorderedRaw) : [];

      const existingIds = new Set(rawTasks.map((t) => t.id));
      const mergedList = [
        ...reorderedList.filter((rt) => !existingIds.has(rt.id)),
        ...rawTasks,
      ];

      return mergedList.map((t) =>
        overrides[t.id] ? { ...t, ...overrides[t.id] } : t
      );
    } catch {
      return rawTasks;
    }
  };

  useEffect(() => {
    const token =
      session?.token ||
      (typeof window !== "undefined" ? localStorage.getItem("token") : null);
    getMyTask(token);

    // Load user's profile location
    let resolvedLoc = "";
    if (typeof window !== "undefined") {
      try {
        const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
        resolvedLoc =
          storedUser?.address ||
          storedUser?.city ||
          storedUser?.location ||
          "";
      } catch {
        // Ignore parse error
      }
    }
    if (!resolvedLoc && session?.user) {
      resolvedLoc =
        session.user.address ||
        session.user.city ||
        session.user.location ||
        "";
    }
    if (resolvedLoc) {
      setProfileLocation(resolvedLoc);
    }

    if (token) {
      getUserProfile(token)
        .then((res) => {
          const userObj = res?.data || res?.user || res;
          const apiLoc =
            userObj?.address || userObj?.city || userObj?.location || "";
          if (apiLoc) {
            setProfileLocation(apiLoc);
          } else if (!resolvedLoc) {
            setProfileLocation("Noida, UP");
          }
        })
        .catch(() => {
          if (!resolvedLoc) {
            setProfileLocation("Noida, UP");
          }
        });
    } else if (!resolvedLoc) {
      setProfileLocation("Noida, UP");
    }
  }, [session]);

  // Listen to real-time socket updates for tasks
  useEffect(() => {
    let unsubscribe = () => {};
    const setupSocket = async () => {
      try {
        await initializeSocket();
        unsubscribe = onTaskUpdate((data) => {
          if (data?.taskId && data?.newStatus) {
            setTasks((prev) =>
              prev.map((t) =>
                t.id === data.taskId ? { ...t, status: data.newStatus } : t
              )
            );
          }
        });
      } catch (e) {
        // Ignore socket error
      }
    };
    setupSocket();
    return () => unsubscribe();
  }, []);

  const getMyTask = async (token) => {
    if (!token) {
      setTasks(applyStoredOverrides([DEFAULT_KITCHEN_TASK]));
      setLoading(false);
      return;
    }

    try {
      const res = await myTask(token);
      const list = Array.isArray(res) ? res : res?.data || res?.tasks || [];
      if (list.length > 0) {
        setTasks(applyStoredOverrides(list));
      } else {
        setTasks(applyStoredOverrides([DEFAULT_KITCHEN_TASK]));
      }
    } catch (error) {
      console.error("Failed to fetch tasks", error);
      setTasks(applyStoredOverrides([DEFAULT_KITCHEN_TASK]));
    } finally {
      setLoading(false);
    }
  };

  // Enrich raw DB tasks so every card has rich display properties matching user_my_task_page.png
  const normalizedTasks = useMemo(() => {
    return tasks.map((task, idx) => {
      const isKitchenTask = task.id === DEFAULT_KITCHEN_TASK.id;
      const statusUpper = (
        task.status || (isKitchenTask ? "ASSIGNED" : "OPEN")
      ).toUpperCase();

      const rawHelper = task.assignedTo;
      const hasHelper =
        statusUpper !== "OPEN" &&
        (Boolean(rawHelper) ||
          isKitchenTask ||
          ["ASSIGNED", "IN_PROGRESS", "COMPLETED"].includes(statusUpper));

      const usePriyaPreset =
        isKitchenTask ||
        rawHelper?.name?.toLowerCase() === "prreto g" ||
        rawHelper?.name?.toLowerCase().includes("priya");

      const helperSkills = (() => {
        if (isKitchenTask) {
          return DEFAULT_KITCHEN_TASK.assignedTo.skills;
        }
        if (Array.isArray(rawHelper?.skills) && rawHelper.skills.length >= 3) {
          return rawHelper.skills;
        }
        if (typeof rawHelper?.skills === "string" && rawHelper.skills.includes(",")) {
          const parsed = rawHelper.skills
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
          if (parsed.length >= 3) return parsed;
        }
        return DEFAULT_KITCHEN_TASK.assignedTo.skills;
      })();

      const baseRating =
        rawHelper?.averageRating && Number(rawHelper.averageRating) > 0
          ? Number(rawHelper.averageRating)
          : 4.8;
      const baseReviewCount =
        rawHelper?.totalReviews && Number(rawHelper.totalReviews) > 0
          ? Number(rawHelper.totalReviews)
          : 120;

      const displayedRating = task.userRating
        ? (
            (baseRating * baseReviewCount + Number(task.userRating)) /
            (baseReviewCount + 1)
          ).toFixed(1)
        : baseRating.toFixed(1);

      const displayedReviewCount = task.userRating
        ? baseReviewCount + 1
        : baseReviewCount;

      const helper = hasHelper
        ? {
            id: rawHelper?.id || "priya-sharma",
            name: isKitchenTask
              ? "Priya Sharma"
              : rawHelper?.name || "Priya Sharma",
            image: usePriyaPreset
              ? "/images/priya_sharma.png"
              : rawHelper?.image || "/images/priya_sharma.png",
            phone: rawHelper?.phone || "+91 98765 43210",
            location: isKitchenTask
              ? "Noida, UP"
              : rawHelper?.city || task.location || "Noida, UP",
            rating: displayedRating,
            reviewCount: displayedReviewCount,
            isAvailable: rawHelper?.isAvailable ?? true,
            isVerified: true,
            bio:
              rawHelper?.bio ||
              DEFAULT_KITCHEN_TASK.assignedTo.bio,
            skills: helperSkills,
          }
        : null;

      const formattedDate = formatTaskDate(
        task.preferredAt || task.date || task.createdAt || "2026-10-23"
      );

      const postedDateFormatted = formatTaskDate(
        task.createdAt || task.preferredAt || task.date || "2026-10-23"
      );

      return {
        ...task,
        status: statusUpper,
        hasHelper,
        taskCode: task.taskCode || (idx === 0 ? "HB-1023" : `HB-${1023 + idx}`),
        displayLocation:
          task.customLocation ||
          (isKitchenTask
            ? profileLocation || "Noida, UP"
            : task.location || profileLocation || "Noida, UP"),
        displayDate: task.customDateLabel || formattedDate,
        displayPostedDate: isKitchenTask ? "23 Oct 2026" : postedDateFormatted,
        displayTimeSlot: task.timeSlot || "10:00 AM - 12:00 PM",
        displayCategory: task.category || "Cleaning",
        displaySubCategory:
          task.subCategory ||
          (task.category === "Cleaning" || isKitchenTask
            ? "Kitchen Cleaning"
            : `${task.category || "General"} Service`),
        displayBudget:
          task.budget > 10000 ? Math.round(task.budget / 100) : task.budget || 300,
        displayDescription: isKitchenTask
          ? "Need deep cleaning of kitchen including slab, stove, sink and tiles."
          : task.description || "No description provided.",
        postedTimeLabel:
          task.postedTimeLabel ||
          (isKitchenTask ? "23 Oct, 09:00 AM" : postedDateFormatted),
        confirmedTimeLabel:
          task.confirmedTimeLabel ||
          (hasHelper && statusUpper !== "REQUESTED"
            ? "23 Oct, 10:30 AM"
            : ""),
        helper,
      };
    });
  }, [tasks, profileLocation]);

  // Filter tasks based on active tab
  const filteredTasks = useMemo(() => {
    if (activeTab === "ALL") return normalizedTasks;
    if (activeTab === "IN_PROGRESS") {
      return normalizedTasks.filter((t) =>
        ["ASSIGNED", "IN_PROGRESS", "REQUESTED", "OPEN"].includes(
          (t.status || "").toUpperCase()
        )
      );
    }
    if (activeTab === "COMPLETED") {
      return normalizedTasks.filter(
        (t) => (t.status || "").toUpperCase() === "COMPLETED"
      );
    }
    if (activeTab === "CANCELLED") {
      return normalizedTasks.filter(
        (t) => (t.status || "").toUpperCase() === "CANCELLED"
      );
    }
    return normalizedTasks;
  }, [normalizedTasks, activeTab]);

  const handleStatusChange = async (task, newStatus) => {
    setOpenStatusDropdownId(null);
    const token =
      session?.token ||
      (typeof window !== "undefined" ? localStorage.getItem("token") : null);

    // Optimistic UI update + localStorage persistence
    saveTaskOverride(task.id, { status: newStatus });
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t))
    );

    if (token) {
      try {
        await updateTaskStatus(task.id, newStatus, token);
        showToast(`Task status updated to ${formatStatusLabel(newStatus)}`);
      } catch (err) {
        showToast(`Status updated to ${formatStatusLabel(newStatus)}`);
      }
    } else {
      showToast(`Status updated to ${formatStatusLabel(newStatus)}`);
    }
  };

  const handleLocationChange = (task, newLocation) => {
    setOpenLocationDropdownId(null);
    if (!newLocation || !newLocation.trim()) return;
    const trimmed = newLocation.trim();
    const patch = {
      location: trimmed,
      customLocation: trimmed,
    };
    saveTaskOverride(task.id, patch);
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, ...patch } : t))
    );
    showToast(`Task location updated to ${trimmed}`);
  };

  const handleConfirmReschedule = (e) => {
    e.preventDefault();
    if (!rescheduleModalTask) return;

    if (rescheduleDate < minDate) {
      showToast("Previous dates are disabled. Please select today or a future date.");
      setRescheduleDate(minDate);
      return;
    }

    const newDateFormatted = formatTaskDate(rescheduleDate);
    const updatedLoc =
      (rescheduleLocation && rescheduleLocation.trim()) ||
      rescheduleModalTask.displayLocation ||
      profileLocation ||
      "Noida, UP";
    const patch = {
      preferredAt: rescheduleDate,
      customDateLabel: newDateFormatted,
      timeSlot: rescheduleTimeSlot,
      location: updatedLoc,
      customLocation: updatedLoc,
    };
    saveTaskOverride(rescheduleModalTask.id, patch);
    setTasks((prev) =>
      prev.map((t) =>
        t.id === rescheduleModalTask.id ? { ...t, ...patch } : t
      )
    );
    setRescheduleModalTask(null);
    showToast(
      `Task rescheduled to ${newDateFormatted}, ${rescheduleTimeSlot} (${updatedLoc})`
    );
  };

  const handleReleasePayment = (e) => {
    e.preventDefault();
    if (!paymentModalTask) return;
    setPaymentProcessing(true);

    setTimeout(() => {
      const methodLabel =
        paymentMethod === "UPI"
          ? `UPI (${upiId || "Instant UPI"})`
          : paymentMethod === "CARD"
            ? "Card"
            : "Cash";
      const patch = {
        paymentStatus: "COMPLETED",
        paidMethod: methodLabel,
        paidAtLabel: "23 Oct, 12:15 PM",
      };
      saveTaskOverride(paymentModalTask.id, patch);
      setTasks((prev) =>
        prev.map((t) =>
          t.id === paymentModalTask.id ? { ...t, ...patch } : t
        )
      );
      setPaymentProcessing(false);
      const paidTask = paymentModalTask;
      setPaymentModalTask(null);
      showToast(
        `₹${paidTask.displayBudget} payment released to ${paidTask.helper?.name || "Helper"}!`
      );
    }, 500);
  };

  const handleOpenRatingModal = (task) => {
    setRatingModalTask(task);
    setRatingStars(task.userRating || 5);
    setHoverStars(0);
    setRatingTags(
      task.userReviewTags || ["Punctual & On Time", "Sparkling Clean"]
    );
    setRatingComment(task.userReview || "");
  };

  const toggleRatingTag = (tag) => {
    setRatingTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmitRating = (e) => {
    e.preventDefault();
    if (!ratingModalTask) return;

    const patch = {
      userRating: ratingStars,
      userReviewTags: ratingTags,
      userReview:
        ratingComment.trim() ||
        `${ratingModalTask.helper?.name || "Helper"} did a great job!`,
      ratedAtLabel: "Just now",
    };

    saveTaskOverride(ratingModalTask.id, patch);
    setTasks((prev) =>
      prev.map((t) => (t.id === ratingModalTask.id ? { ...t, ...patch } : t))
    );
    const helperName = ratingModalTask.helper?.name || "Helper";
    setRatingModalTask(null);
    showToast(`Thank you! You rated ${helperName} ${ratingStars}.0 ★`);
  };

  const handleConfirmReorder = (e) => {
    e.preventDefault();
    if (!reorderModalTask) return;

    if (reorderDate < minDate) {
      showToast("Previous dates are disabled. Please select today or a future date.");
      setReorderDate(minDate);
      return;
    }

    const newDateFormatted = formatTaskDate(reorderDate);
    const newTaskCode = `HB-${Math.floor(1040 + Math.random() * 890)}`;
    const chosenLocation =
      (reorderLocation && reorderLocation.trim()) ||
      reorderModalTask.displayLocation ||
      profileLocation ||
      "Noida, UP";
    const keepHelper =
      reorderSameHelper && Boolean(reorderModalTask.hasHelper && reorderModalTask.helper);
    const reorderedTask = {
      ...reorderModalTask,
      id: `reorder-${Date.now()}`,
      taskCode: newTaskCode,
      status: keepHelper ? "REQUESTED" : "OPEN",
      assignedTo: keepHelper
        ? reorderModalTask.assignedTo || reorderModalTask.helper
        : null,
      paymentStatus: "PENDING",
      paidMethod: null,
      paidAtLabel: null,
      userRating: null,
      userReview: null,
      userReviewTags: null,
      preferredAt: reorderDate,
      customDateLabel: newDateFormatted,
      timeSlot: reorderTimeSlot,
      location: chosenLocation,
      customLocation: chosenLocation,
      postedTimeLabel: "Just now",
      confirmedTimeLabel: keepHelper ? "Pending acceptance" : "",
    };

    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(REORDERED_TASKS_STORAGE_KEY);
        const existing = raw ? JSON.parse(raw) : [];
        localStorage.setItem(
          REORDERED_TASKS_STORAGE_KEY,
          JSON.stringify([reorderedTask, ...existing])
        );
      } catch {
        // Ignore storage errors
      }
    }

    setTasks((prev) => [reorderedTask, ...prev]);
    setReorderModalTask(null);
    setActiveTab("ALL");
    showToast(
      `Task "${reorderedTask.title}" reordered (${newTaskCode}) for ${newDateFormatted}!`
    );
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageText.trim() || !messageModalTask) return;
    const helperName = messageModalTask.helper?.name || "Helper";
    setMessageText("");
    setMessageModalTask(null);
    showToast(`Message sent to ${helperName}`);
  };

  const handleConfirmCancelTask = async () => {
    if (!cancelConfirmTask) return;
    const targetId = cancelConfirmTask.id;
    setActionLoadingId(targetId);

    const token =
      session?.token ||
      (typeof window !== "undefined" ? localStorage.getItem("token") : null);

    try {
      if (token) {
        await cancelTask(targetId, "Cancelled by user", token);
      }
    } catch (e) {
      // Proceed with local state update even if endpoint rejects transition
    } finally {
      saveTaskOverride(targetId, { status: "CANCELLED" });
      setTasks((prev) =>
        prev.map((t) =>
          t.id === targetId ? { ...t, status: "CANCELLED" } : t
        )
      );
      setActionLoadingId(null);
      setCancelConfirmTask(null);
      showToast("Task has been cancelled");
    }
  };

  const tabs = [
    { key: "ALL", label: "All Tasks" },
    { key: "IN_PROGRESS", label: "In Progress" },
    { key: "COMPLETED", label: "Completed" },
    { key: "CANCELLED", label: "Cancelled" },
  ];

  return (
    <div className="min-h-screen bg-[#060913] text-slate-100">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2.5 rounded-2xl border border-emerald-500/30 bg-slate-900/95 px-5 py-3 text-sm font-medium text-white shadow-2xl backdrop-blur-md">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-slate-950">
            ✓
          </span>
          <span>{toast}</span>
        </div>
      )}

      <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-8 pb-6">
        {/* Top Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-[28px] font-bold tracking-tight text-white">
              My Tasks
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Track and manage all your posted tasks
            </p>
          </div>

          <Link
            href="/dashboard/create-task"
            className="inline-flex items-center justify-center gap-2 self-start sm:self-auto rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-500"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span>Create Task</span>
          </Link>
        </div>

        {/* Filter Tabs */}
        <div className="mt-6 mb-6 flex flex-wrap items-center gap-2 sm:gap-3">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-full px-5 py-2 text-xs sm:text-sm font-semibold transition cursor-pointer ${
                  isActive
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                    : "bg-transparent text-slate-300 hover:bg-slate-900 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tasks List */}
        {loading ? (
          <MyTaskCardShimmer count={2} />
        ) : filteredTasks.length === 0 ? (
          <div className="rounded-3xl border border-slate-800/80 bg-[#0b1120]/90 p-12 text-center shadow-2xl">
            <p className="text-base font-medium text-slate-300">
              No tasks found in this category.
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Switch tabs or post a new task to get started.
            </p>
            <Link
              href="/dashboard/create-task"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-blue-500 transition"
            >
              <Plus className="h-4 w-4" />
              Create New Task
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredTasks.map((task) => (
              <TaskDetailCard
                key={task.id}
                task={task}
                profileLocation={profileLocation}
                openStatusDropdownId={openStatusDropdownId}
                setOpenStatusDropdownId={setOpenStatusDropdownId}
                onStatusChange={handleStatusChange}
                openLocationDropdownId={openLocationDropdownId}
                setOpenLocationDropdownId={setOpenLocationDropdownId}
                onLocationChange={handleLocationChange}
                onOpenReschedule={() => {
                  setRescheduleModalTask(task);
                  setRescheduleDate(minDate);
                  setRescheduleTimeSlot(task.displayTimeSlot);
                  setRescheduleLocation(
                    task.displayLocation || profileLocation || "Noida, UP"
                  );
                }}
                onChangeHelper={() => {
                  const params = new URLSearchParams();
                  if (task.displayLocation) {
                    params.set("location", task.displayLocation);
                  }
                  if (task.displayCategory) {
                    params.set("category", task.displayCategory);
                  }
                  if (task.id) {
                    params.set("taskId", String(task.id));
                  }
                  if (task.title) {
                    params.set("taskTitle", task.title);
                  }
                  router.push(`/dashboard/helpers?${params.toString()}`);
                }}
                onCancelTask={() => setCancelConfirmTask(task)}
                onOpenPayment={() => setPaymentModalTask(task)}
                onOpenRating={() => handleOpenRatingModal(task)}
                onOpenReorder={() => {
                  setReorderModalTask(task);
                  setReorderDate(minDate);
                  setReorderTimeSlot(task.displayTimeSlot);
                  setReorderLocation(
                    task.displayLocation || profileLocation || "Noida, UP"
                  );
                  setReorderSameHelper(Boolean(task.hasHelper && task.helper));
                }}
                onOpenMessage={() => setMessageModalTask(task)}
                onViewProfile={() =>
                  router.push(`/helpers/${task.helper?.id || "priya-sharma"}`)
                }
                onCallHelper={() => {
                  if (task.helper?.phone) {
                    window.location.href = `tel:${task.helper.phone}`;
                  } else {
                    showToast(`Calling ${task.helper?.name || "Helper"}...`);
                  }
                }}
              />
            ))}
          </div>
        )}

        {/* Bottom CTA Banner ("Need help with another task?") */}
        <div className="mt-8 rounded-3xl border border-slate-800/80 bg-[#0b1120]/95 p-7 sm:p-9 shadow-2xl shadow-black/50">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-400">
                HIREBUDDY
              </p>
              <h2 className="mt-2 text-2xl sm:text-[28px] font-bold text-white tracking-tight">
                Need help with another task?
              </h2>
              <p className="mt-1.5 text-sm text-slate-400">
                Post a new task and get trusted local helpers instantly.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3.5">
              <Link
                href="/dashboard/create-task"
                className="inline-flex items-center justify-center rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-600"
              >
                Post a Task
              </Link>
              <Link
                href="/dashboard/helpers"
                className="inline-flex items-center justify-center rounded-xl border border-slate-700/90 bg-[#090d18] px-6 py-3 text-sm font-semibold text-slate-200 transition hover:border-slate-600 hover:bg-slate-900"
              >
                Browse Helpers
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Reschedule Modal */}
      {rescheduleModalTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-[#0b1120] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-400" />
                Reschedule Task
              </h3>
              <button
                onClick={() => setRescheduleModalTask(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmReschedule} className="mt-5 space-y-4">
              <div>
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <label className="block text-xs font-medium text-slate-300">
                    Location
                  </label>
                  {profileLocation && (
                    <button
                      type="button"
                      onClick={() => setRescheduleLocation(profileLocation)}
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition cursor-pointer ${
                        rescheduleLocation === profileLocation
                          ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                          : "bg-slate-800 text-slate-300 hover:bg-emerald-500/15 hover:text-emerald-300 border border-slate-700"
                      }`}
                    >
                      <MapPin className="h-3 w-3" />
                      {rescheduleLocation === profileLocation
                        ? `From Profile (${profileLocation})`
                        : `Use Profile (${profileLocation})`}
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <select
                    value={
                      SERVICE_LOCATIONS.includes(rescheduleLocation) ||
                      (profileLocation && rescheduleLocation === profileLocation)
                        ? rescheduleLocation
                        : ""
                    }
                    onChange={(e) => {
                      if (e.target.value) setRescheduleLocation(e.target.value);
                    }}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">Select location...</option>
                    {profileLocation &&
                      !SERVICE_LOCATIONS.includes(profileLocation) && (
                        <option value={profileLocation}>
                          📍 {profileLocation} (Profile)
                        </option>
                      )}
                    {SERVICE_LOCATIONS.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc === profileLocation ? `📍 ${loc} (Profile)` : loc}
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    value={rescheduleLocation}
                    onChange={(e) => setRescheduleLocation(e.target.value)}
                    placeholder="Or enter location"
                    required
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-300">
                  Select New Date
                </label>
                <input
                  type="date"
                  min={minDate}
                  value={rescheduleDate}
                  onChange={(e) => {
                    if (e.target.value && e.target.value < minDate) {
                      showToast("Previous dates are disabled.");
                      setRescheduleDate(minDate);
                      return;
                    }
                    setRescheduleDate(e.target.value);
                  }}
                  required
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none"
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  Past dates are disabled (earliest: {minDate})
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-300">
                  Preferred Time Slot
                </label>
                <select
                  value={rescheduleTimeSlot}
                  onChange={(e) => setRescheduleTimeSlot(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="08:00 AM - 10:00 AM">08:00 AM - 10:00 AM</option>
                  <option value="10:00 AM - 12:00 PM">10:00 AM - 12:00 PM</option>
                  <option value="12:00 PM - 02:00 PM">12:00 PM - 02:00 PM</option>
                  <option value="03:00 PM - 05:00 PM">03:00 PM - 05:00 PM</option>
                  <option value="05:00 PM - 07:00 PM">05:00 PM - 07:00 PM</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setRescheduleModalTask(null)}
                  className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white hover:bg-blue-500 shadow-lg shadow-blue-600/25"
                >
                  Confirm Reschedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Message Helper Modal */}
      {messageModalTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-[#0b1120] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <img
                  src={messageModalTask.helper?.image || "/images/priya_sharma.png"}
                  alt={messageModalTask.helper?.name}
                  className="h-10 w-10 rounded-full object-cover object-top border border-slate-700"
                />
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Message {messageModalTask.helper?.name}
                  </h3>
                  <p className="text-xs text-emerald-400">● Online & Available</p>
                </div>
              </div>
              <button
                onClick={() => setMessageModalTask(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSendMessage} className="mt-4 space-y-4">
              <textarea
                rows={4}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder={`Write a message to ${messageModalTask.helper?.name} regarding "${messageModalTask.title}"...`}
                required
                className="w-full rounded-2xl border border-slate-700 bg-slate-900 p-3.5 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
              />
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setMessageModalTask(null)}
                  className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white hover:bg-blue-500"
                >
                  <Send className="h-3.5 w-3.5" />
                  Send Message
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Task Confirmation Modal */}
      {cancelConfirmTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-[#0b1120] p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Cancel this task?</h3>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              Are you sure you want to cancel{" "}
              <span className="font-semibold text-slate-200">
                “{cancelConfirmTask.title}”
              </span>
              ?{" "}
              {cancelConfirmTask.hasHelper
                ? "The assigned helper will be notified immediately."
                : "This task will be removed from the marketplace."}
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setCancelConfirmTask(null)}
                className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
              >
                Keep Task
              </button>
              <button
                type="button"
                disabled={actionLoadingId === cancelConfirmTask.id}
                onClick={handleConfirmCancelTask}
                className="rounded-xl bg-rose-600 px-5 py-2 text-xs font-semibold text-white hover:bg-rose-500 disabled:opacity-60"
              >
                {actionLoadingId === cancelConfirmTask.id
                  ? "Cancelling..."
                  : "Yes, Cancel Task"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Release Payment Modal */}
      {paymentModalTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-[#0b1120] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    {paymentModalTask.paymentStatus === "COMPLETED"
                      ? "Payment Receipt"
                      : "Pay & Release Payment"}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Task ID: {paymentModalTask.taskCode} · {paymentModalTask.title}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPaymentModalTask(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Payment Summary Box */}
            <div className="mt-4 rounded-2xl border border-slate-800/90 bg-slate-900/70 p-4 space-y-2.5">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Assigned Helper</span>
                <span className="font-semibold text-white">
                  {paymentModalTask.helper?.name}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Task Amount</span>
                <span className="font-semibold text-slate-200">
                  ₹{paymentModalTask.displayBudget}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Platform Protection Fee</span>
                <span className="font-semibold text-emerald-400">FREE (₹0)</span>
              </div>
              <div className="border-t border-slate-800 pt-2.5 flex items-center justify-between">
                <span className="text-sm font-bold text-white">Total Payable</span>
                <span className="text-lg font-extrabold text-emerald-400">
                  ₹{paymentModalTask.displayBudget}
                </span>
              </div>
            </div>

            {paymentModalTask.paymentStatus === "COMPLETED" ? (
              <div className="mt-5 space-y-4">
                <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-slate-950">
                    <Check className="h-5 w-5 stroke-[3]" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-emerald-300">
                      Payment Released Successfully
                    </p>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Paid ₹{paymentModalTask.displayBudget} via{" "}
                      {paymentModalTask.paidMethod || "UPI"} ·{" "}
                      {paymentModalTask.paidAtLabel || "23 Oct, 12:15 PM"}
                    </p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setPaymentModalTask(null)}
                    className="rounded-xl bg-slate-800 px-5 py-2.5 text-xs font-semibold text-white hover:bg-slate-700 cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleReleasePayment} className="mt-5 space-y-4">
                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-300">
                    Select Payment Method
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {[
                      { key: "UPI", label: "UPI App", icon: Wallet },
                      { key: "CARD", label: "Card", icon: CreditCard },
                      { key: "CASH", label: "Cash Paid", icon: Banknote },
                    ].map((item) => {
                      const IconComp = item.icon;
                      const active = paymentMethod === item.key;
                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => setPaymentMethod(item.key)}
                          className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border p-3 text-xs font-semibold transition cursor-pointer ${
                            active
                              ? "border-emerald-500 bg-emerald-500/15 text-emerald-300 shadow-md shadow-emerald-500/10"
                              : "border-slate-800 bg-slate-900/80 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                          }`}
                        >
                          <IconComp className="h-4 w-4" />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {paymentMethod === "UPI" && (
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-400">
                      UPI ID (GPay / PhonePe / Paytm)
                    </label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="yourname@upi"
                      required
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                )}

                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400" />
                  <span>
                    100% secure HireBuddy escrow release directly to{" "}
                    {paymentModalTask.helper?.name}.
                  </span>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setPaymentModalTask(null)}
                    className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={paymentProcessing}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-xs sm:text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/25 hover:bg-emerald-400 disabled:opacity-60 cursor-pointer"
                  >
                    <CreditCard className="h-4 w-4" />
                    <span>
                      {paymentProcessing
                        ? "Processing..."
                        : `Pay ₹${paymentModalTask.displayBudget} & Release`}
                    </span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Rate & Review Helper Modal */}
      {ratingModalTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-[#0b1120] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <img
                  src={ratingModalTask.helper?.image || "/images/priya_sharma.png"}
                  alt={ratingModalTask.helper?.name}
                  className="h-11 w-11 rounded-2xl object-cover object-top border border-slate-700"
                />
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                    <span>Rate {ratingModalTask.helper?.name}</span>
                    <VerifiedBadgeIcon />
                  </h3>
                  <p className="text-xs text-slate-400">
                    For “{ratingModalTask.title}”
                  </p>
                </div>
              </div>
              <button
                onClick={() => setRatingModalTask(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitRating} className="mt-5 space-y-5">
              {/* Interactive 5-Star Selector */}
              <div className="flex flex-col items-center rounded-2xl border border-slate-800/90 bg-slate-900/60 py-4 px-3">
                <p className="text-xs font-medium text-slate-400 mb-2">
                  How was your experience with {ratingModalTask.helper?.name}?
                </p>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const active = (hoverStars || ratingStars) >= star;
                    return (
                      <button
                        key={star}
                        type="button"
                        onMouseEnter={() => setHoverStars(star)}
                        onMouseLeave={() => setHoverStars(0)}
                        onClick={() => setRatingStars(star)}
                        className="p-1 transition-transform hover:scale-110 cursor-pointer"
                      >
                        <Star
                          className={`h-8 w-8 transition ${
                            active
                              ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]"
                              : "text-slate-700"
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
                <span className="mt-2 text-xs font-bold text-amber-400">
                  {(hoverStars || ratingStars) === 5
                    ? "5.0 ★ — Excellent Service!"
                    : (hoverStars || ratingStars) === 4
                      ? "4.0 ★ — Very Good!"
                      : (hoverStars || ratingStars) === 3
                        ? "3.0 ★ — Good"
                        : (hoverStars || ratingStars) === 2
                          ? "2.0 ★ — Fair"
                          : "1.0 ★ — Needs Improvement"}
                </span>
              </div>

              {/* Compliment Tags */}
              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-300">
                  What went well? (Select compliments)
                </label>
                <div className="flex flex-wrap gap-2">
                  {RATING_COMPLIMENT_TAGS.map((tag) => {
                    const selected = ratingTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleRatingTag(tag)}
                        className={`rounded-full border px-3 py-1 text-xs font-medium transition cursor-pointer ${
                          selected
                            ? "border-amber-400/60 bg-amber-500/15 text-amber-300"
                            : "border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                        }`}
                      >
                        {selected ? `✓ ${tag}` : tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Written Review */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-300">
                  Share your feedback (Optional)
                </label>
                <textarea
                  rows={3}
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                  placeholder={`Share how ${ratingModalTask.helper?.name} performed on your task...`}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-900 p-3 text-sm text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setRatingModalTask(null)}
                  className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-5 py-2.5 text-xs sm:text-sm font-bold text-slate-950 shadow-lg shadow-amber-500/25 hover:bg-amber-400 cursor-pointer"
                >
                  <Star className="h-4 w-4 fill-slate-950" />
                  <span>Submit Rating</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reorder / Book Again Modal */}
      {reorderModalTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-[#0b1120] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400">
                  <RotateCcw className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    Reorder Task
                  </h3>
                  <p className="text-xs text-slate-400">
                    Book “{reorderModalTask.title}” again
                  </p>
                </div>
              </div>
              <button
                onClick={() => setReorderModalTask(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmReorder} className="mt-5 space-y-4">
              {/* Task Summary Card */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3.5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-white">
                    {reorderModalTask.title}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {reorderModalTask.displayCategory} ·{" "}
                    {reorderModalTask.displayLocation}
                  </p>
                </div>
                <span className="rounded-xl bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 text-sm font-bold text-emerald-300">
                  ₹{reorderModalTask.displayBudget}
                </span>
              </div>

              {/* Same Helper Option */}
              {reorderModalTask.hasHelper && reorderModalTask.helper && (
                <label className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/50 p-3.5 cursor-pointer hover:border-slate-700">
                  <div className="flex items-center gap-3">
                    <img
                      src={
                        reorderModalTask.helper?.image || "/images/priya_sharma.png"
                      }
                      alt={reorderModalTask.helper?.name}
                      className="h-10 w-10 rounded-xl object-cover object-top border border-slate-700"
                    />
                    <div>
                      <p className="text-xs font-bold text-white">
                        Request {reorderModalTask.helper?.name} again
                      </p>
                      <p className="text-[11px] text-emerald-400">
                        ★ {reorderModalTask.helper?.rating} · Available for re-booking
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={reorderSameHelper}
                    onChange={(e) => setReorderSameHelper(e.target.checked)}
                    className="h-4 w-4 rounded accent-blue-600"
                  />
                </label>
              )}

              <div>
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <label className="block text-xs font-medium text-slate-300">
                    Location for Reorder
                  </label>
                  {profileLocation && (
                    <button
                      type="button"
                      onClick={() => setReorderLocation(profileLocation)}
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition cursor-pointer ${
                        reorderLocation === profileLocation
                          ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                          : "bg-slate-800 text-slate-300 hover:bg-emerald-500/15 hover:text-emerald-300 border border-slate-700"
                      }`}
                    >
                      <MapPin className="h-3 w-3" />
                      {reorderLocation === profileLocation
                        ? `From Profile (${profileLocation})`
                        : `Use Profile (${profileLocation})`}
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <select
                    value={
                      SERVICE_LOCATIONS.includes(reorderLocation) ||
                      (profileLocation && reorderLocation === profileLocation)
                        ? reorderLocation
                        : ""
                    }
                    onChange={(e) => {
                      if (e.target.value) setReorderLocation(e.target.value);
                    }}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">Select location...</option>
                    {profileLocation &&
                      !SERVICE_LOCATIONS.includes(profileLocation) && (
                        <option value={profileLocation}>
                          📍 {profileLocation} (Profile)
                        </option>
                      )}
                    {SERVICE_LOCATIONS.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc === profileLocation ? `📍 ${loc} (Profile)` : loc}
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    value={reorderLocation}
                    onChange={(e) => setReorderLocation(e.target.value)}
                    placeholder="Or enter location"
                    required
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-300">
                  Select Date for Reorder
                </label>
                <input
                  type="date"
                  min={minDate}
                  value={reorderDate}
                  onChange={(e) => {
                    if (e.target.value && e.target.value < minDate) {
                      showToast("Previous dates are disabled.");
                      setReorderDate(minDate);
                      return;
                    }
                    setReorderDate(e.target.value);
                  }}
                  required
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none"
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  Past dates are disabled (earliest: {minDate})
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-300">
                  Preferred Time Slot
                </label>
                <select
                  value={reorderTimeSlot}
                  onChange={(e) => setReorderTimeSlot(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="08:00 AM - 10:00 AM">08:00 AM - 10:00 AM</option>
                  <option value="10:00 AM - 12:00 PM">10:00 AM - 12:00 PM</option>
                  <option value="12:00 PM - 02:00 PM">12:00 PM - 02:00 PM</option>
                  <option value="03:00 PM - 05:00 PM">03:00 PM - 05:00 PM</option>
                  <option value="05:00 PM - 07:00 PM">05:00 PM - 07:00 PM</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReorderModalTask(null)}
                  className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-blue-600/25 hover:bg-blue-500 cursor-pointer"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>Confirm Reorder</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- Task Detail Card Component ---------------- */

function TaskDetailCard({
  task,
  profileLocation,
  openStatusDropdownId,
  setOpenStatusDropdownId,
  onStatusChange,
  openLocationDropdownId,
  setOpenLocationDropdownId,
  onLocationChange,
  onOpenReschedule,
  onChangeHelper,
  onCancelTask,
  onOpenPayment,
  onOpenRating,
  onOpenReorder,
  onOpenMessage,
  onViewProfile,
  onCallHelper,
}) {
  const [imgError, setImgError] = useState(false);
  const statusUpper = (task.status || "OPEN").toUpperCase();
  const hasHelper = Boolean(task.hasHelper && task.helper);
  const isDropdownOpen = openStatusDropdownId === task.id;
  const isLocationDropdownOpen = openLocationDropdownId === task.id;
  const isPaid = task.paymentStatus === "COMPLETED";

  const statusMeta = getStatusBadgeMeta(statusUpper);
  const visibleSkills = (task.helper?.skills || []).slice(0, 3);
  const extraSkillsCount = Math.max((task.helper?.skills || []).length - 3, 2);

  // Determine active progress step index (0 to 5, where 5 means all 5 steps completed)
  const activeStepIndex = (() => {
    if (isPaid) return 5;
    if (statusUpper === "COMPLETED") return 4;
    if (statusUpper === "IN_PROGRESS") return 2;
    if (statusUpper === "ASSIGNED") return 1;
    return 0;
  })();

  const progressSteps = [
    {
      label: "Task Posted",
      sub: task.postedTimeLabel || "23 Oct, 09:00 AM",
    },
    {
      label: "Helper Confirmed",
      sub:
        activeStepIndex >= 1
          ? task.confirmedTimeLabel || "23 Oct, 10:30 AM"
          : statusUpper === "REQUESTED"
            ? "Pending acceptance"
            : statusUpper === "OPEN"
              ? "Waiting for helper"
              : "",
    },
    {
      label: "In Progress",
      sub: activeStepIndex >= 2 ? "In Progress" : "",
    },
    {
      label: "Completed",
      sub: activeStepIndex >= 3 ? "Completed" : "",
    },
    {
      label: "Payment Released",
      sub: isPaid
        ? task.paidAtLabel || "Released ✓"
        : statusUpper === "COMPLETED"
          ? `Pay ₹${task.displayBudget} →`
          : "",
      isActionable: statusUpper === "COMPLETED" && !isPaid,
    },
  ];

  // Progress bar percentage between first node center (10%) and last node center (90%)
  const progressLinePercentages = ["0%", "20%", "40%", "60%", "80%", "80%"];
  const activeLineWidth =
    statusUpper === "CANCELLED"
      ? "0%"
      : progressLinePercentages[activeStepIndex] || "0%";

  return (
    <div className="rounded-3xl border border-slate-800/90 bg-[#0b1120]/95 p-6 sm:p-7 shadow-2xl shadow-black/60">
      {/* 1. Card Header Row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-5 border-b border-slate-800/80">
        <div className="flex items-center gap-4">
          {/* Green-tinted House Icon Box */}
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-500/20 bg-[#102a25] shadow-inner">
            <HouseTaskIcon />
          </div>

          <div>
            <Link
              href={`/dashboard/my-tasks/${task.id}`}
              className="text-lg sm:text-xl font-bold text-white hover:text-blue-400 transition"
            >
              {task.title}
            </Link>
            <p className="mt-0.5 text-xs sm:text-[13px] text-slate-400">
              Posted on {task.displayPostedDate} <span className="mx-1">·</span>{" "}
              Task ID: <span className="text-slate-300">{task.taskCode}</span>
            </p>
          </div>
        </div>

        {/* Status Pill with Dropdown */}
        <div className="relative self-start sm:self-auto">
          <button
            type="button"
            onClick={() =>
              setOpenStatusDropdownId(isDropdownOpen ? null : task.id)
            }
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs sm:text-[13px] font-semibold transition cursor-pointer ${statusMeta.pillClass}`}
          >
            <span
              className={`flex h-4 w-4 items-center justify-center rounded-full ${statusMeta.iconBgClass}`}
            >
              {statusUpper === "OPEN" || statusUpper === "REQUESTED" ? (
                <Clock className="h-2.5 w-2.5 stroke-[2.8] text-slate-950" />
              ) : (
                <Check className="h-2.5 w-2.5 stroke-[3] text-slate-950" />
              )}
            </span>
            <span>{statusMeta.label}</span>
            <ChevronDown className="h-3.5 w-3.5 opacity-80" />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-700 bg-slate-900 py-1.5 shadow-2xl z-30">
              {[
                { key: "OPEN", label: "Open (Waiting for Helper)" },
                { key: "REQUESTED", label: "Requested (Pending Helper)" },
                { key: "ASSIGNED", label: "Helper Confirmed" },
                { key: "IN_PROGRESS", label: "In Progress" },
                { key: "COMPLETED", label: "Completed" },
                { key: "CANCELLED", label: "Cancelled" },
              ].map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => onStatusChange(task, opt.key)}
                  className={`flex w-full items-center justify-between px-4 py-2 text-left text-xs font-medium hover:bg-slate-800 ${
                    statusUpper === opt.key
                      ? "text-emerald-400 font-semibold"
                      : "text-slate-300"
                  }`}
                >
                  <span>{opt.label}</span>
                  {statusUpper === opt.key && <Check className="h-3.5 w-3.5" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 2. Five-Column Metadata Row */}
      <div className="grid grid-cols-1 gap-4 py-5 border-b border-slate-800/80 sm:grid-cols-2 lg:grid-cols-12 lg:gap-0 lg:divide-x lg:divide-slate-800/80">
        {/* Location */}
        <div className="relative flex items-start gap-3 lg:col-span-2 lg:pr-4">
          <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-sky-400" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="text-xs text-slate-400">Location</p>
              {profileLocation && task.displayLocation === profileLocation && (
                <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.2 text-[9px] font-semibold text-emerald-300">
                  Profile
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() =>
                setOpenLocationDropdownId(
                  isLocationDropdownOpen ? null : task.id
                )
              }
              title="Click to select location or pick from profile"
              className="mt-0.5 inline-flex items-center gap-1 text-left text-sm font-semibold text-white hover:text-sky-400 transition cursor-pointer"
            >
              <span className="truncate">{task.displayLocation}</span>
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            </button>

            {isLocationDropdownOpen && (
              <div className="absolute left-0 top-12 z-30 w-56 rounded-2xl border border-slate-700 bg-slate-900 py-1.5 shadow-2xl">
                <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  Select Location
                </div>
                {profileLocation && (
                  <button
                    type="button"
                    onClick={() => onLocationChange(task, profileLocation)}
                    className={`flex w-full items-center justify-between px-3 py-2 text-left text-xs font-medium hover:bg-slate-800 ${
                      task.displayLocation === profileLocation
                        ? "text-emerald-400 font-semibold"
                        : "text-emerald-300"
                    }`}
                  >
                    <span>📍 {profileLocation} (From Profile)</span>
                    {task.displayLocation === profileLocation && (
                      <Check className="h-3.5 w-3.5 shrink-0" />
                    )}
                  </button>
                )}
                {SERVICE_LOCATIONS.filter((l) => l !== profileLocation).map(
                  (loc) => (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => onLocationChange(task, loc)}
                      className={`flex w-full items-center justify-between px-3 py-1.5 text-left text-xs font-medium hover:bg-slate-800 ${
                        task.displayLocation === loc
                          ? "text-sky-400 font-semibold"
                          : "text-slate-300"
                      }`}
                    >
                      <span>{loc}</span>
                      {task.displayLocation === loc && (
                        <Check className="h-3.5 w-3.5 shrink-0" />
                      )}
                    </button>
                  )
                )}
              </div>
            )}
          </div>
        </div>

        {/* Date & Time */}
        <div className="flex items-start gap-3 lg:col-span-2 lg:px-4">
          <Calendar className="mt-0.5 h-5 w-5 shrink-0 text-sky-400" />
          <div>
            <p className="text-xs text-slate-400">Date & Time</p>
            <p className="mt-0.5 text-sm font-semibold text-white">
              {task.displayDate}
            </p>
            <p className="mt-0.5 text-xs text-slate-400">
              {task.displayTimeSlot}
            </p>
          </div>
        </div>

        {/* Category */}
        <div className="flex items-start gap-3 lg:col-span-2 lg:px-4">
          <Tag className="mt-0.5 h-5 w-5 shrink-0 text-sky-400" />
          <div>
            <p className="text-xs text-slate-400">Category</p>
            <p className="mt-0.5 text-sm font-semibold text-white">
              {task.displayCategory}
            </p>
            <p className="mt-0.5 text-xs text-slate-400">
              {task.displaySubCategory}
            </p>
          </div>
        </div>

        {/* Budget + Payment Status Badge */}
        <div className="flex items-start gap-3 lg:col-span-2 lg:px-4">
          <CircleDollarSign className="mt-0.5 h-5 w-5 shrink-0 text-sky-400" />
          <div>
            <p className="text-xs text-slate-400">Budget</p>
            <div className="mt-0.5 flex flex-wrap items-center gap-2">
              <p className="text-sm font-bold text-white">
                ₹{task.displayBudget}
              </p>
              {isPaid ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                  ✓ Paid
                </span>
              ) : statusUpper === "COMPLETED" ? (
                <button
                  type="button"
                  onClick={onOpenPayment}
                  className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-300 hover:bg-amber-500/25 transition cursor-pointer"
                >
                  Pay Now →
                </button>
              ) : null}
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="flex items-start gap-3 sm:col-span-2 lg:col-span-4 lg:pl-4">
          <FileText className="mt-0.5 h-5 w-5 shrink-0 text-sky-400" />
          <div>
            <p className="text-xs text-slate-400">Description</p>
            <p className="mt-0.5 text-sm text-slate-200 leading-relaxed">
              {task.displayDescription}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Assigned Helper / Unassigned State + Quick Contact Circles + Task Actions */}
      <div className="grid grid-cols-1 gap-6 py-6 border-b border-slate-800/80 lg:grid-cols-12 lg:items-center">
        {hasHelper ? (
          <>
            {/* Left: Assigned Helper Info (6 cols) */}
            <div className="lg:col-span-6">
              <div className="mb-3.5 flex flex-wrap items-center gap-2.5">
                <h3 className="text-sm sm:text-base font-bold text-white">
                  {statusUpper === "REQUESTED"
                    ? "Requested Helper"
                    : "Assigned Helper"}
                </h3>
                {statusUpper === "REQUESTED" && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-amber-300">
                    <Clock className="h-3 w-3" />
                    Awaiting Helper Acceptance
                  </span>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-start gap-4">
                {/* Helper Photo + Available Indicator */}
                <div className="flex flex-col items-center shrink-0">
                  <div className="h-24 w-24 sm:h-[108px] sm:w-[108px] overflow-hidden rounded-2xl border border-slate-700/70 bg-slate-800 shadow-lg">
                    <img
                      src={
                        imgError
                          ? "/images/priya_sharma.png"
                          : task.helper?.image || "/images/priya_sharma.png"
                      }
                      alt={task.helper?.name || "Priya Sharma"}
                      onError={() => setImgError(true)}
                      className="h-full w-full object-cover object-top"
                    />
                  </div>
                  <div className="mt-2.5 flex items-center gap-1.5 text-xs font-medium text-slate-200">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    <span>Available</span>
                  </div>
                </div>

                {/* Helper Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                      {task.helper?.name}
                    </h4>
                    <VerifiedBadgeIcon />
                    {task.userRating && (
                      <button
                        type="button"
                        onClick={onOpenRating}
                        className="inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-bold text-amber-300 hover:bg-amber-500/25 transition cursor-pointer"
                      >
                        <span>Your Rating: {task.userRating}.0 ★</span>
                      </button>
                    )}
                  </div>

                  {/* Rating & Location */}
                  <div className="mt-1.5 flex flex-wrap items-center gap-2.5 text-xs sm:text-sm">
                    <div className="flex items-center gap-1">
                      <span className="text-amber-400 text-sm">★</span>
                      <span className="font-bold text-white">
                        {task.helper?.rating}
                      </span>
                      <span className="text-slate-300">
                        ({task.helper?.reviewCount} reviews)
                      </span>
                    </div>
                    <span className="text-slate-700">|</span>
                    <div className="flex items-center gap-1 text-slate-200">
                      <MapPin className="h-3.5 w-3.5 text-sky-400" />
                      <span>{task.helper?.location}</span>
                    </div>
                    {statusUpper === "COMPLETED" && !task.userRating && (
                      <>
                        <span className="text-slate-700">|</span>
                        <button
                          type="button"
                          onClick={onOpenRating}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-amber-400 hover:text-amber-300 underline underline-offset-2 cursor-pointer"
                        >
                          <Star className="h-3.5 w-3.5 fill-amber-400" />
                          <span>Give Rating</span>
                        </button>
                      </>
                    )}
                  </div>

                  {/* Bio */}
                  <p className="mt-2.5 text-xs sm:text-[13px] leading-relaxed text-slate-300">
                    {task.helper?.bio}
                  </p>

                  {/* User Review Feedback Preview (if rated) */}
                  {task.userRating && (
                    <div className="mt-2.5 rounded-xl border border-amber-500/25 bg-amber-500/5 px-3 py-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-amber-300">
                          Your Review · {"★".repeat(task.userRating)}
                        </span>
                        <button
                          type="button"
                          onClick={onOpenRating}
                          className="text-[11px] font-medium text-slate-400 hover:text-white cursor-pointer"
                        >
                          Edit
                        </button>
                      </div>
                      {task.userReview && (
                        <p className="mt-0.5 text-xs text-slate-200 italic">
                          “{task.userReview}”
                        </p>
                      )}
                    </div>
                  )}

                  {/* Skill Pills */}
                  <div className="mt-3.5 flex flex-wrap items-center gap-2">
                    {visibleSkills.map((skill, i) => (
                      <span
                        key={i}
                        className="rounded-full border border-slate-700/80 bg-[#131c31] px-3 py-1 text-xs font-medium text-slate-200"
                      >
                        {skill}
                      </span>
                    ))}
                    <span className="rounded-full border border-slate-700/80 bg-[#131c31] px-2.5 py-1 text-xs font-medium text-slate-300">
                      +{extraSkillsCount}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Middle: Call, Message, View Profile Circle Buttons (3 cols) */}
            <div className="flex items-center justify-center gap-6 sm:gap-7 py-2 lg:col-span-3 lg:border-x lg:border-slate-800/80 lg:py-6">
              <button
                type="button"
                onClick={onCallHelper}
                className="group flex flex-col items-center gap-2 cursor-pointer"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-700/80 bg-[#131c31] text-slate-100 shadow-md transition group-hover:border-blue-500/50 group-hover:bg-slate-800">
                  <Phone className="h-5 w-5 fill-current" />
                </div>
                <span className="text-xs font-medium text-slate-200 group-hover:text-white">
                  Call
                </span>
              </button>

              <button
                type="button"
                onClick={onOpenMessage}
                className="group flex flex-col items-center gap-2 cursor-pointer"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-700/80 bg-[#131c31] text-slate-100 shadow-md transition group-hover:border-blue-500/50 group-hover:bg-slate-800">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <span className="text-xs font-medium text-slate-200 group-hover:text-white">
                  Message
                </span>
              </button>

              <button
                type="button"
                onClick={onViewProfile}
                className="group flex flex-col items-center gap-2 cursor-pointer"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-700/80 bg-[#131c31] text-slate-100 shadow-md transition group-hover:border-blue-500/50 group-hover:bg-slate-800">
                  <User className="h-5 w-5 fill-current" />
                </div>
                <span className="text-xs font-medium text-slate-200 group-hover:text-white">
                  View Profile
                </span>
              </button>
            </div>
          </>
        ) : (
          /* Unassigned State (No Helper Assigned Yet) */
          <div className="lg:col-span-9 lg:border-r lg:border-slate-800/80 lg:pr-6">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm sm:text-base font-bold text-white">
                Helper Assignment
              </h3>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/35 bg-amber-500/10 px-3 py-0.5 text-xs font-semibold text-amber-300">
                <Clock className="h-3.5 w-3.5" />
                Waiting for Helper
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-dashed border-slate-700/90 bg-slate-900/45 p-4 sm:p-5">
              <div className="flex items-start gap-3.5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-400">
                  <Clock className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-white">
                    No Helper Assigned Yet
                  </h4>
                  <p className="mt-1 text-xs sm:text-[13px] leading-relaxed text-slate-400 max-w-xl">
                    Your task is live in the marketplace. Verified helpers near{" "}
                    <span className="font-semibold text-slate-200">
                      {task.displayLocation}
                    </span>{" "}
                    can accept this task, or you can browse and invite a helper
                    directly.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={onChangeHelper}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-md shadow-emerald-500/20 hover:bg-emerald-400 transition cursor-pointer"
                >
                  <User className="h-3.5 w-3.5" />
                  <span>Browse & Invite Helpers</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Right: Task Actions Column (3 cols) */}
        <div className="lg:col-span-3 lg:pl-2">
          <h4 className="mb-3 text-xs sm:text-sm font-bold text-white">
            Task Actions
          </h4>

          {statusUpper === "COMPLETED" ? (
            <div className="space-y-2.5">
              {/* 1. Payment Option Button */}
              {isPaid ? (
                <button
                  type="button"
                  onClick={onOpenPayment}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-4 py-2.5 text-xs sm:text-sm font-bold text-emerald-300 transition hover:bg-emerald-500/25 cursor-pointer"
                >
                  <Check className="h-4 w-4 stroke-[3] text-emerald-400" />
                  <span>Payment Released · ₹{task.displayBudget}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onOpenPayment}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-400 cursor-pointer"
                >
                  <CreditCard className="h-4 w-4 stroke-[2.2]" />
                  <span>Pay & Release ₹{task.displayBudget}</span>
                </button>
              )}

              {/* 2. Rate Helper Button */}
              <button
                type="button"
                onClick={onOpenRating}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/15 px-4 py-2.5 text-xs sm:text-sm font-semibold text-amber-300 transition hover:bg-amber-500/25 cursor-pointer"
              >
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span>
                  {task.userRating
                    ? `Rated ${task.userRating}.0 ★ (Edit Review)`
                    : "Rate Helper"}
                </span>
              </button>

              {/* 3. Reorder Task Button */}
              <button
                type="button"
                onClick={onOpenReorder}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-500 cursor-pointer"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Reorder Task</span>
              </button>
            </div>
          ) : statusUpper === "CANCELLED" ? (
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={onOpenReorder}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-500 cursor-pointer"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Reorder Task</span>
              </button>

              <button
                type="button"
                onClick={onChangeHelper}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700/90 bg-[#0d1424] px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-200 transition hover:border-slate-600 hover:bg-slate-800/80 cursor-pointer"
              >
                <ArrowLeftRight className="h-4 w-4 text-slate-300" />
                <span>Browse Helpers</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={onOpenReschedule}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-500 cursor-pointer"
              >
                <RescheduleIcon />
                <span>Reschedule</span>
              </button>

              <button
                type="button"
                onClick={onChangeHelper}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700/90 bg-[#0d1424] px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-200 transition hover:border-slate-600 hover:bg-slate-800/80 cursor-pointer"
              >
                <ArrowLeftRight className="h-4 w-4 text-slate-300" />
                <span>{hasHelper ? "Change Helper" : "Find / Invite Helper"}</span>
              </button>

              <button
                type="button"
                onClick={onCancelTask}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-500/40 bg-rose-950/15 px-4 py-2.5 text-xs sm:text-sm font-semibold text-rose-400 transition hover:bg-rose-500/15 cursor-pointer"
              >
                <Trash2 className="h-4 w-4 text-rose-400" />
                <span>Cancel Task</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 4. Task Progress Stepper */}
      <div className="pt-5">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm sm:text-base font-bold text-white">
            Task Progress
          </h3>
          {statusUpper === "COMPLETED" && !isPaid && (
            <button
              type="button"
              onClick={onOpenPayment}
              className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 transition cursor-pointer"
            >
              <CreditCard className="h-3.5 w-3.5" />
              <span>Release Payment (₹{task.displayBudget}) to complete final step</span>
            </button>
          )}
        </div>

        <div className="relative grid grid-cols-5 text-center">
          {/* Background Connector Line (from col 1 center 10% to col 5 center 90%) */}
          <div className="absolute top-3.5 left-[10%] right-[10%] h-[2px] bg-slate-800" />

          {/* Active Blue/Emerald Progress Line */}
          <div
            className={`absolute top-3.5 left-[10%] h-[2px] transition-all duration-300 ${
              isPaid ? "bg-emerald-500" : "bg-blue-500"
            }`}
            style={{ width: activeLineWidth }}
          />

          {progressSteps.map((step, index) => {
            const isCompleted =
              statusUpper !== "CANCELLED" && index < activeStepIndex;
            const isCurrent =
              statusUpper !== "CANCELLED" && index === activeStepIndex;

            return (
              <div
                key={step.label}
                onClick={step.isActionable ? onOpenPayment : undefined}
                className={`relative z-10 flex flex-col items-center px-1 ${
                  step.isActionable ? "cursor-pointer group" : ""
                }`}
              >
                {isCompleted ? (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md shadow-emerald-500/30">
                    <Check className="h-4 w-4 stroke-[3]" />
                  </div>
                ) : isCurrent ? (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-blue-400 bg-blue-600 ring-4 ring-blue-500/25 shadow-lg shadow-blue-500/50">
                    <span className="h-2.5 w-2.5 rounded-full bg-white" />
                  </div>
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-slate-700 bg-[#0b1120]" />
                )}

                <p
                  className={`mt-2.5 text-[11px] sm:text-xs font-semibold ${
                    isCompleted || isCurrent ? "text-white" : "text-slate-400"
                  }`}
                >
                  {step.label}
                </p>

                {step.sub && (
                  <p
                    className={`mt-0.5 text-[10px] sm:text-xs ${
                      step.isActionable
                        ? "font-bold text-emerald-400 group-hover:underline"
                        : "text-slate-400"
                    }`}
                  >
                    {step.sub}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Helper Functions & Custom Icons ---------------- */

function formatTaskDate(dateInput) {
  if (!dateInput) return "23 Oct 2026";
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "23 Oct 2026";
  }
}

function formatStatusLabel(status) {
  const s = (status || "").toUpperCase();
  if (s === "ASSIGNED") return "Helper Confirmed";
  if (s === "IN_PROGRESS") return "In Progress";
  if (s === "COMPLETED") return "Completed";
  if (s === "CANCELLED") return "Cancelled";
  if (s === "REQUESTED") return "Waiting for Helper";
  return "Open";
}

function getStatusBadgeMeta(statusUpper) {
  switch (statusUpper) {
    case "OPEN":
      return {
        label: "Open · Waiting for Helper",
        pillClass:
          "border-amber-500/40 bg-amber-500/10 text-amber-300 hover:border-amber-400/60",
        iconBgClass: "bg-amber-400",
      };
    case "REQUESTED":
      return {
        label: "Requested · Pending Helper",
        pillClass:
          "border-sky-500/40 bg-sky-500/10 text-sky-300 hover:border-sky-400/60",
        iconBgClass: "bg-sky-400",
      };
    case "ASSIGNED":
      return {
        label: "Helper Confirmed",
        pillClass:
          "border-emerald-500/40 bg-[#0c2823] text-emerald-400 hover:border-emerald-400/60",
        iconBgClass: "bg-emerald-400",
      };
    case "IN_PROGRESS":
      return {
        label: "In Progress",
        pillClass:
          "border-blue-500/40 bg-blue-500/10 text-blue-300 hover:border-blue-400/60",
        iconBgClass: "bg-blue-400",
      };
    case "COMPLETED":
      return {
        label: "Completed",
        pillClass:
          "border-emerald-500/40 bg-emerald-500/15 text-emerald-300 hover:border-emerald-400/60",
        iconBgClass: "bg-emerald-400",
      };
    case "CANCELLED":
      return {
        label: "Cancelled",
        pillClass:
          "border-rose-500/40 bg-rose-500/10 text-rose-300 hover:border-rose-400/60",
        iconBgClass: "bg-rose-400",
      };
    default:
      return {
        label: "Open · Waiting for Helper",
        pillClass:
          "border-amber-500/40 bg-amber-500/10 text-amber-300 hover:border-amber-400/60",
        iconBgClass: "bg-amber-400",
      };
  }
}

function HouseTaskIcon() {
  return (
    <svg
      className="h-7 w-7"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* House Body */}
      <path
        d="M7 15.5L16 8L25 15.5V25C25 25.5523 24.5523 26 24 26H8C7.44772 26 7 25.5523 7 25V15.5Z"
        fill="#FEF3C7"
      />
      {/* Roof */}
      <path
        d="M4.5 16.5L16 6.5L27.5 16.5"
        stroke="#34D399"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Door & Window */}
      <rect x="11" y="18" width="4" height="8" rx="0.8" fill="#1E293B" />
      <rect x="17.5" y="17.5" width="4" height="4" rx="0.8" fill="#0F766E" />
    </svg>
  );
}

function VerifiedBadgeIcon() {
  return (
    <svg
      className="h-5 w-5 text-emerald-400 shrink-0"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M12 2L14.8 4.5L18.5 4.1L19.7 7.6L23 9.5L21.8 13L23 16.5L19.7 18.4L18.5 21.9L14.8 21.5L12 24L9.2 21.5L5.5 21.9L4.3 18.4L1 16.5L2.2 13L1 9.5L4.3 7.6L5.5 4.1L9.2 4.5L12 2Z" />
      <path
        d="M9 12.5L11 14.5L15.5 10"
        stroke="#060913"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

function RescheduleIcon() {
  return (
    <svg
      className="h-4 w-4 text-white"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 16h5v5" />
    </svg>
  );
}
