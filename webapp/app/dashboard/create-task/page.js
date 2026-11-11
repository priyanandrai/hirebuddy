"use client";

import { Suspense, useEffect, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { createTask, getTaskCategories, createTaskCategory } from "@/app/components/services/task.service";
import { getHelperByID, getHelpers, getUserProfile } from "@/app/components/services/user.service";
import CustomSelect from "@/app/components/reuseable/CustomSelect";
import { MapPin, Navigation, UserCheck, Calendar, Plus, Users, Sparkles, CheckCircle2 } from "lucide-react";

const SERVICE_LOCATIONS = [
  "Modipuram, Meerut",
  "Shastri Nagar, Meerut",
  "Kankerkhera, Meerut",
  "Pallavpuram, Meerut",
  "Saket, Meerut",
  "Noida, UP",
  "Greater Noida, UP",
  "Ghaziabad, UP",
  "Delhi NCR",
];

const TIME_SLOTS = [
  "08:00 AM - 10:00 AM",
  "10:00 AM - 12:00 PM",
  "12:00 PM - 02:00 PM",
  "03:00 PM - 05:00 PM",
  "05:00 PM - 07:00 PM",
];

function getTodayLocalDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function CreateTaskPage() {
  return (
    <Suspense fallback={<CreateTaskFallback />}>
      <CreateTaskContent />
    </Suspense>
  );
}

function CreateTaskContent() {
  const searchParams = useSearchParams();
  const helperId = searchParams.get("helper");
  const prefilledCategory = searchParams.get("category") || "";
  const prefilledService = searchParams.get("service") || "";
  const prefilledPrice = searchParams.get("price") || "";
  const prefilledHelperName = searchParams.get("helperName") || "";
  const rawSelectedServicesParam = searchParams.get("selectedServices") || "";
  const initialSelectedServices = useMemo(() => {
    if (!rawSelectedServicesParam) return [];
    try {
      const parsed = JSON.parse(rawSelectedServicesParam);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [rawSelectedServicesParam]);

  const isBookNow = Boolean(helperId);
  const { data: session } = useSession();
  const router = useRouter();

  const minDate = useMemo(() => getTodayLocalDateString(), []);

  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [showAddCategoryBox, setShowAddCategoryBox] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState("");
  const [profileLocation, setProfileLocation] = useState("");
  const [detectingGps, setDetectingGps] = useState(false);
  const [selectedServices, setSelectedServices] = useState(initialSelectedServices);

  const [form, setForm] = useState({
    title: prefilledService || "",
    category: prefilledCategory,
    description: prefilledService
      ? `Need verified ${prefilledService} assistance at my location.`
      : "",
    location: "",
    latitude: null,
    longitude: null,
    date: getTodayLocalDateString(),
    timeSlot: "10:00 AM - 12:00 PM",
    budget: prefilledPrice || "",
    helperId: helperId || null,
  });

  // Load user's saved location from profile (localStorage + API)
  useEffect(() => {
    const extractLocationFromUser = (u) => {
      if (!u) return "";
      const parts = [u.address, u.city].map((s) => (s || "").trim()).filter(Boolean);
      if (parts.length > 0) {
        // Avoid duplicating if address already contains city
        if (
          parts.length === 2 &&
          parts[0].toLowerCase().includes(parts[1].toLowerCase())
        ) {
          return parts[0];
        }
        return parts.join(", ");
      }
      return (u.location || "").trim();
    };

    try {
      const storedRaw = localStorage.getItem("user");
      if (storedRaw) {
        const parsed = JSON.parse(storedRaw);
        const loc = extractLocationFromUser(parsed);
        if (loc) {
          setProfileLocation(loc);
          setForm((prev) => ({ ...prev, location: prev.location || loc }));
        }
      }
    } catch {
      // ignore parse errors
    }

    const token = session?.token || localStorage.getItem("token");
    if (token) {
      getUserProfile()
        .then((res) => {
          const u = res?.user || res?.data || res;
          const loc = extractLocationFromUser(u);
          if (loc) {
            setProfileLocation(loc);
            setForm((prev) => ({ ...prev, location: prev.location || loc }));
          }
        })
        .catch(() => {
          // ignore profile fetch error
        });
    }
  }, [session]);

  const handleDetectCurrentLocation = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const resp = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await resp.json();
          const addr = data?.address || {};
          const area =
            addr.suburb ||
            addr.neighbourhood ||
            addr.residential ||
            addr.village ||
            addr.town ||
            "";
          const city =
            addr.city || addr.state_district || addr.county || addr.state || "";
          const formatted = [area, city].filter(Boolean).join(", ");
          const finalLoc =
            formatted ||
            data?.display_name?.split(",").slice(0, 2).join(", ") ||
            `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          setForm((prev) => ({
            ...prev,
            location: finalLoc,
            latitude,
            longitude,
          }));
        } catch {
          setForm((prev) => ({
            ...prev,
            location: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
            latitude,
            longitude,
          }));
        } finally {
          setDetectingGps(false);
        }
      },
      () => {
        setDetectingGps(false);
        alert("Unable to retrieve your current location. Please select a location from the list.");
      },
      { timeout: 8000 }
    );
  };

  // Fetch categories from DB
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const res = await getTaskCategories();
      const list = Array.isArray(res) ? res : res?.data || [];
      setCategories(list);
    } catch (error) {
      console.error("Failed to fetch categories from DB", error);
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleAddNewCategory = async (rawName) => {
    const cleanName = String(rawName || "").trim();
    if (!cleanName) return;

    setCreatingCategory(true);
    try {
      const token = session?.token || (typeof window !== "undefined" ? localStorage.getItem("token") : null);
      const created = await createTaskCategory({ name: cleanName }, token);
      const savedCategory = created?.data || created || { name: cleanName };
      const resolvedName = savedCategory.name || cleanName;

      // Refresh full category list from DB so order and metadata stay in sync
      await fetchCategories();
      setForm((prev) => ({ ...prev, category: resolvedName }));
      setNewCategoryInput("");
      setShowAddCategoryBox(false);

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("categoriesUpdated"));
      }
    } catch (err) {
      console.error("Failed to add category to DB:", err);
      alert(err.message || "Failed to save new category");
    } finally {
      setCreatingCategory(false);
    }
  };

  // Sync prefilled category once categories are loaded
  useEffect(() => {
    if (prefilledCategory && categories.length > 0) {
      const match = categories.find(
        (c) =>
          (c.name && c.name.toLowerCase() === prefilledCategory.toLowerCase()) ||
          (c.slug && c.slug.toLowerCase() === prefilledCategory.toLowerCase())
      );
      if (match) {
        setForm((prev) => ({ ...prev, category: match.name }));
      }
    }
  }, [prefilledCategory, categories]);

  // Fetch available Buddies so customer can optionally pick a Buddy directly on Create Task
  const [selectedHelper, setSelectedHelper] = useState(
    helperId
      ? {
          id: helperId,
          name: prefilledHelperName || "Selected Service Buddy",
          averageRating: 4.8,
          skills: prefilledService || prefilledCategory || "Verified Service Partner",
          city: "Meerut",
        }
      : null
  );
  const [availableBuddies, setAvailableBuddies] = useState([]);
  const [assignmentMode, setAssignmentMode] = useState(
    helperId ? "DIRECT" : "MARKETPLACE"
  );

  useEffect(() => {
    getHelpers()
      .then((res) => {
        const list = Array.isArray(res) ? res : res?.data || res?.helpers || [];
        setAvailableBuddies(list);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (helperId) {
      setAssignmentMode("DIRECT");
      fetchHelpers(helperId);
    } else {
      setAssignmentMode("MARKETPLACE");
      setSelectedHelper(null);
      setForm((prev) => ({ ...prev, helperId: null }));
    }
  }, [helperId]);

  const fetchHelpers = async (id) => {
    try {
      const res = await getHelperByID(id);
      const data = res?.data || res;
      if (data && data.id) {
        setSelectedHelper(data);
        setForm((prev) => ({ ...prev, helperId: data.id }));
      }
    } catch (error) {
      console.error("Failed to fetch buddy", error);
    }
  };

  const filteredBuddies = useMemo(() => {
    if (!availableBuddies.length) return [];
    const cat = String(form.category || prefilledCategory || "").toLowerCase().trim();
    if (!cat) return availableBuddies.slice(0, 6);
    const matching = availableBuddies.filter((b) => {
      const skillText = Array.isArray(b.skills)
        ? b.skills.join(" ")
        : String(b.skills || b.service || "");
      return skillText.toLowerCase().includes(cat);
    });
    return (matching.length > 0 ? matching : availableBuddies).slice(0, 6);
  }, [availableBuddies, form.category, prefilledCategory]);

  function handleChange(e) {
    const { name, value } = e.target;
    if (name === "date" && value && value < minDate) {
      alert("Previous dates are disabled. Please select today or a future date.");
      setForm({ ...form, date: minDate });
      return;
    }
    setForm({ ...form, [name]: value });
  }

  async function handleFileChange(e) {
    const selected = Array.from(e.target.files || []);
    const encoded = await Promise.all(
      selected.slice(0, 4).map(
        (file) =>
          new Promise((resolve) => {
            if (file.size <= 350 * 1024 && file.type.startsWith("image/")) {
              const reader = new FileReader();
              reader.onload = () =>
                resolve({
                  name: file.name,
                  type: file.type,
                  size: file.size,
                  url: typeof reader.result === "string" ? reader.result : null,
                });
              reader.onerror = () =>
                resolve({ name: file.name, type: file.type, size: file.size, url: null });
              reader.readAsDataURL(file);
            } else {
              resolve({ name: file.name, type: file.type, size: file.size, url: null });
            }
          })
      )
    );
    setFiles(encoded);
  }

  function handleSubmit(e) {
    e.preventDefault();

    const token = session?.token || localStorage.getItem("token");
    if (!token) {
      alert("Please login to create a task");
      return;
    }

    if (!form.category) {
      alert("Please select a task category");
      return;
    }

    if (!form.location || !form.location.trim()) {
      alert("Please select or enter a location");
      return;
    }

    if (form.date && form.date < minDate) {
      alert("Previous dates cannot be selected. Please choose today or a future date.");
      return;
    }

    setLoading(true);

    const isDirect = Boolean(form.helperId) && assignmentMode === "DIRECT";
    const firstImage = files.find((f) => f?.url && String(f.url).length < 950)?.url || null;
    const payload = {
      title: form.title,
      category: form.category,
      description: form.description,
      location: form.location,
      latitude: form.latitude,
      longitude: form.longitude,
      budget: Number(form.budget),
      preferredAt: form.date,
      timeSlot: form.timeSlot,
      image: firstImage,
      attachments: files.length > 0 ? files : null,
      helperId: isDirect ? form.helperId : null,
      bookNow: isDirect,
      selectedServices: selectedServices.length > 0 ? selectedServices : null,
    };

    createTask(payload, token)
      .then(() => {
        alert(
          isDirect
            ? `Task booked! ${
                selectedHelper?.name || "Your selected Buddy"
              } has been directly assigned to your task.`
            : "Task posted! All verified Buddies can now see your task on their dashboard and apply/accept it."
        );
        router.push("/dashboard/my-tasks");
      })
      .catch((err) => {
        console.error("Create task failed", err);
        alert(err.message || "Failed to create task");
      })
      .finally(() => {
        setLoading(false);
      });
  }

  const helperOfferings = useMemo(() => {
    const raw = selectedHelper?.serviceOfferings;
    if (Array.isArray(raw) && raw.length > 0) {
      return raw.map((item, idx) => ({
        id: item.id || `opt-${idx}`,
        category: item.category || form.category || "Service",
        title: item.title || item.name || "Service Option",
        description: item.description || "",
        priceRupees:
          Number(item.priceRupees) ||
          (item.pricePaise ? Math.round(Number(item.pricePaise) / 100) : 200),
        pricePaise:
          Number(item.pricePaise) ||
          Math.round((Number(item.priceRupees) || 200) * 100),
        unit: item.unit || "per service",
      }));
    }
    return [];
  }, [selectedHelper, form.category]);

  const syncFormWithSelectedServices = (nextList) => {
    setSelectedServices(nextList);
    if (nextList.length === 0) return;

    const totalRupees = nextList.reduce(
      (sum, item) => sum + (Number(item.priceRupees) || 0) * (Number(item.quantity) || 1),
      0
    );
    const primaryCat = nextList[0]?.category || form.category;
    const summaryTitle =
      nextList.length === 1
        ? `${nextList[0].title}${nextList[0].quantity > 1 ? ` (x${nextList[0].quantity})` : ""}`
        : `${nextList[0].title} + ${nextList.length - 1} more option${nextList.length > 2 ? "s" : ""}`;
    const itemizedLines = nextList
      .map(
        (item) =>
          `• ${item.title} [${item.category || primaryCat}] — ₹${item.priceRupees} ${
            item.unit || "per service"
          } × ${item.quantity || 1} = ₹${(Number(item.priceRupees) || 0) * (Number(item.quantity) || 1)}`
      )
      .join("\n");

    setForm((prev) => ({
      ...prev,
      title: summaryTitle,
      category: primaryCat || prev.category,
      budget: String(totalRupees),
      description: `Selected Service Options:\n${itemizedLines}`,
    }));
  };

  const toggleHelperOffering = (offering) => {
    const exists = selectedServices.find((s) => s.id === offering.id || s.title === offering.title);
    if (exists) {
      const next = selectedServices.filter((s) => s.id !== offering.id && s.title !== offering.title);
      syncFormWithSelectedServices(next);
    } else {
      const next = [
        ...selectedServices,
        {
          id: offering.id,
          category: offering.category,
          title: offering.title,
          priceRupees: offering.priceRupees,
          pricePaise: offering.pricePaise,
          unit: offering.unit,
          quantity: 1,
        },
      ];
      syncFormWithSelectedServices(next);
    }
  };

  const updateOfferingQuantity = (offeringId, delta) => {
    const next = selectedServices
      .map((item) => {
        if (item.id !== offeringId && item.title !== offeringId) return item;
        const nextQty = Math.max(1, Math.min(50, (Number(item.quantity) || 1) + delta));
        return { ...item, quantity: nextQty };
      });
    syncFormWithSelectedServices(next);
  };


  return (
    <main className="min-h-screen bg-white dark:bg-slate-950 px-6 py-8 text-slate-900 dark:text-slate-100">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Create a New Task</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Add task details, use your profile location or GPS, and either broadcast to nearby Buddies or pick a specific Buddy.
          </p>
        </div>

        {!selectedHelper && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-blue-500/30 bg-blue-500/10 p-4 shadow-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="text-xs sm:text-sm">
              <p className="font-bold text-slate-900 dark:text-white">
                📢 Open Task for All Buddies (Default)
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                Your task is not locked to a single Buddy by default — all verified Buddies will see your task on their Buddy Dashboard and can apply/accept it immediately.
              </p>
            </div>
          </div>
        )}

        {selectedHelper && (
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">
                {selectedHelper.name?.charAt(0) || "B"}
              </div>
              <div className="text-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                  🔒 Assigned Buddy (Exclusive Direct Booking)
                </p>
                <p className="font-bold text-slate-900 dark:text-white">{selectedHelper.name}</p>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  ⭐ {selectedHelper.averageRating || selectedHelper.rating || 4.8} ·{" "}
                  {Array.isArray(selectedHelper.skills)
                    ? selectedHelper.skills.join(", ")
                    : selectedHelper.skills || "Verified Service Partner"}{" "}
                  · {selectedHelper.city || selectedHelper.location || "Meerut"}
                </p>
                <p className="mt-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                  Only {selectedHelper.name} will be assigned to this task — it will NOT be shown to other Helper Buddies.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedHelper(null);
                setSelectedServices([]);
                setForm((prev) => ({ ...prev, helperId: null }));
                setAssignmentMode("MARKETPLACE");
              }}
              className="rounded-lg border border-emerald-500/30 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20"
            >
              Change / Switch to Open Broadcast
            </button>
          </div>
        )}

        {selectedHelper && helperOfferings.length > 0 && (
          <div className="mb-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  🧾 Select Service Options & Packages from {selectedHelper.name}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Pick one or multiple options (e.g., multiple car wash packages or dry cleaning items) and adjust quantities.
                </p>
              </div>
              {selectedServices.length > 0 && (
                <span className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white">
                  {selectedServices.length} Selected · ₹{form.budget}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {helperOfferings.map((opt) => {
                const picked = selectedServices.find(
                  (s) => s.id === opt.id || s.title === opt.title
                );
                return (
                  <div
                    key={opt.id}
                    onClick={() => toggleHelperOffering(opt)}
                    className={`cursor-pointer rounded-xl border p-3 transition ${
                      picked
                        ? "border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500/30"
                        : "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-emerald-400"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                          {opt.category}
                        </span>
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {opt.title}
                        </p>
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 mt-0.5">
                          ₹{opt.priceRupees}{" "}
                          <span className="font-normal text-slate-500 dark:text-slate-400">
                            / {opt.unit}
                          </span>
                        </p>
                      </div>

                      {picked ? (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-white dark:bg-slate-900 px-1.5 py-0.5"
                        >
                          <button
                            type="button"
                            onClick={() => updateOfferingQuantity(opt.id, -1)}
                            className="px-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-emerald-600"
                          >
                            −
                          </button>
                          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 min-w-[16px] text-center">
                            {picked.quantity || 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateOfferingQuantity(opt.id, 1)}
                            className="px-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-emerald-600"
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <span className="rounded-md border border-slate-300 dark:border-slate-600 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                          + Add
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="rounded-[2rem] border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-6 shadow-md dark:shadow-2xl md:p-8">
          <div className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Task Title</label>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                required
                placeholder="e.g. Buy groceries from local market"
                className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 px-3 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Category
                </label>
                <button
                  type="button"
                  onClick={() => setShowAddCategoryBox((prev) => !prev)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-500 transition"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>{showAddCategoryBox ? "Cancel" : "Add New Category"}</span>
                </button>
              </div>

              {showAddCategoryBox && (
                <div className="mb-3 flex items-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/5 p-2.5">
                  <input
                    type="text"
                    value={newCategoryInput}
                    onChange={(e) => setNewCategoryInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newCategoryInput.trim()) {
                        e.preventDefault();
                        handleAddNewCategory(newCategoryInput);
                      }
                    }}
                    placeholder="Enter new category name (saved to DB)..."
                    className="flex-1 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    disabled={!newCategoryInput.trim() || creatingCategory}
                    onClick={() => handleAddNewCategory(newCategoryInput)}
                    className="rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-500 disabled:opacity-50 transition"
                  >
                    {creatingCategory ? "Saving..." : "Save to DB"}
                  </button>
                </div>
              )}

              <CustomSelect
                name="category"
                value={form.category}
                onChange={(val) => setForm((prev) => ({ ...prev, category: val }))}
                options={categories}
                placeholder={loadingCategories ? "Loading categories from database..." : "Select or add category"}
                disabled={loadingCategories}
                allowCreate={true}
                onCreateOption={handleAddNewCategory}
                creatingOption={creatingCategory}
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Task Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={4}
                required
                placeholder="Explain what needs to be done..."
                className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 px-3 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Attach Images or Files (optional)</label>
              <div className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 px-3 py-3 text-sm text-slate-700 dark:text-slate-200">
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-slate-600 dark:text-slate-200 file:mr-4 file:rounded-full file:border-0 file:bg-slate-700 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-100 hover:file:bg-slate-600"
                />
              </div>
              {files.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {files.map((f, idx) => (
                    <span
                      key={`${f.name}-${idx}`}
                      className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-300"
                    >
                      📎 {f.name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Location
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  {profileLocation && (
                    <button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, location: profileLocation }))}
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition ${
                        form.location === profileLocation
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-500/10 hover:text-emerald-500 border border-gray-200 dark:border-slate-700"
                      }`}
                    >
                      <span>📍</span>
                      {form.location === profileLocation
                        ? `Picked from Profile (${profileLocation})`
                        : `Use Profile Location (${profileLocation})`}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleDetectCurrentLocation}
                    disabled={detectingGps}
                    className="inline-flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 transition hover:bg-blue-500/20 disabled:opacity-50"
                  >
                    <span>🎯</span>
                    {detectingGps ? "Detecting..." : "Use Current GPS"}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <select
                    value={
                      SERVICE_LOCATIONS.includes(form.location) ||
                      (profileLocation && form.location === profileLocation)
                        ? form.location
                        : ""
                    }
                    onChange={(e) => {
                      if (e.target.value) {
                        setForm((prev) => ({ ...prev, location: e.target.value }));
                      }
                    }}
                    className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 px-3 py-3 text-sm text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="">Select location from list...</option>
                    {profileLocation && !SERVICE_LOCATIONS.includes(profileLocation) && (
                      <option value={profileLocation}>
                        📍 {profileLocation} (Profile Location)
                      </option>
                    )}
                    {SERVICE_LOCATIONS.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc === profileLocation ? `📍 ${loc} (Profile)` : loc}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <input
                    name="location"
                    value={form.location}
                    onChange={handleChange}
                    required
                    placeholder="Or enter custom pickup / service location"
                    className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 px-3 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* Quick-select location pills */}
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-medium text-slate-400 mr-1">Quick select:</span>
                {SERVICE_LOCATIONS.slice(0, 5).map((loc) => (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, location: loc }))}
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium transition ${
                      form.location === loc
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    {loc}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Preferred Date
                </label>
                <input
                  type="date"
                  name="date"
                  min={minDate}
                  value={form.date}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 px-3 py-3 text-sm text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  Past dates disabled (min: {minDate})
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Preferred Time Slot
                </label>
                <select
                  name="timeSlot"
                  value={form.timeSlot}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 px-3 py-3 text-sm text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  {TIME_SLOTS.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-slate-400">
                  Shown to your assigned Buddy
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Budget (₹)</label>
                <input
                  type="number"
                  name="budget"
                  value={form.budget}
                  onChange={handleChange}
                  required
                  placeholder="e.g. 500"
                  className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 px-3 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            {/* How Buddy is Picked: Open Broadcast vs Pick a Specific Buddy */}
            <div className="rounded-2xl border border-gray-200 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-800/40 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-800 dark:text-slate-100">
                    How should a Buddy be assigned?
                  </label>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    100% of your task payment goes directly to the Buddy (held safely in Escrow until task completion).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => router.push("/dashboard/helpers")}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Browse All Buddies →
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 mb-3">
                <button
                  type="button"
                  onClick={() => {
                    setAssignmentMode("MARKETPLACE");
                    setSelectedHelper(null);
                    setForm((prev) => ({ ...prev, helperId: null }));
                  }}
                  className={`flex items-start gap-3 rounded-xl border p-3 text-left transition ${
                    assignmentMode === "MARKETPLACE" && !form.helperId
                      ? "border-blue-600 bg-blue-500/10 text-blue-950 dark:text-white"
                      : "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                  <div>
                    <p className="text-xs font-bold">Auto-Broadcast to Nearby Buddies</p>
                    <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                      All verified Buddies in {form.location || "your area"} get notified immediately and can accept.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setAssignmentMode("DIRECT")}
                  className={`flex items-start gap-3 rounded-xl border p-3 text-left transition ${
                    assignmentMode === "DIRECT" || form.helperId
                      ? "border-emerald-600 bg-emerald-500/10 text-emerald-950 dark:text-white"
                      : "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  <Users className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <div>
                    <p className="text-xs font-bold">Pick a Specific Buddy Now</p>
                    <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                      Select a verified Buddy below to send them a direct booking request.
                    </p>
                  </div>
                </button>
              </div>

              {assignmentMode === "DIRECT" && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    Select a verified Buddy {form.category ? `for ${form.category}` : ""}:
                  </p>
                  {filteredBuddies.length === 0 ? (
                    <p className="text-xs text-slate-500">
                      No Buddies loaded yet. You can still post to the open marketplace or{" "}
                      <span
                        onClick={() => router.push("/dashboard/helpers")}
                        className="cursor-pointer font-semibold text-blue-600 underline"
                      >
                        browse the Buddy directory
                      </span>
                      .
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {filteredBuddies.map((b) => {
                        const isPicked = form.helperId === b.id;
                        return (
                          <div
                            key={b.id}
                            onClick={() => {
                              setSelectedHelper(b);
                              setForm((prev) => ({ ...prev, helperId: b.id }));
                            }}
                            className={`flex cursor-pointer items-center justify-between rounded-xl border p-2.5 transition ${
                              isPicked
                                ? "border-emerald-500 bg-emerald-500/15"
                                : "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-emerald-400"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 text-xs font-bold text-slate-800 dark:text-white">
                                {(b.name || "B").charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-xs font-semibold text-slate-900 dark:text-white">
                                  {b.name}
                                </p>
                                <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                                  ⭐ {b.averageRating || 4.8} · {b.skills || "Multi-Service"}
                                </p>
                              </div>
                            </div>
                            {isPicked && (
                              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-emerald-900/30 transition hover:from-emerald-400 hover:to-emerald-500 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading
                  ? "Posting Task..."
                  : form.helperId && assignmentMode === "DIRECT"
                  ? `Book Now & Assign ${selectedHelper?.name || "Selected Buddy"}`
                  : "Post Open Task for All Buddies"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}

function CreateTaskFallback() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-8">
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <p className="text-sm text-gray-600">Loading create task form...</p>
      </div>
    </main>
  );
}
