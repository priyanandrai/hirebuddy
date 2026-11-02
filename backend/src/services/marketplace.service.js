import prisma from "../utils/prisma.js";
import { sendNotification, notificationEvents } from "./notification.service.js";
import { emitToUser, emitBroadcast } from "../config/socket.config.js";

/**
 * Helper: Find or create the Platform Admin user so auto-created 2% delivery tasks
 * and admin notifications are always attributed to Admin.
 */
export const getOrCreatePlatformAdminUser = async () => {
  let admin = await prisma.user.findFirst({
    where: {
      OR: [
        { email: "admin@hirebuddy.com" },
        { role: "ADMIN" },
      ],
    },
  });

  if (!admin) {
    admin = await prisma.user.create({
      data: {
        name: "HireBuddy Admin",
        email: "admin@hirebuddy.com",
        phone: "9999900001",
        role: "ADMIN",
        city: "Meerut",
        address: "HireBuddy Operations Hub, Modipuram, Meerut",
        idVerificationStatus: "VERIFIED",
      },
    });
  }

  return admin;
};

/**
 * Seed initial verified Meerut Manufacturer & published products if DB has none yet
 */
let seededCheckDone = false;
export const ensureInitialMeerutMarketplace = async () => {
  if (seededCheckDone) return;
  try {
    const existingCount = await prisma.product.count();
    if (existingCount > 0) {
      seededCheckDone = true;
      return;
    }

    let sellerUser = await prisma.user.findFirst({
      where: { email: "meerut.manufacturers@hirebuddy.com" },
    });

    if (!sellerUser) {
      sellerUser = await prisma.user.create({
        data: {
          name: "Meerut Heritage Manufacturers Co.",
          email: "meerut.manufacturers@hirebuddy.com",
          phone: "9897011223",
          role: "SELLER",
          city: "Meerut",
          address: "Suraj Kund Road & Industrial Area, Meerut, UP",
          idVerificationStatus: "VERIFIED",
        },
      });
    }

    let sellerProfile = await prisma.sellerProfile.findUnique({
      where: { userId: sellerUser.id },
    });

    if (!sellerProfile) {
      sellerProfile = await prisma.sellerProfile.create({
        data: {
          userId: sellerUser.id,
          businessName: "Meerut Heritage Crafts, Sports & Foods Mfg.",
          businessCategory: "Sports Goods, Scissors, Gajak & Handloom",
          contactPersonName: "Rajeshwar Agarwal",
          contactPersonPhone: "9897011223",
          contactEmail: "meerut.manufacturers@hirebuddy.com",
          pickupAddress: "Plot 14, Sports Complex & Suraj Kund Road, Meerut, UP",
          pickupCity: "Meerut",
          pickupPincode: "250002",
          pickupLatitude: 28.9845,
          pickupLongitude: 77.7064,
          gstNumber: "09AABCM1234F1Z5",
          fssaiNumber: "12724055000421",
          panNumber: "AABCM1234F",
          msmeNumber: "UDYAM-UP-55-0019283",
          bankAccountHolder: "Meerut Heritage Crafts Pvt Ltd",
          bankAccountNumber: "50200048291044",
          bankIfscCode: "HDFC0000254",
          bankName: "HDFC Bank",
          bankBranch: "Garh Road, Meerut",
          bankVerified: true,
          verificationStatus: "VERIFIED",
          verifiedAt: new Date(),
        },
      });
    }

    const sampleProducts = [
      {
        name: "Meerut Grade-1 English Willow Cricket Bat (Full Size SH)",
        slug: "meerut-grade-1-english-willow-cricket-bat",
        description:
          "Handcrafted in Suraj Kund, Meerut by master batmakers. Naturally air-dried Grade-1 willow with 9-11 straight grains, Sarawak cane handle, and toe guard.",
        category: "Sports Goods",
        images: ["/images/service_furniture.png"],
        pricePaise: 450000, // ₹4,500
        mrpPaise: 599900,
        stock: 40,
        unit: "bat",
        minOrderQty: 1,
        commissionRate: 15.0,
        status: "PUBLISHED",
        defaultDeliveryMode: "PLATFORM_HELPER",
        approvedAt: new Date(),
        approvedByAdmin: "HireBuddy Admin",
      },
      {
        name: "Meerut Shahi Til-Gur & Pistachio Gajak Gift Box (1 Kg - FSSAI Certified)",
        slug: "meerut-shahi-til-gur-gajak-1kg",
        description:
          "Authentic GI-famous Meerut flaky Til-Gur Gajak prepared with organic jaggery, roasted sesame seeds, and desi ghee. Freshly packed from our FSSAI-certified unit.",
        category: "Food & Sweets (FSSAI)",
        images: ["/images/helper_task_cooking.png"],
        pricePaise: 55000, // ₹550
        mrpPaise: 68000,
        stock: 150,
        unit: "1 kg box",
        minOrderQty: 1,
        commissionRate: 12.0,
        status: "PUBLISHED",
        defaultDeliveryMode: "PLATFORM_HELPER",
        approvedAt: new Date(),
        approvedByAdmin: "HireBuddy Admin",
      },
      {
        name: "Meerut GI-Tagged Forged Tailoring & Fabric Scissors (10-Inch Brass Handle)",
        slug: "meerut-gi-forged-tailoring-scissors-10-inch",
        description:
          "Precision-forged high-carbon steel blades with ergonomic solid brass handle from Meerut's 300-year-old scissor cluster. Ideal for boutiques, factories, and home use.",
        category: "Scissors & Hardware",
        images: ["/images/service_electrical.png"],
        pricePaise: 65000, // ₹650
        mrpPaise: 85000,
        stock: 85,
        unit: "pair",
        minOrderQty: 1,
        commissionRate: 15.0,
        status: "PUBLISHED",
        defaultDeliveryMode: "SELLER_SELF",
        approvedAt: new Date(),
        approvedByAdmin: "HireBuddy Admin",
      },
      {
        name: "Meerut Professional 4-Piece Alum Tanned Leather Cricket Ball (Box of 6)",
        slug: "meerut-professional-leather-cricket-ball-box-6",
        description:
          "Tournament-grade 156g 4-piece alum-tanned leather cricket balls with Portuguese cork core and hand-stitched 80-stitch seam, manufactured directly in Meerut.",
        category: "Sports Goods",
        images: ["/images/service_delivery.png"],
        pricePaise: 240000, // ₹2,400
        mrpPaise: 300000,
        stock: 60,
        unit: "box of 6",
        minOrderQty: 1,
        commissionRate: 15.0,
        status: "PUBLISHED",
        defaultDeliveryMode: "PLATFORM_HELPER",
        approvedAt: new Date(),
        approvedByAdmin: "HireBuddy Admin",
      },
      {
        name: "Meerut Handloom Pure Cotton Jacquard Bedsheet Set (King Size + 2 Pillow Covers)",
        slug: "meerut-handloom-cotton-bedsheet-king",
        description:
          "Woven by Meerut handloom artisans with 300 TC breathable combed cotton and fast reactive dyes. Factory-direct pricing.",
        category: "Handloom & Textiles",
        images: ["/images/helper_task_cleaning.png"],
        pricePaise: 125000, // ₹1,250
        mrpPaise: 179900,
        stock: 90,
        unit: "set",
        minOrderQty: 1,
        commissionRate: 18.0,
        status: "PUBLISHED",
        defaultDeliveryMode: "PLATFORM_HELPER",
        approvedAt: new Date(),
        approvedByAdmin: "HireBuddy Admin",
      },
      {
        name: "Meerut Artisanal Engraved Brass Puja Thali & Akhand Diya Set (7-Piece)",
        slug: "meerut-engraved-brass-puja-thali-set",
        description:
          "Heavy-gauge pure virgin brass puja thali set crafted in Meerut metalwork cluster. Includes thali, akhand diya, bell, kalash, and katori.",
        category: "Brassware & Handicrafts",
        images: ["/images/helper_task_plumbing.png"],
        pricePaise: 160000, // ₹1,600
        mrpPaise: 220000,
        stock: 45,
        unit: "set",
        minOrderQty: 1,
        commissionRate: 15.0,
        status: "PUBLISHED",
        defaultDeliveryMode: "SELLER_SELF",
        approvedAt: new Date(),
        approvedByAdmin: "HireBuddy Admin",
      },
    ];

    for (const prod of sampleProducts) {
      await prisma.product.upsert({
        where: { slug: prod.slug },
        update: {},
        create: {
          ...prod,
          sellerId: sellerProfile.id,
        },
      });
    }

    seededCheckDone = true;
  } catch (err) {
    console.warn("ensureInitialMeerutMarketplace warning:", err?.message);
  }
};

