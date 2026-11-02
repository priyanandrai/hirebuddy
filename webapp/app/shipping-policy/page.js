import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";

export const metadata = {
  title: "Shipping & Delivery Policy",
  description:
    "Shipping, Self-Delivery, and 2% HireBuddy Partner Delivery policy for Meerut Manufacturers Marketplace.",
};

export default function ShippingPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Header />
      <main className="flex-1 mx-auto max-w-4xl px-6 py-12 space-y-6">
        <div className="rounded-3xl bg-white border border-slate-200 p-8 shadow-sm space-y-6">
          <div>
            <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
              Meerut Marketplace Logistics
            </span>
            <h1 className="mt-2 text-3xl font-extrabold text-slate-900">
              Shipping & 2% Partner Delivery Policy
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Effective Date: November 2026 • Applies to all Meerut Manufacturers Marketplace Orders
            </p>
          </div>

          <section className="space-y-2 text-sm text-slate-700 leading-relaxed">
            <h2 className="text-lg font-bold text-slate-900">1. Seller Self-Delivery (Default Mode)</h2>
            <p>
              By default, delivery of all Marketplace products is handled directly by the verified Meerut
              manufacturer/seller from their registered factory pickup point. No extra platform delivery charge is
              added when Seller Self-Delivery is selected.
            </p>
          </section>

          <section className="space-y-2 text-sm text-slate-700 leading-relaxed">
            <h2 className="text-lg font-bold text-slate-900">
              2. HireBuddy Partner Delivery (+2% Automated Delivery Task)
            </h2>
            <p>
              If the seller or customer opts for <strong>HireBuddy Partner Delivery</strong>, an additional{" "}
              <strong>2% delivery fee</strong> (minimum ₹25) is automatically calculated on the order subtotal.
              HireBuddy automatically creates a verified delivery task on behalf of Platform Admin from the
              seller&apos;s verified pickup address to the customer&apos;s delivery address so an available Buddy on the
              platform can accept and complete the delivery.
            </p>
          </section>

          <section className="space-y-2 text-sm text-slate-700 leading-relaxed">
            <h2 className="text-lg font-bold text-slate-900">3. Dispatch Timelines & Tracking</h2>
            <p>
              Standard Meerut hyperlocal deliveries are fulfilled within 2–24 hours of order confirmation. Inter-city
              manufacturer dispatches are initiated within 24–48 business hours. Real-time notifications are sent to
              the Customer, Seller, and Admin at every stage.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
