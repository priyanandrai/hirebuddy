"use client";

import { useEffect, useState, useCallback } from "react";
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
} from "lucide-react";
import {
  getFilteredHelperTasks,
  acceptTask,
} from "@/app/components/services/task.service";
import { HelperTaskCardShimmer } from "@/app/components/ui/Shimmer";

const DEFAULT_CATEGORIES = [
  { name: "Home Cleaning", slug: "home-cleaning", tasksCount: 1, iconType: "cleaning" },
  { name: "Driver Services", slug: "driver-services", tasksCount: 1, iconType: "driver" },
  { name: "Delivery & Pickup", slug: "delivery-pickup", tasksCount: 1, iconType: "delivery" },
  { name: "Plumbing", slug: "plumbing", tasksCount: 1, iconType: "plumbing" },
  { name: "Electrical", slug: "electrical", tasksCount: 1, iconType: "electrical" },
  { name: "Furniture Assembly", slug: "furniture-assembly", tasksCount: 1, iconType: "furniture" },
  { name: "Cooking", slug: "cooking", tasksCount: 1, iconType: "cooking" },
  { name: "Personal Care", slug: "personal-care", tasksCount: 1, iconType: "personal-care" },
  { name: "Others", slug: "others", tasksCount: 1, iconType: "others" },
];

