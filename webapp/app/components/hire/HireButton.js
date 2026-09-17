"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthToken } from '../lib/getSessionToken';
import { hireBuddy } from '../services/hire.service';

export default function HireButton({ helperId, helperName, defaultBudget = 0, redirectAfter = '/dashboard/my-tasks', className = '' , disabled = false, slug }) {
  const [open, setOpen] = useState(false);
  const [budget, setBudget] = useState(defaultBudget);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  async function handleOpen() {
    try {
      const t = await getAuthToken();
      if (!t) {
        router.push(`/login?next=${encodeURIComponent(slug ? `/categories/${slug}` : '/')}`);
        return;
      }
      setOpen(true);
    } catch (err) {
      console.warn('Auth check failed', err);
      router.push(`/login?next=${encodeURIComponent(slug ? `/categories/${slug}` : '/')}`);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (disabled) return;
    setLoading(true);
    try {
      await hireBuddy({ helperId, title: `Hire ${helperName}`, description: notes || `Hiring ${helperName}`, budget: Number(budget || 0) });
      setSuccess(true);
    } catch (err) {
      console.error('Hire request failed', err);
      alert('Failed to send hire request.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={handleOpen}
        disabled={disabled}
        className={className || 'rounded-md bg-emerald-500 px-3 py-2 text-sm font-medium text-white'}
      >
        {disabled ? 'Unavailable' : 'Hire me'}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />

          <div className="relative z-10 w-full max-w-lg mx-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-lg font-semibold text-slate-800 dark:text-slate-100">{helperName.split(' ').map(n=>n[0]).slice(0,2).join('')}</div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Hire {helperName}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Quickly send a hire request — they’ll see it in their inbox</div>
                  </div>
                </div>
                <button onClick={() => setOpen(false)} className="text-slate-500 hover:text-slate-700">✕</button>
              </div>

              <div className="p-6">
                {success ? (
                  <div className="text-center py-8">
                    <div className="text-2xl">🎉</div>
                    <div className="mt-4 text-lg font-semibold">Request sent</div>
                    <div className="mt-2 text-sm text-slate-500">We’ve notified {helperName}. Check your tasks for updates.</div>
                    <div className="mt-6 flex justify-center gap-3">
                      <button onClick={() => { setOpen(false); router.push(redirectAfter); }} className="px-4 py-2 rounded-md bg-emerald-500 text-white">View my tasks</button>
                      <button onClick={() => setOpen(false)} className="px-4 py-2 rounded-md border">Close</button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit}>
                    <label className="block text-sm text-slate-700 dark:text-slate-300">Budget (₹)</label>
                    <input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} className="w-full rounded-md border px-3 py-2 my-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100" />

                    <label className="block text-sm text-slate-700 dark:text-slate-300 mt-2">Notes</label>
                    <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} className="w-full rounded-md border px-3 py-2 my-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100" />

                    <div className="mt-4 flex justify-end gap-2">
                      <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 rounded-md border">Cancel</button>
                      <button type="submit" disabled={loading} className="px-4 py-2 rounded-md bg-emerald-500 text-white">{loading ? 'Sending...' : 'Send Request'}</button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
