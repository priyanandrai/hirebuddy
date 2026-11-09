import express from 'express';
import prisma from '../utils/prisma.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import {
  ensureSeoFoundationSeeded,
  toSeoSlug,
  buildCanonicalUrl,
  getAllPublicServices,
  getPublicServiceBySlug,
  getPublicLocationBySlug,
  getPublicServiceLocationPage,
  getPublicHelperProfile,
  getPublicBlogPosts,
  getPublicBlogPostBySlug,
  getPublicSitemapEntries,
} from '../services/seo.service.js';
import { runAutomatedSeoAudit } from '../services/seoAudit.service.js';
import { toCsvString } from '../services/invoice.service.js';

const router = express.Router();

// ============================================================================
// PUBLIC SSR & METADATA ENDPOINTS (No Auth Required — Crawlable by Googlebot)
// ============================================================================

/**
 * GET /api/seo/public/services - List all public services & supported locations
 */
router.get('/public/services', async (_req, res) => {
  try {
    const data = await getAllPublicServices();
    res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/seo/public/services/:serviceSlug - Get single service SEO page data
 */
router.get('/public/services/:serviceSlug', async (req, res) => {
  try {
    const data = await getPublicServiceBySlug(req.params.serviceSlug);
    if (!data) {
      return res.status(404).json({ error: 'Service page not found' });
    }
    res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/seo/public/locations - List all supported city locations
 */
router.get('/public/locations', async (_req, res) => {
  try {
    await ensureSeoFoundationSeeded();
    const locations = await prisma.serviceLocation.findMany({
      where: { isSupported: true, publicationStatus: 'PUBLISHED' },
      orderBy: { name: 'asc' },
    });
    res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
    res.json({ locations });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/seo/public/locations/:locationSlug - Get single city location SEO page data
 */
router.get('/public/locations/:locationSlug', async (req, res) => {
  try {
    const data = await getPublicLocationBySlug(req.params.locationSlug);
    if (!data) {
      return res.status(404).json({ error: 'Location page not found' });
    }
    res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/seo/public/services/:serviceSlug/locations/:locationSlug - Get Service + Location landing page
 */
router.get('/public/services/:serviceSlug/locations/:locationSlug', async (req, res) => {
  try {
    const { serviceSlug, locationSlug } = req.params;
    const data = await getPublicServiceLocationPage(serviceSlug, locationSlug);
    if (!data) {
      return res.status(404).json({ error: 'Service-location landing page not found' });
    }
    res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/seo/public/helpers/:slugOrId - Get sanitized public helper profile (PII stripped)
 */
router.get('/public/helpers/:slugOrId', async (req, res) => {
  try {
    const data = await getPublicHelperProfile(req.params.slugOrId);
    if (!data) {
      return res.status(404).json({ error: 'Helper profile not found' });
    }
    res.set('Cache-Control', 'public, max-age=120, stale-while-revalidate=300');
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/seo/public/blog - List published blog posts
 */
router.get('/public/blog', async (req, res) => {
  try {
    const posts = await getPublicBlogPosts({
      category: req.query.category,
      tag: req.query.tag,
    });
    res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
    res.json({ posts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/seo/public/blog/:slug - Get single blog post by slug
 */
router.get('/public/blog/:slug', async (req, res) => {
  try {
    const data = await getPublicBlogPostBySlug(req.params.slug);
    if (!data) {
      return res.status(404).json({ error: 'Blog article not found' });
    }
    res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/seo/public/page-config - Get CMS metadata for static/custom path
 */
router.get('/public/page-config', async (req, res) => {
  try {
    await ensureSeoFoundationSeeded();
    const path = String(req.query.path || '/').trim();
    const config = await prisma.seoPageConfig.findUnique({ where: { path } });
    if (!config) {
      return res.status(404).json({ error: 'SEO page config not found' });
    }
    res.json({ config });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/seo/public/sitemap-data - Dynamic XML Sitemap entries
 */
router.get('/public/sitemap-data', async (_req, res) => {
  try {
    const entries = await getPublicSitemapEntries();
    res.json({ entries });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// ADMIN SEO CMS, BLOG MANAGEMENT & AUTOMATED AUDIT ENDPOINTS (RBAC Protected)
// ============================================================================

router.use('/admin', authMiddleware, (req, res, next) => {
  if (!req.isAdmin && req.user?.role !== 'ADMIN') {
    return res.status(403).json({
      error: 'Forbidden: Only authorized Admin users can manage SEO CMS and audits.',
    });
  }
  next();
});

/**
 * GET /api/seo/admin/overview - Complete SEO Health Dashboard + CMS records + CSV Export
 */
router.get('/admin/overview', async (req, res) => {
  try {
    await ensureSeoFoundationSeeded();

    let latestAudit = await prisma.seoAuditReport.findFirst({
      orderBy: { createdAt: 'desc' },
    });
    if (!latestAudit) {
      latestAudit = await runAutomatedSeoAudit({ triggeredBy: 'INITIAL_DASHBOARD_LOAD' });
    }

    const [services, locations, serviceLocationPages, staticPages, blogPosts] =
      await Promise.all([
        prisma.category.findMany({ orderBy: { name: 'asc' } }),
        prisma.serviceLocation.findMany({ orderBy: { name: 'asc' } }),
        prisma.serviceLocationPage.findMany({ orderBy: { serviceName: 'asc' } }),
        prisma.seoPageConfig.findMany({ orderBy: { path: 'asc' } }),
        prisma.blogPost.findMany({ orderBy: { createdAt: 'desc' } }),
      ]);

    if (req.query.format === 'csv') {
      const findings = Array.isArray(latestAudit.pageFindings) ? latestAudit.pageFindings : [];
      const rows = findings.map((f) => ({
        path: f.path,
        type: f.type,
        title: f.title || '',
        canonicalUrl: f.canonicalUrl || '',
        isIndexable: f.isIndexable ? 'YES' : 'NO',
        inSitemap: f.inSitemap ? 'YES' : 'NO',
        status: f.status,
        issues: (f.issues || []).join('; '),
        warnings: (f.warnings || []).join('; '),
      }));
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="hirebuddy_seo_audit_report.csv"');
      return res.send(toCsvString(rows));
    }

    res.json({
      latestAudit,
      services,
      locations,
      serviceLocationPages,
      staticPages,
      blogPosts,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/seo/admin/audit/run - Run Automated SEO Audit on demand
 */
router.post('/admin/audit/run', async (req, res) => {
  try {
    const report = await runAutomatedSeoAudit({
      triggeredBy: req.user?.id || 'ADMIN_MANUAL',
    });
    res.json({ success: true, report });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/seo/admin/pages - Create or Update Static / Custom SEO Page Config (with validation & auto-audit)
 */
router.post('/admin/pages', async (req, res) => {
  try {
    const {
      id,
      path,
      slug,
      pageType = 'STATIC',
      seoTitle,
      metaDescription,
      canonicalUrl,
      metaRobots = 'index,follow',
      h1Heading,
      introContent,
      mainContent,
      faqs = [],
      ogImage,
      schemaType = 'WebPage',
      isIndexable = true,
      publicationStatus = 'PUBLISHED',
      redirectToUrl = null,
      httpStatusCode = 200,
    } = req.body;

    if (!path || !seoTitle || !metaDescription || !h1Heading) {
      return res.status(400).json({
        error: 'path, seoTitle, metaDescription, and h1Heading are required',
      });
    }

    // Security guardrail: Never allow arbitrary script tags in SEO fields
    const combinedText = `${seoTitle} ${metaDescription} ${h1Heading} ${introContent || ''} ${
      mainContent || ''
    }`;
    if (/<script\b/i.test(combinedText)) {
      return res.status(400).json({
        error: 'Unsafe <script> injection is prohibited in SEO content fields.',
      });
    }

    const normalizedPath = path.startsWith('/') ? path.toLowerCase() : `/${path.toLowerCase()}`;
    const resolvedCanonical = canonicalUrl || buildCanonicalUrl(normalizedPath);

    const data = {
      path: normalizedPath,
      slug: toSeoSlug(slug || normalizedPath),
      pageType,
      seoTitle: String(seoTitle).trim(),
      metaDescription: String(metaDescription).trim(),
      canonicalUrl: resolvedCanonical,
      metaRobots,
      h1Heading: String(h1Heading).trim(),
      introContent,
      mainContent,
      faqs,
      ogImage,
      schemaType,
      isIndexable: Boolean(isIndexable),
      publicationStatus,
      redirectToUrl,
      httpStatusCode: Number(httpStatusCode || 200),
    };

    const saved = id
      ? await prisma.seoPageConfig.update({ where: { id }, data })
      : await prisma.seoPageConfig.upsert({
          where: { path: normalizedPath },
          create: data,
          update: data,
        });

    const audit = await runAutomatedSeoAudit({ triggeredBy: 'CMS_PAGE_PUBLISH' });
    res.json({ success: true, page: saved, latestAudit: audit });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/seo/admin/service-locations - Create or Update Service + Location Landing Page
 */
router.post('/admin/service-locations', async (req, res) => {
  try {
    const {
      serviceSlug,
      locationSlug,
      serviceName,
      locationName,
      seoTitle,
      metaDescription,
      h1Heading,
      introContent,
      localGuideContent,
      localServiceAreas = [],
      benefits = [],
      faqs = [],
      startingPricePaise = 24900,
      availableHelpersCount = 5,
      isIndexable = true,
      publicationStatus = 'PUBLISHED',
    } = req.body;

    if (!serviceSlug || !locationSlug || !seoTitle || !metaDescription || !h1Heading) {
      return res.status(400).json({
        error: 'serviceSlug, locationSlug, seoTitle, metaDescription, and h1Heading are required',
      });
    }

    const sSlug = toSeoSlug(serviceSlug);
    const lSlug = toSeoSlug(locationSlug);
    const canonicalUrl = buildCanonicalUrl(`/services/${sSlug}/${lSlug}`);

    const data = {
      serviceSlug: sSlug,
      locationSlug: lSlug,
      serviceName: serviceName || sSlug,
      locationName: locationName || lSlug,
      seoTitle,
      metaDescription,
      canonicalUrl,
      h1Heading,
      introContent: introContent || '',
      localGuideContent: localGuideContent || '',
      localServiceAreas,
      benefits,
      faqs,
      startingPricePaise: Number(startingPricePaise || 24900),
      availableHelpersCount: Number(availableHelpersCount || 0),
      isIndexable: Boolean(isIndexable) && Number(availableHelpersCount || 0) > 0,
      publicationStatus,
    };

    const page = await prisma.serviceLocationPage.upsert({
      where: {
        serviceSlug_locationSlug: {
          serviceSlug: sSlug,
          locationSlug: lSlug,
        },
      },
      create: data,
      update: data,
    });

    const audit = await runAutomatedSeoAudit({ triggeredBy: 'SERVICE_LOCATION_PUBLISH' });
    res.json({ success: true, page, latestAudit: audit });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/seo/admin/blog - Create or Update SEO Blog Post
 */
router.post('/admin/blog', async (req, res) => {
  try {
    const {
      id,
      title,
      slug,
      excerpt,
      content,
      category = 'Home Services Guide',
      tags = [],
      authorName = 'HireBuddy Editorial Team',
      featuredImage = '/images/blog/trusted-home-cleaning-guide.webp',
      featuredImageAlt,
      seoTitle,
      metaDescription,
      relatedServiceSlugs = ['home-cleaning'],
      relatedLocationSlugs = ['noida', 'meerut'],
      isIndexable = true,
      publicationStatus = 'PUBLISHED',
    } = req.body;

    if (!title || !content || !seoTitle || !metaDescription) {
      return res.status(400).json({
        error: 'title, content, seoTitle, and metaDescription are required',
      });
    }

    if (/<script\b/i.test(`${title} ${content} ${seoTitle} ${metaDescription}`)) {
      return res.status(400).json({
        error: 'Unsafe <script> tags are prohibited in blog content.',
      });
    }

    const cleanSlug = toSeoSlug(slug || title);
    const canonicalUrl = buildCanonicalUrl(`/blog/${cleanSlug}`);

    const data = {
      title: String(title).trim(),
      slug: cleanSlug,
      excerpt: String(excerpt || metaDescription).trim(),
      content: String(content).trim(),
      category,
      tags: Array.isArray(tags)
        ? tags
        : String(tags || '')
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean),
      authorName,
      featuredImage,
      featuredImageAlt: featuredImageAlt || `${title} — HireBuddy Guide`,
      readingTimeMinutes: Math.max(2, Math.ceil(String(content).split(/\s+/).length / 180)),
      seoTitle: String(seoTitle).trim(),
      metaDescription: String(metaDescription).trim(),
      canonicalUrl,
      relatedServiceSlugs,
      relatedLocationSlugs,
      isIndexable: Boolean(isIndexable),
      publicationStatus,
      publishedAt: publicationStatus === 'PUBLISHED' ? new Date() : null,
    };

    const post = id
      ? await prisma.blogPost.update({ where: { id }, data })
      : await prisma.blogPost.upsert({
          where: { slug: cleanSlug },
          create: data,
          update: data,
        });

    const audit = await runAutomatedSeoAudit({ triggeredBy: 'BLOG_POST_PUBLISH' });
    res.json({ success: true, post, latestAudit: audit });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
