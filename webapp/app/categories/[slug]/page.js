import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import Link from 'next/link';
import { CATEGORIES, slugify } from '../../components/category/categories';
import { notFound } from 'next/navigation';

export async function generateStaticParams() {
  return CATEGORIES.map((c) => ({ slug: slugify(c) }));
}

export default async function CategoryPage({ params }) {
  const resolvedParams = await params;
  const slug = resolvedParams?.slug;
  if (!slug || typeof slug !== 'string') return notFound();

  const title = slug.split('-').map(s => s[0].toUpperCase() + s.slice(1)).join(' ');
  const currentIndex = CATEGORIES.findIndex(c => slugify(c) === slug);
  const prev = currentIndex > -1 ? CATEGORIES[(currentIndex - 1 + CATEGORIES.length) % CATEGORIES.length] : null;
  const next = currentIndex > -1 ? CATEGORIES[(currentIndex + 1) % CATEGORIES.length] : null;

  // Listings are rendered by client component which fetches live results and handles filters
  const ClientListings = (await import('./CategoryListingsClient')).default;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <Header />

      <div className="max-w-7xl mx-auto px-6 py-8">
        <nav className="text-sm text-slate-400 mb-4">Home <span className="mx-2">›</span> Services <span className="mx-2">›</span> {title}</nav>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters */}
          <aside className="lg:col-span-1">
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 space-y-6">
              <h3 className="text-lg font-semibold text-white">Filters</h3>

              <div>
                <h4 className="text-sm font-medium text-slate-300 mb-2">Service Type</h4>
                <ul className="space-y-2 text-sm text-slate-300">
                  <li><label className="inline-flex items-center gap-2"><input type="checkbox" /> Home Cleaning</label></li>
                  <li><label className="inline-flex items-center gap-2"><input type="checkbox" /> Office Cleaning</label></li>
                  <li><label className="inline-flex items-center gap-2"><input type="checkbox" /> Deep Cleaning</label></li>
                  <li><label className="inline-flex items-center gap-2"><input type="checkbox" /> Kitchen Cleaning</label></li>
                  <li><label className="inline-flex items-center gap-2"><input type="checkbox" /> Bathroom Cleaning</label></li>
                  <li><label className="inline-flex items-center gap-2"><input type="checkbox" /> Sofa & Carpet</label></li>
                </ul>
              </div>

              <div>
                <h4 className="text-sm font-medium text-slate-300 mb-2">Availability</h4>
                <ul className="space-y-2 text-sm text-slate-300">
                  <li><label className="inline-flex items-center gap-2"><input type="checkbox" /> Available Today</label></li>
                  <li><label className="inline-flex items-center gap-2"><input type="checkbox" /> Available This Week</label></li>
                </ul>
              </div>

              <div>
                <h4 className="text-sm font-medium text-slate-300 mb-2">Rating</h4>
                <ul className="space-y-2 text-sm text-slate-300">
                  <li>★ 4.5 & above</li>
                  <li>★ 4.0 & above</li>
                </ul>
              </div>

              <div className="pt-2">
                <button className="w-full rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold">Apply Filters</button>
                <button className="w-full mt-2 rounded-xl border border-slate-700 px-4 py-2 text-sm">Clear All</button>
              </div>
            </div>
          </aside>

          {/* Listings */}
          <section className="lg:col-span-3">
            <div className="mb-6">
              <h1 className="text-3xl font-bold">{title}</h1>
              <p className="text-slate-300 mt-2">Find trusted and verified helpers for {title} services in your area.</p>

              <div className="mt-4 flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-2 text-sm text-slate-300"><span className="h-3 w-3 rounded-full bg-emerald-400 inline-block" /> Verified Helpers</span>
                  <span className="inline-flex items-center gap-2 text-sm text-slate-300"><span className="h-3 w-3 rounded-full bg-yellow-400 inline-block" /> Rated by Users</span>
                  <span className="inline-flex items-center gap-2 text-sm text-slate-300"><span className="h-3 w-3 rounded-full bg-emerald-600 inline-block" /> Safe & Secure</span>
                </div>
              </div>

              <div className="mt-6 flex gap-4 items-center">
                <div className="flex-1">
                  <input placeholder="Search cleaners, services, or keywords..." className="w-full rounded-xl bg-slate-900/80 border border-slate-800 px-4 py-3 text-sm text-slate-300" />
                </div>
                <div className="w-72">
                  <input placeholder="Enter your location" className="w-full rounded-xl bg-slate-900/80 border border-slate-800 px-4 py-3 text-sm text-slate-300" />
                </div>
                <div>
                  <select className="rounded-xl bg-slate-900/80 border border-slate-800 px-3 py-2 text-sm text-slate-300">
                    <option>Sort by: Relevance</option>
                    <option>Price: Low to High</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="mb-4 text-slate-300">12 Helpers found</div>

            <div>
              <ClientListings title={title} slug={slug} />
            </div>
          </section>
        </div>
      </div>

      <Footer />
    </main>
  );
}
