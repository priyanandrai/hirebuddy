"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getAssignedTasks } from "@/app/components/services/task.service";

export default function TaskerMyTasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    const fetchAssignedTasks = async () => {
      try {
        const res = await getAssignedTasks(token);
        setTasks(res.data || res.tasks || res || []);
      } catch (error) {
        console.error("Failed to fetch assigned tasks", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAssignedTasks();
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-6 text-slate-100">
      <section className="mx-auto max-w-4xl">
        <div className="mb-6 rounded-[2rem] border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-slate-950/30">
          <h1 className="text-2xl font-bold text-white">My Tasks</h1>
          <p className="mt-1 text-sm text-slate-300">Tasks you have accepted</p>
        </div>

        <section className="space-y-4">
          {loading ? (
            <div className="rounded-[1.5rem] border border-slate-800 bg-slate-900/80 p-6 text-sm text-slate-300">Loading your assigned tasks...</div>
          ) : tasks.length > 0 ? (
            tasks.map((task) => {
              const statusKey = task.status || "OPEN";
              const isInProgress = statusKey === "IN_PROGRESS" || statusKey === "ASSIGNED";
              const isCompleted = statusKey === "COMPLETED";

              return (
                <div key={task.id} className="rounded-[1.5rem] border border-slate-800 bg-slate-900/80 p-5 shadow-lg shadow-slate-950/20">
                  <p className="text-lg font-semibold text-white">{task.title}</p>
                  <p className="mt-1 text-sm text-slate-300">📍 {task.location}</p>
                  <p className="mt-1 text-sm text-slate-300">⏰ {task.preferredAt ? new Date(task.preferredAt).toLocaleString() : "Flexible"}</p>
                  <p className="mt-2 text-lg font-bold text-blue-400">₹{task.budget}</p>

                  <div className="mt-3">
                    <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                      isCompleted ? "bg-green-500/15 text-green-300" : isInProgress ? "bg-yellow-500/15 text-yellow-300" : "bg-slate-700 text-slate-200"
                    }`}>
                      {isCompleted ? "Completed" : isInProgress ? "In Progress" : statusKey}
                    </span>
                  </div>

                  <div className="mt-4">
                    {isCompleted ? (
                      <Link href="/dashboard-tasker/earnings" className="block rounded-2xl bg-slate-700 px-4 py-3 text-center text-slate-100 font-medium hover:bg-slate-600">
                        View Earnings
                      </Link>
                    ) : (
                      <Link href={`/dashboard-tasker/my-tasks/${task.id}`} className="block rounded-2xl bg-blue-600 px-4 py-3 text-center text-white font-medium hover:bg-blue-500">
                        View Task
                      </Link>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-[1.5rem] border border-slate-800 bg-slate-900/80 p-6 text-center shadow-xl shadow-slate-950/30">
              <p className="text-slate-200">You have not accepted any tasks yet.</p>
              <Link href="/dashboard-tasker/tasks" className="mt-4 inline-block rounded-2xl bg-blue-600 px-4 py-3 text-white">
                See Available Tasks
              </Link>
            </div>
          )}
        </section>

        <div className="mt-6 text-center">
          <Link href="/dashboard-tasker" className="text-sm text-blue-400 hover:text-blue-300">
            Back to Dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}
