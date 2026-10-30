import prisma from "../utils/prisma.js";
import { CATEGORIES_DATA } from "../../scripts/seed-categories.js";

/**
 * Helper to convert category name into URL-friendly slug
 */
export const slugify = (text = "") =>
  text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/&/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");

export const inferIconType = (slugOrName = "") => {
  const s = slugify(slugOrName);
  if (s.includes("clean")) return "cleaning";
  if (s.includes("driver") || s.includes("car") || s.includes("travel")) return "driver";
  if (s.includes("deliver") || s.includes("pickup") || s.includes("courier")) return "delivery";
  if (s.includes("plumb") || s.includes("pipe")) return "plumbing";
  if (s.includes("electr")) return "electrical";
  if (s.includes("furnit") || s.includes("carpentr")) return "furniture";
  if (s.includes("cook") || s.includes("chef") || s.includes("food")) return "cooking";
  if (s.includes("care") || s.includes("elder") || s.includes("medical")) return "personal-care";
  return "others";
};

export const inferEmojiIcon = (slugOrName = "") => {
  const type = inferIconType(slugOrName);
  switch (type) {
    case "cleaning":
      return "🧹";
    case "driver":
      return "🚗";
    case "delivery":
      return "📦";
    case "plumbing":
      return "🚰";
    case "electrical":
      return "⚡";
    case "furniture":
      return "🪑";
    case "cooking":
      return "🍳";
    case "personal-care":
      return "🤝";
    default:
      return "✨";
  }
};

/**
 * Fetch all categories from the database.
 * If database is empty, automatically seeds from CATEGORIES_DATA.
 * Keeps "Others" at the end of the list so newly added categories appear cleanly before "Others".
 */
export const getAllCategories = async () => {
  let categories = await prisma.category.findMany({
    orderBy: { createdAt: "asc" },
  });

  if (categories.length === 0) {
    for (const cat of CATEGORIES_DATA) {
      await prisma.category.upsert({
        where: { slug: cat.slug },
        update: cat,
        create: cat,
      });
    }
    categories = await prisma.category.findMany({
      orderBy: { createdAt: "asc" },
    });
  }

  // Sort so "Others" is always last while preserving DB order for all other categories
  const regular = categories.filter((c) => c.slug !== "others" && c.name.toLowerCase() !== "others");
  const others = categories.filter((c) => c.slug === "others" || c.name.toLowerCase() === "others");
  return [...regular, ...others];
};

/**
 * Fetch single category by slug or name from the database
 */
export const getCategoryBySlugService = async (slug) => {
  const normalizedSlug = slugify(slug);

  let category = await prisma.category.findUnique({
    where: { slug: normalizedSlug },
  });

  if (!category) {
    const all = await getAllCategories();
    category =
      all.find(
        (c) =>
          c.slug === normalizedSlug ||
          slugify(c.name) === normalizedSlug ||
          c.name.toLowerCase() === String(slug || "").toLowerCase().trim()
      ) || null;
  }

  return category;
};

/**
 * Ensure a category exists in the database (`Category` table).
 * If it does not exist yet, creates it in the database and returns the record.
 */
export const ensureCategoryInDb = async (rawName, extra = {}) => {
  const cleanName = String(rawName || "").trim();
  if (!cleanName) return null;

  const targetSlug = extra.slug ? slugify(extra.slug) : slugify(cleanName);
  if (!targetSlug) return null;

  // Check existing categories in DB by slug or case-insensitive name
  const existingCategories = await prisma.category.findMany();
  const existing = existingCategories.find(
    (c) =>
      c.slug.toLowerCase() === targetSlug.toLowerCase() ||
      c.name.toLowerCase() === cleanName.toLowerCase()
  );

  if (existing) {
    return existing;
  }

  // Create new category in DB
  const created = await prisma.category.create({
    data: {
      name: cleanName,
      slug: targetSlug,
      description:
        extra.description ||
        `Verified local helpers and professionals for ${cleanName} services.`,
      icon: extra.icon || inferEmojiIcon(cleanName),
      subServices:
        Array.isArray(extra.subServices) && extra.subServices.length > 0
          ? extra.subServices
          : [
              `${cleanName} Service`,
              `On-Demand ${cleanName}`,
              `Verified ${cleanName} Helpers`,
            ],
      isPopular: extra.isPopular !== undefined ? Boolean(extra.isPopular) : true,
    },
  });

  return created;
};

/**
 * Create a new category in DB (or return existing if already present)
 */
