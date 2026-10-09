import React from 'react';

export default function Badge({ status, type = 'status' }) {
  const normalized = (status || '').toUpperCase();

  const configs = {
    // Task Statuses
    REQUESTED: { label: 'Pending Request', className: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
    OPEN: { label: 'Open', className: 'bg-sky-500/15 text-sky-300 border-sky-500/30' },
    ASSIGNED: { label: 'Assigned', className: 'bg-blue-500/15 text-blue-300 border-blue-500/30' },
    IN_PROGRESS: { label: 'In Progress', className: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30' },
    COMPLETED: { label: 'Completed', className: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
    CANCELLED: { label: 'Cancelled', className: 'bg-rose-500/15 text-rose-300 border-rose-500/30' },

    // ID Verification Statuses
    VERIFIED: { label: 'Verified', className: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
    PENDING: { label: 'Pending Review', className: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
    UNVERIFIED: { label: 'Unverified', className: 'bg-slate-700/50 text-slate-400 border-slate-600' },
    REJECTED: { label: 'Rejected', className: 'bg-rose-500/15 text-rose-300 border-rose-500/30' },

    // Role Statuses
    HELPER: { label: 'Helper', className: 'bg-purple-500/15 text-purple-300 border-purple-500/30' },
    USER: { label: 'Customer', className: 'bg-blue-500/15 text-blue-300 border-blue-500/30' },
    ADMIN: { label: 'Admin', className: 'bg-amber-500/20 text-amber-200 border-amber-400/40' },
  };

  const item = configs[normalized] || {
    label: status || 'Unknown',
    className: 'bg-slate-800 text-slate-300 border-slate-700',
  };

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${item.className}`}>
      {item.label}
    </span>
  );
}
