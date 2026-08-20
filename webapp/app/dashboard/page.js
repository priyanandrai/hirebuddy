"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";

import { myTask } from "../components/services/task.service";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const [myCreatedTask, setMyCreatedTask] = useState([]);
  const [loading, setLoading] = useState(true);

  const { data: session, status } = useSession();

  useEffect(() => {
    const token = session?.token || localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    getMyTask(token);
  }, [session]);

  const getMyTask = async (token) => {
    try {
      const res = await myTask(token);
      setMyCreatedTask(res.data || res);
    } catch (error) {
      console.error("Failed to fetch helpers", error);
    } finally {
      setLoading(false);
    }
  };
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-slate-100">
      <div className="mx-auto max-w-6xl">
        <section className="mb-10 rounded-[2rem] border border-slate-800 bg-slate-900/80 p-8 shadow-2xl shadow-slate-950/40">
          <h1 className="text-3xl font-bold text-white">Welcome back 👋</h1>
          <p className="mt-2 text-sm text-slate-300">What would you like to do today?</p>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 text-lg font-semibold text-slate-200">Quick Actions</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <QuickCard title="Create Task" desc="Post a new task and get help fast" href="/dashboard/create-task" />
            <QuickCard title="My Tasks" desc="Track ongoing and completed tasks" href="/dashboard/my-tasks" />
            <QuickCard title="Find Helpers" desc="Browse helpers & view profiles" href="/dashboard/helpers" />
            <QuickCard title="Services" desc="Explore all available services" href="/dashboard/services" />
          </div>
        </section>

        <section className="mb-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-200">Your Upcoming Tasks</h2>
            <Link href="/dashboard/my-tasks" className="text-sm text-blue-400 hover:text-blue-300">
              View all
            </Link>
          </div>

          <div className="space-y-3">
            {myCreatedTask.length > 0 ? (
              myCreatedTask.map((task, index) => (
                <TaskItem key={task.id || index} title={task.title} time={task.preferredAt || "Today"} price={task.budget} helper={task.assignedTo?.name || "Awaiting helper"} />
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/60 p-6 text-sm text-slate-400">
                No tasks yet. Create your first task to get started.
              </div>
            )}
          </div>
        </section>

        <section className="mb-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-200">Your Helpers</h2>
            <Link href="/dashboard/helpers" className="text-sm text-blue-400 hover:text-blue-300">
              Browse helpers
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <HelperCard id="1" name="Rahim B." rating="4.9" tasks="56" skills="Cleaning, Furniture Assembly" />
            <HelperCard id="2" name="Sonia B." rating="4.8" tasks="31" skills="Medicine Pickup, Driver Help" />
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/30">
          <h2 className="mb-2 text-lg font-semibold text-white">Need Help?</h2>
          <p className="mb-4 text-slate-300">Our support team is available 24/7 for any issues.</p>
          <Link href="/dashboard/support" className="inline-block rounded-2xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-900 transition hover:bg-white">
            Contact Support
          </Link>
        </section>
      </div>
    </main>
  );
}

/* ---------------- Components ---------------- */

function QuickCard({ title, desc, href }) {
  return (
    <Link
      href={href}
      className="block rounded-[1.5rem] border border-slate-800 bg-slate-900/80 p-4 shadow-lg shadow-slate-950/20 transition hover:border-blue-500/40 hover:bg-slate-900"
    >
      <h3 className="mb-1 font-semibold text-white">{title}</h3>
      <p className="text-sm text-slate-300">{desc}</p>
    </Link>
  );
}

function TaskItem({ title, time, price, helper }) {
  return (
    <div className="flex items-center justify-between rounded-[1.5rem] border border-slate-800 bg-slate-900/80 p-4 shadow-lg shadow-slate-950/20">
      <div>
        <p className="font-medium text-white">{title}</p>
        <p className="text-sm text-slate-400">{time}</p>
      </div>
      <div className="text-right">
        <p className="font-semibold text-white">₹{price}</p>
        <p className="text-sm text-blue-400">{helper}</p>
      </div>
    </div>
  );
}

function HelperCard({ id, name, rating, tasks, skills }) {
  return (
    <div className="rounded-[1.5rem] border border-slate-800 bg-slate-900/80 p-4 shadow-lg shadow-slate-950/20">
      <h3 className="font-semibold text-white">{name}</h3>
      <p className="text-sm text-slate-300">⭐ {rating} • {tasks} tasks</p>
      <p className="mt-1 text-sm text-slate-400">{skills}</p>

      <Link
        href={`/dashboard/helpers/${id}`}
        className="mt-3 block w-full rounded-2xl bg-blue-600 px-3 py-2 text-center text-sm font-medium text-white transition hover:bg-blue-500"
      >
        View Profile
      </Link>
    </div>
  );
}
