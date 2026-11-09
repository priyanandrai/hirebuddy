import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import Breadcrumbs from "../components/seo/Breadcrumbs";
import JsonLd from "../components/seo/JsonLd";
import InternalLinksSection from "../components/seo/InternalLinksSection";
import { generatePageMetadata } from "../lib/seo";
import { buildFaqSchema } from "../lib/schema";

export const metadata = generatePageMetadata({
  title: "Frequently Asked Questions (FAQ) — Bookings, Payments & Helpers | HireBuddy",
  description:
    "Find answers to common questions about booking verified home helpers, escrow payments, GST invoices, cancellations, and refunds on HireBuddy.",
  path: "/faq",
});

const FAQS = [
  {
    question: "How does HireBuddy verify local helpers?",
    answer:
      "Every helper submits government-issued photo ID and address proof which are reviewed by our verification team before their profile receives a Verified badge.",
  },
  {
    question: "When is my payment released to the helper?",
    answer:
      "Your booking payment stays held in escrow and is released to the helper only after the service is marked completed and confirmed.",
  },
  {
    question: "What cities does HireBuddy currently serve?",
    answer:
      "HireBuddy currently serves Meerut, Noida, Ghaziabad, and Delhi NCR across home cleaning, plumbing, electrical repair, carpentry, and personal driving.",
  },
  {
    question: "How do cancellations and refunds work?",
    answer:
      "If you cancel before the service starts or if a helper is unable to fulfill the booking, a full refund is processed back to your original payment method along with a GST Credit Note.",
  },
];

export default function FaqPage() {
  const faqSchema = buildFaqSchema(FAQS);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {faqSchema && <JsonLd data={faqSchema} />}
      <Header />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 flex-1 w-full">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "FAQ", href: "/faq" },
          ]}
        />

        <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-8 sm:p-10 mb-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
            Frequently Asked Questions About HireBuddy
          </h1>
          <p className="mt-3 text-sm sm:text-base text-slate-300">
            Everything you need to know about booking verified helpers, pricing, escrow protection,
            and refunds.
          </p>

          <div className="mt-8 space-y-4">
            {FAQS.map((faq, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-slate-800 bg-slate-950 p-6"
              >
                <h2 className="text-base font-bold text-white">{faq.question}</h2>
                <p className="mt-2 text-sm text-slate-300 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>

        <InternalLinksSection />
      </div>

      <Footer />
    </div>
  );
}
