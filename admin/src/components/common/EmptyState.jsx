import React from 'react';
import { Inbox } from 'lucide-react';

export default function EmptyState({ 
  icon: Icon = Inbox, 
  title = 'No records found', 
  description = 'There are no items matching your current filters.',
  action
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-800 bg-slate-900/40 py-16 px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800/80 text-slate-400">
        <Icon className="h-7 w-7" />
      </div>
      <h4 className="mt-4 text-base font-bold text-white">{title}</h4>
      <p className="mt-1 max-w-sm text-xs text-slate-400">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
