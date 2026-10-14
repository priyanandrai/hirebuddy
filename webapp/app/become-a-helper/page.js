"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import { registerHelper } from "../components/services/auth.service";
import {
  Sparkles,
  Eye,
  EyeOff,
  Phone,
  ArrowRight,
  Briefcase,
  Check,
  Key,
  ShieldCheck,
} from "lucide-react";

export default function BecomeHelperPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    password: "",
    hourlyRate: "299",
    city: "Modipuram, Meerut",
    services: [],
    customSkill: "",
  });

  const availableServices = [
    "Shopping",
    "Delivery",
    "Doctor Visit",
    "Driving",
    "Home Help",
    "Electrician",
    "Plumber",
    "Cleaning",
    "Carpenter",
    "Painter",
    "AC Repair",
    "Moving",
    "Other",
  ];

  function toggleService(service) {
    setForm((prev) => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter((s) => s !== service)
        : [...prev.services, service],
    }));
  }

  function handleAddCustomSkill(e) {
    if (e && e.preventDefault) e.preventDefault();
    const trimmed = form.customSkill.trim();
    if (trimmed && !form.services.includes(trimmed)) {
      setForm((prev) => ({
        ...prev,
        services: [...prev.services, trimmed],
        customSkill: "",
      }));
    }
  }

  function handleGeneratePassword() {
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const generated = `Helper@${randomDigits}`;
    setForm((prev) => ({ ...prev, password: generated }));
    setShowPassword(true);
  }

  function handleChange(e) {
    const { name, value } = e.target;

    // Allow only digits in phone field
    if (name === "phone") {
      const numeric = value.replace(/\D/g, "").slice(0, 10);
      setForm((prev) => ({ ...prev, phone: numeric }));
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    // Phone validation: exactly 10 digits
    if (form.phone.length !== 10) {
      setError("Please enter a valid 10-digit mobile number for your Helper ID.");
      return;
    }

    if (!form.password || form.password.trim().length < 4) {
      setError("Please create a password (minimum 4 characters) for your helper account.");
      return;
    }

    if (form.services.length === 0) {
      setError("Please select at least one type of work or service you provide.");
      return;
    }

    setLoading(true);
    try {
      const res = await registerHelper({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        name: `${form.firstName.trim()} ${form.lastName.trim()}`.trim(),
        phone: form.phone,
        password: form.password.trim(),
        city: form.city.trim(),
        hourlyRate: form.hourlyRate ? Number(form.hourlyRate) : 299,
        services: form.services,
      });

      if (res?.token) {
        localStorage.setItem("token", res.token);
        if (res?.user) {
          localStorage.setItem("user", JSON.stringify(res.user));
        }
      }

      // Mark that user just signed up so dashboard prompts them to upload documents
      sessionStorage.setItem("just_registered_helper", "true");

      // Directly navigate to helper dashboard (simple, 1-step registration!)
      router.push("/dashboard-tasker");
    } catch (err) {
      console.error("Helper registration error:", err);
      setError(err.message || "Failed to submit registration. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Header />

      <main className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6">
        <div className="mx-auto max-w-7xl grid gap-10 lg:grid-cols-12 items-start">
          {/* Left Column: Value Proposition & Helper ID explanation */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-[2rem] border border-slate-800 bg-slate-900/90 p-6 sm:p-8 shadow-xl backdrop-blur-sm">
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-xs font-semibold text-emerald-400 mb-4">
                <Sparkles className="w-3.5 h-3.5" />
                Service Partner Program
              </div>

              <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
                Become a Helper
              </h1>
              <p className="mt-3 text-sm text-slate-300 leading-relaxed">
                Join HireBuddy and start accepting local tasks near you. Create your account in seconds using your{" "}
                <strong className="text-white">Mobile Number (Helper ID)</strong>.
              </p>

              {/* Highlights */}
              <div className="mt-6 space-y-3.5">
                <div className="flex items-start gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-3.5">
                  <div className="mt-0.5 rounded-xl bg-emerald-500/10 p-2 text-emerald-400 border border-emerald-500/20 shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">Mobile Number = Helper ID</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      No separate username needed. Your 10-digit number is your official Helper ID.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-3.5">
                  <div className="mt-0.5 rounded-xl bg-cyan-500/10 p-2 text-cyan-400 border border-cyan-500/20 shrink-0">
                    <Key className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">Password & OTP Access</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Log in anytime via your password or instant one-time mobile OTP.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-3.5">
                  <div className="mt-0.5 rounded-xl bg-purple-500/10 p-2 text-purple-400 border border-purple-500/20 shrink-0">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">Fast 1-Step Setup</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Sign up right away. You can easily upload your photo and verification documents in your dashboard.
                    </p>
                  </div>
                </div>
              </div>

              {/* Already registered banner */}
              <div className="mt-6 pt-5 border-t border-slate-800/80">
                <div className="rounded-2xl bg-slate-950/80 border border-slate-800 p-4 text-xs text-slate-300">
                  <span className="font-semibold text-white">Already registered or added by Admin?</span>
                  <p className="mt-1 text-slate-400">
                    Log in directly using your Helper ID (phone number) and password.
                  </p>
                  <Link
                    href="/login"
                    className="mt-3 inline-flex items-center gap-1.5 font-semibold text-emerald-400 hover:text-emerald-300 transition"
                  >
                    <span>Sign In with Helper ID & Password</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Simple 1-Step Registration Form */}
          <div className="lg:col-span-7">
            <form
              onSubmit={handleSubmit}
              className="space-y-5 rounded-[2rem] border border-slate-800 bg-slate-900/95 p-6 sm:p-8 shadow-xl backdrop-blur-sm"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                    Quick Partner Registration
                  </span>
                  <Link href="/login" className="text-xs text-emerald-400 hover:text-emerald-300 font-medium">
                    Already a Helper? Sign In →
                  </Link>
                </div>
                <h2 className="text-xl font-bold text-white mt-1">Create Your Helper Account</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Enter your details to create your account. You can upload verification documents inside your dashboard.
                </p>
              </div>

              {/* Name Fields (2 Columns) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    First Name <span className="text-emerald-400">*</span>
                  </label>
                  <input
                    name="firstName"
                    value={form.firstName}
                    onChange={handleChange}
                    required
                    placeholder="e.g. Ramesh"
                    className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Last Name <span className="text-emerald-400">*</span>
                  </label>
                  <input
                    name="lastName"
                    value={form.lastName}
                    onChange={handleChange}
                    required
                    placeholder="e.g. Kumar"
                    className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Mobile Number (Helper ID) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-300">
                    Mobile Number (Helper ID) <span className="text-emerald-400">*</span>
                  </label>
                  <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    Your Login Helper ID
                  </span>
                </div>
                <div className="flex rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500">
                  <span className="px-3.5 py-2.5 text-xs font-medium text-slate-400 bg-slate-900/90 border-r border-slate-800 flex items-center">
                    +91
                  </span>
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    required
                    placeholder="10-digit mobile number"
                    className="w-full bg-transparent px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none font-mono"
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  This 10-digit number will be your Helper ID to log in and receive task bookings.
                </p>
              </div>

              {/* Password Field with Random Generator */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Create Password <span className="text-emerald-400">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition"
                  >
                    <Sparkles className="w-3 h-3" />
                    Suggest Password
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    required
                    minLength={4}
                    placeholder="Set account password (min. 4 characters)"
                    className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 pr-10 text-sm text-slate-100 font-mono placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  Use your Helper ID (phone number) + this password to log in anytime.
                </p>
              </div>

              {/* City & Hourly Rate (2 Columns) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* City */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    City / Working Area
                  </label>
                  <input
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    placeholder="e.g. Modipuram, Meerut"
                    className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {/* Hourly Rate */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Standard Rate (₹ / hr)
                  </label>
                  <div className="flex rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500">
                    <span className="px-3.5 py-2.5 text-xs font-semibold text-slate-400 bg-slate-900/90 border-r border-slate-800 flex items-center">
                      ₹
                    </span>
                    <input
                      name="hourlyRate"
                      value={form.hourlyRate}
                      onChange={handleChange}
                      type="number"
                      placeholder="299"
                      className="w-full bg-transparent px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Services / What work can you do? */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  What work can you do? <span className="text-emerald-400">*</span>
                </label>
                <p className="text-[11px] text-slate-400 mb-2">Select all services you can provide:</p>

                <div className="flex flex-wrap gap-2">
                  {availableServices.map((service) => {
                    const isSelected = form.services.includes(service);
                    return (
                      <button
                        type="button"
                        key={service}
                        onClick={() => toggleService(service)}
                        className={`rounded-xl px-3 py-1.5 text-xs font-medium transition border flex items-center gap-1.5 ${
                          isSelected
                            ? "bg-emerald-600 border-emerald-500 text-white shadow-sm shadow-emerald-950"
                            : "bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white"
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        {service}
                      </button>
                    );
                  })}
                </div>

                {/* Add Custom Skill */}
                <div className="mt-2.5 flex gap-2">
                  <input
                    name="customSkill"
                    value={form.customSkill}
                    onChange={handleChange}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddCustomSkill();
                      }
                    }}
                    placeholder="Add another skill (e.g. Masonry, Welding)..."
                    className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomSkill}
                    className="rounded-xl bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 border border-slate-700 transition"
                  >
                    + Add
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-emerald-600 px-4 py-3.5 font-semibold text-sm text-white hover:bg-emerald-500 disabled:opacity-60 transition shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span>Creating Account...</span>
                ) : (
                  <>
                    <span>Create Helper Account & Open Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <p className="text-center text-[11px] text-slate-400">
                By registering, you agree to our{" "}
                <Link href="/terms" className="text-emerald-400 hover:text-white">
                  Terms
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-emerald-400 hover:text-white">
                  Privacy Policy
                </Link>
              </p>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
