"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import Header from "../components/layout/Header";
import HeaderAfterlogin from "../components/layout/HeaderAfterlogin";
import Footer from "../components/layout/Footer";
import {
  onboardSeller,
  getSellerDashboard,
  addSellerProduct,
  addSellerService,
  updateSellerService,
  updateMarketplaceOrderStatus,
} from "../components/services/marketplace.service";

const MEERUT_MANUFACTURER_CATEGORIES = [
  "Sarees, Lehengas & Ethnic Fashion",
  "Gifts, Hampers & Festive Boxes",
  "Food, Sweets & Groceries (FSSAI)",
  "Handloom, Home Textiles & Furnishings",
  "Home, Kitchen, Brassware & Decor",
  "Electronics & Mobile Accessories",
  "Beauty, Wellness & Personal Care",
  "Sports Goods (Cricket Bats, Balls, Gym)",
  "Cutlery & Scissors (GI Tagged Meerut Scissors)",
  "General Retail, Toys, Books & Custom Items",
];

const SERVICE_SELLER_CATEGORIES = [
  "Laundry & Dry Cleaning",
  "Shoe, Sneaker & Bag Spa",
  "Car Wash & Detailing",
  "Home, Sofa & Carpet Deep Cleaning",
  "Salon, Grooming & Personal Care",
  "Appliance Repair & AC Servicing",
  "Tailoring, Boutique & Alteration",
  "Pest Control & Sanitization",
  "Custom Local Service",
];

const SELLER_PRODUCT_CATEGORIES = [
  "Sarees & Ethnic Wear",
  "Gifts & Hampers",
  "Fashion & Apparel",
  "Food & Sweets (FSSAI)",
  "Handloom & Textiles",
  "Home, Kitchen & Decor",
  "Brassware & Handicrafts",
  "Electronics & Accessories",
  "Beauty & Personal Care",
  "Sports Goods",
  "Scissors & Hardware",
  "General & Custom Items",
];

const SERVICE_TYPE_CATALOG = [
  { label: "Dry Cleaning", slug: "dry-cleaning", defaultUnit: "piece", presetKey: "dry-cleaning" },
  {
    label: "Laundry (Wash, Dry & Fold)",
    slug: "laundry-wash-fold",
    defaultUnit: "kg",
    presetKey: "laundry-wash-fold",
  },
  { label: "Steam Ironing", slug: "steam-ironing", defaultUnit: "piece", presetKey: "steam-ironing" },
  {
    label: "Shoe Cleaning",
    slug: "shoe-cleaning",
    defaultUnit: "pair",
    presetKey: "shoe-cleaning",
  },
  {
    label: "Bag, Suitcase & Wallet Cleaning",
    slug: "bag-cleaning",
    defaultUnit: "piece",
    presetKey: "bag-cleaning",
  },
  {
    label: "Sofa, Carpet & Curtain Cleaning",
    slug: "sofa-carpet-cleaning",
    defaultUnit: "seat",
    presetKey: "custom",
  },
  { label: "✨ Custom Service (Create Your Own)", slug: "custom", defaultUnit: "piece", presetKey: "custom" },
];

const SERVICE_TURNAROUND_OPTIONS = [
  "Same Day Express",
  "24 Hours Express",
  "24–48 Hours",
  "48 Hours",
  "48–72 Hours",
  "3–5 Working Days",
];

const SERVICE_UNIT_OPTIONS = ["piece", "kg", "set", "pair", "panel", "seat", "sqft", "visit"];

const SERVICE_OPTION_GROUPS = [
  "Men's Wear",
  "Women's Wear",
  "Woolen & Winter",
  "Household & Bedding",
  "By Weight (Kg)",
  "Footwear & Sneakers",
  "Bags & Luggage",
  "General",
];

const PRESET_SERVICE_OPTIONS = {
  "dry-cleaning": [
    { groupName: "Men's Wear", title: "Shirt / T-Shirt", unit: "piece", priceRupees: 99 },
    { groupName: "Men's Wear", title: "Trouser / Jeans", unit: "piece", priceRupees: 99 },
    { groupName: "Men's Wear", title: "Kurta Pajama (Set)", unit: "set", priceRupees: 210 },
    { groupName: "Men's Wear", title: "Coat / Blazer", unit: "piece", priceRupees: 229 },
    { groupName: "Men's Wear", title: "2-Pc Suit", unit: "set", priceRupees: 299 },
    { groupName: "Men's Wear", title: "3-Pc Suit", unit: "set", priceRupees: 449 },
    { groupName: "Women's Wear", title: "Kurti / Top", unit: "piece", priceRupees: 99 },
    { groupName: "Women's Wear", title: "Saree (Cotton / Plain)", unit: "piece", priceRupees: 169 },
    { groupName: "Women's Wear", title: "Saree (Silk / Heavy Work)", unit: "piece", priceRupees: 299 },
    { groupName: "Women's Wear", title: "Lehenga / Heavy Dress", unit: "set", priceRupees: 549 },
    { groupName: "Woolen & Winter", title: "Sweater / Cardigan", unit: "piece", priceRupees: 149 },
    { groupName: "Woolen & Winter", title: "Jacket / Overcoat", unit: "piece", priceRupees: 249 },
    { groupName: "Household & Bedding", title: "Blanket / Quilt (Single)", unit: "piece", priceRupees: 299 },
    { groupName: "Household & Bedding", title: "Blanket / Quilt (Double)", unit: "piece", priceRupees: 399 },
    { groupName: "Household & Bedding", title: "Curtain Panel", unit: "panel", priceRupees: 149 },
  ],
  "laundry-wash-fold": [
    { groupName: "By Weight (Kg)", title: "Wash, Dry & Fold", unit: "kg", priceRupees: 130 },
    { groupName: "By Weight (Kg)", title: "Wash, Dry & Steam Iron", unit: "kg", priceRupees: 160 },
    { groupName: "By Weight (Kg)", title: "Premium Laundry + Softener", unit: "kg", priceRupees: 225 },
  ],
  "steam-ironing": [
    { groupName: "Men's Wear", title: "Shirt / Trouser Steam Press", unit: "piece", priceRupees: 25 },
    { groupName: "Men's Wear", title: "2-Pc Suit Steam Press", unit: "set", priceRupees: 90 },
    { groupName: "Women's Wear", title: "Saree / Heavy Dress Steam Press", unit: "piece", priceRupees: 60 },
  ],
  "shoe-cleaning": [
    { groupName: "Footwear & Sneakers", title: "Sports / Canvas Shoes", unit: "pair", priceRupees: 299 },
    { groupName: "Footwear & Sneakers", title: "Leather / Suede Shoes", unit: "pair", priceRupees: 399 },
    { groupName: "Footwear & Sneakers", title: "Designer / Boots Spa", unit: "pair", priceRupees: 499 },
  ],
  "bag-cleaning": [
    { groupName: "Bags & Luggage", title: "Handbag / Backpack", unit: "piece", priceRupees: 299 },
    { groupName: "Bags & Luggage", title: "Trolley / Suitcase", unit: "piece", priceRupees: 449 },
  ],
  custom: [
    { groupName: "General", title: "Standard Service Option", unit: "piece", priceRupees: 149 },
  ],
};

