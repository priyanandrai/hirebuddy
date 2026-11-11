import { fetchSeoApi, generatePageMetadata } from "../lib/seo";

export async function generateMetadata() {
  const res = await fetchSeoApi("/seo/public/page-config?path=/how-it-works");
  const p = res?.config;
  return generatePageMetadata({
    title: p?.seoTitle || "How HireBuddy Works – Book Verified Helpers in 3 Steps",
    description:
      p?.metaDescription ||
      "See how HireBuddy makes booking local helpers simple, transparent, and safe. Choose your service, review upfront pricing, and book verified professionals.",
    path: "/how-it-works",
    canonicalUrl: p?.canonicalUrl,
  });
}

export default function HowItWorksLayout({ children }) {
  return children;
}
