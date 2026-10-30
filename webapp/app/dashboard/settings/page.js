"use client";

import { useContext, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { ThemeContext } from "../../providers";
import {
  getUserProfile,
  updateUserProfile,
} from "@/app/components/services/user.service";
import { uploadDocumentFile } from "@/app/components/services/upload.service";
import {
  User,
  Phone,
  Mail,
  MapPin,
  Home,
  Briefcase,
  Building2,
  Navigation,
  Camera,
  Trash2,
  Save,
  CheckCircle2,
  AlertCircle,
  Sun,
  Moon,
  Bell,
  ShieldCheck,
  ArrowLeft,
  Loader2,
  Sparkles,
} from "lucide-react";

const ADDRESS_TYPES = [
  { id: "Home", label: "Home", icon: Home },
  { id: "Work", label: "Work / Office", icon: Briefcase },
  { id: "Other", label: "Other", icon: Building2 },
];

export default function DashboardSettings() {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const { data: session } = useSession();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [toast, setToast] = useState(null);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    image: "",
    role: "USER",
    addressType: "Home",
    houseNo: "",
    street: "",
    landmark: "",
    city: "",
    state: "",
    pincode: "",
    address: "",
    latitude: null,
    longitude: null,
    deliveryNotes: "",
    notifyTaskUpdates: true,
    notifySmsWhatsapp: true,
    notifyOffers: false,
  });

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4000);
  };

  // Parse existing user object into form fields
  const populateFromUser = (u) => {
    if (!u) return;
    const rawPhone = u.phone ? String(u.phone).replace(/^\+91/, "").replace(/\D/g, "").slice(-10) : "";

    setForm((prev) => {
      const nextAddress = u.address ?? prev.address ?? "";
      const nextCity = u.city ?? prev.city ?? "";

      return {
        ...prev,
        name: u.name || prev.name || "",
        email: u.email || prev.email || "",
        phone: rawPhone || prev.phone || "",
        image: u.image ?? prev.image ?? "",
        role: u.role || prev.role || "USER",
        addressType: u.addressType || prev.addressType || "Home",
        houseNo: u.houseNo ?? prev.houseNo ?? "",
        street: u.street ?? (u.houseNo ? prev.street : nextAddress) ?? "",
        landmark: u.landmark ?? prev.landmark ?? "",
        city: nextCity,
        state: u.state ?? prev.state ?? "",
        pincode: u.pincode ?? prev.pincode ?? "",
        address: nextAddress,
        latitude: u.latitude ?? prev.latitude ?? null,
        longitude: u.longitude ?? prev.longitude ?? null,
        deliveryNotes: u.deliveryNotes ?? prev.deliveryNotes ?? "",
        notifyTaskUpdates:
          u.notifyTaskUpdates !== undefined ? u.notifyTaskUpdates : prev.notifyTaskUpdates,
        notifySmsWhatsapp:
          u.notifySmsWhatsapp !== undefined ? u.notifySmsWhatsapp : prev.notifySmsWhatsapp,
        notifyOffers:
          u.notifyOffers !== undefined ? u.notifyOffers : prev.notifyOffers,
      };
    });
  };

  useEffect(() => {
    // 1. Seed from NextAuth session if present
    if (session?.user) {
      populateFromUser(session.user);
    }

    // 2. Seed from localStorage user cache
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        populateFromUser(JSON.parse(stored));
      }
    } catch (e) {}

    // 3. Fetch latest profile from backend API
    getUserProfile()
      .then((res) => {
        if (res?.user) {
          populateFromUser(res.user);
          try {
            const currentStored = JSON.parse(localStorage.getItem("user") || "{}");
            localStorage.setItem(
              "user",
              JSON.stringify({ ...currentStored, ...res.user })
            );
          } catch (e) {}
        }
      })
      .catch(() => {
        // Fallback to localStorage/session silently if unauthenticated or offline
      })
      .finally(() => {
        setLoading(false);
      });
  }, [session]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === "phone" && !/^\d*$/.test(value)) return;
    if (name === "pincode" && !/^\d*$/.test(value)) return;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Compose full formatted address from structured fields
  const buildFullAddress = (stateObj) => {
    const parts = [
      stateObj.houseNo?.trim(),
      stateObj.street?.trim(),
      stateObj.landmark?.trim() ? `Near ${stateObj.landmark.trim()}` : "",
      stateObj.city?.trim(),
      stateObj.state?.trim(),
      stateObj.pincode?.trim() ? `- ${stateObj.pincode.trim()}` : "",
    ].filter(Boolean);

    if (parts.length > 0) {
      return parts.join(", ").replace(", - ", " - ");
    }
    return (stateObj.address || "").trim();
  };

  // Handle profile photo upload
  const handlePhotoSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setUploadingPhoto(true);

    try {
      const res = await uploadDocumentFile(file);
      const uploadedUrl = res?.data?.url || res?.url;
      if (uploadedUrl) {
        setForm((prev) => ({ ...prev, image: uploadedUrl }));
        showToast("Profile photo uploaded! Click Save Changes to apply.");
      } else {
        throw new Error("Upload response did not contain a URL");
      }
    } catch (err) {
      // Fallback to local Data URL so user can still preview & save avatar locally
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setForm((prev) => ({ ...prev, image: reader.result }));
          showToast("Profile photo ready! Click Save Changes to save.");
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Detect live GPS location and reverse geocode into address fields
  const handleDetectLocation = () => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      setError("Geolocation is not supported by your browser.");
      return;
    }

    setError("");
    setDetectingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const resp = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
          );
          const data = await resp.json();
          const addr = data?.address || {};

          const detectedStreet = [
            addr.suburb || addr.neighbourhood || addr.residential,
            addr.road || addr.pedestrian,
          ]
            .filter(Boolean)
            .join(", ");

          const detectedCity =
            addr.city ||
            addr.town ||
            addr.municipality ||
            addr.county ||
            addr.state_district ||
            "";
          const detectedState = addr.state || "";
          const detectedPincode = addr.postcode || "";

          setForm((prev) => {
            const updated = {
              ...prev,
              street: detectedStreet || data?.display_name?.split(",").slice(0, 2).join(", ") || prev.street,
              city: detectedCity || prev.city,
              state: detectedState || prev.state,
              pincode: detectedPincode ? String(detectedPincode).replace(/\D/g, "").slice(0, 6) : prev.pincode,
              latitude,
              longitude,
            };
            updated.address = buildFullAddress(updated);
            return updated;
          });

          showToast("Current location & address detected!");
        } catch (geoErr) {
          setForm((prev) => ({
            ...prev,
            latitude,
            longitude,
          }));
          showToast("GPS coordinates captured! Please fill in your street & city.");
        } finally {
          setDetectingLocation(false);
        }
      },
      (geoError) => {
        setDetectingLocation(false);
        setError(
          geoError?.message ||
            "Unable to access your location. Please enable location permissions or type your address manually."
        );
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const cleanName = form.name.trim();
    if (!cleanName) {
      setError("Please enter your full name.");
      return;
    }

    const cleanPhone = form.phone.trim();
    if (cleanPhone && cleanPhone.length !== 10) {
      setError("Mobile number must be exactly 10 digits.");
      return;
    }

    if (form.pincode && form.pincode.trim().length !== 6) {
      setError("Pincode must be 6 digits.");
      return;
    }

    const composedAddress = buildFullAddress(form);
    const cityWithState =
      form.city.trim() && form.state.trim() && !form.city.includes(",")
        ? `${form.city.trim()}, ${form.state.trim()}`
        : form.city.trim();

    setSaving(true);
    try {
      const payload = {
        name: cleanName,
        email: form.email.trim() || undefined,
        phone: cleanPhone || undefined,
        image: form.image || null,
        city: cityWithState || undefined,
        address: composedAddress || undefined,
        latitude: form.latitude,
        longitude: form.longitude,
      };

      let apiUser = null;
      try {
        const res = await updateUserProfile(payload);
        apiUser = res?.user || res;
      } catch (apiErr) {
        // If user is in demo/NextAuth session without backend JWT, still persist locally
        if (
          apiErr?.status &&
          apiErr.status !== 401 &&
          apiErr.status !== 403 &&
          apiErr.message
        ) {
          throw apiErr;
        }
      }

      const prevStored = (() => {
        try {
          return JSON.parse(localStorage.getItem("user") || "{}");
        } catch {
          return {};
        }
      })();

      const updatedUserObject = {
        ...prevStored,
        ...(apiUser || {}),
        name: cleanName,
        email: form.email.trim() || prevStored.email || "",
        phone: cleanPhone || prevStored.phone || "",
        image: form.image || "",
        city: cityWithState,
        address: composedAddress,
        addressType: form.addressType,
        houseNo: form.houseNo.trim(),
        street: form.street.trim(),
        landmark: form.landmark.trim(),
        state: form.state.trim(),
        pincode: form.pincode.trim(),
        latitude: form.latitude,
        longitude: form.longitude,
        deliveryNotes: form.deliveryNotes.trim(),
        notifyTaskUpdates: form.notifyTaskUpdates,
        notifySmsWhatsapp: form.notifySmsWhatsapp,
        notifyOffers: form.notifyOffers,
      };

      localStorage.setItem("user", JSON.stringify(updatedUserObject));
      setForm((prev) => ({
        ...prev,
        address: composedAddress,
        city: form.city.trim(),
      }));

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("userProfileUpdated"));
      }

      showToast("Profile and address updated successfully!");
    } catch (err) {
      setError(err?.message || "Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const composedPreviewAddress = buildFullAddress(form);

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-[#050b18] px-4 sm:px-6 py-8 text-slate-900 dark:text-slate-100">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-2xl border border-emerald-500/40 bg-[#071a24] px-5 py-3.5 text-sm font-semibold text-emerald-300 shadow-2xl">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toast.message}</span>
        </div>
      )}

      <div className="mx-auto max-w-4xl space-y-6">
        {/* Top Header */}
        <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-3xl border border-slate-200 dark:border-[#162646] bg-white dark:bg-[#0a1326] p-6 shadow-lg">
          <div>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline mb-2"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Dashboard</span>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Account & Profile Settings
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Update your personal details, saved service address, and app preferences.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="h-4 w-4" />
              <span>{form.role === "HELPER" ? "Helper Partner" : "Verified Customer"}</span>
            </span>
          </div>
        </section>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 1. Profile Photo & Overview Card */}
          <section className="rounded-3xl border border-slate-200 dark:border-[#162646] bg-white dark:bg-[#0a1326] p-6 sm:p-8 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center gap-6">
              {/* Avatar */}
              <div className="relative shrink-0 self-start sm:self-center">
                {form.image ? (
                  <img
                    src={form.image}
                    alt={form.name || "Profile"}
                    className="h-24 w-24 rounded-3xl object-cover border-2 border-blue-500/40 shadow-xl"
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-600 text-3xl font-extrabold text-white shadow-xl shadow-blue-600/20">
                    {(form.name || "U").charAt(0).toUpperCase()}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  title="Upload new photo"
                  className="absolute -bottom-2 -right-2 flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg hover:bg-blue-500 transition disabled:opacity-60"
                >
                  {uploadingPhoto ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
              </div>

              {/* Summary & Upload Controls */}
              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    {form.name || "Your Profile"}
                  </h2>
                  <span className="rounded-full bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                    {form.addressType} Address
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-blue-500 shrink-0" />
                  <span className="truncate">
                    {composedPreviewAddress || "No service address saved yet"}
                  </span>
                </p>

                <div className="flex flex-wrap items-center gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingPhoto}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/80 px-3.5 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                  >
                    <Camera className="h-3.5 w-3.5 text-blue-500" />
                    <span>{uploadingPhoto ? "Uploading..." : "Change Photo"}</span>
                  </button>

                  {form.image && (
                    <button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, image: "" }))}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 transition"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Remove Photo</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* 2. Personal Information */}
          <section className="rounded-3xl border border-slate-200 dark:border-[#162646] bg-white dark:bg-[#0a1326] p-6 sm:p-8 shadow-lg space-y-5">
            <div className="flex items-center gap-2.5 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
                <User className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Personal Information
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Your contact details used for booking confirmations and helper coordination.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  Full Name *
                </label>
                <div className="relative mt-2">
                  <User className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    placeholder="e.g. Puja Rai"
                    className="w-full rounded-2xl border border-slate-300 dark:border-[#1d2f52] bg-slate-50 dark:bg-[#060c1b] py-3 pl-10 pr-4 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Mobile Number */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  Mobile Number
                </label>
                <div className="relative mt-2 flex">
                  <span className="inline-flex items-center gap-1 rounded-l-2xl border border-r-0 border-slate-300 dark:border-[#1d2f52] bg-slate-100 dark:bg-[#0d182e] px-3.5 text-xs font-bold text-slate-600 dark:text-slate-300">
                    <Phone className="h-3.5 w-3.5 text-blue-500" />
                    +91
                  </span>
                  <input
                    type="text"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    maxLength={10}
                    inputMode="numeric"
                    placeholder="10-digit mobile number"
                    className="w-full rounded-r-2xl border border-slate-300 dark:border-[#1d2f52] bg-slate-50 dark:bg-[#060c1b] py-3 px-4 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  Email Address
                </label>
                <div className="relative mt-2">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="e.g. name@example.com"
                    className="w-full rounded-2xl border border-slate-300 dark:border-[#1d2f52] bg-slate-50 dark:bg-[#060c1b] py-3 pl-10 pr-4 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* 3. Service Address & Location Details */}
          <section className="rounded-3xl border border-slate-200 dark:border-[#162646] bg-white dark:bg-[#0a1326] p-6 sm:p-8 shadow-lg space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    Address & Location Details
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Your default address for home services, pickups, and nearby task matching.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDetectLocation}
                disabled={detectingLocation}
                className="inline-flex items-center gap-2 self-start sm:self-auto rounded-2xl border border-blue-500/40 bg-blue-500/10 px-4 py-2.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 transition disabled:opacity-60"
              >
                {detectingLocation ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Navigation className="h-4 w-4" />
                )}
                <span>
                  {detectingLocation ? "Detecting Location..." : "Use Current GPS Location"}
                </span>
              </button>
            </div>

            {/* Address Type Pills */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2.5">
                Save Address As
              </label>
              <div className="flex flex-wrap gap-2.5">
                {ADDRESS_TYPES.map((item) => {
                  const Icon = item.icon;
                  const active = form.addressType === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, addressType: item.id }))}
                      className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-xs font-bold transition ${
                        active
                          ? "border-blue-500 bg-blue-600 text-white shadow-md shadow-blue-600/25"
                          : "border-slate-300 dark:border-[#1d2f52] bg-slate-50 dark:bg-[#060c1b] text-slate-600 dark:text-slate-300 hover:border-blue-400"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* House / Flat / Building */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  House / Flat / Floor / Building
                </label>
                <input
                  type="text"
                  name="houseNo"
                  value={form.houseNo}
                  onChange={handleChange}
                  placeholder="e.g. Flat 302, Green Residency"
                  className="mt-2 w-full rounded-2xl border border-slate-300 dark:border-[#1d2f52] bg-slate-50 dark:bg-[#060c1b] py-3 px-4 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Street / Locality / Sector */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  Street / Area / Locality
                </label>
                <input
                  type="text"
                  name="street"
                  value={form.street}
                  onChange={handleChange}
                  placeholder="e.g. Phase 2, Modipuram"
                  className="mt-2 w-full rounded-2xl border border-slate-300 dark:border-[#1d2f52] bg-slate-50 dark:bg-[#060c1b] py-3 px-4 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Landmark */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  Landmark (Optional)
                </label>
                <input
                  type="text"
                  name="landmark"
                  value={form.landmark}
                  onChange={handleChange}
                  placeholder="e.g. Near Metro Pillar 42 / Apollo Pharmacy"
                  className="mt-2 w-full rounded-2xl border border-slate-300 dark:border-[#1d2f52] bg-slate-50 dark:bg-[#060c1b] py-3 px-4 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* City */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  City / Town
                </label>
                <input
                  type="text"
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  placeholder="e.g. Meerut"
                  className="mt-2 w-full rounded-2xl border border-slate-300 dark:border-[#1d2f52] bg-slate-50 dark:bg-[#060c1b] py-3 px-4 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* State */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  State
                </label>
                <input
                  type="text"
                  name="state"
                  value={form.state}
                  onChange={handleChange}
                  placeholder="e.g. Uttar Pradesh"
                  className="mt-2 w-full rounded-2xl border border-slate-300 dark:border-[#1d2f52] bg-slate-50 dark:bg-[#060c1b] py-3 px-4 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Pincode */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  Pincode
                </label>
                <input
                  type="text"
                  name="pincode"
                  value={form.pincode}
                  onChange={handleChange}
                  maxLength={6}
                  inputMode="numeric"
                  placeholder="6-digit Pincode (e.g. 250110)"
                  className="mt-2 w-full rounded-2xl border border-slate-300 dark:border-[#1d2f52] bg-slate-50 dark:bg-[#060c1b] py-3 px-4 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Delivery / Helper Instructions */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  Directions / Entry Instructions for Helper (Optional)
                </label>
                <textarea
                  name="deliveryNotes"
                  rows={2}
                  value={form.deliveryNotes}
                  onChange={handleChange}
                  placeholder="e.g. Security gate code #1234, call upon arrival..."
                  className="mt-2 w-full rounded-2xl border border-slate-300 dark:border-[#1d2f52] bg-slate-50 dark:bg-[#060c1b] py-3 px-4 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Live Formatted Address Preview */}
            <div className="rounded-2xl border border-slate-200 dark:border-[#192b4d] bg-slate-100/70 dark:bg-[#060c1b]/90 p-4 flex items-start gap-3">
              <MapPin className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm">
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  Full Service Address Preview ({form.addressType}):
                </span>
                <p className="mt-0.5 text-slate-600 dark:text-slate-400">
                  {composedPreviewAddress || "Fill in the fields above to preview your complete service address."}
                </p>
                {form.latitude && form.longitude && (
                  <p className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                    GPS Pin Saved: {Number(form.latitude).toFixed(4)}, {Number(form.longitude).toFixed(4)}
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* 4. Appearance & Notification Preferences */}
          <section className="rounded-3xl border border-slate-200 dark:border-[#162646] bg-white dark:bg-[#0a1326] p-6 sm:p-8 shadow-lg space-y-6">
            <div className="flex items-center gap-2.5 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Appearance & Preferences
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Customize your display theme and notification alerts.
                </p>
              </div>
            </div>

            {/* Theme Switcher */}
            <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 dark:border-[#1d2f52] bg-slate-50 dark:bg-[#060c1b] p-4">
              <div className="flex items-center gap-3.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
                  {theme === "dark" ? (
                    <Moon className="h-5 w-5 text-amber-400" />
                  ) : (
                    <Sun className="h-5 w-5 text-amber-500" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    Application Theme
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Currently using{" "}
                    <span className="font-semibold capitalize text-blue-600 dark:text-blue-400">
                      {theme}
                    </span>{" "}
                    mode.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={toggleTheme}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 transition shadow-sm"
              >
                {theme === "dark" ? (
                  <>
                    <Sun className="h-4 w-4 text-amber-400" />
                    <span>Switch to Light</span>
                  </>
                ) : (
                  <>
                    <Moon className="h-4 w-4 text-slate-700" />
                    <span>Switch to Dark</span>
                  </>
                )}
              </button>
            </div>

            {/* Notification Checkboxes */}
            <div className="space-y-3">
              <label className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 dark:border-[#1d2f52] bg-slate-50 dark:bg-[#060c1b] p-4 cursor-pointer">
                <div className="flex items-center gap-3">
                  <Bell className="h-4 w-4 text-blue-500 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      Task & Booking Status Updates
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Get notified immediately when a helper accepts or completes your task.
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  name="notifyTaskUpdates"
                  checked={form.notifyTaskUpdates}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-slate-400 text-blue-600 focus:ring-blue-500"
                />
              </label>

              <label className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 dark:border-[#1d2f52] bg-slate-50 dark:bg-[#060c1b] p-4 cursor-pointer">
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-emerald-500 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      SMS & WhatsApp Coordination Alerts
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Receive helper arrival alerts and OTP confirmations on your mobile number.
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  name="notifySmsWhatsapp"
                  checked={form.notifySmsWhatsapp}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-slate-400 text-blue-600 focus:ring-blue-500"
                />
              </label>
            </div>
          </section>

          {/* Error Banner */}
          {error && (
            <div className="flex items-center gap-2.5 rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3.5 text-xs sm:text-sm font-semibold text-rose-600 dark:text-rose-300">
              <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Save & Cancel Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0a1326] px-6 py-3.5 text-center text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={saving || loading}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-500 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/30 transition disabled:opacity-60"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Save Profile & Address</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
