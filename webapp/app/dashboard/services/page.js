"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getTaskCategories } from "@/app/components/services/task.service";

export default function ServicesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTaskCategories()
      .then((res) => {
        const list = Array.isArray(res) ? res : res?.data || [];
        setCategories(list);
      })
      .catch((err) => console.error("Failed to fetch categories", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">
          Services
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">
          Choose a service category to create a task or find helpers
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <div
              key={category.id || category.name}
              className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-6 shadow-sm transition hover:shadow-md hover:border-blue-500"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{category.icon || "💼"}</span>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
                  {category.name}
                </h3>
              </div>

              <p className="mt-3 text-sm text-gray-600 dark:text-slate-400 min-h-[40px]">
                {category.description}
              </p>

              <div className="mt-4 flex gap-2">
                <Link
                  href={`/dashboard/create-task?category=${encodeURIComponent(category.name)}`}
                  className="flex-1 rounded-xl bg-blue-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-blue-700 transition"
                >
                  Create Task
                </Link>
                {category.slug && (
                  <Link
                    href={`/categories/${category.slug}`}
                    className="rounded-xl border border-gray-200 dark:border-slate-700 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center"
                  >
                    View Helpers
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
