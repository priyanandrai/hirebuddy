import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
  ShieldCheck, 
  ShieldAlert, 
  ExternalLink, 
  Check, 
  X, 
  Search, 
  KeyRound, 
  User, 
  MapPin, 
  Phone,
  FileText
} from 'lucide-react';
import { adminApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';

export default function VerificationsPage() {
  const { adminToken } = useAuth();
  const context = useOutletContext();
  const refreshTrigger = context?.refreshTrigger || 0;

  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [search, setSearch] = useState('');
  const [customToken, setCustomToken] = useState(adminToken || '');
  const [selectedUser, setSelectedUser] = useState(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingUserId, setRejectingUserId] = useState(null);
  const [rejectReason, setRejectReason] = useState('Document is unclear or unreadable');

  const loadPendingSubmissions = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getPendingIdSubmissions(customToken || adminToken);
      setSubmissions(res.data || []);
    } catch (err) {
      console.error('Failed to load pending submissions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPendingSubmissions();
  }, [adminToken, refreshTrigger]);

  const handleVerify = async (userId) => {
    if (!window.confirm('Approve and verify this helper ID?')) return;
    setActionLoadingId(userId);
    try {
      await adminApi.verifyUserId(userId, {
        status: 'VERIFIED',
        notes: 'Verified by Admin Portal',
        adminToken: customToken || adminToken,
      });
      alert('Helper verified successfully! Badges updated.');
      setSubmissions((prev) => prev.filter((s) => s.id !== userId));
      if (context?.onRefresh) context.onRefresh();
    } catch (err) {
      alert(err.message || 'Verification action failed');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleOpenRejectModal = (userId) => {
    setRejectingUserId(userId);
    setRejectReason('Document is blurry, expired, or invalid');
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!rejectingUserId) return;
    setActionLoadingId(rejectingUserId);
    try {
      await adminApi.verifyUserId(rejectingUserId, {
        status: 'REJECTED',
        notes: rejectReason || 'Document rejected by Admin',
        adminToken: customToken || adminToken,
      });
      alert('Submission rejected.');
      setSubmissions((prev) => prev.filter((s) => s.id !== rejectingUserId));
      setRejectModalOpen(false);
      setRejectingUserId(null);
      if (context?.onRefresh) context.onRefresh();
    } catch (err) {
      alert(err.message || 'Reject action failed');
    } finally {
      setActionLoadingId(null);
    }
  };

  const filtered = submissions.filter((s) => {
    const q = search.toLowerCase();
    return (
      (s.name && s.name.toLowerCase().includes(q)) ||
      (s.phone && s.phone.includes(q)) ||
      (s.city && s.city.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Banner and Search Controls */}
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/20 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">ID Verification Center</h2>
          <p className="mt-1 text-xs text-slate-400">
            Validate government IDs submitted by helpers before assigning them the official Verified badge.
          </p>
        </div>

        {/* Token Override input */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
            <input
              type="password"
              value={customToken}
              onChange={(e) => setCustomToken(e.target.value)}
              placeholder="Admin token key"
              className="rounded-xl border border-slate-800 bg-slate-950 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none w-48"
            />
          </div>
          <button
            onClick={loadPendingSubmissions}
            className="rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-blue-500 transition"
          >
            Apply Key
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by helper name, phone, or city..."
            className="w-full rounded-2xl border border-slate-800 bg-slate-900/80 py-3 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3 text-xs text-slate-400">
          Pending: <strong className="text-amber-400">{filtered.length}</strong>
        </div>
      </div>

      {/* Submissions List */}
      {loading ? (
        <LoadingSpinner text="Fetching pending ID submissions..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="No Pending ID Submissions"
          description="All helper verification requests have been processed or none have been submitted yet."
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {filtered.map((user) => (
            <div
              key={user.id}
              className="flex flex-col justify-between rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/20 transition hover:border-slate-700"
            >
              <div>
                {/* Header: Avatar, Name, Status */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 overflow-hidden rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-white text-base">
                      {user.image ? (
                        <img src={user.image} alt={user.name} className="h-full w-full object-cover" />
                      ) : (
                        user.name ? user.name[0] : 'H'
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base">{user.name || 'Anonymous Helper'}</h3>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                        {user.city && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-slate-500" />
                            {user.city}
                          </span>
                        )}
                        {user.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3 text-slate-500" />
                            {user.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Badge status="PENDING" />
                </div>

                {/* ID Document Preview Link */}
                <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <FileText className="h-5 w-5 text-blue-400" />
                      <div>
                        <p className="text-xs font-semibold text-white">Government ID Document</p>
                        <p className="text-[11px] text-slate-400 truncate max-w-xs">
                          {user.idDocumentUrl || 'Uploaded file'}
                        </p>
                      </div>
                    </div>
                    {user.idDocumentUrl ? (
                      <a
                        href={user.idDocumentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 rounded-xl bg-blue-600/20 border border-blue-500/30 px-3 py-1.5 text-xs font-bold text-blue-300 hover:bg-blue-600 hover:text-white transition"
                      >
                        <span>Inspect</span>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    ) : (
                      <span className="text-xs text-slate-500">No URL</span>
                    )}
                  </div>
                </div>

                {/* Skills & Experience */}
                {user.skills && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {String(user.skills).split(',').map((skill, idx) => (
                      <span key={idx} className="rounded-lg bg-slate-800 px-2 py-0.5 text-[11px] text-slate-300">
                        {skill.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="mt-6 flex items-center gap-3 pt-4 border-t border-slate-800/80">
                <button
                  onClick={() => handleOpenRejectModal(user.id)}
                  disabled={actionLoadingId === user.id}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-2xl border border-rose-500/30 bg-rose-500/10 py-2.5 text-xs font-bold text-rose-300 hover:bg-rose-500/20 disabled:opacity-60 transition"
                >
                  <X className="h-4 w-4" />
                  <span>Reject</span>
                </button>
                <button
                  onClick={() => handleVerify(user.id)}
                  disabled={actionLoadingId === user.id}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-2xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-950/40 hover:bg-emerald-500 disabled:opacity-60 transition"
                >
                  <Check className="h-4 w-4" />
                  <span>{actionLoadingId === user.id ? 'Verifying...' : 'Approve & Verify'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject Reason Modal */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Reject ID Verification"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-300">
            Please provide a reason for rejecting this document so the helper knows what needs correction.
          </p>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Reason / Notes
            </label>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full rounded-2xl border border-slate-800 bg-slate-950 p-3 text-xs text-white placeholder-slate-600 focus:border-rose-500 focus:outline-none"
              placeholder="e.g. ID card is expired or photo is blurred"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setRejectModalOpen(false)}
              className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmReject}
              disabled={actionLoadingId !== null}
              className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-500 disabled:opacity-60 shadow"
            >
              Confirm Rejection
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
