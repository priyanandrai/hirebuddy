"use client";

import Link from "next/link";

export default function DashboardPage() {

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-6">

      {/* Welcome Header */}
      <section className="mb-10">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back 👋
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          What would you like to do today?
        </p>
      </section>

      {/* Quick Actions */}
      <section className="mb-10">
        <h2 className="mb-4 text-lg font-semibold text-gray-700">
          Quick Actions
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <QuickCard
            title="Create Task"
            desc="Post a new task and get help fast"
            href="/dashboard/create-task"
          />

          <QuickCard
            title="My Tasks"
            desc="Track ongoing and completed tasks"
            href="/dashboard/my-tasks"
          />

          <QuickCard
            title="Find Helpers"
            desc="Browse helpers & view profiles"
            href="/dashboard/helpers"
          />

          <QuickCard
            title="Services"
            desc="Explore all available services"
            href="/dashboard/services"
          />
        </div>
      </section>

      {/* Upcoming Tasks */}
      <section className="mb-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-700">
            Your Upcoming Tasks
          </h2>
          <Link
            href="/dashboard/my-tasks"
            className="text-sm text-green-600 hover:underline"
          >
            View all
          </Link>
        </div>

        <div className="space-y-3">
          <TaskItem
            title="Cleaning Living Room"
            time="Today, 10:00 AM"
            price="₹400"
            helper="Rahim B."
          />

          <TaskItem
            title="Driver for Doctor Visit"
            time="Wed, Apr 24"
            price="₹1,200"
            helper="Assigned"
          />
        </div>
      </section>

      {/* Your Helpers */}
      <section className="mb-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-700">
            Your Helpers
          </h2>
          <Link
            href="/dashboard/helpers"
            className="text-sm text-green-600 hover:underline"
          >
            Browse helpers
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <HelperCard
            id="1"
            name="Rahim B."
            rating="4.9"
            tasks="56"
            skills="Cleaning, Furniture Assembly"
          />

          <HelperCard
            id="2"
            name="Sonia B."
            rating="4.8"
            tasks="31"
            skills="Medicine Pickup, Driver Help"
          />
        </div>
      </section>

      {/* Support */}
      <section className="rounded-lg bg-white p-6 shadow-sm">
        <h2 className="mb-2 text-lg font-semibold text-gray-700">
          Need Help?
        </h2>
        <p className="mb-4 text-gray-600">
          Our support team is available 24/7 for any issues.
        </p>

        <Link
          href="/dashboard/support"
          className="inline-block rounded-md bg-gray-800 px-4 py-2 text-white hover:bg-black"
        >
          Contact Support
        </Link>
      </section>
    </main>
  );
}

/* ---------------- Components ---------------- */

function QuickCard({ title, desc, href }) {
  return (
    <Link
      href={href}
      className="block rounded-lg bg-white p-4 shadow-sm transition hover:shadow-md"
    >
      <h3 className="mb-1 font-semibold text-gray-800">
        {title}
      </h3>
      <p className="text-sm text-gray-600">
        {desc}
      </p>
    </Link>
  );
}

function TaskItem({ title, time, price, helper }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-white p-4 shadow-sm">
      <div>
        <p className="font-medium text-gray-800">
          {title}
        </p>
        <p className="text-sm text-gray-500">
          {time}
        </p>
      </div>
      <div className="text-right">
        <p className="font-semibold text-gray-800">
          {price}
        </p>
        <p className="text-sm text-green-600">
          {helper}
        </p>
      </div>
    </div>
  );
}

function HelperCard({ id, name, rating, tasks, skills }) {
  return (
    <div className="rounded-lg bg-white p-4 shadow-sm">
      <h3 className="font-semibold text-gray-800">
        {name}
      </h3>
      <p className="text-sm text-gray-600">
        ⭐ {rating} • {tasks} tasks
      </p>
      <p className="mt-1 text-sm text-gray-500">
        {skills}
      </p>

      <Link
        href={`/dashboard/helpers/${id}`}
        className="mt-3 block w-full rounded-md bg-green-600 px-3 py-2 text-center text-white hover:bg-green-700"
      >
        View Profile
      </Link>
    </div>
  );
}
