

import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";

export default function PrivacyPolicyPage() {
  return (
    <>
      <Header />

      <main className="bg-[#f6f8fa]">
        <div className="max-w-4xl mx-auto px-6 py-16">

          {/* Title */}
          <h1 className="text-3xl font-semibold text-gray-900 mb-4">
            Privacy Policy
          </h1>
          <p className="text-sm text-gray-600 mb-10">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          {/* Content */}
          <div className="space-y-8 text-sm text-gray-700 leading-relaxed">

            {/* 1 */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                1. Introduction
              </h2>
              <p>
                HireBuddy (“we”, “our”, “us”) respects your privacy and is
                committed to protecting your personal information. This
                Privacy Policy explains how we collect, use, store, and
                protect your data when you use our platform.
              </p>
            </section>

            {/* 2 */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                2. Information We Collect
              </h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>Name, email address, and mobile number</li>
                <li>OTP and authentication-related data</li>
                <li>Task details and service preferences</li>
                <li>Pickup, drop, and delivery addresses provided by users</li>
                <li>Payment and transaction information</li>
                <li>Device and usage data for security and analytics</li>
              </ul>
            </section>

            {/* 3 */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                3. Address & Location Information
              </h2>
              <p>
                To enable services such as pickup, drop, delivery,
                shopping, and in-person assistance, HireBuddy may collect
                and store physical address information provided by users.
              </p>
              <p className="mt-2">
                Address and location data are used strictly for:
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Assigning helpers for pickup, drop, or delivery tasks</li>
                <li>Providing accurate navigation and task coordination</li>
                <li>Ensuring safe and successful service completion</li>
              </ul>
              <p className="mt-2">
                Address and location information is shared only with the
                assigned helper and only for the duration required to
                complete the task. HireBuddy does not sell or misuse
                location or address data.
              </p>
            </section>

            {/* 4 */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                4. How We Use Your Information
              </h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>To create and manage user accounts</li>
                <li>To verify identity using OTP-based authentication</li>
                <li>To connect users with local helpers</li>
                <li>To process payments securely</li>
                <li>To provide customer support</li>
                <li>To improve platform safety and reliability</li>
              </ul>
            </section>

            {/* 5 */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                5. OTP & Phone Number Usage
              </h2>
              <p>
                Your mobile number is used for authentication through
                one-time passwords (OTP). OTPs are time-bound and used
                only for verification purposes. We do not share OTPs
                with unauthorized parties.
              </p>
            </section>

            {/* 6 */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                6. Payments & Financial Information
              </h2>
              <p>
                Payments are processed through secure third-party payment
                gateways. HireBuddy does not store your card or banking
                details. All transactions follow industry-standard
                security practices.
              </p>
            </section>

            {/* 7 */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                7. Data Sharing
              </h2>
              <p>
                We may share limited information with helpers, users,
                or service providers only when required to complete a
                task, process payments, or comply with legal obligations.
                We never sell your personal data.
              </p>
            </section>

            {/* 8 */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                8. Data Security
              </h2>
              <p>
                We use appropriate technical and organizational measures
                to protect your data against unauthorized access, loss,
                or misuse. However, no digital system can be guaranteed
                to be completely secure.
              </p>
            </section>

            {/* 9 */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                9. Data Retention
              </h2>
              <p>
                We retain personal data only for as long as necessary to
                provide services, comply with legal requirements, and
                resolve disputes.
              </p>
            </section>

            {/* 10 */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                10. Your Rights
              </h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>Access and review your personal data</li>
                <li>Request correction or deletion of data</li>
                <li>Withdraw consent where applicable</li>
              </ul>
            </section>

            {/* 11 */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                11. Changes to This Privacy Policy
              </h2>
              <p>
                We may update this Privacy Policy from time to time.
                Continued use of HireBuddy after updates constitutes
                acceptance of the revised policy.
              </p>
            </section>

            {/* 12 */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                12. Contact Us
              </h2>
              <p>
                If you have questions or concerns about this Privacy Policy,
                please contact us at{" "}
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
