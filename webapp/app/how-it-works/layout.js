import { fetchSeoApi, generatePageMetadata } from "../lib/seo";

export async function generateMetadata() {
  const res = await fetchSeoApi("/api/seo/public/page?path=/how-it-works");
  const p = res?.page;
  return generatePageMetadata({
    title: p?.seoTitle || "How HireBuddy Works – Book Verified Helpers in 3 Steps",
    description:
      p?.seoDescription ||
      "See how HireBuddy makes booking local helpers simple, transparent, and safe. Choose your service, review upfront pricing, and book verified professionals.",
    path: "/how-it-works",
    canonicalUrl: p?.canonicalUrl,
  });
}

export default function HowItWorksLayout({ children }) {
  return children;
}
