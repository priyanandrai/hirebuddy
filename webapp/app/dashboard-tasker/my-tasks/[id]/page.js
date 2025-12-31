"use client";

import { useParams, useRouter } from "next/navigation";

export default function TaskerTaskDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  // Mock task data (replace with API later)
  const task = {
    id,
    title: "Grocery Pickup",
    description: "Buy groceries from local market and deliver to home.",
    location: "Modipuram, Meerut",
    time: "Today, 4:00 PM",
    payment: 500,
    customerName: "Amit",
    customerPhone: "9876543210",
    status: "in-progress", // in-progress | completed
  };

  function markTaskCompleted() {
    alert("Task marked as completed!");
    router.push("/dashboard-tasker/my-tasks");
  }

  return (
    <main className="min-h-screen bg-gray-50 px-5 py-6">

      {/* Header */}
      <section className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">
          Task Details
        </h1>
        <p className="text-sm text-gray-600">
          Complete the task as shown below
        </p>
      </section>

      {/* Task Info */}
      <section className="rounded-xl bg-white p-5 shadow-sm space-y-4">

        <div>
          <p className="text-lg font-semibold text-gray-900">
            {task.title}
          </p>
          <p className="text-sm text-gray-600">
            {task.description}
          </p>
        </div>

        <div className="text-sm text-gray-700 space-y-1">
          <p>📍 <strong>Location:</strong> {task.location}</p>
          <p>⏰ <strong>Time:</strong> {task.time}</p>
          <p>💰 <strong>Payment:</strong> ₹{task.payment}</p>
        </div>

        {/* Customer */}
        <div className="rounded-lg bg-gray-50 p-4">
          <p className="font-medium text-gray-800">
            Customer Details
          </p>
          <p className="text-sm text-gray-600">
            Name: {task.customerName}
          </p>
          <p className="text-sm text-gray-600">
            Phone: {task.customerPhone}
          </p>
        </div>

        {/* Call / Map */}
        <div className="grid grid-cols-2 gap-3">
          <a
            href={`tel:${task.customerPhone}`}
            className="rounded-md bg-green-600 px-4 py-3 text-center text-white font-medium hover:bg-green-700"
          >
            📞 Call
          </a>

          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              task.location
            )}`}
            target="_blank"
            className="rounded-md bg-gray-800 px-4 py-3 text-center text-white"
          >
            📍 Open Map
          </a>
        </div>

        {/* Complete Task */}
        {task.status === "in-progress" && (
          <button
            onClick={markTaskCompleted}
            className="w-full rounded-md bg-green-700 px-4 py-4 text-lg font-semibold text-white hover:bg-green-800"
          >
            Mark Task as Completed
          </button>
        )}

        {task.status === "completed" && (
          <div className="rounded-md bg-green-100 px-4 py-3 text-center text-green-800 font-medium">
            Task Completed ✅
          </div>
        )}
      </section>

      {/* Back */}
      <div className="mt-6">
        <button
          onClick={() => router.back()}
          className="block w-full rounded-md bg-gray-200 px-4 py-3 text-gray-700"
        >
          Back
        </button>
      </div>
    </main>
  );
}
