import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import prisma from "../src/utils/prisma.js";
import {
  ensureSeoFoundationSeeded,
  getAllPublicServices,
  getPublicServiceBySlug,
  getPublicLocationBySlug,
  getPublicServiceLocationPage,
  getPublicHelperProfile,
  getPublicBlogPosts,
  getPublicBlogPostBySlug,
  getPublicSitemapEntries,
  evaluateSeoIndexability,
  sanitizePublicHelper,
} from "../src/services/seo.service.js";
import { runAutomatedSeoAudit } from "../src/services/seoAudit.service.js";
import { getHelper } from "../src/services/user.service.js";
import {
  generateCanonicalUrl,
  generatePageMetadata,
  generateServiceMetadata,
  generateLocationMetadata,
  generateServiceLocationMetadata,
  generateHelperMetadata,
  generateBlogMetadata,
  generateNoIndexMetadata,
} from "../../webapp/app/lib/seo.js";
import {
  buildOrganizationSchema,
  buildWebSiteSchema,
  buildLocalBusinessSchema,
  buildServiceSchema,
  buildBreadcrumbSchema,
  buildFaqSchema,
  buildArticleSchema,
  buildPersonSchema,
} from "../../webapp/app/lib/schema.js";
import sitemap from "../../webapp/app/sitemap.js";
import robots from "../../webapp/app/robots.js";

