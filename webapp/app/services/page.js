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

const FALLBACK_SERVICES = [
  {
    name: "Home Cleaning",
    slug: "home-cleaning",
    icon: "🧹",
    startingPricePaise: 29900,
    description:
      "Full home deep cleaning, kitchen degreasing, bathroom descaling, and sofa vacuuming by ID-verified cleaners.",
    subServices: ["Full Home Deep Cleaning", "Bathroom Descaling", "Kitchen Sanitization"],
  },
  {
    name: "Plumber",
    slug: "plumber",
    icon: "🚰",
    startingPricePaise: 19900,
    description:
      "Tap and mixer leak repair, choked drain clearing, water tank motor fitting, and bathroom sanitaryware installation.",
    subServices: ["Tap & Pipe Leak Repair", "Drain Unblocking", "Water Tank & Motor Fitting"],
  },
  {
    name: "Electrician",
    slug: "electrician",
    icon: "⚡",
    startingPricePaise: 19900,
    description:
      "Switchboard repair, ceiling fan & light installation, MCB troubleshooting, and inverter battery wiring.",
    subServices: ["Switchboard & Wiring", "Fan & Light Fitting", "Inverter & MCB Repair"],
  },
  {
    name: "Carpenter",
    slug: "carpenter",
    icon: "🪚",
    startingPricePaise: 24900,
    description:
      "Bed and wardrobe assembly, wooden door alignment, lock replacement, and kitchen cabinet hinge repair.",
    subServices: ["Furniture Assembly", "Door & Lock Repair", "Kitchen Hinge Fixing"],
  },
  {
    name: "Driver",
    slug: "driver",
    icon: "🚗",
    startingPricePaise: 29900,
    description:
      "License-verified personal drivers for local city errands, hospital visits, airport drops, and outstation trips.",
    subServices: ["Hourly Local Chauffeur", "Airport Transfers", "Outstation Family Trips"],
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
            return (
              <article
                key={svc.slug}
                className="flex flex-col justify-between rounded-3xl border border-slate-800 bg-slate-900/80 p-6 hover:border-blue-500/50 transition"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-3xl">{svc.icon || "🛠️"}</span>
                    <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-400">
                      Starts at ₹{priceRupees}
                    </span>
                  </div>
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

                <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
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
