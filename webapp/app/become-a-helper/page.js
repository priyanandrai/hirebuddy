"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import { registerHelper } from "../components/services/auth.service";
import {
  ArrowRight,
  Brush,
  Car,
  Check,
  ChevronDown,
  Eye,
  EyeOff,
  Hammer,
  Home,
  IndianRupee,
  LayoutGrid,
  Lock,
  MapPin,
  Package,
  PaintRoller,
  Phone,
  Plus,
  ShieldCheck,
  User,
  Wrench,
  Zap,
} from "lucide-react";

const SERVICE_OPTIONS = [
  { label: "Home Help", icon: Home },
  { label: "Cleaning", icon: Brush },
  { label: "Plumber", icon: Wrench },
  { label: "Electrician", icon: Zap },
  { label: "Driver", icon: Car },
  { label: "Delivery", icon: Package },
  { label: "Carpenter", icon: Hammer },
  { label: "Painter", icon: PaintRoller },
  { label: "Other", icon: LayoutGrid },
];

const CITY_OPTIONS = [
  "Modipuram, Meerut",
  "Pallavpuram, Meerut",
  "Kankerkhera, Meerut",
  "Shastri Nagar, Meerut",
  "Saket, Meerut",
  "Meerut Cantt, Meerut",
  "Ganga Nagar, Meerut",
  "Jagriti Vihar, Meerut",
  "Rohta Road, Meerut",
  "Partapur, Meerut",
  "Noida, UP",
  "Ghaziabad, UP",
  "Delhi NCR",
];

