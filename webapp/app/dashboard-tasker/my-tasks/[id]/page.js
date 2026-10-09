"use client";

import { getTaskById, updateTaskStatus, acceptTask, declineTask } from "@/app/components/services/task.service";
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

  async function handleAcceptRequest() {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login to accept this booking request");
      return;
    }

    setActionLoading(true);
    try {
      await acceptTask(id, token);
      setTask((prev) => ({ ...prev, status: "ASSIGNED" }));
      alert("Booking request accepted! Task is confirmed and ready to start.");
    } catch (error) {
      alert(error.message || "Failed to accept booking request");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDeclineRequest() {
    const reason = window.prompt("Reason for declining this request (optional):", "Schedule conflict / Unavailable");
    if (reason === null) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    setActionLoading(true);
    try {
      await declineTask(id, reason || "Helper unavailable", token);
      alert("Booking request declined.");
      router.push("/dashboard-tasker/my-tasks");
    } catch (error) {
      alert(error.message || "Failed to decline booking request");
    } finally {
      setActionLoading(false);
    }
  }

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
      await updateTaskStatus(id, "IN_PROGRESS", token);
      setTask((prev) => ({ ...prev, status: "IN_PROGRESS" }));
      alert("Task started successfully");
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

  const statusBadgeInfo = {
    REQUESTED: { label: "Action Required: Pending Acceptance", className: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
    ASSIGNED: { label: "Assigned & Ready to Start", className: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
    IN_PROGRESS: { label: "In Progress", className: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" },
    COMPLETED: { label: "Completed", className: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
    CANCELLED: { label: "Cancelled", className: "bg-rose-500/20 text-rose-300 border-rose-500/30" },
  }[status] || { label: status, className: "bg-slate-700 text-slate-200 border-slate-600" };

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-6 text-slate-100">
      <section className="mx-auto max-w-3xl">
        <div className="mb-6 flex flex-col gap-3 rounded-[2rem] border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-slate-950/30 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Task Details</h1>
            <p className="mt-1 text-sm text-slate-300">Review task specifications and customer details</p>
          </div>
          <div>
            <span className={`inline-block rounded-full border px-3 py-1 text-xs font-semibold ${statusBadgeInfo.className}`}>
              {statusBadgeInfo.label}
            </span>
          </div>
        </div>

        {/* Action Required: Accept/Decline Banner */}
        {status === "REQUESTED" && (
          <div className="mb-6 rounded-[2rem] border-2 border-amber-500/50 bg-gradient-to-r from-amber-500/15 via-amber-600/10 to-slate-900/90 p-6 shadow-2xl shadow-amber-950/30">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/20 text-2xl text-amber-400">
                ⚡
              </span>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-white">Direct Booking Request</h2>
                <p className="mt-1 text-sm text-slate-300 leading-relaxed">
                  The customer requested you directly for this task. Please accept to confirm the booking, or decline if you are unavailable.
                </p>

                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <button
                    onClick={handleAcceptRequest}
                    disabled={actionLoading}
                    className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3.5 text-base font-bold text-white shadow-lg shadow-emerald-950/40 transition hover:bg-emerald-500 disabled:opacity-60"
                  >
                    <span>✓</span>
                    <span>{actionLoading ? "Processing..." : "Accept Request"}</span>
                  </button>
                  <button
                    onClick={handleDeclineRequest}
                    disabled={actionLoading}
                    className="flex items-center justify-center gap-2 rounded-2xl border border-rose-500/40 bg-rose-500/10 px-5 py-3.5 text-base font-semibold text-rose-300 transition hover:bg-rose-500/20 disabled:opacity-60"
                  >
                    <span>✕</span>
                    <span>{actionLoading ? "Processing..." : "Decline Request"}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <section className="space-y-5 rounded-[2rem] border border-slate-800 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/30">
          <div>
            <h2 className="text-xl font-bold text-white">{task.title}</h2>
            <p className="mt-2 text-sm text-slate-300 leading-relaxed">{task.description}</p>
          </div>

          <div className="space-y-2 rounded-2xl bg-slate-950/50 p-4 text-sm text-slate-300 border border-slate-800/80">
            <p>📍 <strong className="text-white">Location:</strong> {task.location}</p>
            <p>⏰ <strong className="text-white">Time:</strong> {task.preferredAt ? new Date(task.preferredAt).toLocaleString() : "Flexible"}</p>
            <p>💰 <strong className="text-white">Budget:</strong> <span className="font-bold text-emerald-400">₹{task.budget}</span></p>
          </div>

          <div className="rounded-[1.5rem] border border-slate-700 bg-slate-950/60 p-4">
            <p className="font-semibold text-white">Customer Details</p>
            <p className="mt-1 text-sm text-slate-300">Name: <span className="text-white font-medium">{customerName}</span></p>
            <p className="text-sm text-slate-300">Phone: <span className="text-white font-medium">{customerPhone}</span></p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <a href={`tel:${customerPhone}`} className="rounded-2xl bg-blue-600 px-4 py-3 text-center font-medium text-white hover:bg-blue-500 transition">
              📞 Call Customer
            </a>
            <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(task.location)}`} target="_blank" className="rounded-2xl bg-slate-700 px-4 py-3 text-center font-medium text-slate-100 hover:bg-slate-600 transition">
              📍 Open Map
            </a>
          </div>

          {status === "ASSIGNED" && (
            <button onClick={startTask} disabled={actionLoading} className="w-full rounded-2xl bg-blue-600 px-4 py-4 text-lg font-semibold text-white hover:bg-blue-500 disabled:opacity-60 shadow-lg shadow-blue-950/30 transition">
              {actionLoading ? "Starting..." : "Start Task"}
            </button>
          )}

          {status === "IN_PROGRESS" && (
            <button onClick={markTaskCompleted} disabled={actionLoading} className="w-full rounded-2xl bg-emerald-600 px-4 py-4 text-lg font-semibold text-white hover:bg-emerald-500 disabled:opacity-60 shadow-lg shadow-emerald-950/30 transition">
              {actionLoading ? "Updating..." : "Mark Task as Completed"}
            </button>
          )}

          {status === "COMPLETED" && (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-center font-medium text-emerald-300">
              Task Completed ✅
            </div>
          )}

          {status === "CANCELLED" && (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-center font-medium text-rose-300">
              This task was cancelled / declined ✕
            </div>
          )}
        </section>

        <div className="mt-6">
          <button onClick={() => router.back()} className="block w-full rounded-2xl bg-slate-800 px-4 py-3 text-slate-300 hover:bg-slate-700 hover:text-white transition">
            ← Back to Tasks
          </button>
        </div>
      </section>
    </main>
  );
}
