"use client";

import { useEffect, useState, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import HelperCard from '../../components/ui/HelperCard';
import { CATEGORIES, slugify } from '../../components/category/categories';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080').replace(/\/$/, '');

const POPULAR_LOCATIONS = [
  "All",
  "Modipuram",
  "Meerut",
  "Shastri Nagar",
  "Kankerkhera",
];

export default function CategoryListingsClient({ category }) {
  const router = useRouter();

  // Filter States
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [selectedSubServices, setSelectedSubServices] = useState([]);
  const [availableOnly, setAvailableOnly] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [maxPrice, setMaxPrice] = useState('');
  const [sort, setSort] = useState('relevance');

  // Listings State
  const [helpers, setHelpers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const debounceRef = useRef(null);

  // Sub-services list from category definition
  const subServices = category?.subServices || [];

  // Toggle sub-service filter
  const toggleSubService = (service) => {
    setSelectedSubServices((prev) =>
      prev.includes(service)
        ? prev.filter((s) => s !== service)
        : [...prev, service]
    );
  };

  // Reset all filters
  const resetFilters = () => {
    setQuery('');
    setLocation('');
    setSelectedSubServices([]);
    setAvailableOnly(false);
    setVerifiedOnly(false);
    setMinRating(0);
    setMaxPrice('');
    setSort('relevance');
  };

  // Fetch helpers from backend API
  const fetchHelpers = async () => {
    setLoading(true);
    setError(null);
    try {
      // Build search query: combine category name + user text query
      const searchTerms = [category?.name, query].filter(Boolean).join(' ');

      const params = new URLSearchParams();
      if (searchTerms.trim()) params.append('q', searchTerms.trim());
      if (location && location !== 'All') params.append('city', location.trim());
      if (availableOnly) params.append('isAvailable', 'true');
      if (verifiedOnly) params.append('isVerified', 'true');
      if (minRating > 0) params.append('minRating', String(minRating));
      if (maxPrice) params.append('maxPrice', String(maxPrice));
      if (sort && sort !== 'relevance') params.append('sort', sort);
      params.append('limit', '40');

      const res = await fetch(`${API_BASE}/api/search/helpers?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`API responded with ${res.status}`);
      }
      const data = await res.json();
      const list = data.helpers || [];

      // Normalize helper structure
      const normalized = list.map((h, idx) => {
        const rawSkills = h.skills ?? h.tags ?? '';
        const tags = Array.isArray(rawSkills)
          ? rawSkills
          : (rawSkills ? String(rawSkills).split(',').map((s) => s.trim()).filter(Boolean) : []);

        const rawPrice = h.hourlyRate ?? h.price;
        const normalizedPrice = rawPrice ? (rawPrice > 1000 ? Math.round(rawPrice / 100) : rawPrice) : 200;

        return {
          id: h.id || `h-${idx}`,
          name: h.name || h.fullName || 'Helper',
          image: h.image || null,
          rating: Number(h.averageRating ?? h.rating ?? 4.8),
          totalReviews: Number(h.totalReviews ?? h.reviews ?? 0),
          city: h.city || h.location || 'Local Area',
          price: normalizedPrice,
          hourlyRate: normalizedPrice,
          skills: tags,
          isAvailable: h.isAvailable ?? h.available ?? true,
          isVerified: Boolean(h.isVerified ?? (h.idVerificationStatus === 'VERIFIED')),
          phone: h.phone || null,
          experience: h.experience || 3,
        };
      });

      setHelpers(normalized);
    } catch (err) {
      console.error('Failed to fetch helpers:', err);
      setError('Unable to load helpers right now. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Debounced fetch on filter changes
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchHelpers();
    }, 250);

    return () => clearTimeout(debounceRef.current);
  }, [category?.name, query, location, availableOnly, verifiedOnly, minRating, maxPrice, sort]);

  // Client-side refinement: filter by selected sub-services
  const filteredHelpers = useMemo(() => {
    if (selectedSubServices.length === 0) return helpers;

    return helpers.filter((helper) => {
      const helperSkillsLower = (helper.skills || []).map((s) => s.toLowerCase());
      return selectedSubServices.some((sub) =>
        helperSkillsLower.some((skill) => skill.includes(sub.toLowerCase()) || sub.toLowerCase().includes(skill))
      );
    });
  }, [helpers, selectedSubServices]);

  // Count active filters
  const activeFilterCount =
    (query ? 1 : 0) +
    (location && location !== 'All' ? 1 : 0) +
    selectedSubServices.length +
    (availableOnly ? 1 : 0) +
    (verifiedOnly ? 1 : 0) +
    (minRating > 0 ? 1 : 0) +
    (maxPrice ? 1 : 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* Sidebar Filters */}
      <aside className="lg:col-span-1">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl sticky top-24">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>⚡</span> Filters
              {activeFilterCount > 0 && (
                <span className="text-xs bg-emerald-500 text-white font-semibold px-2 py-0.5 rounded-full">
                  {activeFilterCount}
                </span>
              )}
            </h3>
            {activeFilterCount > 0 && (
              <button
                onClick={resetFilters}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
              >
                Reset All
              </button>
            )}
          </div>

          {/* Sub-Services Filter */}
          {subServices.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-slate-200 mb-3 flex items-center justify-between">
                <span>Specialties</span>
                {selectedSubServices.length > 0 && (
                  <span className="text-xs text-slate-400 font-normal">
                    {selectedSubServices.length} selected
                  </span>
                )}
              </h4>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1 text-sm">
                {subServices.map((service) => {
                  const isChecked = selectedSubServices.includes(service);
                  return (
                    <label
                      key={service}
                      className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors ${
                        isChecked
                          ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                          : 'text-slate-300 hover:bg-slate-800/60'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleSubService(service)}
                        className="rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900"
                      />
                      <span className="text-xs select-none">{service}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Availability & Verification Toggles */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <h4 className="text-sm font-semibold text-slate-200">Helper Status</h4>

            <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={availableOnly}
                onChange={(e) => setAvailableOnly(e.target.checked)}
                className="rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900"
              />
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Available Now Only
              </span>
            </label>

            <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={verifiedOnly}
                onChange={(e) => setVerifiedOnly(e.target.checked)}
                className="rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900"
              />
              <span className="flex items-center gap-1.5">
                <span className="text-emerald-400 font-bold">✓</span>
                Verified ID Only
              </span>
            </label>
          </div>

          {/* Minimum Rating */}
          <div className="pt-3 border-t border-slate-800">
            <h4 className="text-sm font-semibold text-slate-200 mb-2">Customer Rating</h4>
            <div className="grid grid-cols-3 gap-1.5 text-xs">
              {[
                { label: 'All', val: 0 },
                { label: '★ 4.5+', val: 4.5 },
                { label: '★ 4.8+', val: 4.8 },
              ].map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => setMinRating(item.val)}
                  className={`py-1.5 px-2 rounded-lg font-medium transition-all ${
                    minRating === item.val
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Max Hourly Rate */}
          <div className="pt-3 border-t border-slate-800">
            <h4 className="text-sm font-semibold text-slate-200 mb-2">Max Hourly Rate</h4>
            <div className="grid grid-cols-4 gap-1 text-xs">
              {[
                { label: 'Any', val: '' },
                { label: '₹200', val: '200' },
                { label: '₹300', val: '300' },
                { label: '₹400', val: '400' },
              ].map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => setMaxPrice(item.val)}
                  className={`py-1.5 rounded-lg font-medium transition-all text-center ${
                    maxPrice === item.val
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Other Categories Switcher */}
          <div className="pt-3 border-t border-slate-800">
            <h4 className="text-xs uppercase tracking-wider font-semibold text-slate-400 mb-2">
              Browse Other Services
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.filter((c) => slugify(c) !== category?.slug).slice(0, 5).map((c) => (
                <Link
                  key={c}
                  href={`/categories/${slugify(c)}`}
                  className="text-xs bg-slate-950/70 hover:bg-slate-800 text-slate-400 hover:text-emerald-300 px-2.5 py-1 rounded-md border border-slate-800 transition-colors"
                >
                  {c}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Listings Column */}
      <section className="lg:col-span-3 space-y-6">
        {/* Search & Location Bar */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Keyword Search */}
            <div className="flex-1 relative">
              <span className="absolute inset-y-0 left-3.5 flex items-center text-slate-400 pointer-events-none text-sm">
                🔍
              </span>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Search ${category?.name || 'helpers'} (e.g. name, skill, keyword)...`}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm text-slate-200 placeholder-slate-500 transition-all outline-none"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute inset-y-0 right-3 flex items-center text-xs text-slate-400 hover:text-slate-200"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Location Filter */}
            <div className="sm:w-64 relative">
              <span className="absolute inset-y-0 left-3.5 flex items-center text-slate-400 pointer-events-none text-sm">
                📍
              </span>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Enter city or area..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm text-slate-200 placeholder-slate-500 transition-all outline-none"
              />
              {location && (
                <button
                  onClick={() => setLocation('')}
                  className="absolute inset-y-0 right-3 flex items-center text-xs text-slate-400 hover:text-slate-200"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Sort Selector */}
            <div className="sm:w-48">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-950/70 border border-slate-800 text-sm text-slate-200 focus:border-emerald-500 outline-none cursor-pointer"
              >
                <option value="relevance">Sort: Relevance</option>
                <option value="rating_high">Highest Rated</option>
                <option value="reviews_high">Most Reviews</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
              </select>
            </div>
          </div>

          {/* Quick Location Chips */}
          <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto text-xs">
            <span className="text-slate-400 text-[11px] uppercase tracking-wider font-semibold whitespace-nowrap">
              Quick Locations:
            </span>
            {POPULAR_LOCATIONS.map((loc) => {
              const isSelected = (loc === 'All' && !location) || location === loc;
              return (
                <button
                  key={loc}
                  onClick={() => setLocation(loc === 'All' ? '' : loc)}
                  className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${
                    isSelected
                      ? 'bg-emerald-500 text-white font-medium'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {loc}
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Filter Chips & Helper Count Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-slate-300 text-sm font-medium flex items-center gap-2">
            <span>
              {loading
                ? 'Searching helpers...'
                : `${filteredHelpers.length} Helper${filteredHelpers.length === 1 ? '' : 's'} available`}
            </span>
            {category?.name && (
              <span className="text-slate-500 font-normal">
                in {category.name}
              </span>
            )}
          </div>

          {/* Active Filter Chips */}
          {activeFilterCount > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap text-xs">
              {query && (
                <span className="inline-flex items-center gap-1 bg-slate-800 text-slate-300 px-2.5 py-1 rounded-full border border-slate-700">
                  "{query}"
                  <button onClick={() => setQuery('')} className="hover:text-white">✕</button>
                </span>
              )}
              {location && (
                <span className="inline-flex items-center gap-1 bg-slate-800 text-slate-300 px-2.5 py-1 rounded-full border border-slate-700">
                  📍 {location}
                  <button onClick={() => setLocation('')} className="hover:text-white">✕</button>
                </span>
              )}
              {availableOnly && (
                <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-500/30">
                  Available Now
                  <button onClick={() => setAvailableOnly(false)} className="hover:text-white">✕</button>
                </span>
              )}
              {verifiedOnly && (
                <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-500/30">
                  ✓ Verified
                  <button onClick={() => setVerifiedOnly(false)} className="hover:text-white">✕</button>
                </span>
              )}
              {minRating > 0 && (
                <span className="inline-flex items-center gap-1 bg-amber-500/20 text-amber-300 px-2.5 py-1 rounded-full border border-amber-500/30">
                  ★ {minRating}+
                  <button onClick={() => setMinRating(0)} className="hover:text-white">✕</button>
                </span>
              )}
              {maxPrice && (
                <span className="inline-flex items-center gap-1 bg-slate-800 text-slate-300 px-2.5 py-1 rounded-full border border-slate-700">
                  ≤ ₹{maxPrice}/hr
                  <button onClick={() => setMaxPrice('')} className="hover:text-white">✕</button>
                </span>
              )}
              {selectedSubServices.map((sub) => (
                <span
                  key={sub}
                  className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-500/30"
                >
                  {sub}
                  <button onClick={() => toggleSubService(sub)} className="hover:text-white">✕</button>
                </span>
              ))}
              <button
                onClick={resetFilters}
                className="text-xs text-rose-400 hover:text-rose-300 ml-1 underline cursor-pointer"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Listings Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 h-64 animate-pulse space-y-4"
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-slate-800" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-800 rounded w-3/4" />
                    <div className="h-3 bg-slate-800 rounded w-1/2" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-slate-800 rounded w-full" />
                  <div className="h-3 bg-slate-800 rounded w-5/6" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-slate-900/80 border border-rose-900/40 rounded-2xl p-8 text-center">
            <p className="text-rose-400 text-sm mb-3">{error}</p>
            <button
              onClick={fetchHelpers}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
            >
              Retry Search
            </button>
          </div>
        ) : filteredHelpers.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center max-w-lg mx-auto space-y-4">
            <div className="text-4xl">🔍</div>
            <h3 className="text-lg font-bold text-white">No helpers found</h3>
            <p className="text-slate-400 text-sm">
              We couldn't find any helpers matching your exact filter criteria in {category?.name || 'this category'}.
            </p>
            <div className="pt-2">
              <button
                onClick={resetFilters}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-medium text-sm transition-colors shadow-lg shadow-emerald-500/20"
              >
                Reset All Filters
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredHelpers.map((h) => (
              <div key={h.id} className="h-full">
                <HelperCard
                  helper={h}
                  onViewProfile={(helper) => router.push(`/helpers/${helper.id}`)}
                />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
