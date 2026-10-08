import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import Link from 'next/link';
import { CATEGORIES, slugify, getCategoryBySlug } from '../../components/category/categories';
import { notFound } from 'next/navigation';
import CategoryListingsClient from './CategoryListingsClient';

export async function generateStaticParams() {
  return CATEGORIES.map((c) => ({ slug: slugify(c) }));
}

export default async function CategoryPage({ params }) {
  const resolvedParams = await params;
  const slug = resolvedParams?.slug;
  if (!slug || typeof slug !== 'string') return notFound();

  const category = getCategoryBySlug(slug);
  if (!category) return notFound();

  const currentIndex = CATEGORIES.findIndex((c) => slugify(c) === slug);
  const prevCategory =
    currentIndex > -1 ? CATEGORIES[(currentIndex - 1 + CATEGORIES.length) % CATEGORIES.length] : null;
  const nextCategory =
    currentIndex > -1 ? CATEGORIES[(currentIndex + 1) % CATEGORIES.length] : null;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 w-full flex-1">
        {/* Breadcrumb & Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <nav className="text-sm text-slate-400 flex items-center gap-2">
            <Link href="/" className="hover:text-emerald-400 transition-colors">
              Home
            </Link>
            <span>›</span>
            <span className="text-slate-400">Services</span>
            <span>›</span>
            <span className="text-slate-200 font-medium">{category.name}</span>
          </nav>

          {/* Prev / Next category switcher links */}
          <div className="flex items-center gap-4 text-xs text-slate-400">
            {prevCategory && (
              <Link
                href={`/categories/${slugify(prevCategory)}`}
                className="hover:text-emerald-300 transition-colors flex items-center gap-1"
              >
                <span>←</span> {prevCategory}
              </Link>
            )}
            <span className="text-slate-700">|</span>
            {nextCategory && (
              <Link
                href={`/categories/${slugify(nextCategory)}`}
                className="hover:text-emerald-300 transition-colors flex items-center gap-1"
              >
                {nextCategory} <span>→</span>
              </Link>
            )}
          </div>
        </div>

        {/* Hero Banner */}
        <div className="bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-emerald-950/30 border border-slate-800 rounded-2xl p-6 sm:p-8 mb-8 shadow-2xl backdrop-blur-sm relative overflow-hidden">
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-3 py-1 rounded-full text-xs font-semibold mb-3">
              <span>{category.icon}</span>
              <span>HireBuddy Verified Category</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              {category.name} Services
            </h1>

            <p className="text-slate-300 text-sm sm:text-base mt-2 leading-relaxed">
              {category.description}
            </p>

            {/* Trust highlights */}
            <div className="mt-5 flex flex-wrap items-center gap-3 sm:gap-6 text-xs text-slate-300">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Govt ID Verified Helpers
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                Rated 4.7+ by Community
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-teal-400" />
                Escrow Protected Payments
              </span>
            </div>
          </div>
        </div>

        {/* Interactive Client Listings with Filter Bar & Sidebar */}
        <CategoryListingsClient category={category} />
      </div>

      <Footer />
    </main>
  );
}
