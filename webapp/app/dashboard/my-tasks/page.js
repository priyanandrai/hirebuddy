"use client";

import { useState } from "react";
import Link from "next/link";

export default function MyTasksPage() {
  const [tasks] = useState([
    {
      id: 1,
      title: "Buy groceries",
      category: "Shopping",
      status: "Open",
      date: "Today",
      budget: 500,
    },
    {
      id: 2,
      title: "Doctor visit assistance",
      category: "Health",
      status: "In Progress",
      date: "Tomorrow",
      budget: 800,
    },
    {
      id: 3,
      title: "Deliver documents",
      category: "Delivery",
      status: "Completed",
      date: "Yesterday",
      budget: 300,
    },
  ]);

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            My Tasks
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Track and manage your posted tasks
          </p>
        </div>

        <Link
          href="/dashboard/create-task"
          className="rounded-md bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700"
        >
          ➕ Create Task
        </Link>
      </div>

      {/* Task List */}
      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        
        {/* Table Header */}
        <div className="hidden grid-cols-6 gap-4 border-b bg-gray-50 px-4 py-3 text-sm font-medium text-gray-600 sm:grid">
          <div className="col-span-2">Task</div>
          <div>Category</div>
          <div>Status</div>
          <div>Date</div>
          <div className="text-right">Budget</div>
        </div>

        {/* Rows */}
        {tasks.map((task) => (
          <div
            key={task.id}
            className="grid grid-cols-1 gap-3 border-b px-4 py-4 text-sm sm:grid-cols-6 sm:gap-4"
          >
            
            {/* Task */}
            <div className="sm:col-span-2">
              <p className="font-medium text-gray-900">
                {task.title}
              </p>
              <Link
                href={`/dashboard/tasks/${task.id}`}
                className="mt-1 inline-block text-xs text-green-600 hover:underline"
              >
                View details
              </Link>
            </div>

            {/* Category */}
            <div className="text-gray-600">
              {task.category}
            </div>

            {/* Status */}
            <div>
              <StatusBadge status={task.status} />
            </div>

            {/* Date */}
            <div className="text-gray-600">
              {task.date}
            </div>

            {/* Budget */}
            <div className="text-right font-medium text-gray-900">
              ₹{task.budget}
            </div>
          </div>
        ))}

        {/* Empty State */}
        {tasks.length === 0 && (
          <div className="px-4 py-10 text-center text-sm text-gray-500">
            You haven’t posted any tasks yet.
          </div>
        )}
      </div>
    </main>
  );
}

/* ---------- Status Badge ---------- */

function StatusBadge({ status }) {
  const styles = {
    Open: "bg-yellow-100 text-yellow-700",
    "In Progress": "bg-blue-100 text-blue-700",
    Completed: "bg-green-100 text-green-700",
    Cancelled: "bg-red-100 text-red-700",
  };

  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
        styles[status] || "bg-gray-100 text-gray-600"
      }`}
    >
      {status}
    </span>
  );
}
