import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";
import Breadcrumbs from "../../components/seo/Breadcrumbs";
import JsonLd from "../../components/seo/JsonLd";
import InternalLinksSection from "../../components/seo/InternalLinksSection";
import AnalyticsTracker from "../../components/seo/AnalyticsTracker";
import { fetchSeoApi, generateLocationMetadata } from "../../lib/seo";
import { buildFaqSchema } from "../../lib/schema";

export async function generateMetadata({ params }) {
  const resolved = await params;
  const slug = String(resolved?.locationSlug || "").toLowerCase();
  const data = await fetchSeoApi(`/seo/public/locations/${slug}`, { revalidate: 300 });
  if (!data?.location) {
    return generateLocationMetadata(null);
  }
  return generateLocationMetadata(data.location, data.indexability);
}

export default async function LocationDetailPage({ params }) {
  const resolved = await params;
  const slug = String(resolved?.locationSlug || "").toLowerCase();
  const data = await fetchSeoApi(`/seo/public/locations/${slug}`, { revalidate: 300 });

  if (!data?.location) {
    notFound();
  }

  const {
    location,
    servicePagesInCity = [],
    availableServices = [],
    relatedLocations = [],
    helpers = [],
  } = data;

  const serviceAreas = Array.isArray(location.serviceAreas) ? location.serviceAreas : [];
  const faqs = Array.isArray(location.faqs) ? location.faqs : [];
  const faqSchema = buildFaqSchema(faqs);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {faqSchema && <JsonLd data={faqSchema} />}
      <AnalyticsTracker
        pageEvent="location_page_visit"
        eventProps={{ location_slug: location.slug, location_name: location.name }}
      />
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 flex-1 w-full">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Locations", href: "/locations" },
            { label: location.name, href: `/locations/${location.slug}` },
          ]}
        />

        {/* 1. City Hero & Introduction */}
        <section className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900/90 to-emerald-950/30 p-8 sm:p-10 mb-10">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-400">
              {location.stateName.toUpperCase()} • {location.activeHelpersCount || 40}+ VERIFIED HELPERS
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            {location.h1Heading || `Verified Home Services & Helpers in ${location.name}`}
          </h1>

          <p className="mt-4 max-w-3xl text-base text-slate-300 leading-relaxed">
            {location.introContent}
          </p>

          <div className="mt-7 flex flex-wrap gap-4">
            <Link
              href={`/post-task?location=${encodeURIComponent(location.name)}`}
              className="rounded-2xl bg-blue-600 px-6 py-3.5 text-sm font-bold text-white hover:bg-blue-500 transition shadow-lg shadow-blue-600/25"
            >
              Book a Verified Helper in {location.name}
            </Link>
            <Link
              href="/services"
              className="rounded-2xl border border-slate-700 bg-slate-900 px-5 py-3.5 text-sm font-semibold text-slate-200 hover:bg-slate-800 transition"
            >
              Explore All Services
            </Link>
          </div>
        </section>

        {/* 2 & 6. City-Specific Service Landing Pages & Pricing */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-2">
            Available Home Services in {location.name}
          </h2>
          <p className="text-sm text-slate-400 mb-6">
            Compare starting prices and book verified local specialists in {location.name}.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {servicePagesInCity.map((slp) => (
              <Link
                key={slp.id}
                href={`/services/${slp.serviceSlug}/${slp.locationSlug}`}
                className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 hover:border-blue-500/50 transition"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold text-white">
                    {slp.serviceName} in {location.name}
                  </h3>
                  <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-bold text-emerald-400">
                    ₹{Math.round((slp.startingPricePaise || 19900) / 100)}+
                  </span>
                </div>
                <p className="text-xs text-slate-300 line-clamp-2">{slp.introContent}</p>
                <p className="mt-4 text-xs font-bold text-blue-400">
                  {slp.availableHelpersCount} Verified Helpers Available →
                </p>
              </Link>
            ))}

            {availableServices.map((svc) => (
              <Link
                key={svc.slug}
                href={`/services/${svc.slug}`}
                className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 hover:border-slate-700 transition"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-base font-bold text-slate-200">
                    {svc.icon} {svc.name}
                  </h3>
                  <span className="text-xs font-semibold text-emerald-400">
                    From ₹{Math.round((svc.startingPricePaise || 19900) / 100)}
                  </span>
                </div>
                <p className="text-xs text-slate-400 line-clamp-2">{svc.description}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* 3 & 4. Real Service Coverage & Neighborhoods */}
        <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-7 mb-12">
          <h2 className="text-2xl font-bold text-white mb-3">
            Service Coverage & Localities in {location.name}
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed mb-5">
            {location.coverageDescription}
          </p>
          {serviceAreas.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {serviceAreas.map((area, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3.5 text-xs sm:text-sm text-slate-200 flex items-center gap-2"
                >
                  <span className="text-emerald-400">📍</span>
                  <span>{area}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 5. Verified Helpers in Location */}
        {helpers.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-4">
              Verified Local Helpers Serving {location.name}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {helpers.slice(0, 3).map((h) => (
                <Link
                  key={h.id}
                  href={`/helpers/${h.slug}`}
                  className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 hover:border-blue-500/40 transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{h.name}</span>
                    <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                      ID Verified
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    {(h.skills || []).join(", ")} • {h.experience}+ yrs exp
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* FAQs */}
        {faqs.length > 0 && (
          <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-7 mb-12">
            <h2 className="text-2xl font-bold text-white mb-5">
              Frequently Asked Questions — {location.name}
            </h2>
            <div className="space-y-4">
              {faqs.map((faq, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5"
                >
                  <h3 className="text-base font-bold text-white">{faq.question}</h3>
                  <p className="mt-2 text-sm text-slate-300">{faq.answer}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 9. Related Supported Locations */}
        {relatedLocations.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-bold text-white mb-4">Nearby Supported Cities</h2>
            <div className="flex flex-wrap gap-3">
              {relatedLocations.map((rel) => (
                <Link
                  key={rel.slug}
                  href={`/locations/${rel.slug}`}
                  className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-xs font-bold text-slate-200 hover:border-emerald-500/50"
                >
                  Helpers in {rel.name}
                </Link>
              ))}
            </div>
          </section>
        )}

        <InternalLinksSection currentLocationSlug={location.slug} />
      </div>

      <Footer />
    </div>
  );
}
