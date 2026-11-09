// webapp/app/lib/schema.js
// Valid, Google Search Central Compliant JSON-LD Structured Data Generators (Phase 7 & 13)

import { SITE_URL, generateCanonicalUrl } from './seo.js';

export const HIREBUDDY_BUSINESS_INFO = {
  legalName: 'HireBuddy Marketplace Technologies',
  brandName: 'HireBuddy',
  url: SITE_URL,
  logo: `${SITE_URL}/favicon.ico`,
  phone: '+91-9876543210',
  email: 'support@hirebuddy.in',
  headquarters: {
    streetAddress: 'Modipuram, NH-58 Bypass Road',
    addressLocality: 'Meerut',
    addressRegion: 'Uttar Pradesh',
    postalCode: '250110',
    addressCountry: 'IN',
  },
  geo: {
    latitude: 28.9845,
    longitude: 77.7064,
  },
  openingHours: 'Mo-Su 07:00-21:00',
  supportedCities: ['Meerut', 'Noida', 'Ghaziabad', 'Delhi'],
};

/**
 * 1. Organization Schema
 */
export function buildOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: HIREBUDDY_BUSINESS_INFO.brandName,
    legalName: HIREBUDDY_BUSINESS_INFO.legalName,
    url: SITE_URL,
    logo: HIREBUDDY_BUSINESS_INFO.logo,
    contactPoint: [
      {
        '@type': 'ContactPoint',
        telephone: HIREBUDDY_BUSINESS_INFO.phone,
        contactType: 'customer service',
        email: HIREBUDDY_BUSINESS_INFO.email,
        areaServed: 'IN',
        availableLanguage: ['English', 'Hindi'],
      },
    ],
  };
}

/**
 * 2. WebSite Schema
 */
export function buildWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    url: SITE_URL,
    name: 'HireBuddy',
    description:
      'Indian service-booking marketplace connecting customers with verified local helpers for home cleaning, plumbing, electrical, carpentry, and driver services.',
    publisher: {
      '@id': `${SITE_URL}/#organization`,
    },
  };
}

/**
 * 3. LocalBusiness Schema (Strictly uses genuine Meerut headquarters — never fabricates fake branch addresses)
 */
export function buildLocalBusinessSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'HomeAndConstructionBusiness',
    '@id': `${SITE_URL}/#localbusiness`,
    name: HIREBUDDY_BUSINESS_INFO.brandName,
    url: SITE_URL,
    telephone: HIREBUDDY_BUSINESS_INFO.phone,
    email: HIREBUDDY_BUSINESS_INFO.email,
    priceRange: '₹₹',
    address: {
      '@type': 'PostalAddress',
      ...HIREBUDDY_BUSINESS_INFO.headquarters,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: HIREBUDDY_BUSINESS_INFO.geo.latitude,
      longitude: HIREBUDDY_BUSINESS_INFO.geo.longitude,
    },
    openingHours: HIREBUDDY_BUSINESS_INFO.openingHours,
    areaServed: HIREBUDDY_BUSINESS_INFO.supportedCities.map((city) => ({
      '@type': 'City',
      name: city,
    })),
  };
}

/**
 * 4. Service Schema (Only includes AggregateRating if genuine reviewCount > 0 and rating > 0)
 */
export function buildServiceSchema({
  name,
  description,
  serviceType,
  path,
  areaServed = ['Meerut', 'Noida', 'Ghaziabad', 'Delhi'],
  startingPriceRupees = 199,
  rating = null,
  reviewCount = 0,
}) {
  const url = generateCanonicalUrl(path);
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name,
    serviceType: serviceType || name,
    description,
    url,
    provider: {
      '@id': `${SITE_URL}/#organization`,
    },
    areaServed: (Array.isArray(areaServed) ? areaServed : [areaServed]).map((city) => ({
      '@type': 'City',
      name: city,
    })),
    offers: {
      '@type': 'Offer',
      priceCurrency: 'INR',
      price: String(startingPriceRupees),
      availability: 'https://schema.org/InStock',
      url,
    },
  };

  // Never emit fake ratings — only attach AggregateRating when genuine eligible reviews exist
  if (Number(reviewCount) > 0 && Number(rating) > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: String(rating),
      reviewCount: String(reviewCount),
      bestRating: '5',
      worstRating: '1',
    };
  }

  return schema;
}

/**
 * 5. BreadcrumbList Schema
 */
export function buildBreadcrumbSchema(items = []) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.label,
      item: item.href ? generateCanonicalUrl(item.href) : undefined,
    })),
  };
}

/**
 * 6. FAQPage Schema
 */
export function buildFaqSchema(faqs = []) {
  if (!Array.isArray(faqs) || faqs.length === 0) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.answer,
      },
    })),
  };
}

/**
 * 7. Article Schema for Blog Posts
 */
export function buildArticleSchema(post) {
  const url = post.canonicalUrl || generateCanonicalUrl(`/blog/${post.slug}`);
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.metaDescription || post.excerpt,
    image: post.featuredImage?.startsWith('http')
      ? post.featuredImage
      : `${SITE_URL}${post.featuredImage || '/images/blog/trusted-home-cleaning-guide.webp'}`,
    datePublished: post.publishedAt || post.createdAt,
    dateModified: post.updatedAt || post.publishedAt,
    author: {
      '@type': 'Organization',
      name: post.authorName || 'HireBuddy Editorial Team',
    },
    publisher: {
      '@id': `${SITE_URL}/#organization`,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
  };
}

/**
 * 8. Person Schema for Approved Public Helper Profiles (Strictly no private PII)
 */
export function buildPersonSchema(helper, canonicalUrl) {
  const url = canonicalUrl || generateCanonicalUrl(`/helpers/${helper.slug}`);
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: helper.name,
    jobTitle: `${(helper.skills || ['Home Service'])[0]} Professional`,
    description: helper.bio,
    url,
    workLocation: {
      '@type': 'Place',
      name: helper.city || 'Meerut',
    },
    knowsAbout: helper.skills || ['Home Services'],
  };
}
