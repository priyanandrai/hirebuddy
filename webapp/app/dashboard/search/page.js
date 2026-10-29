"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import HeaderAfterlogin from "../../components/layout/HeaderAfterlogin";
import Footer from "../../components/layout/Footer";
import { searchTasks, searchHelpers } from "../../components/services/search.service";
import { getAuthToken } from "../../components/lib/getSessionToken";
import { hireBuddy } from "../../components/services/hire.service";

const TASK_TYPE_OPTIONS = [
  "Delivery",
  "Driver",
  "Cleaning",
  "Cooking",
  "Plumbing",
  "Electrician",
  "Shopping",
  "Errands",
  "Home Help",
];

const LOCATION_OPTIONS = [
  "Modipuram, Meerut",
  "Shastri Nagar, Meerut",
  "Meerut, UP",
  "Noida, UP",
  "Ghaziabad, UP",
  "Delhi NCR",
];

const DRIVER_PROFILES = [
  {
    name: "Ravinder Gurjar",
    bannerImage: "/images/driver_card_1.png",
    hasBakedOverlays: true,
    rating: 4.8,
    reviewsCount: 45,
    location: "Meerut, UP",
    bio: "Professional driver with 5+ years of experience. Safe, reliable and punctual.",
    tags: ["Local Driving", "Airport Pickup", "Outstation"],
    experienceLabel: "5+ years",
    expYears: 5,
    rate: 300,
    rateUnit: "day",
    category: "Driver",
    availableToday: true,
    availableThisWeek: true,
  },
  {
    name: "Satender Kumar",
    bannerImage: "/images/driver_card_2.png",
    hasBakedOverlays: true,
    rating: 4.7,
    reviewsCount: 32,
    location: "Modipuram, Meerut",
    bio: "Experienced driver for local and outstation trips. Well familiar with Delhi NCR routes.",
    tags: ["Local Driving", "Outstation", "Corporate"],
    experienceLabel: "8+ years",
    expYears: 8,
    rate: 300,
    rateUnit: "day",
    category: "Driver",
    availableToday: true,
    availableThisWeek: true,
  },
  {
    name: "Mukesh Pal",
    bannerImage: "/images/driver_card_3.png",
    hasBakedOverlays: true,
    rating: 4.6,
    reviewsCount: 28,
    location: "Noida, UP",
    bio: "Trusted and courteous driver with experience in personal and corporate driving. Clean driving record.",
    tags: ["Local Driving", "Airport Pickup", "Chauffeur"],
    experienceLabel: "6+ years",
    expYears: 6,
    rate: 320,
    rateUnit: "day",
    category: "Driver",
    availableToday: true,
    availableThisWeek: true,
  },
  {
    name: "Harish Rawat",
    bannerImage: "/images/driver_card_4.png",
    hasBakedOverlays: true,
    rating: 4.5,
    reviewsCount: 20,
    location: "Meerut, UP",
    bio: "Polite and experienced driver for family and corporate needs.",
    tags: ["Local Driving", "Personal Driver", "Outstation"],
    experienceLabel: "7+ years",
    expYears: 7,
    rate: 300,
    rateUnit: "day",
    category: "Driver",
    availableToday: true,
    availableThisWeek: true,
  },
  {
    name: "Amit Sharma",
    bannerImage: "/images/driver_card_5.png",
    hasBakedOverlays: true,
    rating: 4.4,
    reviewsCount: 18,
    location: "Delhi NCR",
    bio: "Experienced driver for airport transfers, outstation and local trips.",
    tags: ["Airport Pickup", "Outstation", "Local Driving"],
    experienceLabel: "5+ years",
    expYears: 5,
    rate: 350,
    rateUnit: "day",
    category: "Driver",
    availableToday: true,
    availableThisWeek: true,
  },
  {
    name: "Vikram Singh",
    bannerImage: "/images/driver_card_6.png",
    hasBakedOverlays: true,
    rating: 4.3,
    reviewsCount: 12,
    location: "Ghaziabad, UP",
    bio: "Safe and professional driver. Good knowledge of Delhi NCR and nearby cities.",
    tags: ["Local Driving", "Corporate", "Personal Driver"],
    experienceLabel: "4+ years",
    expYears: 4,
    rate: 280,
    rateUnit: "day",
    category: "Driver",
    availableToday: true,
    availableThisWeek: true,
  },
  {
    name: "Deepak Yadav",
    bannerImage: "/images/driver_card_1.png",
    hasBakedOverlays: true,
    rating: 4.6,
    reviewsCount: 24,
    location: "Meerut, UP",
    bio: "Reliable chauffeur for daily commute, family trips and outstation travel.",
    tags: ["Local Driving", "Outstation", "Personal Driver"],
    experienceLabel: "6+ years",
    expYears: 6,
    rate: 300,
    rateUnit: "day",
    category: "Driver",
    availableToday: true,
    availableThisWeek: true,
  },
  {
    name: "Rajesh Verma",
    bannerImage: "/images/driver_card_2.png",
    hasBakedOverlays: true,
    rating: 4.5,
    reviewsCount: 19,
    location: "Modipuram, Meerut",
    bio: "Punctual and skilled driver for local errands, corporate travel and airport drops.",
    tags: ["Local Driving", "Airport Pickup", "Corporate"],
    experienceLabel: "5+ years",
    expYears: 5,
    rate: 310,
    rateUnit: "day",
    category: "Driver",
    availableToday: true,
    availableThisWeek: true,
  },
];

