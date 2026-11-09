import React, { useEffect, useState } from 'react';
import {
  Globe,
  Search,
  CheckCircle2,
  AlertTriangle,
  FileText,
  MapPin,
  Sparkles,
  RefreshCw,
  Plus,
  Eye,
  ExternalLink,
  BookOpen,
} from 'lucide-react';
import { adminApi } from '../services/api';

export default function SeoCmsDashboardPage() {
  const [activeTab, setActiveTab] = useState('audit');
  const [loading, setLoading] = useState(true);
  const [runningAudit, setRunningAudit] = useState(false);
  const [overview, setOverview] = useState(null);
  const [toast, setToast] = useState(null);

  // Page Config Editor State
  const [pageForm, setPageForm] = useState({
    pagePath: '/services',
    pageType: 'STATIC',
    seoTitle: 'Home & Personal Services in Noida, Ghaziabad, Delhi & Meerut | HireBuddy',
    seoDescription:
      'Explore verified home cleaning, plumbing, electrical repair, carpentry, and personal driver services on HireBuddy with upfront pricing.',
    canonicalUrl: 'https://hirebuddy.in/services',
    h1Heading: 'Trusted Home & Personal Services by Verified Helpers',
    introContent: '',
    isIndexable: true,
    publicationStatus: 'PUBLISHED',
  });

  // Service+Location Editor State
  const [slForm, setSlForm] = useState({
    id: null,
    serviceId: '',
    locationId: '',
    slugPath: '',
    seoTitle: '',
    seoDescription: '',
    h1Heading: '',
    introContent: '',
    startingPricePaise: 29900,
    isIndexable: true,
    publicationStatus: 'PUBLISHED',
  });

  // Blog Post Editor State
  const [blogForm, setBlogForm] = useState({
    slug: '',
    title: '',
    seoTitle: '',
    seoDescription: '',
    excerpt: '',
    content: '',
    category: 'Home Maintenance',
    readingTimeMinutes: 5,
    isIndexable: true,
    publicationStatus: 'PUBLISHED',
  });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchOverview = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getSeoOverview();
      setOverview(res);
    } catch (err) {
      showToast(err.message || 'Failed to load SEO overview', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const handleRunAudit = async () => {
    setRunningAudit(true);
    try {
      const res = await adminApi.runSeoAudit();
      showToast(`SEO Audit completed! Score: ${res?.audit?.score ?? 100}/100`);
      await fetchOverview();
    } catch (err) {
      showToast(err.message || 'SEO Audit failed', 'error');
    } finally {
      setRunningAudit(false);
    }
  };

  const handleSavePage = async (e) => {
    e.preventDefault();
    try {
      await adminApi.saveSeoPage(pageForm);
      showToast(`Saved SEO config for ${pageForm.pagePath}`);
      fetchOverview();
    } catch (err) {
      showToast(err.message || 'Failed to save page config', 'error');
    }
  };

  const handleSaveSlPage = async (e) => {
    e.preventDefault();
    try {
      await adminApi.saveServiceLocationPage(slForm);
      showToast(`Saved Service+Location page: /services/${slForm.slugPath}`);
      fetchOverview();
    } catch (err) {
      showToast(err.message || 'Failed to save Service+Location page', 'error');
    }
  };

  const handleSaveBlog = async (e) => {
    e.preventDefault();
    try {
      await adminApi.saveBlogPost(blogForm);
      showToast(`Saved Blog Post: /blog/${blogForm.slug}`);
      fetchOverview();
    } catch (err) {
      showToast(err.message || 'Failed to save blog post', 'error');
    }
  };

  const audit = overview?.latestAudit || {};
  const health = overview?.healthSummary || {};
  const findings = Array.isArray(audit.findings) ? audit.findings : [];

  return (
    <div className="space-y-6">
      {toast && (
        <div
          className={`fixed right-6 top-6 z-50 rounded-2xl px-5 py-3 text-sm font-bold shadow-xl ${
            toast.type === 'error'
              ? 'bg-rose-600 text-white'
              : 'bg-emerald-600 text-white'
          }`}
        >
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400 border border-emerald-500/20">
              <Globe className="h-3.5 w-3.5" /> Technical SEO & Organic Growth Engine
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-extrabold text-white">
            SEO CMS, Sitemap & Health Audit Dashboard
          </h1>
          <p className="text-sm text-slate-400">
            Manage indexable service/location landing pages, dynamic metadata, JSON-LD structured data, and automated crawl audits.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRunAudit}
            disabled={runningAudit}
            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-500 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${runningAudit ? 'animate-spin' : ''}`} />
            {runningAudit ? 'Running Audit...' : 'Run Full SEO Audit'}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-xs font-semibold text-slate-400">SEO Audit Score</p>
          <p className="mt-1 text-2xl font-extrabold text-emerald-400">
            {audit.score ?? 100}/100
          </p>
          <p className="mt-1 text-[11px] text-slate-500">Automated 9-point check</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-xs font-semibold text-slate-400">Indexable Pages</p>
          <p className="mt-1 text-2xl font-extrabold text-white">
            {health.totalIndexablePages ?? audit.indexablePages ?? 0}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">In XML Sitemap</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-xs font-semibold text-slate-400">Missing Meta Desc</p>
          <p className="mt-1 text-2xl font-extrabold text-amber-400">
            {health.missingDescriptions ?? audit.missingDescriptions ?? 0}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">Target: 0 pages</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-xs font-semibold text-slate-400">Duplicate Titles</p>
          <p className="mt-1 text-2xl font-extrabold text-rose-400">
            {health.duplicateTitles ?? audit.duplicateTitles ?? 0}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">Target: 0 duplicates</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-xs font-semibold text-slate-400">Thin Content Pages</p>
          <p className="mt-1 text-2xl font-extrabold text-amber-400">
            {health.thinContentPages ?? audit.thinContentPages ?? 0}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">Auto-set to noindex</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-xs font-semibold text-slate-400">Non-Indexed Pages</p>
          <p className="mt-1 text-2xl font-extrabold text-slate-300">
            {health.nonIndexedPages ?? audit.nonIndexedPages ?? 0}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">Draft or Noindex</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
        {[
          { id: 'audit', label: 'SEO Health & Audit Findings', icon: CheckCircle2 },
          { id: 'pages', label: 'Static & Custom Page SEO', icon: FileText },
          { id: 'service-locations', label: 'Service + City Landing Pages', icon: MapPin },
          { id: 'blogs', label: 'Blog & Content Marketing CMS', icon: BookOpen },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-12 text-center text-sm text-slate-400">
          Loading SEO inventory & audit metrics...
        </div>
      ) : (
        <>
          {/* TAB 1: AUDIT & INVENTORY */}
          {activeTab === 'audit' && (
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
                <h2 className="text-base font-bold text-white">
                  Automated SEO Audit Findings ({findings.length})
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                  Checks title/description lengths, duplicate metadata, H1 tags, canonical URLs, thin content, internal links, and JSON-LD schema.
                </p>

                {findings.length === 0 ? (
                  <div className="mt-6 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-6 text-center">
                    <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-400" />
                    <p className="mt-2 text-sm font-bold text-emerald-300">
                      All public pages passed the automated technical SEO audit!
                    </p>
                    <p className="mt-1 text-xs text-emerald-400/80">
                      Zero missing titles, zero duplicate descriptions, and valid canonical URLs across all routes.
                    </p>
                  </div>
                ) : (
                  <div className="mt-4 max-h-96 space-y-2.5 overflow-y-auto pr-1">
                    {findings.map((f, idx) => (
                      <div
                        key={idx}
                        className="flex items-start justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/70 p-3.5 text-xs"
                      >
                        <div>
                          <span
                            className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                              f.severity === 'CRITICAL'
                                ? 'bg-rose-500/20 text-rose-400'
                                : 'bg-amber-500/20 text-amber-400'
                            }`}
                          >
                            {f.severity} · {f.type}
                          </span>
                          <p className="mt-1.5 font-mono text-slate-200">{f.pagePath}</p>
                          <p className="mt-0.5 text-slate-400">{f.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Active Service & Location Inventory */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
                <h2 className="text-base font-bold text-white">
                  Live Service + Location Landing Pages ({overview?.serviceLocationPages?.length || 0})
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                  Indexable city+service combinations with verified local content and FAQs.
                </p>

                <div className="mt-4 max-h-96 space-y-2.5 overflow-y-auto pr-1">
                  {(overview?.serviceLocationPages || []).map((sl) => (
                    <div
                      key={sl.id}
                      className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-xs"
                    >
                      <div>
                        <p className="font-bold text-white">{sl.seoTitle || sl.h1Heading}</p>
                        <p className="mt-0.5 font-mono text-emerald-400">/services/{sl.slugPath}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            sl.isIndexable
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {sl.isIndexable ? 'INDEXABLE' : 'NOINDEX'}
                        </span>
                        <button
                          onClick={() => {
                            setSlForm({
                              id: sl.id,
                              serviceId: sl.serviceId,
                              locationId: sl.locationId,
                              slugPath: sl.slugPath,
                              seoTitle: sl.seoTitle || '',
                              seoDescription: sl.seoDescription || '',
                              h1Heading: sl.h1Heading || '',
                              introContent: sl.introContent || '',
                              startingPricePaise: sl.startingPricePaise || 29900,
                              isIndexable: sl.isIndexable,
                              publicationStatus: sl.publicationStatus || 'PUBLISHED',
                            });
                            setActiveTab('service-locations');
                          }}
                          className="rounded-lg bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-200 hover:bg-slate-700"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: STATIC & CUSTOM PAGE SEO + GOOGLE SERP PREVIEW */}
          {activeTab === 'pages' && (
            <div className="grid gap-6 lg:grid-cols-2">
              <form
                onSubmit={handleSavePage}
                className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-6"
              >
                <h2 className="text-base font-bold text-white">
                  Edit Page SEO Metadata & Canonical Rules
                </h2>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-300">Page Path</label>
                    <input
                      type="text"
                      value={pageForm.pagePath}
                      onChange={(e) => setPageForm({ ...pageForm, pagePath: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                      placeholder="/services"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300">Canonical URL</label>
                    <input
                      type="text"
                      value={pageForm.canonicalUrl}
                      onChange={(e) => setPageForm({ ...pageForm, canonicalUrl: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                      placeholder="https://hirebuddy.in/services"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs">
                    <label className="font-bold text-slate-300">SEO Title</label>
                    <span
                      className={
                        pageForm.seoTitle.length >= 30 && pageForm.seoTitle.length <= 65
                          ? 'text-emerald-400'
                          : 'text-amber-400'
                      }
                    >
                      {pageForm.seoTitle.length} / 60 chars
                    </span>
                  </div>
                  <input
                    type="text"
                    value={pageForm.seoTitle}
                    onChange={(e) => setPageForm({ ...pageForm, seoTitle: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                    required
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs">
                    <label className="font-bold text-slate-300">Meta Description</label>
                    <span
                      className={
                        pageForm.seoDescription.length >= 90 &&
                        pageForm.seoDescription.length <= 165
                          ? 'text-emerald-400'
                          : 'text-amber-400'
                      }
                    >
                      {pageForm.seoDescription.length} / 160 chars
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    value={pageForm.seoDescription}
                    onChange={(e) =>
                      setPageForm({ ...pageForm, seoDescription: e.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300">H1 Heading</label>
                  <input
                    type="text"
                    value={pageForm.h1Heading}
                    onChange={(e) => setPageForm({ ...pageForm, h1Heading: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                    <input
                      type="checkbox"
                      checked={pageForm.isIndexable}
                      onChange={(e) =>
                        setPageForm({ ...pageForm, isIndexable: e.target.checked })
                      }
                      className="rounded border-slate-700"
                    />
                    Allow Search Engine Indexing (index, follow)
                  </label>

                  <button
                    type="submit"
                    className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-500"
                  >
                    Save Page SEO
                  </button>
                </div>
              </form>

              {/* Google Search Snippet Preview & Existing Pages List */}
              <div className="space-y-6">
                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Google Search Snippet Preview (SERP)
                  </p>
                  <div className="mt-3 rounded-xl bg-white p-5 text-slate-900 shadow-inner">
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">
                        H
                      </span>
                      <span>hirebuddy.in</span>
                      <span>› {pageForm.pagePath.replace(/^\//, '')}</span>
                    </div>
                    <h3 className="mt-1.5 text-lg font-semibold text-[#1a0dab] hover:underline">
                      {pageForm.seoTitle || 'Page Title | HireBuddy'}
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-[#4d5156]">
                      {pageForm.seoDescription ||
                        'Enter a unique meta description to preview how this page appears in Google Search results.'}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
                  <h3 className="text-sm font-bold text-white">Configured Static & Custom Pages</h3>
                  <div className="mt-3 max-h-60 space-y-2 overflow-y-auto">
                    {(overview?.pageConfigs || []).map((p) => (
                      <div
                        key={p.id}
                        onClick={() =>
                          setPageForm({
                            pagePath: p.pagePath,
                            pageType: p.pageType || 'STATIC',
                            seoTitle: p.seoTitle || '',
                            seoDescription: p.seoDescription || '',
                            canonicalUrl: p.canonicalUrl || `https://hirebuddy.in${p.pagePath}`,
                            h1Heading: p.h1Heading || '',
                            introContent: p.introContent || '',
                            isIndexable: p.isIndexable,
                            publicationStatus: p.publicationStatus || 'PUBLISHED',
                          })
                        }
                        className="cursor-pointer rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-xs hover:border-blue-500/50"
                      >
                        <div className="flex justify-between">
                          <span className="font-mono font-bold text-emerald-400">{p.pagePath}</span>
                          <span className="text-[10px] text-slate-400">
                            {p.isIndexable ? 'INDEX' : 'NOINDEX'}
                          </span>
                        </div>
                        <p className="mt-1 truncate font-semibold text-white">{p.seoTitle}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SERVICE + LOCATION LANDING PAGES */}
          {activeTab === 'service-locations' && (
            <form
              onSubmit={handleSaveSlPage}
              className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-6"
            >
              <h2 className="text-base font-bold text-white">
                Create / Edit Service + Location SEO Landing Page
              </h2>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300">Service</label>
                  <select
                    value={slForm.serviceId}
                    onChange={(e) => setSlForm({ ...slForm, serviceId: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                    required
                  >
                    <option value="">Select Service</option>
                    {(overview?.services || []).map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.slug})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300">City / Location</label>
                  <select
                    value={slForm.locationId}
                    onChange={(e) => setSlForm({ ...slForm, locationId: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                    required
                  >
                    <option value="">Select Location</option>
                    {(overview?.locations || []).map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name} ({l.slug})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300">
                    Slug Path (e.g. home-cleaning/noida)
                  </label>
                  <input
                    type="text"
                    value={slForm.slugPath}
                    onChange={(e) => setSlForm({ ...slForm, slugPath: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                    placeholder="home-cleaning/noida"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-300">SEO Title</label>
                  <input
                    type="text"
                    value={slForm.seoTitle}
                    onChange={(e) => setSlForm({ ...slForm, seoTitle: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300">H1 Heading</label>
                  <input
                    type="text"
                    value={slForm.h1Heading}
                    onChange={(e) => setSlForm({ ...slForm, h1Heading: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300">Meta Description</label>
                <textarea
                  rows={2}
                  value={slForm.seoDescription}
                  onChange={(e) => setSlForm({ ...slForm, seoDescription: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300">
                  Local Intro & Coverage Content (min 300 chars for indexability)
                </label>
                <textarea
                  rows={4}
                  value={slForm.introContent}
                  onChange={(e) => setSlForm({ ...slForm, introContent: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                  required
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                  <input
                    type="checkbox"
                    checked={slForm.isIndexable}
                    onChange={(e) => setSlForm({ ...slForm, isIndexable: e.target.checked })}
                  />
                  Indexable in Sitemap & Google Search
                </label>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-500"
                >
                  Save Service + City Landing Page
                </button>
              </div>
            </form>
          )}

          {/* TAB 4: BLOG & CONTENT MARKETING CMS */}
          {activeTab === 'blogs' && (
            <div className="grid gap-6 lg:grid-cols-2">
              <form
                onSubmit={handleSaveBlog}
                className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-6"
              >
                <h2 className="text-base font-bold text-white">Create / Edit SEO Blog Guide</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-300">Article Title</label>
                    <input
                      type="text"
                      value={blogForm.title}
                      onChange={(e) => setBlogForm({ ...blogForm, title: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300">URL Slug</label>
                    <input
                      type="text"
                      value={blogForm.slug}
                      onChange={(e) => setBlogForm({ ...blogForm, slug: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                      placeholder="home-cleaning-checklist"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300">Meta Description</label>
                  <textarea
                    rows={2}
                    value={blogForm.seoDescription}
                    onChange={(e) => setBlogForm({ ...blogForm, seoDescription: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300">
                    Article Content (Markdown headings ## supported)
                  </label>
                  <textarea
                    rows={6}
                    value={blogForm.content}
                    onChange={(e) => setBlogForm({ ...blogForm, content: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-500"
                >
                  Publish Blog Post
                </button>
              </form>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
                <h2 className="text-base font-bold text-white">
                  Published SEO Blog Articles ({overview?.blogPosts?.length || 0})
                </h2>
                <div className="mt-4 max-h-96 space-y-2.5 overflow-y-auto">
                  {(overview?.blogPosts || []).map((b) => (
                    <div
                      key={b.id}
                      onClick={() =>
                        setBlogForm({
                          slug: b.slug,
                          title: b.title,
                          seoTitle: b.seoTitle || b.title,
                          seoDescription: b.seoDescription || b.excerpt || '',
                          excerpt: b.excerpt || '',
                          content: b.content || '',
                          category: b.category || 'Home Maintenance',
                          readingTimeMinutes: b.readingTimeMinutes || 5,
                          isIndexable: b.isIndexable,
                          publicationStatus: b.publicationStatus || 'PUBLISHED',
                        })
                      }
                      className="cursor-pointer rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 text-xs hover:border-blue-500/40"
                    >
                      <div className="flex justify-between">
                        <span className="font-bold text-white">{b.title}</span>
                        <span className="text-[10px] text-emerald-400">{b.category}</span>
                      </div>
                      <p className="mt-1 font-mono text-[11px] text-slate-400">/blog/{b.slug}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