const normalizeSellerProfile = (s) => {
  if (!s) return null;
  return {
    ...s,
    contactPhone: s.contactPersonPhone,
    gstin: s.gstNumber,
    bankAccountName: s.bankAccountHolder,
    bankIfsc: s.bankIfscCode,
    bankVerificationStatus: s.bankVerified ? "VERIFIED" : "PENDING",
    settlementPreference: "DAILY_NEFT",
  };
};

const normalizeProduct = (p) => {
  if (!p) return null;
  const priceRupees = Math.round((p.pricePaise || 0) / 100);
  const mrpRupees = p.mrpPaise ? Math.round(p.mrpPaise / 100) : priceRupees;
  const imagesArr = Array.isArray(p.images) ? p.images : [];
  return {
    ...p,
    title: p.name,
    price: priceRupees,
    priceRupees,
    mrp: mrpRupees,
    mrpRupees,
    image: imagesArr[0] || "/images/service_delivery.png",
    commissionPct: p.commissionRate,
    approvalStatus: p.status,
    isPublished: p.status === "PUBLISHED",
    deliveryByPlatform: p.defaultDeliveryMode === "PLATFORM_HELPER",
    allowPlatformDelivery: p.defaultDeliveryMode === "PLATFORM_HELPER",
    seller: p.seller ? normalizeSellerProfile(p.seller) : undefined,
  };
};

const normalizeOrder = (o) => {
  if (!o) return null;
  const productSubtotalRupees = Math.round((o.productSubtotalPaise || 0) / 100);
  const sellerPayableRupees = Math.round((o.sellerPayablePaise || 0) / 100);
  const platformCommissionRupees = Math.round((o.platformCommissionPaise || 0) / 100);
  const deliveryFeeRupees = Math.round((o.deliveryFeePaise || 0) / 100);
  const totalPaidRupees = Math.round((o.totalPaidPaise || 0) / 100);
  return {
    ...o,
    shippingAddress: o.shippingAddress || o.deliveryAddress,
    customerName: o.shippingName || o.customer?.name || "Customer",
    customerPhone: o.shippingPhone || o.customer?.phone || "",
    productSubtotalRupees,
    sellerPayableRupees,
    platformCommissionRupees,
    deliveryFeeRupees,
    totalPaidRupees,
    neftUtrNumber: o.settlementUtr,
    // Admin MarketplacePage Rupee aliases
    subtotal: productSubtotalRupees,
    platformCommissionTotal: platformCommissionRupees,
    sellerPayoutTotal: sellerPayableRupees,
    deliveryFee: deliveryFeeRupees,
    totalAmount: totalPaidRupees,
    seller: o.seller ? normalizeSellerProfile(o.seller) : undefined,
  };
};

const normalizeSettlementBatch = (b) => {
  if (!b) return null;
  const totalAmountRupees = Math.round((b.netPayablePaise || 0) / 100);
  return {
    ...b,
    utrNumber: b.neftUtrNumber,
    ordersCount: b.totalOrdersCount,
    orderCount: b.totalOrdersCount,
    payoutMethod: "DAILY_NEFT",
    totalAmountRupees,
    totalSellerPayout: totalAmountRupees,
    seller: b.seller ? normalizeSellerProfile(b.seller) : undefined,
  };
};

