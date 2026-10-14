"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { submitIdDocument } from "@/app/components/services/user.service";
import DocumentUploader from "@/app/components/ui/DocumentUploader";

export default function EditTaskerProfilePage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [idUrl, setIdUrl] = useState("");
  const [idStatus, setIdStatus] = useState("UNVERIFIED");
  const [idSubmitting, setIdSubmitting] = useState(false);

  // Mock existing data (later load from API)
  const [form, setForm] = useState({
    firstName: "Rahim",
    lastName: "Khan",
    phone: "9876543210",
    city: "Modipuram, Meerut",
    services: ["Shopping", "Delivery"],
  });

  useEffect(() => {
    try {
      const stored = typeof window !== "undefined" ? localStorage.getItem("user") : null;
      if (stored) {
        const u = JSON.parse(stored);
        const parts = (u.name || "").split(" ");
        setForm((prev) => ({
          ...prev,
          firstName: parts[0] || prev.firstName,
          lastName: parts.slice(1).join(" ") || prev.lastName,
          phone: u.phone || prev.phone,
          city: u.city || prev.city,
          services: u.skills
            ? typeof u.skills === "string"
              ? u.skills.split(",").map((s) => s.trim())
              : u.skills
            : prev.services,
        }));
        if (u.idDocumentUrl) setIdUrl(u.idDocumentUrl);
        if (u.idVerificationStatus) setIdStatus(u.idVerificationStatus);
      }
    } catch (e) {
      console.warn("Could not load user from localStorage", e);
    }
  }, []);

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

  async function handleSubmitId(e) {
    if (e) e.preventDefault();
    const targetUrl = idUrl.trim();
    if (!targetUrl) {
      alert("Please enter a valid document link or URL.");
      return;
    }
    setIdSubmitting(true);
    try {
      await submitIdDocument({ idDocumentUrl: targetUrl });
      setIdStatus("PENDING");
      // update stored user
      const stored = localStorage.getItem("user");
      if (stored) {
        const u = JSON.parse(stored);
        u.idDocumentUrl = targetUrl;
        u.idVerificationStatus = "PENDING";
        localStorage.setItem("user", JSON.stringify(u));
      }
      alert("ID document submitted! Admin will review your verification.");
    } catch (err) {
      console.error("Submit ID failed", err);
      alert(err.message || "Failed to submit ID.");
    } finally {
      setIdSubmitting(false);
    }
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

        {/* Government ID Verification Section */}
        <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Government ID Verification</h3>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                idStatus === "VERIFIED"
                  ? "bg-green-100 text-green-700"
                  : idStatus === "PENDING"
                  ? "bg-amber-100 text-amber-700"
                  : idStatus === "REJECTED"
                  ? "bg-red-100 text-red-700"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              {idStatus === "PENDING" ? "Under Review" : idStatus}
            </span>
          </div>

          <DocumentUploader
            value={idUrl}
            onChange={(url) => setIdUrl(url)}
            theme="light"
            label="Upload Document / Enter Link"
            optionalText=""
            badgeText=""
            helperText="Upload Aadhaar Card, Driving License, or Voter ID (JPG, PNG, PDF) from your device or paste a URL."
          />

          <button
            type="button"
            onClick={handleSubmitId}
            disabled={idSubmitting || !idUrl.trim()}
            className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition shadow-sm"
          >
            {idSubmitting ? "Submitting ID..." : "Submit ID for Verification"}
          </button>
        </div>
      </form>
    </main>
  );
}
