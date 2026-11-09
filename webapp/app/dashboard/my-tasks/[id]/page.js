"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { getTaskById } from "@/app/components/services/task.service";
import {
  createPaymentOrder,
  verifyPayment,
  releaseEscrowPayment,
} from "@/app/components/services/payment.service";
import { openRazorpayCheckout } from "@/app/components/lib/razorpayCheckout";
import { TaskDetailShimmer } from "@/app/components/ui/Shimmer";
import Link from "next/link";

export default function TaskDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: session } = useSession();

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentActionLoading, setPaymentActionLoading] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState("");

  const loadTask = useCallback(() => {
    if (!id) return;
    const token =
      session?.token ||
      (typeof window !== "undefined" ? localStorage.getItem("token") : null);

    getTaskById(id, token)
      .then((res) => setTask(res.data || res))
      .catch((err) => console.error("Failed to load task details", err))
      .finally(() => setLoading(false));
  }, [id, session]);

  useEffect(() => {
    loadTask();
  }, [loadTask]);

  const handleHoldPaymentInEscrow = async () => {
    if (!task) return;
    setPaymentActionLoading(true);
    setPaymentMessage("");
    try {
      const orderRes = await createPaymentOrder({
        taskId: task.id,
        amount: Number(task.budget || 300),
      });
      const orderId =
        orderRes?.order?.orderId ||
        orderRes?.data?.orderId ||
        orderRes?.orderId ||
        `order_escrow_${Date.now()}`;

      const checkoutRes = await openRazorpayCheckout({
        amountInRupees: Number(task.budget || 300),
        orderId,
        keyId: orderRes?.keyId || orderRes?.data?.keyId,
        title: `Escrow: ${task.title}`,
        description: `Hold ₹${task.budget} in HireBuddy Escrow`,
      });

      await verifyPayment({
        orderId: checkoutRes.razorpayOrderId || orderId,
        paymentId: checkoutRes.razorpayPaymentId || `pay_escrow_${Date.now()}`,
        signature: checkoutRes.razorpaySignature || "sandbox_escrow_verified",
        holdInEscrow: true,
      });

      setPaymentMessage(
        `✅ ₹${task.budget} is now securely HELD IN ESCROW! 100% will be released to your Buddy upon task completion.`
      );
      loadTask();
    } catch (err) {
      setPaymentMessage(err?.message || "Could not hold payment in escrow.");
    } finally {
      setPaymentActionLoading(false);
    }
  };

  const handleReleaseEscrow = async () => {
    if (!task) return;
    setPaymentActionLoading(true);
    setPaymentMessage("");
    try {
      await releaseEscrowPayment(task.id);
      setPaymentMessage(
        `🎉 100% of ₹${task.budget} has been released from Escrow directly to ${
          task.assignedTo?.name || "your Buddy"
        }'s wallet!`
      );
      loadTask();
    } catch (err) {
      setPaymentMessage(err?.message || "Failed to release escrow payment.");
    } finally {
      setPaymentActionLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-8 text-slate-100">
        <div className="mx-auto max-w-3xl">
          <TaskDetailShimmer />
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
    REQUESTED: { label: "Waiting for Buddy", style: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
    OPEN: { label: "Open (Unassigned)", style: "bg-sky-500/15 text-sky-300 border-sky-500/30" },
    ASSIGNED: { label: "Buddy Confirmed", style: "bg-blue-500/15 text-blue-300 border-blue-500/30" },
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

          {/* Assigned / Requested Buddy Info */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
            <h2 className="text-xs font-semibold uppercase text-slate-400">Assigned Buddy</h2>
            {task.assignedTo ? (
              <div className="mt-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  {task.assignedTo.image ? (
                    <img
                      src={
                        task.assignedTo.image.startsWith("/uploads/")
                          ? `${(process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api").replace(/\/api\/?$/, "")}${task.assignedTo.image}`
                          : task.assignedTo.image
                      }
                      alt={task.assignedTo.name || "Assigned Buddy"}
                      className="h-14 w-14 rounded-2xl object-cover object-top border border-slate-700"
                    />
                  ) : (
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-blue-500/30 bg-blue-500/15 text-lg font-bold text-blue-300">
                      {task.assignedTo.name?.charAt(0) || "B"}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-white">{task.assignedTo.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {normalizedStatus === "REQUESTED"
                        ? "⚡ Pending acceptance by Buddy"
                        : normalizedStatus === "IN_PROGRESS"
                          ? "🔨 Working on your task (In Progress)"
                          : "✓ Confirmed & active"}
                    </p>
                    {task.assignedTo.phone && (
                      <p className="text-xs text-slate-300 mt-1">📞 {task.assignedTo.phone}</p>
                    )}
                  </div>
                </div>
                {task.assignedTo.phone && normalizedStatus !== "REQUESTED" && (
                  <a
                    href={`tel:${task.assignedTo.phone}`}
                    className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500"
                  >
                    Call Buddy
                  </a>
                )}
              </div>
            ) : (
              <p className="mt-1 text-sm text-yellow-400">
                Not assigned yet. Any available Buddy can accept this task from the dashboard.
              </p>
            )}
          </div>

          {/* Completion OTP Card when Task is Assigned or In Progress */}
          {(normalizedStatus === "ASSIGNED" || normalizedStatus === "IN_PROGRESS") && (
            <div className="rounded-2xl border border-amber-500/35 bg-amber-500/10 p-5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-bold text-amber-300 flex items-center gap-2">
                  <span>🔐 4-Digit Task Completion PIN</span>
                </h2>
                <p className="text-xs text-slate-300 mt-1">
                  Share this PIN with {task.assignedTo?.name || "your Buddy"} only after the work is completed to verify completion and release held escrow payment.
                </p>
              </div>
              <div className="rounded-xl border border-amber-400/50 bg-slate-950/80 px-4 py-2.5 font-mono text-xl font-black tracking-[0.25em] text-amber-300">
                {task.completionOtp || "4829"}
              </div>
            </div>
          )}

          {/* Escrow Payment Protection Card (Hold Payment & 100% Release to Buddy) */}
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/15 p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>🔒 HireBuddy Escrow Payment Protection</span>
                  <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300">
                    100% Payout to Buddy (0% Fee)
                  </span>
                </h2>
                <p className="text-xs text-slate-300 mt-1">
                  Hold ₹{task.budget} safely in Escrow when your Buddy starts, and release 100% directly to the Buddy once the task is completed.
                </p>
              </div>
            </div>

            {paymentMessage && (
              <div className="rounded-xl border border-emerald-500/40 bg-slate-900/90 px-4 py-2.5 text-xs text-emerald-300">
                {paymentMessage}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                disabled={paymentActionLoading}
                onClick={handleHoldPaymentInEscrow}
                className="rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-2.5 text-xs font-bold text-white shadow transition disabled:opacity-50"
              >
                {paymentActionLoading
                  ? "Processing..."
                  : `🔒 Hold ₹${task.budget} in Escrow`}
              </button>

              {task.assignedTo && (
                <button
                  type="button"
                  disabled={paymentActionLoading}
                  onClick={handleReleaseEscrow}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2.5 text-xs font-bold text-white shadow transition disabled:opacity-50"
                >
                  ✓ Release 100% Payment to Buddy
                </button>
              )}
            </div>
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
