import React, { useEffect, useState } from 'react';
import {
  Globe,
  CheckCircle2,
  FileText,
  MapPin,
  RefreshCw,
  BookOpen,
  Download,
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
    path: '/services',
    pageType: 'STATIC',
    seoTitle: 'All Home Services — Cleaning, Plumber, Electrician, Carpenter & Driver | HireBuddy',
    metaDescription:
      'Explore all verified home and personal services on HireBuddy including Home Cleaning, Plumber, Electrician, Carpenter and Personal Driver bookings.',
    canonicalUrl: 'https://hirebuddy.in/services',
    h1Heading: 'Explore Verified Home & Personal Services on HireBuddy',
    introContent: '',
    isIndexable: true,
    publicationStatus: 'PUBLISHED',
  });

  // Service+Location Editor State
  const [slForm, setSlForm] = useState({
    serviceSlug: 'home-cleaning',
    locationSlug: 'noida',
    serviceName: 'Home Cleaning',
    locationName: 'Noida',
    seoTitle: 'Home Cleaning in Noida | HireBuddy',
    metaDescription:
      'Book trusted home cleaning professionals in Noida. Compare available services, check pricing and schedule your cleaning service with HireBuddy.',
    h1Heading: 'Professional Home Cleaning Services in Noida',
    introContent: '',
    localGuideContent: '',
    startingPricePaise: 34900,
    availableHelpersCount: 15,
    isIndexable: true,
    publicationStatus: 'PUBLISHED',
  });

  // Blog Post Editor State
  const [blogForm, setBlogForm] = useState({
    slug: '',
    title: '',
    seoTitle: '',
    metaDescription: '',
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
      const score = res?.report?.auditScore ?? res?.audit?.auditScore ?? 100;
      showToast(`SEO Audit completed! Score: ${score}/100`);
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
      showToast(`Saved SEO config for ${pageForm.path}`);
      fetchOverview();
    } catch (err) {
      showToast(err.message || 'Failed to save page config', 'error');
    }
  };

  const handleSaveSlPage = async (e) => {
    e.preventDefault();
    try {
      await adminApi.saveServiceLocationPage(slForm);
      showToast(`Saved Service+Location page: /services/${slForm.serviceSlug}/${slForm.locationSlug}`);
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
  const pageFindings = Array.isArray(audit.pageFindings) ? audit.pageFindings : [];
  const findingsWithIssues = pageFindings.filter(
    (p) => (p.issues && p.issues.length > 0) || (p.warnings && p.warnings.length > 0)
  );
  const staticPages = overview?.staticPages || overview?.pageConfigs || [];

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
          <a
            href={adminApi.exportCsvUrl('/seo/admin/overview')}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-800"
          >
            <Download className="h-4 w-4" />
            Export Audit CSV
          </a>
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
            {audit.auditScore ?? health.auditScore ?? 100}/100
          </p>
          <p className="mt-1 text-[11px] text-slate-500">Automated 10-point check</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-xs font-semibold text-slate-400">Indexable Pages</p>
          <p className="mt-1 text-2xl font-extrabold text-white">
            {audit.totalIndexablePages ?? health.totalIndexablePages ?? 0}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">In XML Sitemap</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-xs font-semibold text-slate-400">Missing Metadata</p>
          <p className="mt-1 text-2xl font-extrabold text-amber-400">
            {audit.missingMetadataCount ?? health.missingDescriptions ?? 0}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">Target: 0 pages</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-xs font-semibold text-slate-400">Duplicate Titles</p>
          <p className="mt-1 text-2xl font-extrabold text-rose-400">
            {audit.duplicateTitlesCount ?? health.duplicateTitles ?? 0}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">Target: 0 duplicates</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-xs font-semibold text-slate-400">Thin Content Pages</p>
          <p className="mt-1 text-2xl font-extrabold text-amber-400">
            {audit.thinContentCount ?? health.thinContentPages ?? 0}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">Auto-set to noindex</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-xs font-semibold text-slate-400">Non-Indexed Pages</p>
          <p className="mt-1 text-2xl font-extrabold text-slate-300">
            {audit.totalNoindexPages ?? health.nonIndexedPages ?? 0}
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
                  Automated SEO Audit Findings ({pageFindings.length} Audited Pages)
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                  Checks title/description lengths, duplicate metadata, H1 tags, canonical URLs, thin content, internal links, and JSON-LD schema.
                </p>

                {findingsWithIssues.length === 0 ? (
                  <div className="mt-6 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-6 text-center">
                    <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-400" />
                    <p className="mt-2 text-sm font-bold text-emerald-300">
                      All {pageFindings.length} public pages passed the automated technical SEO audit!
                    </p>
                    <p className="mt-1 text-xs text-emerald-400/80">
                      Zero missing titles, zero duplicate descriptions, and valid canonical URLs across all routes.
                    </p>
                  </div>
                ) : (
                  <div className="mt-4 max-h-96 space-y-2.5 overflow-y-auto pr-1">
                    {findingsWithIssues.map((f, idx) => (
                      <div
                        key={idx}
                        className="flex items-start justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/70 p-3.5 text-xs"
                      >
                        <div>
                          <span
                            className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                              f.issues?.length > 0
                                ? 'bg-rose-500/20 text-rose-400'
                                : 'bg-amber-500/20 text-amber-400'
                            }`}
                          >
                            {f.status} · {f.type}
                          </span>
                          <p className="mt-1.5 font-mono text-slate-200">{f.path}</p>
                          <p className="mt-0.5 text-slate-400">
                            {[...(f.issues || []), ...(f.warnings || [])].join(' • ')}
                          </p>
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
                        <p className="mt-0.5 font-mono text-emerald-400">
                          /services/{sl.serviceSlug}/{sl.locationSlug}
                        </p>
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
                              serviceSlug: sl.serviceSlug,
                              locationSlug: sl.locationSlug,
                              serviceName: sl.serviceName,
                              locationName: sl.locationName,
                              seoTitle: sl.seoTitle || '',
                              metaDescription: sl.metaDescription || '',
                              h1Heading: sl.h1Heading || '',
                              introContent: sl.introContent || '',
                              localGuideContent: sl.localGuideContent || '',
                              startingPricePaise: sl.startingPricePaise || 29900,
                              availableHelpersCount: sl.availableHelpersCount || 10,
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
                      value={pageForm.path}
                      onChange={(e) => setPageForm({ ...pageForm, path: e.target.value })}
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
                        pageForm.seoTitle.length >= 30 && pageForm.seoTitle.length <= 75
                          ? 'text-emerald-400'
                          : 'text-amber-400'
                      }
                    >
                      {pageForm.seoTitle.length} chars
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
                        pageForm.metaDescription.length >= 70 &&
                        pageForm.metaDescription.length <= 170
                          ? 'text-emerald-400'
                          : 'text-amber-400'
                      }
                    >
                      {pageForm.metaDescription.length} chars
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    value={pageForm.metaDescription}
                    onChange={(e) =>
                      setPageForm({ ...pageForm, metaDescription: e.target.value })
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
                    required
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
                      <span>› {(pageForm.path || '/').replace(/^\//, '')}</span>
                    </div>
                    <h3 className="mt-1.5 text-lg font-semibold text-[#1a0dab] hover:underline">
                      {pageForm.seoTitle || 'Page Title | HireBuddy'}
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-[#4d5156]">
                      {pageForm.metaDescription ||
                        'Enter a unique meta description to preview how this page appears in Google Search results.'}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
                  <h3 className="text-sm font-bold text-white">
                    Configured Static & Custom Pages ({staticPages.length})
                  </h3>
                  <div className="mt-3 max-h-60 space-y-2 overflow-y-auto">
                    {staticPages.map((p) => (
                      <div
                        key={p.id}
                        onClick={() =>
                          setPageForm({
                            path: p.path,
                            pageType: p.pageType || 'STATIC',
                            seoTitle: p.seoTitle || '',
                            metaDescription: p.metaDescription || '',
                            canonicalUrl: p.canonicalUrl || `https://hirebuddy.in${p.path}`,
                            h1Heading: p.h1Heading || '',
                            introContent: p.introContent || '',
                            isIndexable: p.isIndexable,
                            publicationStatus: p.publicationStatus || 'PUBLISHED',
                          })
                        }
                        className="cursor-pointer rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-xs hover:border-blue-500/50"
                      >
                        <div className="flex justify-between">
                          <span className="font-mono font-bold text-emerald-400">{p.path}</span>
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
                Create / Edit Service + Location SEO Landing Page (/services/{slForm.serviceSlug}/{slForm.locationSlug})
              </h2>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300">Service</label>
                  <select
                    value={slForm.serviceSlug}
                    onChange={(e) => {
                      const svc = (overview?.services || []).find((s) => s.slug === e.target.value);
                      setSlForm({
                        ...slForm,
                        serviceSlug: e.target.value,
                        serviceName: svc?.name || e.target.value,
                      });
                    }}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                    required
                  >
                    {(overview?.services || []).map((s) => (
                      <option key={s.id} value={s.slug}>
                        {s.name} ({s.slug})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300">City / Location</label>
                  <select
                    value={slForm.locationSlug}
                    onChange={(e) => {
                      const loc = (overview?.locations || []).find((l) => l.slug === e.target.value);
                      setSlForm({
                        ...slForm,
                        locationSlug: e.target.value,
                        locationName: loc?.name || e.target.value,
                      });
                    }}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                    required
                  >
                    {(overview?.locations || []).map((l) => (
                      <option key={l.id} value={l.slug}>
                        {l.name} ({l.slug})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300">
                    Available Verified Helpers
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={slForm.availableHelpersCount}
                    onChange={(e) =>
                      setSlForm({ ...slForm, availableHelpersCount: Number(e.target.value) })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
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
                  value={slForm.metaDescription}
                  onChange={(e) => setSlForm({ ...slForm, metaDescription: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300">
                  Local Intro & Coverage Content (min 150 chars for indexability)
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
                      onChange={(e) =>
                        setBlogForm({
                          ...blogForm,
                          title: e.target.value,
                          seoTitle: blogForm.seoTitle || `${e.target.value} | HireBuddy Blog`,
                        })
                      }
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
                      placeholder="how-to-find-trusted-home-cleaning-services"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300">Meta Description</label>
                  <textarea
                    rows={2}
                    value={blogForm.metaDescription}
                    onChange={(e) => setBlogForm({ ...blogForm, metaDescription: e.target.value })}
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
                          metaDescription: b.metaDescription || b.excerpt || '',
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
