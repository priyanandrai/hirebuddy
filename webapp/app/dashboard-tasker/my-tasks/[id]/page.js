"use client";

import { getTaskById, updateTaskStatus } from "@/app/components/services/task.service";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function TaskerTaskDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || !id) return;

    const fetchTask = async () => {
      try {
        const res = await getTaskById(id, token);
        setTask(res.data || res);
      } catch (error) {
        console.error("Failed to fetch task", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTask();
  }, [id]);

  async function markTaskCompleted() {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login to update task status");
      return;
    }

    setActionLoading(true);
    try {
      await updateTaskStatus(id, "COMPLETED", token);
      setTask((prev) => ({ ...prev, status: "COMPLETED" }));
      alert("Task marked as completed!");
      router.push("/dashboard-tasker/my-tasks");
    } catch (error) {
      alert(error.message || "Unable to update task status");
    } finally {
      setActionLoading(false);
    }
  }

  async function startTask() {
    const token = localStorage.getItem("token");
    if (!token) return;

    setActionLoading(true);
    try {
      const res = await updateTaskStatus(id, "IN_PROGRESS", token);
      setTask((prev) => ({ ...prev, status: "IN_PROGRESS" }));
      alert("Task started successfully");
      router.push("/dashboard-tasker/my-tasks");
    } catch (error) {
      alert(error.message || "Unable to start task");
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return <main className="min-h-screen bg-slate-950 px-5 py-6 text-slate-100">Loading task details...</main>;
  }

  if (!task) {
    return <main className="min-h-screen bg-slate-950 px-5 py-6 text-slate-100">Task not found.</main>;
  }

  const status = task.status;
  const customerName = task.createdBy?.name || "Customer";
  const customerPhone = task.createdBy?.phone || "Not available";

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-6 text-slate-100">
      <section className="mx-auto max-w-3xl">
        <div className="mb-6 rounded-[2rem] border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-slate-950/30">
          <h1 className="text-2xl font-bold text-white">Task Details</h1>
          <p className="mt-1 text-sm text-slate-300">Complete the task as shown below</p>
        </div>

        <section className="space-y-4 rounded-[2rem] border border-slate-800 bg-slate-900/80 p-5 shadow-xl shadow-slate-950/30">
          <div>
            <p className="text-lg font-semibold text-white">{task.title}</p>
            <p className="text-sm text-slate-300">{task.description}</p>
          </div>

          <div className="space-y-1 text-sm text-slate-300">
            <p>📍 <strong>Location:</strong> {task.location}</p>
            <p>⏰ <strong>Time:</strong> {task.preferredAt ? new Date(task.preferredAt).toLocaleString() : "Flexible"}</p>
            <p>💰 <strong>Payment:</strong> ₹{task.budget}</p>
          </div>

          <div className="rounded-[1.5rem] border border-slate-700 bg-slate-950/60 p-4">
            <p className="font-medium text-white">Customer Details</p>
            <p className="text-sm text-slate-300">Name: {customerName}</p>
            <p className="text-sm text-slate-300">Phone: {customerPhone}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <a href={`tel:${customerPhone}`} className="rounded-2xl bg-blue-600 px-4 py-3 text-center font-medium text-white hover:bg-blue-500">
              📞 Call
            </a>
            <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(task.location)}`} target="_blank" className="rounded-2xl bg-slate-700 px-4 py-3 text-center font-medium text-slate-100 hover:bg-slate-600">
              📍 Open Map
            </a>
          </div>

          {status === "ASSIGNED" && (
            <button onClick={startTask} disabled={actionLoading} className="w-full rounded-2xl bg-blue-600 px-4 py-4 text-lg font-semibold text-white hover:bg-blue-500 disabled:opacity-60">
              {actionLoading ? "Starting..." : "Start Task"}
            </button>
          )}

          {status === "IN_PROGRESS" && (
            <button onClick={markTaskCompleted} disabled={actionLoading} className="w-full rounded-2xl bg-emerald-600 px-4 py-4 text-lg font-semibold text-white hover:bg-emerald-500 disabled:opacity-60">
              {actionLoading ? "Updating..." : "Mark Task as Completed"}
            </button>
          )}

          {status === "COMPLETED" && (
            <div className="rounded-2xl bg-emerald-500/10 px-4 py-3 text-center font-medium text-emerald-300">
              Task Completed ✅
            </div>
          )}
        </section>

        <div className="mt-6">
          <button onClick={() => router.back()} className="block w-full rounded-2xl bg-slate-700 px-4 py-3 text-slate-100 hover:bg-slate-600">
            Back
          </button>
        </div>
      </section>
    </main>
  );
}
