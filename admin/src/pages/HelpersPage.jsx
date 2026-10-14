import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  ShieldCheck,
  ShieldAlert,
  Star,
  MapPin,
  Briefcase,
  Phone,
  Mail,
  ExternalLink,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Trash2,
  UserPlus,
  Copy,
  Check,
  Key,
  Sparkles,
} from 'lucide-react';
import { adminApi } from '../services/api';
import Badge from '../components/common/Badge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import Modal from '../components/common/Modal';
import { Link } from 'react-router-dom';

export default function HelpersPage() {
  const [helpers, setHelpers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [cityFilter, setCityFilter] = useState('ALL');

  // Selected helper for modal
  const [selectedHelper, setSelectedHelper] = useState(null);

  // Add Helper Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState(null);
  const [copiedCredentials, setCopiedCredentials] = useState(false);
  const [createdHelperInfo, setCreatedHelperInfo] = useState(null);

  const initialAddFormData = {
    name: '',
    phone: '',
    password: `Helper@${Math.floor(1000 + Math.random() * 9000)}`,
    skills: '',
    city: 'Meerut',
    hourlyRate: '299',
    isVerified: true,
  };
  const [addFormData, setAddFormData] = useState(initialAddFormData);

  const resetAddForm = () => {
    setAddFormData({
      ...initialAddFormData,
      password: `Helper@${Math.floor(1000 + Math.random() * 9000)}`,
    });
    setCreatedHelperInfo(null);
    setAddError(null);
    setCopiedCredentials(false);
  };

  const handleGeneratePassword = () => {
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    setAddFormData((prev) => ({ ...prev, password: `Helper@${randomDigits}` }));
  };

  const handleCreateHelper = async (e) => {
    e.preventDefault();
    setAddError(null);

    const cleanPhone = addFormData.phone.replace(/\D/g, '').slice(-10);
    if (!cleanPhone || cleanPhone.length !== 10) {
      setAddError('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (!addFormData.password || addFormData.password.length < 4) {
      setAddError('Password must be at least 4 characters long.');
      return;
    }

    setAddLoading(true);
    try {
      const res = await adminApi.createHelper({
        name: addFormData.name.trim(),
        phone: cleanPhone,
        password: addFormData.password.trim(),
        skills: addFormData.skills.trim() || 'General Helper',
        city: addFormData.city.trim() || 'Meerut',
        hourlyRate: addFormData.hourlyRate ? Number(addFormData.hourlyRate) : undefined,
        isVerified: addFormData.isVerified,
      });

      const helperData = res.helper || res.data || res;
      setCreatedHelperInfo({
        ...helperData,
        plainPassword: addFormData.password.trim(),
      });

      // Refresh directory list
      fetchHelpers(true);
    } catch (err) {
      setAddError(err.message || 'Failed to create helper account');
    } finally {
      setAddLoading(false);
    }
  };

  const copyCredentialsToClipboard = () => {
    if (!createdHelperInfo) return;
    const text = `HireBuddy Helper Partner Credentials:\n- Login URL: http://localhost:3000/login\n- Helper ID (Phone): ${createdHelperInfo.phone}\n- Password: ${createdHelperInfo.plainPassword}\n- Status: Verified & Active\n\nPlease login and start accepting local tasks!`;
    navigator.clipboard.writeText(text);
    setCopiedCredentials(true);
    setTimeout(() => setCopiedCredentials(false), 3000);
  };

  const handleVerifyStatus = async (helperId, newStatus) => {
    setActionLoading(true);
    try {
      await adminApi.verifyUserId(helperId, {
        status: newStatus,
        notes: `ID status updated to ${newStatus} by Admin`,
      });
      setHelpers((prev) =>
        prev.map((h) =>
          h.id === helperId ? { ...h, idVerificationStatus: newStatus } : h
        )
      );
      if (selectedHelper?.id === helperId) {
        setSelectedHelper((prev) => ({ ...prev, idVerificationStatus: newStatus }));
      }
      alert(`Helper verification updated to ${newStatus}!`);
    } catch (err) {
      alert(err.message || 'Failed to update verification status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteHelper = async (helperId) => {
    if (!window.confirm('Are you sure you want to permanently delete this helper account? All assigned tasks will be unassigned.')) return;
    setActionLoading(true);
    try {
      await adminApi.deleteUser(helperId);
      setHelpers((prev) => prev.filter((h) => h.id !== helperId));
      setSelectedHelper(null);
      alert('Helper account deleted successfully');
    } catch (err) {
      alert(err.message || 'Failed to delete helper');
    } finally {
      setActionLoading(false);
    }
  };

  const fetchHelpers = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const res = await adminApi.getHelpers();
      const list = Array.isArray(res) ? res : res.data || [];
      setHelpers(list);
    } catch (err) {
      console.error('Failed to load helpers:', err);
      setError('Could not load helper directory. Please check backend connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHelpers();
  }, []);

  // Filtered list
  const filteredHelpers = helpers.filter((h) => {
    // Search
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      h.name?.toLowerCase().includes(term) ||
      h.city?.toLowerCase().includes(term) ||
      h.phone?.includes(term) ||
      h.email?.toLowerCase().includes(term) ||
      (Array.isArray(h.skills) && h.skills.some((s) => s.toLowerCase().includes(term)));

    // Status filter
    let matchesStatus = true;
    if (statusFilter === 'VERIFIED') matchesStatus = h.idVerificationStatus === 'VERIFIED';
    else if (statusFilter === 'PENDING') matchesStatus = h.idVerificationStatus === 'PENDING';
    else if (statusFilter === 'UNVERIFIED') matchesStatus = h.idVerificationStatus === 'UNVERIFIED' || !h.idVerificationStatus;

    // City filter
    let matchesCity = true;
    if (cityFilter !== 'ALL') {
      matchesCity = h.city?.toLowerCase().includes(cityFilter.toLowerCase());
    }

    return matchesSearch && matchesStatus && matchesCity;
  });

  // Extract unique cities
  const cities = Array.from(
    new Set(
      helpers
        .map((h) => h.city)
        .filter(Boolean)
        .map((c) => c.split(',')[0].trim())
    )
  ).sort();

  // Metrics
  const totalCount = helpers.length;
  const verifiedCount = helpers.filter((h) => h.idVerificationStatus === 'VERIFIED').length;
  const pendingCount = helpers.filter((h) => h.idVerificationStatus === 'PENDING').length;
  const verifiedRate = totalCount ? Math.round((verifiedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Top Header & Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-400" />
            Helper Directory
          </h1>
          <p className="text-sm text-slate-400">
            Browse, inspect, and manage all service partners registered on HireBuddy.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <Link
              to="/verifications"
              className="inline-flex items-center gap-2 px-3 py-2 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xl text-sm font-semibold hover:bg-amber-500/20 transition-colors"
            >
              <ShieldAlert className="w-4 h-4" />
              {pendingCount} Pending Verification{pendingCount > 1 ? 's' : ''}
            </Link>
          )}

          <button
            onClick={() => fetchHelpers(true)}
            disabled={refreshing || loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-800 text-slate-200 hover:bg-slate-700 rounded-xl text-sm font-medium border border-slate-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-emerald-400' : ''}`} />
            Refresh
          </button>

          <button
            onClick={() => {
              resetAddForm();
              setShowAddModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm shadow-emerald-950"
          >
            <UserPlus className="w-4 h-4" />
            Add Helper
          </button>
        </div>
      </div>

      {/* KPI Overview Pills */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Helpers</p>
          <p className="text-2xl font-bold text-white mt-1">{totalCount}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Govt Verified</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-emerald-400">{verifiedCount}</span>
            <span className="text-xs text-slate-400 font-medium">({verifiedRate}%)</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Review Queue</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">{pendingCount}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Unverified</p>
          <p className="text-2xl font-bold text-slate-400 mt-1">
            {totalCount - verifiedCount - pendingCount}
          </p>
        </div>
      </div>

      {/* Search & Filters Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search helper by name, phone, city, or skills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Verification Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="VERIFIED">Verified Only</option>
              <option value="PENDING">Pending Review</option>
              <option value="UNVERIFIED">Unverified Only</option>
            </select>

            {/* City Filter */}
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">All Cities</option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Helpers Table */}
      {loading ? (
        <div className="p-16 flex justify-center bg-slate-900 border border-slate-800 rounded-2xl">
          <LoadingSpinner text="Loading helper directory..." size="lg" />
        </div>
      ) : error ? (
        <div className="p-8 bg-red-950/20 border border-red-900/40 rounded-2xl text-center">
          <p className="text-red-400 text-sm font-medium">{error}</p>
          <button
            onClick={() => fetchHelpers()}
            className="mt-3 px-4 py-1.5 bg-red-900/30 text-red-300 rounded-lg text-xs font-semibold hover:bg-red-900/50"
          >
            Try Again
          </button>
        </div>
      ) : filteredHelpers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No helpers found"
          description={
            searchTerm || statusFilter !== 'ALL' || cityFilter !== 'ALL'
              ? 'Try adjusting your search query or status filter.'
              : 'No helpers have joined the platform yet.'
          }
        />
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/70 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Helper Profile</th>
                  <th className="px-4 py-3.5">Contact Details</th>
                  <th className="px-4 py-3.5">Location</th>
                  <th className="px-4 py-3.5">Experience & Rate</th>
                  <th className="px-4 py-3.5">Skills</th>
                  <th className="px-4 py-3.5">Verification</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredHelpers.map((h) => {
                  const skills = Array.isArray(h.skills)
                    ? h.skills
                    : h.skills
                    ? String(h.skills).split(',').map((s) => s.trim())
                    : [];

                  return (
                    <tr
                      key={h.id}
                      className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                      onClick={() => setSelectedHelper(h)}
                    >
                      {/* Avatar & Name */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={h.image || 'https://placehold.co/100x100?text=Helper'}
                            alt={h.name}
                            className="w-10 h-10 rounded-full object-cover border border-slate-700 bg-slate-800 shrink-0"
                            onError={(e) => {
                              e.currentTarget.src = 'https://placehold.co/100x100?text=Helper';
                            }}
                          />
                          <div>
                            <div className="flex items-center gap-1.5 font-semibold text-white">
                              <span>{h.name}</span>
                              {h.idVerificationStatus === 'VERIFIED' && (
                                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-amber-400 mt-0.5">
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                              <span className="font-medium">{h.averageRating || '4.8'}</span>
                              <span className="text-slate-500">
                                ({h.totalReviews || 12} reviews)
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Phone & Email */}
                      <td className="px-4 py-4">
                        <div className="space-y-1 text-xs">
                          {h.phone ? (
                            <div className="flex items-center gap-1.5 text-slate-300">
                              <Phone className="w-3.5 h-3.5 text-slate-500" />
                              <span>{h.phone}</span>
                            </div>
                          ) : (
                            <span className="text-slate-500 italic">No phone</span>
                          )}
                          {h.email && (
                            <div className="flex items-center gap-1.5 text-slate-400 truncate max-w-[180px]">
                              <Mail className="w-3.5 h-3.5 text-slate-500" />
                              <span className="truncate">{h.email}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* City */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5 text-xs text-slate-300">
                          <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span className="truncate max-w-[140px]">{h.city || 'Delhi NCR'}</span>
                        </div>
                      </td>

                      {/* Experience & Rate */}
                      <td className="px-4 py-4">
                        <div className="text-xs space-y-0.5">
                          <p className="text-slate-200 font-medium">
                            {h.experience ? `${h.experience} yrs exp` : 'Experienced'}
                          </p>
                          <p className="text-emerald-400 font-semibold">
                            {h.hourlyRate ? `₹${(h.hourlyRate / 100).toFixed(0)}/hr` : '₹200/hr'}
                          </p>
                        </div>
                      </td>

                      {/* Skills Tags */}
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {skills.slice(0, 2).map((skill, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-[11px] font-medium border border-slate-700/60"
                            >
                              {skill}
                            </span>
                          ))}
                          {skills.length > 2 && (
                            <span className="px-1.5 py-0.5 text-slate-500 text-[11px] font-medium">
                              +{skills.length - 2}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Verification Status */}
                      <td className="px-4 py-4">
                        <Badge status={h.idVerificationStatus || 'UNVERIFIED'} />
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedHelper(h);
                          }}
                          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition-colors inline-flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5 text-emerald-400" />
                          Inspect
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
              Showing {filteredHelpers.length} of {helpers.length} helpers
            </span>
            <span className="italic text-slate-500">Click any row to inspect complete helper profile</span>
          </div>
        </div>
      )}

      {/* Helper Profile Modal */}
      {selectedHelper && (
        <Modal
          isOpen={!!selectedHelper}
          onClose={() => setSelectedHelper(null)}
          title="Helper Details & Credentials"
          size="lg"
        >
          <div className="space-y-6">
            {/* Header with image */}
            <div className="flex items-start gap-4 p-4 bg-slate-950 rounded-xl border border-slate-800">
              <img
                src={selectedHelper.image || 'https://placehold.co/120x120?text=Helper'}
                alt={selectedHelper.name}
                className="w-16 h-16 rounded-2xl object-cover border border-slate-700 bg-slate-900 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-white truncate">{selectedHelper.name}</h3>
                  <Badge status={selectedHelper.idVerificationStatus || 'UNVERIFIED'} />
                </div>
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  {selectedHelper.city || 'Location not specified'}
                </p>
                <div className="flex items-center gap-4 mt-2 text-xs">
                  <span className="text-amber-400 flex items-center gap-1 font-semibold">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    {selectedHelper.averageRating || '4.8'} rating ({selectedHelper.totalReviews || 12} reviews)
                  </span>
                  <span className="text-slate-400">
                    Experience:{' '}
                    <strong className="text-white">
                      {selectedHelper.experience ? `${selectedHelper.experience} yrs` : 'Verified'}
                    </strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Contact Details Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <p className="text-slate-400 uppercase font-semibold text-[10px] tracking-wider">Phone</p>
                <p className="text-white font-medium mt-1">{selectedHelper.phone || 'N/A'}</p>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <p className="text-slate-400 uppercase font-semibold text-[10px] tracking-wider">Email</p>
                <p className="text-white font-medium mt-1 truncate">{selectedHelper.email || 'N/A'}</p>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <p className="text-slate-400 uppercase font-semibold text-[10px] tracking-wider">Hourly Rate</p>
                <p className="text-emerald-400 font-semibold mt-1">
                  {selectedHelper.hourlyRate ? `₹${(selectedHelper.hourlyRate / 100).toFixed(0)} / hr` : '₹200 / hr'}
                </p>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <p className="text-slate-400 uppercase font-semibold text-[10px] tracking-wider">Helper ID</p>
                <p className="text-slate-400 font-mono text-[11px] mt-1 truncate">{selectedHelper.id}</p>
              </div>
            </div>

            {/* Skills & Badges */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <p className="text-xs font-semibold text-slate-300">Registered Skills & Specialties</p>
              <div className="flex flex-wrap gap-1.5">
                {(Array.isArray(selectedHelper.skills)
                  ? selectedHelper.skills
                  : selectedHelper.skills
                  ? String(selectedHelper.skills).split(',')
                  : ['General Support']
                ).map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 bg-emerald-950/40 text-emerald-300 border border-emerald-800/40 rounded-lg text-xs font-medium"
                  >
                    {skill.trim()}
                  </span>
                ))}
              </div>
            </div>

            {/* Verification Document action if pending */}
            {selectedHelper.idVerificationStatus === 'PENDING' && (
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-amber-300">Verification Document Pending Review</p>
                  <p className="text-xs text-amber-400/80 mt-0.5">
                    This helper has submitted an identity document awaiting approval.
                  </p>
                </div>
                <Link
                  to="/verifications"
                  className="px-3.5 py-1.5 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs hover:bg-amber-400 transition-colors"
                >
                  Review in Portal
                </Link>
              </div>
            )}

            {/* Admin Management Section */}
            <div className="p-4 bg-slate-900 rounded-xl border border-emerald-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Admin Verification Controls (Live API)
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  Status: {selectedHelper.idVerificationStatus || 'UNVERIFIED'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-xs text-slate-300 mr-1">Change ID Status:</span>
                {['VERIFIED', 'PENDING', 'UNVERIFIED', 'REJECTED'].map((st) => (
                  <button
                    key={st}
                    onClick={() => handleVerifyStatus(selectedHelper.id, st)}
                    disabled={actionLoading || selectedHelper.idVerificationStatus === st}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      selectedHelper.idVerificationStatus === st
                        ? 'bg-emerald-500 text-slate-950 shadow cursor-default'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
                    } disabled:opacity-50`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => handleDeleteHelper(selectedHelper.id)}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-900/50 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Helper Account
              </button>

              <button
                onClick={() => setSelectedHelper(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Helper Modal */}
      {showAddModal && (
        <Modal
          isOpen={showAddModal}
          onClose={() => {
            setShowAddModal(false);
            resetAddForm();
          }}
          title={createdHelperInfo ? "Helper Account Created!" : "Add New Helper / Partner"}
          maxWidth="max-w-xl"
        >
          {createdHelperInfo ? (
            /* SUCCESS CREDENTIALS CARD */
            <div className="space-y-5">
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-white">Helper Successfully Registered!</h4>
                  <p className="text-xs text-slate-300 mt-1">
                    The account has been created in MariaDB and indexed in Elasticsearch. Provide these login credentials to the helper.
                  </p>
                </div>
              </div>

              {/* Credential Box */}
              <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-3 font-mono">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                  <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider font-sans flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5" />
                    Helper Login Credentials
                  </span>
                  <Badge variant="emerald">Live & Active</Badge>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-900">
                    <span className="text-slate-400 font-sans">Name:</span>
                    <span className="text-slate-200 font-bold">{createdHelperInfo.name}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-900">
                    <span className="text-slate-400 font-sans">Helper ID (Phone):</span>
                    <span className="text-emerald-300 font-bold tracking-wider">{createdHelperInfo.phone}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-900">
                    <span className="text-slate-400 font-sans">Initial Password:</span>
                    <span className="text-amber-300 font-bold tracking-wider bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      {createdHelperInfo.plainPassword}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-900">
                    <span className="text-slate-400 font-sans">Login Portal:</span>
                    <span className="text-blue-400 font-sans underline">http://localhost:3000/login</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400 font-sans">Skills:</span>
                    <span className="text-slate-300 font-sans">{createdHelperInfo.skills}</span>
                  </div>
                </div>
              </div>

              {/* Copy Button */}
              <button
                type="button"
                onClick={copyCredentialsToClipboard}
                className={`w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  copiedCredentials
                    ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950'
                }`}
              >
                {copiedCredentials ? (
                  <>
                    <Check className="w-4 h-4" />
                    Credentials Copied to Clipboard!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy Login Credentials for WhatsApp / SMS
                  </>
                )}
              </button>

              <div className="pt-2 flex justify-between gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={resetAddForm}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition"
                >
                  ➕ Add Another Helper
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    resetAddForm();
                  }}
                  className="px-5 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-bold transition"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            /* CREATION FORM */
            <form onSubmit={handleCreateHelper} className="space-y-4">
              {addError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300">
                  {addError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Full Name <span className="text-emerald-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kumar"
                    value={addFormData.name}
                    onChange={(e) => setAddFormData({ ...addFormData, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Mobile Number (Login ID) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Mobile Number (Helper ID) <span className="text-emerald-400">*</span>
                  </label>
                  <div className="flex bg-slate-950 border border-slate-800 rounded-xl overflow-hidden focus-within:border-emerald-500">
                    <span className="px-3 py-2 text-xs text-slate-400 bg-slate-900 border-r border-slate-800 flex items-center">
                      +91
                    </span>
                    <input
                      type="tel"
                      required
                      placeholder="10-digit mobile"
                      value={addFormData.phone}
                      onChange={(e) => setAddFormData({ ...addFormData, phone: e.target.value })}
                      className="w-full bg-transparent px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Initial Password <span className="text-emerald-400">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    Generate Random
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={addFormData.password}
                    onChange={(e) => setAddFormData({ ...addFormData, password: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 font-mono placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Helper will sign in using their Mobile Number + this password on the HireBuddy login page.
                </p>
              </div>

              {/* Skills */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Primary Skills & Services
                </label>
                <input
                  type="text"
                  placeholder="e.g. Electrician, AC Repair, Plumbing"
                  value={addFormData.skills}
                  onChange={(e) => setAddFormData({ ...addFormData, skills: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
                {/* Quick skill pills */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {['Electrician', 'Plumber', 'Cleaning', 'Carpenter', 'Painter', 'AC Repair', 'Moving'].map((sk) => (
                    <button
                      key={sk}
                      type="button"
                      onClick={() => {
                        const current = addFormData.skills ? addFormData.skills.split(',').map(s => s.trim()).filter(Boolean) : [];
                        if (!current.includes(sk)) {
                          const updated = [...current, sk].join(', ');
                          setAddFormData({ ...addFormData, skills: updated });
                        }
                      }}
                      className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] border border-slate-700 transition"
                    >
                      + {sk}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* City */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    City / Working Area
                  </label>
                  <input
                    type="text"
                    value={addFormData.city}
                    onChange={(e) => setAddFormData({ ...addFormData, city: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Hourly Rate */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Standard Rate (₹ / hr)
                  </label>
                  <input
                    type="number"
                    placeholder="299"
                    value={addFormData.hourlyRate}
                    onChange={(e) => setAddFormData({ ...addFormData, hourlyRate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* ID Verification Checkbox */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-start gap-3">
                <input
                  type="checkbox"
                  id="isVerifiedCheckbox"
                  checked={addFormData.isVerified}
                  onChange={(e) => setAddFormData({ ...addFormData, isVerified: e.target.checked })}
                  className="mt-1 h-4 w-4 rounded border-slate-700 text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="isVerifiedCheckbox" className="text-xs text-slate-300 cursor-pointer">
                  <span className="font-semibold text-white">Pre-verify ID Document</span>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    Mark identity verification as VERIFIED immediately (no document review required in queue).
                  </p>
                </label>
              </div>

              {/* Footer */}
              <div className="flex justify-end items-center gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    resetAddForm();
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold transition shadow-lg shadow-emerald-950 disabled:opacity-50 flex items-center gap-2"
                >
                  {addLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Creating Helper...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      Create Helper Account
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </Modal>
      )}
    </div>
  );
}
