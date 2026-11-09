import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";
import Breadcrumbs from "../../components/seo/Breadcrumbs";
import JsonLd from "../../components/seo/JsonLd";
import InternalLinksSection from "../../components/seo/InternalLinksSection";
import { fetchSeoApi, generateBlogMetadata } from "../../lib/seo";
import { buildArticleSchema, buildFaqSchema } from "../../lib/schema";

export async function generateMetadata({ params }) {
  const resolved = await params;
  const slug = String(resolved?.slug || "").toLowerCase();
  const data = await fetchSeoApi(`/seo/public/blog/${slug}`, { revalidate: 300 });
  if (!data?.post) {
    return generateBlogMetadata(null);
  }
  return generateBlogMetadata(data.post, data.indexability);
}

export default async function BlogArticlePage({ params }) {
  const resolved = await params;
  const slug = String(resolved?.slug || "").toLowerCase();
  const data = await fetchSeoApi(`/seo/public/blog/${slug}`, { revalidate: 300 });

  if (!data?.post) {
    notFound();
  }

  const { post, relatedPosts = [] } = data;
  const relatedServices = Array.isArray(post.relatedServiceSlugs) ? post.relatedServiceSlugs : [];
  const relatedLocations = Array.isArray(post.relatedLocationSlugs)
    ? post.relatedLocationSlugs
    : [];
  const faqs = Array.isArray(post.faqs) ? post.faqs : [];

  const schemas = [buildArticleSchema(post), buildFaqSchema(faqs)].filter(Boolean);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <JsonLd data={schemas} />
      <Header />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 flex-1 w-full">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Blog", href: "/blog" },
            { label: post.title, href: `/blog/${post.slug}` },
          ]}
        />

        <article className="rounded-3xl border border-slate-800 bg-slate-900/70 p-8 sm:p-10">
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mb-4">
            <span className="rounded-full bg-purple-500/15 px-3 py-1 font-bold text-purple-400">
              {post.category}
            </span>
            <span>By {post.authorName}</span>
            <span>•</span>
            <span>{post.readingTimeMinutes || 5} min read</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            {post.title}
          </h1>

          <p className="mt-4 text-base text-slate-300 leading-relaxed border-l-4 border-blue-500 pl-4">
            {post.excerpt}
          </p>

          <div className="mt-8 space-y-5 text-sm sm:text-base text-slate-200 leading-relaxed whitespace-pre-line">
            {post.content}
          </div>

          {/* Contextual Internal Links to Services & Locations */}
          <div className="mt-10 pt-6 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {relatedServices.map((sSlug) => (
                <Link
                  key={sSlug}
                  href={`/services/${sSlug}`}
                  className="rounded-xl border border-blue-500/40 bg-blue-500/10 px-3.5 py-2 text-xs font-bold text-blue-300 hover:bg-blue-500/20"
                >
                  Explore {sSlug.replace(/-/g, " ")} Services →
                </Link>
              ))}
              {relatedLocations.map((lSlug) => (
                <Link
                  key={lSlug}
                  href={`/locations/${lSlug}`}
                  className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3.5 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-500/20"
                >
                  Helpers in {lSlug.charAt(0).toUpperCase() + lSlug.slice(1)} →
                </Link>
              ))}
            </div>

            <Link
              href="/post-task"
              className="rounded-2xl bg-blue-600 px-5 py-3 text-xs font-bold text-white hover:bg-blue-500"
            >
              Book a Verified Helper
            </Link>
          </div>
        </article>

        {faqs.length > 0 && (
          <section className="mt-10 rounded-3xl border border-slate-800 bg-slate-900/70 p-7">
            <h2 className="text-2xl font-bold text-white mb-4">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {faqs.map((f, idx) => (
                <div key={idx} className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                  <h3 className="font-bold text-white">{f.question}</h3>
                  <p className="mt-2 text-sm text-slate-300">{f.answer}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {relatedPosts.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-bold text-white mb-4">Related Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {relatedPosts.map((rp) => (
                <Link
                  key={rp.slug}
                  href={`/blog/${rp.slug}`}
                  className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 hover:border-purple-500/50 transition"
                >
                  <p className="text-xs font-bold text-purple-400">{rp.category}</p>
                  <h3 className="mt-1 text-sm font-bold text-white">{rp.title}</h3>
                </Link>
              ))}
            </div>
          </section>
        )}

        <InternalLinksSection />
      </div>

      <Footer />
    </div>
  );
}
