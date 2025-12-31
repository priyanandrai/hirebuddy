"use client";

import Link from "next/link";

export default function HelperDashboardPage() {
  return (
    <main className="min-h-screen bg-gray-50 px-5 py-6">

      {/* Greeting */}
      <section className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">
          Hello 👋
        </h1>
        <p className="text-sm text-gray-600">
          Welcome back. What would you like to do today?
        </p>
      </section>

      {/* Main Actions */}
      <section className="mb-8 grid grid-cols-1 gap-4">

        <PrimaryAction
          title="See Available Tasks"
          desc="New work near you"
          href="/dashboard-tasker/tasks"
          bg="bg-green-600"
        />

        <PrimaryAction
          title="My Accepted Tasks"
          desc="Work you already accepted"
          href="/dashboard-tasker/my-tasks"
          bg="bg-blue-600"
        />
      </section>

      {/* Today’s Task */}
      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold text-gray-700">
          Today’s Work
        </h2>

        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="font-medium text-gray-900">
            Grocery Pickup
          </p>
          <p className="mt-1 text-sm text-gray-600">
            Location: Modipuram, Meerut
          </p>
          <p className="mt-1 text-sm text-gray-600">
            Payment: ₹500
          </p>

          <Link
            href="/dashboard-tasker/my-tasks"
            className="mt-4 block rounded-md bg-green-600 px-4 py-3 text-center text-white"
          >
            View Task Details
          </Link>
        </div>
      </section>

      {/* Earnings (simple) */}
      <section className="mb-8 rounded-xl bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800">
          Your Earnings
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Today: <span className="font-semibold text-gray-900">₹500</span>
        </p>
        <p className="text-sm text-gray-600">
          This month: <span className="font-semibold text-gray-900">₹3,200</span>
        </p>
      </section>

      {/* Help */}
      <section className="rounded-xl bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800">
          Need Help?
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          If you have any problem, contact support.
        </p>

        <Link
          href="/dashboard-tasker/support"
          className="mt-3 block rounded-md bg-gray-800 px-4 py-3 text-center text-white"
        >
          Contact Support
        </Link>
      </section>

    </main>
  );
}

/* ---------------- Components ---------------- */

function PrimaryAction({ title, desc, href, bg }) {
  return (
    <Link
      href={href}
      className={`${bg} rounded-xl p-5 text-white`}
    >
      <h3 className="text-lg font-semibold">
        {title}
      </h3>
      <p className="mt-1 text-sm opacity-90">
        {desc}
      </p>
    </Link>
  );
}
