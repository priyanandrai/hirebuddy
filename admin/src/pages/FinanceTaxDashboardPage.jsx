import React, { useEffect, useState, useCallback } from 'react';
import {
  IndianRupee,
  FileSpreadsheet,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Scale,
  Receipt,
  Building2,
  Percent,
  ArrowUpRight,
  ShieldAlert,
  BookOpen,
  Plus,
} from 'lucide-react';
import { adminApi } from '../services/api';

const formatINR = (paise = 0) => {
  const rupees = Number(paise || 0) / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(rupees);
};

export default function FinanceTaxDashboardPage() {
  const [activeTab, setActiveTab] = useState('PAYMENTS');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMessage, setActionMessage] = useState('');

  // Filters
  const [filters, setFilters] = useState({
    status: 'ALL',
    supplyType: 'ALL',
    category: 'ALL',
    payoutStatus: 'ALL',
    fromDate: '',
    toDate: '',
  });

  // Data state
  const [kpisPaise, setKpisPaise] = useState({});
  const [payments, setPayments] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [taxReports, setTaxReports] = useState({
    gstByCategory: [],
    taxTransactions: [],
    tdsWithholdings: [],
    invoices: [],
  });
  const [reconciliationData, setReconciliationData] = useState({
    reconciliations: [],
    chartOfAccounts: [],
    recentJournals: [],
  });
  const [commissionRules, setCommissionRules] = useState([]);
  const [taxRules, setTaxRules] = useState([]);

  // New Commission Rule form
  const [commForm, setCommForm] = useState({
    name: '',
    serviceCategory: '',
    commissionModel: 'PERCENTAGE',
    percentageBps: 1500,
    fixedAmountPaise: 0,
    promoCode: '',
    priority: 25,
  });

  // New Tax Rule form
  const [taxForm, setTaxForm] = useState({
    serviceCategory: '',
    gstClassification: 'ORDINARY_MARKETPLACE',
    sacCode: '9985',
    gstOnServiceRateBps: 1800,
    gstOnCommissionRateBps: 1800,
    isSection95Applicable: false,
    isSection52TcsApplicable: true,
    tcsRateBps: 50,
    tdsRateWithPanBps: 10,
    tdsRateNoPanBps: 500,
    approvalStatus: 'ACTIVE',
    caReviewerName: 'CA R. Sharma (FCA)',
  });

  const loadAllFinanceData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [payRes, payoutRes, taxRes, reconRes, commRes, ruleRes] = await Promise.all([
        adminApi.getAdminPayments({
          status: filters.status,
          supplyType: filters.supplyType,
          category: filters.category,
          fromDate: filters.fromDate,
          toDate: filters.toDate,
        }),
        adminApi.getAdminPayouts({
          status: filters.payoutStatus,
        }),
        adminApi.getAdminTaxReports({
          supplyClassification: filters.supplyType,
        }),
        adminApi.getAdminReconciliation(),
        adminApi.getCommissionRules(),
        adminApi.getTaxRules(),
      ]);

      setKpisPaise(payRes.kpisPaise || {});
      setPayments(payRes.payments || []);
      setPayouts(payoutRes.payouts || []);
      setTaxReports({
        gstByCategory: taxRes.gstByCategory || [],
        taxTransactions: taxRes.taxTransactions || [],
        tdsWithholdings: taxRes.tdsWithholdings || [],
        invoices: taxRes.invoices || [],
      });
      setReconciliationData({
        reconciliations: reconRes.reconciliations || [],
        chartOfAccounts: reconRes.chartOfAccounts || [],
        recentJournals: reconRes.recentJournals || [],
      });
      setCommissionRules(commRes.rules || []);
      setTaxRules(ruleRes.rules || []);
    } catch (err) {
      setError(err.message || 'Failed to load financial & tax data');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadAllFinanceData();
  }, [loadAllFinanceData]);

  const handleApprovePayout = async (payoutId) => {
    setActionMessage('');
    try {
      const res = await adminApi.approveAdminPayout(payoutId);
      if (res.success) {
        setActionMessage(`Payout ${payoutId.slice(0, 8)} settled via Razorpay Route!`);
      } else {
        setActionMessage(`Payout held: ${res.holdReason || res.eligibilityStatus}`);
      }
      await loadAllFinanceData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRunReconciliation = async () => {
    setActionMessage('');
    try {
      const res = await adminApi.getAdminReconciliation({ runNow: 'true' });
      setReconciliationData({
        reconciliations: res.reconciliations || [],
        chartOfAccounts: res.chartOfAccounts || [],
        recentJournals: res.recentJournals || [],
      });
      setActionMessage('Double-entry ledger & gateway reconciliation completed.');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreateCommissionRule = async (e) => {
    e.preventDefault();
    try {
      await adminApi.saveCommissionRule(commForm);
      setActionMessage(`Saved commission rule "${commForm.name}"`);
      setCommForm({
        name: '',
        serviceCategory: '',
        commissionModel: 'PERCENTAGE',
        percentageBps: 1500,
        fixedAmountPaise: 0,
        promoCode: '',
        priority: 25,
      });
      await loadAllFinanceData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreateTaxRule = async (e) => {
    e.preventDefault();
    try {
      await adminApi.saveTaxRule(taxForm);
      setActionMessage(`Saved GST & TDS rule for "${taxForm.serviceCategory}"`);
      await loadAllFinanceData();
    } catch (err) {
      setError(err.message);
    }
  };

  const kpiCards = [
    {
      label: 'Total Service GMV',
      value: formatINR(kpisPaise.totalGmvPaise),
      sub: 'Underlying gross booking value',
      tone: 'text-blue-400',
    },
    {
      label: 'Collected Payments',
      value: formatINR(kpisPaise.totalCollectedPaise),
      sub: 'Customer gross collections',
      tone: 'text-emerald-400',
    },
    {
      label: 'Platform Commission',
      value: formatINR(kpisPaise.totalCommissionPaise),
      sub: 'HireBuddy net marketplace fee',
      tone: 'text-indigo-400',
    },
    {
      label: 'Helper Net Earnings',
      value: formatINR(kpisPaise.totalHelperEarningsPaise),
      sub: 'Payable after comm, TCS & TDS',
      tone: 'text-cyan-400',
    },
    {
      label: 'Pending Route Payouts',
      value: formatINR(kpisPaise.totalPendingPayoutsPaise),
      sub: 'Held until completion & KYC',
      tone: 'text-amber-400',
    },
    {
      label: 'Completed Payouts',
      value: formatINR(kpisPaise.totalCompletedPayoutsPaise),
      sub: 'Settled to helper bank accounts',
      tone: 'text-emerald-400',
    },
    {
      label: 'GST on Services & Comm.',
      value: formatINR(
        (kpisPaise.totalServiceGstPaise || 0) + (kpisPaise.totalCommissionGstPaise || 0)
      ),
      sub: `Svc: ${formatINR(kpisPaise.totalServiceGstPaise)} | Comm: ${formatINR(
        kpisPaise.totalCommissionGstPaise
      )}`,
      tone: 'text-purple-400',
    },
    {
      label: 'Sec 52 GST TCS Liability',
      value: formatINR(kpisPaise.totalTcsCollectedPaise),
      sub: '0.5% CGST+SGST /IGST (Not revenue)',
      tone: 'text-amber-300',
    },
    {
      label: 'Sec 194-O Income-Tax TDS',
      value: formatINR(kpisPaise.totalTdsDeductedPaise),
      sub: 'Withheld for quarterly Form 26Q',
      tone: 'text-rose-400',
    },
    {
      label: 'Gateway Charges (Est.)',
      value: formatINR(kpisPaise.totalGatewayChargesPaise),
      sub: 'Razorpay fee + 18% GST',
      tone: 'text-slate-300',
    },
    {
      label: 'Total Customer Refunds',
      value: formatINR(kpisPaise.totalRefundsPaise),
      sub: 'Processed via Credit Notes',
      tone: 'text-rose-300',
    },
    {
      label: 'Failed / Recon Alerts',
      value: `${kpisPaise.failedTransactionsCount || 0} / ${
        kpisPaise.pendingReconciliationsCount || 0
      }`,
      sub: 'Failed Tx / Recon Discrepancies',
      tone: 'text-amber-400',
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-blue-500/20 px-2.5 py-1 text-xs font-bold text-blue-400">
              FINTECH & GST ENGINE
            </span>
            <span className="rounded-lg bg-emerald-500/20 px-2.5 py-1 text-xs font-bold text-emerald-400">
              INTEGER PAISE LEDGER
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-extrabold text-white">
            Marketplace Payments, Indian GST (Sec 9(5) / Sec 52 TCS), Sec 194-O TDS & Route Payouts
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Double-entry accounting ledger, Razorpay Route hold & settlement, configurable commission rules, and CA-reviewed tax compliance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <a
            href={adminApi.exportCsvUrl('/admin/payments', filters)}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-700 transition"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
            Export Payments CSV
          </a>
          <a
            href={adminApi.exportCsvUrl('/admin/tax-reports', {
              supplyClassification: filters.supplyType,
            })}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-700 transition"
          >
            <FileSpreadsheet className="h-4 w-4 text-purple-400" />
            Export GST/TCS CSV
          </a>
          <button
            onClick={loadAllFinanceData}
            className="flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-500 transition"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Ledger
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-300">
          {error}
        </div>
      )}
      {actionMessage && (
        <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm text-emerald-300">
          {actionMessage}
        </div>
      )}

      {/* KPI Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-sm"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {card.label}
            </p>
            <p className={`mt-2 text-xl font-extrabold ${card.tone}`}>{card.value}</p>
            <p className="mt-1 text-[11px] text-slate-500">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:grid-cols-2 lg:grid-cols-6">
        <div>
          <label className="block text-[11px] font-bold uppercase text-slate-400">
            Payment Status
          </label>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
          >
            <option value="ALL">All Statuses</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="SETTLED">SETTLED</option>
            <option value="INITIATED">INITIATED</option>
            <option value="REFUNDED">REFUNDED</option>
            <option value="PARTIALLY_REFUNDED">PARTIALLY_REFUNDED</option>
            <option value="FAILED">FAILED</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase text-slate-400">
            GST Supply Type
          </label>
          <select
            value={filters.supplyType}
            onChange={(e) => setFilters({ ...filters, supplyType: e.target.value })}
            className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
          >
            <option value="ALL">All Classifications</option>
            <option value="ORDINARY_MARKETPLACE">Ordinary Marketplace (Sec 52)</option>
            <option value="SECTION_9_5">Notified ECO Service (Sec 9(5))</option>
            <option value="PRINCIPAL_PROVIDER">Principal Service Provider</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase text-slate-400">
            Service Category
          </label>
          <select
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
          >
            <option value="ALL">All Categories</option>
            <option value="Home Cleaning">Home Cleaning</option>
            <option value="Plumbing">Plumbing</option>
            <option value="Electrician">Electrician</option>
            <option value="Carpenter">Carpenter</option>
            <option value="Driver">Driver</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase text-slate-400">
            Payout Status
          </label>
          <select
            value={filters.payoutStatus}
            onChange={(e) => setFilters({ ...filters, payoutStatus: e.target.value })}
            className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
          >
            <option value="ALL">All Payouts</option>
            <option value="ON_HOLD">ON_HOLD (Route Hold)</option>
            <option value="SETTLED">SETTLED</option>
            <option value="FAILED">FAILED</option>
            <option value="REVERSED">REVERSED</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase text-slate-400">From Date</label>
          <input
            type="date"
            value={filters.fromDate}
            onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
            className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase text-slate-400">To Date</label>
          <input
            type="date"
            value={filters.toDate}
            onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
            className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
          />
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
        {[
          { id: 'PAYMENTS', label: '1. Customer Payments & Breakdown', icon: IndianRupee },
          { id: 'PAYOUTS', label: '2. Helper Route Payouts', icon: ArrowUpRight },
          { id: 'TAX_REPORTS', label: '3. GST, Sec 52 TCS, Sec 194-O TDS & Invoices', icon: Receipt },
          { id: 'RULES', label: '4. Commission & Tax Engine Config (CA Review)', icon: Percent },
          { id: 'LEDGER', label: '5. Double-Entry Ledger & Reconciliation', icon: Scale },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                  : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: PAYMENTS */}
      {activeTab === 'PAYMENTS' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <h2 className="mb-3 text-base font-bold text-white">
            Marketplace Payment Ledger ({payments.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left text-xs text-slate-300">
              <thead className="border-b border-slate-800 bg-slate-950/60 text-[11px] uppercase text-slate-400">
                <tr>
                  <th className="p-3">Booking / Category</th>
                  <th className="p-3">Customer / Helper</th>
                  <th className="p-3">Supply Classification</th>
                  <th className="p-3">Base Service</th>
                  <th className="p-3">Commission</th>
                  <th className="p-3">Service GST</th>
                  <th className="p-3">Comm GST</th>
                  <th className="p-3">Sec 52 TCS</th>
                  <th className="p-3">Sec 194-O TDS</th>
                  <th className="p-3">Net Helper</th>
                  <th className="p-3">Total Charged</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40">
                    <td className="p-3">
                      <div className="font-bold text-white">{p.task?.title || 'Booking'}</div>
                      <div className="text-[11px] text-slate-400">
                        {p.task?.category || 'General'} • {p.razorpayOrderId}
                      </div>
                    </td>
                    <td className="p-3">
                      <div>C: {p.payer?.name || p.payerId?.slice(0, 8)}</div>
                      <div className="text-slate-400">
                        H: {p.payee?.name || p.payeeId?.slice(0, 8)}
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="rounded-lg bg-slate-800 px-2 py-1 text-[10px] font-bold text-blue-300">
                        {p.supplyType}
                      </span>
                      <div className="mt-1 text-[10px] text-slate-500">
                        POS: {p.placeOfSupplyState} ({p.isInterState ? 'IGST' : 'CGST+SGST'})
                      </div>
                    </td>
                    <td className="p-3 font-semibold">{formatINR(p.baseServicePaise || p.amount)}</td>
                    <td className="p-3 text-indigo-300">{formatINR(p.commissionPaise)}</td>
                    <td className="p-3 text-purple-300">{formatINR(p.gstOnServicePaise)}</td>
                    <td className="p-3 text-purple-300">{formatINR(p.gstOnCommissionPaise)}</td>
                    <td className="p-3 text-amber-300">{formatINR(p.tcsPaise)}</td>
                    <td className="p-3 text-rose-300">{formatINR(p.tdsPaise)}</td>
                    <td className="p-3 font-bold text-cyan-300">
                      {formatINR(p.netHelperEarningsPaise)}
                    </td>
                    <td className="p-3 font-extrabold text-emerald-400">{formatINR(p.amount)}</td>
                    <td className="p-3">
                      <span className="rounded-full bg-blue-500/20 px-2.5 py-1 text-[10px] font-bold text-blue-300">
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {payments.length === 0 && (
                  <tr>
                    <td colSpan={12} className="p-8 text-center text-slate-500">
                      No payment transactions match the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: HELPER PAYOUTS */}
      {activeTab === 'PAYOUTS' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <h2 className="mb-3 text-base font-bold text-white">
            Helper Route Settlements & Eligibility Gate ({payouts.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-left text-xs text-slate-300">
              <thead className="border-b border-slate-800 bg-slate-950/60 text-[11px] uppercase text-slate-400">
                <tr>
                  <th className="p-3">Helper</th>
                  <th className="p-3">Booking</th>
                  <th className="p-3">Gross Service</th>
                  <th className="p-3">Comm + GST</th>
                  <th className="p-3">TCS + TDS</th>
                  <th className="p-3">Recovery Adj.</th>
                  <th className="p-3">Net Payable</th>
                  <th className="p-3">Eligibility & Hold Reason</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {payouts.map((po) => (
                  <tr key={po.id} className="hover:bg-slate-800/40">
                    <td className="p-3">
                      <div className="font-bold text-white">{po.helper?.name || 'Helper'}</div>
                      <div className="text-[10px] text-slate-400">
                        KYC: {po.helper?.idVerificationStatus}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-slate-200">{po.task?.title}</div>
                      <div className="text-[10px] text-slate-400">
                        Task Status: {po.task?.status}
                      </div>
                    </td>
                    <td className="p-3">{formatINR(po.grossServiceValuePaise)}</td>
                    <td className="p-3 text-indigo-300">
                      {formatINR(po.commissionDeductedPaise + po.gstOnCommissionPaise)}
                    </td>
                    <td className="p-3 text-amber-300">
                      {formatINR(po.tcsDeductedPaise + po.tdsDeductedPaise)}
                    </td>
                    <td className="p-3 text-rose-300">{formatINR(po.refundAdjustmentPaise)}</td>
                    <td className="p-3 font-extrabold text-emerald-400">
                      {formatINR(po.netPayoutPaise)}
                    </td>
                    <td className="p-3">
                      <span className="font-bold text-amber-300">{po.eligibilityStatus}</span>
                      {po.holdReason && (
                        <div className="mt-0.5 max-w-xs text-[10px] text-slate-400">
                          {po.holdReason}
                        </div>
                      )}
                    </td>
                    <td className="p-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                          po.status === 'SETTLED'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {po.status}
                      </span>
                    </td>
                    <td className="p-3">
                      {po.status !== 'SETTLED' ? (
                        <button
                          onClick={() => handleApprovePayout(po.id)}
                          className="rounded-xl bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-emerald-500 transition"
                        >
                          Approve & Settle
                        </button>
                      ) : (
                        <span className="text-[11px] text-emerald-400">
                          UTR: {po.utrNumber || 'Settled'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {payouts.length === 0 && (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-slate-500">
                      No helper payouts found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: TAX REPORTS & INVOICES */}
      {activeTab === 'TAX_REPORTS' && (
        <div className="space-y-6">
          {/* GST by Category */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <h3 className="mb-3 text-base font-bold text-white">
              Indian GST Liability Summary by Service Category (GSTR-1 / GSTR-3B / GSTR-8 TCS)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="border-b border-slate-800 bg-slate-950/60 text-[11px] uppercase text-slate-400">
                  <tr>
                    <th className="p-3">Service Category</th>
                    <th className="p-3">Supply Classification</th>
                    <th className="p-3">SAC</th>
                    <th className="p-3">Tx Count</th>
                    <th className="p-3">Taxable Service Value</th>
                    <th className="p-3">Service GST</th>
                    <th className="p-3">Taxable Commission</th>
                    <th className="p-3">Commission GST</th>
                    <th className="p-3">Sec 52 TCS Collected</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {taxReports.gstByCategory.map((row) => (
                    <tr key={row.serviceCategory}>
                      <td className="p-3 font-bold text-white">{row.serviceCategory}</td>
                      <td className="p-3">{row.supplyClassification}</td>
                      <td className="p-3">{row.sacCode || '—'}</td>
                      <td className="p-3">{row.transactionsCount}</td>
                      <td className="p-3">{formatINR(row.taxableServicePaise)}</td>
                      <td className="p-3 text-purple-300">{formatINR(row.serviceGstPaise)}</td>
                      <td className="p-3">{formatINR(row.taxableCommissionPaise)}</td>
                      <td className="p-3 text-indigo-300">{formatINR(row.commissionGstPaise)}</td>
                      <td className="p-3 text-amber-300">{formatINR(row.tcsCollectedPaise)}</td>
                    </tr>
                  ))}
                  {taxReports.gstByCategory.length === 0 && (
                    <tr>
                      <td colSpan={9} className="p-6 text-center text-slate-500">
                        No GST transactions recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 194-O TDS Register */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <h3 className="mb-3 text-base font-bold text-white">
              Section 194-O Income-Tax Withholding Register (Form 26Q / Form 16A)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="border-b border-slate-800 bg-slate-950/60 text-[11px] uppercase text-slate-400">
                  <tr>
                    <th className="p-3">FY / Quarter</th>
                    <th className="p-3">Section</th>
                    <th className="p-3">Helper ID</th>
                    <th className="p-3">PAN Status</th>
                    <th className="p-3">Gross Service Base</th>
                    <th className="p-3">Cumulative FY Gross</th>
                    <th className="p-3">TDS Rate (bps)</th>
                    <th className="p-3">TDS Deducted</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {taxReports.tdsWithholdings.map((w) => (
                    <tr key={w.id}>
                      <td className="p-3 font-bold text-white">
                        {w.financialYear} ({w.quarter})
                      </td>
                      <td className="p-3">{w.section}</td>
                      <td className="p-3">{w.helperId.slice(0, 10)}...</td>
                      <td className="p-3">{w.panStatus}</td>
                      <td className="p-3">{formatINR(w.grossTransactionPaise)}</td>
                      <td className="p-3">{formatINR(w.cumulativeFyGrossPaise)}</td>
                      <td className="p-3">{w.tdsRateBps} bps</td>
                      <td className="p-3 font-bold text-rose-300">
                        {formatINR(w.tdsDeductedPaise)}
                      </td>
                      <td className="p-3">{w.status}</td>
                    </tr>
                  ))}
                  {taxReports.tdsWithholdings.length === 0 && (
                    <tr>
                      <td colSpan={9} className="p-6 text-center text-slate-500">
                        No Section 194-O TDS records yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: COMMISSION & TAX RULES CONFIG */}
      {activeTab === 'RULES' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Commission Rule Config */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <h3 className="text-base font-bold text-white">
              Dynamic Commission Rules ({commissionRules.length})
            </h3>
            <form onSubmit={handleCreateCommissionRule} className="mt-4 grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Rule Name (e.g. Plumbing 12%)"
                value={commForm.name}
                onChange={(e) => setCommForm({ ...commForm, name: e.target.value })}
                required
                className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
              />
              <input
                type="text"
                placeholder="Category (blank = global)"
                value={commForm.serviceCategory}
                onChange={(e) => setCommForm({ ...commForm, serviceCategory: e.target.value })}
                className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
              />
              <select
                value={commForm.commissionModel}
                onChange={(e) => setCommForm({ ...commForm, commissionModel: e.target.value })}
                className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
              >
                <option value="PERCENTAGE">PERCENTAGE (bps)</option>
                <option value="FIXED">FIXED (Paise)</option>
                <option value="HYBRID">HYBRID (% + Fixed)</option>
                <option value="ZERO">ZERO (0% Commission)</option>
              </select>
              <input
                type="number"
                placeholder="Rate in bps (1500 = 15%)"
                value={commForm.percentageBps}
                onChange={(e) =>
                  setCommForm({ ...commForm, percentageBps: Number(e.target.value) })
                }
                className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
              />
              <button
                type="submit"
                className="col-span-2 rounded-xl bg-blue-600 py-2 text-xs font-bold text-white hover:bg-blue-500"
              >
                Save Dynamic Commission Rule
              </button>
            </form>

            <div className="mt-4 space-y-2">
              {commissionRules.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-xs"
                >
                  <div>
                    <div className="font-bold text-white">{r.name}</div>
                    <div className="text-[11px] text-slate-400">
                      Category: {r.serviceCategory || 'ALL'} • Model: {r.commissionModel}
                    </div>
                  </div>
                  <div className="text-right font-bold text-indigo-400">
                    {(r.percentageBps / 100).toFixed(2)}% + {formatINR(r.fixedAmountPaise)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* GST & TDS Rule Config with CA Approval */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <h3 className="text-base font-bold text-white">
              Configurable Indian GST & Sec 194-O TDS Rules ({taxRules.length})
            </h3>
            <form onSubmit={handleCreateTaxRule} className="mt-4 grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Service Category (e.g. Home Cleaning)"
                value={taxForm.serviceCategory}
                onChange={(e) => setTaxForm({ ...taxForm, serviceCategory: e.target.value })}
                required
                className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
              />
              <select
                value={taxForm.gstClassification}
                onChange={(e) => {
                  const val = e.target.value;
                  setTaxForm({
                    ...taxForm,
                    gstClassification: val,
                    isSection95Applicable: val === 'SECTION_9_5',
                    isSection52TcsApplicable: val === 'ORDINARY_MARKETPLACE',
                  });
                }}
                className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
              >
                <option value="ORDINARY_MARKETPLACE">Ordinary Marketplace (Sec 52)</option>
                <option value="SECTION_9_5">Notified Service u/s 9(5)</option>
                <option value="PRINCIPAL_PROVIDER">HireBuddy as Principal</option>
              </select>
              <input
                type="text"
                placeholder="SAC Code (CA Verified)"
                value={taxForm.sacCode}
                onChange={(e) => setTaxForm({ ...taxForm, sacCode: e.target.value })}
                className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
              />
              <input
                type="text"
                placeholder="CA Reviewer Name"
                value={taxForm.caReviewerName}
                onChange={(e) => setTaxForm({ ...taxForm, caReviewerName: e.target.value })}
                className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
              />
              <button
                type="submit"
                className="col-span-2 rounded-xl bg-purple-600 py-2 text-xs font-bold text-white hover:bg-purple-500"
              >
                Save CA-Reviewed Tax Rule
              </button>
            </form>

            <div className="mt-4 space-y-2">
              {taxRules.map((tr) => (
                <div
                  key={tr.id}
                  className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-xs"
                >
                  <div>
                    <div className="font-bold text-white">{tr.serviceCategory}</div>
                    <div className="text-[11px] text-slate-400">
                      {tr.gstClassification} • Sec 9(5): {tr.isSection95Applicable ? 'YES' : 'NO'} •
                      Sec 52 TCS: {tr.isSection52TcsApplicable ? 'YES' : 'NO'}
                    </div>
                  </div>
                  <span className="rounded-lg bg-emerald-500/20 px-2.5 py-1 text-[10px] font-bold text-emerald-300">
                    {tr.approvalStatus}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: DOUBLE-ENTRY LEDGER & RECONCILIATION */}
      {activeTab === 'LEDGER' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <div>
              <h3 className="text-base font-bold text-white">
                Gateway vs Double-Entry Ledger vs Route Payout Reconciliation
              </h3>
              <p className="text-xs text-slate-400">
                Verifies that every Razorpay order/payment matches Ledger Journals, Tax Liabilities, and Helper Payouts.
              </p>
            </div>
            <button
              onClick={handleRunReconciliation}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500"
            >
              Run Automated Reconciliation Now
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {reconciliationData.chartOfAccounts.map((acc) => (
              <div
                key={acc.code}
                className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4"
              >
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-mono font-bold text-blue-400">#{acc.code}</span>
                  <span>{acc.accountType}</span>
                </div>
                <div className="mt-1 font-bold text-white">{acc.name}</div>
                <div className="mt-2 text-lg font-extrabold text-emerald-400">
                  {formatINR(acc.balancePaise)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
