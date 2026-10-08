import prisma from "../src/utils/prisma.js";

export const CATEGORIES_DATA = [
  {
    name: "Cleaning",
    slug: "cleaning",
    description: "Book verified and top-rated home, office, and deep cleaners in your neighborhood.",
    icon: "✨",
    subServices: [
      "Home Cleaning",
      "Deep Cleaning",
      "Office Cleaning",
      "Kitchen Cleaning",
      "Bathroom Cleaning",
      "Sofa & Carpet",
      "Sanitization",
    ],
    isPopular: true,
  },
  {
    name: "Repairs",
    slug: "repairs",
    description: "Certified electricians, plumbers, carpenters, and appliance repair technicians at your doorstep.",
    icon: "🔧",
    subServices: [
      "Electrician",
      "Plumber",
      "Carpentry",
      "Appliance Repair",
      "Wiring Repair",
      "Pipe Leakage",
      "Geyser Repair",
    ],
    isPopular: true,
  },
  {
    name: "Furniture Assembly",
    slug: "furniture-assembly",
    description: "Expert assembly and installation for IKEA, modular furniture, beds, tables, and wall mounts.",
    icon: "🪑",
    subServices: [
      "IKEA Assembly",
      "Bed Fitting",
      "Wardrobe Setup",
      "Office Desk Setup",
      "Wall Shelves",
      "TV Unit Assembly",
      "Furniture Dismantling",
    ],
    isPopular: true,
  },
  {
    name: "Grocery Shopping",
    slug: "grocery-shopping",
    description: "Personal helpers for fresh veggies, supermarket runs, medicines, and daily household essentials.",
    icon: "🛒",
    subServices: [
      "Fresh Vegetables",
      "Supermarket Runs",
      "Daily Essentials",
      "Pharmacy Pickup",
      "Local Mandi Shopping",
      "Urgent Grocery",
    ],
    isPopular: true,
  },
  {
    name: "Elder Care",
    slug: "elder-care",
    description: "Compassionate caregivers and companions for seniors, doctor visits, walks, and mobility assistance.",
    icon: "❤️",
    subServices: [
      "Doctor Escort",
      "Medicine Scheduling",
      "Mobility Assistance",
      "Companionship",
      "Vital Signs Checking",
      "Physiotherapy Support",
    ],
    isPopular: true,
  },
  {
    name: "Delivery",
    slug: "delivery",
    description: "Fast, reliable on-demand courier, parcels, documents, and local item pickup and delivery.",
    icon: "📦",
    subServices: [
      "Express Courier",
      "Parcel Pickup",
      "Document Drop",
      "Bike Delivery",
      "Tiffin Delivery",
      "Fragile Delivery",
    ],
    isPopular: true,
  },
  {
    name: "Driver",
    slug: "driver",
    description: "Licensed personal chauffeurs for city commutes, outstation travel, luxury cars, and airport drops.",
    icon: "🚗",
    subServices: [
      "Personal Driver",
      "City Chauffeur",
      "Outstation Trips",
      "Airport Drop",
      "Daily Office Commute",
      "Luxury Cars",
    ],
    isPopular: true,
  },
  {
    name: "Home Support",
    slug: "home-support",
    description: "Reliable domestic help for home cooking, laundry, clothes ironing, child support, and gardening.",
    icon: "🏡",
    subServices: [
      "Home Cooking",
      "Clothes Ironing",
      "Laundry Folding",
      "Child Day Support",
      "Dishwashing",
      "Plant Care",
    ],
    isPopular: true,
  },
];

export async function seedCategories() {
  console.log("Seeding categories into MariaDB database...");
  for (const cat of CATEGORIES_DATA) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {
        name: cat.name,
        description: cat.description,
        icon: cat.icon,
        subServices: cat.subServices,
        isPopular: cat.isPopular,
      },
      create: {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        icon: cat.icon,
        subServices: cat.subServices,
        isPopular: cat.isPopular,
      },
    });
  }
  const count = await prisma.category.count();
  console.log(`Categories seeded successfully! Total in DB: ${count}`);
}

if (process.argv[1]?.endsWith("seed-categories.js")) {
  seedCategories()
    .catch((err) => {
      console.error("Failed to seed categories:", err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
