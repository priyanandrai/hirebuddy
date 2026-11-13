import prisma from "../utils/prisma.js";
import bcrypt from "bcrypt";
import { indexHelper, deleteHelper } from "./es.client.js";
import {
  normalizePhone,
  assertUniqueEmailAndPhone,
  resolveFallbackEmail,
  parseDuplicateError,
  DuplicateUserError,
} from "../utils/userValidation.js";

export const DEFAULT_MULTI_SERVICE_TEMPLATES = {
  "Car Wash": [
    {
      id: "car-wash-hatchback-foam",
      category: "Car Wash",
      title: "Exterior Foam Wash & Tyre Dressing (Hatchback / Sedan)",
      description: "Snow foam pressure wash, alloy cleaning, and tyre shine at your doorstep",
      priceRupees: 299,
      unit: "per car",
      theme: "blue",
    },
    {
      id: "car-wash-suv-complete",
      category: "Car Wash",
      title: "Complete Interior Vacuum + Exterior Foam Wash (SUV / MUV)",
      description: "Full vacuuming, dashboard polish, mat wash, and exterior snow foam wash",
      priceRupees: 499,
      unit: "per car",
      theme: "green",
    },
    {
      id: "car-wash-seat-shampoo",
      category: "Car Wash",
      title: "Deep Interior Dry-Cleaning & Seat Shampooing",
      description: "Stain removal for fabric/leather seats, roof lining, and floor carpets",
      priceRupees: 799,
      unit: "per car",
      theme: "orange",
    },
    {
      id: "car-wash-rubbing-polish",
      category: "Car Wash",
      title: "3M Machine Rubbing, Wax Polishing & Detailing",
      description: "Swirl mark removal, paint gloss restoration, and protective wax coat",
      priceRupees: 1199,
      unit: "per car",
      theme: "cyan",
    },
  ],
  "Dry Cleaning": [
    {
      id: "dry-clean-daily-wear",
      category: "Dry Cleaning",
      title: "Shirt / Trouser / Kurta Dry Clean & Steam Press",
      description: "Gentle solvent dry cleaning, stain treatment, and crisp steam pressing",
      priceRupees: 99,
      unit: "per piece",
      theme: "blue",
    },
    {
      id: "dry-clean-suit-blazer",
      category: "Dry Cleaning",
      title: "2-Piece / 3-Piece Suit, Blazer or Sherwani Dry Clean",
      description: "Premium garment care for formal suits, blazers, and ethnic wear",
      priceRupees: 349,
      unit: "per set",
      theme: "green",
    },
    {
      id: "dry-clean-saree-lehenga",
      category: "Dry Cleaning",
      title: "Silk Saree / Embroidered Designer Lehenga Dry Clean",
      description: "Delicate zari-safe dry cleaning and roll polishing",
      priceRupees: 299,
      unit: "per piece",
      theme: "orange",
    },
    {
      id: "dry-clean-blanket-curtain",
      category: "Dry Cleaning",
      title: "Double Blanket / Heavy Quilt / Curtain Dry Clean",
      description: "Hygienic deep sanitization and odour-free dry cleaning for heavy fabrics",
      priceRupees: 399,
      unit: "per item",
      theme: "cyan",
    },
  ],
  "Home Cleaning": [
    {
      id: "home-cleaning-hourly",
      category: "Home Cleaning",
      title: "Standard Home Cleaning (Sweeping, Mopping & Dusting)",
      description: "General room-by-room floor cleaning, dusting, and surface wiping",
      priceRupees: 249,
      unit: "per hour",
      theme: "green",
    },
    {
      id: "home-cleaning-bathroom",
      category: "Home Cleaning",
      title: "Bathroom Deep Cleaning & Hard-Water Descaling",
      description: "Tile scrubbing, tap/shower descaling, and complete sanitization",
      priceRupees: 399,
      unit: "per bathroom",
      theme: "cyan",
    },
    {
      id: "home-cleaning-kitchen",
      category: "Home Cleaning",
      title: "Kitchen Deep Degreasing (Slabs, Tiles & Chimney Exterior)",
      description: "Oil & grease removal from cabinets, backsplash tiles, and stove area",
      priceRupees: 699,
      unit: "per kitchen",
      theme: "orange",
    },
    {
      id: "home-cleaning-full-2bhk",
      category: "Home Cleaning",
      title: "Full 2BHK / 3BHK Apartment Deep Cleaning Package",
      description: "Complete house deep cleaning including rooms, kitchen, bathrooms & balcony",
      priceRupees: 1799,
      unit: "per package",
      theme: "blue",
    },
  ],
  Plumbing: [
    {
      id: "plumbing-tap-leak",
      category: "Plumbing",
      title: "Tap, Mixer or Angle Valve Repair / Replacement",
      description: "Fixing dripping faucets, washer replacement, or new tap installation",
      priceRupees: 199,
      unit: "per visit",
      theme: "blue",
    },
    {
      id: "plumbing-drain-block",
      category: "Plumbing",
      title: "Kitchen Sink or Bathroom Drain Unblocking",
      description: "Mechanical clearing of choked floor traps, washbasins, and sink pipes",
      priceRupees: 299,
      unit: "per drain",
      theme: "orange",
    },
    {
      id: "plumbing-flush-geyser",
      category: "Plumbing",
      title: "Flush Tank Repair / Geyser Pipe Connection",
      description: "Cistern syphon/float valve repair or water heater inlet/outlet setup",
      priceRupees: 349,
      unit: "per unit",
      theme: "green",
    },
    {
      id: "plumbing-motor-tank",
      category: "Plumbing",
      title: "Water Tank Installation & Motor Pump Fitting",
      description: "Overhead tank plumbing, ball valve setup, and pressure motor installation",
      priceRupees: 599,
      unit: "per service",
      theme: "cyan",
    },
  ],
  Electrical: [
    {
      id: "electrical-switchboard",
      category: "Electrical",
      title: "Switchboard, Socket or MCB Tripping Repair",
      description: "Fault diagnosis, burnt socket replacement, and MCB fuse fixing",
      priceRupees: 199,
      unit: "per visit",
      theme: "green",
    },
    {
      id: "electrical-fan-light",
      category: "Electrical",
      title: "Ceiling Fan, Exhaust Fan or Chandelier Installation",
      description: "Safe mounting, capacitor replacement, and wiring connection",
      priceRupees: 249,
      unit: "per unit",
      theme: "blue",
    },
    {
      id: "electrical-inverter-setup",
      category: "Electrical",
      title: "Single / Double Battery Inverter & UPS Wiring Setup",
      description: "Complete inverter installation with backup line connection",
      priceRupees: 449,
      unit: "per service",
      theme: "orange",
    },
  ],
  "Driver Services": [
    {
      id: "driver-city-hourly",
      category: "Driver Services",
      title: "Local City Chauffeur (Manual / Automatic Car)",
      description: "Hourly city driving for office commute, shopping, or hospital visits",
      priceRupees: 249,
      unit: "per hour",
      theme: "green",
    },
    {
      id: "driver-airport-drop",
      category: "Driver Services",
      title: "Airport Pickup / Drop Transfer",
      description: "Punctual chauffeur drive to or from IGI Airport in your vehicle",
      priceRupees: 599,
      unit: "per trip",
      theme: "blue",
    },
    {
      id: "driver-outstation-day",
      category: "Driver Services",
      title: "Outstation Full-Day Highway Chauffeur",
      description: "Experienced highway driver for family weekend and outstation trips",
      priceRupees: 1199,
      unit: "per day",
      theme: "orange",
    },
  ],
  "Furniture Assembly": [
    {
      id: "carpenter-door-lock",
      category: "Furniture Assembly",
      title: "Wooden Door Alignment, Lock & Hinge Repair",
      description: "Fixing jammed doors, replacing mortise locks, handles, and hydraulic hinges",
      priceRupees: 249,
      unit: "per visit",
      theme: "green",
    },
    {
      id: "carpenter-bed-wardrobe",
      category: "Furniture Assembly",
      title: "Bed, Wardrobe or Study Table Assembly / Dismantling",
      description: "Complete flat-pack or modular furniture dismantling and reassembly",
      priceRupees: 599,
      unit: "per unit",
      theme: "blue",
    },
  ],
};

