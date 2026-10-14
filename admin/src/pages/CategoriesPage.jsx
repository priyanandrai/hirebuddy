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
  Trash2,
  Star,
} from 'lucide-react';
import { adminApi } from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import Modal from '../components/common/Modal';

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Create Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newCat, setNewCat] = useState({
    name: '',
    slug: '',
    description: '',
    icon: '🛠️',
    subServices: '',
    isPopular: true,
  });

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

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCat.name.trim()) return alert('Category name is required');
    setActionLoading(true);

    try {
      const subServicesArray = newCat.subServices
        ? newCat.subServices.split(',').map((s) => s.trim()).filter(Boolean)
        : [];

      const payload = {
        name: newCat.name.trim(),
        slug:
          newCat.slug.trim() ||
          newCat.name
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, ''),
        description: newCat.description.trim() || undefined,
        icon: newCat.icon.trim() || '🛠️',
        subServices: subServicesArray,
        isPopular: newCat.isPopular,
      };

      const res = await adminApi.createCategory(payload);
      if (res?.category) {
        setCategories((prev) => [...prev, res.category]);
      } else {
        await fetchCategories();
      }
      setCreateModalOpen(false);
      setNewCat({
        name: '',
        slug: '',
        description: '',
        icon: '🛠️',
        subServices: '',
        isPopular: true,
      });
      alert('Category created successfully in database!');
    } catch (err) {
      alert(err.message || 'Failed to create category');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCategory = async (catId) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    setActionLoading(true);
    try {
      await adminApi.deleteCategory(catId);
      setCategories((prev) => prev.filter((c) => c.id !== catId));
      if (selectedCategory?.id === catId) setSelectedCategory(null);
      alert('Category deleted successfully');
    } catch (err) {
      alert(err.message || 'Failed to delete category');
    } finally {
      setActionLoading(false);
    }
  };

  const handleTogglePopular = async (cat) => {
    setActionLoading(true);
    try {
      const updated = !cat.isPopular;
      await adminApi.updateCategory(cat.id, { isPopular: updated });
      setCategories((prev) =>
        prev.map((c) => (c.id === cat.id ? { ...c, isPopular: updated } : c))
      );
      if (selectedCategory?.id === cat.id) {
        setSelectedCategory((prev) => ({ ...prev, isPopular: updated }));
      }
    } catch (err) {
      alert(err.message || 'Failed to update category');
    } finally {
      setActionLoading(false);
    }
  };

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

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-emerald-950/30"
          >
            <Plus className="w-4 h-4" />
            Add Category
          </button>

          <button
            onClick={() => fetchCategories(true)}
            disabled={refreshing || loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-800 text-slate-200 hover:bg-slate-700 rounded-xl text-sm font-medium border border-slate-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-emerald-400' : ''}`} />
            Refresh
          </button>
        </div>
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
          description="Try a different search keyword or create a new category."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((cat) => {
            const subServices = Array.isArray(cat.subServices) ? cat.subServices : [];

            return (
              <div
                key={cat.id || cat.slug}
                onClick={() => setSelectedCategory(cat)}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 flex flex-col justify-between transition-all hover:shadow-lg hover:shadow-black/40 cursor-pointer group relative"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-2xl border border-slate-700/80 group-hover:scale-105 transition-transform">
                      {cat.icon || '🛠️'}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTogglePopular(cat);
                        }}
                        disabled={actionLoading}
                        title={cat.isPopular ? 'Featured on home page' : 'Click to feature'}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 border transition-colors ${
                          cat.isPopular
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                            : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-amber-400'
                        }`}
                      >
                        <Sparkles className="w-3 h-3" />
                        {cat.isPopular ? 'Popular' : 'Make Popular'}
                      </button>

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
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCategory(cat.id);
                      }}
                      disabled={actionLoading}
                      title="Delete category"
                      className="p-1 hover:bg-rose-500/20 rounded-lg text-slate-500 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-emerald-400 font-semibold group-hover:underline">
                      Details &rarr;
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Category Details Modal */}
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
                <div className="flex items-center gap-2 mt-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      selectedCategory.isPopular
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {selectedCategory.isPopular ? 'Featured on Home' : 'Not Featured'}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs">
              <p className="text-slate-400 uppercase font-semibold text-[10px] tracking-wider mb-1">
                Description
              </p>
              <p className="text-slate-200">{selectedCategory.description || 'No description provided.'}</p>
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

            {/* Admin Management Section */}
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-white">Homepage Spotlight</p>
                <p className="text-[11px] text-slate-400">Display this category in the popular section</p>
              </div>
              <button
                type="button"
                onClick={() => handleTogglePopular(selectedCategory)}
                disabled={actionLoading}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedCategory.isPopular
                    ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                }`}
              >
                {selectedCategory.isPopular ? 'Featured ★' : 'Feature on Home'}
              </button>
            </div>

            <div className="flex justify-between items-center gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => handleDeleteCategory(selectedCategory.id)}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-900/50 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Category
              </button>

              <button
                type="button"
                onClick={() => setSelectedCategory(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Create Category Modal */}
      {createModalOpen && (
        <Modal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          title="Create New Service Category"
          size="md"
        >
          <form onSubmit={handleCreateCategory} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Category Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Appliance Repair"
                value={newCat.name}
                onChange={(e) => setNewCat({ ...newCat, name: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  URL Slug (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. appliance-repair"
                  value={newCat.slug}
                  onChange={(e) => setNewCat({ ...newCat, slug: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Icon (Emoji)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 🛠️ or 🧺"
                  value={newCat.icon}
                  onChange={(e) => setNewCat({ ...newCat, icon: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Description
              </label>
              <textarea
                rows={2}
                placeholder="Short description for this category..."
                value={newCat.description}
                onChange={(e) => setNewCat({ ...newCat, description: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Sub-Services (comma-separated)
              </label>
              <input
                type="text"
                placeholder="e.g. AC Repair, Washing Machine, Refrigerator"
                value={newCat.subServices}
                onChange={(e) => setNewCat({ ...newCat, subServices: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="isPopular"
                checked={newCat.isPopular}
                onChange={(e) => setNewCat({ ...newCat, isPopular: e.target.checked })}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-slate-950 border-slate-800"
              />
              <label htmlFor="isPopular" className="text-xs text-slate-300 font-medium cursor-pointer">
                Feature on Homepage (Popular Category)
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {actionLoading ? 'Creating...' : 'Create Category'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
