import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Search,
  Filter,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Briefcase,
  CheckCircle2,
  Clock,
  RefreshCw,
  Eye,
  ShieldCheck,
  User,
} from 'lucide-react';
import { adminApi } from '../services/api';
import Badge from '../components/common/Badge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import Modal from '../components/common/Modal';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [selectedUser, setSelectedUser] = useState(null);

  const fetchUsers = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const params = { limit: 100 };
      if (roleFilter !== 'ALL') params.role = roleFilter;
      if (searchTerm.trim()) params.search = searchTerm.trim();

      const res = await adminApi.getUsers(params);
      if (res && res.users) {
        setUsers(res.users);
        setTotalCount(res.total || res.users.length);
      } else if (Array.isArray(res)) {
        setUsers(res);
        setTotalCount(res.length);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
      setError('Could not load user accounts. Please check backend connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  // Debounced or on-submit search
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  // Metrics
  const customerCount = users.filter((u) => u.role === 'USER').length;
  const helperCount = users.filter((u) => u.role === 'HELPER').length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-emerald-400" />
            User Management
          </h1>
          <p className="text-sm text-slate-400">
            View and manage all customer accounts and service partner profiles.
          </p>
        </div>

        <button
          onClick={() => fetchUsers(true)}
          disabled={refreshing || loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-800 text-slate-200 hover:bg-slate-700 rounded-xl text-sm font-medium border border-slate-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-emerald-400' : ''}`} />
          Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Accounts</p>
          <p className="text-2xl font-bold text-white mt-1">{totalCount || users.length}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Customers (Task Posters)</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">{customerCount}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Helpers (Service Providers)</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{helperCount}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Status</p>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm font-bold text-emerald-400">100% Operational</span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, phone, email, or city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Role Filter Tabs */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setRoleFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                roleFilter === 'ALL'
                  ? 'bg-slate-800 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Roles
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter('USER')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                roleFilter === 'USER'
                  ? 'bg-blue-600/30 text-blue-300 font-semibold border border-blue-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Customers
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter('HELPER')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                roleFilter === 'HELPER'
                  ? 'bg-emerald-600/30 text-emerald-300 font-semibold border border-emerald-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Helpers
            </button>
          </div>

          <button
            type="submit"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {/* User Table */}
      {loading ? (
        <div className="p-16 flex justify-center bg-slate-900 border border-slate-800 rounded-2xl">
          <LoadingSpinner text="Loading user database..." size="lg" />
        </div>
      ) : error ? (
        <div className="p-8 bg-red-950/20 border border-red-900/40 rounded-2xl text-center">
          <p className="text-red-400 text-sm font-medium">{error}</p>
          <button
            onClick={() => fetchUsers()}
            className="mt-3 px-4 py-1.5 bg-red-900/30 text-red-300 rounded-lg text-xs font-semibold hover:bg-red-900/50"
          >
            Try Again
          </button>
        </div>
      ) : users.length === 0 ? (
        <EmptyState
          icon={User}
          title="No users found"
          description="Try adjusting your search criteria or role filter."
        />
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/70 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">User</th>
                  <th className="px-4 py-3.5">Role</th>
                  <th className="px-4 py-3.5">Phone & Contact</th>
                  <th className="px-4 py-3.5">Location</th>
                  <th className="px-4 py-3.5">Activity</th>
                  <th className="px-4 py-3.5">ID Status</th>
                  <th className="px-4 py-3.5">Joined</th>
                  <th className="px-4 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {users.map((u) => {
                  const createdTasks = u._count?.tasksCreated || 0;
                  const assignedTasks = u._count?.tasksAssigned || 0;

                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                      onClick={() => setSelectedUser(u)}
                    >
                      {/* Avatar & Name */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              u.image ||
                              `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                                u.name || 'User'
                              )}`
                            }
                            alt={u.name}
                            className="w-10 h-10 rounded-full object-cover border border-slate-700 bg-slate-800 shrink-0"
                          />
                          <div>
                            <p className="font-semibold text-white">{u.name || 'Unnamed User'}</p>
                            <p className="text-xs text-slate-400 font-mono truncate max-w-[140px]">
                              {u.id.substring(0, 8)}...
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-4 py-4">
                        <Badge status={u.role || 'USER'} />
                      </td>

                      {/* Phone / Email */}
                      <td className="px-4 py-4">
                        <div className="space-y-1 text-xs">
                          {u.phone ? (
                            <div className="flex items-center gap-1.5 text-slate-300">
                              <Phone className="w-3.5 h-3.5 text-slate-500" />
                              <span>{u.phone}</span>
                            </div>
                          ) : (
                            <span className="text-slate-500 italic">No phone</span>
                          )}
                          {u.email && (
                            <div className="flex items-center gap-1.5 text-slate-400 truncate max-w-[160px]">
                              <Mail className="w-3.5 h-3.5 text-slate-500" />
                              <span className="truncate">{u.email}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Location */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5 text-xs text-slate-300">
                          <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span className="truncate max-w-[120px]">{u.city || 'NCR'}</span>
                        </div>
                      </td>

                      {/* Activity */}
                      <td className="px-4 py-4">
                        <div className="text-xs space-y-0.5">
                          {u.role === 'HELPER' ? (
                            <span className="text-emerald-400 font-medium">
                              {assignedTasks} tasks assigned
                            </span>
                          ) : (
                            <span className="text-blue-400 font-medium">
                              {createdTasks} tasks posted
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Verification Status */}
                      <td className="px-4 py-4">
                        <Badge status={u.idVerificationStatus || 'UNVERIFIED'} />
                      </td>

                      {/* Joined Date */}
                      <td className="px-4 py-4 text-xs text-slate-400">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                      </td>

                      {/* Action */}
                      <td className="px-4 py-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedUser(u);
                          }}
                          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition-colors inline-flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5 text-emerald-400" />
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-slate-950/40 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>
              Showing {users.length} user account{users.length > 1 ? 's' : ''}
            </span>
            <span className="italic text-slate-500">Live PostgreSQL database sync</span>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {selectedUser && (
        <Modal
          isOpen={!!selectedUser}
          onClose={() => setSelectedUser(null)}
          title="Account Details"
          size="md"
        >
          <div className="space-y-5">
            <div className="flex items-center gap-4 p-4 bg-slate-950 rounded-xl border border-slate-800">
              <img
                src={
                  selectedUser.image ||
                  `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                    selectedUser.name || 'User'
                  )}`
                }
                alt={selectedUser.name}
                className="w-14 h-14 rounded-full object-cover border border-slate-700 bg-slate-900 shrink-0"
              />
              <div>
                <h3 className="text-lg font-bold text-white">{selectedUser.name || 'Unnamed'}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge status={selectedUser.role || 'USER'} />
                  <Badge status={selectedUser.idVerificationStatus || 'UNVERIFIED'} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <p className="text-slate-400 uppercase font-semibold text-[10px] tracking-wider">User ID</p>
                <p className="text-slate-300 font-mono text-[11px] mt-1 break-all">{selectedUser.id}</p>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <p className="text-slate-400 uppercase font-semibold text-[10px] tracking-wider">Phone</p>
                <p className="text-white font-medium mt-1">{selectedUser.phone || 'None'}</p>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <p className="text-slate-400 uppercase font-semibold text-[10px] tracking-wider">Email</p>
                <p className="text-white font-medium mt-1 truncate">{selectedUser.email || 'None'}</p>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <p className="text-slate-400 uppercase font-semibold text-[10px] tracking-wider">City</p>
                <p className="text-white font-medium mt-1">{selectedUser.city || 'NCR'}</p>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <p className="text-slate-400 uppercase font-semibold text-[10px] tracking-wider">Tasks Posted</p>
                <p className="text-blue-400 font-bold text-base mt-1">
                  {selectedUser._count?.tasksCreated || 0}
                </p>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <p className="text-slate-400 uppercase font-semibold text-[10px] tracking-wider">Tasks Assigned</p>
                <p className="text-emerald-400 font-bold text-base mt-1">
                  {selectedUser._count?.tasksAssigned || 0}
                </p>
              </div>
            </div>

            {selectedUser.idDocumentUrl && (
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <p className="text-slate-400 uppercase font-semibold text-[10px] tracking-wider mb-2">
                  Submitted ID Document
                </p>
                <a
                  href={selectedUser.idDocumentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-emerald-400 hover:underline flex items-center gap-1.5"
                >
                  View Document &rarr;
                </a>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setSelectedUser(null)}
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