/**
 * Onboard or update Seller Profile (KYC Documents, FSSAI, GST, PAN, Pickup Point, Contact Person, Bank Account)
 */
export const onboardOrUpdateSeller = async (userId, data) => {
  const {
    businessName,
    businessCategory,
    contactPersonName,
    contactPersonPhone: rawPhone,
    contactPhone,
    contactEmail,
    pickupAddress,
    pickupCity = "Meerut",
    pickupPincode,
    pickupLatitude,
    pickupLongitude,
    gstNumber: rawGst,
    gstin,
    gstDocUrl,
    fssaiNumber,
    fssaiDocUrl,
    panNumber,
    panDocUrl,
    msmeNumber,
    msmeDocUrl,
    otherLicenseName,
    otherLicenseUrl,
    bankAccountHolder: rawHolder,
    bankAccountName,
    bankAccountNumber,
    bankIfscCode: rawIfsc,
    bankIfsc,
    bankName,
    bankBranch,
    cancelledChequeUrl,
    razorpayAccountId,
  } = data;

  const contactPersonPhone = rawPhone || contactPhone;
  const gstNumber = rawGst || gstin;
  const bankAccountHolder = rawHolder || bankAccountName || businessName;
  const bankIfscCode = rawIfsc || bankIfsc;

  if (!businessName || !contactPersonName || !contactPersonPhone || !pickupAddress || !panNumber || !bankAccountNumber || !bankIfscCode) {
    throw new Error(
      "Business Name, Contact Person, Pickup Address, PAN Number, and Bank Account + IFSC details are required for Seller Onboarding."
    );
  }

  // If category is Food / Consumables, ensure FSSAI number is provided
  const isFoodCategory =
    String(businessCategory || "").toLowerCase().includes("food") ||
    String(businessCategory || "").toLowerCase().includes("sweet") ||
    String(businessCategory || "").toLowerCase().includes("gajak") ||
    String(businessCategory || "").toLowerCase().includes("bakery");

  if (isFoodCategory && !fssaiNumber) {
    throw new Error(
      "FSSAI License Number is mandatory for Food, Gajak, Sweets & Consumable manufacturers."
    );
  }

  const existingProfile = await prisma.sellerProfile.findUnique({
    where: { userId },
  });

  const payload = {
    businessName: String(businessName).trim(),
    businessCategory: String(businessCategory || "General Manufacturing").trim(),
    contactPersonName: String(contactPersonName).trim(),
    contactPersonPhone: String(contactPersonPhone).trim(),
    contactEmail: contactEmail ? String(contactEmail).trim() : null,
    pickupAddress: String(pickupAddress).trim(),
    pickupCity: String(pickupCity || "Meerut").trim(),
    pickupPincode: String(pickupPincode || "250001").trim(),
    pickupLatitude: pickupLatitude ? parseFloat(pickupLatitude) : null,
    pickupLongitude: pickupLongitude ? parseFloat(pickupLongitude) : null,
    gstNumber: gstNumber ? String(gstNumber).trim().toUpperCase() : null,
    gstDocUrl: gstDocUrl || null,
    fssaiNumber: fssaiNumber ? String(fssaiNumber).trim() : null,
    fssaiDocUrl: fssaiDocUrl || null,
    panNumber: String(panNumber).trim().toUpperCase(),
    panDocUrl: panDocUrl || null,
    msmeNumber: msmeNumber ? String(msmeNumber).trim().toUpperCase() : null,
    msmeDocUrl: msmeDocUrl || null,
    otherLicenseName: otherLicenseName || null,
    otherLicenseUrl: otherLicenseUrl || null,
    bankAccountHolder: String(bankAccountHolder || businessName).trim(),
    bankAccountNumber: String(bankAccountNumber).trim(),
    bankIfscCode: String(bankIfscCode).trim().toUpperCase(),
    bankName: bankName || null,
    bankBranch: bankBranch || null,
    cancelledChequeUrl: cancelledChequeUrl || null,
    razorpayAccountId: razorpayAccountId || null,
  };

  let sellerProfile;
  if (existingProfile) {
    sellerProfile = await prisma.sellerProfile.update({
      where: { userId },
      data: {
        ...payload,
        verificationStatus:
          existingProfile.verificationStatus === "VERIFIED" ? "VERIFIED" : "PENDING",
      },
    });
  } else {
    sellerProfile = await prisma.sellerProfile.create({
      data: {
        userId,
        ...payload,
        verificationStatus: "PENDING",
      },
    });
  }

  // Notify Admin about Seller Onboarding submission
  try {
    const adminUser = await getOrCreatePlatformAdminUser();
    await sendNotification(
      null,
      userId,
      adminUser.id,
      "seller_onboarding",
      `New Manufacturer Onboarding: ${sellerProfile.businessName}`,
      `${sellerProfile.contactPersonName} (${sellerProfile.pickupCity}) submitted KYC, FSSAI/GST & Bank details for verification.`
    );
  } catch (e) {
    console.warn("Seller onboarding admin notification warning:", e?.message);
  }

  return normalizeSellerProfile(sellerProfile);
};

/**
 * Get logged-in user's Seller Profile along with their products, orders, and settlements
 */
