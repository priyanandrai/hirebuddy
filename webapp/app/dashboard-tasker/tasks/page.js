"use client";

import { useState } from "react";
import Link from "next/link";

export default function HelperTasksPage() {
  const [tasks, setTasks] = useState([
    {
      id: 1,
      title: "Grocery Shopping",
      location: "Modipuram, Meerut",
      payment: 500,
      time: "Today, 4 PM",
    },
    {
      id: 2,
      title: "Doctor Visit Help",
      location: "Modipuram, Meerut",
      payment: 800,
      time: "Tomorrow, 10 AM",
    },
    {
      id: 3,
      title: "Document Delivery",
      location: "Modipuram, Meerut",
      payment: 300,
      time: "Today, 6 PM",
    },
  ]);

  function acceptTask(taskId) {
    alert("Task accepted!");
    setTasks(tasks.filter((task) => task.id !== taskId));
  }

  function ignoreTask(taskId) {
    setTasks(tasks.filter((task) => task.id !== taskId));
  }

  return (
    <main className="min-h-screen bg-gray-50 px-5 py-6">

      {/* Header */}
      <section className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">
          Available Tasks
        </h1>
        <p className="text-sm text-gray-600">
          Choose a task you want to work on
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

            {/* Actions */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                onClick={() => acceptTask(task.id)}
                className="rounded-md bg-green-600 px-4 py-3 text-white font-medium hover:bg-green-700"
              >
                Accept
              </button>

              <button
                onClick={() => ignoreTask(task.id)}
                className="rounded-md bg-gray-200 px-4 py-3 text-gray-700 font-medium hover:bg-gray-300"
              >
                Ignore
              </button>
            </div>
          </div>
        ))}

        {/* Empty State */}
        {tasks.length === 0 && (
          <div className="rounded-xl bg-white p-6 text-center shadow-sm">
            <p className="text-gray-600">
              No tasks available right now.
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Please check again later.
            </p>

            <Link
              href="/dashboard/helper"
              className="mt-4 inline-block rounded-md bg-green-600 px-4 py-3 text-white"
            >
              Go Back
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