export function normalizeServiceOfferings(rawOfferings, skillsInput, hourlyRatePaise) {
  const themes = ["green", "blue", "orange", "cyan"];
  if (Array.isArray(rawOfferings) && rawOfferings.length > 0) {
    return rawOfferings
      .filter((item) => item && String(item.title || "").trim())
      .map((item, idx) => {
        const rawRupees =
          item.priceRupees !== undefined
            ? Number(item.priceRupees)
            : item.price !== undefined
            ? Number(item.price)
            : item.pricePaise !== undefined
            ? Math.round(Number(item.pricePaise) / 100)
            : 200;
        const priceRupees = Math.max(1, Math.round(rawRupees || 200));
        const pricePaise = priceRupees * 100;
        const title = String(item.title).trim();
        const category = String(item.category || "General Service").trim();
        return {
          id:
            item.id ||
            `${category.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${idx + 1}`,
          category,
          title,
          price: priceRupees,
          priceRupees,
          pricePaise,
          unit: String(item.unit || "per service").trim(),
          description: String(
            item.description || `${title} (${category})`
          ).trim(),
          theme: item.theme || themes[idx % themes.length],
          isAvailable: item.isAvailable !== false,
        };
      });
  }

  // Fallback: build multi-option offerings across all skills the helper has selected
  const skillsList = Array.isArray(skillsInput)
    ? skillsInput
    : skillsInput
    ? String(skillsInput)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : ["Home Cleaning"];

  const baseRupees = hourlyRatePaise
    ? hourlyRatePaise > 1000
      ? Math.round(hourlyRatePaise / 100)
      : hourlyRatePaise
    : null;

  const generated = [];
  for (const skill of skillsList) {
    const sLow = skill.toLowerCase();
    let matchedTemplate = null;
    if (sLow.includes("car") || sLow.includes("wash")) {
      matchedTemplate = DEFAULT_MULTI_SERVICE_TEMPLATES["Car Wash"];
    } else if (sLow.includes("dry") || sLow.includes("laundry") || sLow.includes("iron")) {
      matchedTemplate = DEFAULT_MULTI_SERVICE_TEMPLATES["Dry Cleaning"];
    } else if (sLow.includes("clean")) {
      matchedTemplate = DEFAULT_MULTI_SERVICE_TEMPLATES["Home Cleaning"];
    } else if (sLow.includes("plumb")) {
      matchedTemplate = DEFAULT_MULTI_SERVICE_TEMPLATES.Plumbing;
    } else if (sLow.includes("electr") || sLow.includes("ac") || sLow.includes("appliance")) {
      matchedTemplate = DEFAULT_MULTI_SERVICE_TEMPLATES.Electrical;
    } else if (sLow.includes("driv")) {
      matchedTemplate = DEFAULT_MULTI_SERVICE_TEMPLATES["Driver Services"];
    } else if (sLow.includes("carpent") || sLow.includes("furniture")) {
      matchedTemplate = DEFAULT_MULTI_SERVICE_TEMPLATES["Furniture Assembly"];
    } else {
      const startPrice = baseRupees || 249;
      matchedTemplate = [
        {
          id: `${sLow.replace(/[^a-z0-9]+/g, "-")}-standard`,
          category: skill,
          title: `Standard ${skill} Service`,
          description: `Verified ${skill.toLowerCase()} service with transparent pricing`,
          priceRupees: startPrice,
          unit: "per visit",
          theme: "green",
        },
        {
          id: `${sLow.replace(/[^a-z0-9]+/g, "-")}-premium`,
          category: skill,
          title: `Complete ${skill} Package`,
          description: `Comprehensive ${skill.toLowerCase()} package including full checkup`,
          priceRupees: Math.round(startPrice * 1.6),
          unit: "per package",
          theme: "blue",
        },
      ];
    }

    for (const item of matchedTemplate) {
      generated.push({
        ...item,
        price: item.priceRupees,
        pricePaise: item.priceRupees * 100,
        isAvailable: true,
      });
    }
  }

  return generated;
}

