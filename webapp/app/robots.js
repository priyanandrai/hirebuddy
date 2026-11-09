import { SITE_URL } from "./lib/seo.js";

export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/services",
          "/services/",
          "/locations",
          "/locations/",
          "/blog",
          "/blog/",
          "/helpers/",
          "/about",
          "/contact",
          "/pricing",
          "/safety",
          "/faq",
          "/how-it-works",
        ],
        disallow: [
          "/api/",
          "/admin/",
          "/dashboard/",
          "/dashboard-tasker/",
          "/dashboard-seller/",
          "/login",
          "/signup",
          "/post-task",
          "/hire-buddy",
          "/*?sort=",
          "/*?filter=",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
