import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import Header from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";
import Breadcrumbs from "../../components/seo/Breadcrumbs";
import JsonLd from "../../components/seo/JsonLd";
import InternalLinksSection from "../../components/seo/InternalLinksSection";
import AnalyticsTracker from "../../components/seo/AnalyticsTracker";
import { fetchSeoApi, generateServiceMetadata } from "../../lib/seo";
import { buildServiceSchema, buildFaqSchema } from "../../lib/schema";

const ALIAS_REDIRECTS = {
  plumbing: "plumber",
  electrical: "electrician",
  "driver-services": "driver",
  "furniture-assembly": "carpenter",
  cleaning: "home-cleaning",
};

export async function generateMetadata({ params }) {
  const resolved = await params;
  const rawSlug = String(resolved?.serviceSlug || "").toLowerCase();
  const targetSlug = ALIAS_REDIRECTS[rawSlug] || rawSlug;
  const data = await fetchSeoApi(`/seo/public/services/${targetSlug}`, { revalidate: 300 });
  if (!data?.service) {
    return generateServiceMetadata(null);
  }
  return generateServiceMetadata(data.service, data.indexability);
}

export default async function ServiceDetailPage({ params }) {
  const resolved = await params;
  const rawSlug = String(resolved?.serviceSlug || "").toLowerCase();

  if (ALIAS_REDIRECTS[rawSlug]) {
    permanentRedirect(`/services/${ALIAS_REDIRECTS[rawSlug]}`);
  }

  const data = await fetchSeoApi(`/seo/public/services/${rawSlug}`, { revalidate: 300 });
  if (!data?.service) {
    notFound();
  }

  const {
    service,
    helpers = [],
    serviceLocations = [],
    relatedServices = [],
    supportedLocations = [],
    relatedBlogs = [],
  } = data;

  const subServices = Array.isArray(service.subServices) ? service.subServices : [];
  const benefits = Array.isArray(service.benefits) ? service.benefits : [];
  const howItWorks = Array.isArray(service.howItWorks) ? service.howItWorks : [];
  const faqs = Array.isArray(service.faqs) ? service.faqs : [];

  // Aggregate genuine reviews across helpers for this service
  const genuineReviews = helpers.flatMap((h) =>
    (h.reviews || []).map((r) => ({
      ...r,
      helperName: h.name,
      helperSlug: h.slug,
    }))
  );
  const avgRating =
    genuineReviews.length > 0
      ? Number(
          (
            genuineReviews.reduce((sum, r) => sum + Number(r.rating || 5), 0) /
            genuineReviews.length
          ).toFixed(1)
        )
      : null;

  const schemas = [
    buildServiceSchema({
      name: `${service.name} Services`,
      description: service.metaDescription || service.description,
      serviceType: service.name,
      path: `/services/${service.slug}`,
      startingPriceRupees: service.startingPriceRupees || 199,
      rating: avgRating,
      reviewCount: genuineReviews.length,
    }),
    buildFaqSchema(faqs),
  ].filter(Boolean);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <JsonLd data={schemas} />
      <AnalyticsTracker
        pageEvent="service_page_visit"
        eventProps={{ service_slug: service.slug, service_name: service.name }}
      />
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 flex-1 w-full">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Services", href: "/services" },
            { label: service.name, href: `/services/${service.slug}` },
          ]}
        />

        {/* 1 & 2. Service Hero, H1, Introduction, Pricing & Strong Booking CTA */}
        <section className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900/90 to-blue-950/30 p-8 sm:p-10 mb-10">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="text-3xl">{service.icon || "🛠️"}</span>
            <span className="rounded-full bg-blue-500/15 px-3 py-1 text-xs font-bold text-blue-400">
              GOVT ID VERIFIED PROFESSIONALS
            </span>
            <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-400">
              Starting at ₹{service.startingPriceRupees || 199}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            {service.h1Heading || `${service.name} Services`}
          </h1>

          <p className="mt-4 max-w-3xl text-base text-slate-300 leading-relaxed">
            {service.introContent || service.description}
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-4">
            <Link
              href={`/post-task?category=${encodeURIComponent(service.name)}`}
              className="rounded-2xl bg-blue-600 px-6 py-3.5 text-sm font-bold text-white hover:bg-blue-500 transition shadow-lg shadow-blue-600/25"
            >
              Book {service.name} Now
            </Link>
            <Link
              href="/pricing"
              className="rounded-2xl border border-slate-700 bg-slate-900 px-5 py-3.5 text-sm font-semibold text-slate-200 hover:bg-slate-800 transition"
            >
              View Price & GST Breakdown
            </Link>
          </div>
        </section>

        {/* 3 & 4. Detailed Description, Sub-Services & Benefits */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <section className="lg:col-span-2 rounded-3xl border border-slate-800 bg-slate-900/70 p-7">
            <h2 className="text-2xl font-bold text-white mb-3">
              About Our {service.name} Service
            </h2>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              {service.detailedContent || service.description}
            </p>

            {subServices.length > 0 && (
              <div className="mt-6">
                <h3 className="text-base font-bold text-white mb-3">
                  What Is Covered in {service.name} Bookings
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {subServices.map((sub, idx) => (
                    <div
                      key={idx}
                      className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3.5 text-sm text-slate-200 flex items-center gap-2.5"
                    >
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span>{sub}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          <aside className="rounded-3xl border border-slate-800 bg-slate-900/70 p-7">
            <h2 className="text-xl font-bold text-white mb-4">
              Why Book {service.name} on HireBuddy?
            </h2>
            <ul className="space-y-3 text-sm text-slate-300">
              {benefits.map((b, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span className="mt-0.5 text-blue-400 font-bold">●</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-300">
              <strong>100% Escrow Payment Protection:</strong> Your payment is held safely and
              settled to the helper only after you confirm service completion.
            </div>
          </aside>
        </div>

        {/* 6 & 12. Service Availability by City (Links to /services/[serviceSlug]/[locationSlug]) */}
        <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-7 mb-12">
          <h2 className="text-2xl font-bold text-white mb-2">
            {service.name} Availability by City
          </h2>
          <p className="text-sm text-slate-400 mb-5">
            Select your city to view local {service.name.toLowerCase()} rates, covered sectors, and available helpers.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {serviceLocations.map((slp) => (
              <Link
                key={slp.id}
                href={`/services/${slp.serviceSlug}/${slp.locationSlug}`}
                className="rounded-2xl border border-slate-800 bg-slate-950 p-4 hover:border-blue-500/50 transition"
              >
                <p className="font-bold text-white">
                  {slp.serviceName} in {slp.locationName}
                </p>
                <p className="mt-1 text-xs text-emerald-400 font-semibold">
                  Starts at ₹{Math.round((slp.startingPricePaise || 19900) / 100)} •{" "}
                  {slp.availableHelpersCount} Helpers
                </p>
              </Link>
            ))}
            {supportedLocations.map((loc) => (
              <Link
                key={loc.slug}
                href={`/locations/${loc.slug}`}
                className="rounded-2xl border border-slate-800 bg-slate-950 p-4 hover:border-slate-700 transition"
              >
                <p className="font-bold text-slate-200">All Services in {loc.name}</p>
                <p className="mt-1 text-xs text-slate-400">Explore {loc.name} coverage →</p>
              </Link>
            ))}
          </div>
        </section>

        {/* 7. Verified Helper Profiles */}
        {helpers.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-2">
              Verified {service.name} Helpers
            </h2>
            <p className="text-sm text-slate-400 mb-5">
              Background-checked independent service professionals available on HireBuddy.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {helpers.slice(0, 4).map((h) => (
                <Link
                  key={h.id}
                  href={`/helpers/${h.slug}`}
                  className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 hover:border-blue-500/40 transition"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-white">{h.name}</span>
                    {h.isVerified && (
                      <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                        KYC Verified
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">
                    {h.city} • {h.experience}+ yrs exp
                  </p>
                  <p className="mt-3 text-xs font-semibold text-blue-400">
                    ₹{h.hourlyRateRupees}/visit • View Profile →
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* 9. How the Service Works */}
        {howItWorks.length > 0 && (
          <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-7 mb-12">
            <h2 className="text-2xl font-bold text-white mb-6">
              How {service.name} Booking Works on HireBuddy
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {howItWorks.map((stepObj) => (
                <div
                  key={stepObj.step}
                  className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5"
                >
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-xs font-extrabold text-white mb-3">
                    0{stepObj.step}
                  </span>
                  <h3 className="text-base font-bold text-white">{stepObj.title}</h3>
                  <p className="mt-2 text-xs text-slate-300 leading-relaxed">{stepObj.detail}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 8. Genuine Customer Reviews (Only rendered when genuine reviews exist) */}
        {genuineReviews.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-4">
              Verified Customer Reviews ({genuineReviews.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {genuineReviews.slice(0, 3).map((rev) => (
                <div
                  key={rev.id}
                  className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"
                >
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-bold text-white">{rev.reviewerName}</span>
                    <span className="text-amber-400 font-bold">★ {rev.rating}/5</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{rev.comment}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 10. Frequently Asked Questions */}
        {faqs.length > 0 && (
          <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-7 mb-12">
            <h2 className="text-2xl font-bold text-white mb-5">
              Frequently Asked Questions — {service.name}
            </h2>
            <div className="space-y-4">
              {faqs.map((faq, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5"
                >
                  <h3 className="text-base font-bold text-white">{faq.question}</h3>
                  <p className="mt-2 text-sm text-slate-300 leading-relaxed">{faq.answer}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 11. Related Services & Blog Guides */}
        {relatedServices.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-bold text-white mb-4">Related Home Services</h2>
            <div className="flex flex-wrap gap-3">
              {relatedServices.map((rel) => (
                <Link
                  key={rel.slug}
                  href={`/services/${rel.slug}`}
                  className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-xs font-bold text-slate-200 hover:border-blue-500/50 transition"
                >
                  {rel.icon} {rel.name} Services
                </Link>
              ))}
            </div>
          </section>
        )}

        {relatedBlogs.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-bold text-white mb-4">Helpful Guides & Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {relatedBlogs.map((b) => (
                <Link
                  key={b.slug}
                  href={`/blog/${b.slug}`}
                  className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 hover:border-purple-500/50 transition"
                >
                  <p className="text-xs font-bold text-purple-400">{b.category}</p>
                  <h3 className="mt-1 text-sm font-bold text-white">{b.title}</h3>
                  <p className="mt-2 text-xs text-slate-400 line-clamp-2">{b.excerpt}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        <InternalLinksSection currentServiceSlug={service.slug} />
      </div>

      <Footer />
    </div>
  );
}
