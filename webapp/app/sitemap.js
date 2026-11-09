import { SITE_URL, fetchSeoApi, generateCanonicalUrl } from "./lib/seo.js";

export default async function sitemap() {
  const data = await fetchSeoApi("/seo/public/sitemap-data", { revalidate: 600 });

  if (data?.entries && Array.isArray(data.entries) && data.entries.length > 0) {
    return data.entries.map((entry) => ({
      url: entry.url,
      lastModified: new Date(entry.lastModified || Date.now()),
      changeFrequency: entry.changeFrequency || "weekly",
      priority: entry.priority ?? 0.8,
    }));
  }

  // Fallback indexable public routes (strictly excludes /login, /signup, /dashboard, /post-task, /payment)
  const fallbackPublicPaths = [
    "/",
    "/about",
    "/contact",
    "/services",
    "/services/home-cleaning",
    "/services/plumber",
    "/services/electrician",
    "/services/carpenter",
    "/services/driver",
    "/locations",
    "/locations/meerut",
    "/locations/noida",
    "/locations/ghaziabad",
    "/locations/delhi",
    "/services/home-cleaning/noida",
    "/services/home-cleaning/ghaziabad",
    "/services/plumber/noida",
    "/services/electrician/meerut",
    "/services/home-cleaning/meerut",
    "/how-it-works",
    "/pricing",
    "/safety",
    "/faq",
    "/blog",
    "/blog/how-to-find-trusted-home-cleaning-services",
    "/blog/how-much-does-home-cleaning-cost-in-noida",
    "/blog/when-should-you-hire-a-professional-plumber",
    "/blog/benefits-of-hiring-verified-home-helpers",
    "/blog/how-to-choose-a-reliable-electrician",
    "/blog/home-maintenance-checklist",
    "/blog/how-to-keep-your-home-clean-and-hygienic",
    "/marketplace",
    "/privacy",
    "/terms",
    "/refund-policy",
    "/shipping-policy",
    "/seller-agreement",
  ];

  return fallbackPublicPaths.map((p) => ({
    url: generateCanonicalUrl(p),
    lastModified: new Date(),
    changeFrequency: p === "/" || p === "/services" ? "daily" : "weekly",
    priority: p === "/" ? 1.0 : p.startsWith("/services") ? 0.9 : 0.8,
  }));
}
