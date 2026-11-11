import { fetchSeoApi, generatePageMetadata } from "../lib/seo";

export async function generateMetadata() {
  const res = await fetchSeoApi("/seo/public/page-config?path=/about");
  const p = res?.config;
  return generatePageMetadata({
    title: p?.seoTitle || "About HireBuddy – Trusted Local Home Services Marketplace",
    description:
      p?.metaDescription ||
      "Learn about HireBuddy, our mission to connect customers in Meerut, Noida, Ghaziabad, and Delhi NCR with background-verified independent helpers.",
    path: "/about",
    canonicalUrl: p?.canonicalUrl,
  });
}

export default function AboutLayout({ children }) {
  return children;
}
