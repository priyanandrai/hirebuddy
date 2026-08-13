

import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";

export default function RefundPolicyPage() {
  return (
    <>
      <Header />

      <main className="min-h-screen bg-slate-950 text-slate-100">
        <div className="max-w-4xl mx-auto px-6 py-16">
          <div className="rounded-[2rem] border border-slate-800 bg-slate-900/95 p-10 shadow-2xl shadow-slate-950/20">
            <h1 className="text-3xl font-semibold text-white mb-4">Refund & Cancellation Policy</h1>
            <p className="text-sm text-slate-400 mb-10">Last updated: {new Date().toLocaleDateString()}</p>

            <div className="space-y-8 text-sm text-slate-300 leading-relaxed">
              <section>
                <h2 className="text-lg font-semibold text-white mb-2">1. Overview</h2>
                <p>
                  This Refund & Cancellation Policy explains how task cancellations,
                  refunds, and adjustments are handled on HireBuddy. By using the
                  platform, you agree to the terms described below.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-white mb-2">2. Cancellation by User</h2>
                <ul className="list-disc pl-5 space-y-1 text-slate-300">
                  <li>Tasks cancelled before a helper is assigned are eligible for a full refund.</li>
                  <li>If a helper has been assigned but work has not started, a partial refund may be issued after deducting platform or processing fees.</li>
                  <li>No refund may be applicable if the task is cancelled after the helper has started or completed the work.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-white mb-2">3. Cancellation by Helper</h2>
                <p>
                  If a helper cancels after accepting a task, HireBuddy will attempt
                  to assign an alternative helper. If this is not possible, the
                  user may be eligible for a full or partial refund.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-white mb-2">4. Service Issues & Disputes</h2>
                <p>
                  If a service is not delivered as agreed, users may raise a
                  complaint through customer support within a reasonable time.
                  Each case will be reviewed and refunds may be issued at
                  HireBuddy’s discretion.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-white mb-2">5. Refund Processing</h2>
                <p>
                  Approved refunds are processed to the original payment method.
                  Refund timelines depend on the payment provider and typically
                  take 5–10 business days.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-white mb-2">6. Non-Refundable Situations</h2>
                <ul className="list-disc pl-5 space-y-1 text-slate-300">
                  <li>Tasks completed successfully as agreed</li>
                  <li>User unavailability during scheduled service time</li>
                  <li>Incorrect or incomplete information provided by the user</li>
                  <li>Delays or issues caused by factors beyond platform control</li>
                </ul>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-white mb-2">7. Changes to This Policy</h2>
                <p>
                  HireBuddy reserves the right to update this policy at any time.
                  Changes will be effective immediately upon posting on the
                  platform.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-white mb-2">8. Contact Support</h2>
                <p>
                  For refund or cancellation related queries, please contact us at <span className="font-medium text-emerald-300">support@hirebuddy.in</span>.
                </p>
              </section>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