const EXTRA_HELPER_PROFILES = [
  {
    id: "helper-delivery-1",
    name: "Rohit Kashyap",
    bannerImage: "/images/driver_card_3.png",
    hasBakedOverlays: true,
    rating: 4.9,
    reviewsCount: 54,
    location: "Modipuram, Meerut",
    bio: "Fast and reliable local runner for medicine delivery, grocery pickup, and urgent parcel drops in Meerut.",
    tags: ["Delivery", "Medicine Pickup", "Errands"],
    experienceLabel: "4+ years",
    expYears: 4,
    rate: 150,
    rateUnit: "task",
    category: "Delivery",
    availableToday: true,
    availableThisWeek: true,
  },
  {
    id: "helper-delivery-2",
    name: "Ankit Chauhan",
    bannerImage: "/images/driver_card_4.png",
    hasBakedOverlays: true,
    rating: 4.7,
    reviewsCount: 38,
    location: "Modipuram, Meerut",
    bio: "Dedicated delivery partner for pharmacy orders, documents, and same-day local packages across Meerut.",
    tags: ["Delivery", "Same-Day Parcel", "Shopping"],
    experienceLabel: "3+ years",
    expYears: 3,
    rate: 120,
    rateUnit: "task",
    category: "Delivery",
    availableToday: true,
    availableThisWeek: true,
  },
  {
    id: "helper-delivery-3",
    name: "Sandeep Tomar",
    bannerImage: "/images/driver_card_5.png",
    hasBakedOverlays: true,
    rating: 4.6,
    reviewsCount: 29,
    location: "Shastri Nagar, Meerut",
    bio: "Quick two-wheeler delivery helper for medicines, groceries, and household essentials.",
    tags: ["Delivery", "Grocery Run", "Errands"],
    experienceLabel: "5+ years",
    expYears: 5,
    rate: 140,
    rateUnit: "task",
    category: "Delivery",
    availableToday: true,
    availableThisWeek: true,
  },
  {
    id: "helper-cleaning-1",
    name: "Sunita Devi",
    bannerImage: "/images/driver_card_6.png",
    hasBakedOverlays: true,
    rating: 4.8,
    reviewsCount: 61,
    location: "Modipuram, Meerut",
    bio: "Thorough home and kitchen cleaning specialist with eco-friendly supplies and punctual service.",
    tags: ["Cleaning", "Deep Cleaning", "Home Help"],
    experienceLabel: "6+ years",
    expYears: 6,
    rate: 250,
    rateUnit: "day",
    category: "Cleaning",
    availableToday: true,
    availableThisWeek: true,
  },
  {
    id: "helper-cooking-1",
    name: "Meena Sharma",
    bannerImage: "/images/driver_card_1.png",
    hasBakedOverlays: true,
    rating: 4.9,
    reviewsCount: 47,
    location: "Modipuram, Meerut",
    bio: "Hygienic home cook specializing in North Indian meals, tiffin preparation, and family dinners.",
    tags: ["Cooking", "Home Meals", "Home Help"],
    experienceLabel: "7+ years",
    expYears: 7,
    rate: 300,
    rateUnit: "day",
    category: "Cooking",
    availableToday: true,
    availableThisWeek: true,
  },
  {
    id: "helper-plumbing-1",
    name: "Ramesh Prajapati",
    bannerImage: "/images/driver_card_2.png",
    hasBakedOverlays: true,
    rating: 4.7,
    reviewsCount: 33,
    location: "Meerut, UP",
    bio: "Skilled plumber for tap repairs, pipe leakage, water tank fitting, and bathroom fixtures.",
    tags: ["Plumbing", "Pipe Repair", "Home Help"],
    experienceLabel: "8+ years",
    expYears: 8,
    rate: 350,
    rateUnit: "visit",
    category: "Plumbing",
    availableToday: true,
    availableThisWeek: true,
  },
  {
    id: "helper-electrician-1",
    name: "Manoj Saini",
    bannerImage: "/images/driver_card_3.png",
    hasBakedOverlays: true,
    rating: 4.8,
    reviewsCount: 41,
    location: "Modipuram, Meerut",
    bio: "Certified electrician for fan installation, switchboard repair, inverter setup, and wiring faults.",
    tags: ["Electrician", "Wiring & Fans", "Appliance Repair"],
    experienceLabel: "6+ years",
    expYears: 6,
    rate: 300,
    rateUnit: "visit",
    category: "Electrician",
    availableToday: true,
    availableThisWeek: true,
  },
  {
    id: "helper-shopping-1",
    name: "Gaurav Tyagi",
    bannerImage: "/images/driver_card_4.png",
    hasBakedOverlays: true,
    rating: 4.6,
    reviewsCount: 22,
    location: "Noida, UP",
    bio: "Personal shopper and errand runner for groceries, market pickups, and daily household supplies.",
    tags: ["Shopping", "Errands", "Delivery"],
    experienceLabel: "3+ years",
    expYears: 3,
    rate: 180,
    rateUnit: "task",
    category: "Shopping",
    availableToday: true,
    availableThisWeek: true,
  },
];

const ALL_HELPER_PROFILES = [...DRIVER_PROFILES, ...EXTRA_HELPER_PROFILES];

function inferCategoryFromQuery(query) {
  const qLower = (query || "").trim().toLowerCase();
  if (!qLower) return "";
  if (qLower.includes("driver") || qLower.includes("driving") || qLower.includes("chauffeur")) return "Driver";
  if (qLower.includes("deliver") || qLower.includes("medicine") || qLower.includes("parcel") || qLower.includes("courier")) return "Delivery";
  if (qLower.includes("clean")) return "Cleaning";
  if (qLower.includes("cook") || qLower.includes("chef") || qLower.includes("food")) return "Cooking";
  if (qLower.includes("plumb")) return "Plumbing";
  if (qLower.includes("electric")) return "Electrician";
  if (qLower.includes("shop") || qLower.includes("grocery")) return "Shopping";
  if (qLower.includes("errand")) return "Errands";
  if (qLower.includes("home")) return "Home Help";
  return "";
}

