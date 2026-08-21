"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { createTask } from "@/app/components/services/task.service";
import { getHelperByID } from "@/app/components/services/user.service";

export default function CreateTaskPage() {
  return (
    <Suspense fallback={<CreateTaskFallback />}>
      <CreateTaskContent />
    </Suspense>
  );
}

function CreateTaskContent() {
  const searchParams = useSearchParams();
  const helperId = searchParams.get("helper"); 
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
   const [selectedHelper, setSelectedHelper] = useState();
  useEffect(() => {

    if (helperId)
      fetchHelpers(helperId);
  }, [helperId]);

  const fetchHelpers = async (id) => {
    try {
      const res = await getHelperByID(id);
      console.log("fetch helper res", res);
     

      // assuming API returns array   
      setSelectedHelper(res.data || res);
    } catch (error) {
      console.error("Failed to fetch helpers", error);
    } finally {
      // setLoading(false);
    }
  };

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleFileChange(e) {
    setFiles(Array.from(e.target.files));
  }

  function handleSubmit(e) {
    e.preventDefault();

    const token = session?.token || localStorage.getItem("token");
    if (!token) {
      alert("Please login to create a task");
      return;
    }

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

    createTask(payload, token)
      .then(() => {
        alert(
          helperId
            ? "Task created and sent to selected helper!"
            : "Task created successfully!"
        );
        router.push("/dashboard/my-tasks");
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
    <main className="min-h-screen bg-[#020f1d] px-4 py-8 text-slate-100 md:px-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 text-center text-sm text-slate-300">
          Add task details and optionally hire a specific helper.
        </div>

        {selectedHelper && (
          <div className="mb-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 shadow-lg shadow-emerald-950/20">
            <p className="text-sm font-medium text-emerald-300">Hiring this helper</p>
            <div className="mt-2 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-400/15 text-sm font-semibold text-emerald-300">
                {selectedHelper.name?.charAt(0) || "H"}
              </div>
              <div className="text-sm">
                <p className="font-medium text-white">{selectedHelper.name}</p>
                <p className="text-xs text-slate-300">
                  ⭐ {selectedHelper.rating || 4.8} · {selectedHelper.jobs || 0} jobs · {selectedHelper.location || "Local area"}
                </p>
              </div>
            </div>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="rounded-[2rem] border border-slate-700 bg-white/95 p-6 shadow-[0_20px_70px_rgba(0,0,0,0.35)] md:p-8"
        >
          <div className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Task Title</label>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                required
                placeholder="e.g. Buy groceries from local market"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Category</label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Task Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={4}
                required
                placeholder="Explain what needs to be done..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Attach Images or Files (optional)</label>
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700">
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-emerald-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-emerald-700 hover:file:bg-emerald-200"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Location</label>
              <input
                name="location"
                value={form.location}
                onChange={handleChange}
                required
                placeholder="Pickup / service location"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Preferred Date</label>
                <input
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Budget (₹)</label>
                <input
                  type="number"
                  name="budget"
                  value={form.budget}
                  onChange={handleChange}
                  required
                  placeholder="e.g. 500"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-emerald-900/30 transition hover:from-emerald-400 hover:to-emerald-500 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading
                  ? "Creating..."
                  : helperId
                  ? "Create & Send to Helper"
                  : "Create Task"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}

function CreateTaskFallback() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-8">
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <p className="text-sm text-gray-600">Loading create task form...</p>
      </div>
    </main>
  );
}
