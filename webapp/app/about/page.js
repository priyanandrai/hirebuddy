"use client";

import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";

export default function AboutUsPage() {
  return (
    <>
      <Header />

      <main className="min-h-screen bg-slate-950 text-slate-100">
        <div className="max-w-4xl mx-auto px-6 py-16">
          <div className="rounded-[2rem] border border-slate-800 bg-slate-900/90 p-10 shadow-2xl shadow-slate-950/20">
            <h1 className="text-3xl font-semibold text-white mb-6">About HireBuddy</h1>

            <div className="space-y-8 text-sm text-slate-300 leading-relaxed">
              <section>
                <h2 className="text-lg font-semibold text-white mb-2">Who We Are</h2>
                <p>
                  HireBuddy is a local services platform designed to help people
                  get everyday tasks done easily and reliably. From shopping and
                  travel assistance to health-related errands and home support,
                  we connect users with trusted local helpers in their area.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-white mb-2">Why We Started</h2>
                <p>
                  Everyday problems often don’t need big solutions — they need
                  timely help. HireBuddy was built to solve simple, real-life
                  problems by making it easy to find local assistance when
                  family, time, or resources are limited.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-white mb-2">What We Do</h2>
                <ul className="list-disc pl-5 space-y-1 text-slate-300">
                  <li>Connect users with local helpers for daily tasks</li>
                  <li>Enable pickup, drop, delivery, and in-person assistance</li>
                  <li>Provide secure payments and transparent pricing</li>
                  <li>Support both users and helpers through the process</li>
                </ul>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-white mb-2">Trust & Safety</h2>
                <p>
                  Trust is central to everything we do. We verify helpers,
                  encourage transparent communication, and limit data sharing
                  strictly to what is required for task completion.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-white mb-2">Our Role</h2>
                <p>
                  HireBuddy acts as a technology platform that facilitates
                  connections between users and independent helpers. We do not
                  directly provide services, but we strive to make each
                  interaction smooth, safe, and reliable.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-white mb-2">Looking Ahead</h2>
                <p>
                  As HireBuddy grows, our focus remains on improving reliability,
                  expanding service coverage, and building tools that make daily
                  life a little easier for everyone involved.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-white mb-2">Get in Touch</h2>
                <p>
                  If you have questions, feedback, or partnership ideas, feel free
                  to reach out to us at <span className="font-medium text-emerald-300">support@hirebuddy.in</span>.
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
