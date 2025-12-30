"use client";

import { useState } from "react";

export default function ServicesPage() {
  const [services] = useState([
    {
      id: 1,
      title: "Shopping & Groceries",
      desc: "Buy groceries, medicines, or daily essentials",
    },
    {
      id: 2,
      title: "Delivery",
      desc: "Document, parcel, or item delivery",
    },
    {
      id: 3,
      title: "Doctor Visit Assistance",
      desc: "陪 doctor visits, hospital support, and care",
    },
    {
      id: 4,
      title: "Travel Assistance",
      desc: "Local travel, drop & pickup, accompaniment",
    },
    {
      id: 5,
      title: "Home Help",
      desc: "Cleaning, minor household help, errands",
    },
    {
      id: 6,
      title: "Other Tasks",
      desc: "Anything else you need help with",
    },
  ]);

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Services
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Choose a service category to create a task
        </p>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => (
          <div
            key={service.id}
            className="rounded-xl border bg-white p-6 shadow-sm transition hover:shadow-md"
          >
            <h3 className="text-lg font-semibold text-gray-900">
              {service.title}
            </h3>

            <p className="mt-2 text-sm text-gray-600">
              {service.desc}
            </p>

            <button
              className="mt-4 w-full rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
              onClick={() =>
                alert(`Create task for ${service.title}`)
              }
            >
              Create Task
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}
