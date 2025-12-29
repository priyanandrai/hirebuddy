

import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";

export default function TermsPage() {
  return (
    <>
      <Header />

      <main className="bg-[#f6f8fa]">
        <div className="max-w-4xl mx-auto px-6 py-16">

          {/* Title */}
          <h1 className="text-3xl font-semibold text-gray-900 mb-4">
            Terms & Conditions
          </h1>
          <p className="text-sm text-gray-600 mb-10">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          {/* Content */}
          <div className="space-y-8 text-sm text-gray-700 leading-relaxed">

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                1. Introduction
              </h2>
              <p>
                Welcome to HireBuddy. By accessing or using our platform, you
                agree to comply with and be bound by these Terms & Conditions.
                If you do not agree, please do not use our services.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                2. Our Services
              </h2>
              <p>
                HireBuddy connects users with local helpers for everyday tasks
                such as shopping, travel assistance, health-related errands,
                and home support. We act as a facilitator and do not directly
                provide these services.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                3. User Responsibilities
              </h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>Provide accurate and complete information</li>
                <li>Use the platform for lawful purposes only</li>
                <li>Respect helpers and other users</li>
                <li>Not misuse or attempt to harm the platform</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                4. Helper Responsibilities
              </h2>
              <p>
                Helpers are responsible for completing tasks honestly and
                safely. HireBuddy does not guarantee the quality or outcome of
                services provided by helpers.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                5. Payments
              </h2>
              <p>
                Payments made through HireBuddy are processed securely.
                Pricing is transparent and agreed upon before task execution.
                Refunds, if any, are subject to our policies.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                6. Limitation of Liability
              </h2>
              <p>
                HireBuddy is not liable for any indirect, incidental, or
                consequential damages arising from the use of our platform or
                services provided by helpers.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                7. Account Termination
              </h2>
              <p>
                We reserve the right to suspend or terminate accounts that
                violate these terms or misuse the platform.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                8. Changes to Terms
              </h2>
              <p>
                HireBuddy may update these Terms & Conditions from time to time.
                Continued use of the platform constitutes acceptance of the
                revised terms.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                9. Contact Us
              </h2>
              <p>
                If you have any questions about these Terms, please contact us
                at <span className="font-medium">support@hirebuddy.in</span>.
              </p>
            </section>

          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
