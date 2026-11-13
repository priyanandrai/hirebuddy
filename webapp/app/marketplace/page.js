"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import HeaderAfterlogin from "../components/layout/HeaderAfterlogin";
import Footer from "../components/layout/Footer";
import {
  getMarketplaceProducts,
  placeMarketplaceOrder,
  getCustomerMarketplaceOrders,
  rateMarketplaceOrder,
} from "../components/services/marketplace.service";
import { createPaymentOrder } from "../components/services/payment.service";
import { openRazorpayCheckout } from "../components/lib/razorpayCheckout";
import { getUserProfile } from "../components/services/user.service";
import { ServiceGridCardShimmer } from "../components/ui/Shimmer";

export default function MeerutMarketplacePage() {
  const pathname = usePathname();
  const isInsideDashboardLayout = pathname?.startsWith("/dashboard");
  const { data: session } = useSession();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState("store"); // "store" | "orders"
  const [myOrders, setMyOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Dashboard-Style Sidebar Filter States
  const [selectedCategory, setSelectedCategory] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(6000);
  const [selectedRatings, setSelectedRatings] = useState([]);
  const [deliveryFilter, setDeliveryFilter] = useState(""); // "" | "PLATFORM_HELPER" | "SELLER_SELF"
  const [sortBy, setSortBy] = useState("newest");
  const [searchQuery, setSearchQuery] = useState("");
  const [favorites, setFavorites] = useState([]);

  // Blinkit / Amazon Style Multi-Item Cart & Variant State
  const [cart, setCart] = useState([]);
  const [selectedVariants, setSelectedVariants] = useState({});
  const [checkoutVariant, setCheckoutVariant] = useState("");
  const [ratingOrderId, setRatingOrderId] = useState(null);
  const [ratingStars, setRatingStars] = useState(5);
  const [ratingReview, setRatingReview] = useState("");
  const [ratingSubmitting, setRatingSubmitting] = useState(false);

  // Order Checkout Modal State (Delivery mode is set by the Seller when listing the product)
  const [checkoutProduct, setCheckoutProduct] = useState(null);
  const [isCartCheckout, setIsCartCheckout] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [editingShipping, setEditingShipping] = useState(false);
  const [savedProfileInfo, setSavedProfileInfo] = useState(null);
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

  // Listen to global header search events just like Dashboard page
  useEffect(() => {
    const handleHeaderSearch = (e) => {
      setSearchQuery(typeof e.detail === "string" ? e.detail : "");
    };
    window.addEventListener("hirebuddy:search-change", handleHeaderSearch);
    return () => {
      window.removeEventListener("hirebuddy:search-change", handleHeaderSearch);
    };
  }, []);

  // Automatically pick Name, Phone, and Address from User Profile (Session + LocalStorage + API)
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

    if (session?.user) {
      applyProfileToShipping(session.user);
    }
    try {
      const stored = JSON.parse(localStorage.getItem("user") || "{}");
      if (stored && (stored.name || stored.phone || stored.address)) {
        applyProfileToShipping(stored);
      }
    } catch (e) {}

    getUserProfile()
      .then((res) => {
        const u = res?.user || res?.data || res;
        if (u && typeof u === "object") {
          applyProfileToShipping(u);
        }
      })
      .catch(() => {});
  }, [session, applyProfileToShipping]);

  const fetchCatalog = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMarketplaceProducts({});
      const list = res?.products || [];
      setProducts(list);
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
    fetchCatalog();
    fetchMyOrders();
  }, [fetchCatalog, fetchMyOrders]);

  useEffect(() => {
    if (activeView === "orders") {
      fetchMyOrders();
    }
  }, [activeView, fetchMyOrders]);

  const getActiveVariantObj = (product, variantLabel) => {
    const vars = Array.isArray(product?.variants) ? product.variants : [];
    if (vars.length === 0) return null;
    if (variantLabel) {
      const found = vars.find((v) => v.label === variantLabel);
      if (found) return found;
    }
    return vars[0];
  };

  // Base filtered products (before category selection, for sidebar category counts)
  const baseFilteredProducts = useMemo(() => {
    let list = [...products];
    const q = String(searchQuery || "").trim().toLowerCase();
    const loc = String(locationFilter || "").trim().toLowerCase();
    const minRating =
      selectedRatings.length > 0 ? Math.min(...selectedRatings) : undefined;

    if (q) {
      list = list.filter(
        (p) =>
          (p.title || "").toLowerCase().includes(q) ||
          (p.description || "").toLowerCase().includes(q) ||
          (p.category || "").toLowerCase().includes(q) ||
          (p.seller?.businessName || "").toLowerCase().includes(q)
      );
    }

    if (loc) {
      list = list.filter(
        (p) =>
          (p.seller?.pickupCity || "Meerut").toLowerCase().includes(loc) ||
          (p.seller?.pickupAddress || "").toLowerCase().includes(loc) ||
          (p.seller?.businessName || "").toLowerCase().includes(loc)
      );
    }

    if (deliveryFilter) {
      list = list.filter((p) => {
        const mode = p.deliveryByPlatform ? "PLATFORM_HELPER" : "SELLER_SELF";
        return mode === deliveryFilter;
      });
    }

    list = list.filter((p) => {
      const pRs = p.priceRupees || Math.round((p.price || 0) / 100);
      if (minPrice > 0 && pRs < minPrice) return false;
      if (maxPrice < 6000 && pRs > maxPrice) return false;
      return true;
    });

    if (minRating !== undefined) {
      list = list.filter((p) => Number(p.avgRating || 4.8) >= minRating);
    }

    return list;
  }, [
    products,
    searchQuery,
    locationFilter,
    deliveryFilter,
    minPrice,
    maxPrice,
    selectedRatings,
  ]);

  // Sidebar categories with live counts (matching Dashboard page)
  const sidebarCategories = useMemo(() => {
    const uniqueCats =
      categories.length > 0
        ? categories
        : [...new Set(products.map((p) => p.category).filter(Boolean))];

    return [
      {
        name: "All Products",
        slug: "all",
        count: baseFilteredProducts.length,
        iconType: "all",
      },
      ...uniqueCats.map((catName) => ({
        name: catName,
        slug: catName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        count: baseFilteredProducts.filter(
          (p) => (p.category || "").toLowerCase() === catName.toLowerCase()
        ).length,
        iconType: getCategoryIconType(catName),
      })),
    ];
  }, [categories, products, baseFilteredProducts]);

  // Final filtered & sorted products
  const filteredProducts = useMemo(() => {
    let list = [...baseFilteredProducts];
    if (
      selectedCategory &&
      selectedCategory.toLowerCase() !== "all" &&
      selectedCategory.toLowerCase() !== "all products"
    ) {
      list = list.filter(
        (p) => (p.category || "").toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    if (sortBy === "rating_desc") {
      list.sort(
        (a, b) =>
          Number(b.avgRating || 4.8) - Number(a.avgRating || 4.8) ||
          Number(b.reviewCount || 12) - Number(a.reviewCount || 12)
      );
    } else if (sortBy === "price_asc") {
      list.sort(
        (a, b) =>
          (a.priceRupees || Math.round((a.price || 0) / 100)) -
          (b.priceRupees || Math.round((b.price || 0) / 100))
      );
    } else if (sortBy === "price_desc") {
      list.sort(
        (a, b) =>
          (b.priceRupees || Math.round((b.price || 0) / 100)) -
          (a.priceRupees || Math.round((a.price || 0) / 100))
      );
    }

    return list;
  }, [baseFilteredProducts, selectedCategory, sortBy]);

  const handleCategoryClick = (categoryName) => {
    setActiveView("store");
    if (
      categoryName.toLowerCase() === "all products" ||
      categoryName.toLowerCase() === "all"
    ) {
      setSelectedCategory("");
      return;
    }
    setSelectedCategory((prev) =>
      prev.toLowerCase() === categoryName.toLowerCase() ? "" : categoryName
    );
  };

  const toggleRatingFilter = (ratingValue) => {
    setSelectedRatings((prev) =>
      prev.includes(ratingValue)
        ? prev.filter((r) => r !== ratingValue)
        : [...prev, ratingValue]
    );
  };

  const handleClearAllFilters = () => {
    setSelectedCategory("");
    setLocationFilter("");
    setDeliveryFilter("");
    setMinPrice(0);
    setMaxPrice(6000);
    setSelectedRatings([]);
    setSortBy("newest");
    setSearchQuery("");
  };

  const toggleFavorite = (productId) => {
    setFavorites((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const handleOpenCheckout = (product) => {
    const activeVar = getActiveVariantObj(product, selectedVariants[product.id]);
    setIsCartCheckout(false);
    setCheckoutProduct(product);
    setCheckoutVariant(activeVar?.label || "");
    setQuantity(product.minOrderQty || 1);
    setEditingShipping(false);
    setOrderResult(null);
    setOrderError("");
  };

  const handleAddToCart = (product, delta = 1) => {
    const activeVar = getActiveVariantObj(product, selectedVariants[product.id]);
    const selectedVariant = activeVar?.label || null;
    setCart((prev) => {
      const existing = prev.find(
        (item) =>
          item.product.id === product.id &&
          (item.selectedVariant || null) === selectedVariant
      );
      if (existing) {
        const nextQty = existing.quantity + delta;
        if (nextQty <= 0) {
          return prev.filter(
            (item) =>
              !(
                item.product.id === product.id &&
                (item.selectedVariant || null) === selectedVariant
              )
          );
        }
        return prev.map((item) =>
          item.product.id === product.id &&
          (item.selectedVariant || null) === selectedVariant
            ? { ...item, quantity: nextQty }
            : item
        );
      }
      if (delta <= 0) return prev;
      return [...prev, { product, quantity: Math.max(1, delta), selectedVariant }];
    });
  };

  const handleOpenCartCheckout = () => {
    if (cart.length === 0) return;
    setIsCartCheckout(true);
    setCheckoutProduct(cart[0].product);
    setCheckoutVariant(cart[0].selectedVariant || "");
    setQuantity(cart[0].quantity);
    setEditingShipping(false);
    setOrderResult(null);
    setOrderError("");
  };

  // Delivery mode is configured by the Seller when listing the product
  const deliveryMode =
    checkoutProduct?.deliveryByPlatform ||
    checkoutProduct?.defaultDeliveryMode === "PLATFORM_HELPER"
      ? "PLATFORM_HELPER"
      : "SELLER_SELF";

  const activeCheckoutVariantObj = checkoutProduct
    ? getActiveVariantObj(checkoutProduct, checkoutVariant)
    : null;

  // Customer Price Calculation (Customer only sees & pays Product Price × Quantity)
  const unitPriceRupees = checkoutProduct
    ? activeCheckoutVariantObj?.priceRupees ||
      checkoutProduct.priceRupees ||
      Math.round((checkoutProduct.price || 0) / 100)
    : 0;
  const cartTotalRupees = cart.reduce((sum, item) => {
    const varObj = getActiveVariantObj(item.product, item.selectedVariant);
    const pRs =
      varObj?.priceRupees ||
      item.product.priceRupees ||
      Math.round((item.product.price || 0) / 100);
    return sum + pRs * item.quantity;
  }, 0);
  const subtotalRupees = isCartCheckout ? cartTotalRupees : unitPriceRupees * quantity;
  const grandTotalRupees = subtotalRupees;

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!checkoutProduct) return;
    setOrderSubmitting(true);
    setOrderError("");

    try {
      let paymentOrderData = {};
      try {
        paymentOrderData = await createPaymentOrder(null, grandTotalRupees);
      } catch {
        // Proceed with client-side checkout fallback if payment order endpoint is unavailable
      }

      const rzpResponse = await openRazorpayCheckout({
        amountRupees: grandTotalRupees,
        orderId: paymentOrderData?.orderId,
        keyId: paymentOrderData?.keyId,
        title: "HireBuddy Marketplace",
        description: isCartCheckout
          ? `Cart Order (${cart.length} items)`
          : `${checkoutProduct.title}${checkoutVariant ? ` [${checkoutVariant}]` : ""} (Qty: ${quantity})`,
        prefill: {
          name: shippingForm.customerName,
          contact: shippingForm.customerPhone,
        },
      });

      if (isCartCheckout && cart.length > 0) {
        const res = await placeMarketplaceOrder({
          items: cart.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
            selectedVariant: item.selectedVariant || null,
          })),
          ...shippingForm,
          razorpayPaymentId: rzpResponse?.razorpay_payment_id,
          razorpayOrderId: rzpResponse?.razorpay_order_id,
        });
        setOrderResult(res);
        setCart([]);
      } else {
        const res = await placeMarketplaceOrder({
          items: [
            {
              productId: checkoutProduct.id,
              quantity,
              selectedVariant: checkoutVariant || null,
            },
          ],
          ...shippingForm,
          razorpayPaymentId: rzpResponse?.razorpay_payment_id,
          razorpayOrderId: rzpResponse?.razorpay_order_id,
        });
        setOrderResult(res);
      }
      fetchCatalog();
      fetchMyOrders();
    } catch (err) {
      setOrderError(
        err?.message || "Please log in to place your marketplace order."
      );
    } finally {
      setOrderSubmitting(false);
    }
  };

  const handleSubmitOrderRating = async (orderId) => {
    setRatingSubmitting(true);
    try {
      await rateMarketplaceOrder(orderId, {
        rating: ratingStars,
        review: ratingReview,
      });
      setRatingOrderId(null);
      setRatingReview("");
      fetchMyOrders();
      fetchCatalog();
    } catch (e) {
      // ignore
    } finally {
      setRatingSubmitting(false);
    }
  };

  const minPercent = (minPrice / 6000) * 100;
  const maxPercent = (maxPrice / 6000) * 100;

  const dashboardBody = (
    <div className="min-h-screen bg-[#060d1d] bg-[radial-gradient(ellipse_80%_60%_at_50%_-15%,rgba(29,78,216,0.18),transparent)] text-slate-100">
      <div className="mx-auto max-w-[1360px] px-4 pb-16 pt-6 sm:px-6">
        {/* Main 2-Column Dashboard Layout: Left Sidebar + Right Main Content */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[255px_1fr]">
          {/* Left Sidebar */}
          <aside className="space-y-4">
            {/* Categories Card */}
            <div className="rounded-2xl border border-[#162542] bg-[#0a1326]/95 p-4 shadow-xl">
              <div className="mb-3 flex items-center gap-2.5 px-1">
                <svg className="h-4 w-4 text-slate-200" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="3" y="3" width="7.5" height="7.5" rx="1.5" />
                  <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" />
                  <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" />
                  <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" />
                </svg>
                <h2 className="text-[15px] font-bold text-white">Categories</h2>
              </div>

              <div className="space-y-1">
                {sidebarCategories.map((cat) => {
                  const isAllItem =
                    cat.slug === "all" || cat.name.toLowerCase() === "all products";
                  const isSelected = isAllItem
                    ? !selectedCategory ||
                      selectedCategory.toLowerCase() === "all" ||
                      selectedCategory.toLowerCase() === "all products"
                    : selectedCategory.toLowerCase() === cat.name.toLowerCase();

                  return (
                    <button
                      key={cat.slug || cat.name}
                      type="button"
                      onClick={() => handleCategoryClick(cat.name)}
                      className={`group flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-[13px] transition ${
                        isSelected
                          ? "bg-[#1d6bf3] font-semibold text-white shadow-md shadow-blue-600/25"
                          : "font-medium text-slate-300 hover:bg-[#111e38] hover:text-white"
                      }`}
                    >
                      <span className="flex items-center gap-2.5 truncate">
                        <span
                          className={`flex h-4 w-4 items-center justify-center ${
                            isSelected
                              ? "text-white"
                              : "text-slate-400 group-hover:text-slate-200"
                          }`}
                        >
                          <CategorySidebarIcon type={cat.iconType} />
                        </span>
                        <span className="truncate">{cat.name}</span>
                      </span>
                      <span
                        className={`text-xs font-medium ${
                          isSelected ? "text-white" : "text-slate-400"
                        }`}
                      >
                        {cat.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Filter Card */}
            <div className="rounded-2xl border border-[#162542] bg-[#0a1326]/95 p-4 shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg
                    className="h-4 w-4 text-slate-200"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                    />
                  </svg>
                  <h2 className="text-[15px] font-bold text-white">Filter</h2>
                </div>
                <button
                  type="button"
                  onClick={handleClearAllFilters}
                  className="text-xs font-medium text-[#3b82f6] transition hover:text-blue-400"
                >
                  Clear all
                </button>
              </div>

              {/* Search Input */}
              <div className="mb-4">
                <label className="mb-2 block text-xs font-semibold text-slate-200">
                  Search Product
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Saree, gift, bat, gajak..."
                    className="w-full rounded-lg border border-[#1c2f52] bg-[#0d182e] py-2 pl-8 pr-7 text-xs text-slate-100 placeholder:text-slate-400 focus:border-[#3b82f6] focus:outline-none"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>

              {/* Location Input */}
              <div className="mb-5">
                <label className="mb-2 block text-xs font-semibold text-slate-200">
                  Location / Seller
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                  <input
                    type="text"
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    placeholder="Meerut, Abu Lane..."
                    className="w-full rounded-lg border border-[#1c2f52] bg-[#0d182e] py-2 pl-8 pr-7 text-xs text-slate-100 placeholder:text-slate-400 focus:border-[#3b82f6] focus:outline-none"
                  />
                  {locationFilter && (
                    <button
                      type="button"
                      onClick={() => setLocationFilter("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>

              {/* Price Range Slider */}
              <div className="mb-5">
                <label className="mb-3 block text-xs font-semibold text-slate-200">
                  Price Range
                </label>

                <div className="relative h-5 flex items-center">
                  <div className="h-1.5 w-full rounded-full bg-[#1c2d4d]" />
                  <div
                    className="absolute h-1.5 rounded-full bg-[#2563eb]"
                    style={{
                      left: `${minPercent}%`,
                      width: `${Math.max(0, maxPercent - minPercent)}%`,
                    }}
                  />

                  <input
                    type="range"
                    min={0}
                    max={6000}
                    step={100}
                    value={minPrice}
                    onChange={(e) => {
                      const val = Math.min(Number(e.target.value), maxPrice - 100);
                      setMinPrice(val);
                    }}
                    className="pointer-events-none absolute inset-0 h-full w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#60a5fa] [&::-webkit-slider-thumb]:bg-[#2563eb] [&::-webkit-slider-thumb]:shadow"
                  />

                  <input
                    type="range"
                    min={0}
                    max={6000}
                    step={100}
                    value={maxPrice}
                    onChange={(e) => {
                      const val = Math.max(Number(e.target.value), minPrice + 100);
                      setMaxPrice(val);
                    }}
                    className="pointer-events-none absolute inset-0 h-full w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#60a5fa] [&::-webkit-slider-thumb]:bg-[#2563eb] [&::-webkit-slider-thumb]:shadow"
                  />
                </div>

                <div className="mt-2 flex items-center justify-between text-xs font-medium text-slate-300">
                  <span>₹{minPrice}</span>
                  <span>₹{maxPrice === 6000 ? "6000+" : maxPrice}</span>
                </div>
              </div>

              {/* Delivery Type Filter */}
              <div className="mb-5">
                <label className="mb-2 block text-xs font-semibold text-slate-200">
                  Delivery Speed
                </label>
                <div className="space-y-1.5 text-xs">
                  {[
                    { id: "", label: "All Delivery Types" },
                    { id: "PLATFORM_HELPER", label: "⚡ 35–45 Min Buddy" },
                    { id: "SELLER_SELF", label: "📦 Seller Direct" },
                  ].map((opt) => (
                    <button
                      key={opt.id || "all"}
                      type="button"
                      onClick={() => setDeliveryFilter(opt.id)}
                      className={`w-full rounded-lg px-2.5 py-1.5 text-left font-medium transition ${
                        deliveryFilter === opt.id
                          ? "bg-[#1d6bf3]/20 border border-[#2563eb] text-white"
                          : "border border-transparent text-slate-300 hover:bg-[#111e38]"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rating Checkboxes */}
              <div>
                <label className="mb-2.5 block text-xs font-semibold text-slate-200">
                  Rating
                </label>
                <div className="space-y-2">
                  {[4.5, 4.0].map((ratingVal) => {
                    const checked = selectedRatings.includes(ratingVal);
                    return (
                      <label
                        key={ratingVal}
                        className="flex cursor-pointer items-center gap-2.5 text-xs text-slate-300 select-none hover:text-white"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleRatingFilter(ratingVal)}
                          className="sr-only"
                        />
                        <span
                          className={`flex h-4 w-4 items-center justify-center rounded border transition ${
                            checked
                              ? "border-[#2563eb] bg-[#2563eb] text-white"
                              : "border-[#2a3f66] bg-[#0d182e]"
                          }`}
                        >
                          {checked && (
                            <svg
                              className="h-3 w-3"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={3}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          )}
                        </span>
                        <span className="font-medium">{ratingVal.toFixed(1)}+</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          </aside>

          {/* Right Main Content */}
          <div>
            {activeView === "store" ? (
              <>
                {/* Header Row — Matches Dashboard Header Row */}
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h2 className="text-[18px] font-bold text-white">
                      Available Products{" "}
                      <span className="ml-1 text-sm font-medium text-slate-400">
                        ({filteredProducts.length})
                      </span>
                    </h2>
                    {selectedCategory && selectedCategory !== "all" && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/15 border border-blue-500/30 px-3 py-0.5 text-xs font-medium text-blue-300">
                        {selectedCategory}
                        <button
                          type="button"
                          onClick={() => setSelectedCategory("")}
                          className="hover:text-white"
                        >
                          ×
                        </button>
                      </span>
                    )}
                    {locationFilter.trim() && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 px-3 py-0.5 text-xs font-medium text-indigo-300">
                        📍 {locationFilter.trim()}
                        <button
                          type="button"
                          onClick={() => setLocationFilter("")}
                          className="hover:text-white"
                        >
                          ×
                        </button>
                      </span>
                    )}
                    {searchQuery && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-0.5 text-xs font-medium text-emerald-300">
                        &ldquo;{searchQuery}&rdquo;
                        <button
                          type="button"
                          onClick={() => setSearchQuery("")}
                          className="hover:text-white"
                        >
                          ×
                        </button>
                      </span>
                    )}
                  </div>

                  {/* Quick Actions & Sort Dropdown */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => setActiveView("orders")}
                      className="rounded-lg border border-[#1b2c4d] bg-[#0a1326] px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-[#111e38] hover:text-white"
                    >
                      📦 My Orders {myOrders.length > 0 ? `(${myOrders.length})` : ""}
                    </button>
                    <Link
                      href="/become-a-seller"
                      className="rounded-lg border border-[#243860] bg-[#0f1c36] px-3 py-1.5 text-xs font-semibold text-emerald-300 transition hover:bg-[#162749]"
                    >
                      🏭 Sell on HireBuddy →
                    </Link>
                    <div className="relative">
                      <select
                        aria-label="Sort products"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="appearance-none rounded-lg border border-[#1b2c4d] bg-[#0a1326] py-1.5 pl-3.5 pr-8 text-xs font-medium text-slate-200 focus:border-blue-500 focus:outline-none cursor-pointer"
                      >
                        <option value="newest">Sort by: Relevance</option>
                        <option value="rating_desc">Sort by: Rating</option>
                        <option value="price_asc">Sort by: Price: Low to High</option>
                        <option value="price_desc">Sort by: Price: High to Low</option>
                      </select>
                      <svg
                        className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Product Grid — Matches Dashboard ServiceCard Grid */}
                {loading ? (
                  <ServiceGridCardShimmer count={6} />
                ) : filteredProducts.length === 0 ? (
                  <div className="rounded-2xl border border-[#162542] bg-[#0a1326]/90 p-12 text-center">
                    <p className="text-base font-semibold text-white">
                      No products match your active filters
                    </p>
                    <p className="mt-1.5 text-xs text-slate-400">
                      Try adjusting the category, location, price range, or search filter.
                    </p>
                    <button
                      type="button"
                      onClick={handleClearAllFilters}
                      className="mt-4 rounded-lg bg-[#1d6bf3] px-4 py-2 text-xs font-semibold text-white hover:bg-blue-600 transition"
                    >
                      Reset Filters
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {filteredProducts.map((product) => {
                      const activeVar = getActiveVariantObj(
                        product,
                        selectedVariants[product.id]
                      );
                      const priceRs =
                        activeVar?.priceRupees ||
                        product.priceRupees ||
                        Math.round((product.price || 0) / 100);
                      const mrpRs =
                        activeVar?.mrpRupees ||
                        product.mrpRupees ||
                        (product.mrp ? Math.round(product.mrp / 100) : null);
                      const discountPct =
                        mrpRs && mrpRs > priceRs
                          ? Math.round(((mrpRs - priceRs) / mrpRs) * 100)
                          : 0;
                      const cartItem = cart.find(
                        (c) =>
                          c.product.id === product.id &&
                          (c.selectedVariant || null) === (activeVar?.label || null)
                      );
                      const variantsArr = Array.isArray(product.variants)
                        ? product.variants
                        : [];
                      const isFavorite = favorites.includes(product.id);
                      const iconType = getCategoryIconType(product.category);

                      return (
                        <div
                          key={product.id}
                          className="group flex flex-col overflow-hidden rounded-2xl border border-[#162645] bg-[#0b1528]/95 shadow-lg transition duration-200 hover:-translate-y-0.5 hover:border-[#254175]"
                        >
                          {/* Top Image Banner — Identical to Dashboard ServiceCard */}
                          <div className="relative h-[136px] w-full overflow-hidden bg-[#0d182e]">
                            <Link
                              href={`/marketplace/${product.slug || product.id}`}
                              className="block h-full w-full"
                            >
                              <img
                                src={product.image || "/images/helper_task_cleaning.png"}
                                alt={product.title}
                                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                              />
                            </Link>
                            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0b1528] via-transparent to-transparent opacity-65" />

                            {discountPct > 0 && (
                              <span className="absolute left-2.5 top-2.5 rounded-md bg-amber-500 px-2 py-0.5 text-[10px] font-extrabold text-slate-950 shadow">
                                {discountPct}% OFF
                              </span>
                            )}

                            {/* Favorite Heart Button */}
                            <button
                              type="button"
                              aria-label="Save product"
                              onClick={() => toggleFavorite(product.id)}
                              className="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-slate-950/60 text-white backdrop-blur-sm transition hover:bg-slate-900"
                            >
                              <svg
                                className={`h-4 w-4 ${
                                  isFavorite
                                    ? "fill-rose-500 text-rose-500"
                                    : "fill-none text-white"
                                }`}
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={1.9}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                                />
                              </svg>
                            </button>
                          </div>

                          {/* Card Body — Identical to Dashboard ServiceCard */}
                          <div className="relative flex flex-1 flex-col px-4 pb-4 pt-2">
                            {/* Overlapping Category Icon Badge */}
                            <div className="-mt-6 mb-2 flex items-center justify-between">
                              <ProductCategoryBadge type={iconType} />
                              <span className="rounded-md border border-[#1e3154] bg-[#0a1326] px-2 py-0.5 text-[10px] font-semibold text-blue-300">
                                {product.category}
                              </span>
                            </div>

                            {/* Title & Verified Pill */}
                            <div className="flex flex-wrap items-center gap-2">
                              <Link
                                href={`/marketplace/${product.slug || product.id}`}
                                className="text-[15.5px] font-bold text-white hover:text-blue-400 leading-snug transition line-clamp-1"
                              >
                                {product.title}
                              </Link>
                              <span className="rounded-md bg-[#0d6e52]/90 px-2 py-0.5 text-[10px] font-semibold text-[#34d399]">
                                Verified
                              </span>
                            </div>

                            {/* Rating & Seller Pill */}
                            <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs">
                              <span className="text-amber-400 text-sm leading-none">★</span>
                              <span className="font-bold text-white">
                                {Number(product.avgRating || 4.8).toFixed(1)}
                              </span>
                              <span className="text-slate-400">
                                ({product.reviewCount || 12} reviews)
                              </span>
                              <span className="ml-auto rounded border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-300 truncate max-w-[140px]">
                                🏭 {product.seller?.businessName || "Verified Seller"}
                              </span>
                            </div>

                            {/* Location & Delivery Speed */}
                            <div className="mt-1 flex items-center justify-between gap-1.5 text-xs text-slate-300">
                              <span className="flex items-center gap-1 truncate">
                                <svg
                                  className="h-3.5 w-3.5 shrink-0 text-slate-400"
                                  viewBox="0 0 24 24"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                <span className="truncate">
                                  {product.seller?.pickupCity || "Meerut"}
                                </span>
                              </span>
                              <span className="text-[10.5px] font-semibold text-[#22c58b]">
                                {product.deliveryByPlatform
                                  ? "⚡ 35–45 Min Buddy"
                                  : "📦 Direct Dispatch"}
                              </span>
                            </div>

                            {/* Description */}
                            <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-300/90">
                              {product.description}
                            </p>

                            {/* Variant Pills (Color / Weight / Size) */}
                            {variantsArr.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {variantsArr.map((v) => {
                                  const isSelected = activeVar?.label === v.label;
                                  return (
                                    <button
                                      key={v.label}
                                      type="button"
                                      onClick={() =>
                                        setSelectedVariants((prev) => ({
                                          ...prev,
                                          [product.id]: v.label,
                                        }))
                                      }
                                      className={`rounded-md px-2 py-0.5 text-[10px] font-semibold border transition ${
                                        isSelected
                                          ? "border-[#2563eb] bg-[#1d6bf3]/25 text-white"
                                          : "border-[#1c2f52] bg-[#0a1326] text-slate-400 hover:text-slate-200"
                                      }`}
                                    >
                                      {v.label}
                                    </button>
                                  );
                                })}
                              </div>
                            )}

                            {/* Price Row — Matches Dashboard ServiceCard */}
                            <div className="mt-auto pt-3 flex items-baseline gap-2 text-xs text-slate-300">
                              <span className="text-[15.5px] font-extrabold text-white">
                                ₹{priceRs}/{product.unit || "piece"}
                              </span>
                              {mrpRs && mrpRs > priceRs && (
                                <span className="text-[11px] text-slate-500 line-through">
                                  ₹{mrpRs}
                                </span>
                              )}
                            </div>

                            {/* Action Buttons — Matches Dashboard 2-Column Buttons */}
                            <div className="mt-3 grid grid-cols-2 gap-2.5">
                              {cartItem ? (
                                <div className="flex items-center justify-between rounded-lg border border-[#2563eb] bg-[#1d6bf3]/20 px-2.5 py-1.5 text-xs font-bold text-white">
                                  <button
                                    type="button"
                                    onClick={() => handleAddToCart(product, -1)}
                                    className="px-1.5 hover:text-emerald-300"
                                  >
                                    −
                                  </button>
                                  <span>{cartItem.quantity} in Cart</span>
                                  <button
                                    type="button"
                                    onClick={() => handleAddToCart(product, 1)}
                                    className="px-1.5 hover:text-emerald-300"
                                  >
                                    +
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleAddToCart(product, 1)}
                                  className="rounded-lg border border-[#1e3154] bg-[#0b162c] py-2 text-xs font-semibold text-slate-200 transition hover:border-slate-500 hover:bg-[#132240] hover:text-white"
                                >
                                  + Add to Cart
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => handleOpenCheckout(product)}
                                className="rounded-lg bg-[#34b27b] py-2 text-center text-xs font-bold text-white shadow-md shadow-emerald-950/30 transition hover:bg-[#2ca16d]"
                              >
                                Buy
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              /* MY MARKETPLACE ORDERS TAB — Dashboard Card Look */
              <div className="rounded-2xl border border-[#162542] bg-[#0a1326]/95 p-6 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-[18px] font-bold text-white">
                    My Marketplace Orders ({myOrders.length})
                  </h2>
                  <button
                    type="button"
                    onClick={() => setActiveView("store")}
                    className="rounded-lg bg-[#1d6bf3] px-3.5 py-1.5 text-xs font-semibold text-white"
                  >
                    ← Back to Products
                  </button>
                </div>

                {ordersLoading ? (
                  <p className="text-xs text-slate-400">Loading your orders...</p>
                ) : myOrders.length === 0 ? (
                  <p className="text-xs text-slate-400">
                    You haven&apos;t placed any marketplace orders yet.
                  </p>
                ) : (
                  <div className="space-y-3.5">
                    {myOrders.map((ord) => (
                      <div
                        key={ord.id}
                        className="rounded-2xl border border-[#162645] bg-[#0b1528]/95 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-bold text-white">
                              {ord.orderNumber}
                            </span>
                            <span className="rounded-md bg-blue-500/20 px-2.5 py-0.5 text-[11px] font-bold text-blue-300">
                              {ord.orderStatus}
                            </span>
                            <span className="rounded-md bg-[#0d6e52]/90 px-2.5 py-0.5 text-[11px] font-semibold text-[#34d399]">
                              {ord.deliveryMode === "PLATFORM_HELPER"
                                ? "⚡ HireBuddy Partner Delivery"
                                : "📦 Seller Direct Delivery"}
                            </span>
                            {ord.deliveryOtp && ord.orderStatus !== "DELIVERED" && (
                              <span className="rounded-md border border-indigo-500/40 bg-indigo-500/20 px-2.5 py-0.5 text-[11px] font-bold text-indigo-300">
                                🔐 Delivery PIN: {ord.deliveryOtp}
                              </span>
                            )}
                          </div>
                          <p className="mt-1.5 text-xs text-slate-300">
                            Seller: <strong>{ord.seller?.businessName}</strong> • Deliver to:{" "}
                            {ord.shippingAddress}
                          </p>
                          <div className="mt-1.5 text-[11px] text-slate-400 flex flex-wrap gap-3">
                            <span>Order Amount: ₹{ord.productSubtotalRupees}</span>
                            <span>Payment: {ord.paymentStatus || "PAID"}</span>
                            {ord.buyerRating ? (
                              <span className="text-amber-300 font-bold">
                                ★ Rated {ord.buyerRating}/5{" "}
                                {ord.buyerReview ? `— "${ord.buyerReview}"` : ""}
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setRatingOrderId(
                                    ratingOrderId === ord.id ? null : ord.id
                                  );
                                  setRatingStars(5);
                                  setRatingReview("");
                                }}
                                className="text-amber-400 font-bold hover:underline"
                              >
                                ★ Rate Product
                              </button>
                            )}
                          </div>
                          {ratingOrderId === ord.id && (
                            <div className="mt-3 rounded-xl border border-[#1c2f52] bg-[#0a1326] p-3 space-y-2 max-w-md">
                              <div className="flex items-center gap-2 text-xs">
                                <span className="font-bold text-slate-300">Rating:</span>
                                {[1, 2, 3, 4, 5].map((st) => (
                                  <button
                                    key={st}
                                    type="button"
                                    onClick={() => setRatingStars(st)}
                                    className={`px-2 py-0.5 rounded-lg font-bold ${
                                      ratingStars >= st
                                        ? "bg-amber-500 text-slate-950"
                                        : "bg-[#0d182e] text-slate-400"
                                    }`}
                                  >
                                    {st} ★
                                  </button>
                                ))}
                              </div>
                              <input
                                type="text"
                                value={ratingReview}
                                onChange={(e) => setRatingReview(e.target.value)}
                                placeholder="Share your experience with this product..."
                                className="w-full rounded-lg border border-[#1c2f52] bg-[#0d182e] px-2.5 py-1.5 text-xs text-white"
                              />
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => setRatingOrderId(null)}
                                  className="rounded-lg px-2.5 py-1 text-[11px] text-slate-400"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  disabled={ratingSubmitting}
                                  onClick={() => handleSubmitOrderRating(ord.id)}
                                  className="rounded-lg bg-[#34b27b] px-3 py-1 text-[11px] font-bold text-white"
                                >
                                  {ratingSubmitting ? "Saving..." : "Submit Review"}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-extrabold text-[#22c58b]">
                            ₹{ord.totalPaidRupees}
                          </p>
                          {ord.deliveryTaskId && (
                            <Link
                              href={`/dashboard/my-tasks/${ord.deliveryTaskId}`}
                              className="mt-1 inline-block text-xs text-blue-400 underline"
                            >
                              Track Delivery Task →
                            </Link>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Blinkit / Amazon Floating Quick-Cart Bar */}
        {cart.length > 0 && !checkoutProduct && (
          <div className="fixed bottom-5 left-1/2 z-40 -translate-x-1/2 w-[92%] max-w-xl rounded-2xl border border-[#254175] bg-[#0a1326]/95 px-5 py-3.5 shadow-2xl backdrop-blur-md flex items-center justify-between gap-4">
            <div className="text-xs sm:text-sm">
              <p className="font-extrabold text-white">
                🛒 {cart.reduce((s, i) => s + i.quantity, 0)} Item(s) in Cart • ₹{cartTotalRupees}
              </p>
              <p className="text-[11px] text-[#22c58b] truncate max-w-xs sm:max-w-sm">
                {cart
                  .map(
                    (c) =>
                      `${c.product.title}${c.selectedVariant ? ` [${c.selectedVariant}]` : ""} (×${c.quantity})`
                  )
                  .join(", ")}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setCart([])}
                className="rounded-lg border border-[#1e3154] bg-[#0b162c] px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={handleOpenCartCheckout}
                className="rounded-lg bg-[#34b27b] hover:bg-[#2ca16d] px-4 py-2 text-xs font-bold text-white shadow-lg"
              >
                Buy Cart (₹{cartTotalRupees}) →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ORDER CHECKOUT MODAL — Matches Dashboard Detail Modal Style */}
      {checkoutProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm overflow-y-auto"
          onClick={() => setCheckoutProduct(null)}
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-2xl border border-[#1e3156] bg-[#0a1326] shadow-2xl my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-40 w-full bg-[#0d182e]">
              <img
                src={checkoutProduct.image || "/images/helper_task_cleaning.png"}
                alt={checkoutProduct.title}
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => setCheckoutProduct(null)}
                className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-slate-950/75 text-slate-200 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-white">
                    {isCartCheckout
                      ? `Cart Checkout (${cart.reduce((s, i) => s + i.quantity, 0)} Items)`
                      : checkoutProduct.title}
                  </h3>
                  <span className="rounded-md bg-[#0d6e52]/90 px-2 py-0.5 text-[10px] font-semibold text-[#34d399]">
                    Verified
                  </span>
                </div>
                <span className="text-sm font-bold text-emerald-400">
                  ₹{grandTotalRupees}
                </span>
              </div>

              <p className="mt-1 text-xs text-slate-300">
                🏭 {checkoutProduct.seller?.businessName || "Verified Seller"} • 📍{" "}
                {checkoutProduct.seller?.pickupCity || "Meerut"}
              </p>

              {orderResult ? (
                <div className="py-5 space-y-4">
                  <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-xs sm:text-sm text-emerald-200 space-y-2">
                    <p className="text-base font-extrabold text-emerald-300">
                      🎉 Order Placed! ({orderResult.order?.orderNumber})
                    </p>
                    <p>
                      Your order has been confirmed and sent to the seller.
                    </p>
                    <div className="pt-2 border-t border-emerald-500/20 text-xs space-y-1 text-slate-200">
                      <p>
                        • <strong>Total Paid:</strong> ₹
                        {orderResult.splitSummary?.totalCustomerPaidRupees || grandTotalRupees}
                      </p>
                      <p>
                        • <strong>Delivery Address:</strong> {shippingForm.shippingAddress}
                      </p>
                      {orderResult.order?.deliveryOtp && (
                        <p className="text-indigo-300">
                          • <strong>Your 4-Digit Delivery PIN:</strong>{" "}
                          {orderResult.order.deliveryOtp} (Share upon delivery)
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
                      className="rounded-lg bg-[#1d6bf3] px-5 py-2.5 text-xs font-bold text-white"
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

                  {/* Variant Selector inside Buy Modal if Product has Variants */}
                  {!isCartCheckout &&
                    Array.isArray(checkoutProduct.variants) &&
                    checkoutProduct.variants.length > 0 && (
                      <div>
                        <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                          Select Option / Variant
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {checkoutProduct.variants.map((v) => {
                            const isSel = checkoutVariant === v.label;
                            return (
                              <button
                                key={v.label}
                                type="button"
                                onClick={() => setCheckoutVariant(v.label)}
                                className={`rounded-lg px-3 py-1.5 text-xs font-semibold border transition ${
                                  isSel
                                    ? "border-[#2563eb] bg-[#1d6bf3] text-white"
                                    : "border-[#1c2f52] bg-[#0d182e] text-slate-300 hover:text-white"
                                }`}
                              >
                                {v.label} — ₹{v.priceRupees}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                  {/* Quantity & Seller's Configured Delivery Mode */}
                  {!isCartCheckout && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-200 mb-1">
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
                          className="w-full rounded-lg border border-[#1c2f52] bg-[#0d182e] px-3 py-2 text-xs text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-200 mb-1">
                          Fulfillment Speed
                        </label>
                        <div className="w-full rounded-lg border border-[#1c2f52] bg-[#0d182e] px-3 py-2 text-xs font-semibold text-[#22c58b]">
                          {deliveryMode === "PLATFORM_HELPER"
                            ? "⚡ 35–45 Min HireBuddy Delivery"
                            : "📦 Direct Manufacturer Dispatch"}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Shipping Details — Auto-Picked from User Profile by Default */}
                  <div className="rounded-xl border border-[#1c2f52] bg-[#0d182e] p-3.5 text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="inline-flex items-center gap-1 font-bold text-[#22c58b]">
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
                        onClick={() => setEditingShipping((prev) => !prev)}
                        className="rounded-lg border border-[#243860] bg-[#0f1c36] px-2.5 py-1 text-[11px] font-semibold text-blue-300 hover:bg-[#162749]"
                      >
                        {editingShipping ? "Done" : "Change"}
                      </button>
                    </div>

                    {editingShipping && (
                      <div className="mt-3 pt-3 border-t border-[#1c2f52] space-y-2.5">
                        {savedProfileInfo && (
                          <button
                            type="button"
                            onClick={() => {
                              setShippingForm((prev) => ({
                                ...prev,
                                ...savedProfileInfo,
                              }));
                              setEditingShipping(false);
                            }}
                            className="rounded-lg bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 text-[11px] font-bold text-emerald-300"
                          >
                            ↺ Reset to Saved Profile Phone &amp; Address
                          </button>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                              Your Name
                            </label>
                            <input
                              type="text"
                              required
                              value={shippingForm.customerName}
                              onChange={(e) =>
                                setShippingForm({
                                  ...shippingForm,
                                  customerName: e.target.value,
                                })
                              }
                              placeholder="Full Name"
                              className="w-full rounded-lg border border-[#1c2f52] bg-[#0a1326] px-3 py-1.5 text-xs text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                              Mobile Number
                            </label>
                            <input
                              type="text"
                              required
                              value={shippingForm.customerPhone}
                              onChange={(e) =>
                                setShippingForm({
                                  ...shippingForm,
                                  customerPhone: e.target.value,
                                })
                              }
                              placeholder="10-digit mobile number"
                              className="w-full rounded-lg border border-[#1c2f52] bg-[#0a1326] px-3 py-1.5 text-xs text-white"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-300 mb-1">
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
                            className="w-full rounded-lg border border-[#1c2f52] bg-[#0a1326] px-3 py-1.5 text-xs text-white"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Customer Order Price Summary */}
                  <div className="rounded-xl border border-[#1c2f52] bg-[#0d182e] p-3.5 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-slate-300">
                      <span>
                        {isCartCheckout
                          ? `Cart Items (${cart.reduce((s, i) => s + i.quantity, 0)})`
                          : `Item Price (₹${unitPriceRupees} × ${quantity} ${checkoutProduct.unit || "unit"})`}
                      </span>
                      <span className="font-bold text-white">₹{subtotalRupees}</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-400">
                      <span>
                        Delivery (
                        {deliveryMode === "PLATFORM_HELPER"
                          ? "HireBuddy Partner"
                          : "Manufacturer Direct"}
                        )
                      </span>
                      <span className="text-[#22c58b] font-semibold">Included</span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[#1c2f52] text-sm font-extrabold text-white">
                      <span>Total Payable</span>
                      <span className="text-[#22c58b]">₹{grandTotalRupees}</span>
                    </div>
                  </div>

                  {/* Modal Action Buttons — Matches Dashboard Modal Buttons */}
                  <div className="mt-4 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setCheckoutProduct(null)}
                      className="flex-1 rounded-lg border border-[#243860] bg-[#0f1c36] py-2.5 text-center text-xs font-semibold text-slate-200 hover:bg-[#162749]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={orderSubmitting}
                      className="flex-1 rounded-lg bg-[#2fa97c] py-2.5 text-center text-xs font-semibold text-white hover:bg-[#27946b] disabled:opacity-50"
                    >
                      {orderSubmitting
                        ? "Processing..."
                        : `Pay ₹${grandTotalRupees} & Buy`}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (isInsideDashboardLayout) {
    return dashboardBody;
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#060d1d] text-slate-100">
      <HeaderAfterlogin
        searchValue={searchQuery}
        onSearchChange={(val) => setSearchQuery(val)}
        onSearchClear={() => setSearchQuery("")}
      />
      <main className="flex-1 pt-16">{dashboardBody}</main>
      <Footer />
    </div>
  );
}

/* ---------- Dashboard-Matched Subcomponents ---------- */

function getCategoryIconType(category = "") {
  const c = String(category).toLowerCase();
  if (c.includes("saree") || c.includes("fashion") || c.includes("handloom") || c.includes("textile"))
    return "saree";
  if (c.includes("gift") || c.includes("hamper")) return "gift";
  if (c.includes("food") || c.includes("sweet") || c.includes("gajak")) return "food";
  if (c.includes("sport") || c.includes("cricket")) return "sports";
  if (c.includes("scissor") || c.includes("hardware")) return "hardware";
  if (c.includes("brass") || c.includes("decor") || c.includes("home")) return "brass";
  return "default";
}

function ProductCategoryBadge({ type }) {
  switch (type) {
    case "saree":
      return (
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ec4899] text-white shadow-md border-2 border-[#0b1528]">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        </div>
      );
    case "gift":
      return (
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#6366f1] text-white shadow-md border-2 border-[#0b1528]">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
          </svg>
        </div>
      );
    case "food":
      return (
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#d97706] text-white shadow-md border-2 border-[#0b1528]">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.701 2.701 0 00-1.5-.454M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M21 21v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7h18z" />
          </svg>
        </div>
      );
    case "sports":
      return (
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#34b27b] text-white shadow-md border-2 border-[#0b1528]">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
      );
    case "hardware":
    case "brass":
    default:
      return (
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2563eb] text-white shadow-md border-2 border-[#0b1528]">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
      );
  }
}

function CategorySidebarIcon({ type }) {
  switch (type) {
    case "all":
      return (
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M4 6a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm0 8a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4z" />
        </svg>
      );
    case "saree":
      return (
        <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l2.4 7.2h7.6l-6 4.8 2.4 7.2-6.4-4.8-6.4 4.8 2.4-7.2-6-4.8h7.6z" />
        </svg>
      );
    case "gift":
      return (
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      );
    case "food":
      return (
        <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z" />
        </svg>
      );
    case "sports":
      return (
        <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M7 2v11h3v9l7-12h-4l4-8z" />
        </svg>
      );
    default:
      return (
        <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="6" cy="12" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="18" cy="12" r="2" />
        </svg>
      );
  }
}
