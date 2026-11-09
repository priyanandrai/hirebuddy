import Link from 'next/link';
import JsonLd from './JsonLd';
import { buildBreadcrumbSchema } from '../../lib/schema';

export default function Breadcrumbs({ items = [] }) {
  if (!items || items.length === 0) return null;
  const schema = buildBreadcrumbSchema(items);

  return (
    <>
      <JsonLd data={schema} />
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-slate-400">
          {items.map((item, idx) => {
            const isLast = idx === items.length - 1;
            return (
              <li key={`${item.label}-${idx}`} className="flex items-center gap-2">
                {idx > 0 && <span className="text-slate-600">›</span>}
                {item.href && !isLast ? (
                  <Link
                    href={item.href}
                    className="hover:text-blue-400 transition-colors font-medium"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span aria-current="page" className="font-semibold text-slate-200">
                    {item.label}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
