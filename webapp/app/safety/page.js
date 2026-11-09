import Link from "next/link";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import Breadcrumbs from "../components/seo/Breadcrumbs";
import InternalLinksSection from "../components/seo/InternalLinksSection";
import { generatePageMetadata } from "../lib/seo";

export const metadata = generatePageMetadata({
  title: "Trust, KYC Verification & Escrow Payment Safety | HireBuddy",
  description:
    "Learn how HireBuddy protects customers and service helpers through mandatory government ID verification, escrow-held payments, and verified reviews.",
  path: "/safety",
});

export default function SafetyPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 flex-1 w-full">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Safety & Trust", href: "/safety" },
          ]}
        />

        <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-8 sm:p-10 mb-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
            Safety, Identity Verification & Escrow Protection at HireBuddy
          </h1>
          <p className="mt-3 max-w-3xl text-sm sm:text-base text-slate-300">
            Your family’s safety and financial security come first. Every helper and booking on
            HireBuddy follows our three-layer safety protocol.
          </p>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
              <h2 className="text-lg font-bold text-white">1. Government ID & Address KYC</h2>
              <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                Helpers submit government-issued identity and residential address documents that are
                verified before their profile is eligible for bookings and payouts.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
              <h2 className="text-lg font-bold text-white">2. Escrow-Held Route Payments</h2>
              <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                Customer payments are held in escrow and are never paid out merely because a booking
                was placed. Funds are settled only after the service is completed and confirmed.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
              <h2 className="text-lg font-bold text-white">3. Verified Booking Reviews</h2>
              <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                Only customers who complete a real booking can rate and review a helper, ensuring
                authentic community feedback.
              </p>
            </div>
          </div>

          <div className="mt-8">
            <Link
              href="/services"
              className="inline-block rounded-2xl bg-blue-600 px-6 py-3 text-sm font-bold text-white hover:bg-blue-500"
            >
              Browse Verified Services →
            </Link>
          </div>
        </section>

        <InternalLinksSection />
      </div>

      <Footer />
    </div>
  );
}