export const setRoleService = (userId, role) => {
  return prisma.user.update({
    where: { id: userId },
    data: { role },
  });
};

export const updateMyProfileService = async (userId, rawData = {}) => {
  const data = {};

  if (rawData.name !== undefined) {
    data.name = String(rawData.name).trim();
  } else if (rawData.firstName || rawData.lastName) {
    data.name = `${rawData.firstName || ""} ${rawData.lastName || ""}`.trim();
  }

  if (rawData.email !== undefined || rawData.phone !== undefined) {
    const { cleanEmail, cleanPhone } = await assertUniqueEmailAndPhone({
      email: rawData.email,
      phone: rawData.phone,
      excludeUserId: userId,
    });
    if (cleanEmail) {
      data.email = cleanEmail;
    }
    if (cleanPhone) {
      data.phone = cleanPhone;
    }
  }

  if (rawData.city !== undefined) {
    data.city = rawData.city ? String(rawData.city).trim() : null;
  }
  if (rawData.address !== undefined) {
    data.address = rawData.address ? String(rawData.address).trim() : null;
  }
  if (rawData.image !== undefined) {
    data.image = rawData.image || null;
  }
  if (rawData.latitude !== undefined && rawData.latitude !== null && rawData.latitude !== "") {
    data.latitude = Number(rawData.latitude);
  }
  if (rawData.longitude !== undefined && rawData.longitude !== null && rawData.longitude !== "") {
    data.longitude = Number(rawData.longitude);
  }
  if (rawData.skills !== undefined) {
    data.skills = Array.isArray(rawData.skills) ? rawData.skills.join(", ") : rawData.skills;
  }
  if (rawData.serviceOfferings !== undefined && Array.isArray(rawData.serviceOfferings)) {
    const normalized = normalizeServiceOfferings(rawData.serviceOfferings, data.skills, rawData.hourlyRate);
    data.serviceOfferings = normalized;
    if (!rawData.hourlyRate && normalized.length > 0) {
      data.hourlyRate = Math.min(...normalized.map((s) => s.pricePaise));
    }
  }
  if (rawData.experience !== undefined && rawData.experience !== "") {
    data.experience = Number(rawData.experience) || 0;
  }
  if (rawData.hourlyRate !== undefined && rawData.hourlyRate !== "") {
    data.hourlyRate = Number(rawData.hourlyRate) || 0;
  }
  if (rawData.isAvailable !== undefined) {
    data.isAvailable = Boolean(rawData.isAvailable);
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      image: true,
      role: true,
      city: true,
      address: true,
      latitude: true,
      longitude: true,
      skills: true,
      serviceOfferings: true,
      experience: true,
      hourlyRate: true,
      isAvailable: true,
      averageRating: true,
      totalReviews: true,
      walletBalance: true,
      idVerificationStatus: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (user.role === "HELPER") {
    try {
      await indexHelper(user);
    } catch (e) {
      console.error("Failed to index helper after profile update", e);
    }
  }

  return user;
};

export const updateHelperProfileService = async (userId, rawData = {}) => {
  const data = {};
  if (rawData.name !== undefined) {
    data.name = rawData.name;
  } else if (rawData.firstName || rawData.lastName) {
    data.name = `${rawData.firstName || ""} ${rawData.lastName || ""}`.trim();
  }

  if (rawData.email !== undefined || rawData.phone !== undefined) {
    const { cleanEmail, cleanPhone } = await assertUniqueEmailAndPhone({
      email: rawData.email,
      phone: rawData.phone,
      excludeUserId: userId,
    });
    if (cleanEmail) data.email = cleanEmail;
    if (cleanPhone) data.phone = cleanPhone;
  }

  if (rawData.city !== undefined) data.city = rawData.city;
  if (rawData.address !== undefined) data.address = rawData.address;
  if (rawData.image !== undefined) data.image = rawData.image;
  if (rawData.bio !== undefined) data.bio = rawData.bio;
  if (rawData.skills !== undefined) {
    data.skills = Array.isArray(rawData.skills) ? rawData.skills.join(", ") : rawData.skills;
  } else if (rawData.services !== undefined) {
    data.skills = Array.isArray(rawData.services) ? rawData.services.join(", ") : rawData.services;
  }
  if (rawData.experience !== undefined) data.experience = Number(rawData.experience) || 0;
  if (rawData.hourlyRate !== undefined) data.hourlyRate = Number(rawData.hourlyRate) || 0;
  if (rawData.serviceOfferings !== undefined && Array.isArray(rawData.serviceOfferings)) {
    const normalized = normalizeServiceOfferings(
      rawData.serviceOfferings,
      data.skills,
      data.hourlyRate
    );
    data.serviceOfferings = normalized;
    if (!data.hourlyRate && normalized.length > 0) {
      data.hourlyRate = Math.min(...normalized.map((s) => s.pricePaise));
    }
  }
  if (rawData.isAvailable !== undefined) data.isAvailable = Boolean(rawData.isAvailable);
  if (rawData.latitude !== undefined && rawData.latitude !== null) data.latitude = Number(rawData.latitude);
  if (rawData.longitude !== undefined && rawData.longitude !== null) data.longitude = Number(rawData.longitude);

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...data,
      role: "HELPER",
    },
  });

  try {
    await indexHelper(user);
  } catch (e) {
    console.error("Failed to index helper after update", e);
  }

  return user;
};

