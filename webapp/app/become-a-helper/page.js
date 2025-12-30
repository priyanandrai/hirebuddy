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

    console.log("Helper Signup:", form);

    setTimeout(() => {
      setLoading(false);
      alert(
        "Thanks! Your details have been submitted. We will contact you soon."
      );
    }, 1000);
  }

  return (
    <>
      <Header></Header>

      <main className="min-h-screen bg-gray-50 px-5 py-8">

        {/* Header */}
        <div className="mx-auto max-w-md text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Become a Helper
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Earn money by helping people in your area
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="mx-auto mt-8 max-w-md space-y-6 rounded-xl bg-white p-6 shadow-sm"
        >

          {/* First Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              First Name
            </label>
            <input
              name="firstName"
              value={form.firstName}
              onChange={handleChange}
              required
              placeholder="First name"
              className="mt-1 w-full rounded-md border px-3 py-3 text-sm focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Last Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Last Name
            </label>
            <input
              name="lastName"
              value={form.lastName}
              onChange={handleChange}
              required
              placeholder="Last name"
              className="mt-1 w-full rounded-md border px-3 py-3 text-sm focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Mobile Number
            </label>
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              type="tel"
              inputMode="numeric"
              maxLength={10}
              required
              placeholder="10-digit mobile number"
              className="mt-1 w-full rounded-md border px-3 py-3 text-sm focus:ring-2 focus:ring-green-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              Enter a valid 10-digit Indian mobile number
            </p>
          </div>

          {/* City (Hardcoded) */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              City
            </label>
            <input
              value={form.city}
              disabled
              className="mt-1 w-full rounded-md border bg-gray-100 px-3 py-3 text-sm text-gray-600"
            />
            <p className="mt-1 text-xs text-gray-500">
              Currently accepting helpers only from Modipuram, Meerut
            </p>
          </div>

          {/* Services */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What work can you do?
            </label>

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
                  className={`rounded-md border px-3 py-2 ${form.services.includes(service)
                      ? "bg-green-100 border-green-500 text-green-700"
                      : "bg-white text-gray-700"
                    }`}
                >
                  {service}
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-600">
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-green-600 px-4 py-3 font-medium text-white hover:bg-green-700 disabled:opacity-60"
          >
            {loading ? "Submitting..." : "Submit"}
          </button>

          {/* Footer */}
          <p className="text-center text-xs text-gray-500">
            By continuing, you agree to our{" "}
            <Link href="/terms" className="underline">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline">
              Privacy Policy
            </Link>
          </p>
        </form>
      </main>
      <Footer></Footer>
    </>
  );
}
