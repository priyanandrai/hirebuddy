"use client";

import Link from 'next/link';

export default function CategoryCard({ title }) {
  const slug = title.toLowerCase().replace(/\s+/g, '-');

  return (
    <Link href={`/categories/${slug}`} className="group block cursor-pointer rounded-xl border border-slate-800 bg-slate-900/90 p-6 transition hover:border-blue-500 hover:shadow-sm">
      <div className="text-sm font-medium text-white mb-1">{title}</div>
      <p className="text-xs text-slate-300">Find trusted helpers</p>
    </Link>
  );
}