const PRODUCT_ORDER_STATUS_OPTIONS = [
  { value: "CONFIRMED", label: "CONFIRMED — Order Confirmed" },
  { value: "PACKED", label: "PACKED — Packed & Ready" },
  { value: "OUT_FOR_DELIVERY", label: "OUT_FOR_DELIVERY — Out for Delivery" },
  { value: "DELIVERED", label: "DELIVERED — Delivered" },
];

const SERVICE_ORDER_STATUS_OPTIONS = [
  { value: "CONFIRMED", label: "CONFIRMED — Booking Confirmed" },
  { value: "PICKED_UP", label: "PICKED_UP — Picked Up from Customer" },
  { value: "IN_PROCESS", label: "IN_PROCESS — In Process (Dry Clean / Service)" },
  { value: "READY_FOR_DELIVERY", label: "READY_FOR_DELIVERY — Ready for Delivery" },
  { value: "OUT_FOR_DELIVERY", label: "OUT_FOR_DELIVERY — Out for Drop-off" },
  { value: "DELIVERED", label: "DELIVERED — Completed & Delivered" },
];

export default function SellerOnboardingAndHubPage() {
  const { data: session, status } = useSession();
  const [hasToken, setHasToken] = useState(false);
  const [activeTab, setActiveTab] = useState("onboarding"); // "onboarding" | "products" | "orders"
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [bannerMsg, setBannerMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const syncAuth = () => {
      try {
        setHasToken(Boolean(localStorage.getItem("token")));
      } catch {
        setHasToken(false);
      }
    };
    syncAuth();
    window.addEventListener("storage", syncAuth);
    window.addEventListener("userProfileUpdated", syncAuth);
    return () => {
      window.removeEventListener("storage", syncAuth);
      window.removeEventListener("userProfileUpdated", syncAuth);
    };
  }, []);

  const isAuthenticated =
    hasToken || (status === "authenticated" && Boolean(session?.user));

  const [sellerProfile, setSellerProfile] = useState(null);
  const [products, setProducts] = useState([]);
  const [services, setServices] = useState([]);
  const [orders, setOrders] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [taxInvoiceOrder, setTaxInvoiceOrder] = useState(null);

  // Step 1: Seller Onboarding Form (Supports both PRODUCT Sellers & SERVICE Sellers)
  const [kycForm, setKycForm] = useState({
    sellerType: "PRODUCT",
    businessName: "",
    businessCategory: "Sports Goods (Cricket Bats, Balls, Gym)",
    contactPersonName: "",
    contactPersonPhone: "",
    storeBannerUrl: "",
    rateCardDocUrl: "",
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

  // Step 2A: Physical Product Form (for PRODUCT Sellers)
  const [productForm, setProductForm] = useState({
    title: "",
    category: "Sarees & Ethnic Wear",
    description: "",
    priceRupees: "",
    mrpRupees: "",
    stock: 25,
    unit: "piece",
    minOrderQty: 1,
    image: "/images/helper_task_furniture.png",
    variants: [],
    highlights: "",
    deliveryByPlatform: false,
  });

  // Step 2B: Service & Multi-Option Rate Card Form (for SERVICE Sellers like Dry Cleaners)
  const [editingServiceId, setEditingServiceId] = useState(null);
  const [serviceTypeChoice, setServiceTypeChoice] = useState("Dry Cleaning");
  const [serviceForm, setServiceForm] = useState({
    name: "Dry Cleaning",
    category: "Laundry & Dry Cleaning",
    description:
      "Professional garment dry cleaning, stain treatment & steam press. Select items below as per your requirement.",
    unit: "piece",
    turnaroundLabel: "24–48 Hours",
    imageUrl: "/images/wash_o_dry_banner.jpeg",
    highlights: "Eco-Friendly Solvent Cleaning, Crisp Steam Press, Doorstep Pickup & Drop",
    deliveryByPlatform: true,
    options: PRESET_SERVICE_OPTIONS["dry-cleaning"].map((o) => ({ ...o })),
  });

  const loadDashboard = useCallback(async () => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const nextAuthReady =
      status === "authenticated" && Boolean(session?.user);

    if (!token && !nextAuthReady) {
      setSellerProfile(null);
      setProducts([]);
      setServices([]);
      setOrders([]);
      setSettlements([]);
      setMetrics(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await getSellerDashboard();
      if (res?.profile) {
        setSellerProfile(res.profile);
        setProducts(res.products || []);
        setServices(res.services || []);
        setOrders(res.orders || []);
        setSettlements(res.settlements || []);
        setMetrics(res.metrics || null);

        try {
          const prevStored = JSON.parse(localStorage.getItem("user") || "{}");
          if (
            prevStored?.sellerType !== res.profile.sellerType ||
            prevStored?.role !== "SELLER"
          ) {
            localStorage.setItem(
              "user",
              JSON.stringify({
                ...prevStored,
                role: "SELLER",
                sellerType: res.profile.sellerType || "PRODUCT",
                sellerProfile: {
                  id: res.profile.id,
                  sellerType: res.profile.sellerType || "PRODUCT",
                  businessName: res.profile.businessName,
                },
              })
            );
            window.dispatchEvent(new Event("userProfileUpdated"));
          }
        } catch {}

        setKycForm((prev) => ({
          ...prev,
          sellerType: res.profile.sellerType || prev.sellerType || "PRODUCT",
          businessName: res.profile.businessName || "",
          businessCategory:
            res.profile.businessCategory ||
            (res.profile.sellerType === "SERVICE"
              ? "Laundry & Dry Cleaning"
              : prev.businessCategory),
          contactPersonName: res.profile.contactPersonName || "",
          contactPersonPhone: res.profile.contactPersonPhone || "",
          storeBannerUrl: res.profile.storeBannerUrl || "",
          rateCardDocUrl: res.profile.rateCardDocUrl || "",
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
    } catch {
      // User may not be logged in or not onboarded yet
    } finally {
      setLoading(false);
    }
  }, [session, status]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const effectiveSellerType =
    kycForm.sellerType || sellerProfile?.sellerType || "PRODUCT";
  const isServiceSeller = effectiveSellerType === "SERVICE";

  const handleSellerTypeChange = (nextType) => {
    setKycForm((prev) => {
      const nextCategory =
        nextType === "SERVICE"
          ? SERVICE_SELLER_CATEGORIES.includes(prev.businessCategory)
            ? prev.businessCategory
            : "Laundry & Dry Cleaning"
          : MEERUT_MANUFACTURER_CATEGORIES.includes(prev.businessCategory)
            ? prev.businessCategory
            : "Sports Goods (Cricket Bats, Balls, Gym)";
      return {
        ...prev,
        sellerType: nextType,
        businessCategory: nextCategory,
      };
    });
  };

  const handleServiceTypeDropdownChange = (selectedLabel) => {
    setServiceTypeChoice(selectedLabel);
    const matched = SERVICE_TYPE_CATALOG.find((item) => item.label === selectedLabel);
    if (!matched) return;
    if (matched.slug === "custom") {
      setServiceForm((prev) => ({
        ...prev,
        name: "",
        unit: "piece",
        options:
          prev.options && prev.options.length > 0
            ? prev.options
            : [{ groupName: "General", title: "", unit: "piece", priceRupees: 149 }],
      }));
      return;
    }
    const presetOpts = PRESET_SERVICE_OPTIONS[matched.presetKey] || PRESET_SERVICE_OPTIONS.custom;
    setServiceForm((prev) => ({
      ...prev,
      name: matched.label,
      unit: matched.defaultUnit,
      options: editingServiceId ? prev.options : presetOpts.map((o) => ({ ...o })),
    }));
  };

  const handleLoadServicePreset = (presetKey) => {
    const preset = PRESET_SERVICE_OPTIONS[presetKey] || PRESET_SERVICE_OPTIONS.custom;
    setServiceForm((prev) => ({
      ...prev,
      options: preset.map((o) => ({ ...o })),
    }));
  };

  const handleEditExistingService = (svc) => {
    setEditingServiceId(svc.id);
    const catalogHit = SERVICE_TYPE_CATALOG.find(
      (c) => c.label.toLowerCase() === (svc.name || "").toLowerCase()
    );
    setServiceTypeChoice(
      catalogHit ? catalogHit.label : "✨ Custom Service (Create Your Own)"
    );
    setServiceForm({
      name: svc.name || "",
      category: svc.category || "Laundry & Dry Cleaning",
      description: svc.description || "",
      unit: svc.unit || "piece",
      turnaroundLabel: svc.turnaroundLabel || "24–48 Hours",
      imageUrl: svc.image || "/images/wash_o_dry_banner.jpeg",
      highlights: Array.isArray(svc.highlights) ? svc.highlights.join(", ") : "",
      deliveryByPlatform: Boolean(svc.deliveryByPlatform),
      options: (svc.options || []).map((opt) => ({
        id: opt.id,
        groupName: opt.groupName || "General",
        title: opt.title || "",
        unit: opt.unit || svc.unit || "piece",
        priceRupees: opt.priceRupees ?? Math.round((opt.pricePaise || 0) / 100),
      })),
    });
    setBannerMsg(`Editing "${svc.name}" — adjust your option rates below and click Save.`);
    setErrorMsg("");
  };

  const resetServiceForm = () => {
    setEditingServiceId(null);
    setServiceTypeChoice("Dry Cleaning");
    setServiceForm({
      name: "Dry Cleaning",
      category: kycForm.businessCategory || "Laundry & Dry Cleaning",
      description:
        "Professional garment dry cleaning, stain treatment & steam press. Select items below as per your requirement.",
      unit: "piece",
      turnaroundLabel: "24–48 Hours",
      imageUrl: sellerProfile?.storeBannerUrl || "/images/wash_o_dry_banner.jpeg",
      highlights: "Eco-Friendly Solvent Cleaning, Crisp Steam Press, Doorstep Pickup & Drop",
      deliveryByPlatform: true,
      options: PRESET_SERVICE_OPTIONS["dry-cleaning"].map((o) => ({ ...o })),
    });
  };

  const handleSaveSellerService = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setErrorMsg("Please log in first to create or update your services.");
      return;
    }
    const validOptions = (serviceForm.options || []).filter(
      (o) => String(o.title || "").trim() && Number(o.priceRupees) > 0
    );
    if (validOptions.length === 0) {
      setErrorMsg("Please add at least one service option with a valid rate (₹).");
      return;
    }

    setSubmitting(true);
    setBannerMsg("");
    setErrorMsg("");

    try {
      const payload = {
        name: serviceForm.name,
        category: serviceForm.category,
        description: serviceForm.description,
        unit: serviceForm.unit,
        turnaroundLabel: serviceForm.turnaroundLabel,
        imageUrl: serviceForm.imageUrl,
        highlights: serviceForm.highlights,
        allowPlatformDelivery: serviceForm.deliveryByPlatform,
        defaultDeliveryMode: serviceForm.deliveryByPlatform
          ? "PLATFORM_HELPER"
          : "SELLER_SELF",
        options: validOptions.map((o) => ({
          id: o.id,
          groupName: o.groupName || "General",
          title: String(o.title).trim(),
          unit: o.unit || serviceForm.unit || "piece",
          priceRupees: Number(o.priceRupees),
        })),
      };

      if (editingServiceId) {
        await updateSellerService(editingServiceId, payload);
        setBannerMsg(
          `✅ Service "${serviceForm.name}" & your option rates updated immediately!`
        );
      } else {
        const res = await addSellerService(payload);
        setBannerMsg(
          res?.service?.status === "PUBLISHED"
            ? `✅ Service "${serviceForm.name}" published live! Customers can now choose your options & rates.`
            : `✅ Service "${serviceForm.name}" submitted for Admin verification!`
        );
      }
      resetServiceForm();
      await loadDashboard();
    } catch (err) {
      setErrorMsg(err?.message || "Failed to save service & rate card.");
    } finally {
      setSubmitting(false);
    }
  };

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
              "Ansal Town Centre / Modipuram, Meerut, UP",
          }));
          setBannerMsg("📍 GPS Pickup Coordinates captured for Buddy Pickup & Delivery tasks!");
        },
        () => {
          setKycForm((prev) => ({
            ...prev,
            pickupAddress:
              prev.pickupAddress || "Modipuram / Suraj Kund Road, Meerut, UP",
          }));
        }
      );
    }
  };

  const handleSubmitOnboarding = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setErrorMsg("Please log in or create an account first to submit your Seller KYC.");
      return;
    }
    setSubmitting(true);
    setBannerMsg("");
    setErrorMsg("");

    try {
      const res = await onboardSeller(kycForm);
      setBannerMsg(
        res?.message ||
          `Seller profile saved as ${
            kycForm.sellerType === "SERVICE" ? "Service Seller" : "Product Seller"
          }! Admin has been notified.`
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
    if (!isAuthenticated) {
      setErrorMsg("Please log in first to add products to your seller storefront.");
      return;
    }
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
        category: "Sarees & Ethnic Wear",
        description: "",
        priceRupees: "",
        mrpRupees: "",
        stock: 25,
        unit: "piece",
        minOrderQty: 1,
        image: "/images/helper_task_furniture.png",
        variants: [],
        highlights: "",
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
      setBannerMsg(`Order status updated to ${nextStatus.replace(/_/g, " ")}`);
      loadDashboard();
    } catch (err) {
      setErrorMsg(err?.message || "Failed to update order status");
    }
  };

  const isFoodCategory =
    !isServiceSeller && kycForm.businessCategory.toLowerCase().includes("food");

  return (
    <div className="min-h-screen bg-[#050b18] text-slate-100 flex flex-col">
      {isAuthenticated ? <HeaderAfterlogin /> : <Header />}

      <main className={`flex-1 ${isAuthenticated ? "pt-20" : "pt-6"} pb-16`}>
        <div className="mx-auto max-w-[1320px] px-4 sm:px-6">
          {!isAuthenticated && status !== "loading" && (
            <div className="mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-5 py-3.5 text-xs sm:text-sm font-medium text-amber-300">
              <span>
                You are browsing as a guest. Sign in or create an account to register as a{" "}
                <strong className="font-bold">Product Seller</strong> or{" "}
                <strong className="font-bold">Service Seller</strong>.
              </span>
              <div className="flex items-center gap-2.5 shrink-0">
                <Link
                  href="/login"
                  className="rounded-xl bg-[#1361f5] hover:bg-blue-600 px-4 py-2 text-xs font-bold text-white transition"
                >
                  Log In
                </Link>
                <Link
                  href="/signup"
                  className="rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 px-4 py-2 text-xs font-bold text-white transition"
                >
                  Create Account
                </Link>
              </div>
            </div>
          )}

          {/* Header Banner */}
          <div className="rounded-3xl border border-[#192d52] bg-gradient-to-r from-[#08152d] via-[#0b1f42] to-[#061527] p-6 sm:p-8 shadow-2xl">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-3 py-0.5 text-xs font-bold border ${
                      isServiceSeller
                        ? "border-cyan-500/40 bg-cyan-500/15 text-cyan-300"
                        : "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                    }`}
                  >
                    {isServiceSeller
                      ? "🧺 Verified Service Partner Hub"
                      : "🏭 Meerut Manufacturers & Product Seller Hub"}
                  </span>
                  {sellerProfile && (
                    <>
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
                      <span className="rounded-full border border-blue-500/40 bg-blue-500/15 px-3 py-0.5 text-xs font-bold text-blue-300">
                        Admin Commission: {sellerProfile.commissionPct ?? 15}% • Direct Seller Share:{" "}
                        {100 - (sellerProfile.commissionPct ?? 15)}%
                      </span>
                    </>
                  )}
                </div>

                <h1 className="mt-2.5 text-2xl sm:text-3xl font-extrabold text-white">
                  {sellerProfile?.businessName ||
                    (isServiceSeller
                      ? "Service Partner Onboarding & Rate Card Hub"
                      : "Meerut Manufacturer Onboarding & Seller Portal")}
                </h1>
                <p className="mt-1.5 text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
                  {isServiceSeller ? (
                    <>
                      Create your own services (e.g., <strong>Dry Cleaning</strong>,{" "}
                      <strong>Laundry</strong>, <strong>Shoe Spa</strong>, or custom services) and
                      decide your own per-option rates. Multiple verified sellers can offer the same
                      service—customers pick their preferred seller &amp; options, and your share
                      (80%–90%) settles daily via <strong>NEFT / Direct Split</strong>.
                    </>
                  ) : (
                    <>
                      Sell physical products directly to customers across Meerut &amp; India.
                      Products are verified &amp; published by Admin with a configurable{" "}
                      <strong>10%–20% platform commission</strong>. Your seller share (80%–90%) is
                      settled daily via <strong>NEFT / Direct Split</strong>.
                    </>
                  )}
                </p>
              </div>

              <div className="flex flex-wrap gap-2.5 shrink-0">
                <Link
                  href={isServiceSeller ? "/marketplace?mode=services" : "/marketplace"}
                  className="rounded-xl border border-[#223966] bg-[#0b1730] hover:bg-[#122449] px-4 py-2.5 text-xs font-bold text-slate-200 transition"
                >
                  {isServiceSeller ? "🧺 View Live Services Storefront" : "🛍️ View Live Storefront"}
                </Link>
              </div>
            </div>

            {/* Metrics Bar */}
            {metrics && (
              <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5 border-t border-[#172a4f]">
                <div className="rounded-2xl border border-[#1a3058] bg-[#071022] p-3.5">
                  <p className="text-[11px] text-slate-400">
                    {isServiceSeller ? "Published Services" : "Published Products"}
                  </p>
                  <p className="text-xl font-extrabold text-white mt-0.5">
                    {isServiceSeller
                      ? `${metrics.publishedServicesCount ?? services.length} / ${
                          metrics.totalServices ?? services.length
                        }`
                      : `${metrics.publishedProductsCount} / ${metrics.totalProducts}`}
                  </p>
                </div>
                <div className="rounded-2xl border border-[#1a3058] bg-[#071022] p-3.5">
                  <p className="text-[11px] text-slate-400">Pending Admin Approval</p>
                  <p className="text-xl font-extrabold text-amber-400 mt-0.5">
                    {isServiceSeller
                      ? metrics.pendingServicesCount ?? 0
                      : metrics.pendingProductsCount}
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
                1. Seller Type, KYC, Pickup Point &amp; Bank (NEFT)
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
                {isServiceSeller
                  ? `2. Create Services & Option Rate Cards (${services.length})`
                  : `2. Add Products (Admin Verified & Published) (${products.length})`}
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
                {isServiceSeller
                  ? `3. Service Bookings, Status & Daily NEFT (${orders.length})`
                  : `3. Orders, Split Payouts & Daily NEFT (${orders.length})`}
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
              TAB 1: SELLER ONBOARDING (SELLER TYPE, KYC, PICKUP, BANK NEFT)
             ============================================================== */}
          {activeTab === "onboarding" && (
            <form
              onSubmit={handleSubmitOnboarding}
              className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              {/* Left Column: Seller Type, Business, Contact Person & Pickup Point */}
              <div className="min-w-0 overflow-hidden rounded-2xl border border-[#17294d] bg-[#081225] p-6 space-y-4">
                <h2 className="text-base font-bold text-white border-b border-[#152544] pb-3">
                  {isServiceSeller
                    ? "🧺 Service Partner Profile, Store & Pickup Hub"
                    : "🏭 Product Seller Business, Contact & Pickup Point"}
                </h2>

                {/* Seller Type Dropdown */}
                <div className="min-w-0">
                  <label className="block text-xs font-semibold text-cyan-300 mb-1">
                    Seller Type (What do you sell?) *
                  </label>
                  <select
                    value={kycForm.sellerType}
                    onChange={(e) => handleSellerTypeChange(e.target.value)}
                    className="block w-full min-w-0 max-w-full truncate rounded-xl border border-cyan-500/40 bg-[#0b1730] px-3.5 py-2.5 text-sm font-semibold text-white"
                  >
                    <option value="PRODUCT">
                      🏭 Product Seller — Sell Physical Goods (Sarees, Sports, Food, Retail)
                    </option>
                    <option value="SERVICE">
                      🧺 Service Seller — Sell Services (Dry Clean, Laundry, Shoe Spa, Repair)
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {isServiceSeller
                      ? "Service Brand / Shop Name *"
                      : "Manufacturer / Business Name *"}
                  </label>
                  <input
                    type="text"
                    required
                    value={kycForm.businessName}
                    onChange={(e) =>
                      setKycForm({ ...kycForm, businessName: e.target.value })
                    }
                    placeholder={
                      isServiceSeller
                        ? "e.g. Wash O Dry — Laundry | Dry Clean"
                        : "e.g. Meerut Sports & Gajak Manufacturers Pvt. Ltd."
                    }
                    className="w-full rounded-xl border border-[#223966] bg-[#0b1730] px-3.5 py-2.5 text-sm text-white"
                  />
                </div>

                <div className="min-w-0">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {isServiceSeller ? "Primary Service Category *" : "Manufacturing Category *"}
                  </label>
                  <select
                    value={kycForm.businessCategory}
                    onChange={(e) =>
                      setKycForm({ ...kycForm, businessCategory: e.target.value })
                    }
                    className="block w-full min-w-0 max-w-full truncate rounded-xl border border-[#223966] bg-[#0b1730] px-3.5 py-2.5 text-sm text-white"
                  >
                    {(isServiceSeller
                      ? SERVICE_SELLER_CATEGORIES
                      : MEERUT_MANUFACTURER_CATEGORIES
                    ).map((c) => (
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
                      placeholder={isServiceSeller ? "Store Manager / Owner" : "Dispatch Manager / Owner"}
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
                      {isServiceSeller
                        ? "Shop / Processing Hub Address (Meerut) *"
                        : "Factory / Warehouse Pickup Address (Meerut) *"}
                    </label>
                    <button
                      type="button"
                      onClick={handleUseGpsPickup}
                      className="text-[11px] font-bold text-blue-400 hover:underline"
                    >
                      📍 Detect GPS Point
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    required
                    value={kycForm.pickupAddress}
                    onChange={(e) =>
                      setKycForm({ ...kycForm, pickupAddress: e.target.value })
                    }
                    placeholder="Full Shop / Hub Address for Customer Drop or 2% HireBuddy Pickup Partner"
                    className="w-full rounded-xl border border-[#223966] bg-[#0b1730] px-3.5 py-2 text-xs text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      City
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

              {/* Right Column: Compliance Documents & Bank Account for Daily NEFT */}
              <div className="space-y-6">
                <div className="rounded-2xl border border-[#17294d] bg-[#081225] p-6 space-y-4">
                  <h2 className="text-base font-bold text-white border-b border-[#152544] pb-3">
                    📜 Document Verification ({isServiceSeller ? "GSTIN, PAN, Shop/MSME" : "FSSAI, GSTIN, PAN, MSME"})
                  </h2>

                  {isServiceSeller ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Store Banner Image URL (Optional)
                        </label>
                        <input
                          type="text"
                          value={kycForm.storeBannerUrl}
                          onChange={(e) =>
                            setKycForm({ ...kycForm, storeBannerUrl: e.target.value })
                          }
                          placeholder="/images/wash_o_dry_banner.jpeg"
                          className="w-full rounded-xl border border-[#223966] bg-[#0b1730] px-3.5 py-2 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Printed Rate Card Image URL (Optional)
                        </label>
                        <input
                          type="text"
                          value={kycForm.rateCardDocUrl}
                          onChange={(e) =>
                            setKycForm({ ...kycForm, rateCardDocUrl: e.target.value })
                          }
                          placeholder="/images/wash_o_dry_ratecard.jpeg"
                          className="w-full rounded-xl border border-[#223966] bg-[#0b1730] px-3.5 py-2 text-xs text-white"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-amber-300 mb-1">
                          FSSAI License No.{" "}
                          {isFoodCategory ? "* (Required for Food)" : "(For Food/Sweets)"}
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
                  )}

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
                        MSME / Shop Reg.
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
                      : `Save ${
                          isServiceSeller ? "Service Seller" : "Product Seller"
                        } Profile & Submit for Verification`}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* ==============================================================
              TAB 2A (SERVICE SELLER): CREATE SERVICES & MULTI-OPTION RATE CARDS
             ============================================================== */}
          {activeTab === "products" && isServiceSeller && (
            <div className="mt-6 grid grid-cols-1 lg:grid-cols-[minmax(0,520px)_minmax(0,1fr)] gap-6">
              {/* Left: Create / Edit Service + Option Rate Card */}
              <form
                onSubmit={handleSaveSellerService}
                className="min-w-0 overflow-hidden rounded-2xl border border-[#17294d] bg-[#081225] p-5 sm:p-6 space-y-4 self-start"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="text-base font-bold text-white">
                      {editingServiceId
                        ? `✏️ Edit Service & Option Rates`
                        : "🧺 Create Your Service & Option Rate Card"}
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Choose a standard service (like <strong>Dry Cleaning</strong> so customers can
                      compare sellers) or create any custom service, and set your own option rates!
                    </p>
                  </div>
                  {editingServiceId && (
                    <button
                      type="button"
                      onClick={resetServiceForm}
                      className="rounded-lg border border-[#223966] bg-[#0b1730] px-2.5 py-1 text-[11px] font-bold text-slate-200 hover:bg-[#122449] shrink-0"
                    >
                      + New Service
                    </button>
                  )}
                </div>

                {/* Service Type Dropdown */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="min-w-0">
                    <label className="block text-xs font-semibold text-cyan-300 mb-1">
                      Select Service Type *
                    </label>
                    <select
                      value={serviceTypeChoice}
                      onChange={(e) => handleServiceTypeDropdownChange(e.target.value)}
                      className="block w-full min-w-0 max-w-full truncate rounded-xl border border-[#223966] bg-[#0b1730] px-3 py-2 text-xs text-white"
                    >
                      {SERVICE_TYPE_CATALOG.map((item) => (
                        <option key={item.label} value={item.label}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="min-w-0">
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Service Display Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={serviceForm.name}
                      onChange={(e) =>
                        setServiceForm({ ...serviceForm, name: e.target.value })
                      }
                      placeholder="e.g. Dry Cleaning / Curtain Spa"
                      className="block w-full min-w-0 rounded-xl border border-[#223966] bg-[#0b1730] px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>

                {/* Category, Turnaround & Default Unit Dropdowns */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="min-w-0">
                    <label className="block text-xs font-semibold text-slate-300 mb-1 truncate">
                      Service Category *
                    </label>
                    <select
                      value={serviceForm.category}
                      onChange={(e) =>
                        setServiceForm({ ...serviceForm, category: e.target.value })
                      }
                      className="block w-full min-w-0 max-w-full truncate rounded-xl border border-[#223966] bg-[#0b1730] px-2.5 py-2 text-xs text-white"
                    >
                      {SERVICE_SELLER_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="min-w-0">
                    <label className="block text-xs font-semibold text-slate-300 mb-1 truncate">
                      Turnaround Time *
                    </label>
                    <select
                      value={serviceForm.turnaroundLabel}
                      onChange={(e) =>
                        setServiceForm({ ...serviceForm, turnaroundLabel: e.target.value })
                      }
                      className="block w-full min-w-0 max-w-full truncate rounded-xl border border-[#223966] bg-[#0b1730] px-2.5 py-2 text-xs text-white"
                    >
                      {SERVICE_TURNAROUND_OPTIONS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="min-w-0">
                    <label className="block text-xs font-semibold text-slate-300 mb-1 truncate">
                      Default Unit
                    </label>
                    <select
                      value={serviceForm.unit}
                      onChange={(e) =>
                        setServiceForm({ ...serviceForm, unit: e.target.value })
                      }
                      className="block w-full min-w-0 max-w-full truncate rounded-xl border border-[#223966] bg-[#0b1730] px-2.5 py-2 text-xs text-white"
                    >
                      {SERVICE_UNIT_OPTIONS.map((u) => (
                        <option key={u} value={u}>
                          per {u}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="min-w-0">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Service Description *
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={serviceForm.description}
                    onChange={(e) =>
                      setServiceForm({ ...serviceForm, description: e.target.value })
                    }
                    placeholder="Describe your cleaning process, stain care, express pickup/delivery..."
                    className="block w-full min-w-0 rounded-xl border border-[#223966] bg-[#0b1730] px-3.5 py-2 text-xs text-white"
                  />
                </div>

                {/* Multi-Option Rate Card Builder */}
                <div className="min-w-0 overflow-hidden rounded-2xl border border-[#1c325c] bg-[#050c1a] p-3.5 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-cyan-300 block">
                        📋 Customer Selectable Options &amp; Your Rates (₹)
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Customers can pick multiple options &amp; quantities from this list.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setServiceForm((prev) => ({
                          ...prev,
                          options: [
                            ...(prev.options || []),
                            {
                              groupName: "Men's Wear",
                              title: "",
                              unit: prev.unit || "piece",
                              priceRupees: 99,
                            },
                          ],
                        }))
                      }
                      className="rounded-lg bg-cyan-600 hover:bg-cyan-500 px-3 py-1.5 text-[11px] font-bold text-white shadow-sm transition shrink-0"
                    >
                      + Add Option
                    </button>
                  </div>

                  {/* Quick Preset Loader Pills */}
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleLoadServicePreset("dry-cleaning")}
                      className="rounded-lg border border-[#223966] bg-[#0b1730] hover:bg-[#122449] px-2.5 py-1 text-[11px] font-semibold text-slate-200 transition"
                    >
                      Load Dry Clean Items
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLoadServicePreset("laundry-wash-fold")}
                      className="rounded-lg border border-[#223966] bg-[#0b1730] hover:bg-[#122449] px-2.5 py-1 text-[11px] font-semibold text-slate-200 transition"
                    >
                      Load Laundry (Kg)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLoadServicePreset("shoe-cleaning")}
                      className="rounded-lg border border-[#223966] bg-[#0b1730] hover:bg-[#122449] px-2.5 py-1 text-[11px] font-semibold text-slate-200 transition"
                    >
                      Load Shoe Spa
                    </button>
                  </div>

                  <div className="max-h-[340px] overflow-y-auto overflow-x-hidden space-y-2.5 pr-1">
                    {(serviceForm.options || []).map((opt, idx) => (
                      <div
                        key={opt.id || idx}
                        className="min-w-0 overflow-hidden rounded-xl border border-[#1c325c] bg-[#081225] p-2.5 space-y-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <input
                            type="text"
                            required
                            value={opt.title}
                            onChange={(e) => {
                              const next = [...serviceForm.options];
                              next[idx] = { ...next[idx], title: e.target.value };
                              setServiceForm({ ...serviceForm, options: next });
                            }}
                            placeholder="Option Name (e.g. Shirt / 2-Pc Suit / Saree)"
                            className="flex-1 min-w-0 rounded-lg border border-[#223966] bg-[#0b1730] px-2.5 py-1.5 text-xs font-semibold text-white"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setServiceForm((prev) => ({
                                ...prev,
                                options: prev.options.filter((_, i) => i !== idx),
                              }))
                            }
                            className="shrink-0 h-7 w-7 flex items-center justify-center rounded-lg border border-rose-500/40 bg-rose-500/15 hover:bg-rose-500/25 text-xs font-bold text-rose-400 transition"
                            title="Remove option"
                          >
                            ✕
                          </button>
                        </div>

                        <div className="grid grid-cols-[minmax(0,1.3fr)_minmax(0,0.85fr)_minmax(0,0.85fr)] gap-2">
                          <div className="min-w-0">
                            <select
                              value={opt.groupName || "General"}
                              onChange={(e) => {
                                const next = [...serviceForm.options];
                                next[idx] = { ...next[idx], groupName: e.target.value };
                                setServiceForm({ ...serviceForm, options: next });
                              }}
                              className="block w-full min-w-0 max-w-full truncate rounded-lg border border-[#223966] bg-[#0b1730] px-2 py-1.5 text-[11px] font-medium text-slate-200"
                            >
                              {SERVICE_OPTION_GROUPS.map((grp) => (
                                <option key={grp} value={grp}>
                                  {grp}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="min-w-0">
                            <select
                              value={opt.unit || "piece"}
                              onChange={(e) => {
                                const next = [...serviceForm.options];
                                next[idx] = { ...next[idx], unit: e.target.value };
                                setServiceForm({ ...serviceForm, options: next });
                              }}
                              className="block w-full min-w-0 max-w-full truncate rounded-lg border border-[#223966] bg-[#0b1730] px-2 py-1.5 text-[11px] font-medium text-slate-200"
                            >
                              {SERVICE_UNIT_OPTIONS.map((u) => (
                                <option key={u} value={u}>
                                  per {u}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="relative min-w-0">
                            <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-emerald-400 font-bold">
                              ₹
                            </span>
                            <input
                              type="number"
                              min="1"
                              required
                              value={opt.priceRupees}
                              onChange={(e) => {
                                const next = [...serviceForm.options];
                                next[idx] = { ...next[idx], priceRupees: e.target.value };
                                setServiceForm({ ...serviceForm, options: next });
                              }}
                              className="block w-full min-w-0 rounded-lg border border-[#223966] bg-[#0b1730] pl-6 pr-2 py-1.5 text-xs font-bold text-emerald-400"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pickup & Delivery Logistics Selector */}
                <div className="min-w-0 space-y-2">
                  <label className="block text-xs font-semibold text-slate-300">
                    Pickup &amp; Drop Logistics Mode *
                  </label>
                  <select
                    value={serviceForm.deliveryByPlatform ? "PLATFORM_HELPER" : "SELLER_SELF"}
                    onChange={(e) =>
                      setServiceForm({
                        ...serviceForm,
                        deliveryByPlatform: e.target.value === "PLATFORM_HELPER",
                      })
                    }
                    className="block w-full min-w-0 max-w-full truncate rounded-xl border border-[#223966] bg-[#0b1730] px-3 py-2.5 text-xs text-white"
                  >
                    <option value="PLATFORM_HELPER">
                      🚚 HireBuddy Doorstep Pickup &amp; Drop (+2% Auto-Created Buddy Task)
                    </option>
                    <option value="SELLER_SELF">
                      🏪 Seller Own Rider / Store Walk-in Pickup &amp; Drop (₹0 Buddy Fee)
                    </option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-xl bg-[#1361f5] hover:bg-blue-600 py-3 text-xs font-bold text-white shadow-lg transition disabled:opacity-50"
                >
                  {submitting
                    ? "Saving Service & Rate Card..."
                    : editingServiceId
                      ? "💾 Save Updated Service & Option Rates"
                      : "🚀 Publish / Submit Service & Option Rate Card"}
                </button>
              </form>

              {/* Right: Seller's Existing Services & Rate Cards */}
              <div className="min-w-0 rounded-2xl border border-[#17294d] bg-[#081225] p-6">
                <div className="flex items-center justify-between gap-2 mb-4">
                  <h2 className="text-base font-bold text-white">
                    My Services &amp; Option Rate Cards ({services.length})
                  </h2>
                  <Link
                    href="/marketplace/services/dry-cleaning"
                    className="text-xs font-bold text-cyan-400 hover:underline"
                  >
                    Preview Customer Multi-Seller View →
                  </Link>
                </div>

                {services.length === 0 ? (
                  <p className="text-xs text-slate-400">
                    No services created yet. Use the Service &amp; Rate Card builder on the left to
                    create your first service (e.g., Dry Cleaning).
                  </p>
                ) : (
                  <div className="space-y-4">
                    {services.map((svc) => {
                      const commPct = Number(
                        sellerProfile?.commissionPct ?? svc.commissionPct ?? 15
                      );
                      return (
                        <div
                          key={svc.id}
                          className="rounded-2xl border border-[#1c325c] bg-[#050c1a] p-4 space-y-3"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-extrabold text-white">
                                  {svc.name}
                                </span>
                                <span
                                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                    svc.approvalStatus === "PUBLISHED"
                                      ? "bg-emerald-500/20 text-emerald-300"
                                      : "bg-amber-500/20 text-amber-300"
                                  }`}
                                >
                                  {svc.approvalStatus}
                                </span>
                                <span className="rounded-full bg-cyan-500/15 px-2.5 py-0.5 text-[10px] font-semibold text-cyan-300">
                                  ⏱ {svc.turnaroundLabel || "24–48 Hours"}
                                </span>
                                <span className="rounded-full bg-blue-500/15 px-2.5 py-0.5 text-[10px] font-semibold text-blue-300">
                                  Comm: {commPct}% • You Keep:{" "}
                                  {100 - commPct - (svc.deliveryByPlatform ? 2 : 0)}%
                                </span>
                              </div>
                              <p className="mt-1 text-xs text-slate-400">
                                Category: {svc.category} • Shared Group:{" "}
                                <code className="rounded bg-slate-800 px-1.5 py-0.5 text-[11px] font-semibold text-slate-200">
                                  {svc.serviceSlug}
                                </code>{" "}
                                • {svc.optionsCount || (svc.options || []).length} Options • Starting
                                ₹{svc.priceRupees}/{svc.unit}
                              </p>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleEditExistingService(svc)}
                                className="rounded-xl border border-cyan-500/40 bg-cyan-500/15 hover:bg-cyan-500/25 px-3 py-1.5 text-xs font-bold text-cyan-300 transition"
                              >
                                ✏️ Edit Options &amp; Rates
                              </button>
                              <Link
                                href={`/marketplace/services/${svc.serviceSlug}?sellerId=${
                                  sellerProfile?.id || ""
                                }`}
                                className="rounded-xl border border-[#223966] bg-[#0b1730] hover:bg-[#122449] px-3 py-1.5 text-xs font-bold text-slate-200 transition"
                              >
                                View
                              </Link>
                            </div>
                          </div>

                          {/* Preview of seller's option rates */}
                          <div className="flex flex-wrap gap-1.5 pt-2.5 border-t border-slate-800/80">
                            {(svc.options || []).slice(0, 10).map((opt) => (
                              <span
                                key={opt.id}
                                className="rounded-lg border border-[#223966] bg-[#0b1730] px-2.5 py-1 text-[11px] font-medium text-slate-200"
                              >
                                {opt.title}:{" "}
                                <strong className="font-bold text-emerald-400">
                                  ₹{opt.priceRupees}
                                </strong>
                                <span className="text-slate-400">/{opt.unit}</span>
                              </span>
                            ))}
                            {(svc.options || []).length > 10 && (
                              <span className="rounded-lg border border-[#223966] bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-300">
                                +{(svc.options || []).length - 10} more options
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==============================================================
              TAB 2B (PRODUCT SELLER): PHYSICAL PRODUCT ADDITION FLOW
             ============================================================== */}
          {activeTab === "products" && !isServiceSeller && (
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
                    Every product is reviewed by Admin, assigned a 10%–20% platform commission, and
                    published to the Meerut Marketplace.
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
                      Category (Select or Type) *
                    </label>
                    <input
                      list="seller-product-categories-list"
                      required
                      value={productForm.category}
                      onChange={(e) =>
                        setProductForm({ ...productForm, category: e.target.value })
                      }
                      placeholder="e.g. Sarees, Gifts, Sports..."
                      className="w-full rounded-xl border border-[#223966] bg-[#0b1730] px-3 py-2 text-xs text-white"
                    />
                    <datalist id="seller-product-categories-list">
                      {SELLER_PRODUCT_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat} />
                      ))}
                    </datalist>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Unit (e.g. saree, piece, kg)
                    </label>
                    <input
                      type="text"
                      value={productForm.unit}
                      onChange={(e) =>
                        setProductForm({ ...productForm, unit: e.target.value })
                      }
                      placeholder="piece / saree / gift box"
                      className="w-full rounded-xl border border-[#223966] bg-[#0b1730] px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Product Photo (Upload Image or Paste URL)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = () => {
                          if (typeof reader.result === "string") {
                            setProductForm((prev) => ({ ...prev, image: reader.result }));
                          }
                        };
                        reader.readAsDataURL(file);
                      }}
                      className="w-full rounded-xl border border-[#223966] bg-[#0b1730] px-2.5 py-1.5 text-[11px] text-slate-300 file:mr-2 file:rounded-lg file:border-0 file:bg-blue-600 file:px-2.5 file:py-1 file:text-[11px] file:font-bold file:text-white"
                    />
                    <input
                      type="text"
                      value={productForm.image}
                      onChange={(e) =>
                        setProductForm({ ...productForm, image: e.target.value })
                      }
                      placeholder="/images/... or https://..."
                      className="w-full rounded-xl border border-[#223966] bg-[#0b1730] px-3 py-1.5 text-xs text-white"
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

                {/* Optional Product Variants */}
                <div className="rounded-xl border border-[#1d325c] bg-[#060f20] p-3 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300">
                      🎨 Color / Size / Weight Variants (Optional)
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setProductForm((prev) => ({
                          ...prev,
                          variants: [
                            ...(prev.variants || []),
                            {
                              label: "",
                              priceRupees: prev.priceRupees || "",
                              stock: 15,
                            },
                          ],
                        }))
                      }
                      className="rounded-lg bg-blue-600/25 border border-blue-500/40 px-2.5 py-1 text-[11px] font-bold text-blue-300 hover:bg-blue-600/40"
                    >
                      + Add Variant
                    </button>
                  </div>

                  {Array.isArray(productForm.variants) &&
                    productForm.variants.length > 0 && (
                      <div className="space-y-2">
                        {productForm.variants.map((v, idx) => (
                          <div key={idx} className="grid grid-cols-[1fr_90px_32px] gap-2 items-center">
                            <input
                              type="text"
                              value={v.label}
                              onChange={(e) => {
                                const next = [...productForm.variants];
                                next[idx] = { ...next[idx], label: e.target.value };
                                setProductForm({ ...productForm, variants: next });
                              }}
                              placeholder="e.g. Crimson Red / 1 Kg Box / XL"
                              className="rounded-lg border border-[#223966] bg-[#0b1730] px-2.5 py-1.5 text-xs text-white"
                            />
                            <input
                              type="number"
                              value={v.priceRupees}
                              onChange={(e) => {
                                const next = [...productForm.variants];
                                next[idx] = { ...next[idx], priceRupees: e.target.value };
                                setProductForm({ ...productForm, variants: next });
                              }}
                              placeholder="₹ Price"
                              className="rounded-lg border border-[#223966] bg-[#0b1730] px-2.5 py-1.5 text-xs text-white"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setProductForm((prev) => ({
                                  ...prev,
                                  variants: prev.variants.filter((_, i) => i !== idx),
                                }))
                              }
                              className="rounded-lg border border-rose-500/40 bg-rose-500/15 py-1.5 text-xs font-bold text-rose-300"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                </div>

                {/* Seller Delivery Option Selector */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-300">
                    Delivery Option (How will this product be delivered?) *
                  </label>
                  <select
                    value={productForm.deliveryByPlatform ? "PLATFORM_HELPER" : "SELLER_SELF"}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        deliveryByPlatform: e.target.value === "PLATFORM_HELPER",
                      })
                    }
                    className="w-full rounded-xl border border-[#223966] bg-[#0b1730] px-3 py-2.5 text-xs text-white"
                  >
                    <option value="SELLER_SELF">
                      🏭 Deliver by Myself (Seller Self-Delivery — ₹0 Fee)
                    </option>
                    <option value="PLATFORM_HELPER">
                      🚚 Need HireBuddy Delivery Help (+2% Auto-Task for Buddy)
                    </option>
                  </select>
                </div>

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
                    No products added yet. Use the form on the left to submit your first Meerut
                    factory product.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {products.map((p) => {
                      const priceRs = p.priceRupees || Math.round((p.price || 0) / 100);
                      const commPct = Number(
                        sellerProfile?.commissionPct ?? p.commissionPct ?? 15
                      );
                      const commRs = Math.round((priceRs * commPct) / 100);
                      const delivRs = p.deliveryByPlatform ? Math.round(priceRs * 0.02) : 0;
                      const sellerNetRs = Math.max(0, priceRs - commRs - delivRs);

                      return (
                        <div
                          key={p.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-[#1c325c] bg-[#050c1a] p-4"
                        >
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-bold text-white">{p.title}</span>
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
                                Platform Commission: {commPct}% • Seller Portion: ₹{sellerNetRs}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-slate-400">
                              Category: {p.category} • Stock: {p.stock} {p.unit} •{" "}
                              {p.deliveryByPlatform
                                ? `🚚 HireBuddy Delivery (+2% = ₹${delivRs})`
                                : "🏭 Seller Self-Delivery"}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-base font-extrabold text-emerald-400">
                              ₹{priceRs}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              You receive: ₹{sellerNetRs}/{p.unit}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==============================================================
              TAB 3: ORDERS / SERVICE BOOKINGS, STATUS DROPDOWN & DAILY NEFT
             ============================================================== */}
          {activeTab === "orders" && (
            <div className="mt-6 space-y-6">
              <div className="rounded-2xl border border-[#17294d] bg-[#081225] p-6">
                <h2 className="text-base font-bold text-white mb-4">
                  {isServiceSeller
                    ? `Customer Service Bookings & Portion-Wise Split (${orders.length})`
                    : `Customer Orders & Portion-Wise Payment Split (${orders.length})`}
                </h2>

                {orders.length === 0 ? (
                  <p className="text-xs text-slate-400">
                    No customer {isServiceSeller ? "service bookings" : "orders"} received yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {orders.map((ord) => {
                      const isSvcOrder =
                        ord.orderType === "SERVICE" || isServiceSeller;
                      const statusDropdownOptions = isSvcOrder
                        ? SERVICE_ORDER_STATUS_OPTIONS
                        : PRODUCT_ORDER_STATUS_OPTIONS;

                      return (
                        <div
                          key={ord.id}
                          className="rounded-2xl border border-[#1c325c] bg-[#050c1a] p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                        >
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-bold text-white">
                                {ord.orderNumber}
                              </span>
                              <span
                                className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                  isSvcOrder
                                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                                    : "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                                }`}
                              >
                                {isSvcOrder ? "🧺 SERVICE BOOKING" : "📦 PRODUCT ORDER"}
                              </span>
                              <span className="rounded-full bg-blue-500/20 px-2.5 py-0.5 text-[10px] font-bold text-blue-300">
                                {ord.orderStatusLabel || ord.orderStatus}
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
                                  🔑 Pickup OTP: {ord.pickupOtp}
                                </span>
                              )}
                            </div>

                            <p className="mt-1 text-xs text-slate-300">
                              Customer: <strong>{ord.customerName}</strong> ({ord.customerPhone}) •{" "}
                              {isSvcOrder ? "Pickup/Drop Address" : "Address"}:{" "}
                              {ord.shippingAddress}
                              {ord.pickupTimeSlot ? (
                                <span className="ml-2 text-cyan-300 font-semibold">
                                  • Slot: {ord.pickupTimeSlot}
                                </span>
                              ) : null}
                            </p>

                            {/* Selected Options / Line Items Summary */}
                            {Array.isArray(ord.items) && ord.items.length > 0 && (
                              <div className="mt-1.5 flex flex-wrap gap-1.5">
                                {ord.items.map((it) => (
                                  <span
                                    key={it.id}
                                    className="rounded-lg border border-[#223966] bg-[#0b1730] px-2.5 py-0.5 text-[11px] font-medium text-slate-200"
                                  >
                                    {it.quantity} × {it.productName}
                                    {it.selectedVariant ? ` (${it.selectedVariant})` : ""}
                                  </span>
                                ))}
                              </div>
                            )}

                            <div className="mt-2 flex flex-wrap gap-4 text-xs">
                              <span className="text-slate-400">
                                {isSvcOrder ? "Service Total:" : "Product Total:"}{" "}
                                <strong>₹{ord.productSubtotalRupees}</strong>
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
                                  (ord.taxBreakdown?.gstTcs0_5PctRupees ??
                                    Number(((ord.productSubtotalRupees || 0) * 0.005).toFixed(2))) +
                                  (ord.taxBreakdown?.tds194O_0_1PctRupees ??
                                    Number(((ord.productSubtotalRupees || 0) * 0.001).toFixed(2)))
                                ).toFixed(2)}
                              </span>
                              {ord.deliveryFeeRupees > 0 && (
                                <span className="text-amber-300">
                                  +2% Buddy {isSvcOrder ? "Pickup & Drop" : "Delivery"} Task: ₹
                                  {ord.deliveryFeeRupees}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 shrink-0 max-w-full">
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
                              className="min-w-0 max-w-full sm:max-w-[270px] truncate rounded-xl border border-[#223966] bg-[#0b1730] px-3 py-2 text-xs font-semibold text-white"
                            >
                              {!statusDropdownOptions.some(
                                (opt) => opt.value === ord.orderStatus
                              ) && (
                                <option value={ord.orderStatus}>{ord.orderStatus}</option>
                              )}
                              {statusDropdownOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      );
                    })}
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
                    Daily NEFT batches are processed every evening by Admin directly into your
                    verified bank account.
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

      {/* TAX & SETTLEMENT BREAKDOWN INVOICE MODAL */}
      {taxInvoiceOrder &&
        (() => {
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
          const isSvcOrd = taxInvoiceOrder.orderType === "SERVICE" || isServiceSeller;

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
              <div className="w-full max-w-lg rounded-3xl border border-[#223966] bg-[#081226] p-6 shadow-2xl">
                <div className="flex items-start justify-between gap-3 border-b border-[#162749] pb-4">
                  <div>
                    <span className="rounded-full bg-indigo-500/20 px-2.5 py-0.5 text-[10px] font-bold text-indigo-300 border border-indigo-500/30">
                      SAC 998599 • E-Commerce Tax &amp; Settlement Statement
                    </span>
                    <h3 className="mt-1.5 text-lg font-extrabold text-white">
                      {isSvcOrd ? "Booking" : "Order"} {taxInvoiceOrder.orderNumber} — Breakdown
                    </h3>
                    <p className="text-xs text-slate-400">
                      Seller: {sellerProfile?.businessName || "Verified Seller"} • GSTIN:{" "}
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
                    <span>
                      1. Gross {isSvcOrd ? "Service" : "Product"} Value (Taxable Base)
                    </span>
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
                      <span>HireBuddy Partner Logistics (+2%)</span>
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
                    Pickup PIN: <strong className="text-amber-300">{taxInvoiceOrder.pickupOtp}</strong> •
                    Delivery PIN:{" "}
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
