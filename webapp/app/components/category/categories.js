export const CATEGORIES = [
  "Home Cleaning",
  "Driver Services",
  "Delivery & Pickup",
  "Plumbing",
  "Electrical",
  "Furniture Assembly",
  "Cooking",
  "Personal Care",
  "Others",
];

export const slugify = (s = "") =>
  s
    .toString()
    .toLowerCase()
    .trim()
    .replace(/&/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");

export const CATEGORY_DETAILS = {
  "home-cleaning": {
    name: "Home Cleaning",
    slug: "home-cleaning",
    icon: "🧹",
    description:
      "Professional home cleaning services for a cleaner and healthier home.",
    subServices: [
      "Full Home Deep Cleaning",
      "Kitchen & Bathroom Sanitization",
      "Sofa & Carpet Vacuuming",
      "Floor Scrubbing & Polishing",
    ],
  },
  "driver-services": {
    name: "Driver Services",
    slug: "driver-services",
    icon: "🚗",
    description:
      "Safe and experienced drivers for local and outstation trips.",
    subServices: [
      "Local City Chauffeur",
      "Outstation Round Trips",
      "Airport Pickup & Drop",
      "Hourly Personal Driver",
    ],
  },
  "delivery-pickup": {
    name: "Delivery & Pickup",
    slug: "delivery-pickup",
    icon: "📦",
    description:
      "Quick and reliable delivery and pickup services for your convenience.",
    subServices: [
      "Same-Day Parcel Delivery",
      "Grocery & Medicine Pickup",
      "Document Courier",
      "Heavy Item Transport",
    ],
  },
  plumbing: {
    name: "Plumbing",
    slug: "plumbing",
    icon: "🚰",
    description: "Fixing leaks, pipe repair, and all plumbing needs.",
    subServices: [
      "Tap & Pipe Leak Repair",
      "Drain Blockage Clearing",
      "Water Tank & Motor Fitting",
      "Bathroom Fixture Installation",
    ],
  },
  electrical: {
    name: "Electrical",
    slug: "electrical",
    icon: "⚡",
    description:
      "Electrical repairs, installation and maintenance services.",
    subServices: [
      "Switchboard & Wiring Repair",
      "Ceiling Fan & Light Installation",
      "Inverter & UPS Setup",
      "MCB & Fuse Troubleshooting",
    ],
  },
  "furniture-assembly": {
    name: "Furniture Assembly",
    slug: "furniture-assembly",
    icon: "🪑",
    description:
      "Quick and professional furniture assembly and installation.",
    subServices: [
      "Bed & Wardrobe Assembly",
      "Modular Study Table Setup",
      "TV Unit & Wall Mounting",
      "Furniture Dismantling & Moving",
    ],
  },
  cooking: {
    name: "Cooking",
    slug: "cooking",
    icon: "🍳",
    description:
      "Hygienic and delicious home-cooked meals prepared by verified local cooks.",
    subServices: [
      "Daily Home Meal Prep",
      "North & South Indian Cooking",
      "Party & Event Catering Help",
      "Tiffin Preparation",
    ],
  },
  "personal-care": {
    name: "Personal Care",
    slug: "personal-care",
    icon: "🤝",
    description:
      "Compassionate personal care, elder assistance, and daily wellness support.",
    subServices: [
      "Elder Companionship",
      "Doctor Visit Escort",
      "Patient Home Care",
      "Mobility Support",
    ],
  },
  others: {
    name: "Others",
    slug: "others",
    icon: "✨",
    description:
      "Custom everyday tasks, gardening, errands, and general household assistance.",
    subServices: [
      "Gardening & Plant Care",
      "Event Help & Setup",
      "Pet Walking & Sitting",
      "Custom Local Errands",
    ],
  },
};

export function getCategoryBySlug(slug) {
  if (!slug) return null;
  const normalized = slugify(slug);
  if (CATEGORY_DETAILS[normalized]) {
    return CATEGORY_DETAILS[normalized];
  }
  const found = CATEGORIES.find((c) => slugify(c) === normalized);
  if (found) {
    return {
      name: found,
      slug: normalized,
      icon: "✨",
      description: `Browse verified ${found} helpers near you.`,
      subServices: [],
    };
  }
  const readableName = normalized
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
  return {
    name: readableName,
    slug: normalized,
    icon: "✨",
    description: `Browse verified ${readableName} helpers near you.`,
    subServices: [],
  };
}