export const getMySellerDashboard = async (userId) => {
  await ensureInitialMeerutMarketplace();

  const profile = await prisma.sellerProfile.findUnique({
    where: { userId },
    include: {
      products: {
        orderBy: { createdAt: "desc" },
      },
      orders: {
        include: {
          items: true,
          customer: { select: { id: true, name: true, phone: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      settlements: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!profile) {
    return { onboarded: false, profile: null, products: [], orders: [], settlements: [], metrics: null };
  }

  const totalGrossPaise = profile.orders.reduce((s, o) => s + (o.productSubtotalPaise || 0), 0);
  const totalCommissionPaise = profile.orders.reduce(
    (s, o) => s + (o.platformCommissionPaise || 0),
    0
  );
  const totalSellerNetPaise = profile.orders.reduce((s, o) => s + (o.sellerPayablePaise || 0), 0);
  const unsettledPaise = profile.orders
    .filter((o) => o.settlementStatus === "UNSETTLED" || o.settlementStatus === "QUEUED_FOR_NEFT")
    .reduce((s, o) => s + (o.sellerPayablePaise || 0), 0);

  const normalizedProducts = (profile.products || []).map(normalizeProduct);
  const normalizedOrders = (profile.orders || []).map(normalizeOrder);
  const normalizedSettlements = (profile.settlements || []).map(normalizeSettlementBatch);
  const normalizedProfile = {
    ...normalizeSellerProfile(profile),
    products: normalizedProducts,
    orders: normalizedOrders,
    settlements: normalizedSettlements,
  };

  const publishedProductsCount = normalizedProducts.filter((p) => p.status === "PUBLISHED").length;
  const pendingProductsCount = normalizedProducts.filter((p) => p.status === "PENDING_APPROVAL").length;

  return {
    onboarded: true,
    profile: normalizedProfile,
    sellerProfile: normalizedProfile,
    products: normalizedProducts,
    orders: normalizedOrders,
    settlements: normalizedSettlements,
    metrics: {
      totalProducts: normalizedProducts.length,
      publishedProductsCount,
      pendingProductsCount,
      totalOrders: normalizedOrders.length,
      totalSellerEarnedRupees: Math.round(totalSellerNetPaise / 100),
      pendingNeftRupees: Math.round(unsettledPaise / 100),
    },
    stats: {
      totalProducts: normalizedProducts.length,
      publishedProducts: publishedProductsCount,
      pendingProducts: pendingProductsCount,
      totalOrders: normalizedOrders.length,
      totalGrossPaise,
      totalCommissionPaise,
      totalSellerNetPaise,
      unsettledPaise,
    },
  };
};

/**
 * Seller adds a new product (separate flow — always starts as PENDING_APPROVAL until Admin verifies & publishes)
 */
export const createSellerProduct = async (userId, data) => {
  const seller = await prisma.sellerProfile.findUnique({
    where: { userId },
  });

  if (!seller) {
    throw new Error("Please complete Seller Onboarding before adding products.");
  }

  const {
    name: rawName,
    title,
    description,
    category = "Meerut Specialties",
    images = [],
    image,
    priceRupees,
    price,
    pricePaise,
    mrpRupees,
    mrp,
    mrpPaise,
    stock = 50,
    unit = "piece",
    minOrderQty = 1,
    defaultDeliveryMode: rawDeliveryMode,
    deliveryByPlatform,
    proposedCommissionRate = 15.0,
  } = data;

  const name = rawName || title;
  const effPriceRupees = priceRupees ?? price;
  const effMrpRupees = mrpRupees ?? mrp;

  if (!name || (!effPriceRupees && !pricePaise)) {
    throw new Error("Product name and selling price are required.");
  }

  const resolvedPricePaise = pricePaise
    ? Math.round(Number(pricePaise))
    : Math.round(Number(effPriceRupees) * 100);

  const resolvedMrpPaise = mrpPaise
    ? Math.round(Number(mrpPaise))
    : effMrpRupees
      ? Math.round(Number(effMrpRupees) * 100)
      : resolvedPricePaise;

  const resolvedImages =
    Array.isArray(images) && images.length > 0
      ? images
      : image
        ? [image]
        : ["/images/service_delivery.png"];

  const resolvedDeliveryMode =
    deliveryByPlatform === true ||
    rawDeliveryMode === "PLATFORM_HELPER" ||
    rawDeliveryMode === "PLATFORM_DELIVERY" ||
    data.deliveryMode === "PLATFORM_HELPER" ||
    data.deliveryMode === "PLATFORM_DELIVERY"
      ? "PLATFORM_HELPER"
      : "SELLER_SELF";

  const baseSlug = String(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const slug = `${baseSlug}-${Date.now().toString(36)}`;

  const product = await prisma.product.create({
    data: {
      sellerId: seller.id,
      name: String(name).trim(),
      slug,
      description: String(description || "").trim(),
      category: String(category).trim(),
      images: resolvedImages,
      pricePaise: resolvedPricePaise,
      mrpPaise: resolvedMrpPaise,
      stock: Number(stock || 50),
      unit: String(unit || "piece"),
      minOrderQty: Number(minOrderQty || 1),
      commissionRate: Math.min(20, Math.max(10, Number(proposedCommissionRate || 15))),
      defaultDeliveryMode: resolvedDeliveryMode,
      status: "PENDING_APPROVAL", // Must be verified & published by Admin only
    },
  });

  // Notify Admin that a new product is awaiting verification & publishing
  try {
    const adminUser = await getOrCreatePlatformAdminUser();
    await sendNotification(
      null,
      userId,
      adminUser.id,
      "product_pending_approval",
      `New Product Pending Approval: ${product.name}`,
      `${seller.businessName} added "${product.name}" (₹${(product.pricePaise / 100).toFixed(0)}). Please verify, configure commission (10-20%), and publish.`
    );
  } catch (e) {
    console.warn("Admin product notification warning:", e?.message);
  }

  return normalizeProduct(product);
};

/**
 * Search Published Marketplace Products for Customers
 */
export const searchPublishedProducts = async (filters = {}) => {
  await ensureInitialMeerutMarketplace();

  const { search = "", category = "", deliveryMode = "", sortBy = "newest" } = filters;

  const where = {
    status: "PUBLISHED",
  };

  if (category && category !== "ALL" && category !== "All") {
    where.category = category;
  }

  if (deliveryMode && (deliveryMode === "SELLER_SELF" || deliveryMode === "PLATFORM_HELPER")) {
    where.defaultDeliveryMode = deliveryMode;
  }

  let products = await prisma.product.findMany({
    where,
    include: {
      seller: {
        select: {
          id: true,
          businessName: true,
          businessCategory: true,
          pickupCity: true,
          pickupAddress: true,
          fssaiNumber: true,
          gstNumber: true,
          verificationStatus: true,
        },
      },
    },
    orderBy:
      sortBy === "price_asc"
        ? { pricePaise: "asc" }
        : sortBy === "price_desc"
          ? { pricePaise: "desc" }
          : { createdAt: "desc" },
  });

  const q = String(search || "").trim().toLowerCase();
  if (q) {
    products = products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.seller?.businessName || "").toLowerCase().includes(q)
    );
  }

  const allPublishedCategories = await prisma.product.findMany({
    where: { status: "PUBLISHED" },
    select: { category: true },
    distinct: ["category"],
  });

  return {
    products: products.map(normalizeProduct),
    categories: allPublishedCategories.map((c) => c.category),
    total: products.length,
  };
};

/**
 * Place Marketplace Order:
 * 1. Portion-wise split calculation (e.g. 15% to Platform Account, 85% to Seller Account).
 * 2. Delivery calculation:
 *    - SELLER_SELF: ₹0 platform delivery charge; Seller handles delivery directly.
 *    - PLATFORM_HELPER: Auto-calculates +2% delivery charge (`Math.round(productSubtotalPaise * 0.02)`)
 *      and auto-creates a Delivery Task on behalf of Admin so available Buddies can accept & deliver it!
 * 3. Sends real-time + DB notifications to Seller, Admin, and (if PLATFORM_HELPER) online Buddies.
 */
export const placeMarketplaceOrder = async (customerId, data) => {
  const {
    productId: rawProductId,
    quantity: rawQuantity,
    items,
    deliveryMode: requestedDeliveryMode,
    shippingName: rawShippingName,
    customerName,
    shippingPhone: rawShippingPhone,
    customerPhone,
    shippingAddress: rawShippingAddress,
    deliveryAddress,
    shippingCity: rawShippingCity,
    deliveryCity,
    shippingPincode: rawShippingPincode,
    deliveryPincode,
    shippingLatitude,
    shippingLongitude,
    paymentMethod = "RAZORPAY_SPLIT",
    razorpayOrderId,
    razorpayPaymentId,
  } = data;

  const firstItem = Array.isArray(items) && items.length > 0 ? items[0] : null;
  const productId = rawProductId || firstItem?.productId;
  const quantity = rawQuantity ?? firstItem?.quantity ?? 1;
  const shippingName = rawShippingName || customerName || "HireBuddy Customer";
  const shippingPhone = rawShippingPhone || customerPhone;
  const shippingAddress = rawShippingAddress || deliveryAddress;
  const shippingCity = rawShippingCity || deliveryCity || "Meerut";
  const shippingPincode = rawShippingPincode || deliveryPincode || "250001";

  if (!productId || !shippingPhone || !shippingAddress) {
    throw new Error("Product, customer phone, and delivery address are required.");
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      seller: {
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
        },
      },
    },
  });

  if (!product || product.status !== "PUBLISHED") {
    throw new Error("This product is not available for purchase.");
  }

  const qty = Math.max(1, Number(quantity || 1));
  if (product.stock < qty) {
    throw new Error(`Only ${product.stock} ${product.unit}(s) available in stock.`);
  }

  // Delivery mode defaults to Seller's product setting, or customer/seller opt-in for Platform Delivery (+2%)
  const normalizedRequestedDelivery =
    requestedDeliveryMode === "PLATFORM_DELIVERY" ? "PLATFORM_HELPER" : requestedDeliveryMode;
  const resolvedDeliveryMode =
    normalizedRequestedDelivery === "PLATFORM_HELPER" || normalizedRequestedDelivery === "SELLER_SELF"
      ? normalizedRequestedDelivery
      : product.defaultDeliveryMode || "SELLER_SELF";

  // 1. Portion-wise split calculation (e.g. 15% Platform Commission, 85% Seller Share)
  const productSubtotalPaise = product.pricePaise * qty;
  const commissionRate = Number(product.commissionRate || 15.0);
  const platformCommissionPaise = Math.round(productSubtotalPaise * (commissionRate / 100));
  const sellerPayablePaise = productSubtotalPaise - platformCommissionPaise;

  // 2. Delivery charge calculation:
  // If seller/order opts for our platform delivery (PLATFORM_HELPER), add 2% extra charge
  const deliveryFeePaise =
    resolvedDeliveryMode === "PLATFORM_HELPER"
      ? Math.round(productSubtotalPaise * 0.02)
      : 0;

  const totalPaidPaise = productSubtotalPaise + deliveryFeePaise;
  const orderNumber = `HB-MRT-${Date.now().toString().slice(-6)}`;

  const adminUser = await getOrCreatePlatformAdminUser();

  let createdDeliveryTask = null;

  // 3. If PLATFORM_HELPER is opted, auto-create a Delivery Task on behalf of Admin
  if (resolvedDeliveryMode === "PLATFORM_HELPER") {
    const taskBudgetRupees = Math.max(1, Math.round(deliveryFeePaise / 100));
    const taskTitle = `Marketplace Delivery: ${product.name} (${orderNumber})`;
    const taskDescription = [
      ` Auto-Created Platform Delivery Task (2% Delivery Option) on behalf of HireBuddy Admin.`,
      `• Order: #${orderNumber} (${qty} × ${product.name})`,
      `• Pickup Point (Manufacturer): ${product.seller.businessName}, ${product.seller.pickupAddress}, ${product.seller.pickupCity} - ${product.seller.pickupPincode} (Contact: ${product.seller.contactPersonName} - ${product.seller.contactPersonPhone})`,
      `• Drop Address (Customer): ${shippingName}, ${shippingAddress}, ${shippingCity} - ${shippingPincode} (Phone: ${shippingPhone})`,
      `• Delivery Payout: ₹${(deliveryFeePaise / 100).toFixed(2)} (100% goes to Buddy upon delivery)`,
    ].join("\n");

    createdDeliveryTask = await prisma.task.create({
      data: {
        title: taskTitle.slice(0, 190),
        description: taskDescription,
        category: "Delivery & Pickup",
        location: `${product.seller.pickupAddress}, ${product.seller.pickupCity} → ${shippingAddress}, ${shippingCity}`.slice(0, 190),
        latitude: product.seller.pickupLatitude || 28.9845,
        longitude: product.seller.pickupLongitude || 77.7064,
        budget: taskBudgetRupees,
        preferredAt: new Date(),
        status: "OPEN",
        paymentStatus: "HELD_IN_ESCROW",
        createdById: adminUser.id,
      },
      include: {
        createdBy: { select: { id: true, name: true, image: true, phone: true } },
      },
    });
  }

  // Settlement status: Direct split vs Daily NEFT queue
  const settlementStatus =
    paymentMethod === "RAZORPAY_SPLIT" && product.seller.razorpayAccountId
      ? "SETTLED_DIRECT_SPLIT"
      : "QUEUED_FOR_NEFT";

  // 4. Create the MarketplaceOrder & MarketplaceOrderItem and decrement stock
  const order = await prisma.$transaction(async (tx) => {
    await tx.product.update({
      where: { id: product.id },
      data: { stock: { decrement: qty } },
    });

    const createdOrder = await tx.marketplaceOrder.create({
      data: {
        orderNumber,
        customerId,
        sellerId: product.seller.id,
        shippingName: String(shippingName).trim(),
        shippingPhone: String(shippingPhone).trim(),
        shippingAddress: String(shippingAddress).trim(),
        shippingCity: String(shippingCity).trim(),
        shippingPincode: String(shippingPincode).trim(),
        shippingLatitude: shippingLatitude ? parseFloat(shippingLatitude) : null,
        shippingLongitude: shippingLongitude ? parseFloat(shippingLongitude) : null,
        deliveryMode: resolvedDeliveryMode,
        deliveryFeePaise,
        deliveryTaskId: createdDeliveryTask?.id || null,
        productSubtotalPaise,
        platformCommissionRate: commissionRate,
        platformCommissionPaise,
        sellerPayablePaise,
        totalPaidPaise,
        paymentStatus: "PAID",
        paymentMethod,
        razorpayOrderId: razorpayOrderId || `order_mkt_${Date.now()}`,
        razorpayPaymentId: razorpayPaymentId || `pay_mkt_${Date.now()}`,
        settlementStatus,
        orderStatus: "CONFIRMED",
        items: {
          create: [
            {
              productId: product.id,
              productName: product.name,
              quantity: qty,
              unitPricePaise: product.pricePaise,
              commissionRate,
              platformSharePaise: platformCommissionPaise,
              sellerSharePaise: sellerPayablePaise,
            },
          ],
        },
      },
      include: {
        items: true,
        seller: {
          select: {
            id: true,
            userId: true,
            businessName: true,
            pickupAddress: true,
            pickupCity: true,
            contactPersonName: true,
            contactPersonPhone: true,
          },
        },
      },
    });

    return createdOrder;
  });

  // 5. Broadcast auto-created 2% Delivery Task to all online Buddies if PLATFORM_HELPER was chosen
  if (createdDeliveryTask) {
    try {
      const formattedLiveTask = {
        ...createdDeliveryTask,
        image: "/images/helper_task_medicine.png",
        isNew: true,
        dateLabel: new Date().toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        timeSlot: "Immediate Pickup & Delivery",
      };
      emitBroadcast("new_task_available", {
        taskId: createdDeliveryTask.id,
        task: formattedLiveTask,
        category: createdDeliveryTask.category,
        customerName: "HireBuddy Admin (Marketplace Delivery)",
      });
      notificationEvents.newTaskPosted(createdDeliveryTask, adminUser).catch(() => {});
    } catch (e) {
      console.warn("Delivery task broadcast warning:", e?.message);
    }
  }

  // 6. Send notifications to Seller & Admin & Customer
  const sellerShareRupees = (sellerPayablePaise / 100).toFixed(2);
  const platformShareRupees = (platformCommissionPaise / 100).toFixed(2);
  const deliveryFeeRupees = (deliveryFeePaise / 100).toFixed(2);
  const totalPaidRupees = (totalPaidPaise / 100).toFixed(2);

  try {
    // Notify Seller
    if (product.seller?.userId) {
      await sendNotification(
        createdDeliveryTask?.id || null,
        customerId,
        product.seller.userId,
        "marketplace_order_received",
        `New Order #${orderNumber}: ${product.name} (×${qty})`,
        `Total Paid: ₹${totalPaidRupees} | Your Share (${100 - commissionRate}%): ₹${sellerShareRupees} | Platform Commission (${commissionRate}%): ₹${platformShareRupees} | Delivery: ${
          resolvedDeliveryMode === "PLATFORM_HELPER"
            ? `HireBuddy Delivery (+2% = ₹${deliveryFeeRupees} task created)`
            : "Self Delivery by Seller"
        }`
      );
      emitToUser(product.seller.userId, "marketplace_order_received", {
        order,
        deliveryTask: createdDeliveryTask,
      });
    }

    // Notify Admin
    await sendNotification(
      createdDeliveryTask?.id || null,
      customerId,
      adminUser.id,
      "marketplace_order_admin_alert",
      `Marketplace Order #${orderNumber} Placed`,
      `${qty} × "${product.name}" from ${product.seller.businessName}. Platform ${commissionRate}% = ₹${platformShareRupees}, Seller ${100 - commissionRate}% = ₹${sellerShareRupees}.${
        createdDeliveryTask
          ? ` Auto-created 2% Delivery Task (₹${deliveryFeeRupees}) on behalf of Admin.`
          : " Seller handling self-delivery."
      }`
    );

    // Notify Customer
    await sendNotification(
      createdDeliveryTask?.id || null,
      adminUser.id,
      customerId,
      "marketplace_order_confirmed",
      `Order #${orderNumber} Confirmed!`,
      `Your order for ${qty} × "${product.name}" (₹${totalPaidRupees}) is confirmed.${
        createdDeliveryTask
          ? " A HireBuddy delivery task has been created and assigned to nearby Buddies."
          : ` ${product.seller.businessName} will dispatch your order directly.`
      }`
    );
  } catch (notifErr) {
    console.warn("Order notification warning:", notifErr?.message);
  }

  return {
    message: createdDeliveryTask
      ? `Order #${orderNumber} placed! +2% HireBuddy Delivery Task created on behalf of Admin.`
      : `Order #${orderNumber} placed! Seller (${product.seller.businessName}) & Admin have been notified.`,
    order: normalizeOrder(order),
    deliveryTask: createdDeliveryTask,
    splitSummary: {
      totalCustomerPaidRupees: Math.round(totalPaidPaise / 100),
      sellerShareRupees: Math.round(sellerPayablePaise / 100),
      platformCommissionRupees: Math.round(platformCommissionPaise / 100),
      deliveryCharge2PctRupees: Math.round(deliveryFeePaise / 100),
      autoCreatedDeliveryTaskId: createdDeliveryTask?.id || null,
    },
    splitBreakdown: {
      productSubtotalPaise,
      commissionRate,
      platformCommissionPaise,
      sellerShareRate: 100 - commissionRate,
      sellerPayablePaise,
      deliveryMode: resolvedDeliveryMode,
      deliveryFeePaise,
      totalPaidPaise,
      settlementStatus,
    },
  };
};

/**
 * Get Customer's Marketplace Orders
 */
export const getCustomerMarketplaceOrders = async (customerId) => {
  const rows = await prisma.marketplaceOrder.findMany({
    where: { customerId },
    include: {
      items: {
        include: {
          product: { select: { id: true, name: true, images: true, unit: true } },
        },
      },
      seller: {
        select: {
          id: true,
          businessName: true,
          pickupCity: true,
          contactPersonName: true,
          contactPersonPhone: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(normalizeOrder);
};

/**
 * Update Order Status by Seller or Admin
 */
export const updateMarketplaceOrderStatus = async (orderId, newStatus) => {
  const updated = await prisma.marketplaceOrder.update({
    where: { id: orderId },
    data: { orderStatus: newStatus },
  });
  return normalizeOrder(updated);
};

// ============================================================================
// ADMIN MARKETPLACE FUNCTIONS (Seller KYC, Product Verification & Commission, Daily NEFT)
// ============================================================================

export const getAdminMarketplaceOverview = async () => {
  await ensureInitialMeerutMarketplace();

  const [sellersRaw, productsRaw, ordersRaw, settlementsRaw] = await Promise.all([
    prisma.sellerProfile.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        _count: { select: { products: true, orders: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.findMany({
      include: {
        seller: {
          select: {
            id: true,
            businessName: true,
            pickupCity: true,
            verificationStatus: true,
            fssaiNumber: true,
            gstNumber: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.marketplaceOrder.findMany({
      include: {
        items: true,
        customer: { select: { id: true, name: true, phone: true, email: true } },
        seller: {
          select: {
            id: true,
            businessName: true,
            bankAccountHolder: true,
            bankAccountNumber: true,
            bankIfscCode: true,
            bankName: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.settlementBatch.findMany({
      include: {
        seller: {
          select: {
            id: true,
            businessName: true,
            bankAccountHolder: true,
            bankAccountNumber: true,
            bankIfscCode: true,
            bankName: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const sellers = sellersRaw.map(normalizeSellerProfile);
  const products = productsRaw.map(normalizeProduct);
  const orders = ordersRaw.map(normalizeOrder);
  const settlements = settlementsRaw.map(normalizeSettlementBatch);

  const stats = {
    totalSellers: sellers.length,
    pendingSellers: sellers.filter((s) => s.verificationStatus === "PENDING").length,
    totalProducts: products.length,
    pendingProducts: products.filter((p) => p.status === "PENDING_APPROVAL").length,
    totalOrders: orders.length,
    platformDeliveryOrders: orders.filter((o) => o.deliveryMode === "PLATFORM_HELPER").length,
    totalPlatformCommission: Math.round(
      orders.reduce((s, o) => s + (o.platformCommissionPaise || 0), 0) / 100
    ),
    totalSellerPayoutVolume: Math.round(
      orders.reduce((s, o) => s + (o.sellerPayablePaise || 0), 0) / 100
    ),
    pendingNeftAmount: Math.round(
      orders
        .filter((o) => o.settlementStatus === "UNSETTLED" || o.settlementStatus === "QUEUED_FOR_NEFT")
        .reduce((s, o) => s + (o.sellerPayablePaise || 0), 0) / 100
    ),
  };

  return { sellers, products, orders, settlements, stats };
};

/**
 * Admin verifies or rejects a Seller Profile & Bank Account
 */
export const adminVerifySeller = async (
  sellerId,
  { status: rawStatus, verificationStatus, bankVerified, notes }
) => {
  const incomingStatus = rawStatus || verificationStatus || "VERIFIED";
  const status = incomingStatus === "APPROVED" ? "VERIFIED" : incomingStatus;

  const updated = await prisma.sellerProfile.update({
    where: { id: sellerId },
    data: {
      verificationStatus: status, // "VERIFIED" | "REJECTED" | "PENDING"
      bankVerified: bankVerified !== undefined ? Boolean(bankVerified) : status === "VERIFIED",
      verificationNotes: notes || null,
      verifiedAt: status === "VERIFIED" ? new Date() : null,
    },
  });

  try {
    const adminUser = await getOrCreatePlatformAdminUser();
    await sendNotification(
      null,
      adminUser.id,
      updated.userId,
      "seller_kyc_status",
      status === "VERIFIED"
        ? "Seller Account & KYC Verified!"
        : "Seller Verification Update",
      status === "VERIFIED"
        ? `Congratulations! Your manufacturer account "${updated.businessName}" and bank account have been verified by Admin.`
        : `Your seller profile "${updated.businessName}" status was updated to ${status}. ${notes || ""}`
    );
  } catch (e) {
    console.warn("Seller verify notification warning:", e?.message);
  }

  return normalizeSellerProfile(updated);
};

/**
 * Admin verifies & publishes a Product with configurable commission rate (10% - 20%)
 */
export const adminVerifyAndPublishProduct = async (
  productId,
  { status: rawStatus, approvalStatus, isPublished, commissionRate, commissionPct, defaultDeliveryMode, rejectionReason }
) => {
  const existing = await prisma.product.findUnique({
    where: { id: productId },
    include: { seller: true },
  });

  if (!existing) {
    throw new Error("Product not found");
  }

  const incomingStatus = rawStatus || approvalStatus || (isPublished ? "PUBLISHED" : "PUBLISHED");
  const status = incomingStatus === "APPROVED" ? "PUBLISHED" : incomingStatus;

  const effectiveCommission = commissionRate ?? commissionPct;
  const parsedCommission =
    effectiveCommission !== undefined && effectiveCommission !== null
      ? Math.min(50, Math.max(1, Number(effectiveCommission)))
      : existing.commissionRate;

  const updated = await prisma.product.update({
    where: { id: productId },
    data: {
      status: status || "PUBLISHED",
      commissionRate: parsedCommission,
      ...(defaultDeliveryMode ? { defaultDeliveryMode } : {}),
      rejectionReason: status === "REJECTED" ? rejectionReason || "Does not meet guidelines" : null,
      approvedAt: status === "PUBLISHED" ? new Date() : existing.approvedAt,
      approvedByAdmin: "HireBuddy Admin",
    },
    include: {
      seller: true,
    },
  });

  try {
    const adminUser = await getOrCreatePlatformAdminUser();
    if (existing.seller?.userId) {
      await sendNotification(
        null,
        adminUser.id,
        existing.seller.userId,
        "product_verification",
        updated.status === "PUBLISHED"
          ? `Product Published: ${updated.name}`
          : `Product Status Updated: ${updated.name}`,
        updated.status === "PUBLISHED"
          ? `Admin verified & published "${updated.name}" on the Meerut Marketplace with ${updated.commissionRate}% platform commission (Your share: ${100 - updated.commissionRate}%).`
          : `Product "${updated.name}" status: ${updated.status}. ${rejectionReason || ""}`
      );
    }
  } catch (e) {
    console.warn("Product publish notification warning:", e?.message);
  }

  return normalizeProduct(updated);
};

/**
 * Process Daily NEFT Settlement for all QUEUED_FOR_NEFT orders (or for a specific seller)
 */
export const processDailyNeftSettlement = async ({ sellerId = null, neftUtrPrefix = "NEFT-MRT" } = {}) => {
  const where = {
    settlementStatus: { in: ["UNSETTLED", "QUEUED_FOR_NEFT"] },
    paymentStatus: "PAID",
    ...(sellerId ? { sellerId } : {}),
  };

  const pendingOrders = await prisma.marketplaceOrder.findMany({
    where,
    include: {
      seller: true,
    },
  });

  if (pendingOrders.length === 0) {
    return { batchesCreated: 0, ordersSettled: 0, batches: [] };
  }

  // Group orders by sellerId
  const bySeller = {};
  for (const order of pendingOrders) {
    if (!bySeller[order.sellerId]) {
      bySeller[order.sellerId] = [];
    }
    bySeller[order.sellerId].push(order);
  }

  const createdBatches = [];
  const adminUser = await getOrCreatePlatformAdminUser();

  for (const [sId, sellerOrders] of Object.entries(bySeller)) {
    const grossAmountPaise = sellerOrders.reduce((s, o) => s + o.productSubtotalPaise, 0);
    const commissionDeductedPaise = sellerOrders.reduce((s, o) => s + o.platformCommissionPaise, 0);
    const netPayablePaise = sellerOrders.reduce((s, o) => s + o.sellerPayablePaise, 0);
    const utrNumber = `${neftUtrPrefix}-${Date.now().toString().slice(-6)}-${sId.slice(0, 4).toUpperCase()}`;

    const batch = await prisma.$transaction(async (tx) => {
      const b = await tx.settlementBatch.create({
        data: {
          sellerId: sId,
          settlementDate: new Date(),
          totalOrdersCount: sellerOrders.length,
          grossAmountPaise,
          commissionDeductedPaise,
          netPayablePaise,
          neftUtrNumber: utrNumber,
          status: "PAID",
          processedByAdmin: "HireBuddy Admin",
          processedAt: new Date(),
        },
        include: {
          seller: true,
        },
      });

      await tx.marketplaceOrder.updateMany({
        where: { id: { in: sellerOrders.map((o) => o.id) } },
        data: {
          settlementStatus: "SETTLED_NEFT",
          settlementUtr: utrNumber,
          settledAt: new Date(),
          settlementBatchId: b.id,
        },
      });

      return b;
    });

    createdBatches.push(batch);

    // Notify seller of Daily NEFT payout
    try {
      const sellerUserId = sellerOrders[0]?.seller?.userId;
      if (sellerUserId) {
        await sendNotification(
          null,
          adminUser.id,
          sellerUserId,
          "daily_neft_settled",
          `Daily NEFT Settlement Credited: ₹${(netPayablePaise / 100).toFixed(2)}`,
          `NEFT Transfer (UTR: ${utrNumber}) of ₹${(netPayablePaise / 100).toFixed(2)} for ${sellerOrders.length} order(s) has been settled to your bank account (${sellerOrders[0]?.seller?.bankIfscCode}).`
        );
      }
    } catch (e) {
      console.warn("NEFT notification warning:", e?.message);
    }
  }

  const normalizedBatches = createdBatches.map(normalizeSettlementBatch);
  return {
    batchesCreated: normalizedBatches.length,
    ordersSettled: pendingOrders.length,
    settledOrdersCount: pendingOrders.length,
    batch: normalizedBatches[0] || null,
    batches: normalizedBatches,
  };
};

export const onboardSeller = onboardOrUpdateSeller;
export const adminVerifyProduct = adminVerifyAndPublishProduct;
export const processDailyNeftSettlements = processDailyNeftSettlement;