export const submitIdDocumentService = async (userId, payload = {}) => {
  const data = typeof payload === "string" ? { idDocumentUrl: payload } : payload;
  const { idDocumentUrl, addressProofUrl, image, selfieUrl, idDocumentType, addressProofType } = data;

  const updateData = {
    idVerificationStatus: "PENDING",
  };
  if (idDocumentUrl) updateData.idDocumentUrl = idDocumentUrl;
  if (addressProofUrl) updateData.addressProofUrl = addressProofUrl;
  if (image || selfieUrl) updateData.image = image || selfieUrl;
  if (idDocumentType) updateData.idDocumentType = idDocumentType;
  if (addressProofType) updateData.addressProofType = addressProofType;

  const user = await prisma.user.update({
    where: { id: userId },
    data: updateData,
  });

  try { await indexHelper(user); } catch (e) { console.error("Index after ID submit failed", e); }
  return user;
};

export const verifyUserIdService = async (userId, status, notes = null) => {
  const data = {
    idVerificationStatus: status,
    idVerificationNotes: notes,
    idVerifiedAt: status === 'VERIFIED' ? new Date() : null,
  };

  const user = await prisma.user.update({ where: { id: userId }, data });
  try { await indexHelper(user); } catch (e) { console.error('Index after ID verify failed', e); }
  return user;
};