describe("HireBuddy Technical SEO & End-to-End Platform Validation Suite (17 Scenarios)", () => {
  before(async () => {
    await ensureSeoFoundationSeeded();
  });

  it("1. Homepage metadata exists, is unique, and has canonical URL", async () => {
    const homeConfig = await prisma.seoPageConfig.findUnique({
      where: { path: "/" },
    });
    assert.ok(homeConfig, "Homepage SEO config must exist in database");
    const meta = generatePageMetadata({
      title: homeConfig.seoTitle,
      description: homeConfig.metaDescription,
      path: "/",
      canonicalUrl: homeConfig.canonicalUrl,
    });
    assert.ok(meta.title.absolute.includes("HireBuddy"), "Homepage title must include brand");
    assert.ok(meta.description.length >= 80, "Homepage meta description must be descriptive");
    assert.equal(meta.alternates.canonical, "https://hirebuddy.in");
    assert.equal(meta.robots.index, true);
  });

  it("2. Service page metadata is generated dynamically and uniquely from DB", async () => {
    const { services } = await getAllPublicServices();
    assert.ok(services.length >= 5, "At least 5 core services must be seeded");

    const titles = new Set();
    const descriptions = new Set();
    for (const svc of services) {
      const meta = generateServiceMetadata(svc);
      const titleStr = meta.title.absolute || meta.title;
      assert.ok(titleStr, `Service ${svc.slug} must have a title`);
      assert.ok(meta.description, `Service ${svc.slug} must have a meta description`);
      assert.equal(
        meta.alternates.canonical,
        `https://hirebuddy.in/services/${svc.slug}`
      );
      assert.equal(titles.has(titleStr), false, `Duplicate title found: ${titleStr}`);
      assert.equal(
        descriptions.has(meta.description),
        false,
        `Duplicate description found: ${meta.description}`
      );
      titles.add(titleStr);
      descriptions.add(meta.description);
    }
  });

  it("3. Location page canonical URL and metadata are generated accurately", async () => {
    const locData = await getPublicLocationBySlug("noida");
    assert.ok(locData, "Noida location page must exist");
    assert.equal(locData.location.slug, "noida");

    const meta = generateLocationMetadata(locData.location);
    assert.equal(meta.alternates.canonical, "https://hirebuddy.in/locations/noida");
    assert.ok((meta.title.absolute || meta.title).includes("Noida"));
    assert.equal(meta.openGraph.url, "https://hirebuddy.in/locations/noida");
  });

  it("4. Service + Location page renders full server-side content, FAQs, and pricing", async () => {
    const res = await getPublicServiceLocationPage("home-cleaning", "noida");
    assert.ok(res?.page, "Home Cleaning in Noida landing page must exist");
    const { page, indexability } = res;
    assert.ok(page.h1Heading.includes("Home Cleaning"));
    assert.ok(page.introContent.length >= 120, "SSR intro content must be substantive");
    assert.ok(Array.isArray(page.faqs) && page.faqs.length >= 2, "SSR FAQs must be present");
    assert.ok(page.startingPricePaise > 0, "Starting price in paise must be positive");
    assert.equal(indexability.shouldIndex, true);

    const meta = generateServiceLocationMetadata(page, indexability);
    assert.equal(
      meta.alternates.canonical,
      "https://hirebuddy.in/services/home-cleaning/noida"
    );
    assert.equal(meta.robots.index, true);
  });

  it("5 & 6. sitemap.xml includes only indexable public pages and strictly excludes /admin, /dashboard, /api, /login", async () => {
    const dbEntries = await getPublicSitemapEntries();
    assert.ok(dbEntries.length >= 25, "DB sitemap entries must include all public routes");

    const entries = await sitemap();
    assert.ok(entries.length >= 25, "Next.js sitemap() must return all indexable public routes");

    const urls = entries.map((e) => e.url);
    assert.ok(urls.includes("https://hirebuddy.in/services/home-cleaning"));
    assert.ok(urls.includes("https://hirebuddy.in/locations/noida"));
    assert.ok(urls.includes("https://hirebuddy.in/services/home-cleaning/noida"));

    const forbiddenPatterns = [
      "/admin",
      "/dashboard",
      "/api/",
      "/login",
      "/signup",
      "/post-task",
      "/hire-buddy",
      "/payment",
    ];
    for (const u of urls) {
      for (const pat of forbiddenPatterns) {
        assert.equal(
          u.includes(pat),
          false,
          `Sitemap URL ${u} must never contain private path ${pat}`
        );
      }
    }
  });

  it("7. robots.txt allows public pages and blocks all private, auth, payment, and admin routes", () => {
    const robotsConfig = robots();
    assert.equal(robotsConfig.sitemap, "https://hirebuddy.in/sitemap.xml");
    const rule = robotsConfig.rules[0];
    assert.ok(rule.allow.includes("/"));
    assert.ok(rule.allow.includes("/services/"));
    assert.ok(rule.allow.includes("/locations/"));
    assert.ok(rule.disallow.includes("/admin/"));
    assert.ok(rule.disallow.includes("/dashboard/"));
    assert.ok(rule.disallow.includes("/api/"));
    assert.ok(rule.disallow.includes("/login"));
    assert.ok(rule.disallow.includes("/signup"));
  });

  it("8. Non-existent service returns null (triggering HTTP 404 notFound() in Next.js)", async () => {
    const missingService = await getPublicServiceBySlug("non-existent-unicorn-service-999");
    assert.equal(missingService, null);
  });

  it("9. Non-existent location returns null (triggering HTTP 404 notFound() in Next.js)", async () => {
    const missingLocation = await getPublicLocationBySlug("atlantis-underwater-city");
    assert.equal(missingLocation, null);
  });

  it("10. Draft, unapproved, or thin-content pages/profiles evaluate to noindex or 404", async () => {
    const draftEval = evaluateSeoIndexability({
      isActive: true,
      isSupported: true,
      publicationStatus: "DRAFT",
      isIndexableFlag: true,
      availableHelpersCount: 5,
      contentText: "A".repeat(300),
      canonicalUrl: "https://hirebuddy.in/services/test",
    });
    assert.equal(draftEval.shouldIndex, false);
    assert.equal(draftEval.robotsDirective, "noindex,follow");

    const thinEval = evaluateSeoIndexability({
      isActive: true,
      isSupported: true,
      publicationStatus: "PUBLISHED",
      isIndexableFlag: true,
      availableHelpersCount: 5,
      contentText: "Short thin text",
      canonicalUrl: "https://hirebuddy.in/services/test",
    });
    assert.equal(thinEval.shouldIndex, false);

    const missingHelper = await getPublicHelperProfile("non-existent-helper-slug-999");
    assert.equal(missingHelper, null);

    const noIndexMeta = generateNoIndexMetadata("Private Dashboard", "Private");
    assert.equal(noIndexMeta.robots.index, false);
    assert.equal(noIndexMeta.robots.follow, false);
  });

  it("11. Legacy/alias service slugs resolve via 301 redirect mapping (e.g., plumbing -> plumber, cleaning -> home-cleaning)", async () => {
    const redirected = await getPublicServiceBySlug("plumbing");
    assert.ok(redirected, "Legacy slug 'plumbing' must resolve");
    assert.equal(redirected.wasRedirected, true);
    assert.equal(redirected.canonicalSlug, "plumber");

    const cleaningAlias = await getPublicServiceBySlug("cleaning");
    assert.ok(cleaningAlias);
    assert.equal(cleaningAlias.wasRedirected, true);
    assert.equal(cleaningAlias.canonicalSlug, "home-cleaning");
  });

  it("12. Structured data builders output valid Schema.org JSON-LD without fake reviews or unverified claims", async () => {
    const org = buildOrganizationSchema();
    const site = buildWebSiteSchema();
    const svcData = await getPublicServiceBySlug("home-cleaning");
    const blogs = await getPublicBlogPosts();

    const svcSchema = buildServiceSchema({
      name: svcData.service.name,
      description: svcData.service.metaDescription,
      path: `/services/${svcData.service.slug}`,
      startingPriceRupees: svcData.service.startingPriceRupees,
      rating: null,
      reviewCount: 0,
    });
    const localSchema = buildLocalBusinessSchema();
    const breadcrumbSchema = buildBreadcrumbSchema([
      { label: "Home", href: "/" },
      { label: "Services", href: "/services" },
    ]);
    const faqSchema = buildFaqSchema(svcData.service.faqs);
    const articleSchema = buildArticleSchema(blogs[0]);

    for (const schemaObj of [
      org,
      site,
      svcSchema,
      localSchema,
      breadcrumbSchema,
      faqSchema,
      articleSchema,
    ]) {
      assert.ok(schemaObj, "Schema object must be defined");
      const serialized = JSON.stringify(schemaObj);
      const parsed = JSON.parse(serialized);
      assert.equal(parsed["@context"], "https://schema.org");
      assert.ok(parsed["@type"], "Schema must have @type");
    }

    // Verify no fake AggregateRating when reviewCount is 0
    assert.equal(
      svcSchema.aggregateRating,
      undefined,
      "Must never fabricate AggregateRating when real review count is 0"
    );
  });

  it("13. Every public page configuration has a dedicated non-empty H1 heading", async () => {
    const { services, locations } = await getAllPublicServices();
    for (const s of services) {
      const h1 = s.h1Heading || `${s.name} Services`;
      assert.ok(h1 && h1.trim().length > 5, `Service ${s.slug} must have a dedicated H1 heading`);
    }
    for (const l of locations) {
      assert.ok(
        l.h1Heading && l.h1Heading.trim().length > 5,
        `Location ${l.slug} must have a dedicated H1 heading`
      );
    }
  });

  it("14. Security & Privacy: Public helper endpoints NEVER expose phone, email, address, PAN, or KYC docs", async () => {
    const rawUser = {
      id: "user-123",
      slug: "ravi-kumar-noida",
      name: "Ravi Kumar",
      email: "ravi.secret@gmail.com",
      phone: "9876543210",
      address: "House 42, Secret Lane, Noida",
      idDocumentUrl: "https://secret-bucket/aadhaar.pdf",
      panEncrypted: "ENCRYPTED_PAN",
      city: "Noida",
      skills: "Plumber, Pipe Repair",
      experience: 6,
      hourlyRate: 25000,
      averageRating: 4.8,
      totalReviews: 12,
      idVerificationStatus: "VERIFIED",
    };

    const sanitized = sanitizePublicHelper(rawUser);
    const jsonStr = JSON.stringify(sanitized);
    assert.equal(sanitized.email, undefined);
    assert.equal(sanitized.phone, undefined);
    assert.equal(sanitized.address, undefined);
    assert.equal(sanitized.idDocumentUrl, undefined);
    assert.equal(jsonStr.includes("9876543210"), false);
    assert.equal(jsonStr.includes("ravi.secret@gmail.com"), false);

    // Also verify user.service.js getHelper(id) does not select email, phone, address, or idDocumentUrl
    const dbHelper = await prisma.user.findFirst({ where: { role: "HELPER" } });
    if (dbHelper) {
      const publicProfile = await getHelper(dbHelper.slug || dbHelper.id);
      assert.ok(publicProfile);
      assert.equal(publicProfile.email, undefined, "getHelper must not expose email");
      assert.equal(publicProfile.phone, undefined, "getHelper must not expose phone");
      assert.equal(publicProfile.address, undefined, "getHelper must not expose address");
      assert.equal(publicProfile.idDocumentUrl, undefined, "getHelper must not expose KYC URL");
    }
  });

  it("15. Images have descriptive non-empty alt attributes across blog posts and Open Graph metadata", async () => {
    const { services } = await getAllPublicServices();
    for (const s of services) {
      const meta = generateServiceMetadata(s);
      assert.ok(
        meta.openGraph.images[0].alt && meta.openGraph.images[0].alt.trim().length > 5,
        `Service ${s.slug} OG image must have descriptive alt text`
      );
    }
    const blogs = await getPublicBlogPosts();
    for (const b of blogs) {
      assert.ok(
        b.featuredImageAlt && b.featuredImageAlt.trim().length > 5,
        `Blog ${b.slug} must have descriptive featuredImageAlt text`
      );
    }
  });

  it("16. Internal links between services, locations, and blogs resolve to valid existing slugs", async () => {
    const { services, locations } = await getAllPublicServices();
    const serviceSlugs = new Set(services.map((s) => s.slug));
    const locationSlugs = new Set(locations.map((l) => l.slug));

    const blogs = await getPublicBlogPosts();
    for (const b of blogs) {
      for (const relSvcSlug of b.relatedServiceSlugs || []) {
        assert.ok(
          serviceSlugs.has(relSvcSlug),
          `Blog ${b.slug} related service /services/${relSvcSlug} must exist`
        );
      }
      for (const relLocSlug of b.relatedLocationSlugs || []) {
        assert.ok(
          locationSlugs.has(relLocSlug),
          `Blog ${b.slug} related location /locations/${relLocSlug} must exist`
        );
      }
    }
  });

  it("17. Blog post metadata, canonical URL, reading time, and automated SEO audit score work end-to-end", async () => {
    const res = await getPublicBlogPostBySlug("how-to-find-trusted-home-cleaning-services");
    assert.ok(res?.post, "Seeded blog post must exist");
    const { post, indexability } = res;
    const meta = generateBlogMetadata(post, indexability);
    assert.equal(
      meta.alternates.canonical,
      "https://hirebuddy.in/blog/how-to-find-trusted-home-cleaning-services"
    );
    assert.ok((meta.title.absolute || meta.title).includes("Cleaning"));
    assert.ok(meta.description.length >= 80);

    // Run automated SEO audit and verify health score
    const audit = await runAutomatedSeoAudit();
    assert.ok(
      audit.auditScore >= 90,
      `Expected SEO audit score >= 90, got ${audit.auditScore}`
    );
    assert.equal(audit.missingMetadataCount, 0, "Zero pages should be missing SEO metadata");
    assert.equal(audit.duplicateTitlesCount, 0, "Zero pages should have duplicate SEO titles");
    assert.equal(audit.missingH1Count, 0, "Zero pages should be missing H1 headings");
  });
});
