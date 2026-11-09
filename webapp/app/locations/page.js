import Link from "next/link";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import Breadcrumbs from "../components/seo/Breadcrumbs";
import InternalLinksSection from "../components/seo/InternalLinksSection";
import { fetchSeoApi, generatePageMetadata } from "../lib/seo";

export const metadata = generatePageMetadata({
  title: "Supported Cities & Service Locations — Meerut, Noida, Ghaziabad & Delhi | HireBuddy",
  description:
    "Explore HireBuddy service coverage across Meerut, Noida, Ghaziabad, and Delhi NCR. Book verified home cleaners, plumbers, electricians, carpenters, and drivers.",
  path: "/locations",
});

const FALLBACK_LOCATIONS = [
  {
    name: "Meerut",
    slug: "meerut",
    stateName: "Uttar Pradesh",
    activeHelpersCount: 48,
    introContent:
      "Headquartered in Meerut, covering Modipuram, Pallavpuram, Shastri Nagar, Saket, Ganga Nagar, and Meerut Cantt.",
  },
  {
    name: "Noida",
    slug: "noida",
    stateName: "Uttar Pradesh",
    activeHelpersCount: 64,
    introContent:
      "Serving Sector 18, Sector 50, Sector 62, Sector 76, Sector 137, Noida Expressway, and Greater Noida West.",
  },
  {
    name: "Ghaziabad",
    slug: "ghaziabad",
    stateName: "Uttar Pradesh",
    activeHelpersCount: 42,
    introContent:
      "Active across Indirapuram, Vaishali, Vasundhara, Raj Nagar Extension, Kavi Nagar, and Crossings Republik.",
  },
  {
    name: "Delhi",
    slug: "delhi",
    stateName: "Delhi NCR",
    activeHelpersCount: 55,
    introContent:
      "Covering East Delhi (Mayur Vihar, Patparganj), South Delhi (Saket, Lajpat Nagar), West Delhi (Dwarka), and Rohini.",
  },
];

export default async function LocationsHubPage() {
  const data = await fetchSeoApi("/seo/public/locations", { revalidate: 300 });
  const locations =
    data?.locations && data.locations.length > 0 ? data.locations : FALLBACK_LOCATIONS;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 flex-1 w-full">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Locations", href: "/locations" },
          ]}
        />

        <header className="rounded-3xl border border-slate-800 bg-slate-900/70 p-8 sm:p-10 mb-10">
          <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-400 mb-3">
            SUPPORTED SERVICE CITIES
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Cities & Localities Served by HireBuddy Verified Helpers
          </h1>
          <p className="mt-3 max-w-3xl text-slate-300 text-sm sm:text-base leading-relaxed">
            HireBuddy operates in genuine, supported cities where background-verified helpers are
            actively available for home cleaning, plumbing, electrical repair, carpentry, and
            personal driving.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {locations.map((loc) => (
            <article
              key={loc.slug}
              className="rounded-3xl border border-slate-800 bg-slate-900/80 p-7 flex flex-col justify-between hover:border-emerald-500/50 transition"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    {loc.stateName}
                  </span>
                  <span className="rounded-full bg-blue-500/15 px-3 py-1 text-xs font-bold text-blue-300">
                    {loc.activeHelpersCount || 40}+ Verified Helpers
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-white">
                  <Link href={`/locations/${loc.slug}`} className="hover:text-emerald-400">
                    Home Services in {loc.name}
                  </Link>
                </h2>
                <p className="mt-3 text-sm text-slate-300 leading-relaxed">
                  {loc.introContent}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
                <Link
                  href={`/locations/${loc.slug}`}
                  className="text-xs font-bold text-emerald-400 hover:text-emerald-300"
                >
                  Explore {loc.name} Coverage & Services →
                </Link>
                <Link
                  href={`/post-task?location=${encodeURIComponent(loc.name)}`}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500"
                >
                  Book in {loc.name}
                </Link>
              </div>
            </article>
          ))}
        </div>

        <InternalLinksSection />
      </div>

      <Footer />
    </div>
  );
}
