"use client";

import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();
  const isBuddyView = pathname?.startsWith("/dashboard-tasker");
  const hideTopBanner =
    pathname?.startsWith("/dashboard/my-tasks") ||
    pathname?.startsWith("/dashboard/search") ||
    pathname?.startsWith("/dashboard/helpers") ||
    isBuddyView;

  return (
    <footer className="bg-slate-950 text-slate-300">
      <div className="mx-auto max-w-7xl px-6 py-16">
        {!hideTopBanner && (
          <div className="rounded-[2rem] border border-white/10 bg-slate-900/90 p-10 shadow-2xl shadow-slate-950/30 backdrop-blur-xl">
            <div className="grid gap-10 lg:grid-cols-[1.3fr_auto] lg:items-center">
              <div className="space-y-4">
                <p className="text-sm uppercase tracking-[0.3em] text-emerald-400">HireBuddy</p>
                <h2 className="text-3xl font-semibold text-white sm:text-4xl">
                  Ready to get your task done or shop direct from Meerut Manufacturers?
                </h2>
                <p className="max-w-2xl text-base leading-7 text-slate-400">
                  Post a task and connect with verified local Buddies (100% task payout to Buddies), or order authentic Meerut products directly from verified manufacturers.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                {!isBuddyView && (
                  <a
                    href="/post-task"
                    className="inline-flex items-center justify-center rounded-2xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-600"
                  >
                    Post a Task
                  </a>
                )}
                <a
                  href="/marketplace"
                  className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500"
                >
                  Meerut Marketplace
                </a>
                <a
                  href="/become-a-helper"
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-700 bg-slate-950/80 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:bg-slate-900"
                >
                  Become a Buddy
                </a>
              </div>
            </div>
          </div>
        )}

        <div className="mt-12 grid gap-10 text-sm text-slate-400 sm:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white">Popular Services</h3>
            <ul className="space-y-2.5">
              <li><a href="/services" className="hover:text-white transition">All Home Services</a></li>
              <li><a href="/services/home-cleaning" className="hover:text-white transition">Home Cleaning</a></li>
              <li><a href="/services/plumber" className="hover:text-white transition">Plumber Services</a></li>
              <li><a href="/services/electrician" className="hover:text-white transition">Electrician Services</a></li>
              <li><a href="/services/carpenter" className="hover:text-white transition">Carpenter Services</a></li>
              <li><a href="/services/driver" className="hover:text-white transition">Personal Driver</a></li>
              <li><a href="/services/ac-appliance-repair" className="hover:text-white transition">AC & Appliance Repair</a></li>
            </ul>
          </div>
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white">Cities & Localities</h3>
            <ul className="space-y-2.5">
              <li><a href="/locations" className="hover:text-white transition">All Service Cities</a></li>
              <li><a href="/locations/noida" className="hover:text-white transition">Home Services in Noida</a></li>
              <li><a href="/locations/ghaziabad" className="hover:text-white transition">Home Services in Ghaziabad</a></li>
              <li><a href="/locations/delhi" className="hover:text-white transition">Home Services in Delhi</a></li>
              <li><a href="/locations/meerut" className="hover:text-white transition">Home Services in Meerut</a></li>
              <li><a href="/services/home-cleaning/noida" className="hover:text-white transition">Home Cleaning in Noida</a></li>
              <li><a href="/services/plumber/noida" className="hover:text-white transition">Plumber in Noida</a></li>
              <li><a href="/services/electrician/meerut" className="hover:text-white transition">Electrician in Meerut</a></li>
            </ul>
          </div>
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white">Platform & Resources</h3>
            <ul className="space-y-2.5">
              {!isBuddyView && (
                <li><a href="/post-task" className="hover:text-white transition">Post a Task</a></li>
              )}
              <li><a href="/how-it-works" className="hover:text-white transition">How HireBuddy Works</a></li>
              <li><a href="/pricing" className="hover:text-white transition">Service Pricing Guide</a></li>
              <li><a href="/safety" className="hover:text-white transition">Trust & Safety</a></li>
              <li><a href="/blog" className="hover:text-white transition">Home Care Blog & Guides</a></li>
              <li><a href="/faq" className="hover:text-white transition">Frequently Asked Questions</a></li>
              <li><a href="/marketplace" className="hover:text-white transition">Meerut Manufacturers Store</a></li>
              <li><a href="/become-a-helper" className="hover:text-white transition">Become a Helper Partner</a></li>
            </ul>
          </div>
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white">Company & Policies</h3>
            <ul className="space-y-2.5">
              <li><a href="/about" className="hover:text-white transition">About HireBuddy</a></li>
              <li><a href="/contact" className="hover:text-white transition">Contact & Support</a></li>
              <li><a href="/refund-policy" className="hover:text-white transition">Refund & Escrow Policy</a></li>
              <li><a href="/shipping-policy" className="hover:text-white transition">Shipping & Delivery Policy</a></li>
              <li><a href="/privacy" className="hover:text-white transition">Privacy Policy</a></li>
              <li><a href="/terms" className="hover:text-white transition">Terms & Conditions</a></li>
              <li><a href="/helper-agreement" className="hover:text-white transition">Helper Partner Agreement</a></li>
            </ul>
          </div>
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white">Contact & Grievance Officer</h3>
            <p className="text-slate-400">Need help? Reach out to our 24/7 support & compliance desk.</p>
            <p className="text-xs text-slate-300">
              Email: <a href="mailto:support@hirebuddy.in" className="text-emerald-400 hover:underline">support@hirebuddy.in</a>
            </p>
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-xs text-slate-400 space-y-1">
              <p className="font-semibold text-slate-200">Consumer Protection (E-Commerce) Rules</p>
              <p>Grievance Officer: Ankit Sharma</p>
              <p>Email: grievance@hirebuddy.in</p>
              <p>HQ: Modipuram, Meerut, UP - 250110</p>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-800 pt-6 text-sm text-slate-500 sm:flex-row">
          <p>© {new Date().getFullYear()} HireBuddy Technologies (Meerut, UP). All rights reserved.</p>
          <p>100% Task Payout to Buddies · Verified Meerut Manufacturers Marketplace</p>
        </div>
      </div>
    </footer>
  );
}
