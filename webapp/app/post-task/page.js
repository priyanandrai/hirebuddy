"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Footer from "../components/layout/Footer";
import Header from "../components/layout/Header";
import { getUserProfile } from "../components/services/user.service";
import { getTaskCategories, createTaskCategory } from "../components/services/task.service";
import CustomSelect from "../components/reuseable/CustomSelect";

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

export default function PostTaskPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const minDate = getTodayLocalDateString();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [profileLocation, setProfileLocation] = useState("");
  const [preferredDate, setPreferredDate] = useState(minDate);
  const [budget, setBudget] = useState("");

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const res = await getTaskCategories();
      const list = Array.isArray(res) ? res : res?.data || [];
      setCategories(list);
      if (list.length > 0 && !category) {
        setCategory(list[0].name || list[0]);
      }
    } catch (err) {
      console.error("Failed to fetch categories from DB:", err);
    } finally {
      setLoadingCategories(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAddNewCategory = async (rawName) => {
    const cleanName = String(rawName || "").trim();
    if (!cleanName) return;
    setCreatingCategory(true);
    try {
      const token =
        session?.token ||
        (typeof window !== "undefined" ? localStorage.getItem("token") : null);
      const created = await createTaskCategory({ name: cleanName }, token);
      const saved = created?.data || created || { name: cleanName };
      await fetchCategories();
      setCategory(saved.name || cleanName);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("categoriesUpdated"));
      }
    } catch (err) {
      console.error("Failed to add new category:", err);
    } finally {
      setCreatingCategory(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function loadProfileLocation() {
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

      const token =
        session?.token ||
        (typeof window !== "undefined" ? localStorage.getItem("token") : null);
      if (token) {
        try {
          const res = await getUserProfile(token);
          const userObj = res?.data || res?.user || res;
          const apiLoc =
            userObj?.address || userObj?.city || userObj?.location || "";
          if (apiLoc) {
            resolvedLoc = apiLoc;
          }
        } catch {
          // Fallback to localStorage / default
        }
      }

      const finalLoc = resolvedLoc || "Modipuram, Meerut";
      if (isMounted) {
        setProfileLocation(finalLoc);
        setLocation((prev) => prev || finalLoc);
      }
    }

    loadProfileLocation();
    return () => {
      isMounted = false;
    };
  }, [session]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (preferredDate && preferredDate < minDate) {
      alert("Previous dates are disabled. Please select today or a future date.");
      setPreferredDate(minDate);
      return;
    }
    const query = category ? `?category=${encodeURIComponent(category)}` : "";
    router.push(`/dashboard/create-task${query}`);
  };

  return (
    <>
      <Header />

      <main className="min-h-screen bg-slate-950 text-white">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:py-24">
          <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
            <section className="space-y-6">
              <div className="inline-flex rounded-full bg-green-700/10 px-4 py-1 text-sm font-semibold text-green-100 ring-1 ring-green-500/20">
                Quick task posting
              </div>
              <div className="space-y-4">
                <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
                  Post a Task in minutes
                </h1>
                <p className="max-w-2xl text-lg leading-8 text-slate-300">
                  Describe the work you need help with, set your budget, and get matched with reliable helpers nearby. HireBuddy makes it easy to post, track, and complete your task quickly.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl bg-white/5 p-5 ring-1 ring-white/10">
                  <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Trusted helpers</p>
                  <p className="mt-3 text-base leading-7 text-slate-200">Connect with verified local helpers who can get the job done.</p>
                </div>
                <div className="rounded-3xl bg-white/5 p-5 ring-1 ring-white/10">
                  <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Secure booking</p>
                  <p className="mt-3 text-base leading-7 text-slate-200">Pay safely and manage your task from the same dashboard.</p>
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-white/10 bg-white/95 p-8 shadow-2xl shadow-slate-950/20 text-slate-900 backdrop-blur-xl">
              <div className="mb-8">
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-600">
                  Start your request
                </p>
                <h2 className="mt-3 text-2xl font-semibold text-slate-950">
                  Tell us about your task
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Task title</span>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Example: Clean my apartment"
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </label>

                <div>
                  <span className="mb-2 block text-sm font-medium text-slate-700">Category</span>
                  <CustomSelect
                    name="category"
                    value={category}
                    onChange={setCategory}
                    options={categories}
                    placeholder={
                      loadingCategories
                        ? "Loading categories from DB..."
                        : "Select or add category"
                    }
                    disabled={loadingCategories}
                    allowCreate={true}
                    onCreateOption={handleAddNewCategory}
                    creatingOption={creatingCategory}
                  />
                </div>

                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Describe your task</span>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide details that help helpers understand the work"
                    className="mt-2 min-h-[120px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </label>

                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-medium text-slate-700">Location</span>
                    {profileLocation && (
                      <button
                        type="button"
                        onClick={() => setLocation(profileLocation)}
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold transition ${
                          location === profileLocation
                            ? "bg-emerald-100 text-emerald-700 border border-emerald-300"
                            : "bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200"
                        }`}
                      >
                        📍{" "}
                        {location === profileLocation
                          ? `Picked from Profile (${profileLocation})`
                          : `Use Profile (${profileLocation})`}
                      </button>
                    )}
                  </div>

                  <div className="mt-2 grid gap-3 sm:grid-cols-2">
                    <select
                      value={
                        SERVICE_LOCATIONS.includes(location) ||
                        (profileLocation && location === profileLocation)
                          ? location
                          : ""
                      }
                      onChange={(e) => {
                        if (e.target.value) setLocation(e.target.value);
                      }}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="">Select location...</option>
                      {profileLocation && !SERVICE_LOCATIONS.includes(profileLocation) && (
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
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Or enter city / postal code"
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-medium text-slate-700">Preferred Date</span>
                    <input
                      type="date"
                      min={minDate}
                      value={preferredDate}
                      onChange={(e) => {
                        if (e.target.value && e.target.value < minDate) {
                          setPreferredDate(minDate);
                          return;
                        }
                        setPreferredDate(e.target.value);
                      }}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-medium text-slate-700">Budget (₹)</span>
                    <input
                      type="number"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      placeholder="Enter your budget"
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </label>
                </div>

                <button
                  type="submit"
                  className="mt-2 inline-flex w-full items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-700"
                >
                  Post Task
                </button>

                <p className="text-center text-sm text-slate-500">
                  Need help deciding? Our helpers are ready to guide you through the process.
                </p>
              </form>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