const INITIAL_TASKS = [
  {
    id: "helper-task-1",
    title: "Home Cleaning",
    category: "Home Cleaning",
    budget: 300,
    location: "Modipuram, Meerut",
    dateLabel: "29 Oct 2026",
    timeSlot: "10:00 AM - 12:00 PM",
    description: "Need deep cleaning for 2 BHK. Bring your own cleaning products if possible.",
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
    description: "Need someone to pickup medicines from Apollo Pharmacy and deliver at home.",
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
    description: "Need help to assemble a wardrobe and a study table. All parts available.",
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
  const [userName, setUserName] = useState("prreto G");
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [loading, setLoading] = useState(true);

  // Filter states connected to backend API
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("All Locations");
  const [showAllTasks, setShowAllTasks] = useState(false);

  // Interactive states
  const [favorites, setFavorites] = useState({});
  const [acceptingId, setAcceptingId] = useState(null);
  const [acceptedIds, setAcceptedIds] = useState({});
  const [selectedTaskModal, setSelectedTaskModal] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("user") || "{}");
      if (stored?.name) {
        setUserName(stored.name);
      }
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const initialSearch = params.get("search") || params.get("q") || "";
        if (initialSearch) {
          setSearchQuery(initialSearch);
        }
      }
    } catch (e) {}
  }, []);

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
          const normalized = res.tasks.map((t) => ({
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
    };
    const handleCategoriesUpdated = () => {
      fetchTasksFromBackend({
        category: selectedCategory,
        search: searchQuery,
        location: selectedLocation,
        viewAll: showAllTasks,
      });
    };
    window.addEventListener("hirebuddy:helper-search", handleHeaderSearch);
    window.addEventListener("categoriesUpdated", handleCategoriesUpdated);
    return () => {
      window.removeEventListener("hirebuddy:helper-search", handleHeaderSearch);
      window.removeEventListener("categoriesUpdated", handleCategoriesUpdated);
    };
  }, [fetchTasksFromBackend, selectedCategory, searchQuery, selectedLocation, showAllTasks]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  const handleCategoryClick = (catName) => {
    setSelectedCategory((prev) => (prev === catName ? null : catName));
  };

  const handleResetFilters = () => {
    setSelectedCategory(null);
    setSearchQuery("");
    setSelectedLocation("All Locations");
    setShowAllTasks(false);
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("hirebuddy:helper-search-sync", { detail: { query: "" } })
      );
    }
  };

  const toggleFavorite = (taskId) => {
    setFavorites((prev) => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  const handleAcceptTask = async (task) => {
    if (!task?.id || acceptedIds[task.id]) return;
    setAcceptingId(task.id);
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      await acceptTask(task.id, token);
      setAcceptedIds((prev) => ({ ...prev, [task.id]: true }));
      showToast(`Accepted "${task.title}" successfully!`);
      if (selectedTaskModal?.id === task.id) {
        setSelectedTaskModal(null);
      }
    } catch (error) {
      // If demo catalog task or unverified helper in demo mode, still provide feedback
      if (String(task.id).startsWith("helper-task-")) {
        setAcceptedIds((prev) => ({ ...prev, [task.id]: true }));
        showToast(`Task "${task.title}" accepted!`);
        if (selectedTaskModal?.id === task.id) {
          setSelectedTaskModal(null);
        }
      } else {
        showToast(error?.message || "Could not accept task");
      }
    } finally {
      setAcceptingId(null);
    }
  };

  // Visual highlight matches helper_home_page.png ("Home Cleaning" highlighted on default view, or active selectedCategory)
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

      <div className="mx-auto max-w-[1440px] px-4 sm:px-8 pt-5">
        {/* Hero Welcome Banner */}
        <div className="relative overflow-hidden rounded-2xl border border-[#142544] bg-gradient-to-r from-[#071327] via-[#091832] to-[#061022] shadow-2xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between min-h-[146px]">
            {/* Left Greeting */}
            <div className="relative z-10 px-6 sm:px-8 py-6">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl sm:text-[31px] font-extrabold tracking-tight text-white flex items-center gap-2.5">
                  <span>Hello, {userName}</span>
                  <span className="text-2xl sm:text-[30px]">👋</span>
                </h1>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#0f684e] bg-[#063b2d] px-3 py-1 text-xs font-semibold text-[#34d399]">
                  <CheckCircle2 className="h-3.5 w-3.5 fill-[#10b981] text-[#063b2d]" />
                  Verified Partner
                </span>
              </div>
              <p className="mt-2 text-xs sm:text-[15px] text-slate-300">
                Find new tasks and grow your earnings with HireBuddy.
              </p>
            </div>

            {/* Right Banner Illustration */}
            <div className="relative md:w-[54%] lg:w-[48%] h-[135px] sm:h-[150px] shrink-0 overflow-hidden">
              <img
                src="/images/helper_hero_banner.png"
                alt="Your skills make homes happier"
                className="h-full w-full object-cover object-left md:object-right select-none"
              />
              <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[#08162f] to-transparent" />
            </div>
          </div>
        </div>

        {/* 8 Category Filter Pills Bar */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
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
                <option value="All Locations" className="bg-[#081226] text-white">
                  Modipuram, Meerut
                </option>
                <option value="Modipuram, Meerut" className="bg-[#081226] text-white">
                  Modipuram, Meerut Only
                </option>
                <option value="Meerut, UP" className="bg-[#081226] text-white">
                  Meerut, UP Only
                </option>
              </select>
            </div>

            {(selectedCategory || searchQuery || selectedLocation !== "All Locations") && (
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
              if (selectedCategory || searchQuery || selectedLocation !== "All Locations") {
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

        {/* Tasks Grid (3x2 layout matching helper_home_page.png) */}
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
              Try clearing your category or search filter to see all available tasks near you.
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
                    {/* Top Card Image Banner */}
                    <div className="relative h-[88px] w-full overflow-hidden rounded-xl bg-[#0c1830]">
                      <img
                        src={task.image || "/images/helper_task_cleaning.png"}
                        alt={task.title}
                        className="h-full w-full object-cover"
                      />

                      {/* If dynamic DB task without baked overlay, render New + Price + Heart badges */}
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
                                  isFav ? "fill-rose-500 text-rose-500" : ""
                                }`}
                              />
                            </button>
                          </div>
                        </>
                      )}

                      {/* Interactive Heart Hotspot for Baked Overlay Cards */}
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

                    {/* Task Title */}
                    <h3 className="mt-2.5 text-[15px] sm:text-[16px] font-bold text-white">
                      {task.title}
                    </h3>

                    {/* Location & Date Row */}
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

                    {/* Time Slot Row */}
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-300">
                      <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>{task.timeSlot || "10:00 AM - 12:00 PM"}</span>
                    </div>

                    {/* Description */}
                    <p className="mt-2 text-xs text-slate-300 leading-relaxed line-clamp-2 min-h-[34px]">
                      {task.description}
                    </p>
                  </div>

                  {/* Action Buttons */}
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
                src={selectedTaskModal.image || "/images/helper_task_cleaning.png"}
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
                <span>{selectedTaskModal.timeSlot || "10:00 AM - 12:00 PM"}</span>
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
    </div>
  );
}
