"use client";

import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";

export default function SupportPage() {
  return (
    <>
      <Header />

      <main className="bg-[#f6f8fa]">
        <div className="max-w-5xl mx-auto px-6 py-16">

          {/* Title */}
          <h1 className="text-3xl font-semibold text-gray-900 mb-6 text-center">
            Support
          </h1>
          <p className="text-center text-gray-600 max-w-2xl mx-auto mb-14">
            Need help? We’re here to assist you with tasks, payments, helpers,
            or account-related questions.
          </p>

          {/* Support Options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

            {/* Account */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Account & Login
              </h2>
              <p className="text-sm text-gray-700">
                Issues with login, OTP, signup, or account access.
              </p>
              <p className="mt-3 text-sm">
                Email us at{" "}
                <span className="font-medium">support@hirebuddy.in</span>
              </p>
            </div>

            {/* Tasks */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Tasks & Helpers
              </h2>
              <p className="text-sm text-gray-700">
                Questions about posting tasks, helper assignments, delays,
                or service issues.
              </p>
              <p className="mt-3 text-sm">
                Email us at{" "}
                <span className="font-medium">support@hirebuddy.in</span>
              </p>
            </div>

            {/* Payments */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Payments & Refunds
              </h2>
              <p className="text-sm text-gray-700">
                Payment failures, refunds, or billing-related concerns.
              </p>
              <p className="mt-3 text-sm">
                Email us at{" "}
                <span className="font-medium">support@hirebuddy.in</span>
              </p>
            </div>

          </div>

          {/* Divider */}
          <div className="my-16 border-t" />

          {/* Policies quick links */}
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Helpful Links
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              You may find quick answers in the following pages:
            </p>

            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <a href="/how-it-works" className="text-blue-600 hover:underline">
                How It Works
              </a>
              <a href="/services" className="text-blue-600 hover:underline">
                Services
              </a>
              <a href="/refund-policy" className="text-blue-600 hover:underline">
                Refund & Cancellation Policy
              </a>
              <a href="/privacy" className="text-blue-600 hover:underline">
                Privacy Policy
              </a>
              <a href="/terms" className="text-blue-600 hover:underline">
                Terms & Conditions
              </a>
            </div>
          </div>

          {/* Contact note */}
          <div className="mt-16 max-w-3xl mx-auto text-center text-sm text-gray-600">
            <p>
              Our support team usually responds within 24–48 hours on business
              days.
            </p>
          </div>

        </div>
      </main>

      <Footer />
    </>
  );
}
