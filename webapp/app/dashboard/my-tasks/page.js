"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { myTask } from "@/app/components/services/task.service";

export default function MyTasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    getMyTask(token);
  }, []);

  const getMyTask = async (token) => {
    try {
      const res = await myTask(token);
      setTasks(res.data || res);
    } catch (error) {
      console.error("Failed to fetch helpers", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-6 py-8 text-slate-100">
      <div className="mb-6 flex items-center justify-between rounded-[2rem] border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-slate-950/30">
        <div>
          <h1 className="text-2xl font-bold text-white">My Tasks</h1>
          <p className="mt-1 text-sm text-slate-300">Track and manage your posted tasks</p>
        </div>

        <Link href="/dashboard/create-task" className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500">
          ➕ Create Task
        </Link>
      </div>

      <div className="overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-900/80 shadow-2xl shadow-slate-950/30">
        <div className="hidden grid-cols-6 gap-4 border-b border-slate-800 bg-slate-950/60 px-4 py-3 text-sm font-medium text-slate-300 sm:grid">
          <div className="col-span-2">Task</div>
          <div>Category</div>
          <div>Status</div>
          <div>Date</div>
          <div className="text-right">Budget</div>
        </div>

        {tasks.map((task) => (
          <div key={task.id} className="grid grid-cols-1 gap-3 border-b border-slate-800 px-4 py-4 text-sm sm:grid-cols-6 sm:gap-4">
            <div className="sm:col-span-2">
              <p className="font-medium text-white">{task.title}</p>
              <Link href={`/dashboard/my-tasks/${task.id}`} className="mt-1 inline-block text-xs text-blue-400 hover:text-blue-300">
                View details
              </Link>
            </div>

            <div className="text-slate-300">{task.category}</div>

            <div>
              <StatusBadge status={task.status} />
            </div>

            <div className="text-slate-300">{task.date || task.preferredAt}</div>

            <div className="text-right font-medium text-white">₹{task.budget}</div>
          </div>
        ))}

        {tasks.length === 0 && (
          <div className="px-4 py-10 text-center text-sm text-slate-400">
            You haven’t posted any tasks yet.
          </div>
        )}
      </div>
    </main>
  );
}

/* ---------- Status Badge ---------- */

function StatusBadge({ status }) {
  const styles = {
    Open: "bg-yellow-500/15 text-yellow-300",
    "In Progress": "bg-blue-500/15 text-blue-300",
    Completed: "bg-green-500/15 text-green-300",
    Cancelled: "bg-red-500/15 text-red-300",
  };

  return (
    <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${styles[status] || "bg-slate-700 text-slate-200"}`}>
      {status}
    </span>
  );
}
