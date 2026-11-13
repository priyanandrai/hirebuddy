"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Calendar,
  Clock,
  CheckCircle2,
  ArrowRight,
  Heart,
  X,
  Car,
  Wrench,
  Zap,
  Sofa,
  Utensils,
  LayoutGrid,
  Sparkles,
  Package,
  Lock,
  AlertTriangle,
  ShieldCheck,
  ListTodo,
  Mail,
  Wallet,
  ChevronRight,
  Search,
  User,
  Check,
} from "lucide-react";
import {
  getFilteredHelperTasks,
  getTaskCategories,
  getAssignedTasks,
  acceptTask,
  declineTask,
} from "@/app/components/services/task.service";
import {
  getSubscriptionStatus,
  activateSubscription,
} from "@/app/components/services/payment.service";
import { getUserProfile } from "@/app/components/services/user.service";
import HelperDocumentVerificationModal from "@/app/components/ui/HelperDocumentVerificationModal";
import { HelperTaskCardShimmer } from "@/app/components/ui/Shimmer";
import { swalAlert, swalPrompt } from "@/app/components/lib/swal";

const INITIAL_TASKS = [
  {
    id: "helper-task-1",
    title: "Home Cleaning",
    category: "Home Cleaning",
    budget: 300,
    location: "Modipuram, Meerut",
    dateLabel: "29 Oct 2026",
    timeSlot: "10:00 AM - 12:00 PM",
    description:
      "Need deep cleaning for 2 BHK. Bring your own cleaning products if possible.",
    image: "/images/helper_task_cleaning.png",
    hasBakedOverlay: true,
    status: "OPEN",
  },
  {
    id: "helper-task-2",
    title: "Medicine Pickup",
    category: "Delivery & Pickup",
    budget: 150,
    location: "Meerut, UP",
    dateLabel: "29 Oct 2026",
    timeSlot: "02:00 PM - 04:00 PM",
    description:
      "Need someone to pickup medicines from Apollo Pharmacy and deliver at home.",
    image: "/images/helper_task_medicine.png",
    hasBakedOverlay: true,
    status: "OPEN",
  },
  {
    id: "helper-task-3",
    title: "Furniture Assembly",
    category: "Furniture Assembly",
    budget: 500,
    location: "Modipuram, Meerut",
    dateLabel: "30 Oct 2026",
    timeSlot: "11:00 AM - 02:00 PM",
    description:
      "Need help to assemble a wardrobe and a study table. All parts available.",
    image: "/images/helper_task_furniture.png",
    hasBakedOverlay: true,
    status: "OPEN",
  },
  {
    id: "helper-task-4",
    title: "Driver Services",
    category: "Driver Services",
    budget: 400,
    location: "Meerut, UP",
    dateLabel: "28 Oct 2026",
    timeSlot: "09:00 AM - 05:00 PM",
    description: "Need a driver for airport drop and pickup.",
    image: "/images/helper_task_driver.png",
    hasBakedOverlay: true,
    status: "OPEN",
  },
  {
    id: "helper-task-5",
    title: "Plumbing",
    category: "Plumbing",
    budget: 350,
    location: "Modipuram, Meerut",
    dateLabel: "29 Oct 2026",
    timeSlot: "01:00 PM - 03:00 PM",
    description: "Fixing a leaking sink and bathroom tap.",
    image: "/images/helper_task_plumbing.png",
    hasBakedOverlay: true,
    status: "OPEN",
  },
  {
    id: "helper-task-6",
    title: "Cooking",
    category: "Cooking",
    budget: 250,
    location: "Meerut, UP",
    dateLabel: "28 Oct 2026",
    timeSlot: "06:00 PM - 08:00 PM",
    description: "Need home-cooked meal for 3 days.",
    image: "/images/helper_task_cooking.png",
    hasBakedOverlay: true,
    status: "OPEN",
  },
];

function CategoryIcon({ iconType, icon }) {
  switch (iconType) {
    case "cleaning":
      return <span className="text-lg leading-none">🧹</span>;
    case "driver":
      return <Car className="h-4 w-4 text-slate-100" />;
    case "delivery":
      return <Package className="h-4 w-4 text-amber-400" />;
    case "plumbing":
      return <Wrench className="h-4 w-4 text-sky-400" />;
    case "electrical":
      return <Zap className="h-4 w-4 text-amber-400 fill-amber-400" />;
    case "furniture":
      return <Sofa className="h-4 w-4 text-purple-400" />;
    case "cooking":
      return <Utensils className="h-4 w-4 text-sky-400" />;
    case "personal-care":
      return <Heart className="h-4 w-4 text-pink-400" />;
    case "others":
    default:
      if (icon && icon !== "✨") {
        return <span className="text-base leading-none">{icon}</span>;
      }
      return <LayoutGrid className="h-4 w-4 text-slate-200" />;
  }
}