export const getMyProfileService = async (userId) => {
  if (userId === "admin") {
    return {
      id: "admin",
      name: "System Admin",
      email: "admin@hirebuddy.com",
      role: "ADMIN",
      city: "Meerut",
      isAvailable: true,
      idVerificationStatus: "VERIFIED",
      tasksCompleted: 0,
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      image: true,
      role: true,
      city: true,
      address: true,
      latitude: true,
      longitude: true,
      bio: true,
      skills: true,
      serviceOfferings: true,
      experience: true,
      hourlyRate: true,
      isAvailable: true,
      averageRating: true,
      totalReviews: true,
      walletBalance: true,
      partnerPlanType: true,
      subscriptionActiveUntil: true,
      idVerificationStatus: true,
      idDocumentUrl: true,
      addressProofUrl: true,
      idDocumentType: true,
      addressProofType: true,
      idVerifiedAt: true,
      isBlocked: true,
      blockedReason: true,
      createdAt: true,
    },
  });
  if (!user) return null;

  const tasksCompleted = await prisma.task.count({
    where: {
      assignedToId: userId,
      status: "COMPLETED",
    },
  });

  return {
    ...user,
    serviceOfferings: normalizeServiceOfferings(user.serviceOfferings, user.skills, user.hourlyRate),
    tasksCompleted,
  };
};

