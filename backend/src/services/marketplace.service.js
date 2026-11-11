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
    if (existingCount >= 8) {
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
      {
        name: "Royal Banarasi Pure Silk Zari Border Saree (With Blouse Piece)",
        slug: "royal-banarasi-pure-silk-zari-saree",
        description:
          "Handwoven pure Katan silk festive & wedding saree with intricate gold zari pallu and matching unstitched blouse piece. Direct from verified weaver collection.",
        category: "Sarees & Ethnic Wear",
        images: ["/images/helper_task_cleaning.png", "/images/service_furniture.png"],
        variants: [
          { label: "Crimson Red Zari", priceRupees: 2499, mrpRupees: 3999, stock: 15 },
          { label: "Royal Blue Zari", priceRupees: 2599, mrpRupees: 3999, stock: 12 },
          { label: "Emerald Green Zari", priceRupees: 2499, mrpRupees: 3999, stock: 8 },
        ],
        highlights: [
          "100% Pure Handwoven Katan Silk with Rich Zari Border",
          "Includes 0.8m Matching Unstitched Silk Blouse Piece",
          "Ideal for Weddings, Festivals & Gifting",
        ],
        avgRating: 4.9,
        reviewCount: 34,
        pricePaise: 249900, // ₹2,499
        mrpPaise: 399900,
        stock: 35,
        unit: "saree",
        minOrderQty: 1,
        commissionRate: 15.0,
        status: "PUBLISHED",
        defaultDeliveryMode: "PLATFORM_HELPER",
        approvedAt: new Date(),
        approvedByAdmin: "HireBuddy Admin",
      },
      {
        name: "Luxury Festive Dry-Fruit, Brass Diya & Sweet Gift Hamper Box",
        slug: "luxury-festive-dry-fruit-brass-gift-hamper",
        description:
          "Curated premium gift box for weddings, birthdays, and festivals — includes roasted almonds, cashews, pistachios, handcrafted brass diya, and greeting card.",
        category: "Gifts & Hampers",
        images: ["/images/helper_task_cooking.png", "/images/helper_task_plumbing.png"],
        variants: [
          { label: "Standard Hamper (750g + 1 Brass Diya)", priceRupees: 1199, mrpRupees: 1699, stock: 45 },
          { label: "Royal Grand Box (1.5 Kg + 2 Brass Diyas)", priceRupees: 1999, mrpRupees: 2799, stock: 30 },
        ],
        highlights: [
          "Premium California Almonds, Cashews & Roasted Pistachios",
          "Includes Handcrafted Meerut Virgin Brass Akhand Diya",
          " Velvet-Lined Magnetic Gift Box with Custom Greeting Card",
        ],
        avgRating: 4.8,
        reviewCount: 27,
        pricePaise: 119900, // ₹1,199
        mrpPaise: 169900,
        stock: 75,
        unit: "gift box",
        minOrderQty: 1,
        commissionRate: 15.0,
        status: "PUBLISHED",
        defaultDeliveryMode: "PLATFORM_HELPER",
        approvedAt: new Date(),
        approvedByAdmin: "HireBuddy Admin",
      },
    ];

    for (const prod of sampleProducts) {
      await prisma.product.upsert({
        where: { slug: prod.slug },
        update: {
          ...(prod.variants ? { variants: prod.variants } : {}),
          ...(prod.highlights ? { highlights: prod.highlights } : {}),
        },
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
  const commissionPct = Number(s.commissionRate ?? 15.0);
  return {
    ...s,
    commissionRate: commissionPct,
    commissionPct,
    contactPhone: s.contactPersonPhone,
    gstin: s.gstNumber,
    bankAccountName: s.bankAccountHolder,
    bankIfsc: s.bankIfscCode,
    bankVerificationStatus: s.bankVerified ? "VERIFIED" : "PENDING",
    settlementPreference: "DAILY_NEFT",
  };
};

const normalizeVariants = (rawVariants, fallbackPriceRupees, fallbackMrpRupees) => {
  if (!Array.isArray(rawVariants)) return [];
  return rawVariants
    .filter((v) => v && typeof v === "object" && (v.label || v.name))
    .map((v) => {
      const label = String(v.label || v.name).trim();
      const priceRupees = Number(
        v.priceRupees ?? v.price ?? (v.pricePaise ? Math.round(v.pricePaise / 100) : fallbackPriceRupees)
      );
      const mrpRupees = Number(
        v.mrpRupees ?? v.mrp ?? (v.mrpPaise ? Math.round(v.mrpPaise / 100) : Math.max(priceRupees, fallbackMrpRupees))
      );
      return {
        label,
        priceRupees,
        pricePaise: Math.round(priceRupees * 100),
        mrpRupees,
        mrpPaise: Math.round(mrpRupees * 100),
        stock: Number(v.stock ?? 20),
      };
    });
};

const normalizeProduct = (p) => {
  if (!p) return null;
  const priceRupees = Math.round((p.pricePaise || 0) / 100);
  const mrpRupees = p.mrpPaise ? Math.round(p.mrpPaise / 100) : priceRupees;
  const imagesArr = Array.isArray(p.images) && p.images.length > 0 ? p.images : ["/images/service_delivery.png"];
  const variantsArr = normalizeVariants(p.variants, priceRupees, mrpRupees);
  const highlightsArr = Array.isArray(p.highlights) ? p.highlights.filter(Boolean) : [];
  const effectiveCommission = Number(p.seller?.commissionRate ?? p.commissionRate ?? 15.0);
  const isPlatformDelivery = p.defaultDeliveryMode === "PLATFORM_HELPER";
  return {
    ...p,
    title: p.name,
    price: priceRupees,
    priceRupees,
    mrp: mrpRupees,
    mrpRupees,
    image: imagesArr[0] || "/images/service_delivery.png",
    images: imagesArr,
    variants: variantsArr,
    highlights: highlightsArr,
    avgRating: Number(p.avgRating ?? 4.8),
    reviewCount: Number(p.reviewCount ?? 12),
    expressDeliveryEta: isPlatformDelivery ? "⚡ 35–45 Min Local Buddy Delivery" : "📦 Direct Seller Dispatch",
    commissionRate: effectiveCommission,
    commissionPct: effectiveCommission,
    approvalStatus: p.status,
    isPublished: p.status === "PUBLISHED",
    deliveryByPlatform: isPlatformDelivery,
    allowPlatformDelivery: isPlatformDelivery,
    seller: p.seller ? normalizeSellerProfile(p.seller) : undefined,
  };
};

const deriveOrderOtp = (id, salt = "pickup") => {
  const str = `${id || "order"}_${salt}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) % 9000;
  }
  return String(1000 + Math.abs(hash));
};

const normalizeOrder = (o) => {
  if (!o) return null;
  const productSubtotalRupees = Math.round((o.productSubtotalPaise || 0) / 100);
  const sellerPayableRupees = Math.round((o.sellerPayablePaise || 0) / 100);
  const platformCommissionRupees = Math.round((o.platformCommissionPaise || 0) / 100);
  const deliveryFeeRupees = Math.round((o.deliveryFeePaise || 0) / 100);
  const totalPaidRupees = Math.round((o.totalPaidPaise || 0) / 100);

  // Indian E-Commerce Tax & Statutory Deductions Breakdown (SAC 998599, Sec 52 GST TCS, Sec 194-O TDS)
  const gstOnCommissionRupees = Number((platformCommissionRupees * 0.18).toFixed(2));
  const gstTcsRupees = Number((productSubtotalRupees * 0.005).toFixed(2)); // 0.5% TCS
  const incomeTaxTdsRupees = Number((productSubtotalRupees * 0.001).toFixed(2)); // 0.1% TDS u/s 194-O
  const netSellerAfterTaxesRupees = Number(
    Math.max(0, sellerPayableRupees - gstOnCommissionRupees - gstTcsRupees - incomeTaxTdsRupees).toFixed(2)
  );

  const pickupOtp = o.pickupOtp || deriveOrderOtp(o.deliveryTaskId || o.id, "pickup");
  const deliveryOtp = o.deliveryOtp || deriveOrderOtp(o.deliveryTaskId || o.id, "complete");

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
    pickupOtp,
    deliveryOtp,
    taxBreakdown: {
      sacCode: "998599",
      grossProductValueRupees: productSubtotalRupees,
      platformCommissionRupees,
      gstOnCommission18PctRupees: gstOnCommissionRupees,
      gstTcs0_5PctRupees: gstTcsRupees,
      tds194O_0_1PctRupees: incomeTaxTdsRupees,
      grossSellerShareRupees: sellerPayableRupees,
      netSellerBankPayoutRupees: netSellerAfterTaxesRupees,
      deliveryFee2PctRupees: deliveryFeeRupees,
      customerTotalPaidRupees: totalPaidRupees,
    },
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
    variants = [],
    highlights = [],
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
      ? images.filter(Boolean)
      : image
        ? [image]
        : ["/images/service_delivery.png"];

  const resolvedVariants = Array.isArray(variants)
    ? normalizeVariants(
        variants,
        Math.round(resolvedPricePaise / 100),
        Math.round(resolvedMrpPaise / 100)
      )
    : [];

  const resolvedHighlights = Array.isArray(highlights)
    ? highlights.map((h) => String(h).trim()).filter(Boolean)
    : typeof highlights === "string"
      ? highlights
          .split(/\r?\n|,/)
          .map((h) => h.trim())
          .filter(Boolean)
      : [];

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

  const sellerCommissionRate = Number(seller.commissionRate ?? proposedCommissionRate ?? 15.0);

  const product = await prisma.product.create({
    data: {
      sellerId: seller.id,
      name: String(name).trim(),
      slug,
      description: String(description || "").trim(),
      category: String(category).trim(),
      images: resolvedImages,
      variants: resolvedVariants.length > 0 ? resolvedVariants : undefined,
      highlights: resolvedHighlights.length > 0 ? resolvedHighlights : undefined,
      pricePaise: resolvedPricePaise,
      mrpPaise: resolvedMrpPaise,
      stock: Number(stock || 50),
      unit: String(unit || "piece"),
      minOrderQty: Number(minOrderQty || 1),
      commissionRate: sellerCommissionRate,
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
          commissionRate: true,
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
 * Get a single Published Product by slug or ID (for Amazon-style dedicated Product Page `/marketplace/[slug]`)
 */
export const getPublishedProductBySlug = async (slugOrId) => {
  await ensureInitialMeerutMarketplace();

  const product = await prisma.product.findFirst({
    where: {
      OR: [{ slug: String(slugOrId) }, { id: String(slugOrId) }],
      status: "PUBLISHED",
    },
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
          commissionRate: true,
          verificationStatus: true,
        },
      },
    },
  });

  if (!product) {
    return null;
  }

  const [relatedProductsRaw, reviewOrdersRaw] = await Promise.all([
    prisma.product.findMany({
      where: {
        status: "PUBLISHED",
        category: product.category,
        id: { not: product.id },
      },
      include: {
        seller: {
          select: {
            id: true,
            businessName: true,
            pickupCity: true,
            fssaiNumber: true,
            commissionRate: true,
            verificationStatus: true,
          },
        },
      },
      take: 4,
    }),
    prisma.marketplaceOrder.findMany({
      where: {
        buyerRating: { not: null },
        items: { some: { productId: product.id } },
      },
      include: {
        customer: { select: { name: true, city: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 10,
    }),
  ]);

  const reviews = reviewOrdersRaw.map((ord) => ({
    id: ord.id,
    orderNumber: ord.orderNumber,
    buyerName: ord.shippingName || ord.customer?.name || "Verified Buyer",
    buyerCity: ord.shippingCity || ord.customer?.city || "Meerut",
    rating: ord.buyerRating,
    review: ord.buyerReview || "Great quality product, fast delivery!",
    createdAt: ord.updatedAt,
  }));

  return {
    product: normalizeProduct(product),
    relatedProducts: relatedProductsRaw.map(normalizeProduct),
    reviews,
  };
};

/**
 * Place Marketplace Order (Supports both 1-Click Single "Buy" AND Multi-Seller Unified Cart Checkout):
 * 1. Automatically picks Name, Phone, and Address from Customer's User Profile by default.
 * 2. Supports product variants (`selectedVariant`) and dynamic per-seller commission (`SellerProfile.commissionRate`).
 * 3. Automatically splits multi-seller carts into per-seller orders linked by `cartGroupId`.
 * 4. Auto-creates a +2% Buddy Delivery Task on behalf of Admin for every `PLATFORM_HELPER` order.
 */
export const placeMarketplaceOrder = async (customerId, data) => {
  const {
    productId: rawProductId,
    quantity: rawQuantity,
    selectedVariant: rawSelectedVariant,
    items,
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

  const requestedItems =
    Array.isArray(items) && items.length > 0
      ? items
      : rawProductId
        ? [
            {
              productId: rawProductId,
              quantity: rawQuantity ?? 1,
              selectedVariant: rawSelectedVariant || null,
            },
          ]
        : [];

  if (requestedItems.length === 0) {
    throw new Error("Product is required to place an order.");
  }

  // Automatically pick Name, Phone, and Address from the logged-in Customer's User Profile by default
  const customerProfile = customerId
    ? await prisma.user.findUnique({
        where: { id: customerId },
        select: { name: true, phone: true, address: true, city: true },
      })
    : null;

  const shippingName =
    rawShippingName || customerName || customerProfile?.name || "HireBuddy Customer";
  const shippingPhone =
    rawShippingPhone || customerPhone || customerProfile?.phone || "9897000000";
  const shippingAddress =
    rawShippingAddress ||
    deliveryAddress ||
    customerProfile?.address ||
    (customerProfile?.city ? `${customerProfile.city}, UP` : "Modipuram, Meerut, UP");
  const shippingCity =
    rawShippingCity || deliveryCity || customerProfile?.city || "Meerut";
  const shippingPincode = rawShippingPincode || deliveryPincode || "250001";

  const productIds = [...new Set(requestedItems.map((i) => i.productId).filter(Boolean))];
  const dbProducts = await prisma.product.findMany({
    where: { id: { in: productIds } },
    include: {
      seller: {
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
        },
      },
    },
  });

  const productMap = new Map(dbProducts.map((p) => [p.id, p]));

  // Validate all items and group by Seller + DeliveryMode so multi-seller carts split cleanly
  const sellerGroups = new Map();

  for (const reqItem of requestedItems) {
    const product = productMap.get(reqItem.productId);
    if (!product || product.status !== "PUBLISHED") {
      throw new Error("One or more products in your cart are not available for purchase.");
    }
    const qty = Math.max(1, Number(reqItem.quantity || 1));
    if (product.stock < qty) {
      throw new Error(`Only ${product.stock} ${product.unit}(s) available in stock for ${product.name}.`);
    }

    // Check if customer picked a specific variant (e.g. "Royal Blue Zari" or "1.5 Kg Box")
    const normalizedVars = normalizeVariants(
      product.variants,
      Math.round(product.pricePaise / 100),
      Math.round((product.mrpPaise || product.pricePaise) / 100)
    );
    const chosenVariantLabel = reqItem.selectedVariant ? String(reqItem.selectedVariant).trim() : null;
    const matchedVariant = chosenVariantLabel
      ? normalizedVars.find((v) => v.label.toLowerCase() === chosenVariantLabel.toLowerCase())
      : null;

    const unitPricePaise = matchedVariant ? matchedVariant.pricePaise : product.pricePaise;
    const resolvedDeliveryMode =
      product.defaultDeliveryMode === "PLATFORM_HELPER" ||
      product.defaultDeliveryMode === "PLATFORM_DELIVERY"
        ? "PLATFORM_HELPER"
        : "SELLER_SELF";

    const groupKey = `${product.seller.id}::${resolvedDeliveryMode}`;
    if (!sellerGroups.has(groupKey)) {
      sellerGroups.set(groupKey, {
        seller: product.seller,
        deliveryMode: resolvedDeliveryMode,
        lineItems: [],
      });
    }
    sellerGroups.get(groupKey).lineItems.push({
      product,
      qty,
      unitPricePaise,
      selectedVariant: matchedVariant?.label || chosenVariantLabel || null,
    });
  }

  const cartGroupId =
    sellerGroups.size > 1 || requestedItems.length > 1
      ? `CART-MRT-${Date.now().toString().slice(-6)}`
      : null;

  const adminUser = await getOrCreatePlatformAdminUser();
  const createdOrders = [];
  const createdDeliveryTasks = [];

  let groupIdx = 0;
  for (const [, group] of sellerGroups.entries()) {
    groupIdx += 1;
    const { seller, deliveryMode: resolvedDeliveryMode, lineItems } = group;
    const commissionRate = Number(
      seller?.commissionRate ?? lineItems[0]?.product?.commissionRate ?? 15.0
    );

    const productSubtotalPaise = lineItems.reduce(
      (sum, li) => sum + li.unitPricePaise * li.qty,
      0
    );
    const platformCommissionPaise = Math.round(
      productSubtotalPaise * (commissionRate / 100)
    );
    const deliveryFeePaise =
      resolvedDeliveryMode === "PLATFORM_HELPER"
        ? Math.round(productSubtotalPaise * 0.02)
        : 0;
    const sellerPayablePaise = Math.max(
      0,
      productSubtotalPaise - platformCommissionPaise - deliveryFeePaise
    );
    const totalPaidPaise = productSubtotalPaise;

    const suffix = sellerGroups.size > 1 ? `-${groupIdx}` : "";
    const orderNumber = `HB-MRT-${Date.now().toString().slice(-6)}${suffix}`;

    let createdDeliveryTask = null;
    if (resolvedDeliveryMode === "PLATFORM_HELPER") {
      const taskBudgetRupees = Math.max(1, Math.round(deliveryFeePaise / 100));
      const itemsSummary = lineItems
        .map(
          (li) =>
            `${li.qty} × ${li.product.name}${li.selectedVariant ? ` [${li.selectedVariant}]` : ""}`
        )
        .join(", ");
      const taskTitle = `Marketplace Delivery: ${lineItems[0].product.name} (${orderNumber})`;
      const taskDescription = [
        `Auto-Created Platform Delivery Task (2% Delivery Option) on behalf of HireBuddy Admin.`,
        `• Order: #${orderNumber} (${itemsSummary})`,
        `• Pickup Point (Manufacturer): ${seller.businessName}, ${seller.pickupAddress}, ${seller.pickupCity} - ${seller.pickupPincode} (Contact: ${seller.contactPersonName} - ${seller.contactPersonPhone})`,
        `• Drop Address (Customer): ${shippingName}, ${shippingAddress}, ${shippingCity} - ${shippingPincode} (Phone: ${shippingPhone})`,
        `• Delivery Payout: ₹${(deliveryFeePaise / 100).toFixed(2)} (100% goes to Buddy upon delivery)`,
      ].join("\n");

      createdDeliveryTask = await prisma.task.create({
        data: {
          title: taskTitle.slice(0, 190),
          description: taskDescription,
          category: "Delivery & Pickup",
          location: `${seller.pickupAddress}, ${seller.pickupCity} → ${shippingAddress}, ${shippingCity}`.slice(
            0,
            190
          ),
          latitude: seller.pickupLatitude || 28.9845,
          longitude: seller.pickupLongitude || 77.7064,
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
      createdDeliveryTasks.push(createdDeliveryTask);
    }

    const settlementStatus =
      paymentMethod === "RAZORPAY_SPLIT" && seller.razorpayAccountId
        ? "SETTLED_DIRECT_SPLIT"
        : "QUEUED_FOR_NEFT";

    const pickupOtp = deriveOrderOtp(createdDeliveryTask?.id || orderNumber, "pickup");
    const deliveryOtp = deriveOrderOtp(createdDeliveryTask?.id || orderNumber, "complete");

    const order = await prisma.$transaction(async (tx) => {
      for (const li of lineItems) {
        await tx.product.update({
          where: { id: li.product.id },
          data: { stock: { decrement: li.qty } },
        });
      }

      const createdOrder = await tx.marketplaceOrder.create({
        data: {
          orderNumber,
          cartGroupId,
          customerId,
          sellerId: seller.id,
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
          pickupOtp,
          deliveryOtp,
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
            create: lineItems.map((li) => {
              const liSub = li.unitPricePaise * li.qty;
              const liPlat = Math.round(liSub * (commissionRate / 100));
              const liDeliv =
                resolvedDeliveryMode === "PLATFORM_HELPER" ? Math.round(liSub * 0.02) : 0;
              return {
                productId: li.product.id,
                productName: li.product.name,
                selectedVariant: li.selectedVariant,
                quantity: li.qty,
                unitPricePaise: li.unitPricePaise,
                commissionRate,
                platformSharePaise: liPlat,
                sellerSharePaise: Math.max(0, liSub - liPlat - liDeliv),
              };
            }),
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

    createdOrders.push(order);

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

    const sellerShareRupees = (sellerPayablePaise / 100).toFixed(2);
    const platformShareRupees = (platformCommissionPaise / 100).toFixed(2);
    const deliveryFeeRupees = (deliveryFeePaise / 100).toFixed(2);
    const totalPaidRupees = (totalPaidPaise / 100).toFixed(2);
    const firstProdName = lineItems[0].product.name;
    const totalQty = lineItems.reduce((s, l) => s + l.qty, 0);

    try {
      if (seller?.userId) {
        await sendNotification(
          createdDeliveryTask?.id || null,
          customerId,
          seller.userId,
          "marketplace_order_received",
          `New Order #${orderNumber}: ${firstProdName} (×${totalQty})`,
          `Total Paid: ₹${totalPaidRupees} | Your Share (${100 - commissionRate}%): ₹${sellerShareRupees} | Platform Commission (${commissionRate}%): ₹${platformShareRupees} | Delivery: ${
            resolvedDeliveryMode === "PLATFORM_HELPER"
              ? `HireBuddy Delivery (+2% = ₹${deliveryFeeRupees} task created)`
              : "Self Delivery by Seller"
          }`
        );
        emitToUser(seller.userId, "marketplace_order_received", {
          order,
          deliveryTask: createdDeliveryTask,
        });
      }

      await sendNotification(
        createdDeliveryTask?.id || null,
        customerId,
        adminUser.id,
        "marketplace_order_admin_alert",
        `Marketplace Order #${orderNumber} Placed`,
        `${totalQty} item(s) from ${seller.businessName}. Platform ${commissionRate}% = ₹${platformShareRupees}, Seller = ₹${sellerShareRupees}.${
          createdDeliveryTask
            ? ` Auto-created 2% Delivery Task (₹${deliveryFeeRupees}) on behalf of Admin.`
            : " Seller handling self-delivery."
        }`
      );

      await sendNotification(
        createdDeliveryTask?.id || null,
        adminUser.id,
        customerId,
        "marketplace_order_confirmed",
        `Order #${orderNumber} Confirmed!`,
        `Your order for "${firstProdName}" (₹${totalPaidRupees}) is confirmed.${
          createdDeliveryTask
            ? " A HireBuddy delivery task has been created and assigned to nearby Buddies."
            : ` ${seller.businessName} will dispatch your order directly.`
        }`
      );
    } catch (notifErr) {
      console.warn("Order notification warning:", notifErr?.message);
    }
  }

  const primaryOrder = createdOrders[0];
  const normalizedOrders = createdOrders.map(normalizeOrder);
  const totalCustomerPaidPaise = createdOrders.reduce((s, o) => s + o.totalPaidPaise, 0);
  const totalSellerSharePaise = createdOrders.reduce((s, o) => s + o.sellerPayablePaise, 0);
  const totalPlatformCommissionPaise = createdOrders.reduce(
    (s, o) => s + o.platformCommissionPaise,
    0
  );
  const totalDeliveryFeePaise = createdOrders.reduce((s, o) => s + o.deliveryFeePaise, 0);

  return {
    message:
      createdDeliveryTasks.length > 0
        ? `Order #${primaryOrder.orderNumber} placed! +2% HireBuddy Delivery Task created on behalf of Admin.`
        : `Order #${primaryOrder.orderNumber} placed! Seller & Admin have been notified.`,
    order: normalizedOrders[0],
    orders: normalizedOrders,
    cartGroupId,
    deliveryTask: createdDeliveryTasks[0] || null,
    deliveryTasks: createdDeliveryTasks,
    splitSummary: {
      totalCustomerPaidRupees: Math.round(totalCustomerPaidPaise / 100),
      sellerShareRupees: Math.round(totalSellerSharePaise / 100),
      platformCommissionRupees: Math.round(totalPlatformCommissionPaise / 100),
      deliveryCharge2PctRupees: Math.round(totalDeliveryFeePaise / 100),
      autoCreatedDeliveryTaskId: createdDeliveryTasks[0]?.id || null,
    },
    splitBreakdown: {
      productSubtotalPaise: totalCustomerPaidPaise,
      commissionRate: primaryOrder.platformCommissionRate,
      platformCommissionPaise: totalPlatformCommissionPaise,
      sellerShareRate: 100 - primaryOrder.platformCommissionRate,
      sellerPayablePaise: totalSellerSharePaise,
      deliveryMode: primaryOrder.deliveryMode,
      deliveryFeePaise: totalDeliveryFeePaise,
      totalPaidPaise: totalCustomerPaidPaise,
      settlementStatus: primaryOrder.settlementStatus,
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
 * Update Order Status by Seller, Helper, or Admin (with optional Pickup/Delivery OTP Handshake)
 */
export const updateMarketplaceOrderStatus = async (orderId, newStatus, options = {}) => {
  const existing = await prisma.marketplaceOrder.findUnique({
    where: { id: orderId },
  });
  if (!existing) {
    throw new Error("Order not found");
  }

  const expectedPickupOtp =
    existing.pickupOtp || deriveOrderOtp(existing.deliveryTaskId || existing.id, "pickup");
  const expectedDeliveryOtp =
    existing.deliveryOtp || deriveOrderOtp(existing.deliveryTaskId || existing.id, "complete");

  if (options?.otp) {
    const providedOtp = String(options.otp).trim();
    if (newStatus === "OUT_FOR_DELIVERY" && providedOtp !== expectedPickupOtp) {
      throw new Error("Invalid 4-digit Store Pickup OTP.");
    }
    if (newStatus === "DELIVERED" && providedOtp !== expectedDeliveryOtp) {
      throw new Error("Invalid 4-digit Customer Delivery OTP.");
    }
  }

  const updated = await prisma.marketplaceOrder.update({
    where: { id: orderId },
    data: { orderStatus: newStatus },
  });

  if (newStatus === "DELIVERED" && existing.deliveryTaskId) {
    try {
      await prisma.task.update({
        where: { id: existing.deliveryTaskId },
        data: { status: "COMPLETED" },
      });
    } catch (e) {
      // Task may have already been completed
    }
  }

  return normalizeOrder(updated);
};

/**
 * Rate a Marketplace Order (1–5 Stars + Review) & Update Product Rating Average
 */
export const rateMarketplaceOrder = async (customerId, orderId, { rating, review }) => {
  const parsedRating = Math.min(5, Math.max(1, Math.round(Number(rating || 5))));
  const existing = await prisma.marketplaceOrder.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!existing) {
    throw new Error("Marketplace order not found.");
  }

  if (customerId && existing.customerId !== customerId) {
    throw new Error("You can only rate your own marketplace order.");
  }

  const updatedOrder = await prisma.marketplaceOrder.update({
    where: { id: orderId },
    data: {
      buyerRating: parsedRating,
      buyerReview: review ? String(review).trim() : null,
    },
    include: {
      items: true,
      seller: true,
    },
  });

  for (const item of existing.items || []) {
    try {
      const prod = await prisma.product.findUnique({ where: { id: item.productId } });
      if (prod) {
        const oldCount = Number(prod.reviewCount || 10);
        const oldAvg = Number(prod.avgRating || 4.8);
        const newCount = oldCount + 1;
        const newAvg = Number(((oldAvg * oldCount + parsedRating) / newCount).toFixed(1));
        await prisma.product.update({
          where: { id: prod.id },
          data: { avgRating: newAvg, reviewCount: newCount },
        });
      }
    } catch (e) {}
  }

  return normalizeOrder(updatedOrder);
};

// ============================================================================
// ADMIN PROMOTIONAL POPUP AD (Product / Service Spotlight — Once Per Day After Login)
// ============================================================================

export const getOrCreatePromotionalPopupAd = async () => {
  await ensureInitialMeerutMarketplace();

  let existing = await prisma.promotionalPopupAd.findFirst({
    orderBy: { updatedAt: "desc" },
  });

  if (!existing) {
    const featuredProduct = await prisma.product.findFirst({
      where: { status: "PUBLISHED" },
      orderBy: { createdAt: "desc" },
    });

    const priceRupees = featuredProduct
      ? Math.round((featuredProduct.pricePaise || 249900) / 100)
      : 2499;
    const mrpRupees = featuredProduct?.mrpPaise
      ? Math.round(featuredProduct.mrpPaise / 100)
      : 3999;
    const discountPct =
      mrpRupees > priceRupees
        ? Math.round(((mrpRupees - priceRupees) / mrpRupees) * 100)
        : 38;
    const imgArr = Array.isArray(featuredProduct?.images) ? featuredProduct.images : [];

    existing = await prisma.promotionalPopupAd.create({
      data: {
        adType: "PRODUCT",
        targetProductId: featuredProduct?.id || null,
        badgeText: "✨ Featured Deal of the Day",
        title:
          featuredProduct?.name ||
          "Royal Banarasi Pure Silk Zari Border Saree",
        subtitle:
          featuredProduct?.description ||
          "Handwoven pure Katan silk saree with gold zari border • ⚡ 35–45 Min Local Buddy Delivery across Meerut",
        imageUrl: imgArr[0] || "/images/helper_task_cleaning.png",
        offerPriceRupees: priceRupees,
        mrpRupees,
        discountText: `${discountPct}% OFF Today`,
        ctaText: "Explore Offer →",
        ctaUrl: featuredProduct?.slug
          ? `/marketplace/${featuredProduct.slug}`
          : "/marketplace",
        delaySeconds: 6,
        frequency: "ONCE_PER_DAY",
        isActive: true,
        updatedByAdmin: "HireBuddy Admin",
      },
    });
  }

  return existing;
};

export const getActivePromotionalPopupAd = async () => {
  const ad = await getOrCreatePromotionalPopupAd();
  return {
    ...(ad || {}),
    ad: ad?.isActive ? ad : null,
    promoAd: ad?.isActive ? ad : null,
    config: ad,
  };
};

export const adminUpdatePromotionalPopupAd = async (payload = {}) => {
  const current = await getOrCreatePromotionalPopupAd();

  let resolvedTitle = payload.title ?? current.title;
  let resolvedSubtitle = payload.subtitle ?? current.subtitle;
  let resolvedImageUrl = payload.imageUrl ?? current.imageUrl;
  let resolvedOfferPrice =
    payload.offerPriceRupees !== undefined
      ? Number(payload.offerPriceRupees)
      : current.offerPriceRupees;
  let resolvedMrp =
    payload.mrpRupees !== undefined ? Number(payload.mrpRupees) : current.mrpRupees;
  let resolvedCtaUrl = payload.ctaUrl ?? current.ctaUrl;
  let resolvedCtaText = payload.ctaText ?? current.ctaText;
  let resolvedDiscountText = payload.discountText ?? current.discountText;

  const adType = payload.adType || current.adType || "PRODUCT";

  // If Admin selected a target Product and asked to auto-fill or didn't supply custom title
  if (adType === "PRODUCT" && payload.targetProductId && payload.autoFillFromTarget) {
    const prod = await prisma.product.findUnique({
      where: { id: payload.targetProductId },
    });
    if (prod) {
      const pRs = Math.round((prod.pricePaise || 0) / 100);
      const mRs = prod.mrpPaise ? Math.round(prod.mrpPaise / 100) : pRs;
      const dPct = mRs > pRs ? Math.round(((mRs - pRs) / mRs) * 100) : 0;
      const imgs = Array.isArray(prod.images) ? prod.images : [];
      resolvedTitle = prod.name;
      resolvedSubtitle = prod.description;
      resolvedImageUrl = imgs[0] || "/images/helper_task_cleaning.png";
      resolvedOfferPrice = pRs;
      resolvedMrp = mRs;
      resolvedDiscountText = dPct > 0 ? `${dPct}% OFF Today` : "Special Factory Price";
      resolvedCtaUrl = `/marketplace/${prod.slug || prod.id}`;
      resolvedCtaText = "Buy Now →";
    }
  }

  const updated = await prisma.promotionalPopupAd.update({
    where: { id: current.id },
    data: {
      adType,
      targetProductId: payload.targetProductId ?? current.targetProductId,
      targetServiceSlug: payload.targetServiceSlug ?? current.targetServiceSlug,
      badgeText: String(payload.badgeText ?? current.badgeText ?? "✨ Featured Deal").trim(),
      title: String(resolvedTitle || "Special Offer").trim(),
      subtitle: resolvedSubtitle ? String(resolvedSubtitle).trim() : null,
      imageUrl: resolvedImageUrl || "/images/service_home_cleaning.png",
      offerPriceRupees:
        resolvedOfferPrice !== null && resolvedOfferPrice !== undefined && !Number.isNaN(resolvedOfferPrice)
          ? Math.round(Number(resolvedOfferPrice))
          : null,
      mrpRupees:
        resolvedMrp !== null && resolvedMrp !== undefined && !Number.isNaN(resolvedMrp)
          ? Math.round(Number(resolvedMrp))
          : null,
      discountText: resolvedDiscountText ? String(resolvedDiscountText).trim() : null,
      ctaText: String(resolvedCtaText || "Explore Offer →").trim(),
      ctaUrl: String(resolvedCtaUrl || "/marketplace").trim(),
      delaySeconds: Math.min(60, Math.max(1, Number(payload.delaySeconds ?? current.delaySeconds ?? 6))),
      frequency: String(payload.frequency || current.frequency || "ONCE_PER_DAY"),
      isActive: payload.isActive !== undefined ? Boolean(payload.isActive) : current.isActive,
      updatedByAdmin: "HireBuddy Admin",
    },
  });

  return updated;
};

// ============================================================================
// ADMIN MARKETPLACE FUNCTIONS (Seller KYC, Product Verification & Commission, Daily NEFT)
// ============================================================================

export const getAdminMarketplaceOverview = async () => {
  await ensureInitialMeerutMarketplace();

  const [sellersRaw, productsRaw, ordersRaw, settlementsRaw, promoAd] = await Promise.all([
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
            commissionRate: true,
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
    getOrCreatePromotionalPopupAd(),
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

  return { sellers, products, orders, settlements, stats, promoAd };
};

/**
 * Admin verifies or rejects a Seller Profile & Bank Account
 */
export const adminVerifySeller = async (
  sellerId,
  { status: rawStatus, verificationStatus, bankVerified, commissionRate, commissionPct, notes }
) => {
  const incomingStatus = rawStatus || verificationStatus || "VERIFIED";
  const status = incomingStatus === "APPROVED" ? "VERIFIED" : incomingStatus;
  const rawComm = commissionRate ?? commissionPct;
  const parsedCommission =
    rawComm !== undefined && rawComm !== null
      ? Math.min(50, Math.max(0, Number(rawComm)))
      : undefined;

  const updated = await prisma.sellerProfile.update({
    where: { id: sellerId },
    data: {
      verificationStatus: status, // "VERIFIED" | "REJECTED" | "PENDING"
      bankVerified: bankVerified !== undefined ? Boolean(bankVerified) : status === "VERIFIED",
      ...(parsedCommission !== undefined ? { commissionRate: parsedCommission } : {}),
      verificationNotes: notes || null,
      verifiedAt: status === "VERIFIED" ? new Date() : null,
    },
  });

  if (parsedCommission !== undefined) {
    await prisma.product.updateMany({
      where: { sellerId },
      data: { commissionRate: parsedCommission },
    });
  }

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