export default function TaskerDashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  const [activeTab, setActiveTab] = useState("ACCEPTED"); // "ACCEPTED" | "AVAILABLE" | "COMPLETED"
  const [assignedTasks, setAssignedTasks] = useState([]);
  const [assignedLoading, setAssignedLoading] = useState(true);

  const [categories, setCategories] = useState([]);
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [loading, setLoading] = useState(true);

  // Buddy Active Account Pass (₹5/day or ₹99/month) state
  const [subStatus, setSubStatus] = useState(null);
  const [activatingPlan, setActivatingPlan] = useState(null);

  // Filter states connected to backend API
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("All Locations");
  const [showAllTasks, setShowAllTasks] = useState(false);

  // Interactive states
  const [favorites, setFavorites] = useState({});
  const [acceptingId, setAcceptingId] = useState(null);
  const [acceptedIds, setAcceptedIds] = useState({});
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [selectedTaskModal, setSelectedTaskModal] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  const loadSubscriptionInfo = useCallback(async () => {
    try {
      const res = await getSubscriptionStatus();
      if (res) {
        setSubStatus(res);
      }
    } catch {}
  }, []);

  const loadHelperDashboardData = useCallback(async () => {
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const [profileRes, assignedRes] = await Promise.allSettled([
        getUserProfile(),
        getAssignedTasks(token),
      ]);

      if (profileRes.status === "fulfilled" && profileRes.value?.user) {
        const user = profileRes.value.user;
        setCurrentUser(user);
        try {
          const currentStored = JSON.parse(localStorage.getItem("user") || "{}");
          localStorage.setItem(
            "user",
            JSON.stringify({ ...currentStored, ...user })
          );
        } catch {}
      }

      if (assignedRes.status === "fulfilled") {
        const list =
          assignedRes.value?.tasks ||
          assignedRes.value?.data ||
          (Array.isArray(assignedRes.value) ? assignedRes.value : []);
        setAssignedTasks(list);
      }
    } catch (err) {
      console.error("Failed to load helper dashboard overview:", err);
    } finally {
      setAssignedLoading(false);
    }
  }, []);

  const handleActivatePlan = async (planType) => {
    setActivatingPlan(planType);
    try {
      const res = await activateSubscription(planType, "ONLINE");
      if (res) {
        await loadSubscriptionInfo();
        showToast(res.message || `Buddy ${planType} Active Pass activated!`);
      }
    } catch (err) {
      showToast(err?.message || "Failed to activate Buddy Pass");
    } finally {
      setActivatingPlan(null);
    }
  };

  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        setCurrentUser(JSON.parse(stored));
      }
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("just_registered_helper");
        const params = new URLSearchParams(window.location.search);
        const initialSearch = params.get("search") || params.get("q") || "";
        if (initialSearch) {
          setSearchQuery(initialSearch);
          setActiveTab("AVAILABLE");
        }
      }
    } catch {}

    loadHelperDashboardData();
    loadSubscriptionInfo();

    getTaskCategories()
      .then((res) => {
        const list = Array.isArray(res) ? res : res?.data || [];
        if (list.length > 0) {
          setCategories((prev) =>
            prev.length > 0
              ? prev
              : list.map((c) => ({
                  name: c.name,
                  slug: c.slug || c.name.toLowerCase().replace(/\s+/g, "-"),
                  tasksCount: 1,
                  icon: c.icon,
                }))
          );
        }
      })
      .catch(() => {});

    const syncLocalUser = () => {
      try {
        const stored = localStorage.getItem("user");
        if (stored) {
          setCurrentUser(JSON.parse(stored));
        }
      } catch {}
    };

    window.addEventListener("storage", syncLocalUser);
    window.addEventListener("userProfileUpdated", syncLocalUser);
    return () => {
      window.removeEventListener("storage", syncLocalUser);
      window.removeEventListener("userProfileUpdated", syncLocalUser);
    };
  }, [loadHelperDashboardData, loadSubscriptionInfo]);

  const fetchTasksFromBackend = useCallback(
    async ({ category, search, location, viewAll }) => {
      setLoading(true);
      try {
        const token =
          typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const res = await getFilteredHelperTasks(
          {
            category: category || undefined,
            search: search || undefined,
            location:
              location && location !== "All Locations" ? location : undefined,
            view: viewAll ? "all" : "home",
            status: "OPEN",
          },
          token
        );

        if (Array.isArray(res?.categories) && res.categories.length > 0) {
          setCategories(res.categories);
        }

        if (Array.isArray(res?.tasks)) {
          const normalized = res.tasks
            .filter(
              (t) =>
                !t.assignedToId &&
                (!t.status || String(t.status).toUpperCase() === "OPEN")
            )
            .map((t) => ({
              ...t,
              hasBakedOverlay: String(t.image || "").includes("helper_task_"),
            }));
          setTasks(normalized);
        }
      } catch (err) {
        console.error("Failed to fetch filtered helper tasks:", err);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchTasksFromBackend({
      category: selectedCategory,
      search: searchQuery,
      location: selectedLocation,
      viewAll: showAllTasks,
    });
  }, [
    selectedCategory,
    searchQuery,
    selectedLocation,
    showAllTasks,
    fetchTasksFromBackend,
  ]);

  useEffect(() => {
    const handleHeaderSearch = (e) => {
      const q = typeof e.detail?.query === "string" ? e.detail.query : "";
      setSearchQuery(q);
      if (q.trim()) {
        setActiveTab("AVAILABLE");
      }
    };
    const handleCategoriesUpdated = () => {
      fetchTasksFromBackend({
        category: selectedCategory,
        search: searchQuery,
        location: selectedLocation,
        viewAll: showAllTasks,
      });
    };
    const handleNewTaskAvailable = (e) => {
      const incoming = e.detail?.task;
      if (
        incoming?.id &&
        !incoming.assignedToId &&
        (!incoming.status || String(incoming.status).toUpperCase() === "OPEN")
      ) {
        showToast(
          `🔔 New Task Available: "${incoming.title}" (₹${incoming.budget})`
        );
        setTasks((prev) => {
          if (prev.some((t) => t.id === incoming.id)) return prev;
          return [
            {
              ...incoming,
              hasBakedOverlay: String(incoming.image || "").includes(
                "helper_task_"
              ),
            },
            ...prev,
          ];
        });
      }
      fetchTasksFromBackend({
        category: selectedCategory,
        search: searchQuery,
        location: selectedLocation,
        viewAll: showAllTasks,
      });
      loadHelperDashboardData();
    };
    const handleTaskStatusChanged = () => {
      fetchTasksFromBackend({
        category: selectedCategory,
        search: searchQuery,
        location: selectedLocation,
        viewAll: showAllTasks,
      });
      loadHelperDashboardData();
    };

    window.addEventListener("hirebuddy:helper-search", handleHeaderSearch);
    window.addEventListener("categoriesUpdated", handleCategoriesUpdated);
    window.addEventListener(
      "hirebuddy:new-task-available",
      handleNewTaskAvailable
    );
    window.addEventListener(
      "hirebuddy:task-status-changed",
      handleTaskStatusChanged
    );
    return () => {
      window.removeEventListener("hirebuddy:helper-search", handleHeaderSearch);
      window.removeEventListener("categoriesUpdated", handleCategoriesUpdated);
      window.removeEventListener(
        "hirebuddy:new-task-available",
        handleNewTaskAvailable
      );
      window.removeEventListener(
        "hirebuddy:task-status-changed",
        handleTaskStatusChanged
      );
    };
  }, [
    fetchTasksFromBackend,
    loadHelperDashboardData,
    selectedCategory,
    searchQuery,
    selectedLocation,
    showAllTasks,
  ]);

  const pendingRequests = useMemo(
    () => assignedTasks.filter((t) => t.status === "REQUESTED"),
    [assignedTasks]
  );

  const activeTasksList = useMemo(
    () =>
      assignedTasks.filter((t) =>
        ["ASSIGNED", "IN_PROGRESS"].includes(t.status)
      ),
    [assignedTasks]
  );

  const completedTasksList = useMemo(
    () => assignedTasks.filter((t) => t.status === "COMPLETED"),
    [assignedTasks]
  );

  const totalEarnings = useMemo(
    () =>
      completedTasksList.reduce(
        (sum, t) => sum + Number(t.budget || 0),
        0
      ),
    [completedTasksList]
  );

  const verificationStatus = currentUser?.idVerificationStatus || "UNVERIFIED";
  const isVerified = verificationStatus === "VERIFIED";
  const isPending = verificationStatus === "PENDING";
  const isRejected = verificationStatus === "REJECTED";
  const userName = currentUser?.name || "Partner";

  const handleCategoryClick = (catName) => {
    setActiveTab("AVAILABLE");
    setSelectedCategory((prev) => (prev === catName ? null : catName));
  };

  const handleResetFilters = () => {
    setSelectedCategory(null);
    setSearchQuery("");
    setSelectedLocation("All Locations");
    setShowAllTasks(false);
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("hirebuddy:helper-search-sync", {
          detail: { query: "" },
        })
      );
    }
  };

  const toggleFavorite = (taskId) => {
    setFavorites((prev) => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  const promptVerificationAndNavigate = async (customMsg) => {
    if (selectedTaskModal) {
      setSelectedTaskModal(null);
    }
    const msg =
      customMsg ||
      (isPending
        ? "Your verification documents are currently under admin review. Please wait for approval to accept tasks."
        : "Your account is not verified yet. Please complete document verification and wait for admin approval to accept tasks.");

    await swalAlert(msg, {
      title: isPending ? "Verification Under Review" : "Verification Required",
      icon: "warning",
      confirmButtonText: "Go to Verification Page",
    });
    router.push("/dashboard-tasker/verification");
  };

  const handleAcceptTask = async (task) => {
    if (!task?.id || acceptedIds[task.id]) return;

    if (!isVerified) {
      await promptVerificationAndNavigate();
      return;
    }

    setAcceptingId(task.id);
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      await acceptTask(task.id, token);
      setAcceptedIds((prev) => ({ ...prev, [task.id]: true }));
      if (selectedTaskModal?.id === task.id) {
        setSelectedTaskModal(null);
      }
      loadHelperDashboardData();
      await swalAlert(`Accepted "${task.title}" successfully!`, {
        title: "Task Accepted!",
        icon: "success",
      });
    } catch (error) {
      const errMsg = error?.message || "Could not accept task";
      if (
        errMsg.toLowerCase().includes("not verified") ||
        errMsg.toLowerCase().includes("verification")
      ) {
        await promptVerificationAndNavigate(errMsg);
        return;
      }

      if (String(task.id).startsWith("helper-task-")) {
        setAcceptedIds((prev) => ({ ...prev, [task.id]: true }));
        if (selectedTaskModal?.id === task.id) {
          setSelectedTaskModal(null);
        }
        await swalAlert(`Task "${task.title}" accepted!`, {
          title: "Task Accepted!",
          icon: "success",
        });
      } else {
        await swalAlert(errMsg, "error");
      }
    } finally {
      setAcceptingId(null);
    }
  };

  const handleAcceptDirectRequest = async (taskId) => {
    if (!isVerified) {
      await promptVerificationAndNavigate();
      return;
    }

    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    setActionLoadingId(taskId);
    try {
      await acceptTask(taskId, token);
      await loadHelperDashboardData();
      await swalAlert("Direct booking request accepted!", {
        title: "Booking Confirmed!",
        icon: "success",
      });
    } catch (err) {
      const errMsg = err?.message || "Failed to accept booking request";
      if (
        errMsg.toLowerCase().includes("not verified") ||
        errMsg.toLowerCase().includes("verification")
      ) {
        await promptVerificationAndNavigate(errMsg);
      } else {
        await swalAlert(errMsg, "error");
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeclineDirectRequest = async (taskId) => {
    const reason = await swalPrompt({
      title: "Decline Booking Request?",
      text: "Reason for declining this request (optional):",
      inputPlaceholder: "Schedule conflict / Unavailable",
      inputValue: "Schedule conflict / Unavailable",
      confirmButtonText: "Decline Request",
      icon: "warning",
    });
    if (reason === null) return;
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    setActionLoadingId(taskId);
    try {
      await declineTask(taskId, reason || "Helper unavailable", token);
      showToast("Booking request declined.");
      await loadHelperDashboardData();
    } catch (err) {
      showToast(err?.message || "Failed to decline booking request");
    } finally {
      setActionLoadingId(null);
    }
  };

  const highlightedCategory = selectedCategory || "Home Cleaning";

  return (
    <div className="min-h-screen bg-[#030814] text-white pb-14">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-[#071a24] px-4 py-3 text-xs sm:text-sm font-semibold text-emerald-300 shadow-2xl">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="mx-auto max-w-[1440px] px-4 sm:px-8 pt-5 space-y-4">
        {/* Verification Callout Banner for Unverified / Pending / Rejected Helpers */}
        {!isVerified && (
          <section
            className={`rounded-2xl border p-4 sm:p-5 shadow-lg ${
              isPending
                ? "border-blue-500/30 bg-blue-500/10"
                : isRejected
                ? "border-rose-500/30 bg-rose-500/10"
                : "border-amber-500/40 bg-amber-500/10"
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div
                  className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
                    isPending
                      ? "border-blue-500/30 bg-blue-500/20 text-blue-300"
                      : isRejected
                      ? "border-rose-500/30 bg-rose-500/20 text-rose-300"
                      : "border-amber-500/30 bg-amber-500/20 text-amber-300"
                  }`}
                >
                  {isPending ? (
                    <Clock className="h-5 w-5 animate-pulse" />
                  ) : isRejected ? (
                    <AlertTriangle className="h-5 w-5" />
                  ) : (
                    <Lock className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-white">
                    {isPending
                      ? "Verification Documents Under Review"
                      : isRejected
                      ? "Verification Rejected · Please Re-upload Documents"
                      : "Account Verification Required"}
                  </h2>
                  <p className="mt-0.5 text-xs sm:text-sm text-slate-300 max-w-2xl">
                    {isPending
                      ? "Your Selfie, ID Proof, and Address Proof are under admin review. Your Verified Partner badge will unlock automatically once approved."
                      : isRejected
                      ? "One or more submitted documents were rejected. Please re-upload clear documents to unlock your Verified Partner badge."
                      : "Complete your 3-step verification (Selfie, ID Proof, and Address Proof) to earn your Verified Partner badge and start accepting customer tasks."}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowVerificationModal(true)}
                className={`shrink-0 rounded-xl px-5 py-2.5 text-xs sm:text-sm font-bold transition shadow-md ${
                  isPending
                    ? "border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
                    : isRejected
                    ? "bg-rose-600 text-white hover:bg-rose-500"
                    : "bg-amber-500 text-slate-950 hover:bg-amber-400"
                }`}
              >
                {isPending
                  ? "View / Update Documents"
                  : isRejected
                  ? "Re-upload Documents"
                  : "Verify Account (3 Steps)"}
              </button>
            </div>
          </section>
        )}

        {/* Hero Welcome Banner */}
        <div className="relative overflow-hidden rounded-2xl border border-[#142544] bg-gradient-to-r from-[#071327] via-[#091832] to-[#061022] shadow-2xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between min-h-[146px]">
            {/* Left Greeting */}
            <div className="relative z-10 px-6 sm:px-8 py-6">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl sm:text-[30px] font-extrabold tracking-tight text-white flex items-center gap-2.5">
                  <span>Hello, {userName}</span>
                  <span className="text-2xl sm:text-[28px]">👋</span>
                </h1>

                {isVerified ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[#0f684e] bg-[#063b2d] px-3 py-1 text-xs font-semibold text-[#34d399]">
                    <CheckCircle2 className="h-3.5 w-3.5 fill-[#10b981] text-[#063b2d]" />
                    <span>Verified Partner</span>
                  </span>
                ) : isPending ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/15 px-3 py-1 text-xs font-semibold text-blue-400">
                    <Clock className="h-3.5 w-3.5 text-blue-400" />
                    <span>Verification Pending</span>
                  </span>
                ) : isRejected ? (
                  <button
                    type="button"
                    onClick={() => setShowVerificationModal(true)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/15 px-3 py-1 text-xs font-semibold text-rose-400 hover:bg-rose-500/25 transition"
                  >
                    <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
                    <span>Verification Rejected</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowVerificationModal(true)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-400 hover:bg-amber-500/25 transition"
                  >
                    <Lock className="h-3.5 w-3.5 text-amber-400" />
                    <span>Unverified</span>
                  </button>
                )}
              </div>
              <p className="mt-2 text-xs sm:text-[15px] text-slate-300">
                Welcome to your Helper Dashboard. Manage your tasks, verification,
                and earnings.
              </p>
            </div>

            {/* Right Banner Illustration */}
            <div className="relative md:w-[50%] lg:w-[45%] h-[135px] sm:h-[150px] shrink-0 overflow-hidden">
              <img
                src="/images/helper_hero_banner.png"
                alt="Your skills make homes happier"
                className="h-full w-full object-cover object-left md:object-right select-none"
              />
              <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[#08162f] to-transparent" />
            </div>
          </div>
        </div>

        {/* 4 Helper Dashboard Overview Metric Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <button
            type="button"
            onClick={() => setActiveTab("ACCEPTED")}
            className={`group flex items-center justify-between rounded-2xl border p-4 sm:p-5 text-left shadow-lg transition ${
              pendingRequests.length > 0
                ? "border-amber-500/40 bg-[#0b1528]"
                : "border-[#152544] bg-[#071124] hover:border-[#243f73]"
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/25 text-amber-400">
                <Mail className="h-5 w-5" />
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

          <button
            type="button"
            onClick={() => setActiveTab("ACCEPTED")}
            className={`group flex items-center justify-between rounded-2xl border p-4 sm:p-5 text-left shadow-lg transition ${
              activeTab === "ACCEPTED"
                ? "border-[#3b82f6] bg-gradient-to-r from-[#0a41d8] to-[#1961f0] text-white shadow-blue-950/60"
                : "border-[#152544] bg-[#071124] hover:border-[#243f73]"
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                  activeTab === "ACCEPTED"
                    ? "bg-white/15 text-white"
                    : "bg-blue-500/15 border border-blue-500/25 text-blue-400"
                }`}
              >
                <ListTodo className="h-5 w-5" />
              </div>
              <div>
                <p
                  className={`text-xs font-semibold ${
                    activeTab === "ACCEPTED" ? "text-white" : "text-slate-300"
                  }`}
                >
                  My Accepted Tasks
                </p>
                <p className="mt-1 text-2xl font-extrabold text-white leading-none">
                  {activeTasksList.length}
                </p>
              </div>
            </div>
            <ChevronRight
              className={`h-4 w-4 group-hover:translate-x-0.5 transition ${
                activeTab === "ACCEPTED" ? "text-white" : "text-slate-400"
              }`}
            />
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("COMPLETED")}
            className={`group flex items-center justify-between rounded-2xl border p-4 sm:p-5 text-left shadow-lg transition ${
              activeTab === "COMPLETED"
                ? "border-emerald-500/50 bg-[#0b1831]"
                : "border-[#152544] bg-[#071124] hover:border-[#243f73]"
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-400">
                <Check className="h-5 w-5 stroke-[2.5]" />
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

          <button
            type="button"
            onClick={() => router.push("/dashboard-tasker/wallet")}
            className="group flex items-center justify-between rounded-2xl border border-[#152544] bg-[#071124] hover:border-[#243f73] p-4 sm:p-5 text-left shadow-lg transition"
          >
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-500/15 border border-purple-500/25 text-purple-400">
                <Wallet className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-300">
                  Total Earnings
                </p>
                <p className="mt-1 text-2xl font-extrabold text-white leading-none">
                  ₹{totalEarnings}
                </p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-0.5 transition" />
          </button>
        </section>

        {/* Buddy Active Account Pass Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-[#162a4f] bg-[#071226]/95 px-5 py-3.5 shadow-lg">
          <div className="flex items-start sm:items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold text-sm">
              100%
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs sm:text-sm font-bold text-white">
                  0% Task Commission — You Keep 100% of Every Task Payment
                </p>
                {subStatus?.isActive ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300">
                    ● Active Pass ({subStatus.planType || "DAILY"}) until{" "}
                    {new Date(subStatus.activeUntil).toLocaleDateString()}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 border border-amber-500/40 px-2.5 py-0.5 text-[11px] font-bold text-amber-300">
                    ⚡ Activate Buddy Pass (₹5/day) to accept tasks
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Task payments are held safely in Escrow &amp; released 100% to
                your Buddy Wallet upon completion.
                {subStatus?.walletBalanceRupees !== undefined && (
                  <span className="ml-2 font-semibold text-emerald-400">
                    • Wallet Balance: ₹{subStatus.walletBalanceRupees}
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              disabled={activatingPlan !== null}
              onClick={() => handleActivatePlan("DAILY")}
              className="rounded-xl border border-emerald-500/40 bg-emerald-500/15 hover:bg-emerald-500/25 px-3.5 py-2 text-xs font-bold text-emerald-300 transition"
            >
              {activatingPlan === "DAILY" ? "Activating..." : "₹5 / Day Pass"}
            </button>
            <button
              type="button"
              disabled={activatingPlan !== null}
              onClick={() => handleActivatePlan("MONTHLY")}
              className="rounded-xl bg-[#0d6efd] hover:bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow transition"
            >
              {activatingPlan === "MONTHLY"
                ? "Activating..."
                : "₹99 / Month Pass"}
            </button>
          </div>
        </div>

        {/* Helper Dashboard Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#152544] pt-1">
          <div className="flex items-center gap-6 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab("ACCEPTED")}
              className={`flex items-center gap-2 pb-3 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition ${
                activeTab === "ACCEPTED"
                  ? "border-[#2563eb] text-[#3b82f6]"
                  : "border-transparent text-slate-400 hover:text-white"
              }`}
            >
              <User className="h-4 w-4" />
              <span>My Accepted Tasks</span>
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-500/20 px-1.5 text-[11px] font-bold text-blue-400">
                {activeTasksList.length + pendingRequests.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("AVAILABLE")}
              className={`flex items-center gap-2 pb-3 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition ${
                activeTab === "AVAILABLE"
                  ? "border-[#2563eb] text-[#3b82f6]"
                  : "border-transparent text-slate-400 hover:text-white"
              }`}
            >
              <Search className="h-4 w-4" />
              <span>Available Tasks Near You</span>
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-800 px-1.5 text-[11px] font-bold text-slate-300">
                {tasks.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("COMPLETED")}
              className={`flex items-center gap-2 pb-3 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition ${
                activeTab === "COMPLETED"
                  ? "border-[#2563eb] text-[#3b82f6]"
                  : "border-transparent text-slate-400 hover:text-white"
              }`}
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Completed Tasks</span>
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-800 px-1.5 text-[11px] font-bold text-slate-300">
                {completedTasksList.length}
              </span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-3 pb-2.5 text-xs font-semibold">
            <Link
              href="/dashboard-tasker/profile"
              className="text-slate-300 hover:text-white transition"
            >
              My Profile
            </Link>
            <span className="text-slate-600">•</span>
            <Link
              href="/dashboard-tasker/my-tasks"
              className="text-[#3b82f6] hover:text-blue-400 transition"
            >
              Full Task Manager →
            </Link>
          </div>
        </div>

        {/* TAB 1: MY ACCEPTED TASKS & DIRECT BOOKING REQUESTS */}
        {activeTab === "ACCEPTED" && (
          <div className="space-y-4">
            {pendingRequests.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm sm:text-base font-bold text-white">
                  Direct Booking Requests ({pendingRequests.length})
                </h3>
                {pendingRequests.map((req) => (
                  <div
                    key={req.id}
                    className="rounded-2xl border border-amber-500/40 bg-[#071124] p-5 shadow-xl"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <span className="inline-block rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-[11px] font-bold text-amber-400">
                          ⚡ Direct Booking Request
                        </span>
                        <h4 className="mt-1.5 text-base sm:text-lg font-bold text-white">
                          {req.title}
                        </h4>
                        <p className="mt-1 text-xs text-slate-300">
                          📍 {req.location || "Modipuram, Meerut"} • Customer:{" "}
                          <strong>{req.createdBy?.name || "Customer"}</strong>
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xl font-extrabold text-emerald-400">
                          ₹{req.budget}
                        </span>
                        <button
                          type="button"
                          disabled={actionLoadingId === req.id}
                          onClick={() => handleAcceptDirectRequest(req.id)}
                          className="rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-bold text-white transition"
                        >
                          {actionLoadingId === req.id
                            ? "Accepting..."
                            : "Accept"}
                        </button>
                        <button
                          type="button"
                          disabled={actionLoadingId === req.id}
                          onClick={() => handleDeclineDirectRequest(req.id)}
                          className="rounded-xl border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 px-4 py-2 text-xs font-bold text-rose-300 transition"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {assignedLoading ? (
              <HelperTaskCardShimmer count={3} />
            ) : activeTasksList.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeTasksList.map((task) => (
                  <div
                    key={task.id}
                    className="rounded-2xl border border-[#152544] bg-[#071124] p-5 shadow-xl flex flex-col justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-0.5 text-xs font-semibold text-emerald-400">
                          {task.status === "IN_PROGRESS"
                            ? "In Progress"
                            : "Accepted & Assigned"}
                        </span>
                        <span className="text-lg font-extrabold text-emerald-400">
                          ₹{task.budget}
                        </span>
                      </div>
                      <h3 className="mt-2.5 text-base sm:text-lg font-bold text-white">
                        {task.title}
                      </h3>
                      <p className="mt-1 text-xs text-slate-300 line-clamp-2">
                        {task.description}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-400">
                        <span>📍 {task.location || "Modipuram, Meerut"}</span>
                        {task.createdBy?.name && (
                          <span>👤 {task.createdBy.name}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#152544]">
                      <Link
                        href={`/dashboard-tasker/my-tasks/${task.id}`}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#0d6efd] hover:bg-blue-600 px-4 py-2 text-xs font-bold text-white transition"
                      >
                        <span>View Task Details</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : pendingRequests.length === 0 ? (
              <div className="rounded-2xl border border-[#152544] bg-[#071124] p-8 sm:p-10 text-center shadow-xl">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-400 mb-3">
                  <ListTodo className="h-6 w-6" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white">
                  No Accepted Tasks Yet
                </h3>
                <p className="mt-1 max-w-md mx-auto text-xs sm:text-sm text-slate-400">
                  {!isVerified
                    ? "Complete your 3-step profile verification to get your Verified Partner badge, or browse open tasks available in your area."
                    : "You don't have any active accepted tasks right now. Browse available tasks near you to start earning!"}
                </p>
                <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                  {!isVerified && (
                    <button
                      type="button"
                      onClick={() => setShowVerificationModal(true)}
                      className="inline-flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 px-5 py-2.5 text-xs sm:text-sm font-bold text-slate-950 transition shadow"
                    >
                      <ShieldCheck className="h-4 w-4" />
                      <span>Verify Account (3 Steps)</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setActiveTab("AVAILABLE")}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#0d6efd] hover:bg-blue-600 px-5 py-2.5 text-xs sm:text-sm font-bold text-white transition shadow"
                  >
                    <span>Browse Available Tasks</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <Link
                    href="/dashboard-tasker/profile"
                    className="inline-flex items-center gap-2 rounded-xl border border-[#1b2e54] bg-[#0a1428] hover:bg-[#122241] px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-200 transition"
                  >
                    <span>View My Profile</span>
                  </Link>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* TAB 2: COMPLETED TASKS */}
        {activeTab === "COMPLETED" && (
          <div>
            {completedTasksList.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {completedTasksList.map((task) => (
                  <div
                    key={task.id}
                    className="rounded-2xl border border-[#152544] bg-[#071124] p-5 shadow-xl flex items-center justify-between gap-4"
                  >
                    <div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400">
                        ✓ Completed
                      </span>
                      <h3 className="mt-2 text-base font-bold text-white">
                        {task.title}
                      </h3>
                      <p className="mt-1 text-xs text-slate-400">
                        📍 {task.location || "Modipuram, Meerut"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-extrabold text-emerald-400">
                        ₹{task.budget}
                      </p>
                      <Link
                        href={`/dashboard-tasker/my-tasks/${task.id}`}
                        className="mt-2 inline-block text-xs font-semibold text-blue-400 hover:underline"
                      >
                        Details →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-[#152544] bg-[#071124] p-10 text-center shadow-xl">
                <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-400 mb-2" />
                <h3 className="text-base font-bold text-white">
                  No Completed Tasks Yet
                </h3>
                <p className="mt-1 text-xs sm:text-sm text-slate-400">
                  Tasks you finish will appear here along with your 100% escrow
                  payout history.
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: AVAILABLE TASKS NEAR YOU */}
        {activeTab === "AVAILABLE" && (
          <div>
            {/* Category Filter Pills Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
              {categories.map((cat) => {
                const isActive = highlightedCategory === cat.name;
                const isExplicitlyFiltered = selectedCategory === cat.name;
                return (
                  <button
                    key={cat.slug || cat.name}
                    type="button"
                    onClick={() => handleCategoryClick(cat.name)}
                    className={`group flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-all ${
                      isActive
                        ? "border-[#3b82f6] bg-gradient-to-r from-[#0a41d8] to-[#1961f0] text-white shadow-lg shadow-blue-950/60"
                        : "border-[#142342] bg-[#071124] hover:border-[#243f73] hover:bg-[#0b1831] text-white"
                    }`}
                  >
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                        isActive
                          ? "bg-white/15"
                          : "bg-[#0d1b36] group-hover:bg-[#132548]"
                      }`}
                    >
                      <CategoryIcon iconType={cat.iconType} icon={cat.icon} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12px] font-bold text-white leading-tight">
                        {cat.name}
                      </p>
                      <p
                        className={`text-[11px] leading-tight mt-0.5 ${
                          isActive ? "text-blue-100" : "text-slate-400"
                        }`}
                      >
                        {cat.tasksCount} tasks
                        {isExplicitlyFiltered ? " • Filtered" : ""}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Available Tasks Near You Header */}
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-lg sm:text-[19px] font-bold text-white">
                  Available Tasks Near You
                </h2>
                <div className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-slate-300">
                  <MapPin className="h-4 w-4 text-[#3b82f6] shrink-0" />
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    aria-label="Filter by location"
                    className="bg-transparent text-xs sm:text-sm font-medium text-slate-200 focus:outline-none cursor-pointer"
                  >
                    <option
                      value="All Locations"
                      className="bg-[#081226] text-white"
                    >
                      Modipuram, Meerut
                    </option>
                    <option
                      value="Modipuram, Meerut"
                      className="bg-[#081226] text-white"
                    >
                      Modipuram, Meerut Only
                    </option>
                    <option
                      value="Meerut, UP"
                      className="bg-[#081226] text-white"
                    >
                      Meerut, UP Only
                    </option>
                  </select>
                </div>

                {(selectedCategory ||
                  searchQuery ||
                  selectedLocation !== "All Locations") && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="inline-flex items-center gap-1 rounded-full border border-blue-500/40 bg-blue-500/10 px-2.5 py-0.5 text-xs font-medium text-blue-300 hover:bg-blue-500/20 transition"
                  >
                    <span>
                      {selectedCategory || searchQuery || selectedLocation}
                    </span>
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  if (
                    selectedCategory ||
                    searchQuery ||
                    selectedLocation !== "All Locations"
                  ) {
                    handleResetFilters();
                  } else {
                    setShowAllTasks((prev) => !prev);
                  }
                }}
                className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-[#3b82f6] hover:text-blue-400 transition"
              >
                <span>
                  {selectedCategory || searchQuery
                    ? "Show all tasks"
                    : showAllTasks
                    ? "Show featured tasks"
                    : "View all tasks"}
                </span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            {/* Tasks Grid */}
            {loading ? (
              <div className="mt-4">
                <HelperTaskCardShimmer count={6} />
              </div>
            ) : tasks.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-[#152544] bg-[#071124] p-10 text-center">
                <Sparkles className="mx-auto h-8 w-8 text-blue-400 mb-2" />
                <h3 className="text-base font-bold text-white">
                  No matching tasks found
                </h3>
                <p className="mt-1 text-xs sm:text-sm text-slate-400">
                  Try clearing your category or search filter to see all
                  available tasks near you.
                </p>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="mt-4 rounded-xl bg-[#0d6efd] hover:bg-blue-600 px-4 py-2 text-xs font-bold text-white transition"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="mt-3.5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tasks.map((task) => {
                  const isAccepted = Boolean(acceptedIds[task.id]);
                  const isAccepting = acceptingId === task.id;
                  const isFav = Boolean(favorites[task.id]);

                  return (
                    <div
                      key={task.id}
                      className="flex flex-col justify-between rounded-2xl border border-[#152544] bg-[#071124] p-3.5 shadow-xl hover:border-[#233d6e] transition"
                    >
                      <div>
                        <div className="relative h-[88px] w-full overflow-hidden rounded-xl bg-[#0c1830]">
                          <img
                            src={task.image || "/images/helper_task_cleaning.png"}
                            alt={task.title}
                            className="h-full w-full object-cover"
                          />

                          {!task.hasBakedOverlay && (
                            <>
                              <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-[#10b981] px-2.5 py-0.5 text-[11px] font-bold text-white shadow">
                                <CheckCircle2 className="h-3 w-3" />
                                New
                              </span>
                              <div className="absolute right-2.5 top-2.5 flex items-center gap-1.5">
                                <span className="rounded-full border border-white/15 bg-[#050d1e]/90 px-3 py-0.5 text-xs font-extrabold text-white shadow">
                                  ₹{task.budget || 300}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => toggleFavorite(task.id)}
                                  aria-label="Favorite task"
                                  className="flex h-7 w-7 items-center justify-center rounded-full border border-white/15 bg-[#050d1e]/80 text-white hover:text-rose-400 transition"
                                >
                                  <Heart
                                    className={`h-3.5 w-3.5 ${
                                      isFav
                                        ? "fill-rose-500 text-rose-500"
                                        : ""
                                    }`}
                                  />
                                </button>
                              </div>
                            </>
                          )}

                          {task.hasBakedOverlay && (
                            <button
                              type="button"
                              onClick={() => toggleFavorite(task.id)}
                              aria-label="Toggle favorite"
                              className="absolute right-1.5 top-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-transparent text-white"
                            >
                              {isFav && (
                                <Heart className="h-4 w-4 fill-rose-500 text-rose-500 drop-shadow" />
                              )}
                            </button>
                          )}
                        </div>

                        <h3 className="mt-2.5 text-[15px] sm:text-[16px] font-bold text-white">
                          {task.title}
                        </h3>

                        <div className="mt-1.5 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-slate-300">
                          <span className="inline-flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            {task.location || "Modipuram, Meerut"}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            {task.dateLabel || "29 Oct 2026"}
                          </span>
                        </div>

                        <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-300">
                          <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>{task.timeSlot || "10:00 AM - 12:00 PM"}</span>
                        </div>

                        <p className="mt-2 text-xs text-slate-300 leading-relaxed line-clamp-2 min-h-[34px]">
                          {task.description}
                        </p>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2.5">
                        <button
                          type="button"
                          onClick={() => setSelectedTaskModal(task)}
                          className="rounded-xl border border-[#1b2e54] bg-[#0a1428] hover:bg-[#122241] py-2 text-xs font-semibold text-slate-200 transition"
                        >
                          View Task
                        </button>
                        <button
                          type="button"
                          disabled={isAccepting || isAccepted}
                          onClick={() => handleAcceptTask(task)}
                          className={`rounded-xl py-2 text-xs font-bold text-white shadow-md transition ${
                            isAccepted
                              ? "bg-emerald-600 cursor-default"
                              : "bg-[#0d6efd] hover:bg-[#2563eb] shadow-blue-950/60"
                          }`}
                        >
                          {isAccepted
                            ? "✓ Accepted"
                            : isAccepting
                            ? "Accepting..."
                            : "Accept Task"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* View Task Detail Modal */}
      {selectedTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-[#1d3159] bg-[#081225] p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="inline-block rounded-full bg-blue-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-blue-300">
                  {selectedTaskModal.category || "Task Details"}
                </span>
                <h3 className="mt-1.5 text-lg font-bold text-white">
                  {selectedTaskModal.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTaskModal(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-[#122241] hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-3 overflow-hidden rounded-xl border border-[#162749]">
              <img
                src={
                  selectedTaskModal.image || "/images/helper_task_cleaning.png"
                }
                alt={selectedTaskModal.title}
                className="h-28 w-full object-cover"
              />
            </div>

            <div className="mt-4 space-y-2 text-xs sm:text-sm text-slate-300">
              <div className="flex items-center justify-between border-b border-[#142342] pb-2">
                <span className="text-slate-400">Task Payout</span>
                <span className="text-base font-extrabold text-emerald-400">
                  ₹{selectedTaskModal.budget || 300}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-blue-400 shrink-0" />
                <span>{selectedTaskModal.location || "Modipuram, Meerut"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-400 shrink-0" />
                <span>{selectedTaskModal.dateLabel || "29 Oct 2026"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-400 shrink-0" />
                <span>
                  {selectedTaskModal.timeSlot || "10:00 AM - 12:00 PM"}
                </span>
              </div>
            </div>

            <p className="mt-3 rounded-xl border border-[#142342] bg-[#050c1a] p-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
              {selectedTaskModal.description}
            </p>

            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setSelectedTaskModal(null)}
                className="rounded-xl border border-[#1b2e54] bg-[#0a1428] hover:bg-[#122241] py-2.5 text-xs font-semibold text-slate-200 transition"
              >
                Close
              </button>
              <button
                type="button"
                disabled={Boolean(acceptedIds[selectedTaskModal.id])}
                onClick={() => handleAcceptTask(selectedTaskModal)}
                className="rounded-xl bg-[#0d6efd] hover:bg-[#2563eb] py-2.5 text-xs font-bold text-white transition disabled:bg-emerald-600"
              >
                {acceptedIds[selectedTaskModal.id]
                  ? "✓ Accepted"
                  : "Accept Task"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3-Step Helper Document Verification Modal */}
      <HelperDocumentVerificationModal
        isOpen={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
        onComplete={(updatedUser) => {
          setCurrentUser(updatedUser);
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
        user={currentUser}
      />
    </div>
  );
}