export const getHelper = async (id) => {
  const selectFields = {
    id: true,
    slug: true,
    name: true,
    image: true,
    role: true,
    city: true,
    bio: true,
    skills: true,
    serviceOfferings: true,
    experience: true,
    hourlyRate: true,
    isAvailable: true,
    averageRating: true,
    totalReviews: true,
    idVerificationStatus: true,
    idVerifiedAt: true,
    isPublicProfileApproved: true,
    createdAt: true,
  };

  let user = await prisma.user.findFirst({
    where: {
      OR: [{ id }, { slug: id }],
    },
    select: selectFields,
  });

  if (!user && id) {
    const slugLower = String(id).toLowerCase();
    const helpers = await prisma.user.findMany({
      where: { role: "HELPER" },
      select: selectFields,
      orderBy: [{ idVerificationStatus: "desc" }, { createdAt: "desc" }],
    });
    user =
      helpers.find((h) => {
        const nameLow = String(h.name || "").toLowerCase();
        const skillLow = String(h.skills || "").toLowerCase();
        if (slugLower.includes("priya") || slugLower.includes("clean"))
          return skillLow.includes("clean") || nameLow.includes("prreto");
        if (slugLower.includes("driver") || slugLower.includes("ravinder"))
          return skillLow.includes("driver") || nameLow.includes("ravinder");
        if (slugLower.includes("deliver") || slugLower.includes("rahul"))
          return skillLow.includes("courier") || skillLow.includes("deliver") || nameLow.includes("aman");
        if (slugLower.includes("plumb")) return skillLow.includes("plumb") || skillLow.includes("repair");
        if (slugLower.includes("electr")) return skillLow.includes("electr") || skillLow.includes("appliance");
        if (slugLower.includes("cook") || slugLower.includes("meena"))
          return skillLow.includes("cook") || nameLow.includes("shanti");
        if (slugLower.includes("furniture") || slugLower.includes("moving"))
          return skillLow.includes("furniture") || skillLow.includes("assembly");
        return false;
      }) || helpers[0] || null;
  }

  if (!user) return null;
  const skillsArr = Array.isArray(user.skills)
    ? user.skills
    : user.skills
    ? String(user.skills)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];
  return {
    ...user,
    isVerified: user.idVerificationStatus === "VERIFIED",
    skills: skillsArr,
    serviceOfferings: normalizeServiceOfferings(
      user.serviceOfferings,
      skillsArr,
      user.hourlyRate
    ),
  };
};
export const getHelpersListService = async () => {
  const rows = await prisma.user.findMany({
    where: {
      role: "HELPER",
    },
    select: {
      id: true,
      slug: true,
      name: true,
      email: true,
      phone: true,
      image: true,
      skills: true,
      serviceOfferings: true,
      city: true,
      address: true,
      experience: true,
      hourlyRate: true,
      isAvailable: true,
      averageRating: true,
      totalReviews: true,
      walletBalance: true,
      partnerPlanType: true,
      subscriptionActiveUntil: true,
      idVerificationStatus: true,
      idDocumentUrl: true,
      addressProofUrl: true,
      isBlocked: true,
      blockedReason: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // normalize skills & multi-service offerings for frontend
  return rows.map((r) => {
    const skillsArr = Array.isArray(r.skills)
      ? r.skills
      : r.skills
      ? String(r.skills)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];
    return {
      ...r,
      isVerified: r.idVerificationStatus === "VERIFIED",
      skills: skillsArr,
      serviceOfferings: normalizeServiceOfferings(
        r.serviceOfferings,
        skillsArr,
        r.hourlyRate
      ),
    };
  });
};

export const getPendingIdSubmissionsService = async () => {
  return prisma.user.findMany({
    where: { idVerificationStatus: 'PENDING' },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      image: true,
      city: true,
      skills: true,
      idDocumentUrl: true,
      idDocumentType: true,
      addressProofUrl: true,
      addressProofType: true,
      idVerificationStatus: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  });
};

export const searchHelpersDbService = async (params = {}) => {
  const {
    q,
    city,
    isAvailable,
    isVerified,
    minRating,
    maxPrice,
    sort = 'relevance',
    limit = 20,
    offset = 0,
  } = params;

  const where = {
    role: "HELPER",
    isBlocked: false,
  };

  const andConditions = [];

  if (q && q.trim()) {
    const term = q.trim();
    andConditions.push({
      OR: [
        { name: { contains: term } },
        { skills: { contains: term } },
        { city: { contains: term } },
      ],
    });
  }

  if (city && city.trim()) {
    andConditions.push({
      city: { contains: city.trim() },
    });
  }

  if (isAvailable === 'true' || isAvailable === true) {
    where.isAvailable = true;
  }

  if (isVerified === 'true' || isVerified === true) {
    where.idVerificationStatus = 'VERIFIED';
  }

  if (minRating && !isNaN(Number(minRating))) {
    where.averageRating = { gte: Number(minRating) };
  }

  if (maxPrice && !isNaN(Number(maxPrice))) {
    const paise = Number(maxPrice) > 1000 ? Number(maxPrice) : Number(maxPrice) * 100;
    where.hourlyRate = { lte: paise };
  }

  if (andConditions.length > 0) {
    where.AND = andConditions;
  }

  let orderBy = [{ averageRating: "desc" }, { totalReviews: "desc" }];
  if (sort === 'price_low') {
    orderBy = [{ hourlyRate: "asc" }];
  } else if (sort === 'price_high') {
    orderBy = [{ hourlyRate: "desc" }];
  } else if (sort === 'rating_high') {
    orderBy = [{ averageRating: "desc" }];
  } else if (sort === 'reviews_high') {
    orderBy = [{ totalReviews: "desc" }];
  }

  const [total, rows] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy,
      take: Number(limit) || 20,
      skip: Number(offset) || 0,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
        city: true,
        latitude: true,
        longitude: true,
        skills: true,
        experience: true,
        hourlyRate: true,
        averageRating: true,
        totalReviews: true,
        isAvailable: true,
        idVerificationStatus: true,
      },
    }),
  ]);

  return {
    total,
    helpers: rows.map((r) => ({
      ...r,
      isVerified: r.idVerificationStatus === 'VERIFIED',
      skills: Array.isArray(r.skills)
        ? r.skills
        : (r.skills ? String(r.skills).split(',').map((s) => s.trim()).filter(Boolean) : []),
    })),
  };
};

