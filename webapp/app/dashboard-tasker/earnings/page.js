"use client";

import Link from "next/link";

export default function TaskerEarningsPage() {
  // Mock earnings data (replace with API later)
  const earnings = {
    today: 500,
    thisWeek: 3200,
    thisMonth: 8500,
    total: 24500,
  };

  const history = [
    {
      id: 1,
      task: "Grocery Pickup",
      date: "Today",
      amount: 500,
    },
    {
      id: 2,
      task: "Doctor Visit Help",
      date: "Yesterday",
      amount: 800,
    },
    {
      id: 3,
      task: "Document Delivery",
      date: "20 Apr",
      amount: 300,
    },
  ];

  return (
    <main className="min-h-screen bg-gray-50 px-5 py-6">

      {/* Header */}
      <section className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">
          My Earnings
        </h1>
        <p className="text-sm text-gray-600">
          Money you earned by completing tasks
        </p>
      </section>

      {/* Summary Cards */}
      <section className="mb-8 grid grid-cols-2 gap-4">
        <EarningCard label="Today" value={earnings.today} />
        <EarningCard label="This Week" value={earnings.thisWeek} />
        <EarningCard label="This Month" value={earnings.thisMonth} />
        <EarningCard label="Total" value={earnings.total} />
      </section>

      {/* Earnings History */}
      <section className="rounded-xl bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-800">
          Recent Earnings
        </h2>

        <div className="space-y-3">
          {history.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-lg bg-gray-50 p-3"
            >
              <div>
                <p className="font-medium text-gray-900">
                  {item.task}
                </p>
                <p className="text-xs text-gray-600">
                  {item.date}
                </p>
              </div>

              <p className="font-semibold text-green-600">
                ₹{item.amount}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Help */}
      <section className="mt-6 rounded-xl bg-white p-4 shadow-sm">
        <p className="text-sm text-gray-600">
          Payment will be transferred to your bank account.
        </p>

        <Link
          href="/dashboard-tasker/support"
          className="mt-3 block text-sm text-green-600 underline"
        >
          Payment issue? Contact support
        </Link>
      </section>

      {/* Back */}
      <div className="mt-6">
        <Link
          href="/dashboard-tasker"
          className="block text-center text-sm text-gray-600 underline"
        >
          Back to Dashboard
        </Link>
      </div>
    </main>
  );
}

/* ---------- Components ---------- */

function EarningCard({ label, value }) {
  return (
    <div className="rounded-xl bg-white p-4 text-center shadow-sm">
      <p className="text-sm text-gray-600">
        {label}
      </p>
      <p className="mt-1 text-xl font-bold text-gray-900">
        ₹{value}
      </p>
    </div>
  );
}
