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
  Trash2,
  Ban,
  Unlock,
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
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [selectedUser, setSelectedUser] = useState(null);
  const [userSearchLogs, setUserSearchLogs] = useState([]);
  const [searchLogsLoading, setSearchLogsLoading] = useState(false);

  const handleRoleChange = async (userId, newRole) => {
    setActionLoading(true);
    try {
      await adminApi.updateUserRole(userId, newRole);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
      if (selectedUser?.id === userId) {
        setSelectedUser((prev) => ({ ...prev, role: newRole }));
      }
      alert(`User role updated to ${newRole === 'USER' ? 'CUSTOMER' : newRole}!`);
    } catch (err) {
      alert(err.message || 'Failed to update user role');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleBlockUser = async (user) => {
    const nextBlocked = !user.isBlocked;
    let reason = '';
    if (nextBlocked) {
      const input = window.prompt(
        `Enter reason for blocking ${user.name || 'this user'} (optional):`,
        user.blockedReason || 'Policy violation / Admin action'
      );
      if (input === null) return; // cancelled
      reason = input.trim() || 'Blocked by Administrator';
    } else {
      if (!window.confirm(`Unblock ${user.name || 'this user'} and restore account access?`)) return;
    }

    setActionLoading(true);
    try {
      const res = await adminApi.blockUser(user.id, {
        isBlocked: nextBlocked,
        reason: nextBlocked ? reason : null,
      });
      const updatedUser = res?.user || { ...user, isBlocked: nextBlocked, blockedReason: nextBlocked ? reason : null };
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id
            ? { ...u, isBlocked: updatedUser.isBlocked, blockedReason: updatedUser.blockedReason }
            : u
        )
      );
      if (selectedUser?.id === user.id) {
        setSelectedUser((prev) => ({
          ...prev,
          isBlocked: updatedUser.isBlocked,
          blockedReason: updatedUser.blockedReason,
        }));
      }
    } catch (err) {
      alert(err.message || 'Failed to update user block status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to permanently delete this user account? This will cascade remove their profile, tasks, reviews, and notifications.')) return;
    setActionLoading(true);
    try {
      await adminApi.deleteUser(userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setSelectedUser(null);
      alert('User account deleted successfully');
    } catch (err) {
      alert(err.message || 'Failed to delete user');
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedUser?.id) {
      setUserSearchLogs([]);
      return;
    }
    let active = true;
    setSearchLogsLoading(true);
    adminApi
      .getSearchLogs({ userId: selectedUser.id, limit: 15 })
      .then((res) => {
        if (!active) return;
        setUserSearchLogs(Array.isArray(res?.logs) ? res.logs : []);
      })
      .catch(() => {
        if (active) setUserSearchLogs([]);
      })
      .finally(() => {
        if (active) setSearchLogsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [selectedUser?.id]);

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
            <button
              type="button"
              onClick={() => setRoleFilter('SELLER')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                roleFilter === 'SELLER'
                  ? 'bg-amber-600/30 text-amber-300 font-semibold border border-amber-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sellers
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
          <div className="w-full overflow-x-auto max-h-[68vh] overflow-y-auto">
            <table className="w-full min-w-[960px] text-left text-sm text-slate-300">
              <thead className="sticky top-0 z-10 bg-slate-950 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3.5 whitespace-nowrap">User</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Role</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Phone & Contact</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Location</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Activity</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">ID Status</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Joined</th>
                  <th className="px-4 py-3.5 text-right whitespace-nowrap">Action</th>
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
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-white">{u.name || 'Unnamed User'}</p>
                              {u.isBlocked && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 uppercase tracking-wide">
                                  Blocked
                                </span>
                              )}
                            </div>
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
                      <td className="px-4 py-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedUser(u);
                            }}
                            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition-colors inline-flex items-center gap-1"
                            title="View Profile & Search History"
                          >
                            <Eye className="w-3.5 h-3.5 text-emerald-400" />
                            View
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleBlockUser(u);
                            }}
                            disabled={actionLoading}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors inline-flex items-center gap-1 ${
                              u.isBlocked
                                ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/30'
                            }`}
                            title={u.isBlocked ? 'Unblock User' : 'Block User'}
                          >
                            {u.isBlocked ? (
                              <>
                                <Unlock className="w-3.5 h-3.5" />
                                Unblock
                              </>
                            ) : (
                              <>
                                <Ban className="w-3.5 h-3.5" />
                                Block
                              </>
                            )}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteUser(u.id);
                            }}
                            disabled={actionLoading}
                            className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg text-xs border border-rose-500/30 transition-colors"
                            title="Delete Profile"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
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
            <span className="italic text-slate-500">Live MariaDB database sync</span>
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
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <Badge status={selectedUser.role || 'USER'} />
                  <Badge status={selectedUser.idVerificationStatus || 'UNVERIFIED'} />
                  {selectedUser.isBlocked ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 uppercase tracking-wide">
                      Blocked Account
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase tracking-wide">
                      Active Account
                    </span>
                  )}
                </div>
                {selectedUser.isBlocked && selectedUser.blockedReason && (
                  <p className="text-xs text-rose-400 mt-1.5">
                    Block Reason: {selectedUser.blockedReason}
                  </p>
                )}
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

            {/* Recent User Search Queries */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5" />
                  Recent Searches by {selectedUser.name?.split(' ')[0] || 'User'}
                </span>
                <span className="text-[11px] text-slate-400">
                  {userSearchLogs.length} recent queries
                </span>
              </div>
              {searchLogsLoading ? (
                <p className="text-xs text-slate-400 py-2">Loading user search history...</p>
              ) : userSearchLogs.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-1">
                  No searches recorded for this user yet.
                </p>
              ) : (
                <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                  {userSearchLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-semibold text-white truncate">
                          &ldquo;{log.query}&rdquo;
                        </span>
                        {log.category && (
                          <span className="px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-300 text-[10px]">
                            {log.category}
                          </span>
                        )}
                        {log.section && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px]">
                            {log.section}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {log.createdAt ? new Date(log.createdAt).toLocaleString() : ''}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Admin Management Section */}
            <div className="p-4 bg-slate-900 rounded-xl border border-emerald-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Admin Account Controls (Live API)
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  Role: {selectedUser.role === 'USER' ? 'CUSTOMER' : selectedUser.role}
                </span>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <span className="text-xs text-slate-300 mr-1">Switch Role:</span>
                <button
                  type="button"
                  onClick={() => handleRoleChange(selectedUser.id, 'USER')}
                  disabled={actionLoading || selectedUser.role === 'USER'}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    selectedUser.role === 'USER'
                      ? 'bg-blue-600 text-white shadow cursor-default'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
                  } disabled:opacity-50`}
                >
                  Customer (Poster)
                </button>
                <button
                  type="button"
                  onClick={() => handleRoleChange(selectedUser.id, 'HELPER')}
                  disabled={actionLoading || selectedUser.role === 'HELPER'}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    selectedUser.role === 'HELPER'
                      ? 'bg-emerald-600 text-white shadow cursor-default'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
                  } disabled:opacity-50`}
                >
                  Helper (Provider)
                </button>
                <button
                  type="button"
                  onClick={() => handleRoleChange(selectedUser.id, 'SELLER')}
                  disabled={actionLoading || selectedUser.role === 'SELLER'}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    selectedUser.role === 'SELLER'
                      ? 'bg-amber-600 text-white shadow cursor-default'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
                  } disabled:opacity-50`}
                >
                  Seller (Manufacturer)
                </button>
              </div>
            </div>

            <div className="flex flex-wrap justify-between items-center gap-2 pt-2 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleBlockUser(selectedUser)}
                  disabled={actionLoading}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors disabled:opacity-50 ${
                    selectedUser.isBlocked
                      ? 'bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border-emerald-900/50'
                      : 'bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border-amber-900/50'
                  }`}
                >
                  {selectedUser.isBlocked ? (
                    <>
                      <Unlock className="w-3.5 h-3.5" />
                      Unblock Profile
                    </>
                  ) : (
                    <>
                      <Ban className="w-3.5 h-3.5" />
                      Block Profile
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteUser(selectedUser.id)}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-900/50 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Account
                </button>
              </div>

              <button
                type="button"
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
