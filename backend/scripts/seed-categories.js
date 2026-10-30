import "dotenv/config";
import prisma from "../src/utils/prisma.js";

export const CATEGORIES_DATA = [
  {
    name: "Home Cleaning",
    slug: "home-cleaning",
    description:
      "Professional home cleaning services for a cleaner and healthier home.",
    icon: "🧹",
    subServices: [
      "Full Home Deep Cleaning",
      "Kitchen & Bathroom Sanitization",
      "Sofa & Carpet Vacuuming",
      "Floor Scrubbing & Polishing",
    ],
    isPopular: true,
  },
  {
    name: "Driver Services",
    slug: "driver-services",
    description:
      "Safe and experienced drivers for local and outstation trips.",
    icon: "🚗",
    subServices: [
      "Local City Chauffeur",
      "Outstation Round Trips",
      "Airport Pickup & Drop",
      "Hourly Personal Driver",
    ],
    isPopular: true,
  },
  {
    name: "Delivery & Pickup",
    slug: "delivery-pickup",
    description:
      "Quick and reliable delivery and pickup services for your convenience.",
    icon: "📦",
    subServices: [
      "Same-Day Parcel Delivery",
      "Grocery & Medicine Pickup",
      "Document Courier",
      "Heavy Item Transport",
    ],
    isPopular: true,
  },
  {
    name: "Plumbing",
    slug: "plumbing",
    description:
      "Fixing leaks, pipe repair, and all plumbing needs.",
    icon: "🚰",
    subServices: [
      "Tap & Pipe Leak Repair",
      "Drain Blockage Clearing",
      "Water Tank & Motor Fitting",
      "Bathroom Fixture Installation",
    ],
    isPopular: true,
  },
  {
    name: "Electrical",
    slug: "electrical",
    description:
      "Electrical repairs, installation and maintenance services.",
    icon: "⚡",
    subServices: [
      "Switchboard & Wiring Repair",
      "Ceiling Fan & Light Installation",
      "Inverter & UPS Setup",
      "MCB & Fuse Troubleshooting",
    ],
    isPopular: true,
  },
  {
    name: "Furniture Assembly",
    slug: "furniture-assembly",
    description:
      "Quick and professional furniture assembly and installation.",
    icon: "🪑",
    subServices: [
      "Bed & Wardrobe Assembly",
      "Modular Study Table Setup",
      "TV Unit & Wall Mounting",
      "Furniture Dismantling & Moving",
    ],
    isPopular: true,
  },
  {
    name: "Cooking",
    slug: "cooking",
    description:
      "Hygienic and delicious home-cooked meals prepared by verified local cooks.",
    icon: "🍳",
    subServices: [
      "Daily Home Meal Prep",
      "North & South Indian Cooking",
      "Party & Event Catering Help",
      "Tiffin Preparation",
    ],
    isPopular: true,
  },
  {
    name: "Personal Care",
    slug: "personal-care",
    description:
      "Compassionate personal care, elder assistance, and daily wellness support.",
    icon: "🤝",
    subServices: [
      "Elder Companionship",
      "Doctor Visit Escort",
      "Patient Home Care",
      "Mobility Support",
    ],
    isPopular: true,
  },
  {
    name: "Others",
    slug: "others",
    description:
      "Custom everyday tasks, gardening, errands, and general household assistance.",
    icon: "✨",
    subServices: [
      "Gardening & Plant Care",
      "Event Help & Setup",
      "Pet Walking & Sitting",
      "Custom Local Errands",
    ],
    isPopular: true,
  },
];

const LEGACY_SLUGS = [
  "cleaning",
  "repairs",
  "grocery-shopping",
  "elder-care",
  "delivery",
  "driver",
  "home-support",
];

async function seedCategories() {
  console.log("🌱 Syncing currently showing categories into database...");

  // Remove old legacy seed categories so DB reflects the exact current categories
  await prisma.category.deleteMany({
    where: {
      slug: { in: LEGACY_SLUGS },
    },
  });

  for (const cat of CATEGORIES_DATA) {
    const upserted = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {
        name: cat.name,
        description: cat.description,
        icon: cat.icon,
        subServices: cat.subServices,
        isPopular: cat.isPopular,
      },
      create: cat,
    });
    console.log(`✅ Upserted category: ${upserted.name} (${upserted.slug})`);
  }

  console.log("🎉 All 9 categories seeded successfully in DB!");
}

if (process.argv[1] && process.argv[1].endsWith("seed-categories.js")) {
  seedCategories()
    .catch((err) => {
      console.error("❌ Error seeding categories:", err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
