import "./globals.css";
import Providers from "./providers";
import JsonLd from "./components/seo/JsonLd";
import AnalyticsTracker from "./components/seo/AnalyticsTracker";
import { SITE_URL, generateCanonicalUrl } from "./lib/seo";
import {
  buildOrganizationSchema,
  buildWebSiteSchema,
  buildLocalBusinessSchema,
} from "./lib/schema";

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "HireBuddy — Verified Local Helpers for Home Cleaning, Plumber, Electrician & Driver Services",
    template: "%s | HireBuddy",
  },
  description:
    "Book government-ID verified local helpers for home cleaning, plumbing, electrical repair, carpentry, and driver services across Meerut, Noida, Ghaziabad & Delhi with 100% escrow protection.",
  keywords: [
    "HireBuddy",
    "Home Cleaning Services",
    "Plumber Near Me",
    "Verified Electrician",
    "Carpenter Services",
    "Hire Personal Driver",
    "Meerut Home Services",
    "Noida Home Cleaning",
  ],
  alternates: {
    canonical: generateCanonicalUrl("/"),
  },
  openGraph: {
    title: "HireBuddy — Verified Local Helpers & Home Services Marketplace",
    description:
      "Compare verified local helpers for home cleaning, plumbing, electrical, carpentry and driving with upfront pricing and escrow payment protection.",
    url: SITE_URL,
    type: "website",
    locale: "en_IN",
    siteName: "HireBuddy",
    images: [
      {
        url: `${SITE_URL}/home2.png`,
        width: 1200,
        height: 630,
        alt: "HireBuddy Verified Home Services Marketplace in India",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "HireBuddy — Verified Local Helpers & Home Services Marketplace",
    description:
      "Book verified cleaners, plumbers, electricians, carpenters and drivers with escrow safety.",
    images: [`${SITE_URL}/home2.png`],
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GSC_VERIFICATION || "hirebuddy-gsc-verification",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({ children }) {
  const globalSchemas = [
    buildOrganizationSchema(),
    buildWebSiteSchema(),
    buildLocalBusinessSchema(),
  ];

  return (
    <html lang="en" data-theme="light" className="light">
      <body className="bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <JsonLd data={globalSchemas} />
        <AnalyticsTracker />
        <Providers>
          <main className="overflow-y-auto">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
