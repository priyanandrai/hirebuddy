"use client";

import { useEffect, useState, useCallback, useMemo, use } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import HeaderAfterlogin from "../../../components/layout/HeaderAfterlogin";
import Footer from "../../../components/layout/Footer";
import {
  getMarketplaceServiceDetail,
  placeMarketplaceOrder,
} from "../../../components/services/marketplace.service";
import { createPaymentOrder } from "../../../components/services/payment.service";
import { openRazorpayCheckout } from "../../../components/lib/razorpayCheckout";
import { getUserProfile } from "../../../components/services/user.service";

const PICKUP_TIME_SLOTS = [
  "09:00 AM – 11:00 AM (Morning Slot)",
  "11:00 AM – 02:00 PM (Midday Slot)",
  "02:00 PM – 05:00 PM (Afternoon Slot)",
  "05:00 PM – 08:00 PM (Evening Slot)",
];

export default function MultiSellerServiceBookingPage({ params }) {
  const resolvedParams = use(params);
  const slug = resolvedParams?.slug;
  const { data: session } = useSession();

  const [service, setService] = useState(null);
  const [allSellerOfferings, setAllSellerOfferings] = useState([]);
  const [relatedServices, setRelatedServices] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selected option quantities: { [optionId]: quantity }
  const [selectedQtyByOption, setSelectedQtyByOption] = useState({});
  const [activeOptionGroup, setActiveOptionGroup] = useState("ALL");
  const [optionSearch, setOptionSearch] = useState("");
  const [showRateCardPreview, setShowRateCardPreview] = useState(false);

  // Pickup Date & Slot
  const tomorrowIso = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  }, []);
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTimeSlot, setPickupTimeSlot] = useState(PICKUP_TIME_SLOTS[0]);

  useEffect(() => {
    setPickupDate(tomorrowIso);
  }, [tomorrowIso]);

  // Checkout Modal State
  const [showBookModal, setShowBookModal] = useState(false);
  const [editingShipping, setEditingShipping] = useState(false);
  const [shippingForm, setShippingForm] = useState({
    customerName: "",
    customerPhone: "",
    shippingAddress: "Modipuram, Meerut, UP",
    shippingCity: "Meerut",
    shippingPincode: "250110",
  });
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [orderResult, setOrderResult] = useState(null);
  const [orderError, setOrderError] = useState("");

  const applyProfileToShipping = useCallback((u) => {
    if (!u) return;
    const name = (u.name || "").trim();
    const phone = (u.phone || u.mobile || "").trim();
    const addrParts = [u.address, u.city].map((s) => (s || "").trim()).filter(Boolean);
    const fullAddress =
      addrParts.length === 2 && addrParts[0].toLowerCase().includes(addrParts[1].toLowerCase())
        ? addrParts[0]
        : addrParts.join(", ") || (u.location || "").trim();
    const city = (u.city || "Meerut").trim();
    const pincode = (u.pincode || "250110").trim();

    if (name || phone || fullAddress) {
      setShippingForm((prev) => ({
        ...prev,
        customerName: name || prev.customerName || "HireBuddy Customer",
        customerPhone: phone || prev.customerPhone || "9897000000",
        shippingAddress: fullAddress || prev.shippingAddress || "Modipuram, Meerut, UP",
        shippingCity: city || prev.shippingCity,
        shippingPincode: pincode || prev.shippingPincode,
      }));
    }
  }, []);

  useEffect(() => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token && !session?.user) return;

    if (session?.user) applyProfileToShipping(session.user);
    try {
      const stored = JSON.parse(localStorage.getItem("user") || "{}");
      if (stored && (stored.name || stored.phone || stored.address)) {
        applyProfileToShipping(stored);
      }
    } catch {}

    getUserProfile()
      .then((res) => {
        const u = res?.user || res?.data || res;
        if (u && typeof u === "object") applyProfileToShipping(u);
      })
      .catch(() => {});
  }, [session, applyProfileToShipping]);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    let preferredSellerId = null;
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      preferredSellerId = sp.get("sellerId") || null;
    }
    getMarketplaceServiceDetail(slug, preferredSellerId)
      .then((res) => {
        if (res?.service) {
          setService(res.service);
          setAllSellerOfferings(res.allSellerOfferings || [res.service]);
          setRelatedServices(res.relatedServices || []);
          setReviews(res.reviews || []);
          const firstOpt = res.service.options?.[0];
          if (firstOpt) {
            setSelectedQtyByOption({ [firstOpt.id]: 1 });
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  const handleSelectSellerOffering = (offering) => {
    if (!offering) return;
    setService(offering);
    setActiveOptionGroup("ALL");

    // Preserve matching option titles across sellers if customer already selected items (e.g., Shirt, 2-Pc Suit)!
    setSelectedQtyByOption((prev) => {
      const currentOptions = service?.options || [];
      const selectedTitles = [];
      for (const opt of currentOptions) {
        if (prev[opt.id] > 0) {
          selectedTitles.push({ title: opt.title.toLowerCase(), qty: prev[opt.id] });
        }
      }
      const nextMap = {};
      for (const item of selectedTitles) {
        const match = (offering.options || []).find(
          (cand) =>
            cand.title.toLowerCase() === item.title ||
            cand.title.toLowerCase().includes(item.title.split(" ")[0])
        );
        if (match) {
          nextMap[match.id] = item.qty;
        }
      }
      if (Object.keys(nextMap).length === 0 && offering.options?.[0]) {
        nextMap[offering.options[0].id] = 1;
      }
      return nextMap;
    });
  };

  const updateOptionQty = (optionId, delta) => {
    setSelectedQtyByOption((prev) => {
      const nextQty = (prev[optionId] || 0) + delta;
      const copy = { ...prev };
      if (nextQty <= 0) {
        delete copy[optionId];
      } else {
        copy[optionId] = nextQty;
      }
      return copy;
    });
  };

  const optionGroups = useMemo(() => {
    const opts = service?.options || [];
    const groups = [...new Set(opts.map((o) => o.groupName || "Standard Options"))];
    return ["ALL", ...groups];
  }, [service]);

  const visibleOptions = useMemo(() => {
    let opts = service?.options || [];
    if (activeOptionGroup !== "ALL") {
      opts = opts.filter((o) => (o.groupName || "Standard Options") === activeOptionGroup);
    }
    const q = optionSearch.trim().toLowerCase();
    if (q) {
      opts = opts.filter(
        (o) =>
          o.title.toLowerCase().includes(q) ||
          (o.groupName || "").toLowerCase().includes(q)
      );
    }
    return opts;
  }, [service, activeOptionGroup, optionSearch]);

  const selectedLineItems = useMemo(() => {
    const opts = service?.options || [];
    return opts
      .filter((o) => (selectedQtyByOption[o.id] || 0) > 0)
      .map((o) => ({
        option: o,
        qty: selectedQtyByOption[o.id],
        lineTotalRupees: o.priceRupees * selectedQtyByOption[o.id],
      }));
  }, [service, selectedQtyByOption]);

  const totalSelectedCount = selectedLineItems.reduce((s, li) => s + li.qty, 0);
  const totalPayableRupees = selectedLineItems.reduce((s, li) => s + li.lineTotalRupees, 0);

  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    if (!service || selectedLineItems.length === 0) return;

    setOrderSubmitting(true);
    setOrderError("");

    try {
      const paymentOrderData = await createPaymentOrder({
        amountRupees: totalPayableRupees,
        purpose: "MARKETPLACE_ORDER",
        notes: {
          serviceId: service.id,
          sellerName: service.seller?.businessName || "",
        },
      });

      const summaryDesc = selectedLineItems
        .map((li) => `${li.qty}× ${li.option.title}`)
        .join(", ")
        .slice(0, 140);

      const rzpResponse = await openRazorpayCheckout({
        amountRupees: totalPayableRupees,
        amountPaise: paymentOrderData?.amountPaise,
        orderId: paymentOrderData?.orderId,
        keyId: paymentOrderData?.keyId,
        title: `${service.seller?.businessName || "Service Booking"}`,
        description: `${service.name}: ${summaryDesc}`,
        prefill: {
          name: shippingForm.customerName,
          contact: shippingForm.customerPhone,
        },
      });

      const formattedSlotLabel = pickupDate
        ? `${pickupDate} • ${pickupTimeSlot}`
        : pickupTimeSlot;

      const res = await placeMarketplaceOrder({
        items: selectedLineItems.map((li) => ({
          sellerServiceId: service.id,
          serviceOptionId: li.option.id,
          quantity: li.qty,
        })),
        scheduledPickupAt: pickupDate ? new Date(pickupDate).toISOString() : null,
        pickupTimeSlot: formattedSlotLabel,
        ...shippingForm,
        razorpayPaymentId: rzpResponse?.razorpayPaymentId || rzpResponse?.razorpay_payment_id,
        razorpayOrderId: rzpResponse?.razorpayOrderId || rzpResponse?.razorpay_order_id,
        razorpaySignature: rzpResponse?.razorpaySignature || rzpResponse?.razorpay_signature,
      });

      setOrderResult(res);
    } catch (err) {
      setOrderError(err?.message || "Please log in to book this service.");
    } finally {
      setOrderSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060d1d] bg-[radial-gradient(ellipse_80%_60%_at_50%_-15%,rgba(6,182,212,0.16),transparent)] text-slate-100 flex flex-col">
      <HeaderAfterlogin />

      <main className="flex-1 pt-20 pb-16">
        <div className="mx-auto max-w-[1360px] px-4 sm:px-6">
          {/* Breadcrumbs */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mb-5">
            <Link
              href="/marketplace?mode=services"
              className="hover:text-cyan-400 font-semibold"
            >
              ← Back to Partner Services
            </Link>
            {service && (
              <>
                <span>/</span>
                <span className="text-cyan-300">{service.category}</span>
                <span>/</span>
                <span className="text-slate-200 font-semibold">{service.name}</span>
              </>
            )}
          </div>

          {loading ? (
            <div className="rounded-2xl border border-[#162542] bg-[#0a1326]/95 p-12 text-center text-sm text-slate-400">
              Loading sellers &amp; option rate cards...
            </div>
          ) : !service ? (
            <div className="rounded-2xl border border-[#162542] bg-[#0a1326]/95 p-12 text-center">
              <p className="text-lg font-bold text-white">Service Not Found</p>
              <Link
                href="/marketplace?mode=services"
                className="mt-4 inline-block rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white"
              >
                Explore Partner Services
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Top Service Header + Multi-Seller Selector */}
              <div className="rounded-3xl border border-[#1c325c] bg-gradient-to-r from-[#08152b] via-[#0b1e3d] to-[#071528] p-6 sm:p-7 shadow-2xl">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-cyan-500/40 bg-cyan-500/15 px-3 py-0.5 text-xs font-bold text-cyan-300">
                        🧺 {service.category}
                      </span>
                      <span className="rounded-full border border-emerald-500/40 bg-emerald-500/15 px-3 py-0.5 text-xs font-bold text-emerald-300">
                        ✓ {allSellerOfferings.length} Verified{" "}
                        {allSellerOfferings.length === 1 ? "Seller" : "Sellers"} Available
                      </span>
                      <span className="rounded-full border border-amber-500/40 bg-amber-500/15 px-3 py-0.5 text-xs font-bold text-amber-300">
                        ★ {service.avgRating} ({service.reviewCount} Reviews)
                      </span>
                    </div>

                    <h1 className="mt-2.5 text-2xl sm:text-3xl font-extrabold text-white">
                      {service.name}
                    </h1>
                    <p className="mt-1.5 text-xs sm:text-sm text-slate-300 max-w-3xl">
                      {service.description}
                    </p>
                  </div>

                  {/* Quick Seller Dropdown Switcher */}
                  <div className="w-full lg:w-[360px] shrink-0 rounded-2xl border border-cyan-500/30 bg-[#081225] p-3.5">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-cyan-300 mb-1.5">
                      Choose Verified Service Seller ({allSellerOfferings.length})
                    </label>
                    <select
                      value={service.id}
                      onChange={(e) => {
                        const chosen = allSellerOfferings.find(
                          (o) => o.id === e.target.value
                        );
                        if (chosen) handleSelectSellerOffering(chosen);
                      }}
                      className="w-full rounded-xl border border-[#233d6e] bg-[#0b1730] px-3 py-2.5 text-xs font-bold text-white"
                    >
                      {allSellerOfferings.map((off) => (
                        <option key={off.id} value={off.id}>
                          {off.seller?.businessName} — from ₹{off.priceRupees}/{off.unit} (
                          {off.turnaroundLabel})
                        </option>
                      ))}
                    </select>
                    {service.seller?.rateCardDocUrl && (
                      <button
                        type="button"
                        onClick={() => setShowRateCardPreview(true)}
                        className="mt-2 text-[11px] font-bold text-amber-300 hover:underline"
                      >
                        📄 View {service.seller.businessName.split("—")[0].trim()} Printed Rate Card
                      </button>
                    )}
                  </div>
                </div>

                {/* Visual Multi-Seller Comparison Cards */}
                {allSellerOfferings.length > 1 && (
                  <div className="mt-5 pt-5 border-t border-[#162645]">
                    <p className="text-xs font-bold text-slate-300 mb-2.5">
                      Compare Sellers &amp; Their Starting Rates for {service.name}:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {allSellerOfferings.map((off) => {
                        const isSelected = off.id === service.id;
                        return (
                          <button
                            key={off.id}
                            type="button"
                            onClick={() => handleSelectSellerOffering(off)}
                            className={`text-left rounded-2xl border p-3.5 transition ${
                              isSelected
                                ? "border-cyan-500 bg-cyan-500/15 ring-1 ring-cyan-500/40"
                                : "border-[#1c325c] bg-[#081225] hover:border-slate-400"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="text-xs font-extrabold text-white">
                                  {off.seller?.businessName}
                                </p>
                                <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                                  📍 {off.seller?.pickupAddress || off.seller?.pickupCity}
                                </p>
                              </div>
                              <span
                                className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold shrink-0 ${
                                  isSelected
                                    ? "bg-cyan-600 text-white"
                                    : "bg-slate-800 text-slate-300"
                                }`}
                              >
                                {isSelected ? "Selected" : "Switch"}
                              </span>
                            </div>
                            <div className="mt-2.5 flex items-center justify-between text-[11px]">
                              <span className="font-bold text-emerald-400">
                                Starting ₹{off.priceRupees}/{off.unit}
                              </span>
                              <span className="text-slate-300">
                                ⏱ {off.turnaroundLabel} • ★ {off.avgRating}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Main 2-Column Layout: Left = Option Rate Card Selector, Right = Sticky Booking Summary */}
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_390px] gap-6 items-start">
                {/* Left Column: Seller's Categorized Options */}
                <div className="rounded-3xl border border-[#17294d] bg-[#081225] p-5 sm:p-6 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#162645] pb-4">
                    <div>
                      <h2 className="text-base sm:text-lg font-extrabold text-white">
                        Select Options from {service.seller?.businessName}
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Choose one or more items &amp; quantities below. Rates are decided directly
                        by <strong>{service.seller?.businessName}</strong>.
                      </p>
                    </div>
                    <input
                      type="text"
                      value={optionSearch}
                      onChange={(e) => setOptionSearch(e.target.value)}
                      placeholder="Search Shirt, Suit, Saree, Blanket..."
                      className="w-full sm:w-64 rounded-xl border border-[#223966] bg-[#0b1730] px-3.5 py-2 text-xs text-white"
                    />
                  </div>

                  {/* Option Group Filter Tabs */}
                  {optionGroups.length > 2 && (
                    <div className="flex flex-wrap gap-2">
                      {optionGroups.map((grp) => (
                        <button
                          key={grp}
                          type="button"
                          onClick={() => setActiveOptionGroup(grp)}
                          className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                            activeOptionGroup === grp
                              ? "bg-cyan-600 text-white shadow"
                              : "border border-[#223966] bg-[#0b1730] text-slate-300 hover:text-white"
                          }`}
                        >
                          {grp === "ALL" ? `All Options (${(service.options || []).length})` : grp}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Options List */}
                  {visibleOptions.length === 0 ? (
                    <p className="text-xs text-slate-400 py-6 text-center">
                      No matching service options found.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {visibleOptions.map((opt) => {
                        const qty = selectedQtyByOption[opt.id] || 0;
                        return (
                          <div
                            key={opt.id}
                            className={`flex items-center justify-between gap-3 rounded-2xl border p-3.5 transition ${
                              qty > 0
                                ? "border-emerald-500/60 bg-emerald-500/10"
                                : "border-[#1c325c] bg-[#050c1a] hover:border-[#254175]"
                            }`}
                          >
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                                {opt.groupName}
                              </span>
                              <p className="text-sm font-bold text-white mt-0.5">
                                {opt.title}
                              </p>
                              <div className="mt-1 flex items-center gap-2">
                                <span className="text-sm font-extrabold text-emerald-400">
                                  ₹{opt.priceRupees}
                                </span>
                                <span className="text-[11px] text-slate-400">
                                  per {opt.unit || service.unit}
                                </span>
                                {opt.mrpRupees > opt.priceRupees && (
                                  <span className="text-[11px] text-slate-500 line-through">
                                    ₹{opt.mrpRupees}
                                  </span>
                                )}
                              </div>
                            </div>

                            {qty === 0 ? (
                              <button
                                type="button"
                                onClick={() => updateOptionQty(opt.id, 1)}
                                className="rounded-xl border border-cyan-500/50 bg-cyan-500/15 hover:bg-cyan-600 hover:text-white px-4 py-2 text-xs font-extrabold text-cyan-300 transition shrink-0"
                              >
                                + Add
                              </button>
                            ) : (
                              <div className="flex items-center gap-2 rounded-xl border border-emerald-500/50 bg-[#0b1730] px-2 py-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => updateOptionQty(opt.id, -1)}
                                  className="h-7 w-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm font-extrabold text-white"
                                >
                                  −
                                </button>
                                <span className="min-w-[20px] text-center text-xs font-extrabold text-emerald-400">
                                  {qty}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => updateOptionQty(opt.id, 1)}
                                  className="h-7 w-7 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-sm font-extrabold text-white"
                                >
                                  +
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Right Column: Sticky Booking Card + Pickup Slot Selector */}
                <div className="rounded-3xl border border-[#1d3562] bg-[#081226] p-5 sm:p-6 space-y-4 lg:sticky lg:top-24 shadow-2xl">
                  <div className="border-b border-[#162645] pb-3.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-300">
                      Booking Summary
                    </span>
                    <h3 className="text-base font-extrabold text-white mt-0.5">
                      {service.seller?.businessName}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      ⏱ Turnaround: <strong className="text-slate-200">{service.turnaroundLabel}</strong>{" "}
                      • {service.expressDeliveryEta}
                    </p>
                  </div>

                  {/* Pickup Date & Time Slot Dropdown */}
                  <div className="space-y-3 rounded-2xl border border-[#1c325c] bg-[#050c1a] p-3.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        📅 Preferred Pickup Date
                      </label>
                      <input
                        type="date"
                        value={pickupDate}
                        min={new Date().toISOString().split("T")[0]}
                        onChange={(e) => setPickupDate(e.target.value)}
                        className="w-full rounded-xl border border-[#223966] bg-[#0b1730] px-3 py-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        ⏰ Pickup Time Slot *
                      </label>
                      <select
                        value={pickupTimeSlot}
                        onChange={(e) => setPickupTimeSlot(e.target.value)}
                        className="w-full rounded-xl border border-[#223966] bg-[#0b1730] px-3 py-2 text-xs text-white"
                      >
                        {PICKUP_TIME_SLOTS.map((slot) => (
                          <option key={slot} value={slot}>
                            {slot}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Selected Options Breakdown */}
                  {selectedLineItems.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-700 p-4 text-center text-xs text-slate-400">
                      Add one or more options from the rate card to proceed.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {selectedLineItems.map(({ option, qty, lineTotalRupees }) => (
                        <div
                          key={option.id}
                          className="flex items-center justify-between text-xs rounded-xl bg-[#050c1a] border border-slate-800/80 px-3 py-2"
                        >
                          <div>
                            <p className="font-semibold text-white">
                              {qty} × {option.title}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              ₹{option.priceRupees}/{option.unit} • {option.groupName}
                            </p>
                          </div>
                          <span className="font-bold text-emerald-400">
                            ₹{lineTotalRupees}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="border-t border-[#16284a] pt-3.5 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-400">
                        Total ({totalSelectedCount}{" "}
                        {totalSelectedCount === 1 ? "item" : "items"})
                      </p>
                      <p className="text-2xl font-extrabold text-white">
                        ₹{totalPayableRupees}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={selectedLineItems.length === 0}
                      onClick={() => {
                        setOrderResult(null);
                        setOrderError("");
                        setShowBookModal(true);
                      }}
                      className="rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 px-5 py-3 text-xs sm:text-sm font-extrabold text-white shadow-lg transition disabled:opacity-40"
                    >
                      Book Service →
                    </button>
                  </div>
                </div>
              </div>

              {/* Related Partner Services */}
              {relatedServices.length > 0 && (
                <div className="pt-4">
                  <h3 className="text-base font-extrabold text-white mb-3">
                    Other Partner Services You Can Book
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {relatedServices.map((rel) => (
                      <Link
                        key={rel.id}
                        href={`/marketplace/services/${rel.serviceSlug}`}
                        className="rounded-2xl border border-[#182b50] bg-[#081225] hover:border-cyan-500/50 p-4 transition block"
                      >
                        <span className="text-[10px] font-bold text-cyan-400">
                          {rel.category}
                        </span>
                        <h4 className="text-sm font-bold text-white mt-1">{rel.name}</h4>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                          {rel.description}
                        </p>
                        <p className="mt-3 text-xs font-extrabold text-emerald-400">
                          From ₹{rel.priceRupees}/{rel.unit} →
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Printed Rate Card Preview Modal */}
      {showRateCardPreview && service?.seller?.rateCardDocUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="max-w-2xl w-full rounded-3xl border border-[#223966] bg-[#081226] p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white">
                {service.seller.businessName} — Rate Card Reference
              </h3>
              <button
                type="button"
                onClick={() => setShowRateCardPreview(false)}
                className="rounded-lg bg-slate-800 px-2.5 py-1 text-xs font-bold text-slate-300"
              >
                ✕ Close
              </button>
            </div>
            <div className="mt-3 max-h-[75vh] overflow-auto">
              <img
                src={service.seller.rateCardDocUrl}
                alt="Seller Rate Card"
                className="w-full rounded-xl object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {/* 1-Click Service Booking Checkout Modal */}
      {showBookModal && service && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-[#223966] bg-[#081226] p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3 border-b border-[#162749] pb-4">
              <div>
                <span className="rounded-full bg-cyan-500/20 px-2.5 py-0.5 text-[10px] font-bold text-cyan-300">
                  🧺 Verified Service Booking
                </span>
                <h3 className="mt-1 text-lg font-extrabold text-white">
                  {service.name} — {service.seller?.businessName}
                </h3>
                <p className="text-xs text-slate-400">
                  Pickup: {pickupDate} • {pickupTimeSlot}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowBookModal(false)}
                className="rounded-xl border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs font-bold text-slate-300"
              >
                ✕
              </button>
            </div>

            {orderResult ? (
              <div className="mt-5 space-y-4">
                <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4">
                  <p className="text-sm font-extrabold text-emerald-300">
                    🎉 Booking Confirmed! ({orderResult.order?.orderNumber})
                  </p>
                  <p className="mt-1 text-xs text-slate-300">{orderResult.message}</p>
                  {orderResult.order?.pickupOtp && (
                    <p className="mt-2 text-xs text-amber-300 font-bold">
                      Pickup OTP: {orderResult.order.pickupOtp} • Delivery OTP:{" "}
                      {orderResult.order.deliveryOtp}
                    </p>
                  )}
                </div>
                <div className="flex gap-3">
                  <Link
                    href="/marketplace?view=orders"
                    className="flex-1 rounded-xl bg-blue-600 py-2.5 text-center text-xs font-bold text-white"
                  >
                    Track My Booking
                  </Link>
                  <button
                    type="button"
                    onClick={() => setShowBookModal(false)}
                    className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-200"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleConfirmBooking} className="mt-4 space-y-4">
                {orderError && (
                  <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-xs font-semibold text-rose-300">
                    {orderError}
                  </div>
                )}

                <div className="rounded-2xl border border-[#1c325c] bg-[#050c1a] p-3.5 space-y-1.5 text-xs">
                  {selectedLineItems.map(({ option, qty, lineTotalRupees }) => (
                    <div key={option.id} className="flex justify-between text-slate-200">
                      <span>
                        {qty} × {option.title} (₹{option.priceRupees}/{option.unit})
                      </span>
                      <span className="font-bold text-white">₹{lineTotalRupees}</span>
                    </div>
                  ))}
                  <div className="flex justify-between pt-2 border-t border-slate-800 text-sm font-extrabold text-emerald-400">
                    <span>Total Amount Payable</span>
                    <span>₹{totalPayableRupees}</span>
                  </div>
                </div>

                {/* Pickup & Drop Address */}
                <div className="rounded-2xl border border-[#1c325c] bg-[#050c1a] p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">
                      📍 Doorstep Pickup &amp; Drop Details
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditingShipping((v) => !v)}
                      className="text-[11px] font-bold text-cyan-400 hover:underline"
                    >
                      {editingShipping ? "Done" : "Edit Address"}
                    </button>
                  </div>

                  {!editingShipping ? (
                    <p className="text-xs text-slate-300">
                      <strong>{shippingForm.customerName || "Customer"}</strong> (
                      {shippingForm.customerPhone || "9897000000"}) —{" "}
                      {shippingForm.shippingAddress}, {shippingForm.shippingCity} -{" "}
                      {shippingForm.shippingPincode}
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <input
                        type="text"
                        required
                        value={shippingForm.customerName}
                        onChange={(e) =>
                          setShippingForm({ ...shippingForm, customerName: e.target.value })
                        }
                        placeholder="Your Name"
                        className="rounded-xl border border-[#223966] bg-[#0b1730] px-3 py-2 text-xs text-white"
                      />
                      <input
                        type="text"
                        required
                        value={shippingForm.customerPhone}
                        onChange={(e) =>
                          setShippingForm({ ...shippingForm, customerPhone: e.target.value })
                        }
                        placeholder="Mobile Number"
                        className="rounded-xl border border-[#223966] bg-[#0b1730] px-3 py-2 text-xs text-white"
                      />
                      <input
                        type="text"
                        required
                        value={shippingForm.shippingAddress}
                        onChange={(e) =>
                          setShippingForm({
                            ...shippingForm,
                            shippingAddress: e.target.value,
                          })
                        }
                        placeholder="House / Street / Locality"
                        className="sm:col-span-2 rounded-xl border border-[#223966] bg-[#0b1730] px-3 py-2 text-xs text-white"
                      />
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={orderSubmitting}
                  className="w-full rounded-2xl bg-emerald-600 hover:bg-emerald-500 py-3 text-xs sm:text-sm font-extrabold text-white shadow-lg transition disabled:opacity-50"
                >
                  {orderSubmitting
                    ? "Confirming Service Booking..."
                    : `Pay & Confirm Booking (₹${totalPayableRupees})`}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
