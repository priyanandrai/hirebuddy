"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { getFilteredServices } from "../components/services/task.service";
import { ServiceGridCardShimmer } from "../components/ui/Shimmer";

const DEFAULT_CATEGORIES = [
  { name: "All Services", slug: "all", count: 9, iconType: "all" },
  { name: "Home Cleaning", slug: "home-cleaning", count: 1, iconType: "cleaning" },
  { name: "Driver Services", slug: "driver-services", count: 1, iconType: "driver" },
  { name: "Delivery & Pickup", slug: "delivery-pickup", count: 1, iconType: "delivery" },
  { name: "Plumbing", slug: "plumbing", count: 1, iconType: "plumbing" },
  { name: "Electrical", slug: "electrical", count: 1, iconType: "electrical" },
  { name: "Furniture Assembly", slug: "furniture-assembly", count: 1, iconType: "furniture" },
  { name: "Cooking", slug: "cooking", count: 1, iconType: "cooking" },
  { name: "Personal Care", slug: "personal-care", count: 1, iconType: "personal-care" },
  { name: "Others", slug: "others", count: 1, iconType: "others" },
];

const FALLBACK_SERVICES = [
  {
    id: "svc-home-cleaning",
    title: "Home Cleaning",
    category: "Home Cleaning",
    slug: "home-cleaning",
    taskCategory: "Cleaning",
    image: "/images/service_home_cleaning.png",
    iconType: "cleaning",
    verified: true,
    rating: 4.7,
    reviewsCount: 128,
    location: "Modipuram, Meerut",
    description: "Professional home cleaning services for a cleaner and healthier home.",
    price: 300,
    priceUnit: "day",
    relevanceOrder: 1,
    availableHelpers: 12,
    subServices: [
      "Full Home Deep Cleaning",
      "Kitchen & Bathroom Sanitization",
      "Sofa & Carpet Vacuuming",
      "Floor Scrubbing & Polishing",
    ],
  },
  {
    id: "svc-driver-services",
    title: "Driver Services",
    category: "Driver Services",
    slug: "driver-services",
    taskCategory: "Driver",
    image: "/images/service_driver.png",
    iconType: "driver",
    verified: true,
    rating: 4.6,
    reviewsCount: 96,
    location: "Meerut, UP",
    description: "Safe and experienced drivers for local and outstation trips.",
    price: 400,
    priceUnit: "day",
    relevanceOrder: 2,
    availableHelpers: 8,
    subServices: [
      "Local City Chauffeur",
      "Outstation Round Trips",
      "Airport Pickup & Drop",
      "Hourly Personal Driver",
    ],
  },
  {
    id: "svc-delivery-pickup",
    title: "Delivery & Pickup",
    category: "Delivery & Pickup",
    slug: "delivery-pickup",
    taskCategory: "Delivery",
    image: "/images/service_delivery.png",
    iconType: "delivery",
    verified: true,
    rating: 4.5,
    reviewsCount: 74,
    location: "Modipuram, Meerut",
    description: "Quick and reliable delivery and pickup services for your convenience.",
    price: 200,
    priceUnit: "day",
    relevanceOrder: 3,
    availableHelpers: 6,
    subServices: [
      "Same-Day Parcel Delivery",
      "Grocery & Medicine Pickup",
      "Document Courier",
      "Heavy Item Transport",
    ],
  },
  {
    id: "svc-plumbing",
    title: "Plumbing",
    category: "Plumbing",
    slug: "plumbing",
    taskCategory: "Plumbing",
    image: "/images/service_plumbing.png",
    iconType: "plumbing",
    verified: true,
    rating: 4.4,
    reviewsCount: 62,
    location: "Meerut, UP",
    description: "Fixing leaks, pipe repair, and all plumbing needs.",
    price: 350,
    priceUnit: "day",
    relevanceOrder: 4,
    availableHelpers: 5,
    subServices: [
      "Tap & Pipe Leak Repair",
      "Drain Blockage Clearing",
      "Water Tank & Motor Fitting",
      "Bathroom Fixture Installation",
    ],
  },
  {
    id: "svc-electrical",
    title: "Electrical",
    category: "Electrical",
    slug: "electrical",
    taskCategory: "Electrical",
    image: "/images/service_electrical.png",
    iconType: "electrical",
    verified: true,
    rating: 4.3,
    reviewsCount: 48,
    location: "Modipuram, Meerut",
    description: "Electrical repairs, installation and maintenance services.",
    price: 300,
    priceUnit: "day",
    relevanceOrder: 5,
    availableHelpers: 4,
    subServices: [
      "Switchboard & Wiring Repair",
      "Ceiling Fan & Light Installation",
      "Inverter & UPS Setup",
      "MCB & Fuse Troubleshooting",
    ],
  },
  {
    id: "svc-furniture-assembly",
    title: "Furniture Assembly",
    category: "Furniture Assembly",
    slug: "furniture-assembly",
    taskCategory: "Furniture Assembly",
    image: "/images/service_furniture.png",
    iconType: "furniture",
    verified: true,
    rating: 4.2,
    reviewsCount: 36,
    location: "Meerut, UP",
    description: "Quick and professional furniture assembly and installation.",
    price: 250,
    priceUnit: "day",
    relevanceOrder: 6,
    availableHelpers: 3,
    subServices: [
      "Bed & Wardrobe Assembly",
      "Modular Study Table Setup",
      "TV Unit & Wall Mounting",
      "Furniture Dismantling & Moving",
    ],
  },
  {
    id: "svc-cooking",
    title: "Cooking",
    category: "Cooking",
    slug: "cooking",
    taskCategory: "Cooking",
    image: "/images/service_home_cleaning.png",
    iconType: "cooking",
    verified: true,
    rating: 4.6,
    reviewsCount: 52,
    location: "Modipuram, Meerut",
    description: "Hygienic and delicious home-cooked meals prepared by verified local cooks.",
    price: 350,
    priceUnit: "day",
    relevanceOrder: 7,
    availableHelpers: 3,
    isExtended: true,
    subServices: [
      "Daily Home Meal Prep",
      "North & South Indian Cooking",
      "Party & Event Catering Help",
      "Tiffin Preparation",
    ],
  },
  {
    id: "svc-personal-care",
    title: "Personal Care",
    category: "Personal Care",
    slug: "personal-care",
    taskCategory: "Elder Care",
    image: "/images/service_driver.png",
    iconType: "personal-care",
    verified: true,
    rating: 4.5,
    reviewsCount: 29,
    location: "Meerut, UP",
    description: "Compassionate personal care, elder assistance, and daily wellness support.",
    price: 450,
    priceUnit: "day",
    relevanceOrder: 8,
    availableHelpers: 2,
    isExtended: true,
    subServices: [
      "Elder Companionship",
      "Doctor Visit Escort",
      "Patient Home Care",
      "Mobility Support",
    ],
  },
  {
    id: "svc-others",
    title: "Others",
    category: "Others",
    slug: "others",
    taskCategory: "Home Support",
    image: "/images/service_delivery.png",
    iconType: "others",
    verified: true,
    rating: 4.1,
    reviewsCount: 41,
    location: "Modipuram, Meerut",
    description: "Custom everyday tasks, gardening, errands, and general household assistance.",
    price: 200,
    priceUnit: "day",
    relevanceOrder: 9,
    availableHelpers: 4,
    isExtended: true,
    subServices: [
      "Gardening & Plant Care",
      "Event Help & Setup",
      "Pet Walking & Sitting",
      "Custom Local Errands",
    ],
  },
];