export const getAllUsersService = async ({ role, search, limit = 50, offset = 0 } = {}) => {
  const where = {};
  if (role) {
    where.role = role === "CUSTOMER" ? "USER" : role;
  }
  if (search) {
    const term = String(search).trim();
    if (term) {
      where.OR = [
        { name: { contains: term } },
        { phone: { contains: term } },
        { email: { contains: term } },
        { city: { contains: term } },
      ];
    }
  }

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Number(limit) || 50,
      skip: Number(offset) || 0,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
        role: true,
        city: true,
        address: true,
        skills: true,
        experience: true,
        hourlyRate: true,
        averageRating: true,
        totalReviews: true,
        walletBalance: true,
        isAvailable: true,
        isBlocked: true,
        blockedReason: true,
        idVerificationStatus: true,
        idDocumentUrl: true,
        createdAt: true,
        _count: {
          select: {
            tasksCreated: true,
            tasksAssigned: true,
          },
        },
      },
    }),
  ]);

  return { total, users };
};

export const toggleBlockUserService = async (userId, isBlocked = true, blockedReason = null) => {
  const blocked = Boolean(isBlocked);
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      isBlocked: blocked,
      blockedReason: blocked ? (blockedReason || "Blocked by Administrator") : null,
      ...(blocked ? { isAvailable: false } : {}),
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isBlocked: true,
      blockedReason: true,
      isAvailable: true,
    },
  });

  if (user.role === "HELPER") {
    try {
      if (blocked) {
        await deleteHelper(userId);
      } else {
        await indexHelper(user);
      }
    } catch (e) {
      console.warn("ES update after block/unblock failed:", e?.message);
    }
  }

  return user;
};

export const updateUserRoleService = async (userId, role) => {
  return prisma.user.update({
    where: { id: userId },
    data: { role },
  });
};

