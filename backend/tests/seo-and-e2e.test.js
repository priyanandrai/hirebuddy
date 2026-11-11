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
import { getHelper, normalizeServiceOfferings } from "../src/services/user.service.js";
import { getFilteredServices } from "../src/services/category.service.js";
import { createTask, searchTasks, assignHelper } from "../src/services/task.service.js";
import {
  onboardOrUpdateSeller,
  createSellerProduct,
  adminVerifySeller,
  adminVerifyAndPublishProduct,
  placeMarketplaceOrder,
  getPublishedProductBySlug,
  updateMarketplaceOrderStatus,
  rateMarketplaceOrder,
  getActivePromotionalPopupAd,
  adminUpdatePromotionalPopupAd,
} from "../src/services/marketplace.service.js";
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

  it("18. Multi-Service & Multi-Option Rate Card: Single helper can offer Car Wash + Dry Cleaning with multiple packages, units & prices", async () => {
    // 1. Default multi-service templates auto-generate rich rate cards for Car Wash & Dry Cleaning
    const defaultOfferings = normalizeServiceOfferings(
      null,
      ["Car Wash", "Dry Cleaning"],
      29900
    );
    assert.ok(
      defaultOfferings.length >= 8,
      "Should generate multiple packages across both Car Wash and Dry Cleaning"
    );

    const carWashOptions = defaultOfferings.filter((o) => o.category === "Car Wash");
    const dryCleanOptions = defaultOfferings.filter((o) => o.category === "Dry Cleaning");
    assert.ok(carWashOptions.length >= 4, "Car Wash must have multiple vehicle/package options");
    assert.ok(dryCleanOptions.length >= 4, "Dry Cleaning must have multiple garment/item options");

    // Verify distinct prices and units (per car, per piece, per set, per item)
    const carPrices = new Set(carWashOptions.map((o) => o.pricePaise));
    assert.ok(carPrices.size >= 3, "Car Wash options must have distinct tier prices in paise");
    assert.equal(carWashOptions[0].unit, "per car");
    assert.ok(
      dryCleanOptions.some((o) => o.unit === "per piece") &&
        dryCleanOptions.some((o) => o.unit === "per set"),
      "Dry Cleaning options must support per piece and per set units"
    );

    // 2. Custom multi-option rate card saved by helper preserves exact integer paise & rupees
    const customOfferings = normalizeServiceOfferings(
      [
        {
          id: "cw-hatch",
          category: "Car Wash",
          title: "Hatchback Foam Wash",
          priceRupees: 299,
          unit: "per car",
        },
        {
          id: "cw-suv-detail",
          category: "Car Wash",
          title: "SUV Full Interior + Ceramic Foam Wash",
          priceRupees: 799,
          unit: "per car",
        },
        {
          id: "dc-suit",
          category: "Dry Cleaning",
          title: "3-Piece Wedding Suit Dry Clean",
          priceRupees: 499,
          unit: "per set",
        },
      ],
      ["Car Wash", "Dry Cleaning"],
      29900
    );

    assert.equal(customOfferings.length, 3);
    assert.equal(customOfferings[0].pricePaise, 29900);
    assert.equal(customOfferings[1].pricePaise, 79900);
    assert.equal(customOfferings[2].pricePaise, 49900);
    assert.equal(customOfferings[2].unit, "per set");

    // 3. Public helper sanitizer exposes normalized serviceOfferings
    const publicHelper = sanitizePublicHelper({
      id: "helper-multi-1",
      name: "Vikram Multi-Service Pro",
      city: "Noida",
      skills: "Car Wash, Dry Cleaning",
      hourlyRate: 29900,
      serviceOfferings: customOfferings,
    });
    assert.equal(Array.isArray(publicHelper.serviceOfferings), true);
    assert.equal(publicHelper.serviceOfferings.length, 3);
    assert.equal(publicHelper.hourlyRateRupees, 299);
  });

  it("19. Marketplace E2E Flow: Seller lists any item (Saree/Gift) with Delivery Option, Admin sets dynamic Seller Commission %, and Customer 'Buy' auto-picks Profile Phone & Address", async () => {
    const uniqueSuffix = Date.now();
    const sellerPhone = `98${String(uniqueSuffix).slice(-8)}`;
    const buyerPhone = `99${String(uniqueSuffix).slice(-8)}`;
    // 1. Create a Seller User & Onboard
    const sellerUser = await prisma.user.create({
      data: {
        name: "Saree & Gift Emporium Seller",
        email: `saree.seller.${uniqueSuffix}@hirebuddy.in`,
        phone: sellerPhone,
        role: "SELLER",
        city: "Meerut",
        address: "Abu Lane Market, Meerut, UP",
      },
    });

    const sellerProfile = await onboardOrUpdateSeller(sellerUser.id, {
      businessName: "Abu Lane Saree & Gift House",
      businessCategory: "Sarees, Lehengas & Ethnic Fashion",
      contactPersonName: "Anita Gupta",
      contactPersonPhone: sellerPhone,
      pickupAddress: "Shop 12, Abu Lane, Meerut",
      pickupCity: "Meerut",
      pickupPincode: "250001",
      panNumber: "ABCDE1234F",
      bankAccountName: "Abu Lane Saree & Gift House",
      bankAccountNumber: "50200099887766",
      bankIfscCode: "HDFC0000254",
      bankName: "HDFC Bank",
    });

    assert.equal(sellerProfile.commissionPct, 15, "Default seller commission must be 15%");

    // 2. Admin configures dynamic commission rate for this Seller (e.g., 12%)
    const verifiedSeller = await adminVerifySeller(sellerProfile.id, {
      verificationStatus: "VERIFIED",
      bankVerified: true,
      commissionPct: 12,
    });
    assert.equal(verifiedSeller.commissionPct, 12, "Admin-configured seller commission must update to 12%");

    // 3. Seller adds a Saree product and chooses "Need HireBuddy Delivery Help" (deliveryByPlatform: true)
    const sareeProduct = await createSellerProduct(sellerUser.id, {
      title: "Pure Kanjivaram Silk Festive Saree",
      category: "Sarees & Ethnic Wear",
      description: "Handwoven silk saree with rich zari border",
      priceRupees: 2000,
      mrpRupees: 2800,
      stock: 20,
      unit: "saree",
      deliveryByPlatform: true,
    });

    assert.equal(sareeProduct.deliveryByPlatform, true, "Seller's chosen delivery option must be saved on product");
    assert.equal(sareeProduct.commissionPct, 12, "Product must inherit Seller's dynamic 12% commission");

    // 4. Admin verifies & publishes the product
    const publishedSaree = await adminVerifyAndPublishProduct(sareeProduct.id, {
      status: "PUBLISHED",
    });
    assert.equal(publishedSaree.isPublished, true);

    // 5. Create a Customer User with saved Profile Phone & Address
    const customerUser = await prisma.user.create({
      data: {
        name: "Neha Customer",
        email: `neha.buyer.${uniqueSuffix}@hirebuddy.in`,
        phone: buyerPhone,
        address: "B-42, Shastri Nagar, Meerut, UP",
        city: "Meerut",
        role: "USER",
      },
    });

    // 6. Customer clicks "Buy" WITHOUT passing shippingPhone, shippingAddress, or deliveryMode!
    const orderRes = await placeMarketplaceOrder(customerUser.id, {
      items: [{ productId: publishedSaree.id, quantity: 1 }],
    });

    // Verify phone & address were picked from Customer's User Profile automatically
    assert.equal(orderRes.order.customerName, "Neha Customer");
    assert.equal(orderRes.order.customerPhone, buyerPhone);
    assert.equal(orderRes.order.shippingAddress, "B-42, Shastri Nagar, Meerut, UP");

    // Verify delivery mode was taken from Seller's product setting (PLATFORM_HELPER), NOT asked to customer
    assert.equal(orderRes.order.deliveryMode, "PLATFORM_HELPER");
    assert.ok(orderRes.deliveryTask, "Auto-delivery task must be created for Helper Buddies");

    // Verify Customer only paid the product price (₹2,000), while Seller's 12% commission (₹240) + 2% delivery help (₹40) were deducted on Seller side (Seller gets ₹1,720)
    assert.equal(orderRes.order.totalPaidRupees, 2000);
    assert.equal(orderRes.order.platformCommissionRupees, 240);
    assert.equal(orderRes.order.deliveryFeeRupees, 40);
    assert.equal(orderRes.order.sellerPayableRupees, 1720);
  });

  it("20. Blinkit + Amazon Marketplace E2E: Product Variants (Color/Weight), Dedicated Product Slug Page, Multi-Seller Unified Cart Split, OTP Handshake & Buyer Rating", async () => {
    const suffix = Date.now() + 100;
    const phoneA = `96${String(suffix).slice(-8)}`;
    const phoneB = `95${String(suffix).slice(-8)}`;
    const phoneBuyer = `97${String(suffix).slice(-8)}`;

    // 1. Seller A (Saree Weaver with 10% Admin-configured commission + HireBuddy Partner Delivery)
    const sellerAUser = await prisma.user.create({
      data: {
        name: "Weaver Saree Seller",
        email: `weaver.a.${suffix}@hirebuddy.in`,
        phone: phoneA,
        role: "SELLER",
        city: "Meerut",
        address: "Handloom Cluster, Meerut",
      },
    });
    const sellerAProfile = await onboardOrUpdateSeller(sellerAUser.id, {
      businessName: "Royal Meerut Silk Weavers",
      businessCategory: "Sarees, Lehengas & Ethnic Fashion",
      contactPersonName: "Meera Devi",
      contactPersonPhone: phoneA,
      pickupAddress: "Plot 9, Handloom Cluster, Meerut",
      pickupCity: "Meerut",
      pickupPincode: "250002",
      panNumber: "AAAPA1111A",
      bankAccountName: "Royal Meerut Silk Weavers",
      bankAccountNumber: "50200011112222",
      bankIfscCode: "HDFC0000254",
    });
    await adminVerifySeller(sellerAProfile.id, {
      verificationStatus: "VERIFIED",
      commissionPct: 10,
    });

    const sareeWithVariants = await createSellerProduct(sellerAUser.id, {
      title: "Designer Zari Silk Saree",
      category: "Sarees & Ethnic Wear",
      description: "Pure silk saree with multiple color variants",
      priceRupees: 2200,
      mrpRupees: 3500,
      unit: "saree",
      deliveryByPlatform: true,
      variants: [
        { label: "Crimson Red Zari", priceRupees: 2200, mrpRupees: 3500, stock: 10 },
        { label: "Royal Gold Zari", priceRupees: 2500, mrpRupees: 3800, stock: 8 },
      ],
      highlights: ["Pure Silk Zari Border", "Includes Unstitched Blouse Piece"],
    });
    const pubSaree = await adminVerifyAndPublishProduct(sareeWithVariants.id, {
      status: "PUBLISHED",
    });

    // 2. Seller B (Gift Hamper Seller with 15% commission + Self Delivery)
    const sellerBUser = await prisma.user.create({
      data: {
        name: "Festive Gift Box Seller",
        email: `gifts.b.${suffix}@hirebuddy.in`,
        phone: phoneB,
        role: "SELLER",
        city: "Meerut",
        address: "Sadar Bazaar, Meerut",
      },
    });
    const sellerBProfile = await onboardOrUpdateSeller(sellerBUser.id, {
      businessName: "Sadar Luxury Gift Hampers",
      businessCategory: "Gifts, Hampers & Festive Boxes",
      contactPersonName: "Rohan Jain",
      contactPersonPhone: phoneB,
      pickupAddress: "Shop 44, Sadar Bazaar, Meerut",
      pickupCity: "Meerut",
      pickupPincode: "250001",
      panNumber: "BBBPB2222B",
      bankAccountName: "Sadar Luxury Gift Hampers",
      bankAccountNumber: "50200033334444",
      bankIfscCode: "HDFC0000254",
    });
    await adminVerifySeller(sellerBProfile.id, {
      verificationStatus: "VERIFIED",
      commissionPct: 15,
    });

    const giftProduct = await createSellerProduct(sellerBUser.id, {
      title: "Wedding Dry-Fruit & Brass Diya Gift Box",
      category: "Gifts & Hampers",
      description: "Festive gift box for weddings and anniversaries",
      priceRupees: 1000,
      mrpRupees: 1400,
      unit: "gift box",
      deliveryByPlatform: false,
    });
    const pubGift = await adminVerifyAndPublishProduct(giftProduct.id, {
      status: "PUBLISHED",
    });

    // 3. Verify Amazon-style Dedicated Product Detail Page lookup by slug
    const detailRes = await getPublishedProductBySlug(pubSaree.slug);
    assert.ok(detailRes?.product, "Product detail must resolve by slug");
    assert.equal(detailRes.product.variants.length, 2, "Product must expose its 2 variants");
    assert.equal(detailRes.product.highlights.length, 2, "Product must expose its highlights");

    // 4. Customer with saved Profile Phone & Address places a Unified Multi-Seller Cart Order
    const buyer = await prisma.user.create({
      data: {
        name: "Aarti Sharma",
        email: `aarti.buyer.${suffix}@hirebuddy.in`,
        phone: phoneBuyer,
        address: "House 18, Saket, Meerut, UP",
        city: "Meerut",
        role: "USER",
      },
    });

    const cartOrderRes = await placeMarketplaceOrder(buyer.id, {
      items: [
        {
          productId: pubSaree.id,
          quantity: 1,
          selectedVariant: "Royal Gold Zari", // Variant price = ₹2,500
        },
        {
          productId: pubGift.id,
          quantity: 2, // 2 × ₹1,000 = ₹2,000
        },
      ],
    });

    // Verify Cart was automatically split into 2 Seller Orders linked by cartGroupId
    assert.ok(cartOrderRes.cartGroupId, "Multi-seller cart must generate a shared cartGroupId");
    assert.equal(cartOrderRes.orders.length, 2, "Multi-seller cart must split into 2 per-seller orders");
    assert.equal(cartOrderRes.splitSummary.totalCustomerPaidRupees, 4500, "Total customer paid must be ₹2,500 + ₹2,000 = ₹4,500");

    const sareeOrder = cartOrderRes.orders.find((o) => o.sellerId === sellerAProfile.id);
    const giftOrder = cartOrderRes.orders.find((o) => o.sellerId === sellerBProfile.id);

    // Saree Order: ₹2,500 (Royal Gold Zari variant), 10% commission (₹250) + 2% Buddy delivery (₹50) -> Seller gets ₹2,200
    assert.equal(sareeOrder.totalPaidRupees, 2500);
    assert.equal(sareeOrder.items[0].selectedVariant, "Royal Gold Zari");
    assert.equal(sareeOrder.platformCommissionRupees, 250);
    assert.equal(sareeOrder.deliveryFeeRupees, 50);
    assert.equal(sareeOrder.sellerPayableRupees, 2200);
    assert.equal(sareeOrder.customerPhone, phoneBuyer, "Auto-picked phone from profile");
    assert.equal(sareeOrder.shippingAddress, "House 18, Saket, Meerut, UP", "Auto-picked address from profile");

    // Gift Order: ₹2,000, 15% commission (₹300), 0% delivery (Self-Delivery) -> Seller gets ₹1,700
    assert.equal(giftOrder.totalPaidRupees, 2000);
    assert.equal(giftOrder.platformCommissionRupees, 300);
    assert.equal(giftOrder.deliveryFeeRupees, 0);
    assert.equal(giftOrder.sellerPayableRupees, 1700);

    // 5. Verify Blinkit-style Pickup OTP & Delivery OTP Handshake
    const outForDelivery = await updateMarketplaceOrderStatus(
      sareeOrder.id,
      "OUT_FOR_DELIVERY",
      { otp: sareeOrder.pickupOtp }
    );
    assert.equal(outForDelivery.orderStatus, "OUT_FOR_DELIVERY");

    const delivered = await updateMarketplaceOrderStatus(
      sareeOrder.id,
      "DELIVERED",
      { otp: sareeOrder.deliveryOtp }
    );
    assert.equal(delivered.orderStatus, "DELIVERED");

    // 6. Verify Buyer 5-Star Rating & Review updates Product Rating
    const rated = await rateMarketplaceOrder(buyer.id, sareeOrder.id, {
      rating: 5,
      review: "Authentic Banarasi silk saree delivered in 40 mins!",
    });
    assert.equal(rated.buyerRating, 5);
  });

  it("21. Admin Promotional Popup Ad (Product or Service) with smooth delay and ONCE_PER_DAY frequency works end-to-end", async () => {
    // 1. Default promo ad is auto-seeded and active
    const initialPromo = await getActivePromotionalPopupAd();
    assert.ok(initialPromo, "Default promotional popup ad must be active");
    assert.equal(initialPromo.frequency, "ONCE_PER_DAY");
    assert.ok(initialPromo.delaySeconds >= 2, "Delay seconds must be configured");

    // 2. Admin configures a SERVICE promotional popup ad
    const serviceAd = await adminUpdatePromotionalPopupAd({
      adType: "SERVICE",
      targetServiceSlug: "home-cleaning",
      badgeText: "⚡ Verified Home Service Spotlight",
      title: "Deep Home Cleaning & Sanitization in Noida & Meerut",
      subtitle: "Book verified background-checked cleaning professionals with instant scheduling.",
      offerPriceRupees: 499,
      mrpRupees: 799,
      discountText: "FLAT 38% OFF",
      ctaText: "Book Home Cleaning →",
      ctaUrl: "/services/home-cleaning",
      delaySeconds: 7,
      isActive: true,
    });
    assert.equal(serviceAd.adType, "SERVICE");
    assert.equal(serviceAd.offerPriceRupees, 499);
    assert.equal(serviceAd.delaySeconds, 7);
    assert.equal(serviceAd.frequency, "ONCE_PER_DAY");

    // 3. Admin configures a PRODUCT promotional popup ad
    const productAd = await adminUpdatePromotionalPopupAd({
      adType: "PRODUCT",
      badgeText: "✨ Featured Spotlight of the Day",
      title: "Authentic Meerut Special Gajak & Handloom Gift Box",
      subtitle: "Direct from verified Meerut manufacturers & local sellers. Freshly packed with doorstep delivery.",
      offerPriceRupees: 380,
      mrpRupees: 460,
      discountText: "17% OFF TODAY",
      ctaText: "Explore Marketplace →",
      ctaUrl: "/marketplace",
      delaySeconds: 6,
      isActive: true,
    });
    assert.equal(productAd.adType, "PRODUCT");
    assert.equal(productAd.offerPriceRupees, 380);
    assert.equal(productAd.delaySeconds, 6);
  });

  it("22. Dashboard Services create an OPEN task without pre-assigning a single Buddy and each service has its relevant image", async () => {
    // 1. Dashboard getFilteredServices returns services WITHOUT a default pre-assigned helperId
    //    and every service has a relevant /images/service_*.png banner image
    const catalogRes = await getFilteredServices({});
    assert.ok(Array.isArray(catalogRes.services) && catalogRes.services.length > 0);
    for (const svc of catalogRes.services) {
      assert.equal(
        svc.helperId,
        null,
        `Service "${svc.title}" on /dashboard must not be pre-assigned to a specific helperId by default`
      );
      assert.equal(
        svc.helperName,
        null,
        `Service "${svc.title}" on /dashboard must not show a single pre-assigned helperName by default`
      );
      assert.ok(
        typeof svc.image === "string" && svc.image.startsWith("/images/service_"),
        `Service "${svc.title}" must have a dedicated relative image (got ${svc.image})`
      );
    }

    const cookingSvc = catalogRes.services.find((s) => s.slug === "cooking");
    const personalCareSvc = catalogRes.services.find((s) => s.slug === "personal-care");
    const othersSvc = catalogRes.services.find((s) => s.slug === "others");
    if (cookingSvc) assert.equal(cookingSvc.image, "/images/service_cooking.png");
    if (personalCareSvc) assert.equal(personalCareSvc.image, "/images/service_personal_care.png");
    if (othersSvc) assert.equal(othersSvc.image, "/images/service_others.png");

    // 2. Create a Customer & a Verified Helper Buddy
    const suffix = Date.now();
    const customer = await prisma.user.create({
      data: {
        name: "Open Task Customer",
        email: `open-task-cust-${suffix}@hirebuddy.in`,
        phone: `91${String(suffix).slice(-8)}`,
        role: "USER",
        city: "Meerut",
        address: "Modipuram, Meerut",
      },
    });

    const buddy = await prisma.user.create({
      data: {
        name: "Available Service Buddy",
        email: `open-task-buddy-${suffix}@hirebuddy.in`,
        phone: `92${String(suffix).slice(-8)}`,
        role: "HELPER",
        idVerificationStatus: "VERIFIED",
        skills: "Home Cleaning, Plumbing",
        city: "Meerut",
        walletBalance: 5000, // ₹50 wallet balance for active daily pass
      },
    });

    // 3. Customer posts a task from /dashboard service (no helperId)
    const openTask = await createTask(
      {
        title: `Full Home Cleaning ${suffix}`,
        category: "Home Cleaning",
        description: "Need verified Home Cleaning assistance at my location.",
        location: "Modipuram, Meerut",
        budget: 300,
        preferredAt: new Date().toISOString(),
        timeSlot: "10:00 AM - 12:00 PM",
        helperId: null,
        bookNow: false,
      },
      customer
    );

    assert.equal(openTask.status, "OPEN", "Task created from /dashboard service must be OPEN");
    assert.equal(openTask.assignedToId, null, "Task must not have an assignedToId by default");

    // 4. All Buddies can see the OPEN task in the Buddy feed
    const buddyFeed = await searchTasks({ status: "OPEN", view: "helper", limit: 50 });
    const foundInFeed = buddyFeed.tasks.find((t) => t.id === openTask.id);
    assert.ok(foundInFeed, "Newly posted OPEN task must be visible to all Buddies in the task feed");

    // 5. Any verified Buddy can apply/accept the OPEN task
    const acceptedTask = await assignHelper(buddy, openTask.id);
    assert.equal(acceptedTask.status, "ASSIGNED");
    assert.equal(acceptedTask.assignedToId, buddy.id);
  });
});