export default function UserHomePage() {
  const [services, setServices] = useState(FALLBACK_SERVICES);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(false);

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [minPrice, setMinPrice] = useState(100);
  const [maxPrice, setMaxPrice] = useState(1000);
  const [selectedRatings, setSelectedRatings] = useState([]);
  const [sortBy, setSortBy] = useState("relevance");
  const [searchQuery, setSearchQuery] = useState("");

  // Interactive UI States
  const [favorites, setFavorites] = useState([]);
  const [detailService, setDetailService] = useState(null);
  const [refreshTick, setRefreshTick] = useState(0);

  const effectiveMinRating =
    selectedRatings.length > 0 ? Math.min(...selectedRatings) : undefined;

  // Listen to global header search events & DB category updates
  useEffect(() => {
    const handleHeaderSearch = (e) => {
      setSearchQuery(typeof e.detail === "string" ? e.detail : "");
    };
    const handleCategoriesUpdated = () => {
      setRefreshTick((t) => t + 1);
    };
    window.addEventListener("hirebuddy:search-change", handleHeaderSearch);
    window.addEventListener("categoriesUpdated", handleCategoriesUpdated);
    return () => {
      window.removeEventListener("hirebuddy:search-change", handleHeaderSearch);
      window.removeEventListener("categoriesUpdated", handleCategoriesUpdated);
    };
  }, []);

  const getBaseFilteredCatalog = useCallback(
    ({ location, minP, maxP, minR, search }) => {
      let list = [...FALLBACK_SERVICES];
      const normSearch = String(search || "").trim().toLowerCase();
      const normLoc = String(location || "").trim().toLowerCase();

      if (normSearch) {
        list = list.filter(
          (s) =>
            s.title.toLowerCase().includes(normSearch) ||
            s.description.toLowerCase().includes(normSearch) ||
            s.category.toLowerCase().includes(normSearch) ||
            s.location.toLowerCase().includes(normSearch) ||
            (Array.isArray(s.subServices) &&
              s.subServices.some((sub) => sub.toLowerCase().includes(normSearch)))
        );
      }

      if (normLoc) {
        list = list.filter((s) => s.location.toLowerCase().includes(normLoc));
      }

      if (minP !== undefined) {
        list = list.filter((s) => s.price >= Number(minP));
      }
      if (maxP !== undefined && Number(maxP) < 1000) {
        list = list.filter((s) => s.price <= Number(maxP));
      }
      if (minR !== undefined) {
        list = list.filter((s) => s.rating >= Number(minR));
      }

      return list;
    },
    []
  );

  const computeDynamicCategories = useCallback(
    (baseList) => {
      return DEFAULT_CATEGORIES.map((cat) => {
        if (cat.slug === "all" || cat.name.toLowerCase() === "all services") {
          return { ...cat, count: baseList.length };
        }
        const catLower = cat.name.toLowerCase();
        const slugLower = (cat.slug || "").toLowerCase();
        const count = baseList.filter(
          (s) =>
            s.category.toLowerCase() === catLower ||
            s.title.toLowerCase() === catLower ||
            s.slug.toLowerCase() === slugLower
        ).length;
        return { ...cat, count };
      });
    },
    []
  );

  const applyLocalFilterFallback = useCallback(
    ({ category, location, minP, maxP, minR, sort, search }) => {
      const baseList = getBaseFilteredCatalog({ location, minP, maxP, minR, search });
      let list = [...baseList];
      const normCat = String(category || "").trim().toLowerCase();

      if (normCat && normCat !== "all" && normCat !== "all services") {
        list = list.filter(
          (s) =>
            s.category.toLowerCase() === normCat ||
            s.title.toLowerCase() === normCat ||
            s.slug.toLowerCase() === normCat ||
            (s.taskCategory || "").toLowerCase() === normCat
        );
      }

      if (sort === "rating_desc") {
        list.sort((a, b) => b.rating - a.rating || b.reviewsCount - a.reviewsCount);
      } else if (sort === "price_asc") {
        list.sort((a, b) => a.price - b.price);
      } else if (sort === "price_desc") {
        list.sort((a, b) => b.price - a.price);
      } else {
        list.sort((a, b) => a.relevanceOrder - b.relevanceOrder);
      }

      return list;
    },
    [getBaseFilteredCatalog]
  );

  // Fetch filtered services from backend whenever any filter changes
  useEffect(() => {
    let isMounted = true;
    const timer = setTimeout(async () => {
      setLoading(true);
      const baseCatalog = getBaseFilteredCatalog({
        location: locationFilter,
        minP: minPrice,
        maxP: maxPrice,
        minR: effectiveMinRating,
        search: searchQuery,
      });
      const fallbackDynamicCategories = computeDynamicCategories(baseCatalog);

      try {
        const apiCategory =
          !selectedCategory ||
          selectedCategory.toLowerCase() === "all" ||
          selectedCategory.toLowerCase() === "all services"
            ? "all"
            : selectedCategory;

        const data = await getFilteredServices({
          category: apiCategory || undefined,
          location: locationFilter.trim() || undefined,
          minPrice,
          maxPrice,
          minRating: effectiveMinRating,
          sortBy,
          search: searchQuery || undefined,
        });

        if (!isMounted) return;

        if (data && Array.isArray(data.services)) {
          setServices(data.services);
          if (Array.isArray(data.categories) && data.categories.length > 0) {
            setCategories(data.categories);
          } else {
            setCategories(fallbackDynamicCategories);
          }
        } else {
          setServices(
            applyLocalFilterFallback({
              category: apiCategory,
              location: locationFilter,
              minP: minPrice,
              maxP: maxPrice,
              minR: effectiveMinRating,
              sort: sortBy,
              search: searchQuery,
            })
          );
          setCategories(fallbackDynamicCategories);
        }
      } catch (err) {
        if (!isMounted) return;
        setServices(
          applyLocalFilterFallback({
            category: selectedCategory,
            location: locationFilter,
            minP: minPrice,
            maxP: maxPrice,
            minR: effectiveMinRating,
            sort: sortBy,
            search: searchQuery,
          })
        );
        setCategories(fallbackDynamicCategories);
      } finally {
        if (isMounted) setLoading(false);
      }
    }, 150);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [
    selectedCategory,
    locationFilter,
    minPrice,
    maxPrice,
    effectiveMinRating,
    sortBy,
    searchQuery,
    refreshTick,
    applyLocalFilterFallback,
    getBaseFilteredCatalog,
    computeDynamicCategories,
  ]);

  const handleCategoryClick = (categoryName) => {
    if (categoryName.toLowerCase() === "all services" || categoryName.toLowerCase() === "all") {
      setSelectedCategory("all");
      return;
    }
    setSelectedCategory((prev) =>
      prev.toLowerCase() === categoryName.toLowerCase() ? "" : categoryName
    );
  };

  const toggleRatingFilter = (ratingValue) => {
    setSelectedRatings((prev) =>
      prev.includes(ratingValue)
        ? prev.filter((r) => r !== ratingValue)
        : [...prev, ratingValue]
    );
  };

  const handleClearAllFilters = () => {
    setSelectedCategory("");
    setLocationFilter("");
    setMinPrice(100);
    setMaxPrice(1000);
    setSelectedRatings([]);
    setSortBy("relevance");
    setSearchQuery("");
  };

  const toggleFavorite = (serviceId) => {
    setFavorites((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const minPercent = ((minPrice - 100) / (1000 - 100)) * 100;
  const maxPercent = ((maxPrice - 100) / (1000 - 100)) * 100;

  return (
    <div className="min-h-screen bg-[#060d1d] bg-[radial-gradient(ellipse_80%_60%_at_50%_-15%,rgba(29,78,216,0.18),transparent)] text-slate-100">
      <div className="mx-auto max-w-[1360px] px-4 pb-16 pt-6 sm:px-6">
        {/* Top Hero Banner */}
        <section className="mb-6 flex flex-col justify-between gap-6 pt-1 lg:flex-row lg:items-center">
          <div className="max-w-xl">
            <h1 className="text-[28px] font-extrabold leading-[1.18] tracking-tight text-white sm:text-[34px]">
              Find trusted help for
              <span className="block text-[#22c58b]">everyday tasks</span>
            </h1>
            <p className="mt-2.5 text-[13.5px] text-slate-300/90">
              From home cleaning to driver services, get reliable help from verified local helpers.
            </p>
          </div>

          {/* 4 Circular Feature Highlights */}
          <div className="grid grid-cols-2 gap-6 sm:flex sm:items-center sm:gap-10 lg:gap-12">
            <HeroFeatureBadge
              icon={
                <svg className="h-4 w-4 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              }
              line1="Verified"
              line2="Helpers"
            />
            <HeroFeatureBadge
              icon={
                <svg className="h-4 w-4 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              }
              line1="Safe & Secure"
              line2="Payments"
            />
            <HeroFeatureBadge
              icon={
                <svg className="h-4 w-4 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              }
              line1="Local"
              line2="Support"
            />
            <HeroFeatureBadge
              icon={
                <svg className="h-4 w-4 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              }
              line1="Fast"
              line2="Booking"
            />
          </div>
        </section>

        {/* Main 2-Column Layout: Left Sidebar + Right Services Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[255px_1fr]">
          {/* Left Sidebar */}
          <aside className="space-y-4">
            {/* Categories Card */}
            <div className="rounded-2xl border border-[#162542] bg-[#0a1326]/95 p-4 shadow-xl">
              <div className="mb-3 flex items-center gap-2.5 px-1">
                <svg className="h-4 w-4 text-slate-200" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="3" y="3" width="7.5" height="7.5" rx="1.5" />
                  <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" />
                  <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" />
                  <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" />
                </svg>
                <h2 className="text-[15px] font-bold text-white">Categories</h2>
              </div>

              <div className="space-y-1">
                {categories.map((cat) => {
                  const isAllItem =
                    cat.slug === "all" || cat.name.toLowerCase() === "all services";
                  const isSelected = isAllItem
                    ? !selectedCategory ||
                      selectedCategory.toLowerCase() === "all" ||
                      selectedCategory.toLowerCase() === "all services"
                    : selectedCategory.toLowerCase() === cat.name.toLowerCase() ||
                      selectedCategory.toLowerCase() === (cat.slug || "").toLowerCase();

                  return (
                    <button
                      key={cat.slug || cat.name}
                      type="button"
                      onClick={() => handleCategoryClick(cat.name)}
                      className={`group flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-[13px] transition ${
                        isSelected
                          ? "bg-[#1d6bf3] font-semibold text-white shadow-md shadow-blue-600/25"
                          : "font-medium text-slate-300 hover:bg-[#111e38] hover:text-white"
                      }`}
                    >
                      <span className="flex items-center gap-2.5 truncate">
                        <span
                          className={`flex h-4 w-4 items-center justify-center ${
                            isSelected
                              ? "text-white"
                              : "text-slate-400 group-hover:text-slate-200"
                          }`}
                        >
                          <CategorySidebarIcon type={cat.iconType || cat.slug} />
                        </span>
                        <span className="truncate">{cat.name}</span>
                      </span>
                      <span
                        className={`text-xs font-medium ${
                          isSelected ? "text-white" : "text-slate-400"
                        }`}
                      >
                        {cat.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Filter Card */}
            <div className="rounded-2xl border border-[#162542] bg-[#0a1326]/95 p-4 shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg
                    className="h-4 w-4 text-slate-200"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                    />
                  </svg>
                  <h2 className="text-[15px] font-bold text-white">Filter</h2>
                </div>
                <button
                  type="button"
                  onClick={handleClearAllFilters}
                  className="text-xs font-medium text-[#3b82f6] transition hover:text-blue-400"
                >
                  Clear all
                </button>
              </div>

              {/* Location Input */}
              <div className="mb-5">
                <label className="mb-2 block text-xs font-semibold text-slate-200">
                  Location
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <svg
                      className="h-3.5 w-3.5"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                  <input
                    type="text"
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    placeholder="Enter location"
                    className="w-full rounded-lg border border-[#1c2f52] bg-[#0d182e] py-2 pl-8 pr-7 text-xs text-slate-100 placeholder:text-slate-400 focus:border-[#3b82f6] focus:outline-none"
                  />
                  {locationFilter && (
                    <button
                      type="button"
                      onClick={() => setLocationFilter("")}
                      aria-label="Clear location"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>

              {/* Price Range Slider */}
              <div className="mb-5">
                <label className="mb-3 block text-xs font-semibold text-slate-200">
                  Price Range
                </label>

                <div className="relative h-5 flex items-center">
                  {/* Track Background */}
                  <div className="h-1.5 w-full rounded-full bg-[#1c2d4d]" />
                  {/* Active Selected Track */}
                  <div
                    className="absolute h-1.5 rounded-full bg-[#2563eb]"
                    style={{
                      left: `${minPercent}%`,
                      width: `${Math.max(0, maxPercent - minPercent)}%`,
                    }}
                  />

                  {/* Min Range Input */}
                  <input
                    type="range"
                    min={100}
                    max={1000}
                    step={50}
                    value={minPrice}
                    onChange={(e) => {
                      const val = Math.min(Number(e.target.value), maxPrice - 50);
                      setMinPrice(val);
                    }}
                    className="pointer-events-none absolute inset-0 h-full w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]: cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#60a5fa] [&::-webkit-slider-thumb]:bg-[#2563eb] [&::-webkit-slider-thumb]:shadow"
                  />

                  {/* Max Range Input */}
                  <input
                    type="range"
                    min={100}
                    max={1000}
                    step={50}
                    value={maxPrice}
                    onChange={(e) => {
                      const val = Math.max(Number(e.target.value), minPrice + 50);
                      setMaxPrice(val);
                    }}
                    className="pointer-events-none absolute inset-0 h-full w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#60a5fa] [&::-webkit-slider-thumb]:bg-[#2563eb] [&::-webkit-slider-thumb]:shadow"
                  />
                </div>

                <div className="mt-2 flex items-center justify-between text-xs font-medium text-slate-300">
                  <span>₹{minPrice}</span>
                  <span>₹{maxPrice === 1000 ? "1000+" : maxPrice}</span>
                </div>
              </div>

              {/* Rating Checkboxes */}
              <div>
                <label className="mb-2.5 block text-xs font-semibold text-slate-200">
                  Rating
                </label>
                <div className="space-y-2">
                  {[4.5, 4.0].map((ratingVal) => {
                    const checked = selectedRatings.includes(ratingVal);
                    return (
                      <label
                        key={ratingVal}
                        className="flex cursor-pointer items-center gap-2.5 text-xs text-slate-300 select-none hover:text-white"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleRatingFilter(ratingVal)}
                          className="sr-only"
                        />
                        <span
                          className={`flex h-4 w-4 items-center justify-center rounded border transition ${
                            checked
                              ? "border-[#2563eb] bg-[#2563eb] text-white"
                              : "border-[#2a3f66] bg-[#0d182e]"
                          }`}
                        >
                          {checked && (
                            <svg
                              className="h-3 w-3"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={3}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          )}
                        </span>
                        <span className="font-medium">{ratingVal.toFixed(1)}+</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          </aside>

          {/* Right Main Content */}
          <div>
            {/* Header Row */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-[18px] font-bold text-white">
                  Available Services{" "}
                  <span className="ml-1 text-sm font-medium text-slate-400">
                    ({services.length})
                  </span>
                </h2>
                {selectedCategory && selectedCategory !== "all" && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/15 border border-blue-500/30 px-3 py-0.5 text-xs font-medium text-blue-300">
                    {selectedCategory}
                    <button
                      type="button"
                      onClick={() => setSelectedCategory("")}
                      className="hover:text-white"
                    >
                      ×
                    </button>
                  </span>
                )}
                {locationFilter.trim() && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 px-3 py-0.5 text-xs font-medium text-indigo-300">
                    📍 {locationFilter.trim()}
                    <button
                      type="button"
                      onClick={() => setLocationFilter("")}
                      className="hover:text-white"
                    >
                      ×
                    </button>
                  </span>
                )}
                {searchQuery && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-0.5 text-xs font-medium text-emerald-300">
                    &ldquo;{searchQuery}&rdquo;
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery("");
                        if (typeof window !== "undefined") {
                          window.dispatchEvent(
                            new CustomEvent("hirebuddy:search-change", { detail: "" })
                          );
                        }
                      }}
                      className="hover:text-white"
                    >
                      ×
                    </button>
                  </span>
                )}
              </div>

              {/* Sort Dropdown */}
              <div className="relative">
                <select
                  aria-label="Sort services"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none rounded-lg border border-[#1b2c4d] bg-[#0a1326] py-1.5 pl-3.5 pr-8 text-xs font-medium text-slate-200 focus:border-blue-500 focus:outline-none cursor-pointer"
                >
                  <option value="relevance">Sort by: Relevance</option>
                  <option value="rating_desc">Sort by: Rating</option>
                  <option value="price_asc">Sort by: Price: Low to High</option>
                  <option value="price_desc">Sort by: Price: High to Low</option>
                </select>
                <svg
                  className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Services Grid */}
            {loading ? (
              <ServiceGridCardShimmer count={6} />
            ) : services.length === 0 ? (
              <div className="rounded-2xl border border-[#162542] bg-[#0a1326]/90 p-12 text-center">
                <p className="text-base font-semibold text-white">
                  No services match your active filters
                </p>
                <p className="mt-1.5 text-xs text-slate-400">
                  Try adjusting the location, price range, rating, or category filter to see more services.
                </p>
                <button
                  type="button"
                  onClick={handleClearAllFilters}
                  className="mt-4 rounded-lg bg-[#1d6bf3] px-4 py-2 text-xs font-semibold text-white hover:bg-blue-600 transition"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {services.map((service) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    isFavorite={favorites.includes(service.id)}
                    onToggleFavorite={() => toggleFavorite(service.id)}
                    onViewDetails={() => setDetailService(service)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* View Details Modal */}
      {detailService && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setDetailService(null)}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-2xl border border-[#1e3156] bg-[#0a1326] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-44 w-full">
              <img
                src={detailService.image}
                alt={detailService.title}
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => setDetailService(null)}
                className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-slate-950/75 text-slate-200 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-white">{detailService.title}</h3>
                  {detailService.verified && (
                    <span className="rounded-md bg-[#0d6e52]/90 px-2 py-0.5 text-[10px] font-semibold text-[#34d399]">
                      Verified
                    </span>
                  )}
                </div>
                <span className="text-sm font-bold text-emerald-400">
                  from ₹{detailService.price}/{detailService.priceUnit || "day"}
                </span>
              </div>

              <div className="mt-2 flex items-center gap-3 text-xs text-slate-300">
                <span className="flex items-center gap-1">
                  <span className="text-amber-400">★</span>
                  <strong className="text-white">{detailService.rating}</strong> (
                  {detailService.reviewsCount} reviews)
                </span>
                <span>•</span>
                <span>📍 {detailService.location}</span>
              </div>

              <p className="mt-3 text-xs leading-relaxed text-slate-300">
                {detailService.description}
              </p>

              {Array.isArray(detailService.subServices) &&
                detailService.subServices.length > 0 && (
                  <div className="mt-4">
                    <p className="mb-2 text-xs font-semibold text-slate-200">
                      Included Services:
                    </p>
                    <ul className="grid grid-cols-1 gap-1.5 text-xs text-slate-300">
                      {detailService.subServices.map((item) => (
                        <li key={item} className="flex items-center gap-2">
                          <span className="text-emerald-400">✓</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

              <div className="mt-5 flex items-center gap-3">
                <Link
                  href={`/dashboard/helpers?category=${encodeURIComponent(
                    detailService.taskCategory || detailService.title
                  )}`}
                  className="flex-1 rounded-lg border border-[#243860] bg-[#0f1c36] py-2.5 text-center text-xs font-semibold text-slate-200 hover:bg-[#162749]"
                >
                  Browse Helpers ({detailService.availableHelpers || 5})
                </Link>
                <Link
                  href={`/dashboard/create-task?category=${encodeURIComponent(
                    detailService.taskCategory || detailService.title
                  )}&service=${encodeURIComponent(detailService.title)}`}
                  className="flex-1 rounded-lg bg-[#2fa97c] py-2.5 text-center text-xs font-semibold text-white hover:bg-[#27946b]"
                >
                  Book Now
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Subcomponents ---------- */

function HeroFeatureBadge({ icon, line1, line2 }) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full border border-[#1e3152] bg-[#0c172c] shadow-inner">
        {icon}
      </div>
      <span className="text-[11.5px] font-medium leading-tight text-slate-200">
        {line1}
      </span>
      <span className="text-[11.5px] font-medium leading-tight text-slate-300">
        {line2}
      </span>
    </div>
  );
}

function ServiceCard({ service, isFavorite, onToggleFavorite, onViewDetails }) {
  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-[#162645] bg-[#0b1528]/95 shadow-lg transition duration-200 hover:-translate-y-0.5 hover:border-[#254175]">
      {/* Top Image Banner */}
      <div className="relative h-[126px] w-full overflow-hidden">
        <img
          src={service.image}
          alt={service.title}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <div className=" inset-0 bg-gradient-to-t from-[#0b1528] via-transparent to-transparent opacity-65" />

        {/* Favorite Heart Button */}
        <button
          type="button"
          aria-label="Save service"
          onClick={onToggleFavorite}
          className="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-slate-950/60 text-white backdrop-blur-sm transition hover:bg-slate-900"
        >
          <svg
            className={`h-4 w-4 ${
              isFavorite ? "fill-rose-500 text-rose-500" : "fill-none text-white"
            }`}
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.9}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        </button>
      </div>

      {/* Card Body */}
      <div className="relative flex flex-1 flex-col px-4 pb-4 pt-2">
        {/* Overlapping Category Icon Badge */}
        <div className="-mt-6 mb-2">
          <ServiceCategoryBadge type={service.iconType} />
        </div>

        {/* Title & Verified Pill */}
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-[15.5px] font-bold text-white leading-snug">
            {service.title}
          </h3>
          {service.verified && (
            <span className="rounded-md bg-[#0d6e52]/90 px-2 py-0.5 text-[10px] font-semibold text-[#34d399]">
              Verified
            </span>
          )}
        </div>

        {/* Rating */}
        <div className="mt-1.5 flex items-center gap-1.5 text-xs">
          <span className="text-amber-400 text-sm leading-none">★</span>
          <span className="font-bold text-white">{service.rating}</span>
          <span className="text-slate-400">({service.reviewsCount} reviews)</span>
        </div>

        {/* Location */}
        <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-300">
          <svg
            className="h-3.5 w-3.5 shrink-0 text-slate-400"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z"
              clipRule="evenodd"
            />
          </svg>
          <span className="truncate">{service.location}</span>
        </div>

        {/* Description */}
        <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-300/90">
          {service.description}
        </p>

        {/* Price */}
        <div className="mt-3 pt-1 text-xs text-slate-300">
          from{" "}
          <span className="text-[14.5px] font-extrabold text-white">
            ₹{service.price}/{service.priceUnit || "day"}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="mt-3 grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={onViewDetails}
            className="rounded-lg border border-[#1e3154] bg-[#0b162c] py-2 text-xs font-semibold text-slate-200 transition hover:border-slate-500 hover:bg-[#132240] hover:text-white"
          >
            View Details
          </button>
          <Link
            href={`/dashboard/create-task?category=${encodeURIComponent(
              service.taskCategory || service.title
            )}&service=${encodeURIComponent(service.title)}`}
            className="rounded-lg bg-[#34b27b] py-2 text-center text-xs font-bold text-white shadow-md shadow-emerald-950/30 transition hover:bg-[#2ca16d]"
          >
            Book Now
          </Link>
        </div>
      </div>
    </div>
  );
}

function ServiceCategoryBadge({ type }) {
  switch (type) {
    case "cleaning":
      return (
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2563eb] text-white shadow-md border-2 border-[#0b1528]">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
        </div>
      );
    case "driver":
      return (
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#6366f1] text-white shadow-md border-2 border-[#0b1528]">
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.85 7h10.29l1.08 3.11H5.77L6.85 7zM19 17H5v-5h14v5z" />
            <circle cx="7.5" cy="14.5" r="1.5" />
            <circle cx="16.5" cy="14.5" r="1.5" />
          </svg>
        </div>
      );
    case "delivery":
      return (
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#d97706] text-white shadow-md border-2 border-[#0b1528]">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
      );
    case "plumbing":
      return (
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#34b27b] text-white shadow-md border-2 border-[#0b1528]">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          </svg>
        </div>
      );
    case "electrical":
      return (
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#6366f1] text-white shadow-md border-2 border-[#0b1528]">
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M13 2L3 14h7v8l10-12h-7V2z" />
          </svg>
        </div>
      );
    case "furniture":
      return (
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ec4899] text-white shadow-md border-2 border-[#0b1528]">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
          </svg>
        </div>
      );
    default:
      return (
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2563eb] text-white shadow-md border-2 border-[#0b1528]">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      );
  }
}

function CategorySidebarIcon({ type }) {
  switch (type) {
    case "all":
      return (
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M4 6a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm0 8a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4z" />
        </svg>
      );
    case "cleaning":
    case "home-cleaning":
      return (
        <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
        </svg>
      );
    case "driver":
    case "driver-services":
      return (
        <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" />
        </svg>
      );
    case "delivery":
    case "delivery-pickup":
      return (
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      );
    case "plumbing":
      return (
        <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z" />
        </svg>
      );
    case "electrical":
      return (
        <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M7 2v11h3v9l7-12h-4l4-8z" />
        </svg>
      );
    case "furniture":
    case "furniture-assembly":
      return (
        <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z" />
        </svg>
      );
    case "cooking":
      return (
        <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z" />
        </svg>
      );
    case "personal-care":
      return (
        <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
        </svg>
      );
    default:
      return (
        <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="6" cy="12" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="18" cy="12" r="2" />
        </svg>
      );
  }
}
