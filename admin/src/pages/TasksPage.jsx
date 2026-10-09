import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  MapPin,
  Calendar,
  IndianRupee,
  User,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  Eye,
  Tag,
} from 'lucide-react';
import { adminApi } from '../services/api';
import Badge from '../components/common/Badge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import Modal from '../components/common/Modal';

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [selectedTask, setSelectedTask] = useState(null);

  const fetchTasks = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const filters = {};
      if (statusFilter !== 'ALL') filters.status = statusFilter;
      if (categoryFilter !== 'ALL') filters.category = categoryFilter;

      const res = await adminApi.getAllTasks(filters);
      setTasks(res?.tasks || (Array.isArray(res) ? res : []));
    } catch (err) {
      console.error('Failed to load tasks:', err);
      setError('Could not load tasks from server. Please verify backend connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [statusFilter, categoryFilter]);

  // Client-side search filtering
  const filteredTasks = tasks.filter((t) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    return (
      t.title?.toLowerCase().includes(term) ||
      t.description?.toLowerCase().includes(term) ||
      t.location?.toLowerCase().includes(term) ||
      t.category?.toLowerCase().includes(term) ||
      t.createdBy?.name?.toLowerCase().includes(term) ||
      t.assignedTo?.name?.toLowerCase().includes(term)
    );
  });

  // Extract unique categories
  const categories = Array.from(
    new Set(tasks.map((t) => t.category).filter(Boolean))
  ).sort();

  // Metric stats
  const totalCount = tasks.length;
  const openCount = tasks.filter((t) => t.status === 'OPEN').length;
  const inProgressCount = tasks.filter((t) => t.status === 'IN_PROGRESS' || t.status === 'ASSIGNED').length;
  const completedCount = tasks.filter((t) => t.status === 'COMPLETED').length;
  const totalVolume = tasks.reduce((sum, t) => sum + (Number(t.budget) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-emerald-400" />
            Task Management
          </h1>
          <p className="text-sm text-slate-400">
            Monitor and oversee all posted gigs, bookings, assignments, and completions.
          </p>
        </div>

        <button
          onClick={() => fetchTasks(true)}
          disabled={refreshing || loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-800 text-slate-200 hover:bg-slate-700 rounded-xl text-sm font-medium border border-slate-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-emerald-400' : ''}`} />
          Refresh
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Tasks</p>
          <p className="text-2xl font-bold text-white mt-1">{totalCount}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Open / Available</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">{openCount}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">In Progress</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">{inProgressCount}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Completed</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{completedCount}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 col-span-2 md:col-span-1">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total GMV</p>
          <p className="text-2xl font-bold text-purple-400 mt-1">₹{totalVolume.toLocaleString()}</p>
        </div>
      </div>

      {/* Status Tabs Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {[
          { label: 'All Tasks', value: 'ALL' },
          { label: 'Requested', value: 'REQUESTED' },
          { label: 'Open', value: 'OPEN' },
          { label: 'Assigned', value: 'ASSIGNED' },
          { label: 'In Progress', value: 'IN_PROGRESS' },
          { label: 'Completed', value: 'COMPLETED' },
          { label: 'Cancelled', value: 'CANCELLED' },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              statusFilter === tab.value
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search & Category Filter Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by title, description, customer, helper, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-slate-400 hidden sm:block" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      {loading ? (
        <div className="p-16 flex justify-center bg-slate-900 border border-slate-800 rounded-2xl">
          <LoadingSpinner text="Fetching tasks..." size="lg" />
        </div>
      ) : error ? (
        <div className="p-8 bg-red-950/20 border border-red-900/40 rounded-2xl text-center">
          <p className="text-red-400 text-sm font-medium">{error}</p>
          <button
            onClick={() => fetchTasks()}
            className="mt-3 px-4 py-1.5 bg-red-900/30 text-red-300 rounded-lg text-xs font-semibold hover:bg-red-900/50"
          >
            Try Again
          </button>
        </div>
      ) : filteredTasks.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No tasks match criteria"
          description="Try changing status tabs or clear the search query."
        />
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/70 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Task Info</th>
                  <th className="px-4 py-3.5">Category</th>
                  <th className="px-4 py-3.5">Customer</th>
                  <th className="px-4 py-3.5">Assigned Helper</th>
                  <th className="px-4 py-3.5">Budget</th>
                  <th className="px-4 py-3.5">Location</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredTasks.map((task) => (
                  <tr
                    key={task.id}
                    className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                    onClick={() => setSelectedTask(task)}
                  >
                    {/* Task Title & Date */}
                    <td className="px-5 py-4 max-w-[240px]">
                      <p className="font-semibold text-white truncate">{task.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5 truncate font-mono">
                        {task.createdAt ? new Date(task.createdAt).toLocaleString() : ''}
                      </p>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-4">
                      <span className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded-lg text-xs font-medium border border-slate-700">
                        {task.category || 'General'}
                      </span>
                    </td>

                    {/* Customer */}
                    <td className="px-4 py-4 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-600/30 text-blue-300 flex items-center justify-center font-bold text-[10px] shrink-0">
                          {task.createdBy?.name ? task.createdBy.name[0].toUpperCase() : 'U'}
                        </div>
                        <span className="text-slate-200 font-medium truncate max-w-[120px]">
                          {task.createdBy?.name || 'Customer'}
                        </span>
                      </div>
                    </td>

                    {/* Assigned Helper */}
                    <td className="px-4 py-4 text-xs">
                      {task.assignedTo ? (
                        <div className="flex items-center gap-2">
                          <img
                            src={task.assignedTo.image || 'https://placehold.co/50x50?text=H'}
                            alt={task.assignedTo.name}
                            className="w-6 h-6 rounded-full object-cover border border-emerald-500/40 shrink-0"
                          />
                          <span className="text-emerald-300 font-medium truncate max-w-[120px]">
                            {task.assignedTo.name}
                          </span>
                        </div>
                      ) : (
                        <span className="px-2 py-0.5 bg-slate-800 text-slate-400 rounded text-[11px] font-medium italic">
                          Unassigned
                        </span>
                      )}
                    </td>

                    {/* Budget */}
                    <td className="px-4 py-4">
                      <span className="font-bold text-emerald-400 text-sm">
                        ₹{Number(task.budget || 0).toLocaleString()}
                      </span>
                    </td>

                    {/* Location */}
                    <td className="px-4 py-4 text-xs">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="truncate max-w-[130px]">{task.location || 'NCR'}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-4">
                      <Badge status={task.status} />
                    </td>

                    {/* Action */}
                    <td className="px-4 py-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTask(task);
                        }}
                        className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition-colors inline-flex items-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5 text-emerald-400" />
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-slate-950/40 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>
              Showing {filteredTasks.length} of {tasks.length} tasks
            </span>
            <span className="italic text-slate-500">Live database query</span>
          </div>
        </div>
      )}

      {/* Task Details Modal */}
      {selectedTask && (
        <Modal
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          title="Task Specification & Assignment"
          size="lg"
        >
          <div className="space-y-5">
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-white">{selectedTask.title}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge status={selectedTask.status} />
                    <span className="px-2.5 py-0.5 bg-slate-800 text-slate-300 rounded-lg text-xs font-medium border border-slate-700">
                      {selectedTask.category}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-xs text-slate-400 uppercase font-semibold">Budget</p>
                  <p className="text-xl font-bold text-emerald-400 mt-0.5">
                    ₹{Number(selectedTask.budget || 0).toLocaleString()}
                  </p>
                </div>
              </div>

              {selectedTask.description && (
                <div className="mt-4 pt-3 border-t border-slate-800 text-xs text-slate-300 leading-relaxed">
                  <p className="font-semibold text-slate-400 uppercase text-[10px] mb-1">Description</p>
                  {selectedTask.description}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <p className="text-slate-400 uppercase font-semibold text-[10px] tracking-wider">Posted By (Customer)</p>
                <p className="text-white font-medium mt-1">
                  {selectedTask.createdBy?.name || selectedTask.createdById || 'Anonymous'}
                </p>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <p className="text-slate-400 uppercase font-semibold text-[10px] tracking-wider">Assigned Helper</p>
                <p className="text-emerald-400 font-medium mt-1">
                  {selectedTask.assignedTo?.name || (selectedTask.assignedToId ? selectedTask.assignedToId : 'Not Assigned')}
                </p>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <p className="text-slate-400 uppercase font-semibold text-[10px] tracking-wider">Location</p>
                <p className="text-white font-medium mt-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  {selectedTask.location || 'NCR'}
                </p>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <p className="text-slate-400 uppercase font-semibold text-[10px] tracking-wider">Payment Status</p>
                <p className="text-slate-300 font-medium mt-1">
                  {selectedTask.paymentStatus || 'PENDING'}
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1">
              <p className="text-slate-400 uppercase font-semibold text-[10px] tracking-wider">Task ID</p>
              <p className="text-slate-300 font-mono text-[11px] break-all">{selectedTask.id}</p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setSelectedTask(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