function buildMergedHelpers(apiHelpers, query, hasActiveFilters) {
  const trimmed = (query || "").trim();
  if (!trimmed && !hasActiveFilters) {
    return [];
  }

  const isDriverQuery = trimmed.toLowerCase() === "driver";

  if (isDriverQuery) {
    const usedApiIds = new Set();
    const byName = new Map();

    for (const h of apiHelpers) {
      if (h?.name) {
        byName.set(h.name.trim().toLowerCase(), h);
      }
    }

    const remainingApiHelpers = [...apiHelpers];

    return DRIVER_PROFILES.map((preset, idx) => {
      let matched = byName.get(preset.name.toLowerCase());
      if (matched && !usedApiIds.has(matched.id)) {
        usedApiIds.add(matched.id);
      } else {
        matched = remainingApiHelpers.find((h) => h?.id && !usedApiIds.has(h.id));
        if (matched) usedApiIds.add(matched.id);
      }

      return {
        ...preset,
        id: matched?.id || `driver-helper-${idx + 1}`,
      };
    });
  }

  const inferredCategory = inferCategoryFromQuery(trimmed);

  const mappedApi = apiHelpers.map((h, idx) => {
    const fallbackPreset = ALL_HELPER_PROFILES[idx % ALL_HELPER_PROFILES.length];
    const skills = Array.isArray(h.skills)
      ? h.skills
          .map((s) => (typeof s === "string" ? s : s?.skill?.name || s?.name))
          .filter(Boolean)
      : [];

    return {
      id: h.id || `helper-${idx + 1}`,
      name: h.name || fallbackPreset.name,
      bannerImage: h.image || fallbackPreset.bannerImage,
      hasBakedOverlays: !h.image,
      rating: typeof h.rating === "number" && h.rating > 0 ? Number(h.rating.toFixed(1)) : fallbackPreset.rating,
      reviewsCount: h.reviewsCount || fallbackPreset.reviewsCount,
      location: h.location || fallbackPreset.location,
      bio:
        h.bio ||
        fallbackPreset.bio ||
        `Experienced ${trimmed || fallbackPreset.category} professional with ${fallbackPreset.experienceLabel} of trusted local service.`,
      tags: skills.length > 0 ? skills.slice(0, 3) : fallbackPreset.tags,
      experienceLabel: fallbackPreset.experienceLabel,
      expYears: fallbackPreset.expYears,
      rate: h.hourlyRate ? Math.round(h.hourlyRate) : fallbackPreset.rate,
      rateUnit: fallbackPreset.rateUnit || "day",
      category: h.category || inferredCategory || fallbackPreset.category,
      availableToday: true,
      availableThisWeek: true,
    };
  });

  const existingNames = new Set(mappedApi.map((h) => h.name.toLowerCase()));
  const presetList = ALL_HELPER_PROFILES.map((p, idx) => ({
    ...p,
    id: p.id || `preset-helper-${idx + 1}`,
  })).filter((p) => !existingNames.has(p.name.toLowerCase()));

  const combined = [...mappedApi, ...presetList];

  if (!trimmed) {
    return combined;
  }

  const qLower = trimmed.toLowerCase();
  if (qLower === "helper" || qLower === "helpers" || qLower === "all") {
    return combined;
  }

  const queryMatched = combined.filter((h) => {
    if (inferredCategory && h.category.toLowerCase() === inferredCategory.toLowerCase()) {
      return true;
    }
    return (
      h.name.toLowerCase().includes(qLower) ||
      h.category.toLowerCase().includes(qLower) ||
      h.location.toLowerCase().includes(qLower) ||
      h.bio.toLowerCase().includes(qLower) ||
      h.tags.some((t) => t.toLowerCase().includes(qLower))
    );
  });

  return queryMatched.length > 0 ? queryMatched : combined;
}

