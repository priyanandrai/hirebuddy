export default function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://hirebuddy.in";
  const routes = [
    "",
    "/marketplace",
    "/become-a-seller",
    "/post-task",
    "/login",
    "/signup",
    "/privacy",
    "/terms",
    "/refund-policy",
    "/shipping-policy",
    "/seller-agreement",
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "/marketplace" || route === "" ? "daily" : "weekly",
    priority: route === "" || route === "/marketplace" ? 1.0 : 0.8,
  }));
}
