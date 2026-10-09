import React, { useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { 
  Users, 
  Wrench, 
  ShieldCheck, 
  CheckSquare, 
  IndianRupee, 
  ArrowUpRight, 
  AlertTriangle, 
  Sparkles,
  Clock,
  ArrowRight
} from 'lucide-react';
import StatCard from '../components/common/StatCard';
import Badge from '../components/common/Badge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { adminApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
  const { adminToken } = useAuth();
  const context = useOutletContext();
  const refreshTrigger = context?.refreshTrigger || 0;

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalHelpers: 0,
    totalTasks: 0,
    pendingVerifications: 0,
    gmv: 0,
  });
  const [recentTasks, setRecentTasks] = useState([]);
  const [pendingIds, setPendingIds] = useState([]);

  useEffect(() => {
    let isMounted = true;
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [helpersRes, tasksRes, pendingRes, usersRes] = await Promise.allSettled([
          adminApi.getHelpers(),
          adminApi.getAllTasks(),
          adminApi.getPendingIdSubmissions(adminToken),
          adminApi.getUsers({ limit: 1 }),
        ]);

        const helpersList = helpersRes.status === 'fulfilled' ? (helpersRes.value?.data || helpersRes.value || []) : [];
        const tasksList = tasksRes.status === 'fulfilled' ? (tasksRes.value?.tasks || tasksRes.value?.data || []) : [];
        const pendingList = pendingRes.status === 'fulfilled' ? (pendingRes.value?.data || []) : [];
        const totalUsers = usersRes.status === 'fulfilled' ? (usersRes.value?.total || usersRes.value?.users?.length || 0) : 0;

        if (isMounted) {
          const totalBudget = tasksList.reduce((acc, t) => acc + (Number(t.budget) || 0), 0);
          setStats({
            totalUsers,
            totalHelpers: helpersList.length,
            totalTasks: tasksList.length,
            pendingVerifications: pendingList.length,
            gmv: totalBudget,
          });
          setRecentTasks(tasksList.slice(0, 6));
          setPendingIds(pendingList.slice(0, 4));
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDashboardData();
    return () => {
      isMounted = false;
    };
  }, [adminToken, refreshTrigger]);

  if (loading) {
    return <LoadingSpinner text="Aggregating platform metrics..." />;
  }

  return (
    <div className="space-y-8">
      {/* Pending Verifications Alert Banner if any */}
      {stats.pendingVerifications > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-3xl border border-amber-500/40 bg-gradient-to-r from-amber-500/15 via-amber-600/10 to-slate-900/80 p-6 shadow-xl shadow-amber-950/20">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-300">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {stats.pendingVerifications} Helper ID Submission{stats.pendingVerifications > 1 ? 's' : ''} Awaiting Review
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Helpers cannot get verified badges or accept certain premium jobs until identity documents are validated.
              </p>
            </div>
          </div>
          <Link
            to="/verifications"
            className="flex items-center gap-2 rounded-2xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-md shadow-amber-950/40 hover:bg-amber-400 transition"
          >
            <span>Review Submissions</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          subtitle="All platform accounts"
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Active Helpers"
          value={stats.totalHelpers}
          subtitle="Service providers"
          icon={Wrench}
          color="purple"
        />
        <StatCard
          title="Total Tasks"
          value={stats.totalTasks}
          subtitle="All posted requests"
          icon={CheckSquare}
          color="blue"
        />
        <StatCard
          title="Pending IDs"
          value={stats.pendingVerifications}
          subtitle="Review queue"
          icon={ShieldCheck}
          color="amber"
        />
        <StatCard
          title="Platform GMV"
          value={`₹${stats.gmv.toLocaleString('en-IN')}`}
          subtitle="Job value volume"
          icon={IndianRupee}
          color="emerald"
        />
      </div>

      {/* Two Columns: Recent Tasks & Quick Actions */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Recent Tasks Table (2 columns wide) */}
        <div className="lg:col-span-2 rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/20">
          <div className="flex items-center justify-between pb-5 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white">Recent Task Activity</h2>
              <p className="text-xs text-slate-400 mt-0.5">Real-time task creation and state changes</p>
            </div>
            <Link
              to="/tasks"
              className="flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 transition"
            >
              <span>View All Tasks</span>
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-4 divide-y divide-slate-800/80">
            {recentTasks.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-500">No tasks logged yet.</p>
            ) : (
              recentTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between py-3.5 hover:bg-slate-800/30 px-2 rounded-xl transition">
                  <div className="flex-1 min-w-0 pr-4">
                    <p className="text-sm font-semibold text-white truncate">{task.title}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                      <span>{task.category || 'General'}</span>
                      <span>•</span>
                      <span className="truncate">{task.location || 'Coordinated'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <span className="font-bold text-sm text-emerald-400">₹{task.budget}</span>
                    <Badge status={task.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pending ID Verifications Queue & Quick Operations */}
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/20">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h2 className="text-base font-bold text-white">Verification Queue</h2>
              <Link to="/verifications" className="text-xs font-semibold text-amber-400 hover:text-amber-300">
                View All
              </Link>
            </div>

            <div className="mt-4 space-y-3">
              {pendingIds.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500">
                  <ShieldCheck className="h-8 w-8 mx-auto text-emerald-500/50 mb-2" />
                  All helper IDs are currently verified!
                </div>
              ) : (
                pendingIds.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-2xl bg-slate-950/60 p-3 border border-slate-800/60">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-white">
                        {item.name ? item.name[0] : 'H'}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">{item.name || 'Helper'}</p>
                        <p className="text-[11px] text-slate-400">{item.phone || item.city || 'Pending'}</p>
                      </div>
                    </div>
                    <Link
                      to="/verifications"
                      className="rounded-xl bg-blue-600/20 text-blue-300 border border-blue-500/30 px-2.5 py-1 text-xs font-semibold hover:bg-blue-600 hover:text-white transition"
                    >
                      Inspect
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Links Card */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/20">
            <h2 className="text-base font-bold text-white mb-3">Quick Navigation</h2>
            <div className="space-y-2 text-xs">
              <Link
                to="/categories"
                className="flex items-center justify-between rounded-2xl bg-slate-950/50 p-3 text-slate-300 hover:text-white hover:bg-slate-800 transition border border-slate-800/60"
              >
                <span>Category Catalog & Skills</span>
                <ArrowRight className="h-3.5 w-3.5 text-slate-500" />
              </Link>
              <Link
                to="/helpers"
                className="flex items-center justify-between rounded-2xl bg-slate-950/50 p-3 text-slate-300 hover:text-white hover:bg-slate-800 transition border border-slate-800/60"
              >
                <span>Service Helpers Database</span>
                <ArrowRight className="h-3.5 w-3.5 text-slate-500" />
              </Link>
              <Link
                to="/settings"
                className="flex items-center justify-between rounded-2xl bg-slate-950/50 p-3 text-slate-300 hover:text-white hover:bg-slate-800 transition border border-slate-800/60"
              >
                <span>System Health & API Config</span>
                <ArrowRight className="h-3.5 w-3.5 text-slate-500" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
