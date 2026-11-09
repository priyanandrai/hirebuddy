import Link from "next/link";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import Breadcrumbs from "../components/seo/Breadcrumbs";
import InternalLinksSection from "../components/seo/InternalLinksSection";
import { fetchSeoApi, generatePageMetadata } from "../lib/seo";

export const metadata = generatePageMetadata({
  title: "Home Maintenance, Cleaning Cost & Hiring Guides — HireBuddy Blog",
  description:
    "Read expert guides on home cleaning costs in Noida, how to hire verified plumbers and electricians, seasonal home maintenance checklists, and household safety tips.",
  path: "/blog",
});

export default async function BlogIndexPage() {
  const data = await fetchSeoApi("/seo/public/blog", { revalidate: 300 });
  const posts = data?.posts || [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 flex-1 w-full">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Blog", href: "/blog" },
          ]}
        />

        <header className="rounded-3xl border border-slate-800 bg-slate-900/70 p-8 sm:p-10 mb-10">
          <span className="inline-flex items-center rounded-full bg-purple-500/15 px-3 py-1 text-xs font-bold text-purple-400 mb-3">
            HOME SERVICES & MAINTENANCE GUIDES
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            HireBuddy Home Maintenance & Pricing Blog
          </h1>
          <p className="mt-3 max-w-3xl text-slate-300 text-sm sm:text-base leading-relaxed">
            Practical, editor-reviewed advice on hiring background-verified home helpers, realistic
            service pricing across Indian cities, and preventive home care checklists.
          </p>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <article
              key={post.slug}
              className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 flex flex-col justify-between hover:border-purple-500/50 transition"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                  <span className="font-bold text-purple-400">{post.category}</span>
                  <span>{post.readingTimeMinutes || 5} min read</span>
                </div>
                <h2 className="text-xl font-bold text-white leading-snug">
                  <Link href={`/blog/${post.slug}`} className="hover:text-purple-400 transition">
                    {post.title}
                  </Link>
                </h2>
                <p className="mt-3 text-sm text-slate-300 leading-relaxed">{post.excerpt}</p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">{post.authorName}</span>
                <Link
                  href={`/blog/${post.slug}`}
                  className="font-bold text-purple-400 hover:text-purple-300"
                >
                  Read Article →
                </Link>
              </div>
            </article>
          ))}
        </section>

        <InternalLinksSection />
      </div>

      <Footer />
    </div>
  );
}
