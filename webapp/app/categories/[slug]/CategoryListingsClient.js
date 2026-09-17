"use client";

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import HireButton from '../../components/hire/HireButton';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080').replace(/\/$/, '');

export default function CategoryListingsClient({ title, slug }) {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [helpers, setHelpers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [limit] = useState(12);
  const [total, setTotal] = useState(0);
  const [sort, setSort] = useState('relevance');

  const debounceRef = useRef(null);

  async function fetchHelpers() {
    setLoading(true);
    try {
      const q = [title, query].filter(Boolean).join(' ');
      const res = await fetch(`${API_BASE}/api/search/helpers?q=${encodeURIComponent(q)}&city=${encodeURIComponent(location)}&limit=${limit}&offset=${page * limit}`);
      const j = await res.json();
      const list = j.helpers || [];
      setTotal(j.total || list.length);

      if (sort === 'price_low') {
        list.sort((a, b) => (a.price || 0) - (b.price || 0));
      } else if (sort === 'price_high') {
        list.sort((a, b) => (b.price || 0) - (a.price || 0));
      }

      setHelpers(list.map((h, idx) => {
        const rawSkills = h.skills ?? h.tags ?? '';
        const tags = Array.isArray(rawSkills)
          ? rawSkills
          : (rawSkills ? String(rawSkills).split(',').map(s => s.trim()).filter(Boolean) : []);

        return {
          id: h.id || `${h.name || 'h'}-${idx}`,
          name: h.name || h.fullName || 'Helper',
          rating: h.rating || 4.2,
          reviews: h.reviews || 0,
          location: h.city || h.location || 'Unknown',
          price: h.price || h.hourlyRate || 200,
          tags,
          available: h.isAvailable ?? h.available ?? true,
        };
      }));
    } catch (e) {
      console.error('Search fetch failed', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // debounce
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(0);
      fetchHelpers();
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [query, location, title, sort]);

  useEffect(() => {
    fetchHelpers();
  }, [page]);

  

  return (
    <>
      <div className="mb-6">
        <div className="mt-6 flex gap-4 items-center">
          <div className="flex-1">
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search cleaners, services, or keywords..." className="w-full rounded-xl bg-slate-900/80 border border-slate-800 px-4 py-3 text-sm text-slate-300" />
          </div>
          <div className="w-72">
            <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Enter your location" className="w-full rounded-xl bg-slate-900/80 border border-slate-800 px-4 py-3 text-sm text-slate-300" />
          </div>
          <div>
            <select value={sort} onChange={(e) => setSort(e.target.value)} className="rounded-xl bg-slate-900/80 border border-slate-800 px-3 py-2 text-sm text-slate-300">
              <option value="relevance">Sort by: Relevance</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      <div className="mb-4 text-slate-300">{total || helpers.length} Helpers found</div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading && <div className="text-slate-400">Loading...</div>}
        {!loading && helpers.map((h) => (
          <article key={h.id} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-start gap-4">
              <div className="h-16 w-16 rounded-full bg-slate-800 flex items-center justify-center text-white">{h.name.split(' ').map(n=>n[0]).slice(0,2).join('')}</div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{h.name}</h3>
                  <span className={`text-sm ${h.available ? 'text-emerald-400' : 'text-slate-400'}`}>{h.available ? 'Available' : 'Busy'}</span>
                </div>
                <div className="text-sm text-slate-300 mt-1">{h.rating} ★ ({h.reviews} reviews) • {h.location}</div>
                <p className="text-sm text-slate-300 mt-3 line-clamp-3">Experienced professional providing reliable {title.toLowerCase()} services.</p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {(h.tags || []).slice(0,3).map(t => (<span key={t} className="text-xs bg-slate-800/60 rounded-full px-3 py-1 text-slate-300">{t}</span>))}
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <div className="text-lg font-semibold">₹{h.price} <span className="text-sm text-slate-300">/ hour</span></div>
                  <div className="flex items-center gap-2">
                    <Link href={`#/helpers/${h.id}`} className="rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-sm font-medium text-white">View Profile</Link>
                    <HireButton helperId={h.id} helperName={h.name} defaultBudget={h.price} slug={slug} disabled={!h.available} />
                  </div>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-8 flex items-center justify-center gap-3">
        <button onClick={() => setPage(Math.max(0, page - 1))} className="rounded-md px-3 py-2 bg-slate-800 border border-slate-700">◀</button>
        <div className="inline-flex items-center gap-2">
          <button className="px-3 py-2 rounded-full bg-emerald-500">{page + 1}</button>
          <button onClick={() => setPage(page + 1)} className="px-3 py-2 rounded-md bg-slate-800">Next</button>
        </div>
        <button onClick={() => setPage(page + 1)} className="rounded-md px-3 py-2 bg-slate-800 border border-slate-700">▶</button>
      </div>
    </>
  );
}
