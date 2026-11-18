import prisma from "../utils/prisma.js";
import { sendNotification, notificationEvents } from "./notification.service.js";
import { emitToUser, emitBroadcast } from "../config/socket.config.js";
import { verifyPaymentSignature } from "./payment.service.js";

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
  if (seededCheckDone) {
    await ensureServiceSellersMigrated();
    return;
  }
  try {
    const existingCount = await prisma.product.count({
      where: { status: { not: "ARCHIVED" } },
    });
    if (existingCount >= 6) {
      seededCheckDone = true;
      await ensureServiceSellersMigrated();
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
  await ensureServiceSellersMigrated();
};

export const slugifyServiceGroup = (rawName = "", explicitSlug = "") => {
  const candidate = String(explicitSlug || rawName || "")
    .trim()
    .toLowerCase();
  if (
    candidate === "dry-cleaning" ||
    candidate === "dry clean" ||
    candidate === "dry cleaning" ||
    candidate === "garment dry cleaning"
  ) {
    return "dry-cleaning";
  }
  if (
    candidate === "laundry-wash-fold" ||
    candidate === "laundry" ||
    candidate === "wash & fold laundry" ||
    candidate === "laundry (wash, dry & fold)" ||
    candidate === "laundry by weight"
  ) {
    return "laundry-wash-fold";
  }
  if (
    candidate === "shoe-cleaning" ||
    candidate === "shoe cleaning" ||
    candidate === "shoe & sneaker cleaning spa"
  ) {
    return "shoe-cleaning";
  }
  if (
    candidate === "bag-cleaning" ||
    candidate === "bag cleaning" ||
    candidate === "bag, suitcase & wallet cleaning"
  ) {
    return "bag-cleaning";
  }
  if (
    candidate === "steam-ironing" ||
    candidate === "steam press" ||
    candidate === "steam ironing"
  ) {
    return "steam-ironing";
  }
  return (
    candidate
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "custom-service"
  );
};

let serviceSellersMigratedDone = false;
export const ensureServiceSellersMigrated = async () => {
  if (serviceSellersMigratedDone) return;
  try {
    // 1. Migrate Wash O Dry (if present or create if fresh DB) to SellerType = SERVICE with structured SellerService + SellerServiceOption rate cards
    let washODrySeller = await prisma.sellerProfile.findFirst({
      where: { businessName: { contains: "Wash O Dry" } },
      include: { services: true, products: true, orders: { include: { items: true } } },
    });

    if (!washODrySeller) {
      let washUser = await prisma.user.findFirst({
        where: {
          OR: [{ email: "washodry@hirebuddy.in" }, { phone: "9870133833" }],
        },
      });
      if (!washUser) {
        washUser = await prisma.user.create({
          data: {
            name: "Wash O Dry",
            email: "washodry@hirebuddy.in",
            phone: "9870133833",
            role: "SELLER",
            city: "Meerut",
            address: "Shop No 19, Ansal Town Centre, NH 58, Bypass, Modipuram, Meerut",
            idVerificationStatus: "VERIFIED",
          },
        });
      }
      washODrySeller = await prisma.sellerProfile.create({
        data: {
          userId: washUser.id,
          sellerType: "SERVICE",
          businessName: "Wash O Dry — Laundry | Dry Clean",
          businessCategory: "Laundry & Dry Cleaning",
          contactPersonName: "Wash O Dry Manager",
          contactPersonPhone: "9870133833",
          contactEmail: "washodry@hirebuddy.in",
          storeBannerUrl: "/images/wash_o_dry_banner.jpeg",
          rateCardDocUrl: "/images/wash_o_dry_ratecard.jpeg",
          pickupAddress: "Shop No 19, Ansal Town Centre, NH 58, Bypass, Modipuram, Meerut",
          pickupCity: "Meerut",
          pickupPincode: "250110",
          pickupLatitude: 29.0662,
          pickupLongitude: 77.7104,
          gstNumber: "09AABCW9870D1Z4",
          panNumber: "AABCW9870D",
          msmeNumber: "UDYAM-UP-55-0098701",
          bankAccountHolder: "Wash O Dry Laundry & Dry Clean",
          bankAccountNumber: "50200098701338",
          bankIfscCode: "HDFC0000254",
          bankName: "HDFC Bank",
          bankBranch: "Modipuram, Meerut",
          bankVerified: true,
          commissionRate: 15.0,
          verificationStatus: "VERIFIED",
          verifiedAt: new Date(),
        },
        include: { services: true, products: true, orders: { include: { items: true } } },
      });
    } else if (
      washODrySeller.sellerType !== "SERVICE" ||
      washODrySeller.businessCategory !== "Laundry & Dry Cleaning"
    ) {
      washODrySeller = await prisma.sellerProfile.update({
        where: { id: washODrySeller.id },
        data: {
          sellerType: "SERVICE",
          businessCategory: "Laundry & Dry Cleaning",
          storeBannerUrl: washODrySeller.storeBannerUrl || "/images/wash_o_dry_banner.jpeg",
          rateCardDocUrl: washODrySeller.rateCardDocUrl || "/images/wash_o_dry_ratecard.jpeg",
        },
        include: { services: true, products: true, orders: { include: { items: true } } },
      });
    }

    if ((washODrySeller.services || []).length === 0) {
      const washODryServicesSeed = [
        {
          name: "Dry Cleaning",
          serviceSlug: "dry-cleaning",
          slug: "wash-o-dry-dry-cleaning",
          category: "Laundry & Dry Cleaning",
          description:
            "Eco-friendly garment dry cleaning, stain treatment & steam pressing across Men's Wear, Women's Wear, Woolens & Household items. Flat 25% Off on 1st Order.",
          images: ["/images/wash_o_dry_banner.jpeg", "/images/wash_o_dry_ratecard.jpeg"],
          highlights: [
            "Gentle Solvent Dry Clean + Crisp Steam Press",
            "24–48 Hour Express Turnaround",
            "Doorstep Pickup & Delivery in Modipuram & Meerut",
          ],
          basePricePaise: 7500,
          mrpPaise: 10000,
          unit: "piece",
          turnaroundLabel: "24–48 Hours",
          commissionRate: washODrySeller.commissionRate || 15.0,
          defaultDeliveryMode: "PLATFORM_HELPER",
          status: "PUBLISHED",
          approvedAt: new Date(),
          approvedByAdmin: "HireBuddy Admin",
          options: [
            { groupName: "Men's Wear", title: "Shirt / T-Shirt", unit: "piece", pricePaise: 11000, mrpPaise: 14500, sortOrder: 1 },
            { groupName: "Men's Wear", title: "Trouser / Jeans", unit: "piece", pricePaise: 11000, mrpPaise: 14500, sortOrder: 2 },
            { groupName: "Men's Wear", title: "Coat / Blazer", unit: "piece", pricePaise: 27000, mrpPaise: 36000, sortOrder: 3 },
            { groupName: "Men's Wear", title: "Suit 2 Pcs", unit: "set", pricePaise: 38000, mrpPaise: 50000, sortOrder: 4 },
            { groupName: "Men's Wear", title: "Suit 3 Pcs", unit: "set", pricePaise: 49000, mrpPaise: 65000, sortOrder: 5 },
            { groupName: "Men's Wear", title: "Jacket", unit: "piece", pricePaise: 24000, mrpPaise: 32000, sortOrder: 6 },
            { groupName: "Men's Wear", title: "Kurta / Pyjama", unit: "piece", pricePaise: 11000, mrpPaise: 14500, sortOrder: 7 },
            { groupName: "Women's Wear", title: "Dupatta", unit: "piece", pricePaise: 7500, mrpPaise: 10000, sortOrder: 8 },
            { groupName: "Women's Wear", title: "Salwar / Palazzo", unit: "piece", pricePaise: 10000, mrpPaise: 13500, sortOrder: 9 },
            { groupName: "Women's Wear", title: "Kurta", unit: "piece", pricePaise: 11000, mrpPaise: 14500, sortOrder: 10 },
            { groupName: "Women's Wear", title: "Skirt", unit: "piece", pricePaise: 14500, mrpPaise: 19500, sortOrder: 11 },
            { groupName: "Women's Wear", title: "Dress / Gown", unit: "piece", pricePaise: 20500, mrpPaise: 27500, sortOrder: 12 },
            { groupName: "Women's Wear", title: "Saree / Blouse", unit: "piece", pricePaise: 24000, mrpPaise: 32000, sortOrder: 13 },
            { groupName: "Women's Wear", title: "Designer Lehenga", unit: "piece", pricePaise: 39000, mrpPaise: 52000, sortOrder: 14 },
            { groupName: "Woolen", title: "Sweater F/H Sleeves", unit: "piece", pricePaise: 17000, mrpPaise: 22500, sortOrder: 15 },
            { groupName: "Woolen", title: "Shawl / Pashmina", unit: "piece", pricePaise: 19000, mrpPaise: 25000, sortOrder: 16 },
            { groupName: "Woolen", title: "Sweatshirt", unit: "piece", pricePaise: 22000, mrpPaise: 29000, sortOrder: 17 },
            { groupName: "Woolen", title: "Jacket F/H Sleeves", unit: "piece", pricePaise: 24000, mrpPaise: 32000, sortOrder: 18 },
            { groupName: "Woolen", title: "Long Coat", unit: "piece", pricePaise: 40000, mrpPaise: 53000, sortOrder: 19 },
            { groupName: "Woolen", title: "Leather Jacket", unit: "piece", pricePaise: 43000, mrpPaise: 57000, sortOrder: 20 },
            { groupName: "Household", title: "Curtain Door / Window", unit: "piece", pricePaise: 15500, mrpPaise: 20500, sortOrder: 21 },
            { groupName: "Household", title: "Blanket Single (1/2 Ply)", unit: "piece", pricePaise: 28000, mrpPaise: 36500, sortOrder: 22 },
            { groupName: "Household", title: "Quilt Single / Double", unit: "piece", pricePaise: 28500, mrpPaise: 38500, sortOrder: 23 },
            { groupName: "Household", title: "Blanket Double (1/2 Ply)", unit: "piece", pricePaise: 38000, mrpPaise: 47500, sortOrder: 24 },
            { groupName: "Household", title: "Carpet Deep Dry Clean", unit: "sqft", pricePaise: 4500, mrpPaise: 6000, sortOrder: 25 },
          ],
        },
        {
          name: "Laundry (Wash, Dry & Fold)",
          serviceSlug: "laundry-wash-fold",
          slug: "wash-o-dry-laundry-wash-fold",
          category: "Laundry & Dry Cleaning",
          description:
            "Affordable everyday hygienic laundry care by weight — includes sorting, premium detergent wash, tumble dry & neat folding or steam press.",
          images: ["/images/wash_o_dry_banner.jpeg", "/images/wash_o_dry_ratecard.jpeg"],
          highlights: [
            "Separate Wash per Customer Load (Zero Mixing)",
            "24 Hour Express Laundry Service",
            "Free Pickup & Delivery at Your Convenience",
          ],
          basePricePaise: 13000,
          mrpPaise: 17500,
          unit: "kg",
          turnaroundLabel: "24 Hours Express",
          commissionRate: washODrySeller.commissionRate || 15.0,
          defaultDeliveryMode: "PLATFORM_HELPER",
          status: "PUBLISHED",
          approvedAt: new Date(),
          approvedByAdmin: "HireBuddy Admin",
          options: [
            { groupName: "Laundry by Weight", title: "Standard Laundry (Wash, Dry & Fold)", unit: "kg", pricePaise: 13000, mrpPaise: 17500, sortOrder: 1 },
            { groupName: "Laundry by Weight", title: "Premium Laundry (Wash, Dry & Steam Iron)", unit: "kg", pricePaise: 19000, mrpPaise: 25000, sortOrder: 2 },
          ],
        },
        {
          name: "Shoe & Sneaker Cleaning Spa",
          serviceSlug: "shoe-cleaning",
          slug: "wash-o-dry-shoe-cleaning",
          category: "Shoe & Bag Spa",
          description:
            "Professional shoe spa — deep foam cleaning, sole whitening, anti-bacterial deodorizing & conditioning for sneakers, leather, suede & boots.",
          images: ["/images/wash_o_dry_banner.jpeg", "/images/wash_o_dry_ratecard.jpeg"],
          highlights: [
            "Sole Un-Yellowing & Anti-Bacterial Deodorizing",
            "Safe Suede & Genuine Leather Conditioning",
          ],
          basePricePaise: 34000,
          mrpPaise: 45000,
          unit: "pair",
          turnaroundLabel: "48 Hours",
          commissionRate: washODrySeller.commissionRate || 15.0,
          defaultDeliveryMode: "PLATFORM_HELPER",
          status: "PUBLISHED",
          approvedAt: new Date(),
          approvedByAdmin: "HireBuddy Admin",
          options: [
            { groupName: "Shoe Cleaning", title: "Sports Shoes", unit: "pair", pricePaise: 34000, mrpPaise: 45000, sortOrder: 1 },
            { groupName: "Shoe Cleaning", title: "Canvas / Sneaker (Non-Leather)", unit: "pair", pricePaise: 34000, mrpPaise: 45000, sortOrder: 2 },
            { groupName: "Shoe Cleaning", title: "Formal Leather Shoes", unit: "pair", pricePaise: 39000, mrpPaise: 52000, sortOrder: 3 },
            { groupName: "Shoe Cleaning", title: "Suede Leather Shoes", unit: "pair", pricePaise: 48000, mrpPaise: 64000, sortOrder: 4 },
            { groupName: "Shoe Cleaning", title: "Boots", unit: "pair", pricePaise: 53000, mrpPaise: 70500, sortOrder: 5 },
          ],
        },
        {
          name: "Bag, Suitcase & Wallet Cleaning",
          serviceSlug: "bag-cleaning",
          slug: "wash-o-dry-bag-cleaning",
          category: "Shoe & Bag Spa",
          description:
            "Deep interior & exterior spa cleaning, stain removal, and leather nourishment for handbags, wallets, canvas bags, and travel suitcases.",
          images: ["/images/wash_o_dry_banner.jpeg", "/images/wash_o_dry_ratecard.jpeg"],
          highlights: [
            "Color-Safe Stain Removal & Hardware Polishing",
            "Interior Lining Sanitization",
          ],
          basePricePaise: 22000,
          mrpPaise: 29500,
          unit: "piece",
          turnaroundLabel: "48 Hours",
          commissionRate: washODrySeller.commissionRate || 15.0,
          defaultDeliveryMode: "PLATFORM_HELPER",
          status: "PUBLISHED",
          approvedAt: new Date(),
          approvedByAdmin: "HireBuddy Admin",
          options: [
            { groupName: "Bag Cleaning", title: "Wallet", unit: "piece", pricePaise: 22000, mrpPaise: 29500, sortOrder: 1 },
            { groupName: "Bag Cleaning", title: "Suitcase / Trolley Bag", unit: "piece", pricePaise: 24000, mrpPaise: 32000, sortOrder: 2 },
            { groupName: "Bag Cleaning", title: "Canvas / Jute / Cloth Bag", unit: "piece", pricePaise: 31000, mrpPaise: 41000, sortOrder: 3 },
            { groupName: "Bag Cleaning", title: "Handbag (Standard)", unit: "piece", pricePaise: 43000, mrpPaise: 57000, sortOrder: 4 },
            { groupName: "Bag Cleaning", title: "Handbag (Premium Leather)", unit: "piece", pricePaise: 63500, mrpPaise: 84000, sortOrder: 5 },
          ],
        },
      ];

      let createdBagSvc = null;
      let createdWalletOpt = null;

      for (const svcData of washODryServicesSeed) {
        const { options, ...rest } = svcData;
        const createdSvc = await prisma.sellerService.upsert({
          where: { slug: rest.slug },
          update: {},
          create: {
            ...rest,
            sellerId: washODrySeller.id,
            options: {
              create: options,
            },
          },
          include: { options: true },
        });
        if (rest.serviceSlug === "bag-cleaning") {
          createdBagSvc = createdSvc;
          createdWalletOpt = createdSvc.options.find((o) => o.title === "Wallet") || createdSvc.options[0];
        }
      }

      // Archive legacy Wash O Dry physical Product rows so they don't mix into physical Products
      await prisma.product.updateMany({
        where: { sellerId: washODrySeller.id, status: "PUBLISHED" },
        data: { status: "ARCHIVED" },
      });

      // Migrate existing Wash O Dry orders (like HB-MRT-782878) to SERVICE orderType & IN_PROCESS status
      for (const ord of washODrySeller.orders || []) {
        const nextStatus = ord.orderStatus === "PACKED" ? "IN_PROCESS" : ord.orderStatus;
        await prisma.marketplaceOrder.update({
          where: { id: ord.id },
          data: {
            orderType: "SERVICE",
            orderStatus: nextStatus,
            pickupTimeSlot: ord.pickupTimeSlot || "10:00 AM – 01:00 PM",
          },
        });
        if (createdBagSvc && (ord.items || []).length > 0) {
          for (const item of ord.items) {
            if (!item.sellerServiceId) {
              await prisma.marketplaceOrderItem.update({
                where: { id: item.id },
                data: {
                  sellerServiceId: createdBagSvc.id,
                  serviceOptionId: createdWalletOpt?.id || null,
                },
              });
            }
          }
        }
      }
    } else {
      // Ensure any remaining Wash O Dry orders are marked as SERVICE and PACKED -> IN_PROCESS
      await prisma.marketplaceOrder.updateMany({
        where: { sellerId: washODrySeller.id, orderType: "PRODUCT" },
        data: { orderType: "SERVICE" },
      });
      await prisma.marketplaceOrder.updateMany({
        where: { sellerId: washODrySeller.id, orderStatus: "PACKED" },
        data: { orderStatus: "IN_PROCESS" },
      });
    }

    // 2. Ensure a 2nd verified Dry Cleaner Seller exists so multi-seller Dry Cleaning rate comparison works out of the box
    let secondDryCleanUser = await prisma.user.findFirst({
      where: { email: "crystal.dryclean@hirebuddy.com" },
    });
    if (!secondDryCleanUser) {
      secondDryCleanUser = await prisma.user.create({
        data: {
          name: "Crystal Care Dry Cleaners",
          email: "crystal.dryclean@hirebuddy.com",
          phone: "9897044556",
          role: "SELLER",
          city: "Meerut",
          address: "Shop 8, Abu Lane Market, Meerut Cantt, UP",
          idVerificationStatus: "VERIFIED",
        },
      });
    }

    let secondDryCleanProfile = await prisma.sellerProfile.findUnique({
      where: { userId: secondDryCleanUser.id },
      include: { services: true },
    });
    if (!secondDryCleanProfile) {
      secondDryCleanProfile = await prisma.sellerProfile.create({
        data: {
          userId: secondDryCleanUser.id,
          sellerType: "SERVICE",
          businessName: "Crystal Care Dry Cleaners — Abu Lane",
          businessCategory: "Laundry & Dry Cleaning",
          contactPersonName: "Vikram Sethi",
          contactPersonPhone: "9897044556",
          contactEmail: "crystal.dryclean@hirebuddy.com",
          storeBannerUrl: "/images/service_home_cleaning.png",
          pickupAddress: "Shop 8, Abu Lane Market, Meerut Cantt, UP",
          pickupCity: "Meerut",
          pickupPincode: "250001",
          pickupLatitude: 28.9938,
          pickupLongitude: 77.7052,
          gstNumber: "09AABCC4455K1Z2",
          panNumber: "AABCC4455K",
          msmeNumber: "UDYAM-UP-55-0044556",
          bankAccountHolder: "Crystal Care Dry Cleaners",
          bankAccountNumber: "50200044556677",
          bankIfscCode: "HDFC0000254",
          bankName: "HDFC Bank",
          bankBranch: "Abu Lane, Meerut",
          bankVerified: true,
          commissionRate: 15.0,
          verificationStatus: "VERIFIED",
          verifiedAt: new Date(),
        },
        include: { services: true },
      });
    }

    if ((secondDryCleanProfile.services || []).length === 0) {
      await prisma.sellerService.upsert({
        where: { slug: "crystal-care-dry-cleaning" },
        update: {},
        create: {
          sellerId: secondDryCleanProfile.id,
          name: "Dry Cleaning",
          serviceSlug: "dry-cleaning",
          slug: "crystal-care-dry-cleaning",
          category: "Laundry & Dry Cleaning",
          description:
            " Hydrocarbon & perc-free delicate dry cleaning in Abu Lane, Meerut. Custom per-garment rates for daily wear, wedding suits, silk sarees & blankets.",
          images: ["/images/service_home_cleaning.png"],
          highlights: [
            "German Hydrocarbon Solvent Care",
            "36–48 Hour Standard Delivery across Meerut",
            "Zari & Wedding Outfit Safe Packaging",
          ],
          basePricePaise: 9500,
          mrpPaise: 13000,
          unit: "piece",
          turnaroundLabel: "36–48 Hours",
          commissionRate: 15.0,
          defaultDeliveryMode: "SELLER_SELF",
          status: "PUBLISHED",
          approvedAt: new Date(),
          approvedByAdmin: "HireBuddy Admin",
          options: {
            create: [
              { groupName: "Men's Wear", title: "Shirt / T-Shirt", unit: "piece", pricePaise: 9500, mrpPaise: 13000, sortOrder: 1 },
              { groupName: "Men's Wear", title: "Trouser / Jeans", unit: "piece", pricePaise: 9900, mrpPaise: 13000, sortOrder: 2 },
              { groupName: "Men's Wear", title: "Coat / Blazer", unit: "piece", pricePaise: 25000, mrpPaise: 33000, sortOrder: 3 },
              { groupName: "Men's Wear", title: "Suit 2 Pcs", unit: "set", pricePaise: 35000, mrpPaise: 46000, sortOrder: 4 },
              { groupName: "Men's Wear", title: "Suit 3 Pcs", unit: "set", pricePaise: 45000, mrpPaise: 59000, sortOrder: 5 },
              { groupName: "Women's Wear", title: "Kurta / Kurti", unit: "piece", pricePaise: 9900, mrpPaise: 13500, sortOrder: 6 },
              { groupName: "Women's Wear", title: "Saree / Blouse", unit: "piece", pricePaise: 22000, mrpPaise: 30000, sortOrder: 7 },
              { groupName: "Women's Wear", title: "Designer Lehenga", unit: "piece", pricePaise: 36000, mrpPaise: 48000, sortOrder: 8 },
              { groupName: "Woolen", title: "Sweater / Cardigan", unit: "piece", pricePaise: 16000, mrpPaise: 21000, sortOrder: 9 },
              { groupName: "Woolen", title: "Jacket / Overcoat", unit: "piece", pricePaise: 26000, mrpPaise: 34000, sortOrder: 10 },
              { groupName: "Household", title: "Blanket Single", unit: "piece", pricePaise: 26000, mrpPaise: 34000, sortOrder: 11 },
              { groupName: "Household", title: "Blanket Double / Heavy Quilt", unit: "piece", pricePaise: 34900, mrpPaise: 45000, sortOrder: 12 },
            ],
          },
        },
      });

      await prisma.sellerService.upsert({
        where: { slug: "crystal-care-laundry-wash-fold" },
        update: {},
        create: {
          sellerId: secondDryCleanProfile.id,
          name: "Laundry (Wash, Dry & Fold)",
          serviceSlug: "laundry-wash-fold",
          slug: "crystal-care-laundry-wash-fold",
          category: "Laundry & Dry Cleaning",
          description: "Hygienic wash, tumble dry & fold or steam press in Meerut Cantt & Abu Lane.",
          images: ["/images/service_home_cleaning.png"],
          highlights: ["Antiseptic Rinse Included", "Same-Day / Next-Day Options"],
          basePricePaise: 11900,
          mrpPaise: 16000,
          unit: "kg",
          turnaroundLabel: "24–36 Hours",
          commissionRate: 15.0,
          defaultDeliveryMode: "SELLER_SELF",
          status: "PUBLISHED",
          approvedAt: new Date(),
          approvedByAdmin: "HireBuddy Admin",
          options: {
            create: [
              { groupName: "Laundry by Weight", title: "Standard Wash, Dry & Fold", unit: "kg", pricePaise: 11900, mrpPaise: 16000, sortOrder: 1 },
              { groupName: "Laundry by Weight", title: "Premium Wash + Steam Press", unit: "kg", pricePaise: 17500, mrpPaise: 23000, sortOrder: 2 },
            ],
          },
        },
      });
    }

    serviceSellersMigratedDone = true;
  } catch (err) {
    console.warn("ensureServiceSellersMigrated warning:", err?.message);
  }
};

const normalizeSellerProfile = (s) => {
  if (!s) return null;
  const commissionPct = Number(s.commissionRate ?? 15.0);
  const sellerType = s.sellerType === "SERVICE" ? "SERVICE" : "PRODUCT";
  return {
    ...s,
    sellerType,
    isServiceSeller: sellerType === "SERVICE",
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

const normalizeServiceOption = (opt) => {
  if (!opt) return null;
  const priceRupees = Math.round((opt.pricePaise || 0) / 100);
  const mrpRupees = opt.mrpPaise ? Math.round(opt.mrpPaise / 100) : priceRupees;
  return {
    ...opt,
    groupName: opt.groupName || "Standard Options",
    price: priceRupees,
    priceRupees,
    mrp: mrpRupees,
    mrpRupees,
  };
};

const normalizeSellerService = (svc) => {
  if (!svc) return null;
  const optionsArr = Array.isArray(svc.options)
    ? svc.options.filter((o) => o && o.isActive !== false).map(normalizeServiceOption)
    : [];
  const lowestOptPrice =
    optionsArr.length > 0
      ? Math.min(...optionsArr.map((o) => o.priceRupees).filter((n) => n > 0))
      : null;
  const basePriceRupees =
    lowestOptPrice && Number.isFinite(lowestOptPrice)
      ? lowestOptPrice
      : Math.round((svc.basePricePaise || 0) / 100);
  const mrpRupees = svc.mrpPaise ? Math.round(svc.mrpPaise / 100) : basePriceRupees;
  const imagesArr =
    Array.isArray(svc.images) && svc.images.length > 0
      ? svc.images
      : [svc.seller?.storeBannerUrl || "/images/service_home_cleaning.png"];
  const highlightsArr = Array.isArray(svc.highlights) ? svc.highlights.filter(Boolean) : [];
  const effectiveCommission = Number(svc.seller?.commissionRate ?? svc.commissionRate ?? 15.0);
  const isPlatformDelivery = svc.defaultDeliveryMode === "PLATFORM_HELPER";

  const groupedOptions = {};
  for (const opt of optionsArr) {
    const grp = opt.groupName || "Standard Options";
    if (!groupedOptions[grp]) groupedOptions[grp] = [];
    groupedOptions[grp].push(opt);
  }

  return {
    ...svc,
    itemType: "SERVICE",
    title: svc.name,
    price: basePriceRupees,
    priceRupees: basePriceRupees,
    startingPriceRupees: basePriceRupees,
    mrp: mrpRupees,
    mrpRupees,
    image: imagesArr[0] || "/images/service_home_cleaning.png",
    images: imagesArr,
    options: optionsArr,
    groupedOptions,
    optionsCount: optionsArr.length,
    highlights: highlightsArr,
    avgRating: Number(svc.avgRating ?? 4.8),
    reviewCount: Number(svc.reviewCount ?? 16),
    turnaroundLabel: svc.turnaroundLabel || "24–48 Hours",
    expressDeliveryEta: isPlatformDelivery
      ? "🚚 HireBuddy Pickup & Drop"
      : "🏪 Direct Store Pickup & Drop",
    commissionRate: effectiveCommission,
    commissionPct: effectiveCommission,
    approvalStatus: svc.status,
    isPublished: svc.status === "PUBLISHED",
    deliveryByPlatform: isPlatformDelivery,
    allowPlatformDelivery: isPlatformDelivery,
    seller: svc.seller ? normalizeSellerProfile(svc.seller) : undefined,
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
    itemType: "PRODUCT",
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

const ORDER_STATUS_LABELS = {
  PLACED: "Placed",
  CONFIRMED: "Confirmed",
  PACKED: "Packed & Ready",
  PICKED_UP: "Picked Up from Customer",
  IN_PROCESS: "In Process (Cleaning / Service)",
  READY_FOR_DELIVERY: "Ready for Delivery",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered / Completed",
  CANCELLED: "Cancelled",
};

const normalizeOrder = (o) => {
  if (!o) return null;
  const orderType =
    o.orderType === "SERVICE" || o.seller?.sellerType === "SERVICE" ? "SERVICE" : "PRODUCT";
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
    orderType,
    orderStatusLabel: ORDER_STATUS_LABELS[o.orderStatus] || o.orderStatus,
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
 * Onboard or update Seller Profile (Supports both PRODUCT Sellers and SERVICE Sellers)
 */
export const onboardOrUpdateSeller = async (userId, data) => {
  const {
    sellerType: rawSellerType,
    businessName,
    businessCategory,
    contactPersonName,
    contactPersonPhone: rawPhone,
    contactPhone,
    contactEmail,
    storeBannerUrl,
    rateCardDocUrl,
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
      "Business Name, Contact Person, Pickup/Shop Address, PAN Number, and Bank Account + IFSC details are required for Seller Onboarding."
    );
  }

  const existingProfile = await prisma.sellerProfile.findUnique({
    where: { userId },
  });

  const resolvedSellerType =
    rawSellerType === "SERVICE" || rawSellerType === "PRODUCT"
      ? rawSellerType
      : existingProfile?.sellerType || "PRODUCT";

  // If PRODUCT seller & category is Food / Consumables, ensure FSSAI number is provided
  const isFoodCategory =
    resolvedSellerType === "PRODUCT" &&
    (String(businessCategory || "").toLowerCase().includes("food") ||
      String(businessCategory || "").toLowerCase().includes("sweet") ||
      String(businessCategory || "").toLowerCase().includes("gajak") ||
      String(businessCategory || "").toLowerCase().includes("bakery"));

  if (isFoodCategory && !fssaiNumber) {
    throw new Error(
      "FSSAI License Number is mandatory for Food, Gajak, Sweets & Consumable manufacturers."
    );
  }

  const defaultCategory =
    resolvedSellerType === "SERVICE" ? "Laundry & Dry Cleaning" : "General Manufacturing";

  const payload = {
    sellerType: resolvedSellerType,
    businessName: String(businessName).trim(),
    businessCategory: String(businessCategory || defaultCategory).trim(),
    contactPersonName: String(contactPersonName).trim(),
    contactPersonPhone: String(contactPersonPhone).trim(),
    contactEmail: contactEmail ? String(contactEmail).trim() : null,
    ...(storeBannerUrl !== undefined ? { storeBannerUrl: storeBannerUrl || null } : {}),
    ...(rateCardDocUrl !== undefined ? { rateCardDocUrl: rateCardDocUrl || null } : {}),
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

  // Upgrade customer account role to SELLER (without overriding ADMIN or HELPER)
  try {
    await prisma.user.updateMany({
      where: {
        id: userId,
        OR: [{ role: "USER" }, { role: null }],
      },
      data: { role: "SELLER" },
    });
  } catch (e) {
    console.warn("Seller role upgrade warning:", e?.message);
  }

  // Notify Admin about Seller Onboarding submission
  try {
    const adminUser = await getOrCreatePlatformAdminUser();
    const typeLabel = resolvedSellerType === "SERVICE" ? "Service Partner" : "Product Manufacturer";
    await sendNotification(
      null,
      userId,
      adminUser.id,
      "seller_onboarding",
      `New ${typeLabel} Onboarding: ${sellerProfile.businessName}`,
      `${sellerProfile.contactPersonName} (${sellerProfile.pickupCity}) submitted KYC, GST/PAN & Bank details as a ${typeLabel}.`
    );
  } catch (e) {
    console.warn("Seller onboarding admin notification warning:", e?.message);
  }

  return normalizeSellerProfile(sellerProfile);
};

/**
 * Get logged-in user's Seller Profile along with their products, services, orders, and settlements
 */
export const getMySellerDashboard = async (userId) => {
  await ensureInitialMeerutMarketplace();

  const profile = await prisma.sellerProfile.findUnique({
    where: { userId },
    include: {
      products: {
        where: { status: { not: "ARCHIVED" } },
        orderBy: { createdAt: "desc" },
      },
      services: {
        where: { status: { not: "ARCHIVED" } },
        include: {
          options: {
            where: { isActive: true },
            orderBy: { sortOrder: "asc" },
          },
        },
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
    return {
      onboarded: false,
      profile: null,
      products: [],
      services: [],
      orders: [],
      settlements: [],
      metrics: null,
    };
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

  const sellerMeta = normalizeSellerProfile(profile);
  const normalizedProducts = (profile.products || []).map((p) =>
    normalizeProduct({ ...p, seller: profile })
  );
  const normalizedServices = (profile.services || []).map((svc) =>
    normalizeSellerService({ ...svc, seller: profile })
  );
  const normalizedOrders = (profile.orders || []).map((ord) =>
    normalizeOrder({ ...ord, seller: profile })
  );
  const normalizedSettlements = (profile.settlements || []).map((b) =>
    normalizeSettlementBatch({ ...b, seller: profile })
  );
  const normalizedProfile = {
    ...sellerMeta,
    products: normalizedProducts,
    services: normalizedServices,
    orders: normalizedOrders,
    settlements: normalizedSettlements,
  };

  const publishedProductsCount = normalizedProducts.filter((p) => p.status === "PUBLISHED").length;
  const pendingProductsCount = normalizedProducts.filter((p) => p.status === "PENDING_APPROVAL").length;
  const publishedServicesCount = normalizedServices.filter((s) => s.status === "PUBLISHED").length;
  const pendingServicesCount = normalizedServices.filter((s) => s.status === "PENDING_APPROVAL").length;

  return {
    onboarded: true,
    profile: normalizedProfile,
    sellerProfile: normalizedProfile,
    products: normalizedProducts,
    services: normalizedServices,
    orders: normalizedOrders,
    settlements: normalizedSettlements,
    metrics: {
      sellerType: sellerMeta.sellerType,
      totalProducts: normalizedProducts.length,
      publishedProductsCount,
      pendingProductsCount,
      totalServices: normalizedServices.length,
      publishedServicesCount,
      pendingServicesCount,
      totalOrders: normalizedOrders.length,
      totalSellerEarnedRupees: Math.round(totalSellerNetPaise / 100),
      pendingNeftRupees: Math.round(unsettledPaise / 100),
    },
    stats: {
      sellerType: sellerMeta.sellerType,
      totalProducts: normalizedProducts.length,
      publishedProducts: publishedProductsCount,
      pendingProducts: pendingProductsCount,
      totalServices: normalizedServices.length,
      publishedServices: publishedServicesCount,
      pendingServices: pendingServicesCount,
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
 * Normalize incoming service options array from Seller Hub Service Builder
 */
const parseIncomingServiceOptions = (rawOptions = [], defaultUnit = "piece", fallbackPriceRupees = 99) => {
  const arr = Array.isArray(rawOptions) ? rawOptions : [];
  const cleaned = arr
    .filter((o) => o && typeof o === "object" && String(o.title || o.name || "").trim())
    .map((o, idx) => {
      const priceRupees = Math.max(
        1,
        Number(
          o.priceRupees ??
            o.price ??
            (o.pricePaise ? Math.round(o.pricePaise / 100) : fallbackPriceRupees)
        ) || fallbackPriceRupees
      );
      const mrpRupees = Math.max(
        priceRupees,
        Number(
          o.mrpRupees ??
            o.mrp ??
            (o.mrpPaise ? Math.round(o.mrpPaise / 100) : Math.round(priceRupees * 1.25))
        ) || priceRupees
      );
      return {
        id: o.id ? String(o.id) : undefined,
        groupName: String(o.groupName || "General").trim(),
        title: String(o.title || o.name).trim(),
        description: o.description ? String(o.description).trim() : null,
        unit: String(o.unit || defaultUnit || "piece").trim(),
        pricePaise: Math.round(priceRupees * 100),
        mrpPaise: Math.round(mrpRupees * 100),
        isActive: o.isActive !== false,
        sortOrder: idx + 1,
      };
    });

  return cleaned;
};

/**
 * Seller creates a new Service (e.g., "Dry Cleaning", "Laundry (Wash, Dry & Fold)", or Custom Service)
 * with Seller-defined per-option rates (`SellerServiceOption`).
 */
export const createSellerService = async (userId, data) => {
  let seller = await prisma.sellerProfile.findUnique({
    where: { userId },
    include: { products: { where: { status: { not: "ARCHIVED" } } } },
  });

  if (!seller) {
    throw new Error("Please complete Seller Onboarding (KYC & Bank Details) before creating services.");
  }

  if (seller.sellerType !== "SERVICE") {
    if ((seller.products || []).length === 0) {
      seller = await prisma.sellerProfile.update({
        where: { id: seller.id },
        data: { sellerType: "SERVICE" },
      });
    } else {
      throw new Error(
        "Your account is configured as a Product Seller. Switch Seller Type to 'Service Seller' in Onboarding Profile to offer services."
      );
    }
  }

  const {
    name: rawName,
    title,
    serviceSlug: rawServiceSlug,
    description,
    category,
    images,
    imageUrl,
    highlights,
    basePriceRupees,
    priceRupees,
    mrpRupees,
    unit = "piece",
    turnaroundLabel = "24–48 Hours",
    defaultDeliveryMode,
    allowPlatformDelivery,
    options: rawOptions = [],
  } = data;

  const name = String(rawName || title || "").trim();
  if (!name) {
    throw new Error("Service Name (e.g., Dry Cleaning) is required.");
  }

  const fallbackPrice = Number(basePriceRupees ?? priceRupees ?? 99) || 99;
  const parsedOptions = parseIncomingServiceOptions(rawOptions, unit, fallbackPrice);

  if (parsedOptions.length === 0) {
    throw new Error("Please add at least one Service Option with your rate (e.g., Shirt — ₹99).");
  }

  const lowestOptionPaise = Math.min(...parsedOptions.map((o) => o.pricePaise));
  const lowestMrpPaise = Math.min(...parsedOptions.map((o) => o.mrpPaise || o.pricePaise));
  const resolvedMrpPaise = mrpRupees
    ? Math.max(lowestOptionPaise, Math.round(Number(mrpRupees) * 100))
    : Math.max(lowestOptionPaise, lowestMrpPaise);

  const serviceSlug = slugifyServiceGroup(name, rawServiceSlug);
  const sellerSlugPart = seller.businessName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 28);
  const uniqueSlug = `${sellerSlugPart}-${serviceSlug}-${Date.now().toString().slice(-5)}`;

  const resolvedImages = Array.isArray(images) && images.length > 0
    ? images.filter(Boolean)
    : imageUrl
      ? [imageUrl]
      : [seller.storeBannerUrl || "/images/service_home_cleaning.png"];

  const resolvedHighlights = Array.isArray(highlights)
    ? highlights.map((h) => String(h || "").trim()).filter(Boolean)
    : typeof highlights === "string" && highlights.trim()
      ? highlights.split(",").map((h) => h.trim()).filter(Boolean)
      : [
          `Turnaround: ${turnaroundLabel}`,
          "Verified Local Service Partner",
          "Transparent Option-Wise Pricing",
        ];

  const resolvedDeliveryMode =
    defaultDeliveryMode === "PLATFORM_HELPER" ||
    defaultDeliveryMode === "PLATFORM_DELIVERY" ||
    allowPlatformDelivery === true
      ? "PLATFORM_HELPER"
      : "SELLER_SELF";

  const sellerCommissionRate = Number(seller.commissionRate || 15.0);
  // Verified Service Partners get immediate publishing or Admin can verify pending sellers' services
  const initialStatus = seller.verificationStatus === "VERIFIED" ? "PUBLISHED" : "PENDING_APPROVAL";

  const created = await prisma.sellerService.create({
    data: {
      sellerId: seller.id,
      name,
      serviceSlug,
      slug: uniqueSlug,
      description: String(
        description ||
          `${name} by ${seller.businessName} (${seller.pickupCity}). Choose options and customize quantities directly.`
      ).trim(),
      category: String(category || seller.businessCategory || "Laundry & Dry Cleaning").trim(),
      images: resolvedImages,
      highlights: resolvedHighlights,
      basePricePaise: lowestOptionPaise,
      mrpPaise: resolvedMrpPaise,
      unit: String(unit || "piece").trim(),
      turnaroundLabel: String(turnaroundLabel || "24–48 Hours").trim(),
      commissionRate: sellerCommissionRate,
      defaultDeliveryMode: resolvedDeliveryMode,
      status: initialStatus,
      approvedAt: initialStatus === "PUBLISHED" ? new Date() : null,
      approvedByAdmin: initialStatus === "PUBLISHED" ? "Verified Partner Auto-Publish" : null,
      options: {
        create: parsedOptions.map((opt) => ({
          groupName: opt.groupName,
          title: opt.title,
          description: opt.description,
          unit: opt.unit,
          pricePaise: opt.pricePaise,
          mrpPaise: opt.mrpPaise,
          isActive: true,
          sortOrder: opt.sortOrder,
        })),
      },
    },
    include: {
      options: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
      seller: true,
    },
  });

  try {
    const adminUser = await getOrCreatePlatformAdminUser();
    await sendNotification(
      null,
      userId,
      adminUser.id,
      "service_created_by_seller",
      `Service ${initialStatus === "PUBLISHED" ? "Published" : "Pending Approval"}: ${created.name}`,
      `${seller.businessName} created "${created.name}" with ${parsedOptions.length} option(s) starting at ₹${Math.round(lowestOptionPaise / 100)}.`
    );
  } catch (e) {
    console.warn("Admin service notification warning:", e?.message);
  }

  return normalizeSellerService(created);
};

/**
 * Seller updates their Service & Option Rates immediately (preserving PUBLISHED status if already approved)
 */
export const updateSellerService = async (userId, serviceId, data) => {
  const seller = await prisma.sellerProfile.findUnique({ where: { userId } });
  if (!seller) {
    throw new Error("Seller profile not found.");
  }

  const existing = await prisma.sellerService.findUnique({
    where: { id: serviceId },
    include: { options: true },
  });
  if (!existing || existing.sellerId !== seller.id) {
    throw new Error("Service not found or you do not have permission to edit it.");
  }

  const {
    name: rawName,
    serviceSlug: rawServiceSlug,
    description,
    category,
    images,
    imageUrl,
    highlights,
    unit,
    turnaroundLabel,
    defaultDeliveryMode,
    allowPlatformDelivery,
    options: rawOptions,
  } = data;

  const updatedName = rawName ? String(rawName).trim() : existing.name;
  const updatedUnit = unit ? String(unit).trim() : existing.unit;
  const parsedOptions = Array.isArray(rawOptions)
    ? parseIncomingServiceOptions(
        rawOptions,
        updatedUnit,
        Math.round((existing.basePricePaise || 9900) / 100)
      )
    : null;

  if (parsedOptions && parsedOptions.length === 0) {
    throw new Error("A service must keep at least one active option with a valid rate.");
  }

  const lowestOptionPaise = parsedOptions
    ? Math.min(...parsedOptions.map((o) => o.pricePaise))
    : existing.basePricePaise;
  const lowestMrpPaise = parsedOptions
    ? Math.min(...parsedOptions.map((o) => o.mrpPaise || o.pricePaise))
    : existing.mrpPaise || existing.basePricePaise;

  const resolvedDeliveryMode =
    defaultDeliveryMode !== undefined || allowPlatformDelivery !== undefined
      ? defaultDeliveryMode === "PLATFORM_HELPER" ||
        defaultDeliveryMode === "PLATFORM_DELIVERY" ||
        allowPlatformDelivery === true
        ? "PLATFORM_HELPER"
        : "SELLER_SELF"
      : existing.defaultDeliveryMode;

  const resolvedImages =
    Array.isArray(images) && images.length > 0
      ? images.filter(Boolean)
      : imageUrl
        ? [imageUrl]
        : existing.images;

  const resolvedHighlights =
    highlights !== undefined
      ? Array.isArray(highlights)
        ? highlights.map((h) => String(h || "").trim()).filter(Boolean)
        : String(highlights || "")
            .split(",")
            .map((h) => h.trim())
            .filter(Boolean)
      : existing.highlights;

  const updated = await prisma.$transaction(async (tx) => {
    if (parsedOptions) {
      const incomingIds = new Set(parsedOptions.map((o) => o.id).filter(Boolean));
      const existingIds = new Set((existing.options || []).map((o) => o.id));

      // Soft-deactivate removed options so historical order items remain intact
      const toDeactivate = [...existingIds].filter((id) => !incomingIds.has(id));
      if (toDeactivate.length > 0) {
        await tx.sellerServiceOption.updateMany({
          where: { id: { in: toDeactivate }, sellerServiceId: existing.id },
          data: { isActive: false },
        });
      }

      for (const opt of parsedOptions) {
        if (opt.id && existingIds.has(opt.id)) {
          await tx.sellerServiceOption.update({
            where: { id: opt.id },
            data: {
              groupName: opt.groupName,
              title: opt.title,
              description: opt.description,
              unit: opt.unit,
              pricePaise: opt.pricePaise,
              mrpPaise: opt.mrpPaise,
              isActive: true,
              sortOrder: opt.sortOrder,
            },
          });
        } else {
          await tx.sellerServiceOption.create({
            data: {
              sellerServiceId: existing.id,
              groupName: opt.groupName,
              title: opt.title,
              description: opt.description,
              unit: opt.unit,
              pricePaise: opt.pricePaise,
              mrpPaise: opt.mrpPaise,
              isActive: true,
              sortOrder: opt.sortOrder,
            },
          });
        }
      }
    }

    return tx.sellerService.update({
      where: { id: existing.id },
      data: {
        name: updatedName,
        serviceSlug: rawName || rawServiceSlug
          ? slugifyServiceGroup(updatedName, rawServiceSlug)
          : existing.serviceSlug,
        description: description !== undefined ? String(description).trim() : existing.description,
        category: category !== undefined ? String(category).trim() : existing.category,
        images: resolvedImages,
        highlights: resolvedHighlights,
        basePricePaise: lowestOptionPaise,
        mrpPaise: Math.max(lowestOptionPaise, lowestMrpPaise),
        unit: updatedUnit,
        turnaroundLabel:
          turnaroundLabel !== undefined ? String(turnaroundLabel).trim() : existing.turnaroundLabel,
        defaultDeliveryMode: resolvedDeliveryMode,
      },
      include: {
        options: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
        seller: true,
      },
    });
  });

  return normalizeSellerService(updated);
};

/**
 * Search Published Seller Services for Customers (including Multi-Seller Grouping by `serviceSlug`)
 */
export const searchPublishedSellerServices = async (filters = {}) => {
  await ensureInitialMeerutMarketplace();

  const {
    search = "",
    category = "",
    serviceSlug = "",
    sellerId = "",
    deliveryMode = "",
    sortBy = "popular",
  } = filters;

  const where = {
    status: "PUBLISHED",
    seller: {
      sellerType: "SERVICE",
    },
  };

  if (category && category !== "ALL" && category !== "All") {
    where.category = category;
  }
  if (serviceSlug) {
    where.serviceSlug = String(serviceSlug).trim().toLowerCase();
  }
  if (sellerId) {
    where.sellerId = String(sellerId).trim();
  }
  if (deliveryMode && (deliveryMode === "SELLER_SELF" || deliveryMode === "PLATFORM_HELPER")) {
    where.defaultDeliveryMode = deliveryMode;
  }

  let servicesRaw = await prisma.sellerService.findMany({
    where,
    include: {
      options: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      },
      seller: {
        select: {
          id: true,
          sellerType: true,
          businessName: true,
          businessCategory: true,
          storeBannerUrl: true,
          rateCardDocUrl: true,
          pickupCity: true,
          pickupAddress: true,
          contactPersonName: true,
          contactPersonPhone: true,
          commissionRate: true,
          verificationStatus: true,
        },
      },
    },
    orderBy:
      sortBy === "price_asc"
        ? { basePricePaise: "asc" }
        : sortBy === "price_desc"
          ? { basePricePaise: "desc" }
          : { createdAt: "asc" },
  });

  const q = String(search || "").trim().toLowerCase();
  if (q) {
    servicesRaw = servicesRaw.filter(
      (svc) =>
        svc.name.toLowerCase().includes(q) ||
        svc.description.toLowerCase().includes(q) ||
        svc.category.toLowerCase().includes(q) ||
        (svc.seller?.businessName || "").toLowerCase().includes(q) ||
        (svc.options || []).some((opt) => opt.title.toLowerCase().includes(q))
    );
  }

  const normalizedServices = servicesRaw.map(normalizeSellerService);

  // Build Multi-Seller Service Groups (e.g., "dry-cleaning" -> offered by Wash O Dry + Crystal Care Dry Cleaners)
  const groupMap = new Map();
  for (const svc of normalizedServices) {
    const key = svc.serviceSlug || slugifyServiceGroup(svc.name);
    if (!groupMap.has(key)) {
      groupMap.set(key, {
        serviceSlug: key,
        name: svc.name,
        category: svc.category,
        description: svc.description,
        image: svc.image,
        unit: svc.unit,
        startingPriceRupees: svc.priceRupees,
        maxRating: svc.avgRating,
        totalReviews: 0,
        sellersCount: 0,
        offerings: [],
      });
    }
    const grp = groupMap.get(key);
    grp.startingPriceRupees = Math.min(grp.startingPriceRupees, svc.priceRupees);
    grp.maxRating = Math.max(grp.maxRating, svc.avgRating || 4.8);
    grp.totalReviews += Number(svc.reviewCount || 0);
    grp.offerings.push({
      id: svc.id,
      slug: svc.slug,
      sellerId: svc.seller?.id,
      sellerName: svc.seller?.businessName || "Verified Service Partner",
      pickupCity: svc.seller?.pickupCity || "Meerut",
      pickupAddress: svc.seller?.pickupAddress || "",
      startingPriceRupees: svc.priceRupees,
      unit: svc.unit,
      turnaroundLabel: svc.turnaroundLabel,
      avgRating: svc.avgRating,
      reviewCount: svc.reviewCount,
      optionsCount: svc.optionsCount,
      deliveryByPlatform: svc.deliveryByPlatform,
    });
    grp.sellersCount = grp.offerings.length;
  }

  const allServiceCategories = await prisma.sellerService.findMany({
    where: { status: "PUBLISHED" },
    select: { category: true },
    distinct: ["category"],
  });

  return {
    services: normalizedServices,
    serviceGroups: Array.from(groupMap.values()),
    categories: allServiceCategories.map((c) => c.category),
    total: normalizedServices.length,
  };
};

/**
 * Get Multi-Seller Service Detail by `serviceSlug` (e.g. "dry-cleaning") OR specific seller's `slug` / `id`
 * Returns the selected seller's offering + ALL verified sellers offering that same service + their rate cards!
 */
export const getPublishedSellerServiceBySlug = async (slugOrServiceSlug, preferredSellerId = null) => {
  await ensureInitialMeerutMarketplace();

  const key = String(slugOrServiceSlug || "").trim();
  if (!key) return null;

  const includeConfig = {
    options: {
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    },
    seller: {
      select: {
        id: true,
        sellerType: true,
        businessName: true,
        businessCategory: true,
        storeBannerUrl: true,
        rateCardDocUrl: true,
        pickupCity: true,
        pickupAddress: true,
        pickupPincode: true,
        contactPersonName: true,
        contactPersonPhone: true,
        commissionRate: true,
        verificationStatus: true,
      },
    },
  };

  // 1. Check if key matches a specific seller's service slug or ID
  let exactMatch = await prisma.sellerService.findFirst({
    where: {
      OR: [{ slug: key }, { id: key }],
      status: "PUBLISHED",
    },
    include: includeConfig,
  });

  const resolvedServiceSlug = exactMatch
    ? exactMatch.serviceSlug
    : slugifyServiceGroup(key, key);

  // 2. Fetch ALL published seller offerings sharing this `serviceSlug` so customer can compare sellers & rates!
  let allOfferingsRaw = await prisma.sellerService.findMany({
    where: {
      serviceSlug: resolvedServiceSlug,
      status: "PUBLISHED",
    },
    include: includeConfig,
    orderBy: [{ basePricePaise: "asc" }, { createdAt: "asc" }],
  });

  if (allOfferingsRaw.length === 0 && exactMatch) {
    allOfferingsRaw = [exactMatch];
  }

  if (allOfferingsRaw.length === 0) {
    return null;
  }

  const allSellerOfferings = allOfferingsRaw.map(normalizeSellerService);

  let selectedService = exactMatch ? normalizeSellerService(exactMatch) : allSellerOfferings[0];
  if (preferredSellerId) {
    const byPreferredSeller = allSellerOfferings.find(
      (s) => s.sellerId === preferredSellerId || s.seller?.id === preferredSellerId
    );
    if (byPreferredSeller) {
      selectedService = byPreferredSeller;
    }
  }

  const [relatedServicesRaw, reviewOrdersRaw] = await Promise.all([
    prisma.sellerService.findMany({
      where: {
        status: "PUBLISHED",
        serviceSlug: { not: resolvedServiceSlug },
      },
      include: includeConfig,
      take: 6,
    }),
    prisma.marketplaceOrder.findMany({
      where: {
        buyerRating: { not: null },
        items: {
          some: {
            sellerServiceId: { in: allOfferingsRaw.map((o) => o.id) },
          },
        },
      },
      include: {
        customer: { select: { name: true, city: true } },
        seller: { select: { businessName: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 10,
    }),
  ]);

  // Deduplicate related services by serviceSlug so customer sees distinct related service types
  const seenRelatedSlugs = new Set();
  const relatedServices = [];
  for (const rel of relatedServicesRaw) {
    if (!seenRelatedSlugs.has(rel.serviceSlug)) {
      seenRelatedSlugs.add(rel.serviceSlug);
      relatedServices.push(normalizeSellerService(rel));
    }
  }

  const reviews = reviewOrdersRaw.map((ord) => ({
    id: ord.id,
    orderNumber: ord.orderNumber,
    sellerName: ord.seller?.businessName || "Verified Partner",
    buyerName: ord.shippingName || ord.customer?.name || "Verified Customer",
    buyerCity: ord.shippingCity || ord.customer?.city || "Meerut",
    rating: ord.buyerRating,
    review: ord.buyerReview || "Neat cleaning, timely pickup and delivery!",
    createdAt: ord.updatedAt,
  }));

  return {
    serviceSlug: resolvedServiceSlug,
    service: selectedService,
    allSellerOfferings,
    sellersCount: allSellerOfferings.length,
    relatedServices,
    reviews,
  };
};

export const getPublishedSellerServiceDetail = getPublishedSellerServiceBySlug;

/**
 * Search Published Marketplace Physical Products for Customers (Product Sellers only)
 */
export const searchPublishedProducts = async (filters = {}) => {
  await ensureInitialMeerutMarketplace();

  const { search = "", category = "", deliveryMode = "", sortBy = "newest" } = filters;

  const where = {
    status: "PUBLISHED",
    seller: {
      sellerType: "PRODUCT",
    },
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
          sellerType: true,
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
    where: {
      status: "PUBLISHED",
      seller: { sellerType: "PRODUCT" },
    },
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
          sellerType: true,
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
        seller: { sellerType: "PRODUCT" },
      },
      include: {
        seller: {
          select: {
            id: true,
            sellerType: true,
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
 * Place Marketplace Order (Supports BOTH Physical Products AND Multi-Option Seller Services):
 * 1. Automatically picks Name, Phone, and Address from Customer's User Profile by default.
 * 2. Supports Product items (`productId`, `selectedVariant`, `quantity`) AND Service Option items (`sellerServiceId`, `serviceOptionId`, `quantity`).
 * 3. Automatically splits multi-seller carts into per-seller orders linked by `cartGroupId`.
 * 4. Auto-creates a +2% Buddy Delivery / Pickup-Drop Task on behalf of Admin for every `PLATFORM_HELPER` order.
 */
export const placeMarketplaceOrder = async (customerId, data) => {
  await ensureInitialMeerutMarketplace();

  const {
    productId: rawProductId,
    sellerServiceId: rawSellerServiceId,
    serviceOptionId: rawServiceOptionId,
    quantity: rawQuantity,
    selectedVariant: rawSelectedVariant,
    items,
    scheduledPickupAt: rawScheduledPickupAt,
    pickupTimeSlot: rawPickupTimeSlot,
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
    razorpayOrderId: rawRazorpayOrderId,
    razorpayPaymentId: rawRazorpayPaymentId,
    razorpaySignature: rawRazorpaySignature,
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  } = data;

  const razorpayOrderId = rawRazorpayOrderId || razorpay_order_id || null;
  const razorpayPaymentId = rawRazorpayPaymentId || razorpay_payment_id || null;
  const razorpaySignature = rawRazorpaySignature || razorpay_signature || null;

  const isRealRzpOrder =
    Boolean(razorpayOrderId) &&
    String(razorpayOrderId).startsWith("order_") &&
    !/^(order_mock_|order_sim_|order_mkt_|order_rzp_|order_escrow_)/.test(
      String(razorpayOrderId)
    );

  if (
    isRealRzpOrder ||
    (razorpaySignature &&
      razorpaySignature !== "simulated_signature" &&
      razorpaySignature !== "fallback_signature")
  ) {
    const sigValid = verifyPaymentSignature(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    );
    if (!sigValid) {
      throw new Error(
        "Razorpay payment signature verification failed. Please retry your payment."
      );
    }
  }

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
        : rawSellerServiceId
          ? [
              {
                sellerServiceId: rawSellerServiceId,
                serviceOptionId: rawServiceOptionId || null,
                quantity: rawQuantity ?? 1,
              },
            ]
          : [];

  if (requestedItems.length === 0) {
    throw new Error("Please select at least one product or service option to place an order.");
  }

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

  const parsedScheduledPickupAt = rawScheduledPickupAt ? new Date(rawScheduledPickupAt) : null;
  const scheduledPickupAt =
    parsedScheduledPickupAt && !Number.isNaN(parsedScheduledPickupAt.getTime())
      ? parsedScheduledPickupAt
      : null;
  const pickupTimeSlot = rawPickupTimeSlot ? String(rawPickupTimeSlot).trim() : null;

  const productIds = [...new Set(requestedItems.map((i) => i.productId).filter(Boolean))];
  const sellerServiceIds = [
    ...new Set(requestedItems.map((i) => i.sellerServiceId).filter(Boolean)),
  ];

  const [dbProducts, dbServices] = await Promise.all([
    productIds.length > 0
      ? prisma.product.findMany({
          where: { id: { in: productIds } },
          include: {
            seller: {
              include: {
                user: { select: { id: true, name: true, email: true, phone: true } },
              },
            },
          },
        })
      : Promise.resolve([]),
    sellerServiceIds.length > 0
      ? prisma.sellerService.findMany({
          where: { id: { in: sellerServiceIds } },
          include: {
            options: { where: { isActive: true } },
            seller: {
              include: {
                user: { select: { id: true, name: true, email: true, phone: true } },
              },
            },
          },
        })
      : Promise.resolve([]),
  ]);

  const productMap = new Map(dbProducts.map((p) => [p.id, p]));
  const serviceMap = new Map(dbServices.map((s) => [s.id, s]));

  // Validate all items and group by Seller + OrderType + DeliveryMode
  const sellerGroups = new Map();

  for (const reqItem of requestedItems) {
    const qty = Math.max(1, Number(reqItem.quantity || 1));

    if (reqItem.sellerServiceId) {
      const svc = serviceMap.get(reqItem.sellerServiceId);
      if (!svc || svc.status !== "PUBLISHED") {
        throw new Error("One or more selected services are currently unavailable.");
      }

      const activeOptions = svc.options || [];
      let chosenOption = null;
      if (reqItem.serviceOptionId) {
        chosenOption = activeOptions.find((o) => o.id === reqItem.serviceOptionId);
        if (!chosenOption) {
          throw new Error(`Selected option is no longer available for ${svc.name}.`);
        }
      } else if (reqItem.selectedVariant) {
        const labelLower = String(reqItem.selectedVariant).trim().toLowerCase();
        chosenOption = activeOptions.find((o) => o.title.toLowerCase() === labelLower) || null;
      } else if (activeOptions.length > 0) {
        chosenOption = activeOptions[0];
      }

      const unitPricePaise = chosenOption ? chosenOption.pricePaise : svc.basePricePaise;
      const optionLabel = chosenOption
        ? `${chosenOption.groupName ? `${chosenOption.groupName}: ` : ""}${chosenOption.title} (per ${chosenOption.unit || svc.unit})`
        : reqItem.selectedVariant || `per ${svc.unit}`;

      const resolvedDeliveryMode =
        svc.defaultDeliveryMode === "PLATFORM_HELPER" ||
        svc.defaultDeliveryMode === "PLATFORM_DELIVERY"
          ? "PLATFORM_HELPER"
          : "SELLER_SELF";

      const groupKey = `${svc.seller.id}::SERVICE::${resolvedDeliveryMode}`;
      if (!sellerGroups.has(groupKey)) {
        sellerGroups.set(groupKey, {
          orderType: "SERVICE",
          seller: svc.seller,
          deliveryMode: resolvedDeliveryMode,
          lineItems: [],
        });
      }
      sellerGroups.get(groupKey).lineItems.push({
        itemType: "SERVICE",
        sellerService: svc,
        serviceOption: chosenOption,
        displayName: chosenOption ? `${svc.name} — ${chosenOption.title}` : svc.name,
        qty,
        unitPricePaise,
        selectedVariant: optionLabel,
      });
    } else {
      const product = productMap.get(reqItem.productId);
      if (!product || product.status !== "PUBLISHED") {
        throw new Error("One or more products in your cart are not available for purchase.");
      }
      if (product.stock < qty) {
        throw new Error(
          `Only ${product.stock} ${product.unit}(s) available in stock for ${product.name}.`
        );
      }

      const normalizedVars = normalizeVariants(
        product.variants,
        Math.round(product.pricePaise / 100),
        Math.round((product.mrpPaise || product.pricePaise) / 100)
      );
      const chosenVariantLabel = reqItem.selectedVariant
        ? String(reqItem.selectedVariant).trim()
        : null;
      const matchedVariant = chosenVariantLabel
        ? normalizedVars.find((v) => v.label.toLowerCase() === chosenVariantLabel.toLowerCase())
        : null;

      const unitPricePaise = matchedVariant ? matchedVariant.pricePaise : product.pricePaise;
      const resolvedDeliveryMode =
        product.defaultDeliveryMode === "PLATFORM_HELPER" ||
        product.defaultDeliveryMode === "PLATFORM_DELIVERY"
          ? "PLATFORM_HELPER"
          : "SELLER_SELF";

      const groupKey = `${product.seller.id}::PRODUCT::${resolvedDeliveryMode}`;
      if (!sellerGroups.has(groupKey)) {
        sellerGroups.set(groupKey, {
          orderType: "PRODUCT",
          seller: product.seller,
          deliveryMode: resolvedDeliveryMode,
          lineItems: [],
        });
      }
      sellerGroups.get(groupKey).lineItems.push({
        itemType: "PRODUCT",
        product,
        displayName: product.name,
        qty,
        unitPricePaise,
        selectedVariant: matchedVariant?.label || chosenVariantLabel || null,
      });
    }
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
    const { orderType, seller, deliveryMode: resolvedDeliveryMode, lineItems } = group;
    const fallbackComm =
      lineItems[0]?.product?.commissionRate ??
      lineItems[0]?.sellerService?.commissionRate ??
      15.0;
    const commissionRate = Number(seller?.commissionRate ?? fallbackComm);

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
    const orderPrefix = orderType === "SERVICE" ? "HB-SVC" : "HB-MRT";
    const orderNumber = `${orderPrefix}-${Date.now().toString().slice(-6)}${suffix}`;

    let createdDeliveryTask = null;
    if (resolvedDeliveryMode === "PLATFORM_HELPER") {
      const taskBudgetRupees = Math.max(1, Math.round(deliveryFeePaise / 100));
      const itemsSummary = lineItems
        .map(
          (li) =>
            `${li.qty} × ${li.displayName}${li.selectedVariant ? ` [${li.selectedVariant}]` : ""}`
        )
        .join(", ");

      const isServiceOrder = orderType === "SERVICE";
      const taskTitle = isServiceOrder
        ? `Service Pickup & Drop: ${lineItems[0].displayName} (${orderNumber})`
        : `Marketplace Delivery: ${lineItems[0].displayName} (${orderNumber})`;

      const taskDescription = isServiceOrder
        ? [
            `Auto-Created Service Pickup & Drop Task (2% Buddy Logistics) on behalf of HireBuddy Admin.`,
            `• Booking: #${orderNumber} (${itemsSummary})`,
            pickupTimeSlot ? `• Preferred Pickup Slot: ${pickupTimeSlot}` : null,
            `• Customer Pickup Address: ${shippingName}, ${shippingAddress}, ${shippingCity} - ${shippingPincode} (Phone: ${shippingPhone})`,
            `• Service Partner Hub: ${seller.businessName}, ${seller.pickupAddress}, ${seller.pickupCity} - ${seller.pickupPincode} (Contact: ${seller.contactPersonName} - ${seller.contactPersonPhone})`,
            `• Buddy Payout: ₹${(deliveryFeePaise / 100).toFixed(2)} (100% goes to Buddy)`,
          ]
            .filter(Boolean)
            .join("\n")
        : [
            `Auto-Created Platform Delivery Task (2% Delivery Option) on behalf of HireBuddy Admin.`,
            `• Order: #${orderNumber} (${itemsSummary})`,
            `• Pickup Point (Manufacturer): ${seller.businessName}, ${seller.pickupAddress}, ${seller.pickupCity} - ${seller.pickupPincode} (Contact: ${seller.contactPersonName} - ${seller.contactPersonPhone})`,
            `• Drop Address (Customer): ${shippingName}, ${shippingAddress}, ${shippingCity} - ${shippingPincode} (Phone: ${shippingPhone})`,
            `• Delivery Payout: ₹${(deliveryFeePaise / 100).toFixed(2)} (100% goes to Buddy upon delivery)`,
          ].join("\n");

      const taskLocation = isServiceOrder
        ? `${shippingAddress}, ${shippingCity} ⇄ ${seller.pickupAddress}, ${seller.pickupCity}`.slice(
            0,
            190
          )
        : `${seller.pickupAddress}, ${seller.pickupCity} → ${shippingAddress}, ${shippingCity}`.slice(
            0,
            190
          );

      createdDeliveryTask = await prisma.task.create({
        data: {
          title: taskTitle.slice(0, 190),
          description: taskDescription,
          category: "Delivery & Pickup",
          location: taskLocation,
          latitude: seller.pickupLatitude || 28.9845,
          longitude: seller.pickupLongitude || 77.7064,
          budget: taskBudgetRupees,
          preferredAt: scheduledPickupAt || new Date(),
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
        if (li.itemType === "PRODUCT" && li.product) {
          await tx.product.update({
            where: { id: li.product.id },
            data: { stock: { decrement: li.qty } },
          });
        }
      }

      const createdOrder = await tx.marketplaceOrder.create({
        data: {
          orderNumber,
          orderType,
          cartGroupId,
          customerId,
          sellerId: seller.id,
          scheduledPickupAt: orderType === "SERVICE" ? scheduledPickupAt : null,
          pickupTimeSlot: orderType === "SERVICE" ? pickupTimeSlot : null,
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
                productId: li.product?.id || null,
                sellerServiceId: li.sellerService?.id || null,
                serviceOptionId: li.serviceOption?.id || null,
                productName: li.displayName,
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
              sellerType: true,
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
          timeSlot: pickupTimeSlot || "Immediate Pickup & Delivery",
        };
        emitBroadcast("new_task_available", {
          taskId: createdDeliveryTask.id,
          task: formattedLiveTask,
          category: createdDeliveryTask.category,
          customerName: "HireBuddy Admin (Marketplace Logistics)",
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
    const firstItemName = lineItems[0].displayName;
    const totalQty = lineItems.reduce((s, l) => s + l.qty, 0);
    const noun = orderType === "SERVICE" ? "Service Booking" : "Order";

    try {
      if (seller?.userId) {
        await sendNotification(
          createdDeliveryTask?.id || null,
          customerId,
          seller.userId,
          "marketplace_order_received",
          `New ${noun} #${orderNumber}: ${firstItemName} (×${totalQty})`,
          `Total Paid: ₹${totalPaidRupees} | Your Share (${100 - commissionRate}%): ₹${sellerShareRupees} | Platform Commission (${commissionRate}%): ₹${platformShareRupees}${
            pickupTimeSlot ? ` | Pickup Slot: ${pickupTimeSlot}` : ""
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
        `${noun} #${orderNumber} Placed`,
        `${totalQty} item(s) from ${seller.businessName}. Platform ${commissionRate}% = ₹${platformShareRupees}, Seller = ₹${sellerShareRupees}.${
          createdDeliveryTask
            ? ` Auto-created 2% Pickup/Drop Task (₹${deliveryFeeRupees}) on behalf of Admin.`
            : " Seller handling pickup/delivery."
        }`
      );

      await sendNotification(
        createdDeliveryTask?.id || null,
        adminUser.id,
        customerId,
        "marketplace_order_confirmed",
        `${noun} #${orderNumber} Confirmed!`,
        `Your ${noun.toLowerCase()} for "${firstItemName}" (₹${totalPaidRupees}) with ${seller.businessName} is confirmed.${
          pickupTimeSlot ? ` Scheduled Slot: ${pickupTimeSlot}.` : ""
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
        ? `${primaryOrder.orderType === "SERVICE" ? "Booking" : "Order"} #${primaryOrder.orderNumber} confirmed! +2% HireBuddy Pickup/Delivery Task created.`
        : `${primaryOrder.orderType === "SERVICE" ? "Booking" : "Order"} #${primaryOrder.orderNumber} confirmed! Seller & Admin have been notified.`,
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
 * Get Customer's Marketplace Orders (Products + Services)
 */
export const getCustomerMarketplaceOrders = async (customerId) => {
  await ensureInitialMeerutMarketplace();

  const rows = await prisma.marketplaceOrder.findMany({
    where: { customerId },
    include: {
      items: {
        include: {
          product: { select: { id: true, name: true, slug: true, images: true, unit: true } },
          sellerService: {
            select: { id: true, name: true, slug: true, serviceSlug: true, images: true, unit: true },
          },
          serviceOption: {
            select: { id: true, groupName: true, title: true, unit: true, pricePaise: true },
          },
        },
      },
      seller: {
        select: {
          id: true,
          sellerType: true,
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

const VALID_PRODUCT_ORDER_STATUSES = new Set([
  "PLACED",
  "CONFIRMED",
  "PACKED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
]);

const VALID_SERVICE_ORDER_STATUSES = new Set([
  "PLACED",
  "CONFIRMED",
  "PICKED_UP",
  "IN_PROCESS",
  "READY_FOR_DELIVERY",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
]);

/**
 * Update Order Status by Seller, Helper, or Admin (supports both PRODUCT and SERVICE lifecycles)
 */
export const updateMarketplaceOrderStatus = async (orderId, newStatus, options = {}) => {
  const existing = await prisma.marketplaceOrder.findUnique({
    where: { id: orderId },
    include: {
      seller: { select: { id: true, sellerType: true, businessName: true } },
    },
  });
  if (!existing) {
    throw new Error("Order not found");
  }

  const normalizedStatus = String(newStatus || "").trim().toUpperCase();
  const isServiceOrder =
    existing.orderType === "SERVICE" || existing.seller?.sellerType === "SERVICE";

  const allowedSet = isServiceOrder
    ? VALID_SERVICE_ORDER_STATUSES
    : VALID_PRODUCT_ORDER_STATUSES;
  if (!allowedSet.has(normalizedStatus)) {
    throw new Error(
      `Invalid status "${normalizedStatus}" for ${isServiceOrder ? "Service Booking" : "Product Order"}.`
    );
  }

  const expectedPickupOtp =
    existing.pickupOtp || deriveOrderOtp(existing.deliveryTaskId || existing.id, "pickup");
  const expectedDeliveryOtp =
    existing.deliveryOtp || deriveOrderOtp(existing.deliveryTaskId || existing.id, "complete");

  if (options?.otp) {
    const providedOtp = String(options.otp).trim();
    if (
      (normalizedStatus === "OUT_FOR_DELIVERY" || normalizedStatus === "PICKED_UP") &&
      providedOtp !== expectedPickupOtp
    ) {
      throw new Error("Invalid 4-digit Pickup OTP.");
    }
    if (normalizedStatus === "DELIVERED" && providedOtp !== expectedDeliveryOtp) {
      throw new Error("Invalid 4-digit Customer Delivery OTP.");
    }
  }

  const updated = await prisma.marketplaceOrder.update({
    where: { id: orderId },
    data: { orderStatus: normalizedStatus },
    include: {
      items: true,
      seller: true,
    },
  });

  if (normalizedStatus === "DELIVERED" && existing.deliveryTaskId) {
    try {
      await prisma.task.update({
        where: { id: existing.deliveryTaskId },
        data: { status: "COMPLETED" },
      });
    } catch (e) {
      // Task may have already been completed
    }
  }

  try {
    const adminUser = await getOrCreatePlatformAdminUser();
    const statusText = ORDER_STATUS_LABELS[normalizedStatus] || normalizedStatus;
    await sendNotification(
      existing.deliveryTaskId || null,
      adminUser.id,
      existing.customerId,
      "marketplace_order_status_updated",
      `${isServiceOrder ? "Service Booking" : "Order"} #${existing.orderNumber}: ${statusText}`,
      `${existing.seller?.businessName || "Seller"} updated your ${
        isServiceOrder ? "service booking" : "order"
      } status to "${statusText}".`
    );
  } catch (e) {}

  return normalizeOrder(updated);
};

/**
 * Rate a Marketplace Order (1–5 Stars + Review) & Update Product or SellerService Rating Average
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

  const updatedServiceIds = new Set();
  for (const item of existing.items || []) {
    try {
      if (item.productId) {
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
      }
      if (item.sellerServiceId && !updatedServiceIds.has(item.sellerServiceId)) {
        updatedServiceIds.add(item.sellerServiceId);
        const svc = await prisma.sellerService.findUnique({
          where: { id: item.sellerServiceId },
        });
        if (svc) {
          const oldCount = Number(svc.reviewCount || 12);
          const oldAvg = Number(svc.avgRating || 4.8);
          const newCount = oldCount + 1;
          const newAvg = Number(((oldAvg * oldCount + parsedRating) / newCount).toFixed(1));
          await prisma.sellerService.update({
            where: { id: svc.id },
            data: { avgRating: newAvg, reviewCount: newCount },
          });
        }
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

  const [sellersRaw, productsRaw, servicesRaw, ordersRaw, settlementsRaw, promoAd] =
    await Promise.all([
      prisma.sellerProfile.findMany({
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
          _count: {
            select: {
              products: { where: { status: { not: "ARCHIVED" } } },
              services: { where: { status: { not: "ARCHIVED" } } },
              orders: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.product.findMany({
        where: { status: { not: "ARCHIVED" } },
        include: {
          seller: {
            select: {
              id: true,
              sellerType: true,
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
      prisma.sellerService.findMany({
        where: { status: { not: "ARCHIVED" } },
        include: {
          options: {
            where: { isActive: true },
            orderBy: { sortOrder: "asc" },
          },
          seller: {
            select: {
              id: true,
              sellerType: true,
              businessName: true,
              pickupCity: true,
              commissionRate: true,
              verificationStatus: true,
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
              sellerType: true,
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
              sellerType: true,
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
  const services = servicesRaw.map(normalizeSellerService);
  const orders = ordersRaw.map(normalizeOrder);
  const settlements = settlementsRaw.map(normalizeSettlementBatch);

  const stats = {
    totalSellers: sellers.length,
    productSellers: sellers.filter((s) => s.sellerType !== "SERVICE").length,
    serviceSellers: sellers.filter((s) => s.sellerType === "SERVICE").length,
    pendingSellers: sellers.filter((s) => s.verificationStatus === "PENDING").length,
    totalProducts: products.length,
    pendingProducts: products.filter((p) => p.status === "PENDING_APPROVAL").length,
    totalServices: services.length,
    pendingServices: services.filter((sv) => sv.status === "PENDING_APPROVAL").length,
    totalOrders: orders.length,
    serviceOrders: orders.filter((o) => o.orderType === "SERVICE").length,
    productOrders: orders.filter((o) => o.orderType !== "SERVICE").length,
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

  return { sellers, products, services, orders, settlements, stats, promoAd };
};

/**
 * Admin verifies or rejects a Seller Profile & Bank Account (Product or Service Seller)
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
    await Promise.all([
      prisma.product.updateMany({
        where: { sellerId },
        data: { commissionRate: parsedCommission },
      }),
      prisma.sellerService.updateMany({
        where: { sellerId },
        data: { commissionRate: parsedCommission },
      }),
    ]);
  }

  try {
    const adminUser = await getOrCreatePlatformAdminUser();
    const roleLabel = updated.sellerType === "SERVICE" ? "service partner" : "manufacturer";
    await sendNotification(
      null,
      adminUser.id,
      updated.userId,
      "seller_kyc_status",
      status === "VERIFIED"
        ? "Seller Account & KYC Verified!"
        : "Seller Verification Update",
      status === "VERIFIED"
        ? `Congratulations! Your ${roleLabel} account "${updated.businessName}" and bank account have been verified by Admin.`
        : `Your seller profile "${updated.businessName}" status was updated to ${status}. ${notes || ""}`
    );
  } catch (e) {
    console.warn("Seller verify notification warning:", e?.message);
  }

  return normalizeSellerProfile(updated);
};

/**
 * Admin verifies & publishes a Seller Service with configurable commission rate (10% - 20%)
 */
export const adminVerifyAndPublishService = async (
  serviceId,
  {
    status: rawStatus,
    approvalStatus,
    isPublished,
    commissionRate,
    commissionPct,
    defaultDeliveryMode,
    rejectionReason,
  }
) => {
  const existing = await prisma.sellerService.findUnique({
    where: { id: serviceId },
    include: {
      seller: true,
      options: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
    },
  });

  if (!existing) {
    throw new Error("Seller service not found");
  }

  const incomingStatus = rawStatus || approvalStatus || (isPublished ? "PUBLISHED" : "PUBLISHED");
  const status = incomingStatus === "APPROVED" ? "PUBLISHED" : incomingStatus;

  const effectiveCommission = commissionRate ?? commissionPct;
  const parsedCommission =
    effectiveCommission !== undefined && effectiveCommission !== null
      ? Math.min(50, Math.max(1, Number(effectiveCommission)))
      : existing.commissionRate;

  const updated = await prisma.sellerService.update({
    where: { id: serviceId },
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
      options: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
    },
  });

  try {
    const adminUser = await getOrCreatePlatformAdminUser();
    if (existing.seller?.userId) {
      await sendNotification(
        null,
        adminUser.id,
        existing.seller.userId,
        "service_verification",
        updated.status === "PUBLISHED"
          ? `Service Published: ${updated.name}`
          : `Service Status Updated: ${updated.name}`,
        updated.status === "PUBLISHED"
          ? `Admin verified & published your service "${updated.name}" with ${updated.commissionRate}% platform commission (Your share: ${100 - updated.commissionRate}%).`
          : `Service "${updated.name}" status: ${updated.status}. ${rejectionReason || ""}`
      );
    }
  } catch (e) {
    console.warn("Service publish notification warning:", e?.message);
  }

  return normalizeSellerService(updated);
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
export const adminVerifyService = adminVerifyAndPublishService;
export const processDailyNeftSettlements = processDailyNeftSettlement;
