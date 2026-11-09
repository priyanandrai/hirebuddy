"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import HeaderAfterlogin from "@/app/components/layout/HeaderAfterlogin";
import Footer from "@/app/components/layout/Footer";
import {
  getWallet,
  topupWallet,
  withdrawWallet,
} from "@/app/components/services/payment.service";
import {
  Wallet,
  PlusCircle,
  ArrowUpRight,
  ArrowDownLeft,
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
  Clock,
  CreditCard,
  Smartphone,
  Building2,
  ArrowLeft,
  Sparkles,
} from "lucide-react";

const QUICK_AMOUNTS = [100, 250, 500, 1000, 2000];

export default function CustomerWalletPage() {
  const [walletData, setWalletData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Top-up state
  const [topupAmount, setTopupAmount] = useState("500");
  const [topupMethod, setTopupMethod] = useState("UPI");
  const [topupLoading, setTopupLoading] = useState(false);

  // Withdraw state
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [payoutMethod, setPayoutMethod] = useState("UPI");
  const [upiId, setUpiId] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  // Filter state
  const [filterTab, setFilterTab] = useState("ALL");
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchWallet = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await getWallet();
      setWalletData(res);
      if (res?.balancePaise !== undefined && typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem("user");
          if (raw) {
            const parsed = JSON.parse(raw);
            localStorage.setItem(
              "user",
              JSON.stringify({ ...parsed, walletBalance: res.balancePaise })
            );
          }
        } catch {}
      }
    } catch (error) {
      console.error("Failed to load wallet:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, []);

  const handleTopup = async (e) => {
    e.preventDefault();
    const num = Number(topupAmount);
    if (!num || num < 1) {
      showToast("Please enter a valid amount (minimum ₹1)", "error");
      return;
    }
    setTopupLoading(true);
    try {
      const res = await topupWallet({
        amountRupees: num,
        method: topupMethod,
      });
      showToast(res?.message || `₹${num} added to your HireBuddy Wallet!`);
      await fetchWallet(true);
    } catch (error) {
      showToast(error?.message || "Failed to add money to wallet", "error");
    } finally {
      setTopupLoading(false);
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    const num = Number(withdrawAmount);
    if (!num || num < 1) {
      showToast("Please enter a valid withdrawal amount", "error");
      return;
    }
    setWithdrawLoading(true);
    try {
      const res = await withdrawWallet({
        amountRupees: num,
        payoutMethod,
        upiId,
        bankAccount,
        ifsc,
      });
      showToast(res?.message || `₹${num} withdrawn successfully!`);
      setShowWithdrawModal(false);
      setWithdrawAmount("");
      await fetchWallet(true);
    } catch (error) {
      showToast(error?.message || "Withdrawal failed", "error");
    } finally {
      setWithdrawLoading(false);
    }
  };

  const transactions = useMemo(() => {
    const list = walletData?.transactions || [];
    if (filterTab === "ALL") return list;
    if (filterTab === "CREDIT") return list.filter((t) => t.direction === "CREDIT");
    if (filterTab === "DEBIT") return list.filter((t) => t.direction === "DEBIT");
    if (filterTab === "ESCROW")
      return list.filter(
        (t) =>
          t.type?.includes("ESCROW") || t.status === "HELD_IN_ESCROW"
      );
    return list;
  }, [walletData, filterTab]);

  const balanceRupees = walletData?.balanceRupees ?? 0;
  const escrowHeldRupees = walletData?.escrowHeldRupees ?? 0;
  const totalCreditedRupees = walletData?.totalCreditedRupees ?? 0;
  const totalDebitedRupees = walletData?.totalDebitedRupees ?? 0;

  return (
    <div className="min-h-screen bg-[#060c1b] text-slate-100 flex flex-col">
      <HeaderAfterlogin />

      {toast && (
        <div
          className={`fixed top-20 right-6 z-50 flex items-center gap-2.5 rounded-2xl border px-5 py-3.5 text-sm font-semibold shadow-2xl backdrop-blur-md transition ${
            toast.type === "error"
              ? "border-rose-500/40 bg-rose-950/90 text-rose-200"
              : "border-emerald-500/40 bg-slate-900/95 text-white"
          }`}
        >
          <CheckCircle2
            className={`h-4 w-4 ${
              toast.type === "error" ? "text-rose-400" : "text-emerald-400"
            }`}
          />
          <span>{toast.message}</span>
        </div>
      )}

      <main className="flex-1 pt-20 pb-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          {/* Top Breadcrumb & Header */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition mb-2"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Dashboard
              </Link>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/30">
                  <Wallet className="h-5 w-5" />
                </span>
                HireBuddy Wallet
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-slate-400">
                Instant 1-click task bookings, 100% Escrow protection, and zero hidden charges.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => fetchWallet(true)}
                disabled={refreshing}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
                Refresh
              </button>
              <button
                type="button"
                onClick={() => setShowWithdrawModal(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-blue-500/40 bg-blue-500/10 px-4 py-2.5 text-xs font-bold text-blue-300 hover:bg-blue-500/20 transition"
              >
                <ArrowUpRight className="h-4 w-4" />
                Withdraw to UPI / Bank
              </button>
            </div>
          </div>

          {/* 4 Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="rounded-3xl border border-blue-500/30 bg-gradient-to-br from-blue-600/20 via-slate-900 to-slate-900 p-5 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-300">
                  Available Balance
                </span>
                <Wallet className="h-5 w-5 text-blue-400" />
              </div>
              <p className="mt-3 text-3xl font-extrabold text-white">
                ₹{loading ? "..." : balanceRupees.toLocaleString("en-IN")}
              </p>
              <p className="mt-1.5 text-[11px] text-slate-400">
                Ready for instant task & escrow payments
              </p>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-300">
                  Held in Escrow
                </span>
                <ShieldCheck className="h-5 w-5 text-amber-400" />
              </div>
              <p className="mt-3 text-2xl font-bold text-white">
                ₹{loading ? "..." : escrowHeldRupees.toLocaleString("en-IN")}
              </p>
              <p className="mt-1.5 text-[11px] text-slate-400">
                Released to Buddy only after task completion
              </p>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
                  Total Added / Credited
                </span>
                <ArrowDownLeft className="h-5 w-5 text-emerald-400" />
              </div>
              <p className="mt-3 text-2xl font-bold text-white">
                ₹{loading ? "..." : totalCreditedRupees.toLocaleString("en-IN")}
              </p>
              <p className="mt-1.5 text-[11px] text-slate-400">
                Lifetime wallet top-ups & refunds
              </p>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-purple-300">
                  Total Spent / Withdrawn
                </span>
                <ArrowUpRight className="h-5 w-5 text-purple-400" />
              </div>
              <p className="mt-3 text-2xl font-bold text-white">
                ₹{loading ? "..." : totalDebitedRupees.toLocaleString("en-IN")}
              </p>
              <p className="mt-1.5 text-[11px] text-slate-400">
                Task bookings & bank withdrawals
              </p>
            </div>
          </div>

          {/* Main Grid: Left = Add Money Card, Right = Transaction History */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Add Money to Wallet Card */}
            <div className="lg:col-span-5 rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl h-fit">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
                  <PlusCircle className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Add Money to Wallet</h2>
                  <p className="text-xs text-slate-400">Instant top-up with 0% gateway fee</p>
                </div>
              </div>

              <form onSubmit={handleTopup} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Enter Amount (₹)
                  </label>
                  <div className="relative">
                    <span className=" absolute left-4 top-1/2 -translate-y-1/2 text-base font-bold text-slate-400">
                      ₹
                    </span>
                    <input
                      type="number"
                      min="1"
                      max="100000"
                      value={topupAmount}
                      onChange={(e) => setTopupAmount(e.target.value)}
                      placeholder="500"
                      className="w-full rounded-2xl border border-slate-700 bg-slate-950/90 py-3 pl-9 pr-4 text-lg font-bold text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Quick Amount Pills */}
                <div className="flex flex-wrap gap-2">
                  {QUICK_AMOUNTS.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setTopupAmount(String(amt))}
                      className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                        Number(topupAmount) === amt
                          ? "bg-blue-600 text-white shadow-md shadow-blue-600/25"
                          : "border border-slate-700 bg-slate-800/80 text-slate-300 hover:border-slate-600"
                      }`}
                    >
                      +₹{amt}
                    </button>
                  ))}
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Payment Method
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setTopupMethod("UPI")}
                      className={`flex items-center justify-center gap-2 rounded-2xl border py-2.5 px-3 text-xs font-bold transition ${
                        topupMethod === "UPI"
                          ? "border-blue-500 bg-blue-600 text-white"
                          : "border-slate-700 bg-slate-950/70 text-slate-300 hover:border-slate-600"
                      }`}
                    >
                      <Smartphone className="h-4 w-4" />
                      UPI Instant
                    </button>
                    <button
                      type="button"
                      onClick={() => setTopupMethod("CARD")}
                      className={`flex items-center justify-center gap-2 rounded-2xl border py-2.5 px-3 text-xs font-bold transition ${
                        topupMethod === "CARD"
                          ? "border-blue-500 bg-blue-600 text-white"
                          : "border-slate-700 bg-slate-950/70 text-slate-300 hover:border-slate-600"
                      }`}
                    >
                      <CreditCard className="h-4 w-4" />
                      Card / NetBanking
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={topupLoading}
                  className="w-full rounded-2xl bg-blue-600 hover:bg-blue-500 py-3.5 px-4 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition disabled:opacity-50"
                >
                  {topupLoading
                    ? "Adding Money..."
                    : `Add ₹${Number(topupAmount || 0).toLocaleString("en-IN")} to Wallet`}
                </button>
              </form>

              <div className="mt-5 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-3.5 text-xs text-slate-300 flex items-start gap-2.5">
                <Sparkles className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white">100% Escrow Guarantee:</span> Money in your
                  HireBuddy Wallet can be used to book any Buddy or pay for Marketplace orders, and
                  can be withdrawn back to your UPI/Bank anytime.
                </div>
              </div>
            </div>

            {/* Wallet Transaction Ledger */}
            <div className="lg:col-span-7 rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
                <div>
                  <h2 className="text-base font-bold text-white">Wallet Passbook & Activity</h2>
                  <p className="text-xs text-slate-400">
                    All top-ups, escrow holds, task payments, and withdrawals
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: "ALL", label: "All" },
                    { id: "CREDIT", label: "Added (+)" },
                    { id: "DEBIT", label: "Spent (-)" },
                    { id: "ESCROW", label: "Escrow" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setFilterTab(tab.id)}
                      className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                        filterTab === tab.id
                          ? "bg-blue-600 text-white"
                          : "border border-slate-800 bg-slate-950/60 text-slate-400 hover:text-white"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {loading ? (
                <div className="space-y-3 py-6">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="h-16 rounded-2xl bg-slate-800/50 animate-pulse"
                    />
                  ))}
                </div>
              ) : transactions.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/40 p-10 text-center">
                  <Clock className="mx-auto h-8 w-8 text-slate-500 mb-2" />
                  <p className="text-sm font-semibold text-white">No wallet transactions yet</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Add money to your wallet using the panel on the left to get started.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[540px] overflow-y-auto pr-1">
                  {transactions.map((tx) => {
                    const isCredit = tx.direction === "CREDIT";
                    const amt =
                      tx.amountRupees ??
                      Number((Number(tx.amountPaise || 0) / 100).toFixed(2));
                    return (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-4 hover:border-slate-700 transition"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                              isCredit
                                ? "bg-emerald-500/15 text-emerald-400"
                                : "bg-blue-500/15 text-blue-400"
                            }`}
                          >
                            {isCredit ? (
                              <ArrowDownLeft className="h-5 w-5" />
                            ) : (
                              <ArrowUpRight className="h-5 w-5" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-white truncate">
                              {tx.description || tx.type}
                            </p>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                              <span>
                                {new Date(tx.createdAt).toLocaleString("en-IN", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                              <span>•</span>
                              <span className="rounded-md bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold text-slate-300">
                                {tx.method || "WALLET"}
                              </span>
                              <span
                                className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                                  tx.status === "HELD_IN_ESCROW"
                                    ? "bg-amber-500/20 text-amber-300"
                                    : "bg-emerald-500/20 text-emerald-300"
                                }`}
                              >
                                {tx.status}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <p
                            className={`text-base font-extrabold ${
                              isCredit ? "text-emerald-400" : "text-white"
                            }`}
                          >
                            {isCredit ? "+" : "-"}₹{amt.toLocaleString("en-IN")}
                          </p>
                          {tx.balanceAfterRupees !== null &&
                            tx.balanceAfterRupees !== undefined && (
                              <p className="text-[11px] text-slate-400">
                                Bal: ₹{tx.balanceAfterRupees.toLocaleString("en-IN")}
                              </p>
                            )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Withdraw from Wallet</h3>
              <button
                type="button"
                onClick={() => setShowWithdrawModal(false)}
                className="text-sm text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Available Balance:{" "}
              <span className="font-bold text-white">
                ₹{balanceRupees.toLocaleString("en-IN")}
              </span>
            </p>

            <form onSubmit={handleWithdraw} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Amount to Withdraw (₹)
                </label>
                <input
                  type="number"
                  min="1"
                  max={balanceRupees || 100000}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="Enter amount"
                  required
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm font-bold text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPayoutMethod("UPI")}
                  className={`flex items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-bold ${
                    payoutMethod === "UPI"
                      ? "border-blue-500 bg-blue-600 text-white"
                      : "border-slate-700 bg-slate-950 text-slate-300"
                  }`}
                >
                  <Smartphone className="h-3.5 w-3.5" />
                  UPI ID
                </button>
                <button
                  type="button"
                  onClick={() => setPayoutMethod("BANK")}
                  className={`flex items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-bold ${
                    payoutMethod === "BANK"
                      ? "border-blue-500 bg-blue-600 text-white"
                      : "border-slate-700 bg-slate-950 text-slate-300"
                  }`}
                >
                  <Building2 className="h-3.5 w-3.5" />
                  Bank Transfer
                </button>
              </div>

              {payoutMethod === "UPI" ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    UPI ID
                  </label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="yourname@okaxis"
                    required
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Bank Account Number
                    </label>
                    <input
                      type="text"
                      value={bankAccount}
                      onChange={(e) => setBankAccount(e.target.value)}
                      placeholder="Enter Account Number"
                      required
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      IFSC Code
                    </label>
                    <input
                      type="text"
                      value={ifsc}
                      onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                      placeholder="SBIN0001234"
                      required
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowWithdrawModal(false)}
                  className="rounded-xl border border-slate-700 px-4 py-2.5 text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={withdrawLoading}
                  className="rounded-xl bg-blue-600 hover:bg-blue-500 px-5 py-2.5 text-xs font-bold text-white"
                >
                  {withdrawLoading ? "Processing..." : "Confirm Withdrawal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
