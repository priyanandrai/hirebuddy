"use client";

import { useEffect, useState } from "react";
import { getPendingIdSubmissions, verifyUserId } from "@/app/components/services/user.service";

export default function VerifyIdsAdminPage() {
  const [adminToken, setAdminToken] = useState("");
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(false);

  async function loadPending() {
    setLoading(true);
    try {
      const res = await getPendingIdSubmissions(adminToken);
      setPending(res.data || []);
    } catch (err) {
      console.error(err);
      alert('Failed to load pending submissions. Check admin token and auth.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (adminToken) loadPending();
  }, [adminToken]);

  async function handleAction(id, status) {
    const notes = status === 'REJECTED' ? prompt('Reason for rejection (optional)') : 'Verified by admin';
    try {
      await verifyUserId(id, { status, notes, adminToken });
      alert(`User ${status.toLowerCase()}`);
      loadPending();
    } catch (err) {
      console.error(err);
      alert('Action failed');
    }
  }

  return (
    <main className="min-h-screen p-6 bg-gray-50">
      <h1 className="text-xl font-bold mb-4">ID Verification (Admin)</h1>

      <div className="mb-4 flex gap-2">
        <input
          value={adminToken}
          onChange={(e) => setAdminToken(e.target.value)}
          placeholder="Admin token"
          className="rounded-md border px-3 py-2 w-80"
        />
        <button onClick={loadPending} className="rounded-md bg-blue-600 text-white px-4 py-2">Load</button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="space-y-4">
          {pending.length === 0 && <p>No pending submissions.</p>}

          {pending.map((u) => (
            <div key={u.id} className="rounded-lg bg-white p-4 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-4">
                <img src={u.image || '/default-avatar.png'} alt="avatar" className="h-12 w-12 rounded-full object-cover" />
                <div>
                  <div className="font-semibold">{u.name || '—'}</div>
                  <div className="text-sm text-gray-600">{u.phone || ''} • {u.city || ''}</div>
                  <a href={u.idDocumentUrl} target="_blank" rel="noreferrer" className="text-sm text-blue-600">Open ID document</a>
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={() => handleAction(u.id, 'VERIFIED')} className="rounded-md bg-green-600 text-white px-3 py-2">Verify</button>
                <button onClick={() => handleAction(u.id, 'REJECTED')} className="rounded-md bg-red-600 text-white px-3 py-2">Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
