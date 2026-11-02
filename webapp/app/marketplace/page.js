"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import HeaderAfterlogin from "../components/layout/HeaderAfterlogin";
import Footer from "../components/layout/Footer";
import {
  getMarketplaceProducts,
  placeMarketplaceOrder,
  getCustomerMarketplaceOrders,
} from "../components/services/marketplace.service";
import { getUserProfile } from "../components/services/user.service";
import { TaskCardShimmer } from "../components/ui/Shimmer";

export default function MeerutMarketplacePage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState("store"); // "store" | "orders"
  const [myOrders, setMyOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Order Checkout Modal State
  const [checkoutProduct, setCheckoutProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [deliveryMode, setDeliveryMode] = useState("SELLER_SELF"); // "SELLER_SELF" | "PLATFORM_HELPER"
  const [shippingForm, setShippingForm] = useState({
    customerName: "",
    customerPhone: "",
    shippingAddress: "Modipuram, Meerut, UP",
    shippingCity: "Meerut",
    shippingPincode: "250110",
    paymentMethod: "ONLINE_UPI",
  });
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [orderResult, setOrderResult] = useState(null);
  const [orderError, setOrderError] = useState("");

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("user") || "{}");
      if (stored?.name || stored?.phone || stored?.address) {
        setShippingForm((prev) => ({
          ...prev,
          customerName: stored.name || prev.customerName,
          customerPhone: stored.phone || prev.customerPhone,
          shippingAddress: stored.address || prev.shippingAddress,
          shippingCity: stored.city || prev.shippingCity,
          shippingPincode: stored.pincode || prev.shippingPincode,
        }));
      }
    } catch (e) {}

    getUserProfile()
      .then((res) => {
        if (res?.user) {
          setShippingForm((prev) => ({
            ...prev,
            customerName: res.user.name || prev.customerName,
            customerPhone: res.user.phone || prev.customerPhone,
            shippingAddress: res.user.address || prev.shippingAddress,
            shippingCity: res.user.city || prev.shippingCity,
            shippingPincode: res.user.pincode || prev.shippingPincode,
          }));
        }
      })
      .catch(() => {});
  }, []);

  const fetchCatalog = useCallback(async (searchVal, catVal) => {
    setLoading(true);
    try {
      const res = await getMarketplaceProducts({
        search: searchVal || undefined,
        category: catVal || undefined,
      });
      setProducts(res?.products || []);
      if (Array.isArray(res?.categories) && res.categories.length > 0) {
        setCategories(res.categories);
      }
    } catch (err) {
      console.error("Failed to load Meerut marketplace products:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMyOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const res = await getCustomerMarketplaceOrders();
      setMyOrders(res?.orders || []);
    } catch (e) {
      // Guest or not logged in
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCatalog(searchQuery, selectedCategory);
    }, 220);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory, fetchCatalog]);

  useEffect(() => {
    if (activeView === "orders") {
      fetchMyOrders();
    }
  }, [activeView, fetchMyOrders]);

  const handleOpenCheckout = (product) => {
    setCheckoutProduct(product);
    setQuantity(product.minOrderQty || 1);
    setDeliveryMode(product.deliveryByPlatform ? "PLATFORM_HELPER" : "SELLER_SELF");
    setOrderResult(null);
    setOrderError("");
  };

  // Price & Portion-wise split calculation preview
  const unitPriceRupees = checkoutProduct
    ? checkoutProduct.priceRupees || Math.round((checkoutProduct.price || 0) / 100)
    : 0;
  const subtotalRupees = unitPriceRupees * quantity;
  const commissionPct = checkoutProduct?.commissionPct ?? 15;
  const platformCommissionRupees = Math.round((subtotalRupees * commissionPct) / 100);
  const sellerPayableRupees = subtotalRupees - platformCommissionRupees;
  const extraDeliveryFeeRupees =
    deliveryMode === "PLATFORM_HELPER"
      ? Math.max(1, Math.round(subtotalRupees * 0.02))
      : 0;
  const grandTotalRupees = subtotalRupees + extraDeliveryFeeRupees;

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!checkoutProduct) return;
    setOrderSubmitting(true);
    setOrderError("");

    try {
      const res = await placeMarketplaceOrder({
        items: [{ productId: checkoutProduct.id, quantity }],
        deliveryMode,
        ...shippingForm,
      });
      setOrderResult(res);
      fetchCatalog(searchQuery, selectedCategory);
    } catch (err) {
      setOrderError(
        err?.message || "Please log in to place your marketplace order."
      );
    } finally {
      setOrderSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050b18] text-slate-100 flex flex-col">
      <HeaderAfterlogin />

      <main className="flex-1 pt-20 pb-16">
        {/* Top Hero Banner */}
        <section className="mx-auto max-w-[1360px] px-4 sm:px-6">
          <div className="relative overflow-hidden rounded-3xl border border-[#192d52] bg-gradient-to-r from-[#08152d] via-[#0c2044] to-[#07182b] p-6 sm:p-8 shadow-2xl">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-3.5 py-1 text-xs font-bold text-emerald-300">
                  <span>🏭 Direct from Verified Meerut Manufacturers</span>
                  <span>•</span>
                  <span>Admin Verified &amp; Published</span>
                </div>
                <h1 className="mt-3 text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
                  Meerut Manufacturers Marketplace
                </h1>
                <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Buy authentic Meerut Sports Goods, GI-Tagged Scissors, FSSAI-certified Gajak &amp; Rewari, Handloom Textiles, and Brassware directly from factory manufacturers. Instant notifications go to the Seller &amp; Admin, with optional <strong>+2% HireBuddy Partner Delivery</strong>.
                </p>

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveView("store")}
                    className={`rounded-xl px-4 py-2.5 text-xs font-bold transition ${
                      activeView === "store"
                        ? "bg-[#1361f5] text-white shadow-lg shadow-blue-600/30"
                        : "border border-[#1d3158] bg-[#0a1428] text-slate-300 hover:text-white"
                    }`}
                  >
                    🛍️ Browse Products ({products.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveView("orders")}
                    className={`rounded-xl px-4 py-2.5 text-xs font-bold transition ${
                      activeView === "orders"
                        ? "bg-[#1361f5] text-white shadow-lg shadow-blue-600/30"
                        : "border border-[#1d3158] bg-[#0a1428] text-slate-300 hover:text-white"
                    }`}
                  >
                    📦 My Marketplace Orders
                  </button>
                  <Link
                    href="/become-a-seller"
                    className="rounded-xl border border-emerald-500/40 bg-emerald-500/15 hover:bg-emerald-500/25 px-4 py-2.5 text-xs font-bold text-emerald-300 transition"
                  >
                    🏭 Manufacturer? Sell on HireBuddy →
                  </Link>
                </div>
              </div>

              {/* Search Box in Hero */}
              <div className="w-full lg:w-[390px] rounded-2xl border border-[#1d325a] bg-[#071022]/90 p-4 shadow-xl">
                <label className="block text-xs font-bold text-slate-300 mb-2">
                  Search Meerut Factory Products
                </label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search bat, gajak, scissors, handloom..."
                    className="w-full rounded-xl border border-[#223966] bg-[#0b1730] py-2.5 pl-3.5 pr-9 text-xs sm:text-sm text-white placeholder:text-slate-400 focus:border-blue-500 focus:outline-none"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 text-xs text-slate-400 hover:text-white"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSelectedCategory("")}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                      !selectedCategory
                        ? "bg-blue-600 text-white"
                        : "bg-[#0d1b36] text-slate-300 hover:text-white"
                    }`}
                  >
                    All Categories
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() =>
                        setSelectedCategory(selectedCategory === cat ? "" : cat)
                      }
                      className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                        selectedCategory === cat
                          ? "bg-blue-600 text-white"
                          : "bg-[#0d1b36] text-slate-300 hover:text-white"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* STOREFRONT PRODUCT GRID */}
        {activeView === "store" ? (
          <section className="mx-auto max-w-[1360px] px-4 sm:px-6 mt-7">
            {loading ? (
              <TaskCardShimmer count={6} />
            ) : products.length === 0 ? (
              <div className="rounded-2xl border border-[#162749] bg-[#081225] p-12 text-center">
                <p className="text-base font-bold text-white">
                  No verified products match your search
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Try clearing your search query or category filter.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("");
                  }}
                  className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white"
                >
                  Show All Verified Products
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {products.map((product) => {
                  const priceRs =
                    product.priceRupees || Math.round((product.price || 0) / 100);
                  const mrpRs =
                    product.mrpRupees ||
                    (product.mrp ? Math.round(product.mrp / 100) : null);

                  return (
                    <div
                      key={product.id}
                      className="flex flex-col justify-between rounded-2xl border border-[#17294d] bg-[#081225] p-4 shadow-xl hover:border-blue-500/50 transition"
                    >
                      <div>
                        <div className="relative h-44 w-full overflow-hidden rounded-xl bg-[#0d1b36]">
                          <img
                            src={product.image || "/images/helper_task_cleaning.png"}
                            alt={product.title}
                            className="h-full w-full object-cover"
                          />
                          <span className="absolute left-2.5 top-2.5 rounded-full bg-emerald-600/95 px-2.5 py-0.5 text-[10px] font-bold text-white shadow">
                            ✓ Admin Verified
                          </span>
                          <span className="absolute right-2.5 top-2.5 rounded-full border border-white/15 bg-[#050d1e]/90 px-2.5 py-0.5 text-[10px] font-semibold text-blue-300">
                            {product.category}
                          </span>
                        </div>

                        <div className="mt-3 flex items-start justify-between gap-2">
                          <h3 className="text-base font-bold text-white leading-snug">
                            {product.title}
                          </h3>
                        </div>

                        <p className="mt-1 text-xs text-emerald-400 font-medium">
                          🏭 {product.seller?.businessName || "Meerut Verified Manufacturer"}{" "}
                          • 📍 {product.seller?.pickupCity || "Meerut"}
                        </p>

                        {product.seller?.fssaiNumber && (
                          <p className="mt-0.5 text-[11px] text-amber-300">
                            🛡️ FSSAI Lic: {product.seller.fssaiNumber}
                          </p>
                        )}

                        <p className="mt-2 text-xs text-slate-300 line-clamp-2 leading-relaxed">
                          {product.description}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-[#142342]">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-baseline gap-2">
                              <span className="text-xl font-extrabold text-white">
                                ₹{priceRs}
                              </span>
                              {mrpRs && mrpRs > priceRs && (
                                <span className="text-xs text-slate-500 line-through">
                                  ₹{mrpRs}
                                </span>
                              )}
                              <span className="text-[11px] text-slate-400">
                                / {product.unit || "piece"}
                              </span>
                            </div>
                            <p className="text-[10.5px] text-slate-400 mt-0.5">
                              {product.deliveryByPlatform
                                ? "🚚 HireBuddy Delivery (+2% auto-task) available"
                                : "🚚 Free Seller Self-Delivery or +2% Buddy Delivery"}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleOpenCheckout(product)}
                            className="rounded-xl bg-[#1361f5] hover:bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-950/60 transition"
                          >
                            Buy Direct →
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        ) : (
          /* MY MARKETPLACE ORDERS TAB */
          <section className="mx-auto max-w-[1360px] px-4 sm:px-6 mt-7">
            <div className="rounded-2xl border border-[#17294d] bg-[#081225] p-6">
              <h2 className="text-lg font-bold text-white mb-4">
                My Meerut Marketplace Orders
              </h2>
              {ordersLoading ? (
                <p className="text-xs text-slate-400">Loading your orders...</p>
              ) : myOrders.length === 0 ? (
                <p className="text-xs text-slate-400">
                  You haven&apos;t placed any marketplace orders yet.
                </p>
              ) : (
                <div className="space-y-4">
                  {myOrders.map((ord) => (
                    <div
                      key={ord.id}
                      className="rounded-2xl border border-[#1c325c] bg-[#050c1a] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-bold text-white">
                            {ord.orderNumber}
                          </span>
                          <span className="rounded-full bg-blue-500/20 px-2.5 py-0.5 text-[11px] font-bold text-blue-300">
                            {ord.orderStatus}
                          </span>
                          <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300">
                            {ord.deliveryMode === "PLATFORM_HELPER"
                              ? "🚚 HireBuddy Partner Delivery (+2%)"
                              : "🏭 Seller Self-Delivery"}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-300">
                          Seller: <strong>{ord.seller?.businessName}</strong> • Deliver to: {ord.shippingAddress}
                        </p>
                        <div className="mt-1.5 text-[11px] text-slate-400 flex flex-wrap gap-3">
                          <span>Subtotal: ₹{ord.productSubtotalRupees}</span>
                          <span>
                            Seller Portion: ₹{ord.sellerPayableRupees} ({ord.settlementStatus})
                          </span>
                          <span>Platform Commission: ₹{ord.platformCommissionRupees}</span>
                          {ord.deliveryFeeRupees > 0 && (
                            <span className="text-amber-300">
                              +2% Delivery Task Fee: ₹{ord.deliveryFeeRupees}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-extrabold text-emerald-400">
                          ₹{ord.totalPaidRupees}
                        </p>
                        {ord.deliveryTaskId && (
                          <Link
                            href={`/dashboard/my-tasks/${ord.deliveryTaskId}`}
                            className="mt-1 inline-block text-xs text-blue-400 underline"
                          >
                            View Auto-Created Delivery Task →
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      {/* ORDER CHECKOUT MODAL WITH PORTION-WISE SPLIT & 2% AUTO-DELIVERY TASK */}
      {checkoutProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-xl rounded-3xl border border-[#1f3664] bg-[#081226] p-6 shadow-2xl my-8">
            <div className="flex items-start justify-between gap-3 border-b border-[#162749] pb-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                  Direct Factory Order • Meerut Marketplace
                </span>
                <h3 className="text-lg font-extrabold text-white mt-0.5">
                  {checkoutProduct.title}
                </h3>
                <p className="text-xs text-slate-400">
                  Seller: {checkoutProduct.seller?.businessName} (Pickup:{" "}
                  {checkoutProduct.seller?.pickupAddress})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCheckoutProduct(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                ✕
              </button>
            </div>

            {orderResult ? (
              <div className="py-6 space-y-4">
                <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-xs sm:text-sm text-emerald-200 space-y-2">
                  <p className="text-base font-extrabold text-emerald-300">
                    🎉 Order Placed! ({orderResult.order?.orderNumber})
                  </p>
                  <p>{orderResult.message}</p>
                  <div className="pt-2 border-t border-emerald-500/20 text-xs space-y-1 text-slate-200">
                    <p>
                      • <strong>Total Paid:</strong> ₹{orderResult.splitSummary?.totalCustomerPaidRupees}
                    </p>
                    <p>
                      • <strong>Seller Account Share ({100 - commissionPct}%):</strong> ₹
                      {orderResult.splitSummary?.sellerShareRupees} (Queued for Daily NEFT / Direct Split)
                    </p>
                    <p>
                      • <strong>Platform Commission ({commissionPct}%):</strong> ₹
                      {orderResult.splitSummary?.platformCommissionRupees}
                    </p>
                    {orderResult.splitSummary?.deliveryCharge2PctRupees > 0 && (
                      <p className="text-amber-300">
                        • <strong>+2% Platform Delivery Task Created on behalf of Admin:</strong> ₹
                        {orderResult.splitSummary?.deliveryCharge2PctRupees} (Task ID:{" "}
                        {orderResult.splitSummary?.autoCreatedDeliveryTaskId})
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setCheckoutProduct(null);
                      setActiveView("orders");
                    }}
                    className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white"
                  >
                    View My Orders →
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handlePlaceOrder} className="mt-4 space-y-4">
                {orderError && (
                  <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2.5 text-xs text-rose-300">
                    {orderError}
                  </div>
                )}

                {/* Quantity & Delivery Mode */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Quantity ({checkoutProduct.unit || "piece"})
                    </label>
                    <input
                      type="number"
                      min={checkoutProduct.minOrderQty || 1}
                      max={checkoutProduct.stock || 99}
                      value={quantity}
                      onChange={(e) =>
                        setQuantity(Math.max(1, Number(e.target.value || 1)))
                      }
                      className="w-full rounded-xl border border-[#223966] bg-[#0b1730] px-3.5 py-2 text-sm text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Delivery Fulfillment Mode
                    </label>
                    <select
                      value={deliveryMode}
                      onChange={(e) => setDeliveryMode(e.target.value)}
                      className="w-full rounded-xl border border-[#223966] bg-[#0b1730] px-3 py-2 text-xs sm:text-sm text-white"
                    >
                      <option value="SELLER_SELF">
                        Seller Self-Delivery (₹0 Extra)
                      </option>
                      <option value="PLATFORM_HELPER">
                        HireBuddy Partner Delivery (+2% Extra — Auto Task)
                      </option>
                    </select>
                  </div>
                </div>

                {/* Shipping Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Your Name
                    </label>
                    <input
                      type="text"
                      required
                      value={shippingForm.customerName}
                      onChange={(e) =>
                        setShippingForm({ ...shippingForm, customerName: e.target.value })
                      }
                      placeholder="Full Name"
                      className="w-full rounded-xl border border-[#223966] bg-[#0b1730] px-3.5 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Mobile Number
                    </label>
                    <input
                      type="text"
                      required
                      value={shippingForm.customerPhone}
                      onChange={(e) =>
                        setShippingForm({ ...shippingForm, customerPhone: e.target.value })
                      }
                      placeholder="10-digit mobile number"
                      className="w-full rounded-xl border border-[#223966] bg-[#0b1730] px-3.5 py-2 text-xs text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Delivery Address
                  </label>
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
                    placeholder="House / Street / Locality, City"
                    className="w-full rounded-xl border border-[#223966] bg-[#0b1730] px-3.5 py-2 text-xs text-white"
                  />
                </div>

                {/* Transparent Portion-Wise Payment Split Box */}
                <div className="rounded-2xl border border-[#1d3562] bg-[#050c1a] p-4 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-slate-300">
                    <span>
                      Product Subtotal (₹{unitPriceRupees} × {quantity})
                    </span>
                    <span className="font-bold text-white">₹{subtotalRupees}</span>
                  </div>

                  <div className="flex items-center justify-between text-emerald-400">
                    <span>
                      ↳ Direct Seller Account Portion ({100 - commissionPct}% via Daily NEFT/Split)
                    </span>
                    <span>₹{sellerPayableRupees}</span>
                  </div>

                  <div className="flex items-center justify-between text-blue-300">
                    <span>
                      ↳ Platform Commission Portion ({commissionPct}%)
                    </span>
                    <span>₹{platformCommissionRupees}</span>
                  </div>

                  {deliveryMode === "PLATFORM_HELPER" && (
                    <div className="flex items-center justify-between text-amber-300 pt-1 border-t border-slate-800">
                      <span>
                        +2% HireBuddy Delivery (Auto-creates Delivery Task for Buddies)
                      </span>
                      <span className="font-bold">+₹{extraDeliveryFeeRupees}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-slate-700 text-sm font-extrabold text-white">
                    <span>Total Payable</span>
                    <span className="text-emerald-400">₹{grandTotalRupees}</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setCheckoutProduct(null)}
                    className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-xs font-semibold text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={orderSubmitting}
                    className="rounded-xl bg-emerald-600 hover:bg-emerald-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-950/50 transition disabled:opacity-50"
                  >
                    {orderSubmitting
                      ? "Processing Split Payment..."
                      : `Pay ₹${grandTotalRupees} & Place Order`}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
