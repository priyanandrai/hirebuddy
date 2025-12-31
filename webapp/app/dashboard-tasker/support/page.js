"use client";

import Link from "next/link";

export default function TaskerSupportPage() {
  return (
    <main className="min-h-screen bg-gray-50 px-5 py-6">

      {/* Header */}
      <section className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">
          Help & Support
        </h1>
        <p className="text-sm text-gray-600">
          We are here to help you anytime
        </p>
      </section>

      {/* Quick Help Options */}
      <section className="mb-8 space-y-4">

        <SupportCard
          title="Problem with a Task"
          desc="Issue with task, customer, or payment"
          href="/dashboard-tasker/my-tasks"
        />

        <SupportCard
          title="Payment Issue"
          desc="Payment not received or delayed"
          href="/dashboard-tasker/earnings"
        />

        <SupportCard
          title="Profile or Account Help"
          desc="Change personal details or work type"
          href="/dashboard-tasker/profile"
        />
      </section>

      {/* Contact Support */}
      <section className="rounded-xl bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800">
          Contact Support
        </h2>

        <p className="mt-1 text-sm text-gray-600">
          Call or message us if you need help
        </p>

        <div className="mt-4 space-y-3">
          <a
            href="tel:+919000000000"
            className="block rounded-md bg-green-600 px-4 py-3 text-center text-white font-medium hover:bg-green-700"
          >
            📞 Call Support
          </a>

          <a
            href="https://wa.me/919000000000"
            target="_blank"
            className="block rounded-md bg-gray-800 px-4 py-3 text-center text-white"
          >
            💬 WhatsApp Support
          </a>
        </div>
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

/* ---------- Component ---------- */

function SupportCard({ title, desc, href }) {
  return (
    <Link
      href={href}
      className="block rounded-xl bg-white p-4 shadow-sm"
    >
      <p className="text-base font-semibold text-gray-900">
        {title}
      </p>
      <p className="mt-1 text-sm text-gray-600">
        {desc}
      </p>
    </Link>
  );
}
