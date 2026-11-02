export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://hirebuddy.in";
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard/profile", "/api/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
