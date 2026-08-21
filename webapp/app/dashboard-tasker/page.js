"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getAssignedTasks } from "@/app/components/services/task.service";
import { getUnreadNotificationCount } from "@/app/components/services/notification.service";

export default function HelperDashboardPage() {
  const [tasks, setTasks] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [assignedRes, unreadRes] = await Promise.all([
          getAssignedTasks(),
          getUnreadNotificationCount(),
        ]);

        const assignedTasks = assignedRes?.tasks || assignedRes?.data || assignedRes || [];
        setTasks(assignedTasks);

        setUnreadCount(Number(unreadRes?.unreadCount || unreadRes?.data?.unreadCount || 0));
      } catch (error) {
        console.error("Failed to load helper dashboard", error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const summary = useMemo(() => {
    const totalEarnings = tasks.reduce((sum, task) => sum + Number(task.budget || 0), 0);
    const activeTasks = tasks.filter((task) => ["ASSIGNED", "IN_PROGRESS"].includes(task.status)).length;
    const nextTask = tasks[0];

    return { totalEarnings, activeTasks, nextTask };
  }, [tasks]);

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-6 text-slate-100">
      <div className="mx-auto max-w-5xl">
        <section className="mb-6 rounded-[2rem] border border-slate-800 bg-slate-900/80 p-8 shadow-2xl shadow-slate-950/30">
          <h1 className="text-3xl font-bold text-white">Hello 👋</h1>
          <p className="mt-2 text-sm text-slate-300">Welcome back. What would you like to do today?</p>
        </section>

        <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          <PrimaryAction title="See Available Tasks" desc="New work near you" href="/dashboard-tasker/tasks" bg="bg-blue-600" />
          <PrimaryAction title="My Accepted Tasks" desc="Work you already accepted" href="/dashboard-tasker/my-tasks" bg="bg-slate-800" />
          <PrimaryAction title="Notifications" desc={`${unreadCount} unread updates`} href="/dashboard-tasker/notifications" bg="bg-emerald-600" />
        </section>

        <section className="mb-8 grid gap-4 md:grid-cols-3">
          <MetricCard label="Assigned tasks" value={tasks.length} />
          <MetricCard label="Active now" value={summary.activeTasks} />
          <MetricCard label="Earnings" value={`₹${summary.totalEarnings}`} />
        </section>

        <section className="mb-8 rounded-[2rem] border border-slate-800 bg-slate-900/80 p-5 shadow-xl shadow-slate-950/20">
          <h2 className="mb-3 text-lg font-semibold text-white">Today’s Work</h2>
          {loading ? (
            <div className="rounded-[1.5rem] border border-slate-700 bg-slate-950/60 p-4 text-sm text-slate-300">Loading your work...</div>
          ) : summary.nextTask ? (
            <div className="rounded-[1.5rem] border border-slate-700 bg-slate-950/60 p-4">
              <p className="font-medium text-white">{summary.nextTask.title}</p>
              <p className="mt-1 text-sm text-slate-300">Location: {summary.nextTask.location}</p>
              <p className="mt-1 text-sm text-slate-300">Status: {summary.nextTask.status}</p>
              <p className="mt-1 text-sm text-slate-300">Payment: ₹{summary.nextTask.budget}</p>
              <Link href={`/dashboard-tasker/my-tasks/${summary.nextTask.id}`} className="mt-4 block rounded-2xl bg-blue-600 px-4 py-3 text-center text-white hover:bg-blue-500">
                View Task Details
              </Link>
            </div>
          ) : (
            <div className="rounded-[1.5rem] border border-slate-700 bg-slate-950/60 p-4 text-sm text-slate-400">No accepted tasks yet.</div>
          )}
        </section>

        <section className="mb-8 rounded-[2rem] border border-slate-800 bg-slate-900/80 p-5 shadow-xl shadow-slate-950/20">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Your Earnings</h2>
            <Link href="/dashboard-tasker/earnings" className="text-sm text-blue-400 hover:text-blue-300">View payments</Link>
          </div>
          <p className="mt-1 text-sm text-slate-300">Today: <span className="font-semibold text-white">₹{summary.totalEarnings || 0}</span></p>
          <p className="text-sm text-slate-300">This month: <span className="font-semibold text-white">₹{summary.totalEarnings || 0}</span></p>
        </section>

        <section className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-5 shadow-xl shadow-slate-950/20">
          <h2 className="text-lg font-semibold text-white">Need Help?</h2>
          <p className="mt-1 text-sm text-slate-300">If you have any problem, contact support.</p>
          <Link href="/dashboard-tasker/support" className="mt-3 block rounded-2xl bg-slate-100 px-4 py-3 text-center text-slate-900 hover:bg-white">
            Contact Support
          </Link>
        </section>
      </div>
    </main>
  );
}

function PrimaryAction({ title, desc, href, bg }) {
  return (
    <Link href={href} className={`${bg} rounded-[1.5rem] p-5 text-white shadow-lg shadow-slate-950/20`}>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-1 text-sm opacity-90">{desc}</p>
    </Link>
  );
}

function MetricCard({ label, value }) {
  return (
    <div className="rounded-[1.5rem] border border-slate-800 bg-slate-900/80 p-5 shadow-lg shadow-slate-950/20">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-bold text-white">{value}</p>
    </div>
  );
}
