
import "./globals.css";
import Providers from "./providers";

export const metadata = {
  title: {
    default: "HireBuddy — Verified Local Buddies & Meerut Manufacturers Marketplace",
    template: "%s | HireBuddy",
  },
  description:
    "Hire verified local Buddies for daily tasks with 100% escrow protection, or shop factory-direct products from Meerut manufacturers (Sports Goods, Scissors, Gazak & Sweets, Musical Instruments).",
  keywords: [
    "HireBuddy",
    "Meerut Marketplace",
    "Meerut Manufacturers",
    "Meerut Sports Goods",
    "Local Buddy Services",
    "Hyperlocal Tasks India",
  ],
  openGraph: {
    title: "HireBuddy — Local Buddies & Meerut Factory-Direct Marketplace",
    description:
      "Post tasks with 0% Buddy commission & escrow protection, or order directly from verified Meerut manufacturers.",
    type: "website",
    locale: "en_IN",
    siteName: "HireBuddy",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <Providers>
          <main className="overflow-y-auto">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