export const deleteUserService = async (userId) => {
  return prisma.$transaction(async (tx) => {
    await tx.notification.deleteMany({
      where: { OR: [{ senderId: userId }, { receiverId: userId }] },
    });
    await tx.message.deleteMany({
      where: { OR: [{ senderId: userId }, { receiverId: userId }] },
    });
    await tx.review.deleteMany({
      where: { OR: [{ givenById: userId }, { givenToId: userId }] },
    });
    await tx.payment.deleteMany({
      where: { OR: [{ payerId: userId }, { payeeId: userId }] },
    });
    await tx.partnerSubscription.deleteMany({
      where: { userId },
    });
    await tx.walletTransaction.deleteMany({
      where: { userId },
    });
    await tx.searchLog.deleteMany({
      where: { userId },
    });
    await tx.supportTicket.deleteMany({
      where: { userId },
    });

    const seller = await tx.sellerProfile.findUnique({ where: { userId } });
    if (seller) {
      const sellerOrders = await tx.marketplaceOrder.findMany({
        where: { sellerId: seller.id },
        select: { id: true },
      });
      if (sellerOrders.length > 0) {
        await tx.marketplaceOrderItem.deleteMany({
          where: { orderId: { in: sellerOrders.map((o) => o.id) } },
        });
        await tx.marketplaceOrder.deleteMany({
          where: { sellerId: seller.id },
        });
      }
      await tx.settlementBatch.deleteMany({ where: { sellerId: seller.id } });
      await tx.product.deleteMany({ where: { sellerId: seller.id } });
      await tx.sellerProfile.delete({ where: { id: seller.id } });
    }

    const custOrders = await tx.marketplaceOrder.findMany({
      where: { customerId: userId },
      select: { id: true },
    });
    if (custOrders.length > 0) {
      await tx.marketplaceOrderItem.deleteMany({
        where: { orderId: { in: custOrders.map((o) => o.id) } },
      });
      await tx.marketplaceOrder.deleteMany({
        where: { customerId: userId },
      });
    }

    await tx.task.updateMany({
      where: { assignedToId: userId },
      data: { assignedToId: null, status: "OPEN" },
    });

    const userCreatedTasks = await tx.task.findMany({
      where: { createdById: userId },
      select: { id: true },
    });
    if (userCreatedTasks.length > 0) {
      const taskIds = userCreatedTasks.map((t) => t.id);
      await tx.notification.deleteMany({ where: { taskId: { in: taskIds } } });
      await tx.message.deleteMany({ where: { taskId: { in: taskIds } } });
      await tx.review.deleteMany({ where: { taskId: { in: taskIds } } });
      await tx.payment.deleteMany({ where: { taskId: { in: taskIds } } });
      await tx.marketplaceOrder.updateMany({
        where: { deliveryTaskId: { in: taskIds } },
        data: { deliveryTaskId: null },
      });
      await tx.task.deleteMany({ where: { id: { in: taskIds } } });
    }

    return tx.user.delete({
      where: { id: userId },
    });
  });
};

export const createHelperService = async ({
  name,
  phone,
  password,
  email,
  city,
  skills,
  hourlyRate,
  role = "HELPER",
  isVerified = true,
}) => {
  const { isValid: isValidPhone } = normalizePhone(phone);
  if (!isValidPhone) {
    const err = new Error("A valid 10-digit mobile number is required");
    err.statusCode = 400;
    throw err;
  }

  if (!password || String(password).trim().length < 4) {
    const err = new Error("Password must be at least 4 characters long");
    err.statusCode = 400;
    throw err;
  }

  // Ensure neither email nor phone already belongs to any existing user/helper
  const { cleanEmail, cleanPhone } = await assertUniqueEmailAndPhone({
    email,
    phone,
  });

  const hashedPassword = await bcrypt.hash(String(password).trim(), 10);
  const resolvedEmail =
    cleanEmail || (await resolveFallbackEmail(cleanPhone));
  const resolvedRole = ["USER", "HELPER", "SELLER", "ADMIN"].includes(role)
    ? role
    : "HELPER";
  const normalizedSkills = Array.isArray(skills)
    ? skills.map((s) => String(s).trim()).filter(Boolean).join(", ") || "General Helper"
    : String(skills || "").trim() || (resolvedRole === "HELPER" ? "General Helper" : null);

  let user;
  try {
    user = await prisma.user.create({
      data: {
        name: name?.trim() || (resolvedRole === "HELPER" ? "Helper Partner" : "User"),
        phone: cleanPhone,
        email: resolvedEmail,
        password: hashedPassword,
        role: resolvedRole,
        city: city?.trim() || "Meerut, UP",
        skills: normalizedSkills,
        hourlyRate: hourlyRate ? Number(hourlyRate) * 100 : null,
        isAvailable: true,
        idVerificationStatus: isVerified ? "VERIFIED" : "PENDING",
        idVerifiedAt: isVerified ? new Date() : null,
        idVerificationNotes: isVerified
          ? "Account created and verified directly by Administrator"
          : null,
      },
    });
  } catch (err) {
    const duplicate = parseDuplicateError(err);
    if (duplicate.isDuplicate) {
      throw new DuplicateUserError(duplicate.message);
    }
    throw err;
  }

  if (user.role === "HELPER") {
    try {
      await indexHelper(user);
    } catch (err) {
      console.warn("Index helper failed:", err.message);
    }
  }

  return {
    id: user.id,
    name: user.name,
    phone: user.phone,
    email: user.email,
    role: user.role,
    city: user.city,
    skills: user.skills,
    idVerificationStatus: user.idVerificationStatus,
    createdAt: user.createdAt,
  };
};


