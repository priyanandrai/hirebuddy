"use client";

import Link from "next/link";

export default function HelperDashboardPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-5 py-6 text-slate-100">
      <div className="mx-auto max-w-5xl">
        <section className="mb-6 rounded-[2rem] border border-slate-800 bg-slate-900/80 p-8 shadow-2xl shadow-slate-950/30">
          <h1 className="text-3xl font-bold text-white">Hello 👋</h1>
          <p className="mt-2 text-sm text-slate-300">Welcome back. What would you like to do today?</p>
        </section>

        <section className="mb-8 grid grid-cols-1 gap-4">
          <PrimaryAction title="See Available Tasks" desc="New work near you" href="/dashboard-tasker/tasks" bg="bg-blue-600" />
          <PrimaryAction title="My Accepted Tasks" desc="Work you already accepted" href="/dashboard-tasker/my-tasks" bg="bg-slate-800" />
        </section>

        <section className="mb-8 rounded-[2rem] border border-slate-800 bg-slate-900/80 p-5 shadow-xl shadow-slate-950/20">
          <h2 className="mb-3 text-lg font-semibold text-white">Today’s Work</h2>
          <div className="rounded-[1.5rem] border border-slate-700 bg-slate-950/60 p-4">
            <p className="font-medium text-white">Grocery Pickup</p>
            <p className="mt-1 text-sm text-slate-300">Location: Modipuram, Meerut</p>
            <p className="mt-1 text-sm text-slate-300">Payment: ₹500</p>
            <Link href="/dashboard-tasker/my-tasks" className="mt-4 block rounded-2xl bg-blue-600 px-4 py-3 text-center text-white hover:bg-blue-500">
              View Task Details
            </Link>
          </div>
        </section>

        <section className="mb-8 rounded-[2rem] border border-slate-800 bg-slate-900/80 p-5 shadow-xl shadow-slate-950/20">
          <h2 className="text-lg font-semibold text-white">Your Earnings</h2>
          <p className="mt-1 text-sm text-slate-300">Today: <span className="font-semibold text-white">₹500</span></p>
          <p className="text-sm text-slate-300">This month: <span className="font-semibold text-white">₹3,200</span></p>
        </section>

        <section className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-5 shadow-xl shadow-slate-950/20">
          <h2 className="text-lg font-semibold text-white">Need Help?</h2>
          <p className="mt-1 text-sm text-slate-300">If you have any problem, contact support.</p>
          <Link href="/dashboard-tasker/support" className="mt-3 block rounded-2xl bg-slate-100 px-4 py-3 text-center text-slate-900 hover:bg-white">
            Contact Support
          </Link>
        </section>
      </div>
    </main>
  );
}

function PrimaryAction({ title, desc, href, bg }) {
  return (
    <Link href={href} className={`${bg} rounded-[1.5rem] p-5 text-white shadow-lg shadow-slate-950/20`}>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-1 text-sm opacity-90">{desc}</p>
    </Link>
  );
}
