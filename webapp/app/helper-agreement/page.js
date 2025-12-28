

import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";

export default function HelperAgreementPage() {
  return (
    <>
      <Header />

      <main className="bg-[#f6f8fa]">
        <div className="max-w-4xl mx-auto px-6 py-16">

          {/* Title */}
          <h1 className="text-3xl font-semibold text-gray-900 mb-4">
            Helper Agreement
          </h1>
          <p className="text-sm text-gray-600 mb-10">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <div className="space-y-8 text-sm text-gray-700 leading-relaxed">

            {/* 1 */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                1. Introduction
              </h2>
              <p>
                This Helper Agreement (“Agreement”) governs the relationship
                between HireBuddy and individuals (“Helpers”) who offer
                services through the HireBuddy platform.
              </p>
            </section>

            {/* 2 */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                2. Independent Contractor Relationship
              </h2>
              <p>
                Helpers are independent contractors and not employees,
                partners, agents, or representatives of HireBuddy.
                HireBuddy does not control how services are performed.
              </p>
            </section>

            {/* 3 */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                3. Helper Responsibilities
              </h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>Provide accurate profile and identification details</li>
                <li>Perform tasks professionally, safely, and honestly</li>
                <li>Comply with all applicable laws and regulations</li>
                <li>Respect users’ privacy and property</li>
                <li>Not misuse the platform or user information</li>
              </ul>
            </section>

            {/* 4 */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                4. Payments & Earnings
              </h2>
              <p>
                Helpers are paid for completed tasks as agreed with users.
                HireBuddy may deduct applicable platform or service fees.
                Payment timelines depend on the payment provider.
              </p>
            </section>

            {/* 5 */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                5. Cancellations & Service Issues
              </h2>
              <p>
                Helpers are expected to honor accepted tasks. Repeated
                cancellations, misconduct, or service issues may result
                in suspension or removal from the platform.
              </p>
            </section>

            {/* 6 */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                6. Safety & Liability
              </h2>
              <p>
                Helpers are responsible for their own safety and actions
                while performing tasks. HireBuddy is not liable for
                damages, injuries, or losses arising during service
                execution.
              </p>
            </section>

            {/* 7 */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                7. Account Suspension or Termination
              </h2>
              <p>
                HireBuddy reserves the right to suspend or terminate
                helper accounts that violate this Agreement, platform
                policies, or applicable laws.
              </p>
            </section>

            {/* 8 */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                8. Changes to This Agreement
              </h2>
              <p>
                HireBuddy may update this Helper Agreement from time to time.
                Continued use of the platform constitutes acceptance of
                the updated terms.
              </p>
            </section>

            {/* 9 */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                9. Contact
              </h2>
              <p>
                For questions related to this Agreement, contact us at{" "}
                <span className="font-medium">support@hirebuddy.in</span>.
              </p>
            </section>

          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
