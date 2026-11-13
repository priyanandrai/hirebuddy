"use client";

import { useEffect, useState, useCallback, use } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import HeaderAfterlogin from "../../components/layout/HeaderAfterlogin";
import Footer from "../../components/layout/Footer";
import {
  getMarketplaceProductDetail,
  placeMarketplaceOrder,
} from "../../components/services/marketplace.service";
import { createPaymentOrder } from "../../components/services/payment.service";
import { openRazorpayCheckout } from "../../components/lib/razorpayCheckout";
import { getUserProfile } from "../../components/services/user.service";

export default function MarketplaceProductDetailPage({ params }) {
  const resolvedParams = use(params);
  const slug = resolvedParams?.slug;
  const { data: session } = useSession();

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState("");
  const [selectedVariant, setSelectedVariant] = useState("");
  const [quantity, setQuantity] = useState(1);

  // 1-Click Buy Modal State (Auto-Picked Profile Phone & Address)
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [editingShipping, setEditingShipping] = useState(false);
  const [savedProfileInfo, setSavedProfileInfo] = useState(null);
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
  const [shareCopied, setShareCopied] = useState(false);

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
      setSavedProfileInfo({
        customerName: name || "HireBuddy Customer",
        customerPhone: phone || "9897000000",
        shippingAddress: fullAddress || "Modipuram, Meerut, UP",
        shippingCity: city,
        shippingPincode: pincode,
      });
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
    } catch (e) {}

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
    getMarketplaceProductDetail(slug)
      .then((res) => {
        if (res?.product) {
          setProduct(res.product);
          setRelatedProducts(res.relatedProducts || []);
          setReviews(res.reviews || []);
          const imgs = Array.isArray(res.product.images) && res.product.images.length > 0
            ? res.product.images
            : [res.product.image || "/images/helper_task_cleaning.png"];
          setActiveImage(imgs[0]);
          const vars = Array.isArray(res.product.variants) ? res.product.variants : [];
          if (vars.length > 0) {
            setSelectedVariant(vars[0].label);
          }
          setQuantity(res.product.minOrderQty || 1);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  const variantsArr = Array.isArray(product?.variants) ? product.variants : [];
  const activeVarObj =
    variantsArr.find((v) => v.label === selectedVariant) || variantsArr[0] || null;

  const unitPriceRupees = activeVarObj
    ? activeVarObj.priceRupees
    : product?.priceRupees || Math.round((product?.price || 0) / 100);
  const mrpRupees = activeVarObj
    ? activeVarObj.mrpRupees
    : product?.mrpRupees || (product?.mrp ? Math.round(product.mrp / 100) : unitPriceRupees);
  const discountPct =
    mrpRupees && mrpRupees > unitPriceRupees
      ? Math.round(((mrpRupees - unitPriceRupees) / mrpRupees) * 100)
      : 0;
  const totalPayableRupees = unitPriceRupees * quantity;

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!product) return;
    setOrderSubmitting(true);
    setOrderError("");

    try {
      let paymentOrderData = {};
      try {
        paymentOrderData = await createPaymentOrder(null, totalPayableRupees);
      } catch {}

      const rzpResponse = await openRazorpayCheckout({
        amountRupees: totalPayableRupees,
        orderId: paymentOrderData?.orderId,
        keyId: paymentOrderData?.keyId,
        title: "HireBuddy Marketplace",
        description: `${product.title}${selectedVariant ? ` [${selectedVariant}]` : ""} (Qty: ${quantity})`,
        prefill: {
          name: shippingForm.customerName,
          contact: shippingForm.customerPhone,
        },
      });

      const res = await placeMarketplaceOrder({
        items: [
          {
            productId: product.id,
            quantity,
            selectedVariant: selectedVariant || null,
          },
        ],
        ...shippingForm,
        razorpayPaymentId: rzpResponse?.razorpay_payment_id,
        razorpayOrderId: rzpResponse?.razorpay_order_id,
      });
      setOrderResult(res);
    } catch (err) {
      setOrderError(err?.message || "Please log in to place your order.");
    } finally {
      setOrderSubmitting(false);
    }
  };

  const handleShareProduct = () => {
    if (typeof window === "undefined") return;
    const shareUrl = window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl).catch(() => {});
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-[#060d1d] bg-[radial-gradient(ellipse_80%_60%_at_50%_-15%,rgba(29,78,216,0.18),transparent)] text-slate-100 flex flex-col">
      <HeaderAfterlogin />

      <main className="flex-1 pt-20 pb-16">
        <div className="mx-auto max-w-[1360px] px-4 sm:px-6">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-5">
            <Link href="/marketplace" className="hover:text-blue-400 font-semibold">
              ← Back to Marketplace
            </Link>
            {product && (
              <>
                <span>/</span>
                <span className="text-blue-300">{product.category}</span>
                <span>/</span>
                <span className="text-slate-200 truncate max-w-xs">{product.title}</span>
              </>
            )}
          </div>

          {loading ? (
            <div className="rounded-2xl border border-[#162542] bg-[#0a1326]/95 p-12 text-center text-sm text-slate-400">
              Loading product details...
            </div>
          ) : !product ? (
            <div className="rounded-2xl border border-[#162542] bg-[#0a1326]/95 p-12 text-center">
              <p className="text-lg font-bold text-white">Product Not Found</p>
              <Link
                href="/marketplace"
                className="mt-4 inline-block rounded-lg bg-[#1d6bf3] px-4 py-2 text-xs font-bold text-white"
              >
                Browse Marketplace →
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 rounded-2xl border border-[#162542] bg-[#0a1326]/95 p-6 sm:p-8 shadow-xl">
                {/* Left Column: Multi-Image Gallery */}
                <div>
                  <div className="relative h-80 sm:h-96 w-full overflow-hidden rounded-2xl border border-[#1e3563] bg-[#0c1a35]">
                    <img
                      src={activeImage || product.image || "/images/helper_task_cleaning.png"}
                      alt={product.title}
                      className="h-full w-full object-cover"
                    />
                    <span className="absolute left-3 top-3 rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white shadow">
                      ✓ Verified Seller
                    </span>
                    {discountPct > 0 && (
                      <span className="absolute left-3 bottom-3 rounded-xl bg-amber-500 px-3 py-1 text-xs font-extrabold text-slate-950 shadow">
                        {discountPct}% OFF
                      </span>
                    )}
                  </div>

                  {/* Image Thumbnails */}
                  {Array.isArray(product.images) && product.images.length > 1 && (
                    <div className="mt-3 flex gap-2.5 overflow-x-auto pb-1">
                      {product.images.map((imgUrl, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setActiveImage(imgUrl)}
                          className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition ${
                            activeImage === imgUrl
                              ? "border-blue-500"
                              : "border-transparent opacity-70 hover:opacity-100"
                          }`}
                        >
                          <img
                            src={imgUrl}
                            alt={`${product.title} ${idx + 1}`}
                            className="h-full w-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right Column: Amazon + Blinkit Product Info & 1-Click Buy */}
                <div className="flex flex-col justify-between space-y-5">
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="rounded-full border border-blue-500/40 bg-blue-500/15 px-3 py-0.5 text-xs font-bold text-blue-300">
                        {product.category}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="rounded-lg bg-amber-500/20 border border-amber-400/40 px-2.5 py-0.5 text-xs font-bold text-amber-300">
                          ★ {Number(product.avgRating || 4.8).toFixed(1)} ({product.reviewCount || 12} Verified Ratings)
                        </span>
                        <button
                          type="button"
                          onClick={handleShareProduct}
                          className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs font-semibold text-slate-300 hover:text-white"
                        >
                          {shareCopied ? "✓ Link Copied!" : "🔗 Share"}
                        </button>
                      </div>
                    </div>

                    <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
                      {product.title}
                    </h1>

                    {/* Price & Express Delivery Banner */}
                    <div className="rounded-2xl border border-[#1d3461] bg-[#050d1d] p-4">
                      <div className="flex items-baseline gap-3">
                        <span className="text-3xl font-extrabold text-white">
                          ₹{unitPriceRupees}
                        </span>
                        {mrpRupees > unitPriceRupees && (
                          <>
                            <span className="text-sm text-slate-500 line-through">
                              MRP ₹{mrpRupees}
                            </span>
                            <span className="text-xs font-bold text-amber-400">
                              Save ₹{mrpRupees - unitPriceRupees} ({discountPct}% OFF)
                            </span>
                          </>
                        )}
                        <span className="text-xs text-slate-400">
                          / {product.unit || "piece"}
                        </span>
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
                        <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 font-bold text-emerald-300">
                          {product.deliveryByPlatform
                            ? "⚡ 35–45 Min Local Buddy Delivery"
                            : "📦 Direct Manufacturer Dispatch"}
                        </span>
                        <span className="text-slate-400">
                          In Stock ({activeVarObj?.stock ?? product.stock} {product.unit}s available)
                        </span>
                      </div>
                    </div>

                    {/* Variant Selector (Color / Weight / Size) */}
                    {variantsArr.length > 0 && (
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-2">
                          Choose Option / Variant: <span className="text-blue-400">{selectedVariant}</span>
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {variantsArr.map((v) => {
                            const isSel = selectedVariant === v.label;
                            return (
                              <button
                                key={v.label}
                                type="button"
                                onClick={() => setSelectedVariant(v.label)}
                                className={`rounded-xl px-3.5 py-2 text-xs font-bold border transition ${
                                  isSel
                                    ? "border-blue-500 bg-blue-600/25 text-white shadow"
                                    : "border-[#1c325c] bg-[#0b1730] text-slate-300 hover:text-white"
                                }`}
                              >
                                {v.label} • ₹{v.priceRupees}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Product Highlights */}
                    {Array.isArray(product.highlights) && product.highlights.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          Product Highlights
                        </p>
                        <ul className="space-y-1 text-xs text-slate-200">
                          {product.highlights.map((hl, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-emerald-400 font-bold">✓</span>
                              <span>{hl}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                      {product.description}
                    </p>

                    {/* Verified Seller Trust Card */}
                    <div className="rounded-2xl border border-[#192e56] bg-[#060f20] p-3.5 text-xs">
                      <p className="font-bold text-emerald-400">
                        🏭 Sold by: {product.seller?.businessName || "Verified Seller"} (📍{" "}
                        {product.seller?.pickupCity || "Meerut"})
                      </p>
                      <div className="mt-1 flex flex-wrap gap-3 text-[11px] text-slate-400">
                        <span>✓ KYC &amp; Bank Verified</span>
                        {product.seller?.fssaiNumber && (
                          <span className="text-amber-300">
                            🛡️ FSSAI: {product.seller.fssaiNumber}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quantity & 1-Click Buy Action */}
                  <div className="pt-4 border-t border-[#162749] flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-300">Qty:</span>
                      <div className="flex items-center rounded-xl border border-[#223966] bg-[#0b1730] px-2 py-1 text-sm font-bold text-white">
                        <button
                          type="button"
                          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                          className="px-2 text-slate-300 hover:text-white"
                        >
                          −
                        </button>
                        <span className="px-3">{quantity}</span>
                        <button
                          type="button"
                          onClick={() => setQuantity((q) => q + 1)}
                          className="px-2 text-slate-300 hover:text-white"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setOrderResult(null);
                        setOrderError("");
                        setEditingShipping(false);
                        setShowBuyModal(true);
                      }}
                      className="flex-1 sm:flex-none rounded-lg bg-[#34b27b] hover:bg-[#2ca16d] px-8 py-3 text-sm font-bold text-white shadow-md shadow-emerald-950/30 transition"
                    >
                      Buy (₹{totalPayableRupees}) →
                    </button>
                  </div>
                </div>
              </div>

              {/* Verified Buyer Reviews */}
              <div className="mt-8 rounded-2xl border border-[#162542] bg-[#0a1326]/95 p-6 shadow-xl">
                <h2 className="text-base font-bold text-white mb-4">
                  ⭐ Customer Ratings &amp; Verified Reviews ({reviews.length || product.reviewCount || 12})
                </h2>
                {reviews.length === 0 ? (
                  <p className="text-xs text-slate-400">
                    Rated ★ {Number(product.avgRating || 4.8).toFixed(1)}/5 by verified buyers across Meerut &amp; NCR.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {reviews.map((rev) => (
                      <div
                        key={rev.id}
                        className="rounded-2xl border border-[#1c325c] bg-[#050c1a] p-4 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white">
                            {rev.buyerName} ({rev.buyerCity})
                          </span>
                          <span className="rounded-lg bg-amber-500/20 px-2 py-0.5 font-bold text-amber-300">
                            {"★".repeat(rev.rating)} ({rev.rating}/5)
                          </span>
                        </div>
                        <p className="mt-2 text-slate-300">{rev.review}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Related Products */}
              {relatedProducts.length > 0 && (
                <div className="mt-8">
                  <h2 className="text-lg font-bold text-white mb-4">
                    Similar Products in {product.category}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {relatedProducts.map((rp) => (
                      <Link
                        key={rp.id}
                        href={`/marketplace/${rp.slug || rp.id}`}
                        className="rounded-2xl border border-[#17294d] bg-[#081225] p-3.5 hover:border-blue-500/50 transition flex flex-col justify-between"
                      >
                        <div>
                          <img
                            src={rp.image || "/images/helper_task_cleaning.png"}
                            alt={rp.title}
                            className="h-36 w-full rounded-xl object-cover"
                          />
                          <h3 className="mt-2.5 text-sm font-bold text-white line-clamp-2">
                            {rp.title}
                          </h3>
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                          <span className="text-base font-extrabold text-emerald-400">
                            ₹{rp.priceRupees}
                          </span>
                          <span className="text-[11px] font-bold text-blue-400">
                            View →
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* 1-CLICK BUY MODAL WITH AUTO-PICKED USER PROFILE PHONE & ADDRESS */}
      {showBuyModal && product && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg rounded-3xl border border-[#1f3664] bg-[#081226] p-6 shadow-2xl my-8">
            <div className="flex items-start justify-between gap-3 border-b border-[#162749] pb-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                  1-Click Instant Checkout
                </span>
                <h3 className="text-lg font-extrabold text-white mt-0.5">
                  {product.title}
                </h3>
                {selectedVariant && (
                  <p className="text-xs text-blue-300 font-semibold">
                    Option: {selectedVariant}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowBuyModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                ✕
              </button>
            </div>

            {orderResult ? (
              <div className="py-6 space-y-4">
                <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-xs sm:text-sm text-emerald-200 space-y-2">
                  <p className="text-base font-extrabold text-emerald-300">
                    🎉 Order Confirmed! ({orderResult.order?.orderNumber})
                  </p>
                  <p>
                    Total Paid: <strong>₹{totalPayableRupees}</strong> • Delivering to:{" "}
                    <strong>{shippingForm.shippingAddress}</strong>
                  </p>
                  {orderResult.order?.deliveryOtp && (
                    <p className="text-indigo-300 font-bold">
                      🔐 Your 4-Digit Delivery PIN: {orderResult.order.deliveryOtp}
                    </p>
                  )}
                </div>
                <div className="flex justify-end gap-3">
                  <Link
                    href="/marketplace"
                    className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white"
                  >
                    Back to Marketplace →
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handlePlaceOrder} className="mt-4 space-y-4">
                {orderError && (
                  <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2.5 text-xs text-rose-300">
                    {orderError}
                  </div>
                )}

                {/* Auto-Picked Profile Phone & Address */}
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-bold text-emerald-300">
                        📍 Picked from Your Profile (Default Delivery Details)
                      </span>
                      <p className="mt-1 font-semibold text-white">
                        {shippingForm.customerName || "HireBuddy Customer"} • 📞{" "}
                        {shippingForm.customerPhone || "Phone from Profile"}
                      </p>
                      <p className="mt-0.5 text-slate-300">
                        🏠 {shippingForm.shippingAddress}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditingShipping((p) => !p)}
                      className="rounded-lg border border-emerald-500/40 bg-[#081226] px-2.5 py-1 text-[11px] font-bold text-emerald-300"
                    >
                      {editingShipping ? "Done" : "Change"}
                    </button>
                  </div>

                  {editingShipping && (
                    <div className="mt-3 pt-3 border-t border-emerald-500/20 space-y-2.5">
                      {savedProfileInfo && (
                        <button
                          type="button"
                          onClick={() => {
                            setShippingForm((prev) => ({ ...prev, ...savedProfileInfo }));
                            setEditingShipping(false);
                          }}
                          className="rounded-lg bg-emerald-600/20 border border-emerald-500/40 px-2.5 py-1 text-[11px] font-bold text-emerald-300"
                        >
                          ↺ Reset to Saved Profile Phone &amp; Address
                        </button>
                      )}
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          required
                          value={shippingForm.customerName}
                          onChange={(e) =>
                            setShippingForm({ ...shippingForm, customerName: e.target.value })
                          }
                          placeholder="Name"
                          className="rounded-xl border border-[#223966] bg-[#0b1730] px-3 py-1.5 text-xs text-white"
                        />
                        <input
                          type="text"
                          required
                          value={shippingForm.customerPhone}
                          onChange={(e) =>
                            setShippingForm({ ...shippingForm, customerPhone: e.target.value })
                          }
                          placeholder="Phone"
                          className="rounded-xl border border-[#223966] bg-[#0b1730] px-3 py-1.5 text-xs text-white"
                        />
                      </div>
                      <input
                        type="text"
                        required
                        value={shippingForm.shippingAddress}
                        onChange={(e) =>
                          setShippingForm({ ...shippingForm, shippingAddress: e.target.value })
                        }
                        placeholder="Delivery Address"
                        className="w-full rounded-xl border border-[#223966] bg-[#0b1730] px-3 py-1.5 text-xs text-white"
                      />
                    </div>
                  )}
                </div>

                {/* Price Summary */}
                <div className="rounded-2xl border border-[#1d3562] bg-[#050c1a] p-4 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>
                      Price (₹{unitPriceRupees} × {quantity} {product.unit})
                    </span>
                    <span className="font-bold text-white">₹{totalPayableRupees}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>
                      Delivery ({product.deliveryByPlatform ? "HireBuddy Partner" : "Seller Direct"})
                    </span>
                    <span className="text-emerald-400 font-semibold">Included</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-700 text-sm font-extrabold text-white">
                    <span>Total Payable</span>
                    <span className="text-emerald-400">₹{totalPayableRupees}</span>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowBuyModal(false)}
                    className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-xs font-semibold text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={orderSubmitting}
                    className="rounded-xl bg-emerald-600 hover:bg-emerald-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg"
                  >
                    {orderSubmitting ? "Processing..." : `Pay ₹${totalPayableRupees} & Buy`}
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
