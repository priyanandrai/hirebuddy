import Link from 'next/link';

const CORE_SERVICES = [
  { name: 'Home Cleaning Services', slug: 'home-cleaning' },
  { name: 'Plumber Services', slug: 'plumber' },
  { name: 'Electrician Services', slug: 'electrician' },
  { name: 'Carpenter Services', slug: 'carpenter' },
  { name: 'Personal Driver Services', slug: 'driver' },
];

const CORE_LOCATIONS = [
  { name: 'Meerut', slug: 'meerut' },
  { name: 'Noida', slug: 'noida' },
  { name: 'Ghaziabad', slug: 'ghaziabad' },
  { name: 'Delhi', slug: 'delhi' },
];

const POPULAR_COMBOS = [
  { label: 'Home Cleaning in Noida', href: '/services/home-cleaning/noida' },
  { label: 'Home Cleaning in Ghaziabad', href: '/services/home-cleaning/ghaziabad' },
  { label: 'Plumber in Noida', href: '/services/plumber/noida' },
  { label: 'Electrician in Meerut', href: '/services/electrician/meerut' },
  { label: 'Home Cleaning in Meerut', href: '/services/home-cleaning/meerut' },
];

export default function InternalLinksSection({
  currentServiceSlug = null,
  currentLocationSlug = null,
}) {
  return (
    <section
      aria-label="Related Services and Locations"
      className="mt-14 rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8"
    >
      <h2 className="text-lg font-bold text-white mb-5">
        Explore Verified Services & Supported Cities on HireBuddy
      </h2>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-3">
            Popular Home Services
          </h3>
          <ul className="space-y-2 text-sm">
            {CORE_SERVICES.map((svc) => (
              <li key={svc.slug}>
                <Link
                  href={`/services/${svc.slug}`}
                  className={`hover:text-blue-400 transition ${
                    currentServiceSlug === svc.slug
                      ? 'font-bold text-blue-400'
                      : 'text-slate-300'
                  }`}
                >
                  {svc.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-3">
            Supported Cities
          </h3>
          <ul className="space-y-2 text-sm">
            {CORE_LOCATIONS.map((loc) => (
              <li key={loc.slug}>
                <Link
                  href={`/locations/${loc.slug}`}
                  className={`hover:text-emerald-400 transition ${
                    currentLocationSlug === loc.slug
                      ? 'font-bold text-emerald-400'
                      : 'text-slate-300'
                  }`}
                >
                  Verified Helpers in {loc.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400 mb-3">
            City Service Guides & Resources
          </h3>
          <ul className="space-y-2 text-sm">
            {POPULAR_COMBOS.map((combo) => (
              <li key={combo.href}>
                <Link href={combo.href} className="text-slate-300 hover:text-purple-400 transition">
                  {combo.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/blog" className="text-slate-300 hover:text-purple-400 transition">
                Home Maintenance & Pricing Blog
              </Link>
            </li>
            <li>
              <Link href="/pricing" className="text-slate-300 hover:text-purple-400 transition">
                Transparent Service Pricing
              </Link>
            </li>
            <li>
              <Link href="/safety" className="text-slate-300 hover:text-purple-400 transition">
                KYC & Escrow Safety Standards
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
