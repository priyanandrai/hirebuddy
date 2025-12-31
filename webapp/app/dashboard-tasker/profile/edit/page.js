"use client";

import { useState } from "react";
import Link from "next/link";

export default function EditTaskerProfilePage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Mock existing data (later load from API)
  const [form, setForm] = useState({
    firstName: "Rahim",
    lastName: "Khan",
    phone: "9876543210",
    city: "Modipuram, Meerut",
    services: ["Shopping", "Delivery"],
  });

  function handleChange(e) {
    const { name, value } = e.target;

    // Allow only numbers for phone
    if (name === "phone" && !/^\d*$/.test(value)) return;

    setForm({ ...form, [name]: value });
  }

  function toggleService(service) {
    setForm((prev) => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter((s) => s !== service)
        : [...prev.services, service],
    }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (form.phone.length !== 10) {
      setError("Mobile number must be exactly 10 digits.");
      return;
    }

    if (form.services.length === 0) {
      setError("Please select at least one type of work.");
      return;
    }

    setLoading(true);

    console.log("Updated Tasker Profile:", form);

    setTimeout(() => {
      setLoading(false);
      alert("Profile updated successfully!");
    }, 1000);
  }

  return (
    <main className="min-h-screen bg-gray-50 px-5 py-6">

      {/* Header */}
      <section className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">
          Edit Profile
        </h1>
        <p className="text-sm text-gray-600">
          Update your details shown to customers
        </p>
      </section>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="rounded-xl bg-white p-5 shadow-sm space-y-6"
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
            className="mt-1 w-full rounded-md border px-3 py-3 text-sm"
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
            className="mt-1 w-full rounded-md border px-3 py-3 text-sm"
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
            maxLength={10}
            inputMode="numeric"
            required
            className="mt-1 w-full rounded-md border px-3 py-3 text-sm"
          />
          <p className="mt-1 text-xs text-gray-500">
            Enter 10-digit mobile number
          </p>
        </div>

        {/* City (Locked) */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            City
          </label>
          <input
            value={form.city}
            disabled
            className="mt-1 w-full rounded-md border bg-gray-100 px-3 py-3 text-sm text-gray-600"
          />
        </div>

        {/* Services */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Work I Can Do
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
                className={`rounded-md border px-3 py-2 ${
                  form.services.includes(service)
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

        {/* Actions */}
        <div className="space-y-3">
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-green-600 px-4 py-3 text-white font-medium hover:bg-green-700 disabled:opacity-60"
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>

          <Link
            href="/dashboard-tasker/profile"
            className="block w-full rounded-md bg-gray-200 px-4 py-3 text-center text-gray-700"
          >
            Cancel
          </Link>
        </div>
      </form>
    </main>
  );
}
