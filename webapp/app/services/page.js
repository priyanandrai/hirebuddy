import Link from "next/link";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import Breadcrumbs from "../components/seo/Breadcrumbs";
import InternalLinksSection from "../components/seo/InternalLinksSection";
import { fetchSeoApi, generatePageMetadata } from "../lib/seo";

export const metadata = generatePageMetadata({
  title: "All Home Services — Home Cleaning, Plumber, Electrician, Carpenter & Driver | HireBuddy",
  description:
    "Explore verified home and personal services on HireBuddy including Home Cleaning, Plumber, Electrician, Carpenter, and Personal Driver bookings across Noida, Ghaziabad, Meerut & Delhi.",
  path: "/services",
});

const SERVICE_IMAGE_MAP = {
  "home-cleaning": "/images/service_home_cleaning.png",
  cleaning: "/images/service_home_cleaning.png",
  plumber: "/images/service_plumbing.png",
  plumbing: "/images/service_plumbing.png",
  electrician: "/images/service_electrical.png",
  electrical: "/images/service_electrical.png",
  carpenter: "/images/service_carpenter.png",
  "furniture-assembly": "/images/service_furniture.png",
  driver: "/images/service_driver.png",
  "driver-services": "/images/service_driver.png",
  "delivery-pickup": "/images/service_delivery.png",
  delivery: "/images/service_delivery.png",
  cooking: "/images/service_cooking.png",
  "personal-care": "/images/service_personal_care.png",
  others: "/images/service_others.png",
};

function resolveServiceBannerImage(svc = {}) {
  if (svc.image && typeof svc.image === "string" && svc.image.startsWith("/images/")) {
    return svc.image;
  }
  const slugKey = String(svc.slug || "").toLowerCase().trim();
  if (SERVICE_IMAGE_MAP[slugKey]) return SERVICE_IMAGE_MAP[slugKey];
  const nameKey = String(svc.name || "").toLowerCase();
  if (nameKey.includes("clean")) return "/images/service_home_cleaning.png";
  if (nameKey.includes("plumb") || nameKey.includes("pipe")) return "/images/service_plumbing.png";
  if (nameKey.includes("electr")) return "/images/service_electrical.png";
  if (nameKey.includes("carpent") || nameKey.includes("wood")) return "/images/service_carpenter.png";
  if (nameKey.includes("furnit") || nameKey.includes("assembl")) return "/images/service_furniture.png";
  if (nameKey.includes("driv") || nameKey.includes("car")) return "/images/service_driver.png";
  if (nameKey.includes("cook") || nameKey.includes("chef") || nameKey.includes("meal")) return "/images/service_cooking.png";
  if (nameKey.includes("personal") || nameKey.includes("elder") || nameKey.includes("care")) return "/images/service_personal_care.png";
  if (nameKey.includes("deliver") || nameKey.includes("pickup") || nameKey.includes("errand")) return "/images/service_delivery.png";
  return "/images/service_others.png";
}

const FALLBACK_SERVICES = [
  {
    name: "Home Cleaning",
    slug: "home-cleaning",
    icon: "🧹",
    image: "/images/service_home_cleaning.png",
    startingPricePaise: 29900,
    description:
      "Full home deep cleaning, kitchen degreasing, bathroom descaling, and sofa vacuuming by ID-verified cleaners.",
    subServices: ["Full Home Deep Cleaning", "Bathroom Descaling", "Kitchen Sanitization"],
  },
  {
    name: "Plumber",
    slug: "plumber",
    icon: "🚰",
    image: "/images/service_plumbing.png",
    startingPricePaise: 19900,
    description:
      "Tap and mixer leak repair, choked drain clearing, water tank motor fitting, and bathroom sanitaryware installation.",
    subServices: ["Tap & Pipe Leak Repair", "Drain Unblocking", "Water Tank & Motor Fitting"],
  },
  {
    name: "Electrician",
    slug: "electrician",
    icon: "⚡",
    image: "/images/service_electrical.png",
    startingPricePaise: 19900,
    description:
      "Switchboard repair, ceiling fan & light installation, MCB troubleshooting, and inverter battery wiring.",
    subServices: ["Switchboard & Wiring", "Fan & Light Fitting", "Inverter & MCB Repair"],
  },
  {
    name: "Carpenter",
    slug: "carpenter",
    icon: "🪚",
    image: "/images/service_carpenter.png",
    startingPricePaise: 24900,
    description:
      "Bed and wardrobe assembly, wooden door alignment, lock replacement, and kitchen cabinet hinge repair.",
    subServices: ["Furniture Assembly", "Door & Lock Repair", "Kitchen Hinge Fixing"],
  },
  {
    name: "Driver",
    slug: "driver",
    icon: "🚗",
    image: "/images/service_driver.png",
    startingPricePaise: 29900,
    description:
      "License-verified personal drivers for local city errands, hospital visits, airport drops, and outstation trips.",
    subServices: ["Hourly Local Chauffeur", "Airport Transfers", "Outstation Family Trips"],
  },
  {
    name: "Cooking",
    slug: "cooking",
    icon: "🍳",
    image: "/images/service_cooking.png",
    startingPricePaise: 29900,
    description:
      "Fresh home-cooked meals, daily tiffin preparation, and party cooking by hygienic home cooks.",
    subServices: ["Daily Meal Prep", "North & South Indian Cooking", "Small Gathering Catering"],
  },
  {
    name: "Personal Care",
    slug: "personal-care",
    icon: "💆",
    image: "/images/service_personal_care.png",
    startingPricePaise: 39900,
    description:
      "Trusted personal care, elderly companionship, mobility assistance, and daily wellness support at home.",
    subServices: ["Elderly Companionship", "Home Wellness Support", "Hospital Visit Assistance"],
  },
  {
    name: "Others",
    slug: "others",
    icon: "✨",
    image: "/images/service_others.png",
    startingPricePaise: 19900,
    description:
      "Balcony gardening, festival decoration, home organization, and custom multi-purpose household help.",
    subServices: ["Balcony Plant Care", "Home Organization", "Custom Household Tasks"],
  },
];

