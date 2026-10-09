"use client";

import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { getAssignedTasks, acceptTask, declineTask } from "@/app/components/services/task.service";

export default function TaskerMyTasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("ALL");
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchAssignedTasks = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await getAssignedTasks(token);
      setTasks(res.data || res.tasks || res || []);
    } catch (error) {
      console.error("Failed to fetch assigned tasks", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignedTasks();
  }, []);

  const handleAcceptRequest = async (taskId) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setActionLoadingId(taskId);
    try {
      await acceptTask(taskId, token);
      alert("Booking request accepted! Task is confirmed.");
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: "ASSIGNED" } : t))
      );
    } catch (err) {
      console.error("Failed to accept task", err);
      alert(err.message || "Failed to accept booking request");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeclineRequest = async (taskId) => {
    const reason = window.prompt("Reason for declining this request (optional):", "Schedule conflict / Unavailable");
    if (reason === null) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    setActionLoadingId(taskId);
    try {
      await declineTask(taskId, reason || "Helper unavailable", token);
      alert("Booking request declined.");
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (err) {
      console.error("Failed to decline task", err);
      alert(err.message || "Failed to decline booking request");
    } finally {
      setActionLoadingId(null);
    }
  };

  const pendingCount = useMemo(() => {
    return tasks.filter((t) => t.status === "REQUESTED").length;
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    if (activeTab === "PENDING") {
      return tasks.filter((t) => t.status === "REQUESTED");
    }
    if (activeTab === "ACTIVE") {
      return tasks.filter((t) => ["ASSIGNED", "IN_PROGRESS"].includes(t.status));
    }
    if (activeTab === "COMPLETED") {
      return tasks.filter((t) => t.status === "COMPLETED");
    }
    return tasks;
  }, [tasks, activeTab]);

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-6 text-slate-100">
      <section className="mx-auto max-w-4xl">
        <div className="mb-6 rounded-[2rem] border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-slate-950/30">
          <h1 className="text-2xl font-bold text-white">My Tasks</h1>
          <p className="mt-1 text-sm text-slate-300">Tasks assigned to you or direct booking requests</p>

          {/* Filter Tabs */}
          <div className="mt-5 flex flex-wrap gap-2">
            {[
              { key: "ALL", label: `All (${tasks.length})` },
              { key: "PENDING", label: `Pending Requests (${pendingCount})`, highlight: pendingCount > 0 },
              { key: "ACTIVE", label: "Active Jobs" },
              { key: "COMPLETED", label: "Completed" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
                  activeTab === tab.key
                    ? "bg-blue-600 text-white shadow-md shadow-blue-900/30"
                    : tab.highlight
                    ? "border border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
                    : "border border-slate-800 bg-slate-950/50 text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <section className="space-y-4">
          {loading ? (
            <div className="rounded-[1.5rem] border border-slate-800 bg-slate-900/80 p-6 text-sm text-slate-300">
              Loading your tasks...
            </div>
          ) : filteredTasks.length > 0 ? (
            filteredTasks.map((task) => {
              const statusKey = task.status || "OPEN";
              const isRequested = statusKey === "REQUESTED";
              const isAssigned = statusKey === "ASSIGNED";
              const isInProgress = statusKey === "IN_PROGRESS";
              const isCompleted = statusKey === "COMPLETED";
              const isCancelled = statusKey === "CANCELLED";

              return (
                <div
                  key={task.id}
                  className={`rounded-[1.5rem] border p-5 shadow-lg shadow-slate-950/20 transition ${
                    isRequested
                      ? "border-amber-500/50 bg-gradient-to-r from-amber-500/10 via-slate-900/90 to-slate-900/90"
                      : "border-slate-800 bg-slate-900/80"
                  }`}
                >
                  <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                    <div>
                      <div className="flex items-center gap-2">
                        {isRequested && (
                          <span className="rounded-full border border-amber-500/40 bg-amber-500/20 px-2.5 py-0.5 text-xs font-semibold text-amber-300">
                            ⚡ Direct Booking
                          </span>
                        )}
                        <span
                          className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                            isRequested
                              ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                              : isCompleted
                              ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                              : isInProgress
                              ? "bg-yellow-500/15 text-yellow-300 border border-yellow-500/30"
                              : isAssigned
                              ? "bg-blue-500/15 text-blue-300 border border-blue-500/30"
                              : isCancelled
                              ? "bg-rose-500/15 text-rose-300 border border-rose-500/30"
                              : "bg-slate-700 text-slate-200"
                          }`}
                        >
                          {isRequested
                            ? "Action Required: Pending Acceptance"
                            : isAssigned
                            ? "Assigned (Ready to Start)"
                            : isInProgress
                            ? "In Progress"
                            : isCompleted
                            ? "Completed"
                            : isCancelled
                            ? "Cancelled"
                            : statusKey}
                        </span>
                      </div>
                      <h2 className="mt-2 text-lg font-semibold text-white">{task.title}</h2>
                      {task.createdBy?.name && (
                        <p className="mt-0.5 text-xs text-slate-400">
                          Customer: <span className="text-slate-200 font-medium">{task.createdBy.name}</span>
                        </p>
                      )}
                    </div>
                    <div className="text-left sm:text-right">
                      <span className="text-xs uppercase text-slate-400">Budget</span>
                      <p className="text-xl font-bold text-emerald-400">₹{task.budget}</p>
                    </div>
                  </div>

                  <div className="mt-3 space-y-1 text-xs text-slate-300 sm:text-sm">
                    <p>📍 {task.location}</p>
                    <p>⏰ {task.preferredAt ? new Date(task.preferredAt).toLocaleString() : "Flexible"}</p>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-4 pt-3 border-t border-slate-800/80">
                    {isRequested ? (
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                        <Link
                          href={`/dashboard-tasker/my-tasks/${task.id}`}
                          className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-center text-xs font-semibold text-slate-200 hover:bg-slate-700"
                        >
                          View Details
                        </Link>
                        <button
                          onClick={() => handleDeclineRequest(task.id)}
                          disabled={actionLoadingId === task.id}
                          className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 disabled:opacity-60"
                        >
                          Decline
                        </button>
                        <button
                          onClick={() => handleAcceptRequest(task.id)}
                          disabled={actionLoadingId === task.id}
                          className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-60 shadow-md shadow-emerald-950/30"
                        >
                          {actionLoadingId === task.id ? "Accepting..." : "Accept Request"}
                        </button>
                      </div>
                    ) : isCompleted ? (
                      <div className="flex gap-2 justify-end">
                        <Link
                          href={`/dashboard-tasker/my-tasks/${task.id}`}
                          className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-center text-xs font-semibold text-slate-200 hover:bg-slate-700"
                        >
                          View Details
                        </Link>
                        <Link
                          href="/dashboard-tasker/earnings"
                          className="rounded-xl bg-slate-700 px-4 py-2 text-center text-xs font-semibold text-slate-100 hover:bg-slate-600"
                        >
                          View Earnings
                        </Link>
                      </div>
                    ) : (
                      <div className="flex justify-end">
                        <Link
                          href={`/dashboard-tasker/my-tasks/${task.id}`}
                          className="rounded-xl bg-blue-600 px-5 py-2 text-center text-xs font-semibold text-white hover:bg-blue-500 shadow-md shadow-blue-950/30"
                        >
                          View Task & Progress →
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-[1.5rem] border border-slate-800 bg-slate-900/80 p-8 text-center shadow-xl shadow-slate-950/30">
              <p className="text-slate-200">
                {activeTab === "PENDING"
                  ? "No pending booking requests."
                  : activeTab === "ACTIVE"
                  ? "No active jobs right now."
                  : activeTab === "COMPLETED"
                  ? "No completed tasks yet."
                  : "You do not have any tasks yet."}
              </p>
              <Link href="/dashboard-tasker/tasks" className="mt-4 inline-block rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-500">
                Browse Available Tasks
              </Link>
            </div>
          )}
        </section>

        <div className="mt-6 text-center">
          <Link href="/dashboard-tasker" className="text-sm text-blue-400 hover:text-blue-300">
            ← Back to Dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}
