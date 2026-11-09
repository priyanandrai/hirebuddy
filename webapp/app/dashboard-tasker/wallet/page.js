"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  getWallet,
  topupWallet,
  withdrawWallet,
  activateSubscription,
  getHelperEarningsLedger,
  requestHelperPayout,
  saveHelperTaxProfile,
  saveHelperBankAccount,
} from "@/app/components/services/payment.service";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
  Clock,
  Smartphone,
  Building2,
  PlusCircle,
  ArrowLeft,
  Zap,
} from "lucide-react";

const QUICK_TOPUP = [50, 100, 250, 500];

export default function BuddyWalletPage() {
  const [walletData, setWalletData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Instant Withdraw State
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [payoutMethod, setPayoutMethod] = useState("UPI");
  const [upiId, setUpiId] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  // Add Money Modal State
  const [showTopupModal, setShowTopupModal] = useState(false);
  const [topupAmount, setTopupAmount] = useState("100");
  const [topupLoading, setTopupLoading] = useState(false);

  // Active Pass State
  const [activatingPlan, setActivatingPlan] = useState(null);

  // Marketplace Route Earnings, GST TCS, Sec 194-O TDS & KYC Tax Profile State
  const [earningsLedger, setEarningsLedger] = useState(null);
  const [panForm, setPanForm] = useState({
    panNumber: "",
    isGstRegistered: false,
    gstin: "",
    stateCode: "UP",
  });
  const [routeBankForm, setRouteBankForm] = useState({
    beneficiaryName: "",
    accountNumber: "",
    ifscCode: "",
    bankName: "",
  });

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
      const [res, ledgerRes] = await Promise.all([
        getWallet(),
        getHelperEarningsLedger().catch(() => null),
      ]);
      setWalletData(res);
      if (ledgerRes) {
        setEarningsLedger(ledgerRes);
      }
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
      console.error("Failed to fetch Buddy wallet:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, []);

  const handleWithdraw = async (e) => {
    e.preventDefault();
    const num = Number(withdrawAmount);
    if (!num || num < 1) {
      showToast("Please enter a valid withdrawal amount (minimum ₹1)", "error");
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
      showToast(res?.message || `₹${num} transferred to your ${payoutMethod} account!`);
      setWithdrawAmount("");
      await fetchWallet(true);
    } catch (error) {
      showToast(error?.message || "Withdrawal failed", "error");
    } finally {
      setWithdrawLoading(false);
    }
  };

  const handleTopup = async (e) => {
    e.preventDefault();
    const num = Number(topupAmount);
    if (!num || num < 1) {
      showToast("Please enter a valid amount", "error");
      return;
    }
    setTopupLoading(true);
    try {
      const res = await topupWallet({
        amountRupees: num,
        method: "UPI",
      });
      showToast(res?.message || `₹${num} added to your Buddy Wallet!`);
      setShowTopupModal(false);
      await fetchWallet(true);
    } catch (error) {
      showToast(error?.message || "Top-up failed", "error");
    } finally {
      setTopupLoading(false);
    }
  };

  const handleActivatePass = async (planType, method = "WALLET") => {
    setActivatingPlan(`${planType}_${method}`);
    try {
      await activateSubscription(planType, method);
      showToast(
        `${planType === "DAILY" ? "Daily (₹5)" : "Monthly (₹99)"} Buddy Pass activated!`
      );
      await fetchWallet(true);
    } catch (error) {
      showToast(error?.message || "Failed to activate pass", "error");
    } finally {
      setActivatingPlan(null);
    }
  };

  const transactions = useMemo(() => {
    const list = walletData?.transactions || [];
    if (filterTab === "ALL") return list;
    if (filterTab === "CREDIT") return list.filter((t) => t.direction === "CREDIT");
    if (filterTab === "DEBIT") return list.filter((t) => t.direction === "DEBIT");
    return list;
  }, [walletData, filterTab]);

  const balanceRupees = walletData?.balanceRupees ?? 0;
  const escrowHeldRupees = walletData?.escrowHeldRupees ?? 0;
  const totalCreditedRupees = walletData?.totalCreditedRupees ?? 0;
  const totalDebitedRupees = walletData?.totalDebitedRupees ?? 0;
  const isSubActive = walletData?.user?.isSubscriptionActive;
  const subUntil = walletData?.user?.subscriptionActiveUntil;

  return (
    <main className="min-h-screen bg-slate-950 px-4 sm:px-6 py-8 text-slate-100">
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

      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Link
              href="/dashboard-tasker"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition mb-2"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Helper Dashboard
            </Link>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/30">
                <Wallet className="h-5 w-5" />
              </span>
              My Buddy Wallet & Instant Payouts
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-400">
              100% of your task earnings are credited here with 0% commission. Withdraw to UPI or Bank anytime.
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
              onClick={() => setShowTopupModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-2.5 text-xs font-bold text-white transition shadow-lg shadow-blue-600/20"
            >
              <PlusCircle className="h-4 w-4" />
              Add Money
            </button>
          </div>
        </div>

        {/* 4 Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-600/20 via-slate-900 to-slate-900 p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
                Withdrawable Balance
              </span>
              <Wallet className="h-5 w-5 text-emerald-400" />
            </div>
            <p className="mt-3 text-3xl font-extrabold text-white">
              ₹{loading ? "..." : balanceRupees.toLocaleString("en-IN")}
            </p>
            <p className="mt-1.5 text-[11px] text-slate-400">
              100% payout • Instant UPI & Bank transfer
            </p>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-300">
                Secured in Escrow
              </span>
              <ShieldCheck className="h-5 w-5 text-amber-400" />
            </div>
            <p className="mt-3 text-2xl font-bold text-white">
              ₹{loading ? "..." : escrowHeldRupees.toLocaleString("en-IN")}
            </p>
            <p className="mt-1.5 text-[11px] text-slate-400">
              Auto-credited on task completion
            </p>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-300">
                Total Credited
              </span>
              <ArrowDownLeft className="h-5 w-5 text-blue-400" />
            </div>
            <p className="mt-3 text-2xl font-bold text-white">
              ₹{loading ? "..." : totalCreditedRupees.toLocaleString("en-IN")}
            </p>
            <p className="mt-1.5 text-[11px] text-slate-400">
              Lifetime task payouts & top-ups
            </p>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-purple-300">
                Total Withdrawn
              </span>
              <ArrowUpRight className="h-5 w-5 text-purple-400" />
            </div>
            <p className="mt-3 text-2xl font-bold text-white">
              ₹{loading ? "..." : totalDebitedRupees.toLocaleString("en-IN")}
            </p>
            <p className="mt-1.5 text-[11px] text-slate-400">
              Transferred to UPI / Bank & passes
            </p>
          </div>
        </div>

        {/* Buddy Active Pass Banner */}
        <div className="mb-8 rounded-3xl border border-emerald-500/30 bg-slate-900/90 p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white">
                  Buddy Active Pass (0% Commission Model)
                </h2>
                {isSubActive ? (
                  <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-0.5 text-xs font-bold text-emerald-300">
                    Active until {new Date(subUntil).toLocaleDateString("en-IN")}
                  </span>
                ) : (
                  <span className="rounded-full bg-amber-500/20 border border-amber-500/40 px-2.5 py-0.5 text-xs font-bold text-amber-300">
                    Pass Inactive
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-slate-400">
                Pay ₹5/day or ₹99/month directly from your Buddy Wallet or Online to keep your account active and keep 100% of task earnings.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              disabled={activatingPlan !== null}
              onClick={() =>
                handleActivatePass("DAILY", balanceRupees >= 5 ? "WALLET" : "ONLINE")
              }
              className="rounded-xl border border-emerald-500/40 bg-emerald-500/15 hover:bg-emerald-500/25 px-4 py-2 text-xs font-bold text-emerald-300 transition"
            >
              {activatingPlan?.startsWith("DAILY")
                ? "Activating..."
                : `Activate ₹5/Day (${balanceRupees >= 5 ? "Wallet" : "Online"})`}
            </button>
            <button
              type="button"
              disabled={activatingPlan !== null}
              onClick={() =>
                handleActivatePass("MONTHLY", balanceRupees >= 99 ? "WALLET" : "ONLINE")
              }
              className="rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-2 text-xs font-bold text-white transition"
            >
              {activatingPlan?.startsWith("MONTHLY")
                ? "Activating..."
                : `Activate ₹99/Month (${balanceRupees >= 99 ? "Wallet" : "Online"})`}
            </button>
          </div>
        </div>

        {/* Main Grid: Left = Instant Withdraw to UPI/Bank, Right = Ledger */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Instant Withdraw Card */}
          <div className="lg:col-span-5 rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl h-fit">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
                <ArrowUpRight className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">
                  Instant Payout to UPI / Bank
                </h2>
                <p className="text-xs text-slate-400">
                  0% payout fee • Instant transfer
                </p>
              </div>
            </div>

            <form onSubmit={handleWithdraw} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Withdrawal Amount (₹)
                  </label>
                  <button
                    type="button"
                    onClick={() => setWithdrawAmount(String(balanceRupees || 0))}
                    className="text-[11px] font-bold text-emerald-400 hover:underline"
                  >
                    Withdraw Full (₹{balanceRupees})
                  </button>
                </div>
                <input
                  type="number"
                  min="1"
                  max={balanceRupees || 100000}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="Enter amount in ₹"
                  required
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-base font-bold text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setPayoutMethod("UPI")}
                  className={`flex items-center justify-center gap-2 rounded-2xl border py-2.5 text-xs font-bold transition ${
                    payoutMethod === "UPI"
                      ? "border-blue-500 bg-blue-600 text-white"
                      : "border-slate-700 bg-slate-950 text-slate-300"
                  }`}
                >
                  <Smartphone className="h-4 w-4" />
                  UPI ID
                </button>
                <button
                  type="button"
                  onClick={() => setPayoutMethod("BANK")}
                  className={`flex items-center justify-center gap-2 rounded-2xl border py-2.5 text-xs font-bold transition ${
                    payoutMethod === "BANK"
                      ? "border-blue-500 bg-blue-600 text-white"
                      : "border-slate-700 bg-slate-950 text-slate-300"
                  }`}
                >
                  <Building2 className="h-4 w-4" />
                  Bank A/C
                </button>
              </div>

              {payoutMethod === "UPI" ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Your UPI ID
                  </label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="e.g. mobile@ybl or name@okaxis"
                    required
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none"
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
                      placeholder="Enter Bank Account Number"
                      required
                      className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none"
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
                      placeholder="e.g. SBIN0001234"
                      required
                      className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={withdrawLoading || balanceRupees <= 0}
                className="w-full rounded-2xl bg-emerald-600 hover:bg-emerald-500 py-3.5 px-4 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 transition disabled:opacity-50"
              >
                {withdrawLoading
                  ? "Processing Payout..."
                  : `Withdraw ₹${Number(withdrawAmount || 0).toLocaleString("en-IN")} Now`}
              </button>
            </form>
          </div>

          {/* Buddy Wallet Ledger */}
          <div className="lg:col-span-7 rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
              <div>
                <h2 className="text-base font-bold text-white">
                  Buddy Earnings & Payout Ledger
                </h2>
                <p className="text-xs text-slate-400">
                  Complete record of 100% task payouts, withdrawals, and pass activations
                </p>
              </div>

              <div className="flex gap-1.5">
                {[
                  { id: "ALL", label: "All" },
                  { id: "CREDIT", label: "Earnings (+)" },
                  { id: "DEBIT", label: "Payouts (-)" },
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
                <p className="text-sm font-semibold text-white">
                  No wallet transactions yet
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Complete tasks to receive 100% of customer payments directly in your Buddy Wallet.
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
                      className="flex items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-4"
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

      {/* Marketplace Route Settlement, GST TCS & Sec 194-O TDS Accounting Ledger */}
      <div className="mx-auto mt-8 max-w-6xl space-y-6">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="rounded-full bg-indigo-500/20 px-3 py-1 text-[11px] font-bold text-indigo-300">
                RAZORPAY ROUTE & INDIAN TAX COMPLIANCE LEDGER
              </span>
              <h2 className="mt-2 text-lg font-extrabold text-white">
                Marketplace Earnings, Commission, GST TCS & Section 194-O TDS Statement
              </h2>
              <p className="text-xs text-slate-400">
                Transparent breakdown of gross booking earnings, platform commission, Section 52 GST TCS, Section 194-O TDS, and Route settlement status.
              </p>
            </div>
            <button
              type="button"
              onClick={async () => {
                try {
                  const r = await requestHelperPayout();
                  showToast(
                    r?.settledCount > 0
                      ? `Settled ${r.settledCount} eligible booking payout(s)!`
                      : "All eligible completed bookings are already settled or awaiting completion."
                  );
                  await fetchWallet(true);
                } catch (err) {
                  showToast(err?.message || "Failed to request Route settlement", "error");
                }
              }}
              className="rounded-2xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 transition"
            >
              Settle All Eligible Route Payouts
            </button>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              {
                label: "Gross Service Earnings",
                val: earningsLedger?.summaryRupees?.totalEarningsRupees ?? 0,
              },
              {
                label: "Pending Route Hold",
                val: earningsLedger?.summaryRupees?.pendingEarningsRupees ?? 0,
              },
              {
                label: "Available for Payout",
                val: earningsLedger?.summaryRupees?.availableBalanceRupees ?? 0,
              },
              {
                label: "Settled to Bank",
                val: earningsLedger?.summaryRupees?.paidAmountRupees ?? 0,
              },
              {
                label: "Commission Deducted",
                val: earningsLedger?.summaryRupees?.commissionDeductedRupees ?? 0,
              },
              {
                label: "Sec 52 GST TCS",
                val: earningsLedger?.summaryRupees?.gstTcsDeductedRupees ?? 0,
              },
              {
                label: "Sec 194-O Income-Tax TDS",
                val: earningsLedger?.summaryRupees?.tdsDeductedRupees ?? 0,
              },
              {
                label: "Refund Adjustments",
                val: earningsLedger?.summaryRupees?.refundAdjustmentsRupees ?? 0,
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3.5"
              >
                <p className="text-[11px] font-semibold text-slate-400">{item.label}</p>
                <p className="mt-1 text-base font-extrabold text-white">
                  ₹{Number(item.val || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </p>
              </div>
            ))}
          </div>

          {/* Helper PAN / GSTIN & Route Bank Account Verification */}
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  await saveHelperTaxProfile(panForm);
                  showToast("PAN & GST Tax Profile verified and encrypted!");
                  await fetchWallet(true);
                } catch (err) {
                  showToast(err?.message || "Failed to save tax profile", "error");
                }
              }}
              className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">
                  1. PAN & GST Tax Profile (Sec 194-O / Sec 52)
                </h3>
                <span className="rounded-md bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-300">
                  PAN: {earningsLedger?.helper?.panMasked || "Not Linked (5% TDS u/s 206AA)"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <input
                  type="text"
                  placeholder="PAN (e.g. ABCDE1234F)"
                  value={panForm.panNumber}
                  onChange={(e) =>
                    setPanForm({ ...panForm, panNumber: e.target.value.toUpperCase() })
                  }
                  required
                  className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white"
                />
                <input
                  type="text"
                  placeholder="State Code (e.g. UP, DL, MH)"
                  value={panForm.stateCode}
                  onChange={(e) =>
                    setPanForm({ ...panForm, stateCode: e.target.value.toUpperCase() })
                  }
                  className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white"
                />
                <input
                  type="text"
                  placeholder="GSTIN (Optional if GST Registered)"
                  value={panForm.gstin}
                  onChange={(e) =>
                    setPanForm({
                      ...panForm,
                      gstin: e.target.value.toUpperCase(),
                      isGstRegistered: Boolean(e.target.value),
                    })
                  }
                  className="col-span-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-xl bg-blue-600 py-2 text-xs font-bold text-white hover:bg-blue-500"
              >
                Verify & Save PAN / GSTIN
              </button>
            </form>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  await saveHelperBankAccount(routeBankForm);
                  showToast("Primary Route Bank Account encrypted and linked!");
                  setRouteBankForm({
                    beneficiaryName: "",
                    accountNumber: "",
                    ifscCode: "",
                    bankName: "",
                  });
                  await fetchWallet(true);
                } catch (err) {
                  showToast(err?.message || "Failed to link bank account", "error");
                }
              }}
              className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">
                  2. Linked Bank Account (Razorpay Route)
                </h3>
                <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                  {earningsLedger?.helper?.primaryBankAccount
                    ? `${earningsLedger.helper.primaryBankAccount.accountNumberMasked} (${earningsLedger.helper.primaryBankAccount.ifscCode})`
                    : "No Verified Bank"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <input
                  type="text"
                  placeholder="Account Holder Name"
                  value={routeBankForm.beneficiaryName}
                  onChange={(e) =>
                    setRouteBankForm({ ...routeBankForm, beneficiaryName: e.target.value })
                  }
                  required
                  className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white"
                />
                <input
                  type="text"
                  placeholder="IFSC Code (e.g. SBIN0001234)"
                  value={routeBankForm.ifscCode}
                  onChange={(e) =>
                    setRouteBankForm({
                      ...routeBankForm,
                      ifscCode: e.target.value.toUpperCase(),
                    })
                  }
                  required
                  className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white"
                />
                <input
                  type="text"
                  placeholder="Bank Account Number (Encrypted AES-256)"
                  value={routeBankForm.accountNumber}
                  onChange={(e) =>
                    setRouteBankForm({ ...routeBankForm, accountNumber: e.target.value })
                  }
                  required
                  className="col-span-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-xl bg-indigo-600 py-2 text-xs font-bold text-white hover:bg-indigo-500"
              >
                Save Verified Route Bank Account
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Add Money Modal */}
      {showTopupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Add Money to Buddy Wallet</h3>
              <button
                type="button"
                onClick={() => setShowTopupModal(false)}
                className="text-sm text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleTopup} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  min="1"
                  value={topupAmount}
                  onChange={(e) => setTopupAmount(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-base font-bold text-white"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {QUICK_TOPUP.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setTopupAmount(String(amt))}
                    className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-200"
                  >
                    +₹{amt}
                  </button>
                ))}
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTopupModal(false)}
                  className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={topupLoading}
                  className="rounded-xl bg-blue-600 hover:bg-blue-500 px-5 py-2 text-xs font-bold text-white"
                >
                  {topupLoading ? "Adding..." : `Add ₹${topupAmount}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