export default async function ServicesHubPage() {
  const data = await fetchSeoApi("/seo/public/services", { revalidate: 300 });
  const services =
    data?.services && data.services.length > 0 ? data.services : FALLBACK_SERVICES;
  const locations = data?.locations || [
    { name: "Meerut", slug: "meerut" },
    { name: "Noida", slug: "noida" },
    { name: "Ghaziabad", slug: "ghaziabad" },
    { name: "Delhi", slug: "delhi" },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 flex-1 w-full">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Services", href: "/services" },
          ]}
        />

        <header className="rounded-3xl border border-slate-800 bg-slate-900/70 p-8 sm:p-10 mb-10">
          <span className="inline-flex items-center rounded-full bg-blue-500/15 px-3 py-1 text-xs font-bold text-blue-400 mb-3">
            VERIFIED HOME & PERSONAL SERVICES
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Explore Verified Home Services on HireBuddy
          </h1>
          <p className="mt-3 max-w-3xl text-slate-300 text-sm sm:text-base leading-relaxed">
            Connect with government-ID verified independent professionals for home cleaning,
            plumbing, electrical repairs, carpentry, and personal driving. Compare transparent
            starting rates and pay safely with 100% escrow protection.
          </p>
        </header>

        <section aria-label="Service Categories" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((svc) => {
            const priceRupees = Math.round((svc.startingPricePaise || 19900) / 100);
            const subList = Array.isArray(svc.subServices) ? svc.subServices : [];
            const bannerImg = resolveServiceBannerImage(svc);
            return (
              <article
                key={svc.slug}
                className="flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/80 hover:border-blue-500/50 transition group"
              >
                <div>
                  <div className="relative h-48 w-full overflow-hidden bg-slate-950">
                    <img
                      src={bannerImg}
                      alt={`${svc.name} Service on HireBuddy`}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/30 to-transparent" />
                    <span className="absolute top-3 left-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950/80 backdrop-blur-md text-xl border border-slate-700/60">
                      {svc.icon || "🛠️"}
                    </span>
                    <span className="absolute top-3 right-3 rounded-full bg-emerald-500/90 backdrop-blur-md px-3 py-1 text-xs font-bold text-slate-950 shadow-md">
                      Starts at ₹{priceRupees}
                    </span>
                  </div>

                  <div className="p-6 pb-0">
                    <h2 className="text-xl font-bold text-white">
                      <Link href={`/services/${svc.slug}`} className="hover:text-blue-400 transition">
                        {svc.name}
                      </Link>
                    </h2>
                    <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                      {svc.description}
                    </p>
                    {subList.length > 0 && (
                      <ul className="mt-4 space-y-1.5 text-xs text-slate-400">
                        {subList.slice(0, 4).map((item, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                <div className="p-6 pt-4 mt-6 border-t border-slate-800 flex items-center justify-between">
                  <Link
                    href={`/services/${svc.slug}`}
                    className="text-xs font-bold text-blue-400 hover:text-blue-300"
                  >
                    View {svc.name} Details →
                  </Link>
                  <Link
                    href={`/post-task?category=${encodeURIComponent(svc.name)}`}
                    className="rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-blue-500 transition"
                  >
                    Book Now
                  </Link>
                </div>
              </article>
            );
          })}
        </section>

        <section className="mt-14 rounded-3xl border border-slate-800 bg-slate-900/50 p-8">
          <h2 className="text-2xl font-bold text-white mb-2">
            Browse Services by Supported City
          </h2>
          <p className="text-sm text-slate-400 mb-6">
            Select your city to check local helper availability, covered neighborhoods, and city-specific pricing.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {locations.map((loc) => (
              <Link
                key={loc.slug}
                href={`/locations/${loc.slug}`}
                className="rounded-2xl border border-slate-800 bg-slate-950 p-4 hover:border-emerald-500/50 transition"
              >
                <p className="text-base font-bold text-white">Helpers in {loc.name}</p>
                <p className="mt-1 text-xs text-slate-400">
                  View available services in {loc.name} →
                </p>
              </Link>
            ))}
          </div>
        </section>

        <InternalLinksSection />
      </div>

      <Footer />
    </div>
  );
}
