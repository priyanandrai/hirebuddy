import React, { useState, useEffect } from 'react';
import {
  Search,
  RefreshCw,
  Trash2,
  TrendingUp,
  AlertCircle,
  User,
  MapPin,
  Tag,
  Clock,
  Layers,
  Filter,
} from 'lucide-react';
import { adminApi } from '../services/api';
import Badge from '../components/common/Badge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';

export default function SearchLogsPage() {
  const [logs, setLogs] = useState([]);
  const [topQueries, setTopQueries] = useState([]);
  const [zeroResultQueries, setZeroResultQueries] = useState([]);
  const [sectionBreakdown, setSectionBreakdown] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Filters
  const [searchFilter, setSearchFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('ALL');

  const fetchLogs = async (isRefresh = false, customSearch = searchFilter, customSection = sectionFilter) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const params = { limit: 150 };
      if (customSection && customSection !== 'ALL') params.section = customSection;
      if (customSearch && customSearch.trim()) params.search = customSearch.trim();

      const res = await adminApi.getSearchLogs(params);
      setLogs(Array.isArray(res?.logs) ? res.logs : []);
      setTopQueries(Array.isArray(res?.topQueries) ? res.topQueries : []);
      setZeroResultQueries(Array.isArray(res?.zeroResultQueries) ? res.zeroResultQueries : []);
      setSectionBreakdown(Array.isArray(res?.sectionBreakdown) ? res.sectionBreakdown : []);
      setTotal(res?.total || (res?.logs ? res.logs.length : 0));
    } catch (err) {
      console.error('Failed to fetch search logs:', err);
      setError(err.message || 'Could not load user search logs.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogs(false, searchFilter, sectionFilter);
  }, [sectionFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLogs(true, searchFilter, sectionFilter);
  };

  const handleDeleteLog = async (id) => {
    try {
      await adminApi.deleteSearchLog(id);
      setLogs((prev) => prev.filter((item) => item.id !== id));
      setTotal((prev) => Math.max(0, prev - 1));
    } catch (err) {
      alert(err.message || 'Failed to delete search log');
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to clear all recorded user search logs?')) return;
    try {
      await adminApi.clearSearchLogs();
      fetchLogs(true, '', 'ALL');
    } catch (err) {
      alert(err.message || 'Failed to clear search logs');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Search className="w-6 h-6 text-blue-400" />
            User Search Activity & Demand Insights
          </h1>
          <p className="text-sm text-slate-400">
            Track what customers and helpers are searching across HireBuddy in real time.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchLogs(true)}
            disabled={refreshing || loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-800 text-slate-200 hover:bg-slate-700 rounded-xl text-sm font-medium border border-slate-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-blue-400' : ''}`} />
            Refresh
          </button>

          {logs.length > 0 && (
            <button
              onClick={handleClearAll}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-900/50 rounded-xl text-sm font-medium transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Clear Logs
            </button>
          )}
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Searches</p>
          <p className="text-2xl font-bold text-white mt-1">{total}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Top Trending Keyword</p>
          <p className="text-lg font-bold text-blue-400 mt-1 truncate">
            {topQueries[0]?.query ? `"${topQueries[0].query}" (${topQueries[0].count})` : '—'}
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Zero-Result Searches</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">
            {zeroResultQueries.reduce((acc, q) => acc + (q.count || 0), 0)}
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Sections</p>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {sectionBreakdown.length === 0 ? (
              <span className="text-xs text-slate-500">All sections</span>
            ) : (
              sectionBreakdown.slice(0, 3).map((s) => (
                <span
                  key={s.section}
                  className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[11px] font-semibold"
                >
                  {s.section}: {s.count}
                </span>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Top Queries & Zero-Result Insights */}
      {(topQueries.length > 0 || zeroResultQueries.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Top Searched Keywords */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Most Searched Keywords
              </h2>
              <span className="text-xs text-slate-400">Click keyword to filter</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {topQueries.slice(0, 12).map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setSearchFilter(item.query);
                    fetchLogs(true, item.query, sectionFilter);
                  }}
                  className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs transition-colors"
                >
                  <span className="font-semibold text-white">{item.query}</span>
                  <span className="px-1.5 py-0.5 rounded-md bg-blue-500/20 text-blue-400 font-bold text-[10px]">
                    {item.count}x
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Unfulfilled / Zero-Result Queries */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                Zero-Result Searches (Unmet Demand)
              </h2>
              <span className="text-xs text-slate-400">Needs more helpers/categories</span>
            </div>
            {zeroResultQueries.length === 0 ? (
              <p className="text-xs text-slate-400 py-2">
                Great news! All recent user searches returned matching results.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {zeroResultQueries.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSearchFilter(item.query);
                      fetchLogs(true, item.query, sectionFilter);
                    }}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-950/30 hover:bg-amber-900/40 border border-amber-800/40 text-xs transition-colors"
                  >
                    <span className="font-semibold text-amber-300">{item.query}</span>
                    <span className="px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-bold text-[10px]">
                      {item.count}x (0 results)
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter logs by keyword, user name, phone, category, or city..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 overflow-x-auto">
            {['ALL', 'SERVICES', 'HELPERS', 'TASKS', 'MARKETPLACE'].map((sec) => (
              <button
                key={sec}
                type="button"
                onClick={() => setSectionFilter(sec)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  sectionFilter === sec
                    ? 'bg-blue-600 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {sec === 'ALL' ? 'All Sections' : sec}
              </button>
            ))}
          </div>

          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            Filter
          </button>

          {searchFilter && (
            <button
              type="button"
              onClick={() => {
                setSearchFilter('');
                fetchLogs(true, '', sectionFilter);
              }}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium"
            >
              Reset
            </button>
          )}
        </form>
      </div>

      {/* Search Stream Table */}
      {loading ? (
        <div className="p-16 flex justify-center bg-slate-900 border border-slate-800 rounded-2xl">
          <LoadingSpinner text="Loading user search logs..." size="lg" />
        </div>
      ) : error ? (
        <div className="p-8 bg-red-950/20 border border-red-900/40 rounded-2xl text-center">
          <p className="text-red-400 text-sm font-medium">{error}</p>
          <button
            onClick={() => fetchLogs()}
            className="mt-3 px-4 py-1.5 bg-red-900/30 text-red-300 rounded-lg text-xs font-semibold hover:bg-red-900/50"
          >
            Try Again
          </button>
        </div>
      ) : logs.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No search logs recorded yet"
          description="Whenever users search for services, helpers, or tasks in the app, their search queries will appear here automatically."
        />
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/70 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">User</th>
                  <th className="px-4 py-3.5">Searched Keyword</th>
                  <th className="px-4 py-3.5">Category & Location</th>
                  <th className="px-4 py-3.5">Section</th>
                  <th className="px-4 py-3.5">Results Found</th>
                  <th className="px-4 py-3.5">Searched At</th>
                  <th className="px-4 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    {/* User Info */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-blue-400 shrink-0">
                          {(log.userName || log.user?.name || 'G')[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-white text-xs">
                            {log.userName || log.user?.name || 'Guest Visitor'}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {log.userPhone || log.user?.phone || log.userRole || 'Public Web'}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Query */}
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 font-semibold text-white text-xs">
                        <Search className="w-3 h-3 text-blue-400" />
                        {log.query}
                      </span>
                    </td>

                    {/* Category & Location */}
                    <td className="px-4 py-3.5 text-xs">
                      <div className="space-y-1">
                        {log.category ? (
                          <div className="flex items-center gap-1 text-slate-300">
                            <Tag className="w-3 h-3 text-emerald-400" />
                            <span>{log.category}</span>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-[11px]">All categories</span>
                        )}
                        {log.location && (
                          <div className="flex items-center gap-1 text-slate-400 text-[11px]">
                            <MapPin className="w-3 h-3 text-slate-500" />
                            <span>{log.location}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Section */}
                    <td className="px-4 py-3.5">
                      <Badge status={log.section || 'GENERAL'} />
                    </td>

                    {/* Results Count */}
                    <td className="px-4 py-3.5 text-xs">
                      {log.resultsCount === 0 ? (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold text-[11px]">
                          0 results
                        </span>
                      ) : (
                        <span className="text-emerald-400 font-semibold">
                          {log.resultsCount} match{log.resultsCount === 1 ? '' : 'es'}
                        </span>
                      )}
                    </td>

                    {/* Timestamp */}
                    <td className="px-4 py-3.5 text-xs text-slate-400">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>
                          {log.createdAt ? new Date(log.createdAt).toLocaleString() : 'Just now'}
                        </span>
                      </div>
                    </td>

                    {/* Delete Action */}
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => handleDeleteLog(log.id)}
                        className="p-1.5 bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 rounded-lg border border-slate-700 transition-colors"
                        title="Delete log entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-slate-950/40 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Showing {logs.length} search log entries</span>
            <span className="italic text-slate-500">Real-time user search telemetry</span>
          </div>
        </div>
      )}
    </div>
  );
}
