import React, { useState, useEffect } from 'react';
import {
  FolderTree,
  Search,
  Sparkles,
  Layers,
  CheckCircle,
  RefreshCw,
  Eye,
  Plus,
} from 'lucide-react';
import { adminApi } from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import Modal from '../components/common/Modal';

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);

  const fetchCategories = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const res = await adminApi.getCategories();
      setCategories(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error('Failed to load categories:', err);
      setError('Could not load categories from database.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const filtered = categories.filter((c) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    return (
      c.name?.toLowerCase().includes(term) ||
      c.slug?.toLowerCase().includes(term) ||
      c.description?.toLowerCase().includes(term) ||
      (Array.isArray(c.subServices) && c.subServices.some((s) => s.toLowerCase().includes(term)))
    );
  });

  const totalSubServices = categories.reduce(
    (sum, c) => sum + (Array.isArray(c.subServices) ? c.subServices.length : 0),
    0
  );
  const popularCount = categories.filter((c) => c.isPopular).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <FolderTree className="w-6 h-6 text-emerald-400" />
            Service Categories
          </h1>
          <p className="text-sm text-slate-400">
            Configure platform services, taxonomies, and sub-service offerings.
          </p>
        </div>

        <button
          onClick={() => fetchCategories(true)}
          disabled={refreshing || loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-800 text-slate-200 hover:bg-slate-700 rounded-xl text-sm font-medium border border-slate-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-emerald-400' : ''}`} />
          Refresh
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Categories</p>
          <p className="text-2xl font-bold text-white mt-1">{categories.length}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Sub-Services</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{totalSubServices}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 col-span-2 md:col-span-1">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Featured on Home</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">{popularCount}</p>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search category by name, slug, or specific sub-service..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Categories Grid */}
      {loading ? (
        <div className="p-16 flex justify-center bg-slate-900 border border-slate-800 rounded-2xl">
          <LoadingSpinner text="Loading categories..." size="lg" />
        </div>
      ) : error ? (
        <div className="p-8 bg-red-950/20 border border-red-900/40 rounded-2xl text-center">
          <p className="text-red-400 text-sm font-medium">{error}</p>
          <button
            onClick={() => fetchCategories()}
            className="mt-3 px-4 py-1.5 bg-red-900/30 text-red-300 rounded-lg text-xs font-semibold hover:bg-red-900/50"
          >
            Try Again
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FolderTree}
          title="No categories found"
          description="Try a different search keyword."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((cat) => {
            const subServices = Array.isArray(cat.subServices) ? cat.subServices : [];

            return (
              <div
                key={cat.id || cat.slug}
                onClick={() => setSelectedCategory(cat)}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 flex flex-col justify-between transition-all hover:shadow-lg hover:shadow-black/40 cursor-pointer group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-2xl border border-slate-700/80 group-hover:scale-105 transition-transform">
                      {cat.icon || '🛠️'}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {cat.isPopular && (
                        <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-md text-[10px] font-bold flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> Popular
                        </span>
                      )}
                      <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md text-[10px] font-bold">
                        Live
                      </span>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-white mt-4 group-hover:text-emerald-400 transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                    {cat.description || 'Verified local service category.'}
                  </p>

                  <div className="mt-4 pt-4 border-t border-slate-800/80">
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">
                      Sub-Services ({subServices.length})
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {subServices.slice(0, 4).map((sub, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 bg-slate-950 text-slate-300 rounded text-[11px] font-medium border border-slate-800"
                        >
                          {sub}
                        </span>
                      ))}
                      {subServices.length > 4 && (
                        <span className="px-1.5 py-0.5 text-slate-500 text-[11px]">
                          +{subServices.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
                  <span className="font-mono text-[10px]">slug: {cat.slug}</span>
                  <span className="text-emerald-400 font-semibold group-hover:underline">
                    View Details &rarr;
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Category Modal */}
      {selectedCategory && (
        <Modal
          isOpen={!!selectedCategory}
          onClose={() => setSelectedCategory(null)}
          title="Category Information"
          size="md"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-slate-950 rounded-xl border border-slate-800">
              <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center text-3xl border border-slate-700">
                {selectedCategory.icon || '🛠️'}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{selectedCategory.name}</h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">/{selectedCategory.slug}</p>
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs">
              <p className="text-slate-400 uppercase font-semibold text-[10px] tracking-wider mb-1">
                Description
              </p>
              <p className="text-slate-200">{selectedCategory.description}</p>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <p className="text-xs font-semibold text-slate-300">Included Sub-Services</p>
              <div className="flex flex-wrap gap-2">
                {(Array.isArray(selectedCategory.subServices) ? selectedCategory.subServices : []).map(
                  (sub, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 bg-slate-900 text-emerald-400 border border-slate-800 rounded-lg text-xs font-medium"
                    >
                      {sub}
                    </span>
                  )
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setSelectedCategory(null)}
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
