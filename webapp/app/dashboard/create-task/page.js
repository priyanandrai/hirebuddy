"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { createTask } from "@/app/components/services/task.service";

export default function CreateTaskPage() {
  const searchParams = useSearchParams();
  const helperId = searchParams.get("helper"); // 👈 NEW
  const prefilledCategory = searchParams.get("category") || "";
  const { data: session, status } = useSession();
  console.log("session",session);
  const router = useRouter()
  

  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState([]);

  const [form, setForm] = useState({
    title: "",
    category: prefilledCategory,
    description: "",
    location: "",
    date: "",
    budget: "",
    helperId: helperId || null, // 👈 NEW
  });

  // Mock helper (later replace with API fetch)
  const selectedHelper = helperId
    ? {
        id: helperId,
        name: "Rahul Kumar",
        rating: 4.8,
        jobs: 120,
        location: "Noida",
      }
    : null;

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleFileChange(e) {
    setFiles(Array.from(e.target.files));
  }

  function handleSubmit(e) {
    e.preventDefault();
  
    // if (!session?.accessToken) {
    //   alert("Please login to create a task");
    //   return;
    // }
  
    setLoading(true);
  
    const payload = {
      title: form.title,
      category: form.category,
      description: form.description,
      location: form.location,
      budget: Number(form.budget),
      preferredAt: form.date,
      helperId: form.helperId,
    };
  
    createTask(payload, session?.token)
      .then(() => {
        alert(
          helperId
            ? "Task created and sent to selected helper!"
            : "Task created successfully!"
        );
        router.push("/dashboard/tasks");
      })
      .catch((err) => {
        console.error("Create task failed", err);
        alert(err.message || "Failed to create task");
      })
      .finally(() => {
        setLoading(false);
      });
  }
  

  return (
    <main className="mx-auto max-w-3xl px-6 py-8">
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Create Task
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Add task details and optionally hire a specific helper.
        </p>
      </div>

      {/* Selected Helper */}
      {selectedHelper && (
        <div className="mb-6 rounded-xl border bg-green-50 p-4">
          <p className="text-sm font-medium text-green-800">
            Hiring this helper
          </p>

          <div className="mt-2 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-200 font-semibold text-green-800">
              {selectedHelper.name.charAt(0)}
            </div>

            <div className="text-sm">
              <p className="font-medium text-gray-900">
                {selectedHelper.name}
              </p>
              <p className="text-xs text-gray-600">
                ⭐ {selectedHelper.rating} · {selectedHelper.jobs} jobs ·{" "}
                {selectedHelper.location}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-2xl border bg-white p-6 shadow-sm"
      >
        
        {/* Task Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Task Title
          </label>
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            required
            placeholder="e.g. Buy groceries from local market"
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-green-500"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Category
          </label>
          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            required
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-green-500"
          >
            <option value="">Select category</option>
            <option>Shopping</option>
            <option>Delivery</option>
            <option>Doctor Visit</option>
            <option>Travel Assistance</option>
            <option>Home Help</option>
            <option>Other</option>
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Task Description
          </label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={4}
            required
            placeholder="Explain what needs to be done..."
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-green-500"
          />
        </div>

        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Attach Images or Files (optional)
          </label>
          <input
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx"
            onChange={handleFileChange}
            className="mt-2 block w-full text-sm
              file:mr-4 file:rounded-md file:border-0
              file:bg-green-50 file:px-4 file:py-2
              file:text-sm file:font-medium
              file:text-green-700 hover:file:bg-green-100"
          />
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Location
          </label>
          <input
            name="location"
            value={form.location}
            onChange={handleChange}
            required
            placeholder="Pickup / service location"
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-green-500"
          />
        </div>

        {/* Date & Budget */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Preferred Date
            </label>
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              required
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Budget (₹)
            </label>
            <input
              type="number"
              name="budget"
              value={form.budget}
              onChange={handleChange}
              required
              placeholder="e.g. 500"
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-green-600 px-6 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60"
          >
            {loading
              ? "Creating..."
              : helperId
              ? "Create & Send to Helper"
              : "Create Task"}
          </button>
        </div>
      </form>
    </main>
  );
}
