"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import { becomeHelperApi } from "../components/lib/api";

export default function BecomeHelperPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const oneTapTriggeredRef = useRef(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);

  // Auto-open the Google sign-in drawer when the page loads
  useEffect(() => {
    const timer = setTimeout(() => setDrawerOpen(true), 400);
    return () => clearTimeout(timer);
  }, []);

  // Show native Google One Tap prompt automatically on this page.
  useEffect(() => {
    if (status !== "unauthenticated" || !drawerOpen || oneTapTriggeredRef.current) {
      return;
    }

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      return;
    }

    const initializeOneTap = () => {
      if (!window.google?.accounts?.id || oneTapTriggeredRef.current) {
        return;
      }

      window.google.accounts.id.initialize({
        client_id: clientId,
        context: "signin",
        cancel_on_tap_outside: false,
        callback: (response) => {
          if (!response?.credential || oneTapTriggeredRef.current) {
            return;
          }

          oneTapTriggeredRef.current = true;
          signIn("google", { callbackUrl: "/dashboard-tasker" });
        },
      });

      window.google.accounts.id.prompt();
    };

    const existingScript = document.getElementById("google-one-tap-script");
    if (existingScript) {
      initializeOneTap();
      return;
    }

    const script = document.createElement("script");
    script.id = "google-one-tap-script";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = initializeOneTap;
    document.head.appendChild(script);

    return () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.cancel();
      }
    };
  }, [status, drawerOpen]);

  const detectedName = session?.user?.name?.trim() || "Helper Account";
  const detectedEmail = session?.user?.email?.trim() || "Sign in with your Google account";
  const detectedImage = session?.user?.image || "";
  const firstName = detectedName.split(" ")[0] || "Google";

  useEffect(() => {
    setAvatarLoadFailed(false);
    setAvatarLoading(Boolean(detectedImage));
  }, [detectedImage]);

  const handleGoogleContinue = () => {
    if (status === "authenticated") {
      router.push("/dashboard-tasker");
      return;
    }
    signIn("google", { callbackUrl: "/dashboard-tasker" });
  };

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

    const submitHelperProfile = async () => {
      setLoading(true);

      try {
        const token = session?.backendToken || localStorage.getItem("token");

        if (!token) {
          setError("Please sign in first, then continue as helper.");
          setDrawerOpen(true);
          return;
        }

        const payload = {
          city: form.city,
          skills: form.services.join(", "),
          experience: 0,
        };

        await becomeHelperApi(token, payload);
        localStorage.setItem("token", token);
        router.push("/dashboard-tasker");
      } catch (err) {
        setError(err.message || "Failed to become helper.");
      } finally {
        setLoading(false);
      }
    };

    submitHelperProfile();
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
            {loading ? "Submitting..." : "Submit & Become Helper"}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <div className="flex-1 border-t" />
            OR
            <div className="flex-1 border-t" />
          </div>

          {/* Continue with Google */}
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="w-full rounded-lg border border-gray-300 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition flex items-center justify-center gap-2"
          >
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.7 1.22 9.2 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.2C12.43 13.72 17.77 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.5 24c0-1.57-.14-3.09-.4-4.57H24v9.13h12.7c-.55 2.96-2.18 5.47-4.63 7.15l7.2 5.6C43.98 36.92 46.5 30.94 46.5 24z" />
              <path fill="#FBBC05" d="M10.54 28.42c-.48-1.45-.76-2.99-.76-4.42s.27-2.97.76-4.42l-7.98-6.2C.92 16.04 0 19.91 0 24c0 4.09.92 7.96 2.56 11.62l7.98-6.2z" />
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.9-5.79l-7.2-5.6c-2 1.35-4.57 2.15-8.7 2.15-6.23 0-11.57-4.22-13.46-9.92l-7.98 6.2C6.51 42.62 14.62 48 24 48z" />
            </svg>
            Continue with Google
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

      {/* Side Drawer Overlay */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Side Drawer — Google One Tap style */}
      <div
        className={`fixed top-0 right-0 z-50 w-full rounded-xl max-w-xs bg-white shadow-2xl transition-transform duration-300 flex flex-col ${
          drawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Google-style header */}
        <div className="flex items-center justify-between px-4 pt-5 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            {/* Google "G" logo */}
            <svg width="22" height="22" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.7 1.22 9.2 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.2C12.43 13.72 17.77 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.5 24c0-1.57-.14-3.09-.4-4.57H24v9.13h12.7c-.55 2.96-2.18 5.47-4.63 7.15l7.2 5.6C43.98 36.92 46.5 30.94 46.5 24z" />
              <path fill="#FBBC05" d="M10.54 28.42c-.48-1.45-.76-2.99-.76-4.42s.27-2.97.76-4.42l-7.98-6.2C.92 16.04 0 19.91 0 24c0 4.09.92 7.96 2.56 11.62l7.98-6.2z" />
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.9-5.79l-7.2-5.6c-2 1.35-4.57 2.15-8.7 2.15-6.23 0-11.57-4.22-13.46-9.92l-7.98 6.2C6.51 42.62 14.62 48 24 48z" />
            </svg>
            <span className="text-sm font-medium text-gray-700">
              Sign in to <span className="font-semibold">HireBuddy</span> with google.com
            </span>
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            className="text-gray-400 hover:text-gray-600 ml-2 shrink-0"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Account card */}
        <div className="mx-4 mt-5 rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          {/* Avatar + info */}
          <div className="flex items-center gap-3 px-4 py-4">
            {detectedImage && !avatarLoadFailed ? (
              <div className="relative w-11 h-11 shrink-0">
                {avatarLoading && (
                  <div className="absolute inset-0 rounded-full bg-gray-200 animate-pulse" />
                )}
                <img
                  src={detectedImage}
                  alt={detectedName}
                  className={`w-11 h-11 rounded-full object-cover transition-opacity duration-200 ${avatarLoading ? "opacity-0" : "opacity-100"}`}
                  referrerPolicy="no-referrer"
                  onLoad={() => setAvatarLoading(false)}
                  onError={() => {
                    setAvatarLoadFailed(true);
                    setAvatarLoading(false);
                  }}
                />
              </div>
            ) : (
              <div className="w-11 h-11 rounded-full bg-green-500 flex items-center justify-center text-white font-semibold text-lg shrink-0">
                {firstName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{detectedName}</p>
              <p className="text-xs text-gray-500 truncate">{detectedEmail}</p>
            </div>
          </div>

          <div className="border-t border-gray-100" />

          {/* Continue button */}
          <div className="px-4 py-4">
            <button
              onClick={handleGoogleContinue}
              className="w-full rounded-full bg-[#1a73e8] hover:bg-[#1765cc] active:bg-[#1558b0] text-white text-sm font-medium py-2.5 transition-colors"
            >
              {status === "authenticated" ? `Continue as ${firstName}` : "Continue with Google"}
            </button>
          </div>
        </div>

        {/* Privacy note */}
        <p className="mt-4 px-5 text-xs text-gray-400 leading-relaxed">
          To continue, google.com will share your name, email address, and profile picture with HireBuddy. See HireBuddy&apos;s{" "}
          <Link href="/privacy" className="text-[#1a73e8] hover:underline">
            privacy policy
          </Link>
          .
        </p>
      </div>

      <Footer></Footer>
    </>
  );
}
