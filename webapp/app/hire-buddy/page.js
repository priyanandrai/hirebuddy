"use client";

import { useState } from 'react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { hireBuddy } from '../components/services/hire.service';

export default function HireBuddyPage() {
  const [form, setForm] = useState({ title: '', description: '', category: 'General', budget: '', preferredAt: '' });
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form };
      await hireBuddy(payload);
      alert('Your request has been submitted. Helpers will be notified.');
      setForm({ title: '', description: '', category: 'General', budget: '', preferredAt: '' });
    } catch (err) {
      console.error('HireBuddy request failed', err);
      alert('Failed to submit request');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-slate-950 text-slate-100 py-12">
        <div className="max-w-3xl mx-auto px-6">
          <h1 className="text-2xl font-semibold mb-4">Hire Buddy — Request Help</h1>

          <form onSubmit={handleSubmit} className="space-y-4 bg-slate-900/80 p-6 rounded-2xl border border-slate-800">
            <div>
              <label className="block text-sm font-medium">Title</label>
              <input name="title" value={form.title} onChange={handleChange} required className="mt-1 w-full rounded-md border px-3 py-2 text-sm" />
            </div>

            <div>
              <label className="block text-sm font-medium">Description</label>
              <textarea name="description" value={form.description} onChange={handleChange} rows={4} required className="mt-1 w-full rounded-md border px-3 py-2 text-sm" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium">Category</label>
                <select name="category" value={form.category} onChange={handleChange} className="mt-1 w-full rounded-md border px-3 py-2 text-sm">
                  <option>General</option>
                  <option>Shopping</option>
                  <option>Delivery</option>
                  <option>Health</option>
                  <option>Driver</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium">Budget (₹)</label>
                <input name="budget" value={form.budget} onChange={handleChange} className="mt-1 w-full rounded-md border px-3 py-2 text-sm" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium">Preferred Date/Time</label>
              <input name="preferredAt" value={form.preferredAt} onChange={handleChange} placeholder="YYYY-MM-DDTHH:MM" className="mt-1 w-full rounded-md border px-3 py-2 text-sm" />
            </div>

            <div className="flex gap-2">
              <button type="submit" disabled={loading} className="rounded-md bg-blue-600 px-4 py-2 text-white">{loading ? 'Submitting...' : 'Request Help'}</button>
              <a href="/services" className="ml-2 rounded-md border px-4 py-2 text-sm">View Services</a>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </>
  );
}
