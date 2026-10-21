"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getUserProfile, updateHelperProfile } from "@/app/components/services/user.service";
import HelperDocumentVerificationModal from "@/app/components/ui/HelperDocumentVerificationModal";
import {
  User,
  Phone,
  MapPin,
  Briefcase,
  ArrowLeft,
  Check,
  Save,
  ShieldCheck,
  AlertCircle,
  Clock,
  Sparkles,
} from "lucide-react";

const AVAILABLE_SERVICES = [
  "Shopping",
  "Delivery",
  "Doctor Visit",
  "Home Help",
  "Cleaning",
  "Electrician",
  "Plumbing",
  "Carpentry",
  "Driving",
  "Pet Care",
  "Moving & Lifting",
  "Gardening",
];

export default function EditTaskerProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    city: "",
    address: "",
    experience: "",
    hourlyRate: "",
    services: [],
  });

  useEffect(() => {
    // Attempt local storage cache first
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        const u = JSON.parse(stored);
        populateForm(u);
      }
    } catch (e) {}

    // Fetch fresh profile from API
    getUserProfile()
      .then((res) => {
        if (res?.user) {
          setCurrentUser(res.user);
          populateForm(res.user);
          try {
            const currentStored = JSON.parse(localStorage.getItem("user") || "{}");
            localStorage.setItem("user", JSON.stringify({ ...currentStored, ...res.user }));
          } catch (e) {}
        }
      })
      .catch((err) => {
        console.error("Failed to load user profile", err);
      })
      .finally(() => {
        setFetching(false);
      });
  }, []);

  function populateForm(u) {
    if (!u) return;
    setCurrentUser(u);

    const skills = (() => {
      if (!u.skills) return [];
      if (Array.isArray(u.skills)) return u.skills.filter(Boolean);
      if (typeof u.skills === "string") {
        return u.skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }
      return [];
    })();

    setForm({
      name: u.name || "",
      phone: u.phone ? u.phone.replace(/^\+91/, "").trim() : "",
      city: u.city || "",
      address: u.address || "",
      experience: u.experience !== null && u.experience !== undefined ? String(u.experience) : "",
      hourlyRate: u.hourlyRate ? String(u.hourlyRate / 100) : "",
      services: skills.length > 0 ? skills : ["Shopping", "Delivery"],
    });
  }

  function handleChange(e) {
    const { name, value } = e.target;
    if (name === "phone" && !/^\d*$/.test(value)) return;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function toggleService(service) {
    setForm((prev) => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter((s) => s !== service)
        : [...prev.services, service],
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const cleanPhone = form.phone.trim();
    if (cleanPhone.length > 0 && cleanPhone.length !== 10) {
      setError("Mobile number must be 10 digits.");
      return;
    }

    if (form.services.length === 0) {
      setError("Please select at least one type of work you can do.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        phone: cleanPhone || undefined,
        city: form.city.trim() || undefined,
        address: form.address.trim() || undefined,
        skills: form.services,
        experience: form.experience ? Number(form.experience) : undefined,
        hourlyRate: form.hourlyRate ? Math.round(Number(form.hourlyRate) * 100) : undefined,
      };

      const updatedUser = await updateHelperProfile(payload);

      // Merge into localStorage
      const stored = localStorage.getItem("user");
      const prevUser = stored ? JSON.parse(stored) : {};
      const mergedUser = {
        ...prevUser,
        ...updatedUser,
        skills: form.services.join(", "),
      };
      localStorage.setItem("user", JSON.stringify(mergedUser));

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("userProfileUpdated"));
      }

      alert("Profile updated successfully!");
      router.push("/dashboard-tasker/profile");
    } catch (err) {
      console.error("Failed to update profile", err);
      setError(err.message || "Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 sm:px-6 py-6 sm:py-8 text-slate-100">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Header */}
        <section className="flex items-center justify-between">
          <div>
            <Link
              href="/dashboard-tasker/profile"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Profile</span>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Edit Profile
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Update your details shown to customers
            </p>
          </div>
        </section>

        {/* Form Card */}
        <form
          onSubmit={handleSubmit}
          className="rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6 sm:p-8 shadow-2xl shadow-slate-950/40 backdrop-blur-xl space-y-6"
        >
          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Full Name
            </label>
            <div className="relative mt-2">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-500">
                <User className="h-4 w-4" />
              </div>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Rahul Sharma"
                required
                className="w-full rounded-2xl border border-slate-700 bg-slate-950/80 py-3.5 pl-11 pr-4 text-sm font-medium text-white placeholder-slate-500 transition focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Mobile Number */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Mobile Number
            </label>
            <div className="relative mt-2">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-500">
                <Phone className="h-4 w-4" />
              </div>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                maxLength={10}
                inputMode="numeric"
                placeholder="10-digit mobile number"
                className="w-full rounded-2xl border border-slate-700 bg-slate-950/80 py-3.5 pl-11 pr-4 text-sm font-medium text-white placeholder-slate-500 transition focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <p className="mt-1.5 text-xs text-slate-500">
              Customers will coordinate with you on this number
            </p>
          </div>

          {/* City / Area */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                City / Region
              </label>
              <div className="relative mt-2">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-500">
                  <MapPin className="h-4 w-4" />
                </div>
                <input
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  placeholder="e.g. Meerut, Bangalore"
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950/80 py-3.5 pl-11 pr-4 text-sm font-medium text-white placeholder-slate-500 transition focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Local Area / Address
              </label>
              <input
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="e.g. Modipuram, Indiranagar"
                className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950/80 py-3.5 px-4 text-sm font-medium text-white placeholder-slate-500 transition focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Experience & Hourly Rate */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Experience (Years)
              </label>
              <input
                name="experience"
                value={form.experience}
                onChange={handleChange}
                type="number"
                min="0"
                max="50"
                placeholder="e.g. 2"
                className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950/80 py-3.5 px-4 text-sm font-medium text-white placeholder-slate-500 transition focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Hourly Rate (₹)
              </label>
              <input
                name="hourlyRate"
                value={form.hourlyRate}
                onChange={handleChange}
                type="number"
                min="0"
                placeholder="e.g. 200"
                className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950/80 py-3.5 px-4 text-sm font-medium text-white placeholder-slate-500 transition focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Services / Work I Can Do */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Work I Can Do
              </label>
              <span className="text-xs text-blue-400 font-medium">
                {form.services.length} selected
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              Tap services to toggle them on or off for your public profile
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {AVAILABLE_SERVICES.map((service) => {
                const isSelected = form.services.includes(service);
                return (
                  <button
                    type="button"
                    key={service}
                    onClick={() => toggleService(service)}
                    className={`flex items-center justify-between rounded-2xl border p-3 text-xs font-semibold transition ${
                      isSelected
                        ? "border-blue-500 bg-blue-500/20 text-blue-300 shadow-md shadow-blue-950/40"
                        : "border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                    }`}
                  >
                    <span>{service}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-blue-400" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Document Verification Callout */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Identity & Address Documents</p>
                <p className="text-[11px] text-slate-400">
                  Status: {currentUser?.idVerificationStatus || "UNVERIFIED"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowVerificationModal(true)}
              className="rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 transition"
            >
              Manage Documents
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-2xl bg-blue-600 hover:bg-blue-500 py-3.5 px-6 text-center text-sm font-bold text-white shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? "Saving Changes..." : "Save Changes"}</span>
            </button>

            <Link
              href="/dashboard-tasker/profile"
              className="flex-1 rounded-2xl border border-slate-800 bg-slate-950 hover:bg-slate-800 py-3.5 px-6 text-center text-sm font-semibold text-slate-300 hover:text-white transition"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>

      {/* Helper 3-Step Document Verification Modal */}
      <HelperDocumentVerificationModal
        isOpen={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
        onComplete={(updatedUser) => {
          setCurrentUser(updatedUser);
          setShowVerificationModal(false);
        }}
        user={currentUser}
      />
    </main>
  );
}