function SearchContent() {
  const params = useSearchParams();
  const router = useRouter();
  const urlQuery = (params?.get("q") || "").trim();
  const urlCategory = (params?.get("category") || "").trim();
  const urlLocation = (params?.get("location") || "").trim();

  const initialCategory = urlCategory || inferCategoryFromQuery(urlQuery);

  const [prevUrlQuery, setPrevUrlQuery] = useState(urlQuery);
  const [searchInput, setSearchInput] = useState(urlQuery);
  const [isCleared, setIsCleared] = useState(!urlQuery && !urlCategory && !urlLocation);

  // Draft Filter States (synced immediately and via "Apply Filters")
  const [selectedCategories, setSelectedCategories] = useState(
    initialCategory ? [initialCategory] : []
  );
  const [locationInput, setLocationInput] = useState(urlLocation || "");
  const [selectedAvailability, setSelectedAvailability] = useState([]);
  const [selectedRatings, setSelectedRatings] = useState([]);
  const [selectedExperience, setSelectedExperience] = useState([]);

  // Applied Filter States
  const [appliedFilters, setAppliedFilters] = useState({
    categories: initialCategory ? [initialCategory] : [],
    location: urlLocation || "",
    availability: [],
    ratings: [],
    experience: [],
  });

  if (urlQuery !== prevUrlQuery) {
    const nextInferredCat = urlCategory || inferCategoryFromQuery(urlQuery);
    const nextCats = nextInferredCat ? [nextInferredCat] : [];
    setPrevUrlQuery(urlQuery);
    setSearchInput(urlQuery);
    setIsCleared(!urlQuery && !urlCategory && !urlLocation);
    setSelectedCategories(nextCats);
    setAppliedFilters((prev) => ({
      ...prev,
      categories: nextCats,
    }));
  }

  const q = isCleared ? "" : urlQuery;
  const hasActiveFilters =
    !isCleared &&
    (appliedFilters.categories.length > 0 || Boolean(appliedFilters.location.trim()));

  const [apiTasks, setApiTasks] = useState([]);
  const [apiHelpers, setApiHelpers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Active Result Type Pill ("helpers" | "tasks" | "all")
  const [activeTab, setActiveTab] = useState("helpers");
  const [sortBy, setSortBy] = useState("relevance");
  const [favorites, setFavorites] = useState({});

  // Sidebar Filter Accordion States
  const [openSections, setOpenSections] = useState({
    category: true,
    location: true,
    availability: true,
    rating: true,
    experience: true,
  });

  // Hire Modal State
  const [hireTarget, setHireTarget] = useState(null);
  const [hireBudget, setHireBudget] = useState(300);
  const [hireNotes, setHireNotes] = useState("");
  const [hireLoading, setHireLoading] = useState(false);
  const [hireSuccess, setHireSuccess] = useState(false);

  useEffect(() => {
    if (!q) {
      return;
    }

    let mounted = true;
    setLoading(true);

    Promise.all([searchTasks(q, 20), searchHelpers(q, 20)])
      .then(([tRes, hRes]) => {
        if (!mounted) return;
        setApiTasks(tRes?.tasks || []);
        setApiHelpers(hRes?.helpers || []);
      })
      .catch((e) => console.error("Search page error", e))
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [q]);

  const handleClearSearchBar = () => {
    setSearchInput("");
    setIsCleared(true);
    setApiTasks([]);
    setApiHelpers([]);
    setSelectedCategories([]);
    setLocationInput("");
    setAppliedFilters((prev) => ({
      ...prev,
      categories: [],
      location: "",
    }));
    setLoading(false);
    router.replace("/dashboard/search", { scroll: false });
  };

  const handleSearchInputChange = (val) => {
    setSearchInput(val);
    if (!val.trim()) {
      setIsCleared(true);
      setApiTasks([]);
      setApiHelpers([]);
      setSelectedCategories([]);
      setLocationInput("");
      setAppliedFilters((prev) => ({
        ...prev,
        categories: [],
        location: "",
      }));
      setLoading(false);
      router.replace("/dashboard/search", { scroll: false });
    }
  };

  const visibleTasks = q ? apiTasks : [];
  const allHelpers = useMemo(
    () => buildMergedHelpers(apiHelpers, q, hasActiveFilters),
    [apiHelpers, q, hasActiveFilters]
  );

  const filteredHelpers = useMemo(() => {
    let list = [...allHelpers];

    // Type of Task / Category filter
    if (appliedFilters.categories.length > 0) {
      const lowerCats = appliedFilters.categories.map((c) => c.toLowerCase());
      list = list.filter((h) => {
        const hCat = (h.category || "").toLowerCase();
        const hTags = Array.isArray(h.tags) ? h.tags.map((t) => t.toLowerCase()) : [];
        return lowerCats.some(
          (cat) => hCat === cat || hCat.includes(cat) || hTags.some((t) => t.includes(cat))
        );
      });
    }

    // Location filter
    const locQuery = (appliedFilters.location || "").trim().toLowerCase();
    if (locQuery && locQuery !== "all") {
      const exactMatches = list.filter((h) =>
        (h.location || "").toLowerCase().includes(locQuery)
      );
      if (exactMatches.length > 0) {
        list = exactMatches;
      } else {
        const cityToken = locQuery.split(",")[0].trim();
        list = list.filter((h) =>
          (h.location || "").toLowerCase().includes(cityToken)
        );
      }
    }

    // Rating filter
    if (appliedFilters.ratings.length > 0) {
      const minRating = Math.min(
        ...appliedFilters.ratings.map((r) => parseFloat(r.replace("+", "")))
      );
      list = list.filter((h) => h.rating >= minRating);
    }

    // Experience filter
    if (appliedFilters.experience.length > 0) {
      const minExp = Math.min(
        ...appliedFilters.experience.map((e) => parseInt(e, 10))
      );
      list = list.filter((h) => h.expYears >= minExp);
    }

    // Sorting
    if (sortBy === "rating") {
      list.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === "price_low") {
      list.sort((a, b) => a.rate - b.rate);
    } else if (sortBy === "experience") {
      list.sort((a, b) => b.expYears - a.expYears);
    }

    return list;
  }, [allHelpers, appliedFilters, sortBy]);

  const toggleSection = (key) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleCategoryItem = (cat) => {
    setIsCleared(false);
    setSelectedCategories((prev) => {
      const next = prev.includes(cat) ? prev.filter((i) => i !== cat) : [...prev, cat];
      setAppliedFilters((af) => ({ ...af, categories: next }));
      return next;
    });
  };

  const handleSelectSingleTaskType = (val) => {
    const next = val ? [val] : [];
    if (val) setIsCleared(false);
    setSelectedCategories(next);
    setAppliedFilters((af) => ({ ...af, categories: next }));
  };

  const handleLocationFilterChange = (val) => {
    if (val.trim()) setIsCleared(false);
    setLocationInput(val);
    setAppliedFilters((af) => ({ ...af, location: val }));
  };

  const toggleArrayItem = (setter, item) => {
    setter((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const handleClearAll = () => {
    setSelectedCategories([]);
    setLocationInput("");
    setSelectedAvailability([]);
    setSelectedRatings([]);
    setSelectedExperience([]);
    setAppliedFilters({
      categories: [],
      location: "",
      availability: [],
      ratings: [],
      experience: [],
    });
  };

  const handleApplyFilters = () => {
    if (selectedCategories.length > 0 || locationInput.trim()) {
      setIsCleared(false);
    }
    setAppliedFilters({
      categories: selectedCategories,
      location: locationInput,
      availability: selectedAvailability,
      ratings: selectedRatings,
      experience: selectedExperience,
    });
  };

  const handleOpenHire = async (helper) => {
    try {
      const token = await getAuthToken();
      if (!token) {
        router.push(`/login?next=${encodeURIComponent(`/dashboard/search?q=${q}`)}`);
        return;
      }
      setHireTarget(helper);
      setHireBudget(helper.rate || 300);
      setHireNotes("");
      setHireSuccess(false);
    } catch {
      router.push(`/login?next=${encodeURIComponent(`/dashboard/search?q=${q}`)}`);
    }
  };

  const handleSubmitHire = async (e) => {
    e.preventDefault();
    if (!hireTarget) return;
    setHireLoading(true);
    try {
      await hireBuddy({
        helperId: hireTarget.id,
        title: `Hire ${hireTarget.name}`,
        description: hireNotes || `Hiring ${hireTarget.name} for ${q} service`,
        budget: Number(hireBudget || 300),
      });
      setHireSuccess(true);
    } catch (err) {
      console.error("Hire request failed", err);
      alert("Failed to send hire request.");
    } finally {
      setHireLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060c1b] text-slate-100 flex flex-col font-sans">
      <HeaderAfterlogin
        searchValue={searchInput}
        onSearchChange={handleSearchInputChange}
        onSearchClear={handleClearSearchBar}
      />

      <main className="flex-1 pt-16">
        {/* Top Search Banner / Hero Section */}
        <section className="border-b border-[#14223d] bg-gradient-to-b from-[#081126] to-[#060c1b]">
          <div className="mx-auto max-w-[1360px] px-6 pt-5 pb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              {/* Left Column: Breadcrumb, Heading, Subtitle, Result Type Tabs */}
              <div>
                <nav className="flex items-center gap-2 text-xs text-slate-400">
                  <Link href="/dashboard" className="hover:text-white transition">
                    Home
                  </Link>
                  <svg className="h-3 w-3 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                  <span className="text-slate-200 font-medium">Search</span>
                </nav>

                <h1 className="mt-2.5 text-2xl sm:text-[32px] font-extrabold tracking-tight text-white leading-tight">
                  {q ? `Search results for “${q}”` : "Search services & helpers"}
                </h1>
                <p className="mt-1.5 text-sm text-slate-400">
                  Find trusted local helpers for your task.
                </p>

                {/* Result Type Tabs */}
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab("helpers")}
                    className={`rounded-full px-5 py-2 text-xs font-bold transition ${
                      activeTab === "helpers"
                        ? "bg-[#1361f5] text-white shadow-lg shadow-blue-600/30 border border-blue-500"
                        : "border border-[#1d2d4e] bg-[#0a1326] text-slate-300 hover:border-slate-600 hover:text-white"
                    }`}
                  >
                    Helpers ({filteredHelpers.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("tasks")}
                    className={`rounded-full px-5 py-2 text-xs font-semibold transition ${
                      activeTab === "tasks"
                        ? "bg-[#1361f5] text-white shadow-lg shadow-blue-600/30 border border-blue-500"
                        : "border border-[#1d2d4e] bg-[#0a1326] text-slate-300 hover:border-slate-600 hover:text-white"
                    }`}
                  >
                    Tasks ({visibleTasks.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("all")}
                    className={`rounded-full px-5 py-2 text-xs font-semibold transition ${
                      activeTab === "all"
                        ? "bg-[#1361f5] text-white shadow-lg shadow-blue-600/30 border border-blue-500"
                        : "border border-[#1d2d4e] bg-[#0a1326] text-slate-300 hover:border-slate-600 hover:text-white"
                    }`}
                  >
                    All Results ({filteredHelpers.length + visibleTasks.length})
                  </button>
                </div>
              </div>

              {/* Right Column: Driver Mascot Illustration + Need a driver? CTA Card */}
              <div className="flex items-center gap-4 self-start lg:self-center">
                <div className="hidden sm:block shrink-0">
                  <img
                    src="/images/driver_search_hero.png"
                    alt="Driver Illustration"
                    className="h-[116px] w-auto object-contain select-none"
                  />
                </div>

                <div className="flex items-center justify-between gap-5 rounded-2xl border border-[#1a2b4c] bg-[#0b1528]/95 px-5 py-4 shadow-xl">
                  <div>
                    <h2 className="text-[15px] font-bold text-white">
                      {q ? `Need a ${q.toLowerCase()}?` : "Need a helper?"}
                    </h2>
                    <p className="mt-1 text-xs leading-relaxed text-slate-400 max-w-[155px]">
                      Post a task and get verified helpers nearby.
                    </p>
                  </div>
                  <Link
                    href={q ? `/dashboard/create-task?category=${encodeURIComponent(q)}` : "/dashboard/create-task"}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#1361f5] px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-600/25 transition hover:bg-blue-600 whitespace-nowrap"
                  >
                    <span>Post a Task</span>
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Main 2-Column Content Section */}
        <section className="mx-auto max-w-[1360px] px-6 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6 items-start">
            {/* Left Sidebar: Filters */}
            <aside className="rounded-2xl border border-[#172642] bg-[#091224] p-5 shadow-xl">
              <div className="flex items-center justify-between pb-4 border-b border-[#15223a]">
                <h2 className="text-base font-bold text-white">Filters</h2>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-xs font-semibold text-[#3b82f6] hover:text-blue-400 transition"
                >
                  Clear All
                </button>
              </div>

              {/* 1. Type of Task / Service Category */}
              <div className="py-4 border-b border-[#15223a]">
                <button
                  type="button"
                  onClick={() => toggleSection("category")}
                  className="flex w-full items-center justify-between text-left"
                >
                  <span className="flex items-center gap-2 text-xs font-bold text-white">
                    <svg className="h-4 w-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 17h8M8 17a2 2 0 11-4 0 2 2 0 014 0zm8 0a2 2 0 104 0 2 2 0 00-4 0zM5 17H3v-4l2-5h12l2 5v4h-2" />
                    </svg>
                    Type of Task
                  </span>
                  <svg
                    className={`h-3.5 w-3.5 text-slate-400 transition-transform ${openSections.category ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {openSections.category && (
                  <div className="mt-3 space-y-2.5">
                    {TASK_TYPE_OPTIONS.map((cat) => {
                      const checked = selectedCategories.includes(cat);
                      return (
                        <label
                          key={cat}
                          onClick={() => toggleCategoryItem(cat)}
                          className="flex items-center gap-2.5 cursor-pointer select-none text-xs text-slate-300 hover:text-white"
                        >
                          <span
                            className={`flex h-4 w-4 items-center justify-center rounded border transition ${
                              checked
                                ? "border-[#1361f5] bg-[#1361f5] text-white"
                                : "border-[#2a3c5e] bg-[#0b1528]"
                            }`}
                          >
                            {checked && (
                              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </span>
                          <span>{cat}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 2. Location */}
              <div className="py-4 border-b border-[#15223a]">
                <button
                  type="button"
                  onClick={() => toggleSection("location")}
                  className="flex w-full items-center justify-between text-left"
                >
                  <span className="flex items-center gap-2 text-xs font-bold text-white">
                    <svg className="h-4 w-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Location
                  </span>
                  <svg
                    className={`h-3.5 w-3.5 text-slate-400 transition-transform ${openSections.location ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {openSections.location && (
                  <div className="mt-3 space-y-2.5">
                    <div className="relative flex items-center">
                      <svg className="absolute left-3 h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <input
                        type="text"
                        value={locationInput}
                        onChange={(e) => handleLocationFilterChange(e.target.value)}
                        placeholder="All locations (e.g. Modipuram)"
                        className="w-full rounded-xl border border-[#1d2d4e] bg-[#0b1528] py-2 pl-8 pr-8 text-xs text-slate-200 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        title="Use profile location (Modipuram, Meerut)"
                        onClick={() => handleLocationFilterChange("Modipuram, Meerut")}
                        className="absolute right-2.5 text-[#3b82f6] hover:text-blue-400"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <circle cx="12" cy="12" r="3" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v3m0 14v3M2 12h3m14 0h3" />
                          <circle cx="12" cy="12" r="7" />
                        </svg>
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleLocationFilterChange("")}
                        className={`rounded-lg border px-2 py-1 text-[11px] font-medium transition ${
                          !locationInput.trim()
                            ? "border-blue-500 bg-[#1361f5]/20 text-blue-300"
                            : "border-[#1d2d4e] bg-[#0b1528] text-slate-400 hover:text-white"
                        }`}
                      >
                        All
                      </button>
                      {LOCATION_OPTIONS.map((loc) => {
                        const active = locationInput.toLowerCase() === loc.toLowerCase();
                        return (
                          <button
                            key={loc}
                            type="button"
                            onClick={() => handleLocationFilterChange(active ? "" : loc)}
                            className={`rounded-lg border px-2 py-1 text-[11px] font-medium transition ${
                              active
                                ? "border-blue-500 bg-[#1361f5]/20 text-blue-300"
                                : "border-[#1d2d4e] bg-[#0b1528] text-slate-400 hover:text-white"
                            }`}
                          >
                            {loc}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Availability */}
              <div className="py-4 border-b border-[#15223a]">
                <button
                  type="button"
                  onClick={() => toggleSection("availability")}
                  className="flex w-full items-center justify-between text-left"
                >
                  <span className="flex items-center gap-2 text-xs font-bold text-white">
                    <svg className="h-4 w-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    Availability
                  </span>
                  <svg
                    className={`h-3.5 w-3.5 text-slate-400 transition-transform ${openSections.availability ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {openSections.availability && (
                  <div className="mt-3 space-y-2.5">
                    {["Available Today", "This Week"].map((item) => {
                      const checked = selectedAvailability.includes(item);
                      return (
                        <label
                          key={item}
                          onClick={() => toggleArrayItem(setSelectedAvailability, item)}
                          className="flex items-center gap-2.5 cursor-pointer select-none text-xs text-slate-300 hover:text-white"
                        >
                          <span
                            className={`flex h-4 w-4 items-center justify-center rounded border transition ${
                              checked
                                ? "border-[#1361f5] bg-[#1361f5] text-white"
                                : "border-[#2a3c5e] bg-[#0b1528]"
                            }`}
                          >
                            {checked && (
                              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </span>
                          <span>{item}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 4. Rating */}
              <div className="py-4 border-b border-[#15223a]">
                <button
                  type="button"
                  onClick={() => toggleSection("rating")}
                  className="flex w-full items-center justify-between text-left"
                >
                  <span className="flex items-center gap-2 text-xs font-bold text-white">
                    <svg className="h-4 w-4 text-slate-200 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    Rating
                  </span>
                  <svg
                    className={`h-3.5 w-3.5 text-slate-400 transition-transform ${openSections.rating ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {openSections.rating && (
                  <div className="mt-3 space-y-2.5">
                    {["4.5+", "4.0+"].map((r) => {
                      const checked = selectedRatings.includes(r);
                      return (
                        <label
                          key={r}
                          onClick={() => toggleArrayItem(setSelectedRatings, r)}
                          className="flex items-center gap-2.5 cursor-pointer select-none text-xs text-slate-300 hover:text-white"
                        >
                          <span
                            className={`flex h-4 w-4 items-center justify-center rounded border transition ${
                              checked
                                ? "border-[#1361f5] bg-[#1361f5] text-white"
                                : "border-[#2a3c5e] bg-[#0b1528]"
                            }`}
                          >
                            {checked && (
                              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </span>
                          <span>{r}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 5. Experience */}
              <div className="py-4">
                <button
                  type="button"
                  onClick={() => toggleSection("experience")}
                  className="flex w-full items-center justify-between text-left"
                >
                  <span className="flex items-center gap-2 text-xs font-bold text-white">
                    <svg className="h-4 w-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
                    </svg>
                    Experience
                  </span>
                  <svg
                    className={`h-3.5 w-3.5 text-slate-400 transition-transform ${openSections.experience ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {openSections.experience && (
                  <div className="mt-3 space-y-2.5">
                    {["1+ years", "3+ years", "5+ years"].map((exp) => {
                      const checked = selectedExperience.includes(exp);
                      return (
                        <label
                          key={exp}
                          onClick={() => toggleArrayItem(setSelectedExperience, exp)}
                          className="flex items-center gap-2.5 cursor-pointer select-none text-xs text-slate-300 hover:text-white"
                        >
                          <span
                            className={`flex h-4 w-4 items-center justify-center rounded border transition ${
                              checked
                                ? "border-[#1361f5] bg-[#1361f5] text-white"
                                : "border-[#2a3c5e] bg-[#0b1528]"
                            }`}
                          >
                            {checked && (
                              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </span>
                          <span>{exp}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleApplyFilters}
                className="mt-2 w-full rounded-xl bg-[#1361f5] py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-600"
              >
                Apply Filters
              </button>
            </aside>

            {/* Right Results Column */}
            <div>
              {/* Top Quick Filter Bar: Location + Type of Task */}
              <div className="mb-4 rounded-2xl border border-[#172642] bg-[#091224] p-4 shadow-lg">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto] gap-3 items-end">
                  {/* Location Filter Dropdown */}
                  <div>
                    <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      <svg className="h-3.5 w-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Location Filter
                    </label>
                    <select
                      value={locationInput}
                      onChange={(e) => handleLocationFilterChange(e.target.value)}
                      className="w-full rounded-xl border border-[#1d2d4e] bg-[#0b1528] px-3.5 py-2 text-xs font-semibold text-white focus:border-blue-500 focus:outline-none cursor-pointer"
                    >
                      <option value="">All Locations</option>
                      {LOCATION_OPTIONS.map((loc) => (
                        <option key={loc} value={loc}>
                          {loc}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Type of Task Filter Dropdown */}
                  <div>
                    <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      <svg className="h-3.5 w-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      Type of Task Filter
                    </label>
                    <select
                      value={selectedCategories[0] || ""}
                      onChange={(e) => handleSelectSingleTaskType(e.target.value)}
                      className="w-full rounded-xl border border-[#1d2d4e] bg-[#0b1528] px-3.5 py-2 text-xs font-semibold text-white focus:border-blue-500 focus:outline-none cursor-pointer"
                    >
                      <option value="">All Task Types</option>
                      {TASK_TYPE_OPTIONS.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Sort By */}
                  <div className="relative flex items-center rounded-xl border border-[#1d2d4e] bg-[#0b1528] px-3.5 py-2 text-xs text-slate-300 h-[34px]">
                    <span className="text-slate-400 mr-1.5">Sort by:</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="appearance-none bg-transparent pr-5 font-semibold text-white focus:outline-none cursor-pointer"
                    >
                      <option value="relevance" className="bg-[#091224] text-white">
                        Relevance
                      </option>
                      <option value="rating" className="bg-[#091224] text-white">
                        Rating: High to Low
                      </option>
                      <option value="price_low" className="bg-[#091224] text-white">
                        Price: Low to High
                      </option>
                      <option value="experience" className="bg-[#091224] text-white">
                        Experience
                      </option>
                    </select>
                    <svg
                      className="pointer-events-none absolute right-3 h-3.5 w-3.5 text-slate-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Results Count Bar */}
              <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-[16px] font-bold text-white">
                  {!q && !hasActiveFilters
                    ? "Enter a search term or select Location / Type of Task above"
                    : activeTab === "tasks"
                    ? `${visibleTasks.length} tasks found${q ? ` for “${q}”` : ""}`
                    : `${filteredHelpers.length} helpers found${
                        q
                          ? ` for “${q}”`
                          : appliedFilters.categories.length > 0
                          ? ` for ${appliedFilters.categories.join(", ")}`
                          : ""
                      }${appliedFilters.location ? ` in ${appliedFilters.location}` : ""}`}
                </h2>

                {(appliedFilters.categories.length > 0 || appliedFilters.location) && (
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition"
                  >
                    Reset Location & Task Filters
                  </button>
                )}
              </div>

              {/* Empty Search State or Loading Skeleton or Cards Grid */}
              {!q && !hasActiveFilters ? (
                <div className="rounded-2xl border border-[#1b2b4b] bg-[#0b1426] p-12 text-center shadow-lg">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#101d38] text-blue-400">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h3 className="mt-4 text-base font-bold text-white">
                    Search for a service or helper
                  </h3>
                  <p className="mt-1.5 text-xs text-slate-400 max-w-md mx-auto">
                    Type a service in the search bar above, or filter by Location and Type of Task to see verified helpers nearby.
                  </p>
                  <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                    {["Delivery", "Driver", "Cleaning", "Cooking", "Plumbing", "Electrician"].map((term) => (
                      <button
                        key={term}
                        type="button"
                        onClick={() => {
                          setSearchInput(term);
                          setIsCleared(false);
                          router.push(`/dashboard/search?q=${encodeURIComponent(term.toLowerCase())}`);
                        }}
                        className="rounded-full border border-[#1d3156] bg-[#101d38] px-4 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-blue-500 hover:bg-[#1361f5] hover:text-white"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              ) : loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <div
                      key={n}
                      className="h-[340px] rounded-2xl border border-[#1b2b4b] bg-[#0b1426] animate-pulse"
                    />
                  ))}
                </div>
              ) : (
                <>
                  {/* Helper Cards Grid */}
                  {(activeTab === "helpers" || activeTab === "all") && (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                      {filteredHelpers.slice(0, 6).map((helper) => {
                        const isFav = !!favorites[helper.id];
                        return (
                          <div
                            key={helper.id}
                            className="group flex flex-col justify-between rounded-2xl border border-[#1b2b4b] bg-[#0b1426] overflow-hidden shadow-lg shadow-black/30 transition hover:border-[#2c4778]"
                          >
                            {/* Top Photo Banner */}
                            <div className="relative w-full aspect-[334/116] bg-[#101c35] overflow-hidden">
                              <img
                                src={helper.bannerImage}
                                alt={helper.name}
                                className="h-full w-full object-cover"
                              />

                              {!helper.hasBakedOverlays && (
                                <>
                                  <span className="absolute left-3 top-2.5 inline-flex items-center gap-1.5 rounded-full bg-[#042f26]/95 border border-emerald-500/30 px-2.5 py-1 text-[11px] font-bold text-[#10b981]">
                                    <span className="h-2 w-2 rounded-full bg-[#10b981]" />
                                    Available
                                  </span>
                                  <button
                                    type="button"
                                    aria-label="Favorite helper"
                                    onClick={() =>
                                      setFavorites((prev) => ({
                                        ...prev,
                                        [helper.id]: !prev[helper.id],
                                      }))
                                    }
                                    className="absolute right-3 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition"
                                  >
                                    ♥
                                  </button>
                                </>
                              )}

                              {helper.hasBakedOverlays && (
                                <button
                                  type="button"
                                  aria-label="Toggle favorite"
                                  onClick={() =>
                                    setFavorites((prev) => ({
                                      ...prev,
                                      [helper.id]: !prev[helper.id],
                                    }))
                                  }
                                  className="absolute top-[7%] right-[2.6%] h-[29%] aspect-square rounded-full flex items-center justify-center transition"
                                >
                                  {isFav && (
                                    <span className="flex h-full w-full items-center justify-center rounded-full bg-[#0d1526]/90 text-rose-500 text-sm">
                                      ♥
                                    </span>
                                  )}
                                </button>
                              )}
                            </div>

                            {/* Card Body */}
                            <div className="flex flex-1 flex-col justify-between p-4">
                              <div>
                                {/* Name + Verified Badge */}
                                <div className="flex items-center gap-1.5">
                                  <h3 className="text-[16px] font-bold text-white tracking-tight">
                                    {helper.name}
                                  </h3>
                                  <svg
                                    className="h-4 w-4 text-[#10b981] shrink-0"
                                    viewBox="0 0 24 24"
                                    fill="currentColor"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </div>

                                {/* Rating & Location */}
                                <div className="mt-1.5 flex flex-wrap items-center gap-x-3.5 gap-y-1 text-xs">
                                  <span className="flex items-center gap-1 font-semibold text-slate-200">
                                    <svg className="h-3.5 w-3.5 text-[#facc15] fill-current" viewBox="0 0 20 20">
                                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                    {helper.rating}{" "}
                                    <span className="font-normal text-slate-400">
                                      ({helper.reviewsCount} reviews)
                                    </span>
                                  </span>

                                  <span className="flex items-center gap-1 text-slate-300">
                                    <svg className="h-3.5 w-3.5 text-slate-400 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                      <path
                                        fillRule="evenodd"
                                        d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                    {helper.location}
                                  </span>
                                </div>

                                {/* Description / Bio */}
                                <p className="mt-2.5 text-xs leading-relaxed text-slate-300 line-clamp-2 min-h-[38px]">
                                  {helper.bio}
                                </p>

                                {/* Service Tags */}
                                <div className="mt-3 flex flex-wrap gap-1.5">
                                  {helper.tags.map((tag) => (
                                    <span
                                      key={tag}
                                      className="rounded-full border border-[#1d3156] bg-[#101d38] px-2.5 py-1 text-[11px] font-medium text-slate-200"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              <div>
                                {/* Experience, Verified, Price Row */}
                                <div className="mt-3.5 pt-3 border-t border-[#15233e] flex items-center justify-between gap-2 text-xs">
                                  <div className="flex items-center gap-3 text-slate-300">
                                    <span className="flex items-center gap-1">
                                      <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
                                      </svg>
                                      {helper.experienceLabel}
                                    </span>

                                    <span className="flex items-center gap-1">
                                      <svg className="h-3.5 w-3.5 text-slate-300" viewBox="0 0 20 20" fill="currentColor">
                                        <path
                                          fillRule="evenodd"
                                          d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944zM13.707 8.707a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                          clipRule="evenodd"
                                        />
                                      </svg>
                                      Verified Helper
                                    </span>
                                  </div>

                                  <div className="text-right whitespace-nowrap">
                                    <span className="text-[15px] font-extrabold text-white">
                                      ₹{helper.rate}
                                    </span>{" "}
                                    <span className="text-[11px] text-slate-400">
                                      / {helper.rateUnit}
                                    </span>
                                  </div>
                                </div>

                                {/* Bottom Action Buttons */}
                                <div className="mt-3.5 grid grid-cols-2 gap-2.5">
                                  <Link
                                    href={`/helpers/${helper.id}`}
                                    className="flex items-center justify-center rounded-xl border border-[#24375c] bg-[#0d182e] py-2 text-xs font-bold text-white transition hover:bg-[#152442] hover:border-slate-500"
                                  >
                                    View Profile
                                  </Link>

                                  <button
                                    type="button"
                                    onClick={() => handleOpenHire(helper)}
                                    className="flex items-center justify-center gap-1.5 rounded-xl bg-[#10b981] py-2 text-xs font-bold text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-500"
                                  >
                                    <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                      <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                                    </svg>
                                    Hire Me
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Tasks Tab View */}
                  {(activeTab === "tasks" || activeTab === "all") && (
                    <div className={activeTab === "all" ? "mt-8" : ""}>
                      {activeTab === "all" && visibleTasks.length > 0 && (
                        <h3 className="mb-4 text-base font-bold text-white">
                          Tasks ({visibleTasks.length})
                        </h3>
                      )}
                      {visibleTasks.length === 0 && activeTab === "tasks" ? (
                        <div className="rounded-2xl border border-[#1b2b4b] bg-[#0b1426] p-10 text-center">
                          <p className="text-sm text-slate-400">
                            No open tasks found for “{q}”.
                          </p>
                          <Link
                            href={`/dashboard/create-task?category=${encodeURIComponent(q)}`}
                            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#1361f5] px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-600"
                          >
                            Post a Task
                          </Link>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {visibleTasks.map((t) => (
                            <div
                              key={t.id}
                              className="rounded-2xl border border-[#1b2b4b] bg-[#0b1426] p-5 flex items-center justify-between gap-4"
                            >
                              <div>
                                <h4 className="text-sm font-bold text-white">{t.title}</h4>
                                <p className="mt-1 text-xs text-slate-400 line-clamp-2">
                                  {t.description}
                                </p>
                                <p className="mt-2 text-xs text-slate-500">{t.location}</p>
                              </div>
                              <div className="text-right shrink-0">
                                <div className="text-sm font-extrabold text-[#10b981]">
                                  ₹{t.budget}
                                </div>
                                <Link
                                  href={`/tasks/${t.id}`}
                                  className="mt-2 inline-block text-xs font-semibold text-blue-400 hover:underline"
                                >
                                  View Task
                                </Link>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Hire Modal */}
      {hireTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setHireTarget(null)}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-[#1e3156] bg-[#0b1426] p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-[#162542]">
              <div>
                <h3 className="text-base font-bold text-white">
                  Hire {hireTarget.name}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Send a direct hire request — they’ll be notified immediately
                </p>
              </div>
              <button
                type="button"
                onClick={() => setHireTarget(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {hireSuccess ? (
              <div className="py-8 text-center">
                <div className="text-3xl">🎉</div>
                <h4 className="mt-3 text-base font-bold text-white">
                  Hire Request Sent!
                </h4>
                <p className="mt-1 text-xs text-slate-400">
                  We’ve notified {hireTarget.name}. You can track the status in My Tasks.
                </p>
                <div className="mt-6 flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setHireTarget(null);
                      router.push("/dashboard/my-tasks");
                    }}
                    className="rounded-xl bg-[#10b981] px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500"
                  >
                    View My Tasks
                  </button>
                  <button
                    type="button"
                    onClick={() => setHireTarget(null)}
                    className="rounded-xl border border-[#24375c] px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-[#13203b]"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitHire} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300">
                    Daily Budget (₹)
                  </label>
                  <input
                    type="number"
                    value={hireBudget}
                    onChange={(e) => setHireBudget(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-[#1d2d4e] bg-[#081020] px-3.5 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300">
                    Task Notes / Pickup Details
                  </label>
                  <textarea
                    rows={3}
                    value={hireNotes}
                    onChange={(e) => setHireNotes(e.target.value)}
                    placeholder="E.g., Need local driving in Meerut tomorrow starting 9 AM..."
                    className="mt-1.5 w-full rounded-xl border border-[#1d2d4e] bg-[#081020] px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div className="flex justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setHireTarget(null)}
                    className="rounded-xl border border-[#24375c] px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-[#13203b]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={hireLoading}
                    className="rounded-xl bg-[#10b981] px-5 py-2 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-50"
                  >
                    {hireLoading ? "Sending..." : "Send Request"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

export default function SearchResultsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#060c1b]" />}>
      <SearchContent />
    </Suspense>
  );
}
