"use client";

import { useState } from "react";
import Link from "next/link";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";

export default function BecomeHelperPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    city: "Modipuram, Meerut",
    services: [],
  });

  function toggleService(service) {
    setForm((prev) => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter((s) => s !== service)
        : [...prev.services, service],
    }));
  }

  function handleChange(e) {
    const { name, value } = e.target;

    // Allow only numbers in phone field
    if (name === "phone" && !/^\d*$/.test(value)) return;

    setForm({ ...form, [name]: value });
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError("");

    // Phone validation: exactly 10 digits
    if (form.phone.length !== 10) {
      setError("Phone number must be exactly 10 digits.");
      return;
    }

    if (form.services.length === 0) {
      setError("Please select at least one type of work.");
      return;
    }

    setLoading(true);
    // Replace with real submission logic
    setTimeout(() => {
      setLoading(false);
      alert("Thanks! Your details have been submitted. We will contact you soon.");
    }, 1000);
  }

  return (
    <>
      <Header />

      <main className="min-h-screen bg-slate-950 text-slate-100 py-12 px-6">
        <div className="mx-auto max-w-7xl grid gap-10 md:grid-cols-2 items-center">
          {/* Left: marketing */}
          <div className="mx-auto w-full max-w-md">
            <div className="rounded-[2rem] border border-slate-800 bg-slate-900/95 p-8 shadow-sm">
              <h1 className="text-3xl font-bold text-white">Become a Helper</h1>
              <p className="mt-4 text-slate-300">Earn money by helping people nearby. Choose the services you offer, share basic contact details, and we'll reach out when a matching request arrives.</p>

              <ul className="mt-6 space-y-3 text-sm text-slate-300">
                <li>• Flexible hours — accept tasks when you want</li>
                <li>• Competitive payouts and fast payments</li>
                <li>• Local requests in Modipuram, Meerut (coming to more cities)</li>
              </ul>

              <div className="mt-6 flex items-center gap-4">
                <Link href="/post-task" className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition">Browse Tasks</Link>
                <Link href="/how-it-works" className="text-sm text-slate-300 hover:text-white">How it works</Link>
              </div>
            </div>
          </div>

          {/* Right: form */}
          <div className="mx-auto w-full max-w-lg">
            <form onSubmit={handleSubmit} className="space-y-6 rounded-[2rem] border border-slate-800 bg-slate-900/95 p-8 shadow-sm">

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300">First Name</label>
                  <input
                    name="firstName"
                    value={form.firstName}
                    onChange={handleChange}
                    required
                    placeholder="First name"
                    className="mt-1 w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-slate-100 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300">Last Name</label>
                  <input
                    name="lastName"
                    value={form.lastName}
                    onChange={handleChange}
                    required
                    placeholder="Last name"
                    className="mt-1 w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-slate-100 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300">Mobile Number</label>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  required
                  placeholder="10-digit mobile number"
                  className="mt-1 w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-slate-100 focus:ring-2 focus:ring-emerald-500"
                />
                <p className="mt-1 text-xs text-slate-400">Enter a valid 10-digit mobile number</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300">City</label>
                <input value={form.city} disabled className="mt-1 w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-slate-300" />
                <p className="mt-1 text-xs text-slate-400">Currently accepting helpers only from Modipuram, Meerut</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">What work can you do?</label>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {[
                    "Shopping",
                    "Delivery",
                    "Doctor Visit",
                    "Driving",
                    "Home Help",
                    "Other",
                  ].map((service) => (
                    <button
                      type="button"
                      key={service}
                      onClick={() => toggleService(service)}
                      className={`rounded-2xl border px-3 py-2 text-sm transition focus:outline-none focus:ring-2 ${form.services.includes(service) ? "bg-emerald-700 border-emerald-500 text-white" : "bg-slate-900/90 text-slate-300 border-slate-700 hover:bg-slate-800"}`}
                    >
                      {service}
                    </button>
                  ))}
                </div>
              </div>

              {error && <p className="text-sm text-red-400">{error}</p>}

              <button type="submit" disabled={loading} className="w-full rounded-2xl bg-emerald-600 px-4 py-3 font-medium text-white hover:bg-emerald-700 disabled:opacity-60">{loading ? "Submitting..." : "Submit"}</button>

              <p className="text-center text-xs text-slate-400">By continuing, you agree to our <Link href="/terms" className="text-emerald-400 hover:text-white">Terms</Link> and <Link href="/privacy" className="text-emerald-400 hover:text-white">Privacy Policy</Link></p>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
