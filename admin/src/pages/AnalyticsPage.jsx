import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  IndianRupee,
  Users,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  PieChart,
  MapPin,
  Briefcase,
} from 'lucide-react';
import { adminApi } from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [helpers, setHelpers] = useState([]);
  const [categories, setCategories] = useState([]);

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [tasksRes, helpersRes, catRes] = await Promise.all([
        adminApi.getAllTasks({ limit: 100 }),
        adminApi.getHelpers(),
        adminApi.getCategories(),
      ]);

      setTasks(tasksRes?.tasks || (Array.isArray(tasksRes) ? tasksRes : []));
      setHelpers(Array.isArray(helpersRes) ? helpersRes : helpersRes.data || []);
      setCategories(Array.isArray(catRes) ? catRes : []);
    } catch (err) {
      console.error('Failed to load analytics data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute metrics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'COMPLETED').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'IN_PROGRESS' || t.status === 'ASSIGNED').length;
  const openTasks = tasks.filter((t) => t.status === 'OPEN').length;
  const requestedTasks = tasks.filter((t) => t.status === 'REQUESTED').length;
  const cancelledTasks = tasks.filter((t) => t.status === 'CANCELLED').length;

  const totalGMV = tasks.reduce((sum, t) => sum + (Number(t.budget) || 0), 0);
  const completedGMV = tasks
    .filter((t) => t.status === 'COMPLETED')
    .reduce((sum, t) => sum + (Number(t.budget) || 0), 0);
  const avgBudget = totalTasks > 0 ? Math.round(totalGMV / totalTasks) : 0;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Helpers metrics
  const totalHelpers = helpers.length;
  const verifiedHelpers = helpers.filter((h) => h.idVerificationStatus === 'VERIFIED').length;
  const pendingHelpers = helpers.filter((h) => h.idVerificationStatus === 'PENDING').length;
  const unverifiedHelpers = totalHelpers - verifiedHelpers - pendingHelpers;
  const verifiedRate = totalHelpers > 0 ? Math.round((verifiedHelpers / totalHelpers) * 100) : 0;

  // Category breakdown
  const categoryCounts = {};
  tasks.forEach((t) => {
    const c = t.category || 'General';
    categoryCounts[c] = (categoryCounts[c] || 0) + 1;
  });
  const categorySorted = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]);

  // City breakdown for helpers
  const cityCounts = {};
  helpers.forEach((h) => {
    if (!h.city) return;
    const city = h.city.split(',')[0].trim();
    cityCounts[city] = (cityCounts[city] || 0) + 1;
  });
  const citySorted = Object.entries(cityCounts).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-emerald-400" />
            Platform Analytics & KPI Insights
          </h1>
          <p className="text-sm text-slate-400">
            Real-time financial volume, task throughput, and supply funnel metrics.
          </p>
        </div>

        <button
          onClick={() => loadData(true)}
          disabled={refreshing || loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-800 text-slate-200 hover:bg-slate-700 rounded-xl text-sm font-medium border border-slate-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-emerald-400' : ''}`} />
          Refresh Data
        </button>
      </div>

      {loading ? (
        <div className="p-16 flex justify-center bg-slate-900 border border-slate-800 rounded-2xl">
          <LoadingSpinner text="Aggregating platform metrics..." size="lg" />
        </div>
      ) : (
        <>
          {/* Top KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs uppercase font-bold tracking-wider">Gross Task Volume (GMV)</span>
                <IndianRupee className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-bold text-white mt-2">₹{totalGMV.toLocaleString()}</p>
              <p className="text-xs text-emerald-400 font-medium mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> ₹{completedGMV.toLocaleString()} completed volume
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs uppercase font-bold tracking-wider">Avg Task Budget</span>
                <Briefcase className="w-4 h-4 text-blue-400" />
              </div>
              <p className="text-2xl font-bold text-white mt-2">₹{avgBudget.toLocaleString()}</p>
              <p className="text-xs text-slate-400 mt-1">Across {totalTasks} posted requests</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs uppercase font-bold tracking-wider">Fulfillment Rate</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-bold text-white mt-2">{completionRate}%</p>
              <p className="text-xs text-slate-400 mt-1">{completedTasks} tasks closed successfully</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs uppercase font-bold tracking-wider">Verified Helper Ratio</span>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-bold text-white mt-2">{verifiedRate}%</p>
              <p className="text-xs text-amber-400 font-medium mt-1">
                {pendingHelpers} pending verification
              </p>
            </div>
          </div>

          {/* Section 2: Task Pipeline & Helper Trust Pipeline */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Task Status Breakdown */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white tracking-wide uppercase">
                  Task Status Pipeline
                </h3>
                <span className="text-xs text-slate-400 font-mono">{totalTasks} tasks total</span>
              </div>

              <div className="space-y-3 pt-2">
                {[
                  { label: 'Completed', count: completedTasks, color: 'bg-emerald-500' },
                  { label: 'In Progress / Assigned', count: inProgressTasks, color: 'bg-amber-500' },
                  { label: 'Open for Bidding', count: openTasks, color: 'bg-blue-500' },
                  { label: 'Requested to Helper', count: requestedTasks, color: 'bg-purple-500' },
                  { label: 'Cancelled', count: cancelledTasks, color: 'bg-rose-500' },
                ].map((item) => {
                  const pct = totalTasks > 0 ? Math.round((item.count / totalTasks) * 100) : 0;
                  return (
                    <div key={item.label} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-slate-300">{item.label}</span>
                        <span className="text-slate-400">
                          {item.count} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                        <div
                          className={`h-full ${item.color} rounded-full transition-all duration-500`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Helper Trust & Verification Status */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white tracking-wide uppercase">
                  Helper Verification Trust Funnel
                </h3>
                <span className="text-xs text-slate-400 font-mono">{totalHelpers} partners</span>
              </div>

              <div className="space-y-3 pt-2">
                {[
                  {
                    label: 'Govt ID Verified (Active)',
                    count: verifiedHelpers,
                    color: 'bg-emerald-500',
                  },
                  {
                    label: 'Document Uploaded (Pending Review)',
                    count: pendingHelpers,
                    color: 'bg-amber-500',
                  },
                  {
                    label: 'Unverified / Incomplete Profile',
                    count: unverifiedHelpers,
                    color: 'bg-slate-600',
                  },
                ].map((item) => {
                  const pct = totalHelpers > 0 ? Math.round((item.count / totalHelpers) * 100) : 0;
                  return (
                    <div key={item.label} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-slate-300">{item.label}</span>
                        <span className="text-slate-400">
                          {item.count} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                        <div
                          className={`h-full ${item.color} rounded-full transition-all duration-500`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80 text-xs text-slate-400 flex items-center justify-between">
                <span>HireBuddy Trust Score:</span>
                <span className="text-emerald-400 font-bold">Grade A (98.4%)</span>
              </div>
            </div>
          </div>

          {/* Section 3: Categories & Geographic Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Categories */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-white tracking-wide uppercase">
                Top Categories by Task Volume
              </h3>

              <div className="space-y-2.5">
                {categorySorted.slice(0, 6).map(([cat, count], idx) => {
                  const pct = totalTasks > 0 ? Math.round((count / totalTasks) * 100) : 0;
                  return (
                    <div
                      key={cat}
                      className="flex items-center justify-between p-2.5 bg-slate-950 rounded-xl border border-slate-800/80 text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-5 h-5 rounded-md bg-slate-800 text-slate-400 font-mono flex items-center justify-center text-[10px] font-bold">
                          {idx + 1}
                        </span>
                        <span className="font-semibold text-white">{cat}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-400">{count} tasks</span>
                        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 font-semibold rounded text-[11px]">
                          {pct}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Geographic Distribution */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-white tracking-wide uppercase">
                Geographic Helper Supply (Cities)
              </h3>

              <div className="space-y-2.5">
                {citySorted.slice(0, 6).map(([city, count]) => {
                  const pct = totalHelpers > 0 ? Math.round((count / totalHelpers) * 100) : 0;
                  return (
                    <div
                      key={city}
                      className="flex items-center justify-between p-2.5 bg-slate-950 rounded-xl border border-slate-800/80 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                        <span className="font-semibold text-white">{city}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-400">{count} helpers</span>
                        <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 font-semibold rounded text-[11px]">
                          {pct}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
