"use client";

import { Suspense, useEffect, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { createTask, getTaskCategories } from "@/app/components/services/task.service";
import { getHelperByID, getUserProfile } from "@/app/components/services/user.service";
import CustomSelect from "@/app/components/reuseable/CustomSelect";
import { MapPin, Navigation, UserCheck, Calendar } from "lucide-react";

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
  const { data: session } = useSession();
  const router = useRouter();

  const minDate = useMemo(() => getTodayLocalDateString(), []);

  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [profileLocation, setProfileLocation] = useState("");
  const [detectingGps, setDetectingGps] = useState(false);

  const [form, setForm] = useState({
    title: "",
    category: prefilledCategory,
    description: "",
    location: "",
    date: getTodayLocalDateString(),
    budget: "",
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
          setForm((prev) => ({ ...prev, location: finalLoc }));
        } catch {
          setForm((prev) => ({
            ...prev,
            location: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
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

  // Mock helper (later replace with API fetch)
  const [selectedHelper, setSelectedHelper] = useState();
  useEffect(() => {

    if (helperId)
      fetchHelpers(helperId);
  }, [helperId]);

  const fetchHelpers = async (id) => {
    try {
      const res = await getHelperByID(id);
      console.log("fetch helper res", res);
     

      // assuming API returns array   
      setSelectedHelper(res.data || res);
    } catch (error) {
      console.error("Failed to fetch helpers", error);
    } finally {
      // setLoading(false);
    }
  };

  function handleChange(e) {
    const { name, value } = e.target;
    if (name === "date" && value && value < minDate) {
      alert("Previous dates are disabled. Please select today or a future date.");
      setForm({ ...form, date: minDate });
      return;
    }
    setForm({ ...form, [name]: value });
  }

  function handleFileChange(e) {
    setFiles(Array.from(e.target.files));
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

    const payload = {
      title: form.title,
      category: form.category,
      description: form.description,
      location: form.location,
      budget: Number(form.budget),
      preferredAt: form.date,
      helperId: form.helperId,
    };

    createTask(payload, token)
      .then(() => {
        alert(
          helperId
            ? "Task created and sent to selected helper!"
            : "Task created successfully!"
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
  

  return (
    <main className="min-h-screen bg-white dark:bg-slate-950 px-6 py-8 text-slate-900 dark:text-slate-100">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 text-center text-sm text-slate-600 dark:text-slate-300">
          Add task details and optionally hire a specific helper.
        </div>

        {selectedHelper && (
          <div className="mb-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 shadow-lg shadow-emerald-950/20">
            <p className="text-sm font-medium text-emerald-600 dark:text-emerald-300">Hiring this helper</p>
            <div className="mt-2 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-400/15 text-sm font-semibold text-emerald-300">
                {selectedHelper.name?.charAt(0) || "H"}
              </div>
              <div className="text-sm">
                <p className="font-medium text-white">{selectedHelper.name}</p>
                <p className="text-xs text-slate-300">
                  ⭐ {selectedHelper.rating || 4.8} · {selectedHelper.jobs || 0} jobs · {selectedHelper.location || "Local area"}
                </p>
              </div>
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
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Category</label>
              <CustomSelect
                name="category"
                value={form.category}
                onChange={(val) => setForm((prev) => ({ ...prev, category: val }))}
                options={categories}
                placeholder={loadingCategories ? "Loading categories from database..." : "Select category"}
                disabled={loadingCategories}
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
                  className="block w-full text-sm text-slate-200 file:mr-4 file:rounded-full file:border-0 file:bg-slate-700 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-100 hover:file:bg-slate-600"
                />
              </div>
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

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                  Past dates are disabled (earliest: {minDate})
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

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-emerald-900/30 transition hover:from-emerald-400 hover:to-emerald-500 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading
                  ? "Creating..."
                  : helperId
                  ? "Create & Send to Helper"
                  : "Create Task"}
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
