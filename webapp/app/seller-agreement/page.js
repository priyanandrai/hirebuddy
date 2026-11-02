import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";

export const metadata = {
  title: "Seller & Buddy Partner Agreement",
  description:
    "Terms governing Meerut Manufacturers (10%-20% commission split, Daily NEFT settlement, FSSAI/GST KYC) and Buddy Partners (100% task payout, ₹5/day or ₹99/month active pass).",
};

export default function SellerAgreementPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Header />
      <main className="flex-1 mx-auto max-w-4xl px-6 py-12 space-y-6">
        <div className="rounded-3xl bg-white border border-slate-200 p-8 shadow-sm space-y-6">
          <div>
            <span className="inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800">
              Partner & Manufacturer Legal Terms
            </span>
            <h1 className="mt-2 text-3xl font-extrabold text-slate-900">
              Meerut Manufacturer Seller & Buddy Partner Agreement
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Last Updated: November 2026 • Governed by Indian IT Act, Consumer Protection (E-Commerce) Rules & GST Laws
            </p>
          </div>

          <section className="space-y-2 text-sm text-slate-700 leading-relaxed">
            <h2 className="text-lg font-bold text-slate-900">
              1. Buddy Partner Subscription Model (0% Commission, 100% Task Payout)
            </h2>
            <p>
              100% of the agreed task payment goes directly to the Buddy Partner upon customer completion release from
              escrow. HireBuddy does not deduct a percentage commission from task earnings. Instead, Buddies maintain an
              active account pass at <strong>₹5/day</strong> or <strong>₹99/month</strong> (inclusive of applicable
              platform maintenance charges).
            </p>
          </section>

          <section className="space-y-2 text-sm text-slate-700 leading-relaxed">
            <h2 className="text-lg font-bold text-slate-900">
              2. Meerut Manufacturer Onboarding & Mandatory KYC
            </h2>
            <p>
              All manufacturers and sellers onboarding onto the Meerut Marketplace must provide valid{" "}
              <strong>PAN</strong>, <strong>GSTIN</strong> (for taxable goods), <strong>FSSAI License</strong> (mandatory
              for food items such as Meerut Gazak, Rewari, Sweets, and Namkeen), registered factory pickup address,
              authorized contact person details, and verified Bank Account + IFSC details.
            </p>
          </section>

          <section className="space-y-2 text-sm text-slate-700 leading-relaxed">
            <h2 className="text-lg font-bold text-slate-900">
              3. Admin Product Verification & Configurable Commission (10%–20%)
            </h2>
            <p>
              All products added by sellers remain in <code>PENDING_APPROVAL</code> status until verified and published
              by HireBuddy Admin. Platform commission is configured per product between <strong>10% and 20%</strong>.
              For example, if a product&apos;s commission is configured at 15%, 15% is retained in the Platform Account
              and <strong>85%</strong> is allocated to the Seller Account.
            </p>
          </section>

          <section className="space-y-2 text-sm text-slate-700 leading-relaxed">
            <h2 className="text-lg font-bold text-slate-900">
              4. Portion-Wise Split & Daily NEFT Settlement
            </h2>
            <p>
              Seller portions (minus statutory 0.1% TDS u/s 194-O and 0.5% TCS under Section 52 CGST Act where
              applicable) are settled either via instant payment gateway Route split or through{" "}
              <strong>Daily NEFT Settlement Batches</strong> to the seller&apos;s verified bank account with full UTR
              tracking.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
