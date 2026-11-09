import Link from "next/link";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import Breadcrumbs from "../components/seo/Breadcrumbs";
import InternalLinksSection from "../components/seo/InternalLinksSection";
import { generatePageMetadata } from "../lib/seo";

export const metadata = generatePageMetadata({
  title: "Transparent Service Pricing & GST Breakdown | HireBuddy",
  description:
    "View upfront starting prices for Home Cleaning, Plumber, Electrician, Carpenter, and Driver services on HireBuddy with complete tax and escrow transparency.",
  path: "/pricing",
});

const PRICING_TIERS = [
  {
    service: "Home Cleaning",
    slug: "home-cleaning",
    startingAt: "₹299",
    scope: "Routine housekeeping, bathroom descaling, kitchen degreasing & full-home deep cleaning",
  },
  {
    service: "Plumber",
    slug: "plumber",
    startingAt: "₹199",
    scope: "Tap & mixer repair, drain blockage removal, water tank motor & sanitaryware fitting",
  },
  {
    service: "Electrician",
    slug: "electrician",
    startingAt: "₹199",
    scope: "Switchboard repair, ceiling fan mounting, MCB troubleshooting & inverter battery setup",
  },
  {
    service: "Carpenter",
    slug: "carpenter",
    startingAt: "₹249",
    scope: "Bed & wardrobe assembly, wooden door alignment, lock replacement & cabinet hinges",
  },
  {
    service: "Personal Driver",
    slug: "driver",
    startingAt: "₹299",
    scope: "Hourly local city drives, medical visits, airport transfers & outstation trips",
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 flex-1 w-full">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Pricing", href: "/pricing" },
          ]}
        />

        <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-8 sm:p-10 mb-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
            Transparent Upfront Pricing for Every Home Service
          </h1>
          <p className="mt-3 max-w-3xl text-sm sm:text-base text-slate-300">
            Every booking on HireBuddy shows an itemized price breakdown before payment—including
            base service value, promotional discounts, and applicable Indian GST—with 100% escrow
            protection until service completion.
          </p>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {PRICING_TIERS.map((tier) => (
              <div
                key={tier.slug}
                className="rounded-2xl border border-slate-800 bg-slate-950 p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-bold text-white">{tier.service}</h2>
                    <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-400">
                      Starts at {tier.startingAt}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{tier.scope}</p>
                </div>
                <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between">
                  <Link
                    href={`/services/${tier.slug}`}
                    className="text-xs font-bold text-blue-400 hover:text-blue-300"
                  >
                    Service Details →
                  </Link>
                  <Link
                    href={`/post-task?category=${encodeURIComponent(tier.service)}`}
                    className="rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-blue-500"
                  >
                    Book
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        <InternalLinksSection />
      </div>

      <Footer />
    </div>
  );
}
