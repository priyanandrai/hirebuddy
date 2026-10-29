"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import { hireBuddy } from "../components/services/hire.service";
import { getTaskCategories } from "../components/services/task.service";
import { getUserProfile } from "../components/services/user.service";

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

export default function HireBuddyPage() {
  const { data: session } = useSession();
  const minDate = getTodayLocalDateString();

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    location: "",
    budget: "",
    preferredAt: minDate,
  });
  const [profileLocation, setProfileLocation] = useState("");
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getTaskCategories()
      .then((res) => {
        const list = Array.isArray(res) ? res : res?.data || [];
        setCategories(list);
        if (list.length > 0) {
          setForm((f) => ({
            ...f,
            category: f.category || list[0].name || list[0],
          }));
        }
      })
      .catch((err) =>
        console.error("Failed to load categories in hire-buddy", err)
      );
  }, []);

  useEffect(() => {
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
      setForm((prev) => ({
        ...prev,
        location: prev.location || resolvedLoc,
      }));
    }

    const token =
      session?.token ||
      (typeof window !== "undefined" ? localStorage.getItem("token") : null);
    if (token) {
      getUserProfile(token)
        .then((res) => {
          const userObj = res?.data || res?.user || res;
          const apiLoc =
            userObj?.address || userObj?.city || userObj?.location || "";
          if (apiLoc) {
            setProfileLocation(apiLoc);
            setForm((prev) => ({
              ...prev,
              location: prev.location || apiLoc,
            }));
          } else if (!resolvedLoc) {
            const fallback = "Modipuram, Meerut";
            setProfileLocation(fallback);
            setForm((prev) => ({
              ...prev,
              location: prev.location || fallback,
            }));
          }
        })
        .catch(() => {
          if (!resolvedLoc) {
            const fallback = "Modipuram, Meerut";
            setProfileLocation(fallback);
            setForm((prev) => ({
              ...prev,
              location: prev.location || fallback,
            }));
          }
        });
    } else if (!resolvedLoc) {
      const fallback = "Modipuram, Meerut";
      setProfileLocation(fallback);
      setForm((prev) => ({
        ...prev,
        location: prev.location || fallback,
      }));
    }
  }, [session]);

  function handleChange(e) {
    const { name, value } = e.target;
    if (name === "preferredAt" && value && value < minDate) {
      alert("Previous dates are disabled. Please select today or a future date.");
      setForm({ ...form, preferredAt: minDate });
      return;
    }
    setForm({ ...form, [name]: value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.preferredAt && form.preferredAt < minDate) {
      alert("Previous dates are disabled. Please select today or a future date.");
      return;
    }
    setLoading(true);
    try {
      const payload = { ...form };
      await hireBuddy(payload);
      alert("Your request has been submitted. Helpers will be notified.");
      setForm({
        title: "",
        description: "",
        category: categories[0]?.name || "",
        location: profileLocation || "Modipuram, Meerut",
        budget: "",
        preferredAt: minDate,
      });
    } catch (err) {
      console.error("HireBuddy request failed", err);
      alert("Failed to submit request");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-slate-950 text-slate-100 py-12">
        <div className="max-w-3xl mx-auto px-6">
          <h1 className="text-2xl font-semibold mb-4">Hire Buddy — Request Help</h1>

          <form
            onSubmit={handleSubmit}
            className="space-y-4 bg-slate-900/80 p-6 rounded-2xl border border-slate-800"
          >
            <div>
              <label className="block text-sm font-medium">Title</label>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                required
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={4}
                required
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
              />
            </div>

            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                <label className="block text-sm font-medium">Location</label>
                {profileLocation && (
                  <button
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({ ...prev, location: profileLocation }))
                    }
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold transition ${
                      form.location === profileLocation
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : "bg-slate-800 text-slate-300 hover:bg-emerald-500/15 hover:text-emerald-300 border border-slate-700"
                    }`}
                  >
                    📍{" "}
                    {form.location === profileLocation
                      ? `Picked from Profile (${profileLocation})`
                      : `Use Profile (${profileLocation})`}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                  className="w-full rounded-md border border-slate-700 bg-slate-800 text-slate-100 px-3 py-2 text-sm"
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
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  placeholder="Or enter location"
                  required
                  className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium">Category</label>
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 text-slate-100 px-3 py-2 text-sm"
                >
                  {categories.map((cat) => {
                    const name = typeof cat === "string" ? cat : cat.name;
                    const icon = cat.icon ? `${cat.icon} ` : "";
                    return (
                      <option key={cat.id || name} value={name}>
                        {icon}
                        {name}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium">Budget (₹)</label>
                <input
                  name="budget"
                  type="number"
                  value={form.budget}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium">Preferred Date</label>
              <input
                type="date"
                name="preferredAt"
                min={minDate}
                value={form.preferredAt}
                onChange={handleChange}
                required
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
              />
              <p className="mt-1 text-xs text-slate-400">
                Past dates are disabled (earliest: {minDate})
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="rounded-md bg-blue-600 px-4 py-2 text-white"
              >
                {loading ? "Submitting..." : "Request Help"}
              </button>
              <a
                href="/services"
                className="ml-2 rounded-md border border-slate-700 px-4 py-2 text-sm"
              >
                View Services
              </a>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </>
  );
}
