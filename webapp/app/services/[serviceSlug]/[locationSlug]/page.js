import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import Header from "../../../components/layout/Header";
import Footer from "../../../components/layout/Footer";
import Breadcrumbs from "../../../components/seo/Breadcrumbs";
import JsonLd from "../../../components/seo/JsonLd";
import InternalLinksSection from "../../../components/seo/InternalLinksSection";
import AnalyticsTracker from "../../../components/seo/AnalyticsTracker";
import { fetchSeoApi, generateServiceLocationMetadata } from "../../../lib/seo";
import { buildServiceSchema, buildFaqSchema } from "../../../lib/schema";

const ALIAS_REDIRECTS = {
  plumbing: "plumber",
  electrical: "electrician",
  "driver-services": "driver",
  "furniture-assembly": "carpenter",
  cleaning: "home-cleaning",
};

export async function generateMetadata({ params }) {
  const resolved = await params;
  const rawService = String(resolved?.serviceSlug || "").toLowerCase();
  const serviceSlug = ALIAS_REDIRECTS[rawService] || rawService;
  const locationSlug = String(resolved?.locationSlug || "").toLowerCase();

  const data = await fetchSeoApi(
    `/seo/public/services/${serviceSlug}/locations/${locationSlug}`,
    { revalidate: 300 }
  );
  if (!data?.page) {
    return generateServiceLocationMetadata(null);
  }
  return generateServiceLocationMetadata(data.page, data.indexability);
}

export default async function ServiceLocationLandingPage({ params }) {
  const resolved = await params;
  const rawService = String(resolved?.serviceSlug || "").toLowerCase();
  const locationSlug = String(resolved?.locationSlug || "").toLowerCase();

  if (ALIAS_REDIRECTS[rawService]) {
    permanentRedirect(`/services/${ALIAS_REDIRECTS[rawService]}/${locationSlug}`);
  }

  const data = await fetchSeoApi(
    `/seo/public/services/${rawService}/locations/${locationSlug}`,
    { revalidate: 300 }
  );

  if (!data?.page) {
    notFound();
  }

  const {
    page,
    otherLocationsForService = [],
    otherServicesInLocation = [],
    helpers = [],
  } = data;

  const localAreas = Array.isArray(page.localServiceAreas) ? page.localServiceAreas : [];
  const benefits = Array.isArray(page.benefits) ? page.benefits : [];
  const faqs = Array.isArray(page.faqs) ? page.faqs : [];

  const schemas = [
    buildServiceSchema({
      name: `${page.serviceName} in ${page.locationName}`,
      description: page.metaDescription,
      serviceType: page.serviceName,
      path: `/services/${page.serviceSlug}/${page.locationSlug}`,
      areaServed: [page.locationName],
      startingPriceRupees: page.startingPriceRupees || 249,
    }),
    buildFaqSchema(faqs),
  ].filter(Boolean);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <JsonLd data={schemas} />
      <AnalyticsTracker
        pageEvent="service_page_visit"
        eventProps={{
          service_slug: page.serviceSlug,
          location_slug: page.locationSlug,
        }}
      />
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 flex-1 w-full">
        {/* Visible Breadcrumb: Home > Services > Home Cleaning > Noida */}
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Services", href: "/services" },
            { label: page.serviceName, href: `/services/${page.serviceSlug}` },
            {
              label: page.locationName,
              href: `/services/${page.serviceSlug}/${page.locationSlug}`,
            },
          ]}
        />

        {/* Hero Section */}
        <section className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900/90 to-emerald-950/30 p-8 sm:p-10 mb-10">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-400">
              {page.availableHelpersCount} VERIFIED HELPERS IN {page.locationName.toUpperCase()}
            </span>
            <span className="rounded-full bg-blue-500/15 px-3 py-1 text-xs font-bold text-blue-400">
              Starting at ₹{page.startingPriceRupees}
            </span>
            <span className="rounded-full bg-purple-500/15 px-3 py-1 text-xs font-bold text-purple-300">
              {page.completedJobsCount}+ Completed Bookings
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            {page.h1Heading}
          </h1>

          <p className="mt-4 max-w-3xl text-base text-slate-300 leading-relaxed">
            {page.introContent}
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-4">
            <Link
              href={`/post-task?category=${encodeURIComponent(
                page.serviceName
              )}&location=${encodeURIComponent(page.locationName)}`}
              className="rounded-2xl bg-blue-600 px-6 py-3.5 text-sm font-bold text-white hover:bg-blue-500 transition shadow-lg shadow-blue-600/25"
            >
              Book {page.serviceName} in {page.locationName}
            </Link>
            <Link
              href={`/locations/${page.locationSlug}`}
              className="rounded-2xl border border-slate-700 bg-slate-900 px-5 py-3.5 text-sm font-semibold text-slate-200 hover:bg-slate-800 transition"
            >
              All Services in {page.locationName}
            </Link>
          </div>
        </section>

        {/* Unique Local Guide & Neighborhood Coverage */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <section className="lg:col-span-2 rounded-3xl border border-slate-800 bg-slate-900/70 p-7">
            <h2 className="text-2xl font-bold text-white mb-3">
              Why Residents in {page.locationName} Choose HireBuddy for {page.serviceName}
            </h2>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              {page.localGuideContent}
            </p>

            {localAreas.length > 0 && (
              <div className="mt-6">
                <h3 className="text-base font-bold text-white mb-3">
                  Sectors & Localities Covered in {page.locationName}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {localAreas.map((area, idx) => (
                    <div
                      key={idx}
                      className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3.5 text-xs sm:text-sm text-slate-200 flex items-center gap-2"
                    >
                      <span className="text-emerald-400">📍</span>
                      <span>{area}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          <aside className="rounded-3xl border border-slate-800 bg-slate-900/70 p-7">
            <h2 className="text-xl font-bold text-white mb-4">
              {page.locationName} Service Highlights
            </h2>
            <ul className="space-y-3 text-sm text-slate-300">
              {benefits.map((b, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </aside>
        </div>

        {/* Available Helpers */}
        {helpers.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-4">
              Available Verified Helpers for {page.serviceName} in {page.locationName}
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
                      Verified
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    {h.experience}+ yrs experience • Starts at ₹{h.hourlyRateRupees}
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
              FAQs — {page.serviceName} in {page.locationName}
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

        {/* Related Service-Location Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {otherServicesInLocation.length > 0 && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <h3 className="text-base font-bold text-white mb-3">
                Other Services in {page.locationName}
              </h3>
              <div className="flex flex-wrap gap-2">
                {otherServicesInLocation.map((item) => (
                  <Link
                    key={item.id}
                    href={`/services/${item.serviceSlug}/${item.locationSlug}`}
                    className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-200 hover:border-blue-500/50"
                  >
                    {item.serviceName} in {item.locationName}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {otherLocationsForService.length > 0 && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <h3 className="text-base font-bold text-white mb-3">
                {page.serviceName} in Nearby Cities
              </h3>
              <div className="flex flex-wrap gap-2">
                {otherLocationsForService.map((item) => (
                  <Link
                    key={item.id}
                    href={`/services/${item.serviceSlug}/${item.locationSlug}`}
                    className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-200 hover:border-emerald-500/50"
                  >
                    {item.serviceName} in {item.locationName}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        <InternalLinksSection
          currentServiceSlug={page.serviceSlug}
          currentLocationSlug={page.locationSlug}
        />
      </div>

      <Footer />
    </div>
  );
}
