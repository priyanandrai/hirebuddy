"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getPaymentHistory } from "@/app/components/services/payment.service";

export default function TaskerEarningsPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPayments = async () => {
      try {
        const response = await getPaymentHistory();
        const data = response?.payments || response?.data?.payments || response?.data || [];
        setPayments(data);
      } catch (error) {
        console.error("Failed to fetch payment history", error);
      } finally {
        setLoading(false);
      }
    };

    loadPayments();
  }, []);

  const summary = useMemo(() => {
    const total = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const completed = payments.filter((payment) => payment.status === "COMPLETED").length;
    const latest = payments[0];

    return { total, completed, latest };
  }, [payments]);

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-6 text-slate-100">
      <section className="mb-6 mx-auto max-w-4xl">
        <h1 className="text-2xl font-bold text-white">My Earnings</h1>
        <p className="text-sm text-slate-300">Money you earned by completing tasks</p>
      </section>

      <section className="mx-auto mb-8 grid max-w-4xl grid-cols-2 gap-4">
        <EarningCard label="Total" value={summary.total} />
        <EarningCard label="Completed" value={summary.completed} />
      </section>

      <section className="mx-auto max-w-4xl rounded-[2rem] border border-slate-800 bg-slate-900/80 p-5 shadow-2xl shadow-slate-950/30">
        <h2 className="mb-4 text-lg font-semibold text-white">Recent Payments</h2>

        {loading ? (
          <div className="rounded-2xl border border-slate-700 bg-slate-950/60 p-4 text-sm text-slate-300">Loading payment history...</div>
        ) : payments.length > 0 ? (
          <div className="space-y-3">
            {payments.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/60 p-3">
                <div>
                  <p className="font-medium text-white">{item.task?.title || "Task payment"}</p>
                  <p className="text-xs text-slate-400">{new Date(item.createdAt).toLocaleDateString()} • {item.status}</p>
                </div>

                <p className="font-semibold text-emerald-400">₹{Number(item.amount || 0)}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/60 p-6 text-sm text-slate-400">No payment activity yet.</div>
        )}
      </section>

      <section className="mx-auto mt-6 max-w-4xl rounded-[2rem] border border-slate-800 bg-slate-900/80 p-4 shadow-xl shadow-slate-950/20">
        <p className="text-sm text-slate-300">{summary.latest ? `Latest payment: ₹${Number(summary.latest.amount || 0)}` : "Payment will be transferred to your bank account."}</p>

        <Link href="/dashboard-tasker/support" className="mt-3 block text-sm text-emerald-400 underline">Payment issue? Contact support</Link>
      </section>

      <div className="mt-6 text-center">
        <Link href="/dashboard-tasker" className="text-sm text-slate-300 underline hover:text-white">Back to Dashboard</Link>
      </div>
    </main>
  );
}

function EarningCard({ label, value }) {
  return (
    <div className="rounded-[1.5rem] border border-slate-800 bg-slate-900/80 p-4 text-center shadow-lg shadow-slate-950/20">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-1 text-xl font-bold text-white">₹{value}</p>
    </div>
  );
}
