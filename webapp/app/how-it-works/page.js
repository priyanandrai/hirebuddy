"use client";

import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";

export default function HowItWorksPage() {
  return (
    <>
      <Header />

      <main className="min-h-screen bg-slate-950 text-slate-100">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <h1 className="text-3xl font-semibold text-white mb-6 text-center">
            How HireBuddy Works
          </h1>
          <p className="text-center text-slate-300 max-w-2xl mx-auto mb-14">
            HireBuddy helps you get everyday tasks done by connecting you with
            trusted local helpers — quickly, safely, and transparently.
          </p>

          <div className="space-y-12">
            <section className="rounded-[2rem] border border-slate-800 bg-slate-900/90 p-8 shadow-xl">
              <h2 className="text-xl font-semibold text-white mb-2">
                1. Post a Task
              </h2>
              <p className="text-sm text-slate-300">
                Describe what you need help with — shopping, delivery, travel
                assistance, medical errands, or home support. Add pickup/drop
                details if required and confirm your task.
              </p>
            </section>

            <section className="rounded-[2rem] border border-slate-800 bg-slate-900/90 p-8 shadow-xl">
              <h2 className="text-xl font-semibold text-white mb-2">
                2. Get Matched with a Helper
              </h2>
              <p className="text-sm text-slate-300">
                Nearby verified helpers review your task and accept it. Once a
                helper is assigned, you can communicate and track progress in
                real time.
              </p>
            </section>

            <section className="rounded-[2rem] border border-slate-800 bg-slate-900/90 p-8 shadow-xl">
              <h2 className="text-xl font-semibold text-white mb-2">
                3. Task Gets Done
              </h2>
              <p className="text-sm text-slate-300">
                The helper completes the task as agreed — whether it’s picking
                up items, delivering goods, or assisting at home.
              </p>
            </section>

            <section className="rounded-[2rem] border border-slate-800 bg-slate-900/90 p-8 shadow-xl">
              <h2 className="text-xl font-semibold text-white mb-2">
                4. Pay Securely & Share Feedback
              </h2>
              <p className="text-sm text-slate-300">
                Payments are handled securely through the platform. Once the
                task is completed, you can rate your experience and help us
                maintain quality and trust.
              </p>
            </section>
          </div>

          <div className="my-16 border-t border-slate-800" />

          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-2xl font-semibold text-white mb-4">For Helpers</h2>
            <p className="text-sm text-slate-300">
              Helpers can sign up, verify their profile, browse nearby tasks,
              and earn by helping people in their community. You choose when
              and how you work.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
