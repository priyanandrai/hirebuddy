"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import HeaderAfterlogin from "../components/layout/HeaderAfterlogin";
import Footer from "../components/layout/Footer";
import {
  onboardSeller,
  getSellerDashboard,
  addSellerProduct,
  updateMarketplaceOrderStatus,
} from "../components/services/marketplace.service";

const MEERUT_MANUFACTURER_CATEGORIES = [
  "Sports Goods (Cricket Bats, Balls, Gym)",
  "Food & Sweets (FSSAI Gajak, Rewari, Namkeen)",
  "Cutlery & Scissors (GI Tagged Meerut Scissors)",
  "Handloom & Home Textiles",
  "Brassware & Artisanal Crafts",
  "Musical Instruments",
  "General Manufacturing",
];

export default function SellerOnboardingAndHubPage() {
  const [activeTab, setActiveTab] = useState("onboarding"); // "onboarding" | "products" | "orders"
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [bannerMsg, setBannerMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [sellerProfile, setSellerProfile] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [taxInvoiceOrder, setTaxInvoiceOrder] = useState(null);

  // Step 1: Seller Onboarding Form (KYC, FSSAI, Pickup Point, Contact Person, Bank Account for Daily NEFT)
  const [kycForm, setKycForm] = useState({
    businessName: "",
    businessCategory: "Sports Goods (Cricket Bats, Balls, Gym)",
    contactPersonName: "",
    contactPersonPhone: "",
    pickupAddress: "",
    pickupCity: "Meerut",
    pickupPincode: "250002",
    pickupLatitude: 28.9845,
    pickupLongitude: 77.7064,
    fssaiNumber: "",
    fssaiDocUrl: "",
    gstNumber: "",
    gstDocUrl: "",
    panNumber: "",
    msmeNumber: "",
    bankAccountName: "",
    bankAccountNumber: "",
    bankIfscCode: "",
    bankName: "",
    cancelledChequeUrl: "",
  });

  // Step 2: Separate Product Add Form (Admin Verifies & Publishes + Sets 10%-20% Commission)
  const [productForm, setProductForm] = useState({
    title: "",
    category: "Sports Goods",
    description: "",
    priceRupees: "",
    mrpRupees: "",
    stock: 25,
    unit: "piece",
    minOrderQty: 1,
    image: "/images/helper_task_furniture.png",
    deliveryByPlatform: false,
  });

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getSellerDashboard();
      if (res?.profile) {
        setSellerProfile(res.profile);
        setProducts(res.products || []);
        setOrders(res.orders || []);
        setSettlements(res.settlements || []);
        setMetrics(res.metrics || null);

        setKycForm((prev) => ({
          ...prev,
          businessName: res.profile.businessName || "",
          businessCategory:
            res.profile.businessCategory || prev.businessCategory,
          contactPersonName: res.profile.contactPersonName || "",
          contactPersonPhone: res.profile.contactPersonPhone || "",
          pickupAddress: res.profile.pickupAddress || "",
          pickupCity: res.profile.pickupCity || "Meerut",
          pickupPincode: res.profile.pickupPincode || "250002",
          fssaiNumber: res.profile.fssaiNumber || "",
          fssaiDocUrl: res.profile.fssaiDocUrl || "",
          gstNumber: res.profile.gstNumber || "",
          gstDocUrl: res.profile.gstDocUrl || "",
          panNumber: res.profile.panNumber || "",
          msmeNumber: res.profile.msmeNumber || "",
          bankAccountName: res.profile.bankAccountName || "",
          bankAccountNumber: res.profile.bankAccountNumber || "",
          bankIfscCode: res.profile.bankIfscCode || "",
          bankName: res.profile.bankName || "",
          cancelledChequeUrl: res.profile.cancelledChequeUrl || "",
        }));
      }
    } catch (e) {
      // User may not be logged in or not onboarded yet
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleUseGpsPickup = () => {
    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setKycForm((prev) => ({
            ...prev,
            pickupLatitude: Number(pos.coords.latitude.toFixed(5)),
            pickupLongitude: Number(pos.coords.longitude.toFixed(5)),
            pickupAddress:
              prev.pickupAddress ||
              "Industrial Estate, Partapur / Suraj Kund Road, Meerut, UP",
          }));
          setBannerMsg("📍 GPS Pickup Coordinates captured for Buddy Delivery tasks!");
        },
        () => {
          setKycForm((prev) => ({
            ...prev,
            pickupAddress:
              prev.pickupAddress || "Suraj Kund Sports Complex Road, Meerut, UP",
          }));
        }
      );
    }
  };

  const handleSubmitOnboarding = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setBannerMsg("");
    setErrorMsg("");

    try {
      const res = await onboardSeller(kycForm);
      setBannerMsg(
        res?.message ||
          "Seller onboarding submitted! Admin has been notified to verify your documents & bank account."
      );
      await loadDashboard();
    } catch (err) {
      setErrorMsg(
        err?.message ||
          "Could not submit seller onboarding. Please make sure you are logged in."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setBannerMsg("");
    setErrorMsg("");

    try {
      const res = await addSellerProduct(productForm);
      setBannerMsg(
        res?.message ||
          "Product submitted! It will go live on the Meerut Marketplace once verified & published by Admin."
      );
      setProductForm({
        title: "",
        category: "Sports Goods",
        description: "",
        priceRupees: "",
        mrpRupees: "",
        stock: 25,
        unit: "piece",
        minOrderQty: 1,
        image: "/images/helper_task_furniture.png",
        deliveryByPlatform: false,
      });
      await loadDashboard();
    } catch (err) {
      setErrorMsg(err?.message || "Failed to submit product for Admin approval.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId, nextStatus) => {
    try {
      await updateMarketplaceOrderStatus(orderId, nextStatus);
      setBannerMsg(`Order status updated to ${nextStatus}`);
      loadDashboard();
    } catch (err) {
      setErrorMsg(err?.message || "Failed to update order status");
    }
  };

  const isFoodCategory = kycForm.businessCategory
    .toLowerCase()
    .includes("food");

  return (
    <div className="min-h-screen bg-[#050b18] text-slate-100 flex flex-col">
      <HeaderAfterlogin />

      <main className="flex-1 pt-20 pb-16">
        <div className="mx-auto max-w-[1320px] px-4 sm:px-6">
          {/* Header Banner */}
          <div className="rounded-3xl border border-[#192d52] bg-gradient-to-r from-[#08152d] via-[#0b1f42] to-[#061527] p-6 sm:p-8 shadow-2xl">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-emerald-500/40 bg-emerald-500/15 px-3 py-0.5 text-xs font-bold text-emerald-300">
                    🏭 Meerut Manufacturers Hub
                  </span>
                  {sellerProfile && (
                    <span
                      className={`rounded-full px-3 py-0.5 text-xs font-bold ${
                        sellerProfile.verificationStatus === "VERIFIED"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                          : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                      }`}
                    >
                      KYC Status: {sellerProfile.verificationStatus} • Bank:{" "}
                      {sellerProfile.bankVerificationStatus}
                    </span>
                  )}
                </div>

                <h1 className="mt-2.5 text-2xl sm:text-3xl font-extrabold text-white">
                  {sellerProfile?.businessName ||
                    "Meerut Manufacturer Onboarding & Seller Portal"}
                </h1>
                <p className="mt-1.5 text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
                  Sell directly to customers across Meerut &amp; India. Products are verified &amp; published by Admin with a configurable <strong>10%–20% platform commission</strong>. Your seller share (80%–90%) is settled daily via <strong>NEFT / Direct Split</strong> to your verified bank account.
                </p>
              </div>

              <div className="flex flex-wrap gap-2.5 shrink-0">
                <Link
                  href="/marketplace"
                  className="rounded-xl border border-[#223966] bg-[#0b1730] hover:bg-[#122449] px-4 py-2.5 text-xs font-bold text-slate-200 transition"
                >
                  🛍️ View Live Storefront
                </Link>
              </div>
            </div>

            {/* Metrics Bar */}
            {metrics && (
              <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5 border-t border-[#172a4f]">
                <div className="rounded-2xl border border-[#1a3058] bg-[#071022] p-3.5">
                  <p className="text-[11px] text-slate-400">Published Products</p>
                  <p className="text-xl font-extrabold text-white mt-0.5">
                    {metrics.publishedProductsCount} / {metrics.totalProducts}
                  </p>
                </div>
                <div className="rounded-2xl border border-[#1a3058] bg-[#071022] p-3.5">
                  <p className="text-[11px] text-slate-400">Pending Admin Approval</p>
                  <p className="text-xl font-extrabold text-amber-400 mt-0.5">
                    {metrics.pendingProductsCount}
                  </p>
                </div>
                <div className="rounded-2xl border border-[#1a3058] bg-[#071022] p-3.5">
                  <p className="text-[11px] text-slate-400">Net Seller Earnings (After Comm.)</p>
                  <p className="text-xl font-extrabold text-emerald-400 mt-0.5">
                    ₹{metrics.totalSellerEarnedRupees}
                  </p>
                </div>
                <div className="rounded-2xl border border-[#1a3058] bg-[#071022] p-3.5">
                  <p className="text-[11px] text-slate-400">Queued for Daily NEFT</p>
                  <p className="text-xl font-extrabold text-blue-400 mt-0.5">
                    ₹{metrics.pendingNeftRupees}
                  </p>
                </div>
              </div>
            )}

            {/* Navigation Tabs */}
            <div className="mt-6 flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={() => setActiveTab("onboarding")}
                className={`rounded-xl px-4 py-2.5 text-xs font-bold transition ${
                  activeTab === "onboarding"
                    ? "bg-[#1361f5] text-white shadow-lg"
                    : "border border-[#1d3158] bg-[#0a1428] text-slate-300 hover:text-white"
                }`}
              >
                1. Seller KYC, Pickup Point &amp; Bank (NEFT)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("products")}
                className={`rounded-xl px-4 py-2.5 text-xs font-bold transition ${
                  activeTab === "products"
                    ? "bg-[#1361f5] text-white shadow-lg"
                    : "border border-[#1d3158] bg-[#0a1428] text-slate-300 hover:text-white"
                }`}
              >
                2. Add Products (Admin Verified &amp; Published) ({products.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("orders")}
                className={`rounded-xl px-4 py-2.5 text-xs font-bold transition ${
                  activeTab === "orders"
                    ? "bg-[#1361f5] text-white shadow-lg"
                    : "border border-[#1d3158] bg-[#0a1428] text-slate-300 hover:text-white"
                }`}
              >
                3. Orders, Split Payouts &amp; Daily NEFT ({orders.length})
              </button>
            </div>
          </div>

          {bannerMsg && (
            <div className="mt-5 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-xs sm:text-sm font-semibold text-emerald-300">
              {bannerMsg}
            </div>
          )}

          {errorMsg && (
            <div className="mt-5 rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 text-xs sm:text-sm font-semibold text-rose-300">
              {errorMsg}
            </div>
          )}

          {/* ==============================================================
              TAB 1: SELLER ONBOARDING (DOCUMENTS, PICKUP, CONTACT, BANK NEFT)
             ============================================================== */}
          {activeTab === "onboarding" && (
            <form
              onSubmit={handleSubmitOnboarding}
              className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              {/* Left Column: Business, Contact Person & Pickup Point */}
              <div className="rounded-2xl border border-[#17294d] bg-[#081225] p-6 space-y-4">
                <h2 className="text-base font-bold text-white border-b border-[#152544] pb-3">
                  🏭 Business, Contact Person &amp; Pickup Point
                </h2>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Manufacturer / Business Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={kycForm.businessName}
                    onChange={(e) =>
                      setKycForm({ ...kycForm, businessName: e.target.value })
                    }
                    placeholder="e.g. Meerut Sports & Gajak Manufacturers Pvt. Ltd."
                    className="w-full rounded-xl border border-[#223966] bg-[#0b1730] px-3.5 py-2.5 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Manufacturing Category *
                  </label>
                  <select
                    value={kycForm.businessCategory}
                    onChange={(e) =>
                      setKycForm({ ...kycForm, businessCategory: e.target.value })
                    }
                    className="w-full rounded-xl border border-[#223966] bg-[#0b1730] px-3.5 py-2.5 text-sm text-white"
                  >
                    {MEERUT_MANUFACTURER_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Contact Person Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={kycForm.contactPersonName}
                      onChange={(e) =>
                        setKycForm({
                          ...kycForm,
                          contactPersonName: e.target.value,
                        })
                      }
                      placeholder="Dispatch Manager / Owner"
                      className="w-full rounded-xl border border-[#223966] bg-[#0b1730] px-3.5 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Contact Person Mobile *
                    </label>
                    <input
                      type="text"
                      required
                      value={kycForm.contactPersonPhone}
                      onChange={(e) =>
                        setKycForm({
                          ...kycForm,
                          contactPersonPhone: e.target.value,
                        })
                      }
                      placeholder="10-digit mobile for Buddy pickup"
                      className="w-full rounded-xl border border-[#223966] bg-[#0b1730] px-3.5 py-2 text-xs text-white"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-300">
                      Factory / Warehouse Pickup Address (Meerut) *
                    </label>
                    <button
                      type="button"
                      onClick={handleUseGpsPickup}
                      className="text-[11px] font-bold text-blue-400 hover:underline"
                    >
                      📍 Detect GPS Pickup Point
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    required
                    value={kycForm.pickupAddress}
                    onChange={(e) =>
                      setKycForm({ ...kycForm, pickupAddress: e.target.value })
                    }
                    placeholder="Full Pickup Address for 2% HireBuddy Delivery Partner pickup"
                    className="w-full rounded-xl border border-[#223966] bg-[#0b1730] px-3.5 py-2 text-xs text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Pickup City
                    </label>
                    <input
                      type="text"
                      value={kycForm.pickupCity}
                      onChange={(e) =>
                        setKycForm({ ...kycForm, pickupCity: e.target.value })
                      }
                      className="w-full rounded-xl border border-[#223966] bg-[#0b1730] px-3.5 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Pincode
                    </label>
                    <input
                      type="text"
                      value={kycForm.pickupPincode}
                      onChange={(e) =>
                        setKycForm({ ...kycForm, pickupPincode: e.target.value })
                      }
                      className="w-full rounded-xl border border-[#223966] bg-[#0b1730] px-3.5 py-2 text-xs text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: Compliance Documents (FSSAI, GST, PAN) & Bank Account for Daily NEFT */}
              <div className="space-y-6">
                <div className="rounded-2xl border border-[#17294d] bg-[#081225] p-6 space-y-4">
                  <h2 className="text-base font-bold text-white border-b border-[#152544] pb-3">
                    📜 Document Verification (FSSAI, GSTIN, PAN, MSME)
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-amber-300 mb-1">
                        FSSAI License No. {isFoodCategory ? "* (Required for Food)" : "(For Food/Sweets)"}
                      </label>
                      <input
                        type="text"
                        required={isFoodCategory}
                        value={kycForm.fssaiNumber}
                        onChange={(e) =>
                          setKycForm({ ...kycForm, fssaiNumber: e.target.value })
                        }
                        placeholder="14-digit FSSAI Number"
                        className="w-full rounded-xl border border-[#223966] bg-[#0b1730] px-3.5 py-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        FSSAI Certificate Document URL
                      </label>
                      <input
                        type="text"
                        value={kycForm.fssaiDocUrl}
                        onChange={(e) =>
                          setKycForm({ ...kycForm, fssaiDocUrl: e.target.value })
                        }
                        placeholder="https://... or document reference"
                        className="w-full rounded-xl border border-[#223966] bg-[#0b1730] px-3.5 py-2 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        GSTIN Number
                      </label>
                      <input
                        type="text"
                        value={kycForm.gstNumber}
                        onChange={(e) =>
                          setKycForm({ ...kycForm, gstNumber: e.target.value })
                        }
                        placeholder="09AAAAA0000A1Z5"
                        className="w-full rounded-xl border border-[#223966] bg-[#0b1730] px-3.5 py-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        PAN Number *
                      </label>
                      <input
                        type="text"
                        required
                        value={kycForm.panNumber}
                        onChange={(e) =>
                          setKycForm({ ...kycForm, panNumber: e.target.value })
                        }
                        placeholder="ABCDE1234F"
                        className="w-full rounded-xl border border-[#223966] bg-[#0b1730] px-3.5 py-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        MSME / Udyam Reg.
                      </label>
                      <input
                        type="text"
                        value={kycForm.msmeNumber}
                        onChange={(e) =>
                          setKycForm({ ...kycForm, msmeNumber: e.target.value })
                        }
                        placeholder="UDYAM-UP-55-..."
                        className="w-full rounded-xl border border-[#223966] bg-[#0b1730] px-3.5 py-2 text-xs text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Bank Account Addition & Verification for Daily NEFT */}
                <div className="rounded-2xl border border-[#17294d] bg-[#081225] p-6 space-y-4">
                  <h2 className="text-base font-bold text-white border-b border-[#152544] pb-3">
                    🏦 Bank Account for Daily NEFT / Portion-Wise Split
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Account Holder / Firm Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={kycForm.bankAccountName}
                        onChange={(e) =>
                          setKycForm({
                            ...kycForm,
                            bankAccountName: e.target.value,
                          })
                        }
                        placeholder="Account Beneficiary Name"
                        className="w-full rounded-xl border border-[#223966] bg-[#0b1730] px-3.5 py-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Bank Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={kycForm.bankName}
                        onChange={(e) =>
                          setKycForm({ ...kycForm, bankName: e.target.value })
                        }
                        placeholder="e.g. SBI / HDFC Meerut Branch"
                        className="w-full rounded-xl border border-[#223966] bg-[#0b1730] px-3.5 py-2 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Bank Account Number *
                      </label>
                      <input
                        type="text"
                        required
                        value={kycForm.bankAccountNumber}
                        onChange={(e) =>
                          setKycForm({
                            ...kycForm,
                            bankAccountNumber: e.target.value,
                          })
                        }
                        placeholder="Account Number for Daily NEFT"
                        className="w-full rounded-xl border border-[#223966] bg-[#0b1730] px-3.5 py-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        IFSC Code *
                      </label>
                      <input
                        type="text"
                        required
                        value={kycForm.bankIfscCode}
                        onChange={(e) =>
                          setKycForm({
                            ...kycForm,
                            bankIfscCode: e.target.value.toUpperCase(),
                          })
                        }
                        placeholder="SBIN0001234"
                        className="w-full rounded-xl border border-[#223966] bg-[#0b1730] px-3.5 py-2 text-xs text-white"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 py-3 text-xs sm:text-sm font-bold text-white shadow-lg shadow-emerald-950/50 transition disabled:opacity-50"
                  >
                    {submitting
                      ? "Saving & Notifying Admin..."
                      : "Save Seller Onboarding & Submit for Admin Verification"}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* ==============================================================
              TAB 2: SEPARATE PRODUCT ADDITION FLOW (ADMIN VERIFIES & PUBLISHES)
             ============================================================== */}
          {activeTab === "products" && (
            <div className="mt-6 grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-6">
              {/* Left: Add Product Form */}
              <form
                onSubmit={handleAddProduct}
                className="rounded-2xl border border-[#17294d] bg-[#081225] p-6 space-y-4 self-start"
              >
                <div>
                  <h2 className="text-base font-bold text-white">
                    ➕ Add New Product for Admin Verification
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Every product is reviewed by Admin, assigned a 10%–20% platform commission, and published to the Meerut Marketplace.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Product Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={productForm.title}
                    onChange={(e) =>
                      setProductForm({ ...productForm, title: e.target.value })
                    }
                    placeholder="e.g. Grade-1 English Willow Cricket Bat"
                    className="w-full rounded-xl border border-[#223966] bg-[#0b1730] px-3.5 py-2 text-xs text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Category *
                    </label>
                    <select
                      value={productForm.category}
                      onChange={(e) =>
                        setProductForm({ ...productForm, category: e.target.value })
                      }
                      className="w-full rounded-xl border border-[#223966] bg-[#0b1730] px-3 py-2 text-xs text-white"
                    >
                      <option value="Sports Goods">Sports Goods</option>
                      <option value="Food & Sweets">Food &amp; Sweets (FSSAI)</option>
                      <option value="Cutlery & Scissors">Cutlery &amp; Scissors</option>
                      <option value="Handloom & Textiles">Handloom &amp; Textiles</option>
                      <option value="Home & Handicrafts">Home &amp; Handicrafts</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Unit (e.g. piece, 500g box)
                    </label>
                    <input
                      type="text"
                      value={productForm.unit}
                      onChange={(e) =>
                        setProductForm({ ...productForm, unit: e.target.value })
                      }
                      className="w-full rounded-xl border border-[#223966] bg-[#0b1730] px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Selling Price (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={productForm.priceRupees}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          priceRupees: e.target.value,
                        })
                      }
                      placeholder="1200"
                      className="w-full rounded-xl border border-[#223966] bg-[#0b1730] px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      MRP (₹)
                    </label>
                    <input
                      type="number"
                      value={productForm.mrpRupees}
                      onChange={(e) =>
                        setProductForm({ ...productForm, mrpRupees: e.target.value })
                      }
                      placeholder="1500"
                      className="w-full rounded-xl border border-[#223966] bg-[#0b1730] px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Stock Qty
                    </label>
                    <input
                      type="number"
                      value={productForm.stock}
                      onChange={(e) =>
                        setProductForm({ ...productForm, stock: e.target.value })
                      }
                      className="w-full rounded-xl border border-[#223966] bg-[#0b1730] px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Product Description *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={productForm.description}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        description: e.target.value,
                      })
                    }
                    placeholder="Specifications, materials, Meerut factory origin..."
                    className="w-full rounded-xl border border-[#223966] bg-[#0b1730] px-3.5 py-2 text-xs text-white"
                  />
                </div>

                {/* Delivery Option Toggle */}
                <label className="flex items-start gap-2.5 rounded-xl border border-[#203864] bg-[#0b1730] p-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={productForm.deliveryByPlatform}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        deliveryByPlatform: e.target.checked,
                      })
                    }
                    className="mt-1 h-4 w-4 rounded border-slate-600 text-blue-600"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-white block">
                      Opt for HireBuddy Platform Delivery (+2% Extra Charge)
                    </span>
                    <span className="text-slate-400">
                      By default, delivery is handled by Seller. If checked, +2% is added and an automatic delivery task is created on behalf of Admin for nearby Buddies.
                    </span>
                  </div>
                </label>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-xl bg-[#1361f5] hover:bg-blue-600 py-3 text-xs font-bold text-white shadow-lg transition disabled:opacity-50"
                >
                  {submitting
                    ? "Submitting to Admin..."
                    : "Submit Product for Admin Verification & Publishing"}
                </button>
              </form>

              {/* Right: Seller's Product List */}
              <div className="rounded-2xl border border-[#17294d] bg-[#081225] p-6">
                <h2 className="text-base font-bold text-white mb-4">
                  My Submitted &amp; Published Products ({products.length})
                </h2>

                {products.length === 0 ? (
                  <p className="text-xs text-slate-400">
                    No products added yet. Use the form on the left to submit your first Meerut factory product.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {products.map((p) => (
                      <div
                        key={p.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-[#1c325c] bg-[#050c1a] p-4"
                      >
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-bold text-white">
                              {p.title}
                            </span>
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                p.approvalStatus === "PUBLISHED"
                                  ? "bg-emerald-500/20 text-emerald-300"
                                  : "bg-amber-500/20 text-amber-300"
                              }`}
                            >
                              {p.approvalStatus}
                            </span>
                            <span className="rounded-full bg-blue-500/15 px-2.5 py-0.5 text-[10px] font-semibold text-blue-300">
                              Platform Commission: {p.commissionPct}% (You get{" "}
                              {100 - p.commissionPct}%)
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-slate-400">
                            Category: {p.category} • Stock: {p.stock} {p.unit} •{" "}
                            {p.deliveryByPlatform
                              ? "🚚 +2% HireBuddy Delivery Enabled"
                              : "🏭 Seller Self-Delivery"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-base font-extrabold text-emerald-400">
                            ₹{p.priceRupees || Math.round((p.price || 0) / 100)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==============================================================
              TAB 3: ORDERS, PORTION-WISE SPLIT & DAILY NEFT SETTLEMENTS
             ============================================================== */}
          {activeTab === "orders" && (
            <div className="mt-6 space-y-6">
              <div className="rounded-2xl border border-[#17294d] bg-[#081225] p-6">
                <h2 className="text-base font-bold text-white mb-4">
                  Customer Orders &amp; Portion-Wise Payment Split ({orders.length})
                </h2>

                {orders.length === 0 ? (
                  <p className="text-xs text-slate-400">
                    No customer orders received yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {orders.map((ord) => (
                      <div
                        key={ord.id}
                        className="rounded-2xl border border-[#1c325c] bg-[#050c1a] p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                      >
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-bold text-white">
                              {ord.orderNumber}
                            </span>
                            <span className="rounded-full bg-blue-500/20 px-2.5 py-0.5 text-[10px] font-bold text-blue-300">
                              {ord.orderStatus}
                            </span>
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                ord.settlementStatus === "SETTLED_NEFT"
                                  ? "bg-emerald-500/20 text-emerald-300"
                                  : "bg-amber-500/20 text-amber-300"
                              }`}
                            >
                              {ord.settlementStatus}
                              {ord.neftUtrNumber ? ` (UTR: ${ord.neftUtrNumber})` : ""}
                            </span>
                            {ord.pickupOtp && (
                              <span className="rounded-full border border-amber-500/40 bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-bold text-amber-300">
                                📦 Store Pickup OTP: {ord.pickupOtp}
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-xs text-slate-300">
                            Customer: <strong>{ord.customerName}</strong> ({ord.customerPhone}) • Address: {ord.shippingAddress}
                          </p>
                          <div className="mt-1.5 flex flex-wrap gap-4 text-xs">
                            <span className="text-slate-400">
                              Product Total: <strong>₹{ord.productSubtotalRupees}</strong>
                            </span>
                            <span className="text-emerald-400 font-bold">
                              Gross Seller Share: ₹{ord.sellerPayableRupees}
                            </span>
                            <span className="text-blue-300">
                              Platform Commission: ₹{ord.platformCommissionRupees}
                            </span>
                            <span className="text-purple-300">
                              18% GST on Comm. (SAC 998599): ₹
                              {ord.taxBreakdown?.gstOnCommission18PctRupees ??
                                Number(((ord.platformCommissionRupees || 0) * 0.18).toFixed(2))}
                            </span>
                            <span className="text-cyan-300">
                              TCS (0.5%) + TDS u/s 194-O (0.1%): ₹
                              {(
                                (ord.taxBreakdown?.gstTcs0_5PctRupees ?? Number(((ord.productSubtotalRupees || 0) * 0.005).toFixed(2))) +
                                (ord.taxBreakdown?.tds194O_0_1PctRupees ?? Number(((ord.productSubtotalRupees || 0) * 0.001).toFixed(2)))
                              ).toFixed(2)}
                            </span>
                            {ord.deliveryFeeRupees > 0 && (
                              <span className="text-amber-300">
                                +2% Buddy Delivery Task: ₹{ord.deliveryFeeRupees}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setTaxInvoiceOrder(ord)}
                            className="rounded-xl border border-indigo-500/40 bg-indigo-500/15 px-3 py-2 text-xs font-bold text-indigo-300 hover:bg-indigo-500/25"
                          >
                            🧾 Tax &amp; Settlement Invoice
                          </button>
                          <select
                            value={ord.orderStatus}
                            onChange={(e) =>
                              handleUpdateOrderStatus(ord.id, e.target.value)
                            }
                            className="rounded-xl border border-[#223966] bg-[#0b1730] px-3 py-2 text-xs text-white"
                          >
                            <option value="CONFIRMED">CONFIRMED</option>
                            <option value="PACKED">PACKED</option>
                            <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY</option>
                            <option value="DELIVERED">DELIVERED</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Daily NEFT Settlement Batches */}
              <div className="rounded-2xl border border-[#17294d] bg-[#081225] p-6">
                <h2 className="text-base font-bold text-white mb-3">
                  Daily NEFT Bank Settlement History ({settlements.length})
                </h2>
                {settlements.length === 0 ? (
                  <p className="text-xs text-slate-400">
                    Daily NEFT batches are processed every evening by Admin directly into your verified bank account.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {settlements.map((b) => (
                      <div
                        key={b.id}
                        className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/70 p-3.5 text-xs"
                      >
                        <div>
                          <p className="font-bold text-white">
                            NEFT UTR: {b.utrNumber} • {b.ordersCount} Orders
                          </p>
                          <p className="text-slate-400">
                            {new Date(b.createdAt).toLocaleString()} • Mode: {b.payoutMethod}
                          </p>
                        </div>
                        <span className="text-sm font-extrabold text-emerald-400">
                          ₹{b.totalAmountRupees} ({b.status})
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* TAX & SETTLEMENT BREAKDOWN INVOICE MODAL (GST SAC 998599, TCS u/s 52, TDS u/s 194-O) */}
      {taxInvoiceOrder && (() => {
        const gross = Number(taxInvoiceOrder.productSubtotalRupees || 0);
        const comm = Number(taxInvoiceOrder.platformCommissionRupees || 0);
        const gstOnComm = Number(
          taxInvoiceOrder.taxBreakdown?.gstOnCommission18PctRupees ?? (comm * 0.18).toFixed(2)
        );
        const tcs = Number(
          taxInvoiceOrder.taxBreakdown?.gstTcs0_5PctRupees ?? (gross * 0.005).toFixed(2)
        );
        const tds = Number(
          taxInvoiceOrder.taxBreakdown?.tds194O_0_1PctRupees ?? (gross * 0.001).toFixed(2)
        );
        const sellerGross = Number(taxInvoiceOrder.sellerPayableRupees || 0);
        const netBankPayout = Number(
          taxInvoiceOrder.taxBreakdown?.netSellerBankPayoutRupees ??
            Math.max(0, sellerGross - gstOnComm - tcs - tds).toFixed(2)
        );

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-3xl border border-[#223966] bg-[#081226] p-6 shadow-2xl">
              <div className="flex items-start justify-between gap-3 border-b border-[#162749] pb-4">
                <div>
                  <span className="rounded-full bg-indigo-500/20 px-2.5 py-0.5 text-[10px] font-bold text-indigo-300 border border-indigo-500/30">
                    SAC 998599 • E-Commerce Tax &amp; Settlement Statement
                  </span>
                  <h3 className="mt-1.5 text-lg font-extrabold text-white">
                    Order {taxInvoiceOrder.orderNumber} — Tax Breakdown
                  </h3>
                  <p className="text-xs text-slate-400">
                    Seller: {sellerProfile?.businessName || "Meerut Verified Manufacturer"} • GSTIN:{" "}
                    {sellerProfile?.gstNumber || "09AABCM1234F1Z5"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setTaxInvoiceOrder(null)}
                  className="rounded-xl border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs font-bold text-slate-300 hover:bg-slate-700"
                >
                  ✕
                </button>
              </div>

              <div className="mt-4 space-y-2.5 rounded-2xl border border-[#1c325c] bg-[#050c1a] p-4 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>1. Gross Product Value (Taxable Base)</span>
                  <span className="font-bold text-white">₹{gross.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-blue-300">
                  <span>2. Platform Marketplace Commission</span>
                  <span>- ₹{comm.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-purple-300">
                  <span>3. 18% GST on Platform Commission (SAC 998599)</span>
                  <span>- ₹{gstOnComm.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-cyan-300">
                  <span>4. GST TCS u/s 52 of CGST Act (0.5%)</span>
                  <span>- ₹{tcs.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-amber-300">
                  <span>5. Income Tax TDS u/s 194-O (0.1%)</span>
                  <span>- ₹{tds.toFixed(2)}</span>
                </div>
                {taxInvoiceOrder.deliveryFeeRupees > 0 && (
                  <div className="flex justify-between text-slate-400 pt-1 border-t border-slate-800">
                    <span>HireBuddy Partner Delivery (+2% Customer Paid)</span>
                    <span>₹{Number(taxInvoiceOrder.deliveryFeeRupees).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2.5 border-t border-slate-700 text-sm font-extrabold text-emerald-400">
                  <span>Net Seller Bank Settlement (NEFT)</span>
                  <span>₹{netBankPayout.toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                <span>
                  Store Pickup PIN: <strong className="text-amber-300">{taxInvoiceOrder.pickupOtp}</strong> • Delivery PIN:{" "}
                  <strong className="text-indigo-300">{taxInvoiceOrder.deliveryOtp}</strong>
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700"
                  >
                    🖨️ Print Statement
                  </button>
                  <button
                    type="button"
                    onClick={() => setTaxInvoiceOrder(null)}
                    className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      <Footer />
    </div>
  );
}