export const createCategory = async (data) => {
  const { name, slug, description, icon, subServices, isPopular } = data || {};
  return await ensureCategoryInDb(name, {
    slug,
    description,
    icon,
    subServices,
    isPopular,
  });
};

/**
 * Rich visual metadata templates keyed by category slug for Dashboard Services
 */
export const HOME_SERVICES_TEMPLATES = {
  "home-cleaning": {
    id: "svc-home-cleaning",
    taskCategory: "Home Cleaning",
    image: "/images/service_home_cleaning.png",
    iconType: "cleaning",
    verified: true,
    rating: 4.7,
    reviewsCount: 128,
    location: "Modipuram, Meerut",
    price: 300,
    priceUnit: "day",
    relevanceOrder: 1,
    availableHelpers: 12,
  },
  "driver-services": {
    id: "svc-driver-services",
    taskCategory: "Driver Services",
    image: "/images/service_driver.png",
    iconType: "driver",
    verified: true,
    rating: 4.6,
    reviewsCount: 96,
    location: "Meerut, UP",
    price: 400,
    priceUnit: "day",
    relevanceOrder: 2,
    availableHelpers: 8,
  },
  "delivery-pickup": {
    id: "svc-delivery-pickup",
    taskCategory: "Delivery & Pickup",
    image: "/images/service_delivery.png",
    iconType: "delivery",
    verified: true,
    rating: 4.5,
    reviewsCount: 74,
    location: "Modipuram, Meerut",
    price: 200,
    priceUnit: "day",
    relevanceOrder: 3,
    availableHelpers: 6,
  },
  plumbing: {
    id: "svc-plumbing",
    taskCategory: "Plumbing",
    image: "/images/service_plumbing.png",
    iconType: "plumbing",
    verified: true,
    rating: 4.4,
    reviewsCount: 62,
    location: "Meerut, UP",
    price: 350,
    priceUnit: "day",
    relevanceOrder: 4,
    availableHelpers: 5,
  },
  electrical: {
    id: "svc-electrical",
    taskCategory: "Electrical",
    image: "/images/service_electrical.png",
    iconType: "electrical",
    verified: true,
    rating: 4.3,
    reviewsCount: 48,
    location: "Modipuram, Meerut",
    price: 300,
    priceUnit: "day",
    relevanceOrder: 5,
    availableHelpers: 4,
  },
  "furniture-assembly": {
    id: "svc-furniture-assembly",
    taskCategory: "Furniture Assembly",
    image: "/images/service_furniture.png",
    iconType: "furniture",
    verified: true,
    rating: 4.2,
    reviewsCount: 36,
    location: "Meerut, UP",
    price: 250,
    priceUnit: "day",
    relevanceOrder: 6,
    availableHelpers: 3,
  },
  cooking: {
    id: "svc-cooking",
    taskCategory: "Cooking",
    image: "/images/service_home_cleaning.png",
    iconType: "cooking",
    verified: true,
    rating: 4.6,
    reviewsCount: 52,
    location: "Modipuram, Meerut",
    price: 350,
    priceUnit: "day",
    relevanceOrder: 7,
    availableHelpers: 3,
    isExtended: true,
  },
  "personal-care": {
    id: "svc-personal-care",
    taskCategory: "Personal Care",
    image: "/images/service_driver.png",
    iconType: "personal-care",
    verified: true,
    rating: 4.5,
    reviewsCount: 29,
    location: "Meerut, UP",
    price: 450,
    priceUnit: "day",
    relevanceOrder: 8,
    availableHelpers: 2,
    isExtended: true,
  },
  others: {
    id: "svc-others",
    taskCategory: "Others",
    image: "/images/service_delivery.png",
    iconType: "others",
    verified: true,
    rating: 4.1,
    reviewsCount: 41,
    location: "Modipuram, Meerut",
    price: 200,
    priceUnit: "day",
    relevanceOrder: 99,
    availableHelpers: 4,
    isExtended: true,
  },
};

/**
 * Filter & sort services catalog dynamically from DB Categories (`prisma.category`)
 */
