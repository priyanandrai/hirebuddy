// webapp/app/lib/seo.js
// Reusable Dynamic SEO Metadata, Canonical URL, and Server-Side Data Fetching Utilities

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://hirebuddy.in').replace(
  /\/+$/,
  ''
);

const BACKEND_API_BASE = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:8080/api'
).replace(/\/+$/, '');

/**
 * Generate a clean, lowercase, hyphenated, trailing-slash-free Canonical URL
 * Strips query parameters and hash fragments to prevent duplicate URL indexing.
 */
export function generateCanonicalUrl(path = '/') {
  const cleanPath =
    '/' +
    String(path || '/')
      .split('?')[0]
      .split('#')[0]
      .trim()
      .toLowerCase()
      .replace(/^\/+|\/+$/g, '');
  return cleanPath === '/' ? SITE_URL : `${SITE_URL}${cleanPath}`;
}

/**
 * Generic Page Metadata Builder (Phase 3)
 */
export function generatePageMetadata({
  title,
  description,
  path = '/',
  canonicalUrl = null,
  ogImage = '/images/seo/hirebuddy-og-default.webp',
  shouldIndex = true,
  ogType = 'website',
  keywords = [],
} = {}) {
  const resolvedCanonical = canonicalUrl || generateCanonicalUrl(path);
  const resolvedTitle = title || 'HireBuddy — Verified Local Helpers & Home Services in India';
  const resolvedDescription =
    description ||
    'Book government-ID verified local helpers for home cleaning, plumbing, electrical repair, carpentry, and driver services with upfront pricing and escrow safety.';
  const absoluteOgImage = ogImage?.startsWith('http')
    ? ogImage
    : `${SITE_URL}${ogImage?.startsWith('/') ? ogImage : `/${ogImage}`}`;

  return {
    title: {
      absolute: resolvedTitle,
    },
    description: resolvedDescription,
    keywords: keywords.length
      ? keywords
      : ['HireBuddy', 'Verified Home Services India', 'Home Cleaning', 'Plumber', 'Electrician'],
    alternates: {
      canonical: resolvedCanonical,
    },
    robots: {
      index: Boolean(shouldIndex),
      follow: Boolean(shouldIndex),
      googleBot: {
        index: Boolean(shouldIndex),
        follow: Boolean(shouldIndex),
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      title: resolvedTitle,
      description: resolvedDescription,
      url: resolvedCanonical,
      siteName: 'HireBuddy',
      locale: 'en_IN',
      type: ogType,
      images: [
        {
          url: absoluteOgImage,
          width: 1200,
          height: 630,
          alt: resolvedTitle,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: resolvedTitle,
      description: resolvedDescription,
      images: [absoluteOgImage],
    },
  };
}

/**
 * Service Page Metadata Builder (/services/[serviceSlug])
 */
export function generateServiceMetadata(service, indexability = { shouldIndex: true }) {
  if (!service) {
    return generateNoIndexMetadata('Service Not Found | HireBuddy', 'Requested service was not found.');
  }
  const title = service.seoTitle || `${service.name} Services — Verified Local Helpers | HireBuddy`;
  const description =
    service.metaDescription ||
    `Book verified ${service.name.toLowerCase()} professionals on HireBuddy. Check transparent starting prices, compare helper ratings, and pay safely with escrow protection.`;

  return generatePageMetadata({
    title,
    description,
    path: `/services/${service.slug}`,
    canonicalUrl: service.canonicalUrl,
    ogImage: service.ogImage || `/images/seo/${service.slug}-service.webp`,
    shouldIndex: indexability?.shouldIndex !== false,
    keywords: [
      `${service.name} Services`,
      `Book ${service.name} Online`,
      `Verified ${service.name} Helpers`,
      'HireBuddy',
    ],
  });
}

/**
 * Location Page Metadata Builder (/locations/[locationSlug])
 */
export function generateLocationMetadata(location, indexability = { shouldIndex: true }) {
  if (!location) {
    return generateNoIndexMetadata('Location Not Found | HireBuddy', 'Requested location was not found.');
  }
  const title =
    location.seoTitle ||
    `Home Services & Verified Local Helpers in ${location.name} | HireBuddy`;
  const description =
    location.metaDescription ||
    `Book verified home cleaning, plumber, electrician, carpenter and driver services in ${location.name}, ${location.stateName}. Compare helpers and schedule with HireBuddy.`;

  return generatePageMetadata({
    title,
    description,
    path: `/locations/${location.slug}`,
    canonicalUrl: location.canonicalUrl,
    ogImage: location.ogImage || `/images/seo/${location.slug}-location.webp`,
    shouldIndex: indexability?.shouldIndex !== false,
    keywords: [
      `Home Services in ${location.name}`,
      `Verified Helpers in ${location.name}`,
      `Home Cleaning ${location.name}`,
      `Plumber ${location.name}`,
      `Electrician ${location.name}`,
    ],
  });
}

/**
 * Service + Location Landing Page Metadata Builder (/services/[serviceSlug]/[locationSlug])
 */
export function generateServiceLocationMetadata(page, indexability = { shouldIndex: true }) {
  if (!page) {
    return generateNoIndexMetadata(
      'Service Location Not Available | HireBuddy',
      'Requested service location page was not found.'
    );
  }
  const title = page.seoTitle || `${page.serviceName} in ${page.locationName} | HireBuddy`;
  const description =
    page.metaDescription ||
    `Book trusted ${page.serviceName.toLowerCase()} professionals in ${page.locationName}. Compare available services, check pricing and schedule your service with HireBuddy.`;

  return generatePageMetadata({
    title,
    description,
    path: `/services/${page.serviceSlug}/${page.locationSlug}`,
    canonicalUrl: page.canonicalUrl,
    ogImage:
      page.ogImage || `/images/seo/${page.serviceSlug}-service-${page.locationSlug}.webp`,
    shouldIndex: indexability?.shouldIndex !== false,
    keywords: [
      `${page.serviceName} in ${page.locationName}`,
      `Best ${page.serviceName} ${page.locationName}`,
      `Book ${page.serviceName} ${page.locationName}`,
      'HireBuddy',
    ],
  });
}

/**
 * Public Helper Profile Metadata Builder (/helpers/[helper-slug])
 */
export function generateHelperMetadata(helper, canonicalUrl, indexability = { shouldIndex: true }) {
  if (!helper) {
    return generateNoIndexMetadata('Helper Profile Not Found | HireBuddy', 'Helper profile not found.');
  }
  const primarySkill = Array.isArray(helper.skills) && helper.skills[0] ? helper.skills[0] : 'Home Service';
  const title = `${helper.name} — Verified ${primarySkill} Professional in ${helper.city} | HireBuddy`;
  const description = `Hire ${helper.name}, a background-verified ${primarySkill.toLowerCase()} professional in ${helper.city} with ${helper.experience}+ years experience on HireBuddy.`;

  return generatePageMetadata({
    title,
    description,
    path: `/helpers/${helper.slug}`,
    canonicalUrl: canonicalUrl || generateCanonicalUrl(`/helpers/${helper.slug}`),
    ogImage: helper.image || '/images/priya_sharma.png',
    shouldIndex: indexability?.shouldIndex !== false,
    ogType: 'profile',
  });
}

/**
 * Blog Article Metadata Builder (/blog/[slug])
 */
export function generateBlogMetadata(post, indexability = { shouldIndex: true }) {
  if (!post) {
    return generateNoIndexMetadata('Article Not Found | HireBuddy Blog', 'Requested article not found.');
  }
  return generatePageMetadata({
    title: post.seoTitle || `${post.title} | HireBuddy Blog`,
    description: post.metaDescription || post.excerpt,
    path: `/blog/${post.slug}`,
    canonicalUrl: post.canonicalUrl,
    ogImage: post.featuredImage || '/images/blog/trusted-home-cleaning-guide.webp',
    shouldIndex: indexability?.shouldIndex !== false,
    ogType: 'article',
    keywords: Array.isArray(post.tags) ? post.tags : ['Home Services Guide', 'HireBuddy Blog'],
  });
}

/**
 * Non-Indexable (noindex, nofollow) Metadata Builder for Login, Signup, Dashboards, Checkout, Search
 */
export function generateNoIndexMetadata(title, description, path = '/') {
  return {
    title: {
      absolute: title || 'HireBuddy Account',
    },
    description: description || 'HireBuddy private application area.',
    alternates: {
      canonical: generateCanonicalUrl(path),
    },
    robots: {
      index: false,
      follow: false,
      nocache: true,
      googleBot: {
        index: false,
        follow: false,
        noimageindex: true,
      },
    },
  };
}

/**
 * Server-Side Data Fetcher for Next.js App Router Server Components
 */
export async function fetchSeoApi(endpoint, { revalidate = 300 } = {}) {
  try {
    const cleanEndpoint = String(endpoint || '').replace(/^\/api(?=\/)/, '');
    const res = await fetch(`${BACKEND_API_BASE}${cleanEndpoint}`, {
      next: { revalidate },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
