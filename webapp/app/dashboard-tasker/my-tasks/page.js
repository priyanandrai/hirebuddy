"use client";

import Link from "next/link";

export default function TaskerMyTasksPage() {
  // Mock accepted tasks (replace with API later)
  const tasks = [
    {
      id: 1,
      title: "Grocery Pickup",
      location: "Modipuram, Meerut",
      payment: 500,
      status: "in-progress", // in-progress | completed
      time: "Today, 4 PM",
    },
    {
      id: 2,
      title: "Doctor Visit Help",
      location: "Modipuram, Meerut",
      payment: 800,
      status: "completed",
      time: "Yesterday, 10 AM",
    },
  ];

  return (
    <main className="min-h-screen bg-gray-50 px-5 py-6">

      {/* Header */}
      <section className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">
          My Tasks
        </h1>
        <p className="text-sm text-gray-600">
          Tasks you have accepted
        </p>
      </section>

      {/* Task List */}
      <section className="space-y-4">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="rounded-xl bg-white p-4 shadow-sm"
          >
            <p className="text-lg font-semibold text-gray-900">
              {task.title}
            </p>

            <p className="mt-1 text-sm text-gray-600">
              📍 {task.location}
            </p>

            <p className="mt-1 text-sm text-gray-600">
              ⏰ {task.time}
            </p>

            <p className="mt-2 text-lg font-bold text-green-600">
              ₹{task.payment}
            </p>

            {/* Status */}
            <div className="mt-3">
              {task.status === "in-progress" ? (
                <span className="inline-block rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700">
                  In Progress
                </span>
              ) : (
                <span className="inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                  Completed
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="mt-4">
              {task.status === "in-progress" ? (
                <Link
                  href={`/dashboard-tasker/my-tasks/${task.id}`}
                  className="block rounded-md bg-green-600 px-4 py-3 text-center text-white font-medium hover:bg-green-700"
                >
                  View Task
                </Link>
              ) : (
                <Link
                  href="/dashboard-tasker/earnings"
                  className="block rounded-md bg-gray-200 px-4 py-3 text-center text-gray-700"
                >
                  View Earnings
                </Link>
              )}
            </div>
          </div>
        ))}

        {/* Empty State */}
        {tasks.length === 0 && (
          <div className="rounded-xl bg-white p-6 text-center shadow-sm">
            <p className="text-gray-600">
              You have not accepted any tasks yet.
            </p>
            <Link
              href="/dashboard-tasker/tasks"
              className="mt-4 inline-block rounded-md bg-green-600 px-4 py-3 text-white"
            >
              See Available Tasks
            </Link>
          </div>
        )}
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