export const getFilteredServices = async (filters = {}) => {
  const {
    category,
    location,
    minPrice,
    maxPrice,
    minRating,
    sortBy = "relevance",
    search,
  } = filters;

  // 1. Always fetch categories from DB
  const dbCategories = await getAllCategories();

  // 2. Build services catalog directly from DB categories
  const fullCatalog = dbCategories.map((dbCat, index) => {
    const template = HOME_SERVICES_TEMPLATES[dbCat.slug] || null;
    const subServices = Array.isArray(dbCat.subServices)
      ? dbCat.subServices
      : [
          `${dbCat.name} Service`,
          `On-Demand ${dbCat.name}`,
          `Verified ${dbCat.name} Helpers`,
        ];

    return {
      id: template?.id || `svc-${dbCat.slug || dbCat.id}`,
      title: dbCat.name,
      category: dbCat.name,
      slug: dbCat.slug,
      taskCategory: dbCat.name,
      image: template?.image || "/images/service_delivery.png",
      icon: dbCat.icon || inferEmojiIcon(dbCat.name),
      iconType: template?.iconType || inferIconType(dbCat.slug || dbCat.name),
      verified: true,
      rating: template?.rating || 4.6,
      reviewsCount: template?.reviewsCount || 24,
      location: template?.location || "Modipuram, Meerut",
      description:
        dbCat.description ||
        `Verified local helpers and professionals for ${dbCat.name} services.`,
      price: template?.price || 300,
      priceUnit: template?.priceUnit || "day",
      relevanceOrder: template?.relevanceOrder || 10 + index,
      availableHelpers: template?.availableHelpers || 4,
      isExtended: template ? Boolean(template.isExtended) : index >= 6,
      subServices,
    };
  });

  // 3. Apply non-category filters first so category counts reflect available services
  let baseCatalog = [...fullCatalog];

  if (search && String(search).trim() !== "") {
    const q = String(search).trim().toLowerCase();
    baseCatalog = baseCatalog.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.location.toLowerCase().includes(q) ||
        (Array.isArray(s.subServices) &&
          s.subServices.some((sub) => String(sub).toLowerCase().includes(q)))
    );
  }

  if (location && String(location).trim() !== "" && location !== "All") {
    const loc = String(location).trim().toLowerCase();
    baseCatalog = baseCatalog.filter((s) => s.location.toLowerCase().includes(loc));
  }

  if (minPrice !== undefined && minPrice !== "" && !Number.isNaN(Number(minPrice))) {
    const min = Number(minPrice);
    baseCatalog = baseCatalog.filter((s) => s.price >= min);
  }

  if (maxPrice !== undefined && maxPrice !== "" && !Number.isNaN(Number(maxPrice))) {
    const max = Number(maxPrice);
    if (max < 1000) {
      baseCatalog = baseCatalog.filter((s) => s.price <= max);
    }
  }

  if (minRating !== undefined && minRating !== "" && !Number.isNaN(Number(minRating))) {
    const minR = Number(minRating);
    baseCatalog = baseCatalog.filter((s) => s.rating >= minR);
  }

  // 4. Build dynamic category sidebar list from DB categories
  const categoriesWithCounts = [
    {
      name: "All Services",
      slug: "all",
      icon: "✨",
      iconType: "all",
      count: baseCatalog.length,
      servicesCount: baseCatalog.length,
    },
    ...dbCategories.map((dbCat) => {
      const catLower = dbCat.name.toLowerCase();
      const slugLower = (dbCat.slug || "").toLowerCase();
      const matchingCount = baseCatalog.filter(
        (s) =>
          s.category.toLowerCase() === catLower ||
          s.slug.toLowerCase() === slugLower ||
          s.title.toLowerCase() === catLower
      ).length;

      return {
        id: dbCat.id,
        name: dbCat.name,
        slug: dbCat.slug,
        icon: dbCat.icon || inferEmojiIcon(dbCat.name),
        iconType: inferIconType(dbCat.slug || dbCat.name),
        description: dbCat.description,
        subServices: dbCat.subServices,
        count: matchingCount,
        servicesCount: matchingCount,
      };
    }),
  ];

  // 5. Filter by selected category
  let results = [...baseCatalog];
  if (
    category &&
    category !== "ALL" &&
    category !== "all" &&
    category.toLowerCase() !== "all services"
  ) {
    const normCat = category.trim().toLowerCase();
    results = results.filter(
      (s) =>
        s.category.toLowerCase() === normCat ||
        s.slug.toLowerCase() === normCat ||
        s.taskCategory.toLowerCase() === normCat ||
        s.title.toLowerCase().includes(normCat)
    );
  }

  // 6. Sorting
  if (sortBy === "price_asc" || sortBy === "price_low") {
    results.sort((a, b) => a.price - b.price);
  } else if (sortBy === "price_desc" || sortBy === "price_high") {
    results.sort((a, b) => b.price - a.price);
  } else if (sortBy === "rating") {
    results.sort((a, b) => b.rating - a.rating);
  } else {
    results.sort((a, b) => a.relevanceOrder - b.relevanceOrder);
  }

  return {
    total: results.length,
    categories: categoriesWithCounts,
    services: results,
  };
};
