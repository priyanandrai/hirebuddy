"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  createSupportTicket,
  getMySupportTickets,
} from "../../components/services/marketplace.service";

export default function SupportPage() {
  const [form, setForm] = useState({
    category: "GENERAL",
    subject: "",
    message: "",
  });

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingTickets, setFetchingTickets] = useState(true);
  const [successBanner, setSuccessBanner] = useState("");
  const [errorBanner, setErrorBanner] = useState("");

  const loadTickets = async () => {
    setFetchingTickets(true);
    try {
      const res = await getMySupportTickets();
      setTickets(res?.tickets || []);
    } catch (e) {
      // ignore if guest
    } finally {
      setFetchingTickets(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setSuccessBanner("");
    setErrorBanner("");

    try {
      const res = await createSupportTicket(form);
      setSuccessBanner(
        res?.message ||
          "Your support ticket has been logged! Our Meerut Support Desk will assist you shortly."
      );
      setForm({ category: "GENERAL", subject: "", message: "" });
      loadTickets();
    } catch (err) {
      setErrorBanner(err?.message || "Failed to submit support ticket.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#060c1b] text-slate-100 px-6 py-10">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Customer &amp; Partner Support Center
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Need help with a task, escrow payment, Buddy booking, or Meerut Marketplace order? Raise a ticket below.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 self-start"
          >
            ← Back to Dashboard
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* Left: Help Info + My Tickets */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-[#182949] bg-[#0a1326] p-6 shadow-xl">
              <h3 className="text-base font-bold text-white">
                Common Help Topics
              </h3>

              <ul className="mt-4 space-y-2.5 text-xs sm:text-sm text-slate-300">
                <li>• How to post a task or pick a verified Buddy directly</li>
                <li>• Escrow payment hold &amp; 100% Buddy release questions</li>
                <li>• Meerut Manufacturers Marketplace orders &amp; delivery tracking</li>
                <li>• Seller onboarding (FSSAI / GST / Daily NEFT settlement)</li>
                <li>• Buddy ₹5/day or ₹99/month Active Pass support</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-[#182949] bg-[#0a1326] p-6 shadow-xl">
              <h3 className="text-base font-bold text-white">
                Direct Contact &amp; Grievance Cell
              </h3>

              <div className="mt-3 space-y-2 text-xs sm:text-sm text-slate-300">
                <p>📧 Support Email: <span className="text-emerald-400">support@hirebuddy.in</span></p>
                <p>⚖️ Grievance Officer: <span className="text-blue-400">grievance@hirebuddy.in</span></p>
                <p>📞 Helpline: +91 98970 00000 (Meerut HQ)</p>
                <p>⏰ Support Hours: 9:00 AM – 8:00 PM IST (Mon–Sun)</p>
              </div>
            </div>

            {/* Previous Tickets */}
            <div className="rounded-2xl border border-[#182949] bg-[#0a1326] p-6 shadow-xl">
              <h3 className="text-base font-bold text-white mb-3">
                My Support Tickets ({tickets.length})
              </h3>
              {fetchingTickets ? (
                <p className="text-xs text-slate-400">Loading your tickets...</p>
              ) : tickets.length === 0 ? (
                <p className="text-xs text-slate-400">
                  You haven&apos;t raised any support tickets yet.
                </p>
              ) : (
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {tickets.map((t) => (
                    <div
                      key={t.id}
                      className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-white truncate">
                          {t.subject}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            t.status === "RESOLVED"
                              ? "bg-emerald-500/20 text-emerald-300"
                              : "bg-amber-500/20 text-amber-300"
                          }`}
                        >
                          {t.status}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-400 line-clamp-2">
                        {t.message}
                      </p>
                      {t.adminReply && (
                        <div className="mt-2 rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-2 text-xs text-emerald-300">
                          <strong>Admin Reply:</strong> {t.adminReply}
                        </div>
                      )}
                      <p className="mt-1.5 text-[10px] text-slate-500">
                        {t.category} • {new Date(t.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Support Form */}
          <div className="rounded-2xl border border-[#182949] bg-[#0a1326] p-6 shadow-xl self-start">
            <h3 className="mb-4 text-lg font-bold text-white">
              Raise a Support Request
            </h3>

            {successBanner && (
              <div className="mb-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3.5 text-xs text-emerald-300">
                {successBanner}
              </div>
            )}

            {errorBanner && (
              <div className="mb-4 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3.5 text-xs text-rose-300">
                {errorBanner}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Issue Category
                </label>
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="GENERAL">General Inquiry</option>
                  <option value="TASK_ISSUE">Task / Buddy Booking Issue</option>
                  <option value="PAYMENT_ESCROW">Payment / Escrow Hold &amp; Refund</option>
                  <option value="MARKETPLACE_ORDER">Meerut Marketplace Order / Delivery</option>
                  <option value="SELLER_KYC">Seller Onboarding / NEFT Settlement</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Subject
                </label>
                <input
                  name="subject"
                  value={form.subject}
                  onChange={handleChange}
                  placeholder="e.g. Issue with task escrow payment or order delivery"
                  required
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Describe Your Issue
                </label>
                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  placeholder="Provide details (Task title, Order number, or issue description)..."
                  rows={5}
                  required
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-500 disabled:opacity-60 transition shadow-lg shadow-emerald-950/40"
              >
                {loading ? "Submitting Ticket..." : "Submit Support Ticket"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
