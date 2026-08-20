"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { acceptTask, getOpenTasks } from "@/app/components/services/task.service";

export default function HelperTasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    const fetchTasks = async () => {
      try {
        const res = await getOpenTasks(token);
        const data = res.tasks || res.data || res || [];
        setTasks(data);
      } catch (error) {
        console.error("Failed to fetch helper tasks", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  async function handleAcceptTask(taskId) {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login to accept a task");
      return;
    }

    setAcceptingId(taskId);
    try {
      await acceptTask(taskId, token);
      setTasks((prev) => prev.filter((task) => task.id !== taskId));
      alert("Task accepted successfully!");
    } catch (error) {
      alert(error.message || "Unable to accept task");
    } finally {
      setAcceptingId(null);
    }
  }

  function ignoreTask(taskId) {
    setTasks((prev) => prev.filter((task) => task.id !== taskId));
  }

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-6 text-slate-100">
      <section className="mx-auto max-w-4xl">
        <div className="mb-6 rounded-[2rem] border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-slate-950/30">
          <h1 className="text-2xl font-bold text-white">Available Tasks</h1>
          <p className="mt-1 text-sm text-slate-300">Choose a task you want to work on</p>
        </div>

        <section className="space-y-4">
          {loading ? (
            <div className="rounded-[1.5rem] border border-slate-800 bg-slate-900/80 p-6 text-sm text-slate-300">Loading available tasks...</div>
          ) : tasks.length > 0 ? (
            tasks.map((task) => (
              <div key={task.id} className="rounded-[1.5rem] border border-slate-800 bg-slate-900/80 p-5 shadow-lg shadow-slate-950/20">
                <p className="text-lg font-semibold text-white">{task.title}</p>
                <p className="mt-1 text-sm text-slate-300">📍 {task.location}</p>
                <p className="mt-1 text-sm text-slate-300">⏰ {task.preferredAt ? new Date(task.preferredAt).toLocaleString() : "Flexible"}</p>
                <p className="mt-2 text-lg font-bold text-blue-400">₹{task.budget}</p>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleAcceptTask(task.id)}
                    disabled={acceptingId === task.id}
                    className="rounded-2xl bg-blue-600 px-4 py-3 font-medium text-white transition hover:bg-blue-500 disabled:opacity-60"
                  >
                    {acceptingId === task.id ? "Accepting..." : "Accept"}
                  </button>

                  <button
                    onClick={() => ignoreTask(task.id)}
                    className="rounded-2xl bg-slate-700 px-4 py-3 font-medium text-slate-200 hover:bg-slate-600"
                  >
                    Ignore
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-[1.5rem] border border-slate-800 bg-slate-900/80 p-6 text-center shadow-xl shadow-slate-950/30">
              <p className="text-slate-200">No tasks available right now.</p>
              <p className="mt-1 text-sm text-slate-400">Please check again later.</p>
              <Link href="/dashboard-tasker" className="mt-4 inline-block rounded-2xl bg-blue-600 px-4 py-3 text-white">
                Go Back
              </Link>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
