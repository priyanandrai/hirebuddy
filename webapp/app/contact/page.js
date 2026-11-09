import Link from "next/link";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import Breadcrumbs from "../components/seo/Breadcrumbs";
import InternalLinksSection from "../components/seo/InternalLinksSection";
import { generatePageMetadata } from "../lib/seo";
import { HIREBUDDY_BUSINESS_INFO } from "../lib/schema";

export const metadata = generatePageMetadata({
  title: "Contact HireBuddy — Customer Support, Helper Verification & Business Inquiries",
  description:
    "Contact HireBuddy customer support and operations team for booking assistance, helper KYC verification, billing queries, or partnerships.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 flex-1 w-full">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Contact", href: "/contact" },
          ]}
        />

        <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-8 sm:p-10 mb-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
            Contact HireBuddy Support & Operations
          </h1>
          <p className="mt-3 max-w-2xl text-sm sm:text-base text-slate-300">
            Have a question about a service booking, escrow payment, GST invoice, or helper
            verification? Reach out to our support team or open a priority support ticket.
          </p>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
              <p className="text-xs font-bold uppercase text-blue-400">Headquarters Address</p>
              <p className="mt-2 font-bold text-white">{HIREBUDDY_BUSINESS_INFO.legalName}</p>
              <p className="mt-1 text-xs text-slate-300">
                {HIREBUDDY_BUSINESS_INFO.headquarters.streetAddress},{" "}
                {HIREBUDDY_BUSINESS_INFO.headquarters.addressLocality},{" "}
                {HIREBUDDY_BUSINESS_INFO.headquarters.addressRegion} -{" "}
                {HIREBUDDY_BUSINESS_INFO.headquarters.postalCode}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
              <p className="text-xs font-bold uppercase text-emerald-400">Customer & Helper Helpdesk</p>
              <p className="mt-2 font-bold text-white">{HIREBUDDY_BUSINESS_INFO.email}</p>
              <p className="mt-1 text-xs text-slate-300">
                Phone: {HIREBUDDY_BUSINESS_INFO.phone} (7:00 AM – 9:00 PM IST)
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
              <p className="text-xs font-bold uppercase text-purple-400">Online Support Ticket</p>
              <p className="mt-2 text-xs text-slate-300">
                Raise a ticket for fast booking or payment resolution.
              </p>
              <Link
                href="/support"
                className="mt-4 inline-block rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500"
              >
                Open Support Ticket →
              </Link>
            </div>
          </div>
        </section>

        <InternalLinksSection />
      </div>

      <Footer />
    </div>
  );
}
