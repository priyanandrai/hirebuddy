"use client";

import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";

export default function SupportPage() {
  return (
    <>
      <Header />

      <main className="min-h-screen bg-slate-950 text-slate-100">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <h1 className="text-3xl font-semibold text-white mb-6 text-center">Support</h1>
          <p className="text-center text-slate-300 max-w-2xl mx-auto mb-14">
            Need help? We’re here to assist you with tasks, payments, helpers,
            or account-related questions.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="rounded-[2rem] border border-slate-800 bg-slate-900/90 p-6 shadow-xl">
              <h2 className="text-lg font-semibold text-white mb-2">Account & Login</h2>
              <p className="text-sm text-slate-300">
                Issues with login, OTP, signup, or account access.
              </p>
              <p className="mt-3 text-sm text-slate-400">
                Email us at <span className="font-medium text-emerald-300">support@hirebuddy.in</span>
              </p>
            </div>

            <div className="rounded-[2rem] border border-slate-800 bg-slate-900/90 p-6 shadow-xl">
              <h2 className="text-lg font-semibold text-white mb-2">Tasks & Helpers</h2>
              <p className="text-sm text-slate-300">
                Questions about posting tasks, helper assignments, delays,
                or service issues.
              </p>
              <p className="mt-3 text-sm text-slate-400">
                Email us at <span className="font-medium text-emerald-300">support@hirebuddy.in</span>
              </p>
            </div>

            <div className="rounded-[2rem] border border-slate-800 bg-slate-900/90 p-6 shadow-xl">
              <h2 className="text-lg font-semibold text-white mb-2">Payments & Refunds</h2>
              <p className="text-sm text-slate-300">
                Payment failures, refunds, or billing-related concerns.
              </p>
              <p className="mt-3 text-sm text-slate-400">
                Email us at <span className="font-medium text-emerald-300">support@hirebuddy.in</span>
              </p>
            </div>
          </div>

          <div className="my-16 border-t border-slate-800" />

          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-xl font-semibold text-white mb-4">Helpful Links</h2>
            <p className="text-sm text-slate-300 mb-6">
              You may find quick answers in the following pages:
            </p>

            <div className="flex flex-wrap justify-center gap-6 text-sm text-blue-300">
              <a href="/how-it-works" className="hover:text-white">How It Works</a>
              <a href="/services" className="hover:text-white">Services</a>
              <a href="/refund-policy" className="hover:text-white">Refund & Cancellation Policy</a>
              <a href="/privacy" className="hover:text-white">Privacy Policy</a>
              <a href="/terms" className="hover:text-white">Terms & Conditions</a>
            </div>
          </div>

          <div className="mt-16 max-w-3xl mx-auto text-center text-sm text-slate-400">
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
