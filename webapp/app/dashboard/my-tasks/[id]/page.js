"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { getTaskById } from "@/app/components/services/task.service";
import Link from "next/link";

export default function TaskDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: session } = useSession();

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const token = session?.token || (typeof window !== "undefined" ? localStorage.getItem("token") : null);

    getTaskById(id, token)
      .then((res) => setTask(res.data || res))
      .catch((err) => console.error("Failed to load task details", err))
      .finally(() => setLoading(false));
  }, [id, session]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-8 text-slate-100">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-slate-800 bg-slate-900/80 p-8 text-center text-slate-300">
          Loading task details...
        </div>
      </main>
    );
  }

  if (!task) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-8 text-slate-100">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-slate-800 bg-slate-900/80 p-8 text-center text-slate-300">
          <p>Task not found.</p>
          <button onClick={() => router.back()} className="mt-4 rounded-xl bg-slate-800 px-4 py-2 text-white hover:bg-slate-700">
            ← Go Back
          </button>
        </div>
      </main>
    );
  }

  const normalizedStatus = (task.status || "").toUpperCase();

  const statusConfigs = {
    REQUESTED: { label: "Waiting for Helper", style: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
    OPEN: { label: "Open (Unassigned)", style: "bg-sky-500/15 text-sky-300 border-sky-500/30" },
    ASSIGNED: { label: "Helper Confirmed", style: "bg-blue-500/15 text-blue-300 border-blue-500/30" },
    IN_PROGRESS: { label: "In Progress", style: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30" },
    COMPLETED: { label: "Completed", style: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
    CANCELLED: { label: "Cancelled", style: "bg-rose-500/15 text-rose-300 border-rose-500/30" },
  };

  const statusInfo = statusConfigs[normalizedStatus] || { label: task.status, style: "bg-slate-700 text-slate-200 border-slate-600" };

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-slate-100">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 rounded-[2rem] border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-slate-950/30 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">{task.title}</h1>
            <p className="mt-1 text-xs text-slate-400">Created on {new Date(task.createdAt).toLocaleString()}</p>
          </div>
          <div>
            <span className={`inline-block rounded-full border px-3 py-1 text-xs font-semibold ${statusInfo.style}`}>
              {statusInfo.label}
            </span>
          </div>
        </div>

        {/* Status Alert for Direct Booking */}
        {normalizedStatus === "REQUESTED" && (
          <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-5">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⏳</span>
              <div>
                <h2 className="font-bold text-amber-300">Request Sent to Helper</h2>
                <p className="text-xs text-slate-300 mt-0.5">
                  We have notified {task.assignedTo?.name || "your selected helper"}. They will review and accept your booking request shortly.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Task Details Card */}
        <div className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/30 space-y-4">
          <div>
            <h2 className="text-xs font-semibold uppercase text-slate-400">Description</h2>
            <p className="mt-1 text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
              {task.description || "No description provided."}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-3">
            <div className="rounded-2xl bg-slate-950/50 p-4 border border-slate-800/80">
              <span className="text-xs text-slate-400">Category</span>
              <p className="mt-1 text-sm font-semibold text-white">{task.category || "General"}</p>
            </div>
            <div className="rounded-2xl bg-slate-950/50 p-4 border border-slate-800/80">
              <span className="text-xs text-slate-400">Location</span>
              <p className="mt-1 text-sm font-semibold text-white">{task.location}</p>
            </div>
            <div className="rounded-2xl bg-slate-950/50 p-4 border border-slate-800/80">
              <span className="text-xs text-slate-400">Budget</span>
              <p className="mt-1 text-base font-bold text-emerald-400">₹{task.budget}</p>
            </div>
          </div>

          {/* Assigned / Requested Helper Info */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
            <h2 className="text-xs font-semibold uppercase text-slate-400">Assigned Helper</h2>
            {task.assignedTo ? (
              <div className="mt-2 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-white">{task.assignedTo.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {normalizedStatus === "REQUESTED"
                      ? "⚡ Pending acceptance by helper"
                      : "✓ Confirmed & active"}
                  </p>
                  {task.assignedTo.phone && (
                    <p className="text-xs text-slate-300 mt-1">📞 {task.assignedTo.phone}</p>
                  )}
                </div>
                {task.assignedTo.phone && normalizedStatus !== "REQUESTED" && (
                  <a
                    href={`tel:${task.assignedTo.phone}`}
                    className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500"
                  >
                    Call Helper
                  </a>
                )}
              </div>
            ) : (
              <p className="mt-1 text-sm text-yellow-400">
                Not assigned yet. Any available helper can accept this task from the marketplace.
              </p>
            )}
          </div>
        </div>

        <div>
          <button
            onClick={() => router.back()}
            className="rounded-2xl bg-slate-800 px-5 py-3 text-sm font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition"
          >
            ← Back to My Tasks
          </button>
        </div>
      </div>
    </main>
  );
}
