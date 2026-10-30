"use client";

import { Suspense, useEffect, useState, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { getHelpers, getUserProfile } from "@/app/components/services/user.service";
import { getTaskCategories } from "@/app/components/services/task.service";
import { HelperDirectoryCardShimmer } from "@/app/components/ui/Shimmer";
import {
  Search,
  MapPin,
  Tag,
  Star,
  ShieldCheck,
  SlidersHorizontal,
  X,
  Check,
  ArrowLeft,
  UserPlus,
  Briefcase,
  Sparkles,
} from "lucide-react";

const TASK_OVERRIDES_STORAGE_KEY = "hirebuddy_my_tasks_overrides_v1";

const DEFAULT_LOCATIONS = [
  "Modipuram, Meerut",
  "Shastri Nagar, Meerut",
  "Kankerkhera, Meerut",
  "Pallavpuram, Meerut",
  "Saket, Meerut",
  "Meerut, UP",
  "Noida, UP",
  "Greater Noida, UP",
  "Ghaziabad, UP",
  "Delhi NCR",
];

const DEFAULT_TASK_TYPES = [
  "Home Cleaning",
  "Driver Services",
  "Delivery & Pickup",
  "Plumbing",
  "Electrical",
  "Furniture Assembly",
  "Cooking",
  "Personal Care",
  "Others",
];

const PRESET_HELPERS = [
  {
    id: "helper-delivery-1",
    name: "Rahul Kumar",
    category: "Delivery",
    taskTypes: ["Delivery", "Shopping", "Home Help"],
    skills: ["Medicine Delivery", "Grocery Pickup", "Parcel Drop", "Express Errands"],
    rating: 4.9,
    jobs: 142,
    hourlyRate: 180,
    experience: "4+ years",
    location: "Modipuram, Meerut",
    bio: "Fast and reliable local delivery partner for medicines, groceries, documents, and urgent parcels across Modipuram & Meerut.",
    idVerificationStatus: "VERIFIED",
    isAvailable: true,
    phone: "+91 98765 43211",
  },
  {
    id: "helper-delivery-2",
    name: "Deepak Saini",
    category: "Delivery",
    taskTypes: ["Delivery", "Shopping"],
    skills: ["Pharmacy Pickup", "Same-Day Delivery", "Local Shopping", "Food & Essentials"],
    rating: 4.8,
    jobs: 98,
    hourlyRate: 160,
    experience: "3+ years",
    location: "Modipuram, Meerut",
    bio: "Trusted two-wheeler delivery helper specializing in urgent medicine pickups, store runs, and doorstep drops.",
    idVerificationStatus: "VERIFIED",
    isAvailable: true,
    phone: "+91 98765 43212",
  },
  {
    id: "helper-delivery-3",
    name: "Vikas Kashyap",
    category: "Delivery",
    taskTypes: ["Delivery", "Moving & Packing", "Shopping"],
    skills: ["Courier & Parcel", "Medicine Delivery", "Heavy Package Handling"],
    rating: 4.7,
    jobs: 84,
    hourlyRate: 170,
    experience: "3+ years",
    location: "Shastri Nagar, Meerut",
    bio: "Punctual delivery and errand specialist familiar with all Meerut sectors, hospitals, and local markets.",
    idVerificationStatus: "VERIFIED",
    isAvailable: true,
    phone: "+91 98765 43213",
  },
  {
    id: "priya-sharma",
    name: "Priya Sharma",
    image: "/images/priya_sharma.png",
    category: "Cleaning",
    taskTypes: ["Cleaning", "Home Help"],
    skills: ["Kitchen Cleaning", "Deep Cleaning", "Home Sanitization", "Bathroom Cleaning"],
    rating: 4.8,
    jobs: 120,
    hourlyRate: 200,
    experience: "5+ years",
    location: "Noida, UP",
    bio: "Experienced and reliable cleaner with 5+ years of expertise in home and kitchen deep cleaning. Known for attention to detail.",
    idVerificationStatus: "VERIFIED",
    isAvailable: true,
    phone: "+91 98765 43210",
  },
  {
    id: "helper-cleaning-2",
    name: "Sunita Devi",
    category: "Cleaning",
    taskTypes: ["Cleaning", "Cooking", "Home Help"],
    skills: ["Full Home Cleaning", "Kitchen Slab & Chimney", "Utensil & Floor Care"],
    rating: 4.9,
    jobs: 156,
    hourlyRate: 190,
    experience: "6+ years",
    location: "Modipuram, Meerut",
    bio: "Dedicated home cleaning and housekeeping professional serving families in Modipuram and Pallavpuram.",
    idVerificationStatus: "VERIFIED",
    isAvailable: true,
    phone: "+91 98765 43214",
  },
  {
    id: "helper-driver-1",
    name: "Satender Kumar",
    image: "/images/driver_card_2.png",
    category: "Driver",
    taskTypes: ["Driver", "Delivery"],
    skills: ["Local Driving", "Outstation Trips", "Hospital Visits", "Airport Pickup"],
    rating: 4.8,
    jobs: 112,
    hourlyRate: 300,
    experience: "8+ years",
    location: "Modipuram, Meerut",
    bio: "Experienced driver for local errands, family visits, and outstation trips. Well familiar with Meerut & Delhi NCR routes.",
    idVerificationStatus: "VERIFIED",
    isAvailable: true,
    phone: "+91 98765 43215",
  },
  {
    id: "helper-driver-2",
    name: "Ravinder Gurjar",
    image: "/images/driver_card_1.png",
    category: "Driver",
    taskTypes: ["Driver"],
    skills: ["Personal Chauffeur", "Outstation", "Highway Driving"],
    rating: 4.8,
    jobs: 95,
    hourlyRate: 300,
    experience: "5+ years",
    location: "Meerut, UP",
    bio: "Professional driver with 5+ years of experience. Safe, reliable, and punctual for daily and outstation bookings.",
    idVerificationStatus: "VERIFIED",
    isAvailable: true,
    phone: "+91 98765 43216",
  },
  {
    id: "helper-cooking-1",
    name: "Meena Verma",
    category: "Cooking",
    taskTypes: ["Cooking", "Home Help"],
    skills: ["North Indian Meals", "Tiffin & Daily Cooking", "Hygienic Prep", "Diet Meals"],
    rating: 4.9,
    jobs: 134,
    hourlyRate: 220,
    experience: "7+ years",
    location: "Modipuram, Meerut",
    bio: "Home-style cook specializing in healthy, hygienic North Indian meals, breakfast prep, and family dinners.",
    idVerificationStatus: "VERIFIED",
    isAvailable: true,
    phone: "+91 98765 43217",
  },
  {
    id: "helper-plumbing-1",
    name: "Ramesh Prajapati",
    category: "Plumbing",
    taskTypes: ["Plumbing", "Home Help"],
    skills: ["Pipe Leak Repair", "Tap & Mixer Fitting", "Water Tank & Motor", "Drain Unclogging"],
    rating: 4.7,
    jobs: 89,
    hourlyRate: 250,
    experience: "6+ years",
    location: "Modipuram, Meerut",
    bio: "Skilled residential plumber for quick leak fixes, bathroom fittings, kitchen sink repair, and motor installation.",
    idVerificationStatus: "VERIFIED",
    isAvailable: true,
    phone: "+91 98765 43218",
  },
  {
    id: "helper-electrician-1",
    name: "Ankit Sharma",
    category: "Electrician",
    taskTypes: ["Electrician", "Home Help"],
    skills: ["Fan & Light Fitting", "Inverter & Wiring", "Switchboard Repair", "Appliance Check"],
    rating: 4.8,
    jobs: 105,
    hourlyRate: 240,
    experience: "5+ years",
    location: "Modipuram, Meerut",
    bio: "Certified electrician for safe home wiring, ceiling fan installation, inverter setup, and urgent fault repair.",
    idVerificationStatus: "VERIFIED",
    isAvailable: true,
    phone: "+91 98765 43219",
  },
  {
    id: "helper-shopping-1",
    name: "Suresh Yadav",
    category: "Shopping",
    taskTypes: ["Shopping", "Delivery", "Home Help"],
    skills: ["Grocery Runs", "Fresh Vegetable Picking", "Medicine Pickup", "Bill Tasks"],
    rating: 4.9,
    jobs: 210,
    hourlyRate: 160,
    experience: "5+ years",
    location: "Ghaziabad, UP",
    bio: "Trusted neighbourhood helper for daily shopping, market errands, and senior citizen assistance.",
    idVerificationStatus: "VERIFIED",
    isAvailable: true,
    phone: "+91 98765 43220",
  },
  {
    id: "helper-moving-1",
    name: "Manoj Tomar",
    category: "Moving & Packing",
    taskTypes: ["Moving & Packing", "Delivery", "Home Help"],
    skills: ["Box Packing", "Furniture Shifting", "Loading & Unloading", "Local Shifting"],
    rating: 4.7,
    jobs: 76,
    hourlyRate: 280,
    experience: "4+ years",
    location: "Noida, UP",
    bio: "Careful and strong moving assistant for household packing, furniture shifting, and local relocation.",
    idVerificationStatus: "VERIFIED",
    isAvailable: true,
    phone: "+91 98765 43221",
  },
];

export default function HelpersPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-6xl px-6 py-10 text-slate-100">
          <HelperDirectoryCardShimmer count={6} />
        </main>
      }
    >
      <HelpersPageContent />
    </Suspense>
  );
}

function HelpersPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  const initialLocationParam = (searchParams.get("location") || "").trim();
  const initialCategoryParam = (searchParams.get("category") || "").trim();
  const initialQueryParam = (searchParams.get("q") || "").trim();
  const taskIdParam = (searchParams.get("taskId") || "").trim();
  const taskTitleParam = (searchParams.get("taskTitle") || "").trim();

  const [query, setQuery] = useState(initialQueryParam);
  const [selectedLocation, setSelectedLocation] = useState(
    initialLocationParam || "ALL"
  );
  const [selectedTaskType, setSelectedTaskType] = useState(
    initialCategoryParam || "ALL"
  );
  const [sortBy, setSortBy] = useState("recommended");
  const [availableOnly, setAvailableOnly] = useState(false);

  const [apiHelpers, setApiHelpers] = useState([]);
  const [dbCategories, setDbCategories] = useState([]);
  const [profileLocation, setProfileLocation] = useState("");
  const [loading, setLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);
  const hasMountedRef = useRef(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }
    setIsFiltering(true);
    const t = setTimeout(() => setIsFiltering(false), 240);
    return () => clearTimeout(t);
  }, [query, selectedLocation, selectedTaskType, sortBy, availableOnly]);

  // Sync URL search params when navigating with new query params
  useEffect(() => {
    if (initialLocationParam) {
      setSelectedLocation(initialLocationParam);
    }
    if (initialCategoryParam) {
      setSelectedTaskType(initialCategoryParam);
    }
    if (initialQueryParam) {
      setQuery(initialQueryParam);
    }
  }, [initialLocationParam, initialCategoryParam, initialQueryParam]);

  // Load user's profile location so they can filter by their saved location
  useEffect(() => {
    const extractLoc = (u) => {
      if (!u) return "";
      const parts = [u.address, u.city]
        .map((s) => (s || "").trim())
        .filter(Boolean);
      if (parts.length === 2 && parts[0].toLowerCase().includes(parts[1].toLowerCase())) {
        return parts[0];
      }
      if (parts.length > 0) return parts.join(", ");
      return (u.location || "").trim();
    };

    try {
      const rawUser = localStorage.getItem("user");
      if (rawUser) {
        const loc = extractLoc(JSON.parse(rawUser));
        if (loc) setProfileLocation(loc);
      }
    } catch {
      // ignore
    }

    const token =
      session?.token ||
      (typeof window !== "undefined" ? localStorage.getItem("token") : null);
    if (token) {
      getUserProfile()
        .then((res) => {
          const u = res?.user || res?.data || res;
          const loc = extractLoc(u);
          if (loc) setProfileLocation(loc);
        })
        .catch(() => {});
    }
  }, [session]);

  // Fetch helpers and categories from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [helpersRes, categoriesRes] = await Promise.allSettled([
          getHelpers(),
          getTaskCategories(),
        ]);

        if (helpersRes.status === "fulfilled") {
          const list = Array.isArray(helpersRes.value)
            ? helpersRes.value
            : helpersRes.value?.data || helpersRes.value?.helpers || [];
          setApiHelpers(Array.isArray(list) ? list : []);
        }

        if (categoriesRes.status === "fulfilled") {
          const cats = Array.isArray(categoriesRes.value)
            ? categoriesRes.value
            : categoriesRes.value?.data || [];
          setDbCategories(
            cats.map((c) => (typeof c === "string" ? c : c?.name)).filter(Boolean)
          );
        }
      } catch (error) {
        console.error("Failed to fetch helpers", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    const handleCategoriesUpdated = () => {
      getTaskCategories()
        .then((res) => {
          const cats = Array.isArray(res) ? res : res?.data || [];
          setDbCategories(
            cats.map((c) => (typeof c === "string" ? c : c?.name)).filter(Boolean)
          );
        })
        .catch(() => {});
    };

    if (typeof window !== "undefined") {
      window.addEventListener("categoriesUpdated", handleCategoriesUpdated);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("categoriesUpdated", handleCategoriesUpdated);
      }
    };
  }, []);

  // Merge API helpers + rich preset helpers so every location & task type has strong coverage
  const allHelpers = useMemo(() => {
    const normalizedApi = apiHelpers.map((h, idx) => {
      const rawSkills = Array.isArray(h?.skills)
        ? h.skills
            .map((s) => (typeof s === "string" ? s : s?.skill?.name || s?.name))
            .filter(Boolean)
        : typeof h?.skills === "string"
          ? h.skills
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : [];

      const inferredCategory =
        h?.category ||
        rawSkills[0] ||
        DEFAULT_TASK_TYPES[idx % DEFAULT_TASK_TYPES.length];

      const loc =
        h?.location ||
        [h?.address, h?.city].filter(Boolean).join(", ") ||
        profileLocation ||
        "Modipuram, Meerut";

      return {
        id: h?.id || `api-helper-${idx}`,
        name: h?.name || "Verified Helper",
        image: h?.image || null,
        category: inferredCategory,
        taskTypes: Array.from(new Set([inferredCategory, ...rawSkills])),
        skills:
          rawSkills.length > 0
            ? rawSkills
            : [inferredCategory, "Verified Helper", "Fast Response"],
        rating:
          Number(h?.rating || h?.averageRating) > 0
            ? Number(Number(h?.rating || h?.averageRating).toFixed(1))
            : 4.8,
        jobs: Number(h?.jobs || h?.totalReviews) > 0 ? Number(h?.jobs || h?.totalReviews) : 45,
        hourlyRate: Number(h?.hourlyRate) > 0 ? Number(h.hourlyRate) : 200,
        experience: h?.experience || "4+ years",
        location: loc,
        bio:
          h?.bio ||
          `Experienced ${inferredCategory.toLowerCase()} helper available in ${loc}.`,
        idVerificationStatus: h?.idVerificationStatus || "VERIFIED",
        isAvailable: h?.isAvailable ?? true,
        phone: h?.phone || "+91 98765 43210",
      };
    });

    const seenNames = new Set(
      normalizedApi.map((h) => (h.name || "").toLowerCase().trim())
    );
    const merged = [...normalizedApi];

    for (const preset of PRESET_HELPERS) {
      if (!seenNames.has(preset.name.toLowerCase().trim())) {
        merged.push(preset);
      }
    }

    return merged;
  }, [apiHelpers, profileLocation]);

  // Build available Task Type options directly from DB categories
  const taskTypeOptions = useMemo(() => {
    const base = dbCategories.length > 0 ? dbCategories : DEFAULT_TASK_TYPES;
    const set = new Set(base);
    if (initialCategoryParam && initialCategoryParam !== "ALL") {
      set.add(initialCategoryParam);
    }
    return Array.from(set);
  }, [dbCategories, initialCategoryParam]);

  // Build available Location options
  const locationOptions = useMemo(() => {
    const set = new Set(DEFAULT_LOCATIONS);
    if (profileLocation) set.add(profileLocation);
    if (initialLocationParam && initialLocationParam !== "ALL") {
      set.add(initialLocationParam);
    }
    for (const h of allHelpers) {
      if (h.location) set.add(h.location);
    }
    return Array.from(set);
  }, [profileLocation, initialLocationParam, allHelpers]);

  // Helper function to check if helper matches selected location
  const matchesLocation = (helperLocation, filterLoc) => {
    if (!filterLoc || filterLoc === "ALL") return true;
    const hLoc = (helperLocation || "").toLowerCase();
    const fLoc = filterLoc.toLowerCase();
    if (hLoc.includes(fLoc) || fLoc.includes(hLoc)) return true;

    // Also match primary area/city tokens (e.g., "Modipuram, Meerut" matches "Modipuram" or "Meerut")
    const fParts = fLoc
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 2 && s !== "up");
    return fParts.some((part) => hLoc.includes(part));
  };

  // Helper function to check if helper matches selected task type / category
  const matchesTaskType = (helper, filterType) => {
    if (!filterType || filterType === "ALL") return true;
    const fType = filterType.toLowerCase();
    const hCat = (helper.category || "").toLowerCase();
    const catMatch = hCat && (hCat.includes(fType) || fType.includes(hCat));
    const taskTypesMatch = (helper.taskTypes || []).some((t) => {
      const tLow = t.toLowerCase();
      return tLow.includes(fType) || fType.includes(tLow);
    });
    const skillsMatch = (helper.skills || []).some((s) => {
      const sLow = s.toLowerCase();
      return sLow.includes(fType) || fType.includes(sLow);
    });
    if (catMatch || taskTypesMatch || skillsMatch) return true;

    // Match root keywords (e.g., "Electrical" <-> "Electrician", "Furniture Assembly" <-> "Moving", "Personal Care" <-> "Home Help")
    const textPool = [
      hCat,
      ...(helper.taskTypes || []).map((t) => t.toLowerCase()),
      ...(helper.skills || []).map((s) => s.toLowerCase()),
      (helper.bio || "").toLowerCase(),
    ].join(" ");
    if (fType.includes("electr") && textPool.includes("electr")) return true;
    if (fType.includes("clean") && textPool.includes("clean")) return true;
    if (fType.includes("deliver") && textPool.includes("deliver")) return true;
    if (fType.includes("driver") && (textPool.includes("driver") || textPool.includes("driv"))) return true;
    if (fType.includes("plumb") && textPool.includes("plumb")) return true;
    if (fType.includes("cook") && textPool.includes("cook")) return true;
    if (fType.includes("furniture") && (textPool.includes("furniture") || textPool.includes("moving") || textPool.includes("repair"))) return true;
    if (fType.includes("care") && (textPool.includes("care") || textPool.includes("help") || textPool.includes("elder"))) return true;
    return false;
  };

  // Filtered and sorted helpers
  const filteredHelpers = useMemo(() => {
    const qLower = query.trim().toLowerCase();

    const list = allHelpers.filter((h) => {
      // 1. Search query match
      const queryMatch =
        !qLower ||
        h.name?.toLowerCase().includes(qLower) ||
        h.category?.toLowerCase().includes(qLower) ||
        h.location?.toLowerCase().includes(qLower) ||
        h.bio?.toLowerCase().includes(qLower) ||
        (h.skills || []).some((s) => s.toLowerCase().includes(qLower));

      if (!queryMatch) return false;

      // 2. Location filter match
      if (!matchesLocation(h.location, selectedLocation)) return false;

      // 3. Type of task filter match
      if (!matchesTaskType(h, selectedTaskType)) return false;

      // 4. Availability filter
      if (availableOnly && !h.isAvailable) return false;

      return true;
    });

    // Sort results: prioritize exact location match first when a location is selected
    return [...list].sort((a, b) => {
      if (selectedLocation && selectedLocation !== "ALL") {
        const aExact =
          (a.location || "").toLowerCase() === selectedLocation.toLowerCase() ? 1 : 0;
        const bExact =
          (b.location || "").toLowerCase() === selectedLocation.toLowerCase() ? 1 : 0;
        if (aExact !== bExact) return bExact - aExact;
      }

      if (selectedTaskType && selectedTaskType !== "ALL") {
        const aCatExact =
          (a.category || "").toLowerCase() === selectedTaskType.toLowerCase() ? 1 : 0;
        const bCatExact =
          (b.category || "").toLowerCase() === selectedTaskType.toLowerCase() ? 1 : 0;
        if (aCatExact !== bCatExact) return bCatExact - aCatExact;
      }

      if (sortBy === "rating") return (b.rating || 0) - (a.rating || 0);
      if (sortBy === "jobs") return (b.jobs || 0) - (a.jobs || 0);
      if (sortBy === "price_low") return (a.hourlyRate || 0) - (b.hourlyRate || 0);
      return (b.rating || 0) - (a.rating || 0);
    });
  }, [allHelpers, query, selectedLocation, selectedTaskType, availableOnly, sortBy]);

  const hasActiveFilters =
    Boolean(query.trim()) ||
    selectedLocation !== "ALL" ||
    selectedTaskType !== "ALL" ||
    availableOnly;

  const handleResetFilters = () => {
    setQuery("");
    setSelectedLocation("ALL");
    setSelectedTaskType("ALL");
    setAvailableOnly(false);
    setSortBy("recommended");
  };

  // Invite & Assign helper directly to the task from `/dashboard/my-tasks`
  const handleInviteForTask = (helper) => {
    if (taskIdParam && typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(TASK_OVERRIDES_STORAGE_KEY);
        const map = raw ? JSON.parse(raw) : {};
        map[taskIdParam] = {
          ...(map[taskIdParam] || {}),
          status: "REQUESTED",
          confirmedTimeLabel: "Pending acceptance",
          assignedTo: {
            id: helper.id,
            name: helper.name,
            image: helper.image || "/images/priya_sharma.png",
            phone: helper.phone || "+91 98765 43210",
            city: helper.location,
            location: helper.location,
            averageRating: helper.rating,
            totalReviews: helper.jobs,
            isAvailable: true,
            bio: helper.bio,
            skills: helper.skills,
          },
        };
        localStorage.setItem(TASK_OVERRIDES_STORAGE_KEY, JSON.stringify(map));
      } catch {
        // Ignore storage error
      }

      setToast(
        `Invited ${helper.name} for "${taskTitleParam || "your task"}"! Redirecting to My Tasks...`
      );
      setTimeout(() => {
        router.push("/dashboard/my-tasks");
      }, 900);
      return;
    }

    // If not coming from a specific task, go to create-task with this helper preselected
    const params = new URLSearchParams();
    params.set("helper", String(helper.id));
    if (selectedTaskType !== "ALL") {
      params.set("category", selectedTaskType);
    } else if (helper.category) {
      params.set("category", helper.category);
    }
    router.push(`/dashboard/create-task?${params.toString()}`);
  };

  return (
    <main className="min-h-screen bg-[#060913] text-slate-100">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2.5 rounded-2xl border border-emerald-500/30 bg-slate-900/95 px-5 py-3 text-sm font-medium text-white shadow-2xl backdrop-blur-md">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-slate-950">
            ✓
          </span>
          <span>{toast}</span>
        </div>
      )}

      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
        {/* Contextual Banner when coming from a specific task on My Tasks */}
        {taskIdParam && (
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4">
            <div className="flex items-start sm:items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
                  Finding Helper for Your Task
                </p>
                <p className="text-sm sm:text-base font-bold text-white mt-0.5">
                  {taskTitleParam || "Selected Task"}
                  {initialCategoryParam && (
                    <span className="ml-2 rounded-full bg-slate-900/80 border border-slate-700 px-2.5 py-0.5 text-xs font-medium text-sky-300">
                      {initialCategoryParam}
                    </span>
                  )}
                  {initialLocationParam && (
                    <span className="ml-1.5 rounded-full bg-slate-900/80 border border-slate-700 px-2.5 py-0.5 text-xs font-medium text-emerald-300">
                      📍 {initialLocationParam}
                    </span>
                  )}
                </p>
              </div>
            </div>

            <Link
              href="/dashboard/my-tasks"
              className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-xl border border-slate-700 bg-slate-900/90 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to My Tasks</span>
            </Link>
          </div>
        )}

        {/* Header Card */}
        <div className="mb-6 rounded-3xl border border-slate-800/90 bg-[#0b1120]/95 p-6 sm:p-7 shadow-2xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Find & Invite Helpers
              </h1>
              <p className="mt-1 text-sm text-slate-400">
                Filter verified local helpers by location and type of task before hiring
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <Link
                href="/dashboard/my-tasks"
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700/90 bg-slate-900 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition"
              >
                My Tasks
              </Link>
              <Link
                href="/dashboard/create-task"
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-600/25 hover:bg-blue-500 transition"
              >
                + Post New Task
              </Link>
            </div>
          </div>

          {/* Search + Location Filter + Type of Task Filter Row */}
          <div className="mt-6 grid grid-cols-1 gap-3.5 md:grid-cols-12">
            {/* 1. Search by Name / Skill */}
            <div className="relative md:col-span-5">
              <label className="mb-1.5 block text-xs font-semibold text-slate-300">
                Search Helper or Skill
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by name, skill, or service (e.g. medicine, cleaning)..."
                  className="w-full rounded-xl border border-slate-700/90 bg-slate-900/90 py-2.5 pl-10 pr-9 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* 2. Location Filter */}
            <div className="md:col-span-4">
              <div className="mb-1.5 flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                  <MapPin className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Location Filter</span>
                </label>
                {profileLocation && selectedLocation !== profileLocation && (
                  <button
                    type="button"
                    onClick={() => setSelectedLocation(profileLocation)}
                    className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 cursor-pointer"
                  >
                    Use Profile ({profileLocation})
                  </button>
                )}
              </div>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full rounded-xl border border-slate-700/90 bg-slate-900/90 px-3.5 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Locations</option>
                {locationOptions.map((loc) => (
                  <option key={loc} value={loc}>
                    {profileLocation && loc === profileLocation
                      ? `📍 ${loc} (Your Profile)`
                      : loc}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Type of Task / Category Filter */}
            <div className="md:col-span-3">
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                <Tag className="h-3.5 w-3.5 text-sky-400" />
                <span>Type of Task</span>
              </label>
              <select
                value={selectedTaskType}
                onChange={(e) => setSelectedTaskType(e.target.value)}
                className="w-full rounded-xl border border-slate-700/90 bg-slate-900/90 px-3.5 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Task Types</option>
                {taskTypeOptions.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Task Type Filter Pills */}
          <div className="mt-5 pt-4 border-t border-slate-800/80">
            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1 text-xs font-semibold text-slate-400 flex items-center gap-1">
                <SlidersHorizontal className="h-3.5 w-3.5 text-blue-400" />
                Task Type:
              </span>
              <button
                type="button"
                onClick={() => setSelectedTaskType("ALL")}
                className={`rounded-full px-3.5 py-1 text-xs font-semibold transition cursor-pointer ${
                  selectedTaskType === "ALL"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/25"
                    : "border border-slate-800 bg-slate-900/80 text-slate-300 hover:border-slate-700 hover:text-white"
                }`}
              >
                All Types
              </button>
              {taskTypeOptions.map((cat) => {
                const active =
                  selectedTaskType.toLowerCase() === cat.toLowerCase();
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() =>
                      setSelectedTaskType(active ? "ALL" : cat)
                    }
                    className={`rounded-full px-3.5 py-1 text-xs font-semibold transition cursor-pointer ${
                      active
                        ? "bg-blue-600 text-white shadow-md shadow-blue-600/25"
                        : "border border-slate-800 bg-slate-900/80 text-slate-300 hover:border-slate-700 hover:text-white"
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* Quick Location Pills */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="mr-1 text-xs font-semibold text-slate-400 flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-emerald-400" />
                Locations:
              </span>
              <button
                type="button"
                onClick={() => setSelectedLocation("ALL")}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition cursor-pointer ${
                  selectedLocation === "ALL"
                    ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                    : "border border-slate-800 bg-slate-900/80 text-slate-300 hover:border-slate-700 hover:text-white"
                }`}
              >
                All Locations
              </button>
              {[
                "Modipuram, Meerut",
                "Shastri Nagar, Meerut",
                "Meerut, UP",
                "Noida, UP",
                "Ghaziabad, UP",
                "Delhi NCR",
              ].map((loc) => {
                const active =
                  selectedLocation.toLowerCase() === loc.toLowerCase();
                return (
                  <button
                    key={loc}
                    type="button"
                    onClick={() =>
                      setSelectedLocation(active ? "ALL" : loc)
                    }
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition cursor-pointer ${
                      active
                        ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                        : "border border-slate-800 bg-slate-900/80 text-slate-300 hover:border-slate-700 hover:text-white"
                    }`}
                  >
                    📍 {loc}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Active Filters Summary & Sort Row */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-bold text-white">
              Showing {filteredHelpers.length}{" "}
              {filteredHelpers.length === 1 ? "Helper" : "Helpers"}
            </p>

            {selectedLocation !== "ALL" && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/35 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                <MapPin className="h-3 w-3" />
                {selectedLocation}
                <button
                  type="button"
                  onClick={() => setSelectedLocation("ALL")}
                  className="ml-0.5 hover:text-white cursor-pointer"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {selectedTaskType !== "ALL" && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/35 bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-300">
                <Tag className="h-3 w-3" />
                {selectedTaskType}
                <button
                  type="button"
                  onClick={() => setSelectedTaskType("ALL")}
                  className="ml-0.5 hover:text-white cursor-pointer"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs font-semibold text-blue-400 hover:text-blue-300 underline underline-offset-2 ml-1 cursor-pointer"
              >
                Clear All Filters
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={availableOnly}
                onChange={(e) => setAvailableOnly(e.target.checked)}
                className="h-3.5 w-3.5 rounded accent-emerald-500"
              />
              <span>Available Now</span>
            </label>

            <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-[#0b1120] px-3 py-1.5 text-xs">
              <span className="text-slate-400">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent font-semibold text-white focus:outline-none cursor-pointer"
              >
                <option value="recommended" className="bg-slate-900">
                  Recommended
                </option>
                <option value="rating" className="bg-slate-900">
                  Highest Rated
                </option>
                <option value="jobs" className="bg-slate-900">
                  Most Jobs Done
                </option>
                <option value="price_low" className="bg-slate-900">
                  Lowest Rate
                </option>
              </select>
            </div>
          </div>
        </div>

        {/* Helpers Grid */}
        {loading || isFiltering ? (
          <HelperDirectoryCardShimmer count={6} />
        ) : filteredHelpers.length === 0 ? (
          <div className="rounded-3xl border border-slate-800/80 bg-[#0b1120]/90 p-12 text-center shadow-2xl">
            <p className="text-base font-bold text-white">
              No helpers matched your exact filters
            </p>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
              Try switching Location to “All Locations” or Type of Task to “All Task Types” to see more verified helpers.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              {selectedLocation !== "ALL" && (
                <button
                  type="button"
                  onClick={() => setSelectedLocation("ALL")}
                  className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 cursor-pointer"
                >
                  Show All Locations
                </button>
              )}
              {selectedTaskType !== "ALL" && (
                <button
                  type="button"
                  onClick={() => setSelectedTaskType("ALL")}
                  className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 cursor-pointer"
                >
                  Show All Task Types
                </button>
              )}
              <button
                type="button"
                onClick={handleResetFilters}
                className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white hover:bg-blue-500 cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredHelpers.map((helper) => (
              <div
                key={helper.id}
                className="flex flex-col justify-between rounded-3xl border border-slate-800/90 bg-[#0b1120]/95 p-5 sm:p-6 shadow-xl transition hover:border-slate-700"
              >
                <div>
                  {/* Top Row: Avatar, Name, Verified, Category Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5">
                      {helper.image ? (
                        <img
                          src={helper.image}
                          alt={helper.name}
                          className="h-14 w-14 rounded-2xl object-cover object-top border border-slate-700"
                        />
                      ) : (
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-blue-500/30 bg-blue-500/15 text-lg font-bold text-blue-300">
                          {helper.name?.charAt(0) || "H"}
                        </div>
                      )}

                      <div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <h3 className="text-base font-bold text-white">
                            {helper.name}
                          </h3>
                          {helper.idVerificationStatus === "VERIFIED" && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                              <ShieldCheck className="h-3 w-3" />
                              Verified
                            </span>
                          )}
                        </div>

                        <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-300">
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                          <span>{helper.location}</span>
                        </div>
                      </div>
                    </div>

                    <span className="shrink-0 rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-1 text-[11px] font-semibold text-sky-300">
                      {helper.category}
                    </span>
                  </div>

                  {/* Rating, Jobs & Rate Row */}
                  <div className="mt-4 flex items-center justify-between rounded-2xl border border-slate-800/90 bg-slate-900/60 px-3.5 py-2.5 text-xs">
                    <div className="flex items-center gap-1.5">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      <span className="font-bold text-white">
                        {helper.rating}
                      </span>
                      <span className="text-slate-400">
                        ({helper.jobs} jobs)
                      </span>
                    </div>

                    <span className="text-slate-700">|</span>

                    <div className="flex items-center gap-1 text-slate-300">
                      <Briefcase className="h-3.5 w-3.5 text-blue-400" />
                      <span>{helper.experience || "4+ yrs"}</span>
                    </div>

                    <span className="text-slate-700">|</span>

                    <div className="font-bold text-emerald-400">
                      ₹{helper.hourlyRate}/hr
                    </div>
                  </div>

                  {/* Bio */}
                  <p className="mt-3.5 text-xs leading-relaxed text-slate-300 line-clamp-2">
                    {helper.bio}
                  </p>

                  {/* Skills */}
                  <div className="mt-3.5 flex flex-wrap gap-1.5">
                    {(helper.skills || []).slice(0, 4).map((skill, idx) => (
                      <span
                        key={idx}
                        className="rounded-full border border-slate-800 bg-[#131c31] px-2.5 py-1 text-[11px] font-medium text-slate-200"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-5 pt-4 border-t border-slate-800/80 grid grid-cols-2 gap-2.5">
                  <Link
                    href={`/dashboard/helpers/${helper.id}`}
                    className="flex items-center justify-center rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-800 hover:text-white"
                  >
                    View Profile
                  </Link>

                  <button
                    type="button"
                    onClick={() => handleInviteForTask(helper)}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-2.5 text-xs font-bold text-slate-950 shadow-md shadow-emerald-500/20 transition hover:bg-emerald-400 cursor-pointer"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    <span>
                      {taskIdParam ? "Invite to Task" : "Invite Helper"}
                    </span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