export default function BecomeHelperPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isCustomCity, setIsCustomCity] = useState(false);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    password: "",
    hourlyRate: "299",
    city: "Modipuram, Meerut",
    services: ["Home Help"],
    customSkill: "",
  });

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

  function handleChange(e) {
    const { name, value } = e.target;

    if (name === "phone") {
      const numeric = value.replace(/\D/g, "").slice(0, 10);
      setForm((prev) => ({ ...prev, phone: numeric }));
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleCitySelect(e) {
    const val = e.target.value;
    if (val === "__custom__") {
      setIsCustomCity(true);
      setForm((prev) => ({ ...prev, city: "" }));
    } else {
      setIsCustomCity(false);
      setForm((prev) => ({ ...prev, city: val }));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (form.phone.length !== 10) {
      setError("Please enter a valid 10-digit mobile number for your Helper ID.");
      return;
    }

    const trimmedEmail = form.email.trim().toLowerCase();
    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!form.password || form.password.trim().length < 4) {
      setError("Please create a password (minimum 4 characters) for your helper account.");
      return;
    }

    if (!form.city.trim()) {
      setError("Please select or enter your City / Working Area.");
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
        ...(trimmedEmail ? { email: trimmedEmail } : {}),
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
        window.dispatchEvent(new Event("userProfileUpdated"));
      }

      sessionStorage.setItem("just_registered_helper", "true");
      router.push("/dashboard-tasker");
    } catch (err) {
      console.error("Helper registration error:", err);
      setError(err.message || "Failed to submit registration. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const presetLabels = SERVICE_OPTIONS.map((s) => s.label);
  const customSelectedServices = form.services.filter(
    (s) => !presetLabels.includes(s)
  );
  const showCustomSkillInput = form.services.includes("Other");

  return (
    <>
      <Header variant="light" />

      <main className="relative min-h-[calc(100vh-76px)] overflow-hidden bg-white text-slate-900">
        {/* Decorative soft mint curve on right edge */}
        <svg
          aria-hidden="true"
          viewBox="0 0 260 900"
          preserveAspectRatio="none"
          className="pointer-events-none hidden lg:block absolute right-0 top-8 bottom-0 h-[calc(100%-2rem)] w-[220px] xl:w-[260px] text-[#e6f6ee]"
        >
          <path
            fill="currentColor"
            d="M260,0 C150,30 85,150 95,310 C105,470 35,610 0,760 L0,900 L260,900 Z"
          />
        </svg>

        {/* Bottom-left worker illustration anchored flush to bottom-left on desktop */}
        <Image
          src="/images/helper_registration_worker.png"
          alt="HireBuddy Service Partner"
          width={560}
          height={309}
          priority
          className="pointer-events-none hidden select-none mix-blend-multiply lg:block absolute bottom-0 left-0 z-0 w-[430px] xl:w-[490px] h-auto max-w-none"
        />

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 pt-8 sm:pt-11 pb-12 lg:pb-14">
          <div className="grid items-start gap-10 lg:grid-cols-12 lg:gap-12">
            {/* Left Column: Brand Value Proposition */}
            <div className="lg:col-span-5 lg:pb-[265px] xl:pb-[295px]">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#e6f6ee] px-3.5 py-1.5 text-xs font-semibold text-[#0b8a4e]">
                <ShieldCheck className="h-4 w-4 text-[#0b8a4e]" />
                <span>Service Partner Program</span>
              </div>

              <h1 className="mt-5 text-4xl font-extrabold leading-[1.1] tracking-tight text-[#0f172a] sm:text-5xl lg:text-[46px]">
                Become a
                <br />
                Helper on
                <br />
                <span className="text-[#0b8a4e]">HireBuddy</span>
              </h1>

              <p className="mt-4 max-w-md text-[15px] leading-relaxed text-slate-600">
                Join our trusted network of local helpers, get task requests, and
                earn on your schedule.
              </p>

              {/* 3 Feature Rows */}
              <div className="mt-7 space-y-5">
                <div className="flex items-start gap-3.5">
                  <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#e8f7ef] text-[#0b8a4e]">
                    <IndianRupee className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-bold text-[#0f172a]">
                      Earn More
                    </h3>
                    <p className="mt-0.5 text-sm leading-snug text-slate-600">
                      Get consistent task opportunities
                      <br className="hidden sm:inline" /> in your area.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#e8f7ef] text-[#0b8a4e]">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-bold text-[#0f172a]">
                      Verified &amp; Trusted
                    </h3>
                    <p className="mt-0.5 text-sm leading-snug text-slate-600">
                      Build a trusted profile with verification.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#fef5e4] text-[#eab308]">
                    <Zap className="h-5 w-5 fill-[#eab308]" />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-bold text-[#0f172a]">
                      Quick &amp; Easy Setup
                    </h3>
                    <p className="mt-0.5 text-sm leading-snug text-slate-600">
                      Create your account in just a few minutes.
                    </p>
                  </div>
                </div>
              </div>

              {/* Mobile / Tablet Worker Illustration */}
              <div className="mt-8 -ml-4 sm:-ml-6 lg:hidden">
                <Image
                  src="/images/helper_registration_worker.png"
                  alt="HireBuddy Service Partner"
                  width={560}
                  height={309}
                  className="w-72 sm:w-80 h-auto mix-blend-multiply select-none"
                />
              </div>
            </div>

            {/* Right Column: Elevated White Registration Card */}
            <div className="lg:col-span-7">
              <form
                onSubmit={handleSubmit}
                className="rounded-[28px] border border-slate-100 bg-white p-6 sm:p-9 shadow-[0_20px_60px_-15px_rgba(15,23,42,0.09)]"
              >
                <div>
                  <h2 className="text-2xl sm:text-[26px] font-bold tracking-tight text-[#0f172a]">
                    Create Your Helper Account
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Enter your details to get started and receive task bookings.
                  </p>
                </div>

                <div className="mt-6 space-y-4">
                  {/* First Name & Last Name */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-[13px] font-semibold text-slate-800">
                        First Name <span className="text-[#0b8a4e]">*</span>
                      </label>
                      <div className="flex items-center rounded-xl border border-slate-200 bg-[#fbfcfd] px-3.5 py-2.5 transition focus-within:border-[#0b8a4e] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#0b8a4e]/15">
                        <User className="mr-2.5 h-4 w-4 shrink-0 text-slate-400" />
                        <input
                          name="firstName"
                          value={form.firstName}
                          onChange={handleChange}
                          required
                          placeholder="e.g. Ramesh"
                          className="w-full bg-transparent text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-[13px] font-semibold text-slate-800">
                        Last Name <span className="text-[#0b8a4e]">*</span>
                      </label>
                      <div className="flex items-center rounded-xl border border-slate-200 bg-[#fbfcfd] px-3.5 py-2.5 transition focus-within:border-[#0b8a4e] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#0b8a4e]/15">
                        <User className="mr-2.5 h-4 w-4 shrink-0 text-slate-400" />
                        <input
                          name="lastName"
                          value={form.lastName}
                          onChange={handleChange}
                          required
                          placeholder="e.g. Kumar"
                          className="w-full bg-transparent text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Mobile Number (Helper ID) */}
                  <div>
                    <label className="mb-1.5 block text-[13px] font-semibold text-slate-800">
                      Mobile Number (Helper ID){" "}
                      <span className="text-[#0b8a4e]">*</span>
                    </label>
                    <div className="flex items-center rounded-xl border border-slate-200 bg-[#fbfcfd] px-3.5 py-2.5 transition focus-within:border-[#0b8a4e] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#0b8a4e]/15">
                      <Phone className="mr-3 h-4 w-4 shrink-0 text-slate-400" />
                      <span className="mr-3 select-none text-sm font-semibold text-slate-800">
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
                        placeholder="8287187899"
                        className="w-full bg-transparent text-sm font-semibold tracking-wide text-slate-900 placeholder-slate-400 focus:outline-none"
                      />
                    </div>
                    <p className="mt-1.5 text-xs text-slate-500">
                      This 10-digit number will be your Helper ID to log in and
                      receive task bookings.
                    </p>
                  </div>

                  {/* Create Password */}
                  <div>
                    <label className="mb-1.5 block text-[13px] font-semibold text-slate-800">
                      Create Password <span className="text-[#0b8a4e]">*</span>
                    </label>
                    <div className="flex items-center rounded-xl border border-slate-200 bg-[#fbfcfd] px-3.5 py-2.5 transition focus-within:border-[#0b8a4e] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#0b8a4e]/15">
                      <Lock className="mr-3 h-4 w-4 shrink-0 text-slate-400" />
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={form.password}
                        onChange={handleChange}
                        required
                        minLength={4}
                        placeholder="•••••••••"
                        className="w-full bg-transparent text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="ml-2 text-slate-400 hover:text-slate-600 transition"
                        title={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* City / Working Area & Standard Rate */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-12">
                    <div className="sm:col-span-7">
                      <label className="mb-1.5 block text-[13px] font-semibold text-slate-800">
                        City / Working Area{" "}
                        <span className="text-[#0b8a4e]">*</span>
                      </label>
                      {!isCustomCity ? (
                        <div className="relative flex items-center rounded-xl border border-slate-200 bg-[#fbfcfd] px-3.5 py-2.5 transition focus-within:border-[#0b8a4e] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#0b8a4e]/15">
                          <MapPin className="mr-2.5 h-4 w-4 shrink-0 text-slate-400" />
                          <select
                            value={form.city}
                            onChange={handleCitySelect}
                            className="w-full appearance-none bg-transparent pr-6 text-sm font-medium text-slate-900 focus:outline-none"
                          >
                            {CITY_OPTIONS.map((cityOption) => (
                              <option key={cityOption} value={cityOption}>
                                {cityOption}
                              </option>
                            ))}
                            <option value="__custom__">
                              Other City / Area...
                            </option>
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-3.5 h-4 w-4 text-slate-500" />
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="flex flex-1 items-center rounded-xl border border-slate-200 bg-[#fbfcfd] px-3.5 py-2.5 transition focus-within:border-[#0b8a4e] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#0b8a4e]/15">
                            <MapPin className="mr-2.5 h-4 w-4 shrink-0 text-slate-400" />
                            <input
                              name="city"
                              value={form.city}
                              onChange={handleChange}
                              placeholder="Enter your city / locality"
                              className="w-full bg-transparent text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setIsCustomCity(false);
                              setForm((prev) => ({
                                ...prev,
                                city: CITY_OPTIONS[0],
                              }));
                            }}
                            className="text-xs font-semibold text-[#0b8a4e] hover:underline shrink-0"
                          >
                            List
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="sm:col-span-5">
                      <label className="mb-1.5 block text-[13px] font-semibold text-slate-800">
                        Standard Rate (₹ / hr)
                      </label>
                      <div className="flex items-center rounded-xl border border-slate-200 bg-[#fbfcfd] px-3.5 py-2.5 transition focus-within:border-[#0b8a4e] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#0b8a4e]/15">
                        <span className="mr-3 select-none text-sm font-medium text-slate-400">
                          ₹
                        </span>
                        <input
                          name="hourlyRate"
                          value={form.hourlyRate}
                          onChange={handleChange}
                          type="number"
                          min="0"
                          placeholder="299"
                          className="w-full bg-transparent text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* What work can you do? */}
                  <div className="pt-1">
                    <label className="block text-[13px] font-semibold text-slate-800">
                      What work can you do?{" "}
                      <span className="text-[#0b8a4e]">*</span>
                    </label>
                    <p className="mt-0.5 mb-3 text-xs text-slate-500">
                      Select all services you can provide.
                    </p>

                    <div className="flex flex-wrap gap-2.5">
                      {SERVICE_OPTIONS.map(({ label, icon: Icon }) => {
                        const isSelected = form.services.includes(label);
                        return (
                          <button
                            type="button"
                            key={label}
                            onClick={() => toggleService(label)}
                            className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs sm:text-[13px] transition ${
                              isSelected
                                ? "border-[#22a06b] bg-[#e6f6ee] font-semibold text-[#0f3d26]"
                                : "border-slate-200 bg-white font-medium text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                            }`}
                          >
                            <Icon
                              className={`h-3.5 w-3.5 shrink-0 ${
                                isSelected
                                  ? "text-[#0b8a4e]"
                                  : "text-slate-600"
                              }`}
                            />
                            <span>{label}</span>
                            {isSelected && (
                              <span className="ml-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#0b8a4e] text-white">
                                <Check className="h-2.5 w-2.5 stroke-[3]" />
                              </span>
                            )}
                          </button>
                        );
                      })}

                      {customSelectedServices.map((customService) => (
                        <button
                          type="button"
                          key={customService}
                          onClick={() => toggleService(customService)}
                          className="inline-flex items-center gap-2 rounded-full border border-[#22a06b] bg-[#e6f6ee] px-3.5 py-2 text-xs sm:text-[13px] font-semibold text-[#0f3d26] transition"
                        >
                          <span>{customService}</span>
                          <span className="ml-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#0b8a4e] text-white">
                            <Check className="h-2.5 w-2.5 stroke-[3]" />
                          </span>
                        </button>
                      ))}
                    </div>

                    {showCustomSkillInput && (
                      <div className="mt-3 flex gap-2">
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
                          placeholder="Add another skill (e.g. AC Repair, Cooking, Moving)..."
                          className="flex-1 rounded-xl border border-slate-200 bg-[#fbfcfd] px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-[#0b8a4e] focus:bg-white focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleAddCustomSkill}
                          className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>Add</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Validation / Backend Duplicate Error */}
                  {error && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700">
                      {error}
                    </div>
                  )}

                  {/* Primary Submit CTA */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-[#0b8a4e] px-6 py-3.5 text-sm sm:text-[15px] font-semibold text-white shadow-md shadow-emerald-900/10 transition hover:bg-[#097542] disabled:opacity-60"
                    >
                      {loading ? (
                        <span>Creating Helper Account...</span>
                      ) : (
                        <>
                          <span>Signup</span>
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </div>

                  {/* Sign In Prompt */}
                  <p className="pt-1 text-center text-sm text-slate-700">
                    Already a Helper?{" "}
                    <Link
                      href="/login"
                      className="font-bold text-[#0b8a4e] hover:underline"
                    >
                      Sign In
                    </Link>
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
