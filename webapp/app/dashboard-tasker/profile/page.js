"use client";

import Link from "next/link";

export default function TaskerProfilePage() {
  // Mock tasker data (later replace with API)
  const tasker = {
    firstName: "Rahim",
    lastName: "Khan",
    phone: "98XXXXXX21",
    city: "Modipuram, Meerut",
    rating: 4.8,
    tasksCompleted: 56,
    services: [
      "Shopping",
      "Delivery",
      "Doctor Visit",
      "Home Help",
    ],
  };

  return (
    <main className="min-h-screen bg-gray-50 px-5 py-6">

      {/* Header */}
      <section className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">
          My Profile
        </h1>
        <p className="text-sm text-gray-600">
          Your details shown to customers
        </p>
      </section>

      {/* Profile Card */}
      <section className="rounded-xl bg-white p-5 shadow-sm">

        {/* Avatar + Name */}
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-xl font-bold text-green-700">
            {tasker.firstName.charAt(0)}
          </div>

          <div>
            <p className="text-lg font-semibold text-gray-900">
              {tasker.firstName} {tasker.lastName}
            </p>
            <p className="text-sm text-gray-600">
              📍 {tasker.city}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-5 grid grid-cols-2 gap-4 text-center">
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="text-lg font-bold text-gray-900">
              ⭐ {tasker.rating}
            </p>
            <p className="text-xs text-gray-600">
              Rating
            </p>
          </div>

          <div className="rounded-lg bg-gray-50 p-3">
            <p className="text-lg font-bold text-gray-900">
              {tasker.tasksCompleted}
            </p>
            <p className="text-xs text-gray-600">
              Tasks Done
            </p>
          </div>
        </div>

        {/* Phone */}
        <div className="mt-6">
          <p className="text-sm font-medium text-gray-700">
            Mobile Number
          </p>
          <p className="mt-1 text-sm text-gray-900">
            📞 {tasker.phone}
          </p>
        </div>

        {/* Services */}
        <div className="mt-6">
          <p className="text-sm font-medium text-gray-700">
            Work I Can Do
          </p>

          <div className="mt-2 flex flex-wrap gap-2">
            {tasker.services.map((service) => (
              <span
                key={service}
                className="rounded-full bg-green-100 px-3 py-1 text-xs text-green-700"
              >
                {service}
              </span>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 space-y-3">
          <Link
            href="/dashboard-tasker/profile/edit"
            className="block w-full rounded-md bg-green-600 px-4 py-3 text-center text-white font-medium hover:bg-green-700"
          >
            Edit Profile
          </Link>

          <Link
            href="/dashboard-tasker"
            className="block w-full rounded-md bg-gray-200 px-4 py-3 text-center text-gray-700"
          >
            Back to Dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}
