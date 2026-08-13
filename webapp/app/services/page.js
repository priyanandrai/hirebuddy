"use client";

import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";

export default function ServicesPage() {
  return (
    <>
      <Header />

      <main className="min-h-screen bg-slate-950 text-slate-100">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <h1 className="text-3xl font-semibold text-white mb-6 text-center">Our Services</h1>
          <p className="text-center text-slate-300 max-w-2xl mx-auto mb-14">
            HireBuddy offers everyday help by connecting you with trusted local
            helpers for tasks that matter in daily life.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8">
              <h2 className="text-xl font-semibold text-white mb-3">Shopping & Purchases</h2>
              <ul className="list-disc pl-5 text-sm text-slate-300 space-y-1">
                <li>Grocery shopping from local markets or stores</li>
                <li>Medicine purchase using prescriptions</li>
                <li>Pickup of essentials and household items</li>
              </ul>
            </section>

            <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8">
              <h2 className="text-xl font-semibold text-white mb-3">Travel & Driver Assistance</h2>
              <ul className="list-disc pl-5 text-sm text-slate-300 space-y-1">
                <li>Hiring drivers for short trips or appointments</li>
                <li>Travel assistance for elderly or dependents</li>
                <li>Pickup and drop services</li>
              </ul>
            </section>

            <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8">
              <h2 className="text-xl font-semibold text-white mb-3">Health & Care Support</h2>
              <ul className="list-disc pl-5 text-sm text-slate-300 space-y-1">
                <li>Doctor visit accompaniment</li>
                <li>Medical errands and report collection</li>
                <li>Support for elderly family members</li>
              </ul>
            </section>

            <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8">
              <h2 className="text-xl font-semibold text-white mb-3">Home & Daily Assistance</h2>
              <ul className="list-disc pl-5 text-sm text-slate-300 space-y-1">
                <li>Daily assistance and companionship</li>
                <li>Basic household help</li>
                <li>Errand running and local support</li>
              </ul>
            </section>
          </div>

          <div className="my-16 border-t border-slate-800" />

          <div className="max-w-3xl mx-auto text-center text-sm text-slate-400">
            Services may vary by location and helper availability. Helpers are
            independent service providers and task fulfillment depends on
            acceptance by available helpers.
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
