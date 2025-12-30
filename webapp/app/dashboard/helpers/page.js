"use client";

import Link from "next/link";
import { useState } from "react";

export default function HelpersPage() {
  const [query, setQuery] = useState("");

  const helpers = [
    {
      id: 1,
      name: "Rahul Kumar",
      skills: ["Shopping", "Delivery"],
      rating: 4.8,
      jobs: 120,
      location: "Noida",
    },
    {
      id: 2,
      name: "Amit Singh",
      skills: ["Doctor Visit", "Travel Assistance"],
      rating: 4.6,
      jobs: 78,
      location: "Delhi",
    },
    {
      id: 3,
      name: "Suresh Yadav",
      skills: ["Home Help", "Shopping"],
      rating: 4.9,
      jobs: 210,
      location: "Ghaziabad",
    },
  ];

  const filtered = helpers.filter(
    (h) =>
      h.name.toLowerCase().includes(query.toLowerCase()) ||
      h.skills.join(" ").toLowerCase().includes(query.toLowerCase())
  );

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Find Helpers
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Browse helpers and view their profiles before hiring
        </p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or service (e.g. delivery)"
          className="w-full rounded-md border px-4 py-2 text-sm focus:ring-2 focus:ring-green-500"
        />
      </div>

      {/* Helpers List */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((helper) => (
          <div
            key={helper.id}
            className="rounded-xl border bg-white p-5 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 font-semibold text-green-700">
                {helper.name.charAt(0)}
              </div>

              <div>
                <p className="font-medium text-gray-900">
                  {helper.name}
                </p>
                <p className="text-xs text-gray-500">
                  {helper.location}
                </p>
              </div>
            </div>

            <div className="mt-4 text-sm text-gray-600">
              Skills: {helper.skills.join(", ")}
            </div>

            <div className="mt-2 text-sm">
              ⭐ {helper.rating} · {helper.jobs} jobs
            </div>

            <Link
              href={`/dashboard/helpers/${helper.id}`}
              className="mt-4 block rounded-md bg-green-600 px-4 py-2 text-center text-sm text-white hover:bg-green-700"
            >
              View Profile
            </Link>
          </div>
        ))}
      </div>
    </main>
  );
}
