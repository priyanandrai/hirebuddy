# HireBuddy — Active Context

## Current Status & Focus
HireBuddy has evolved into a full-featured hyperlocal services + regional manufacturers marketplace platform with four client surfaces (`webapp/`, `admin/`, `mobile/`, and `backend/`):
1. **Meerut Manufacturers Marketplace & Product Detail Pages**:
   - Full marketplace catalog (`/marketplace`) and individual product detail pages (`/marketplace/[slug]`) with product variants, highlights, ratings, seller badges, multi-seller cart checkout, and `SELLER_SELF` vs. `PLATFORM_HELPER` (+2% auto-task delivery with pickup/delivery OTPs).
   - Dedicated Seller onboarding (`/become-a-seller`), Seller dashboard (`/dashboard-seller`), and Admin Marketplace management (`admin/src/pages/MarketplacePage.jsx`).
2. **CA-Grade Financial, GST, TDS/TCS, Payout & Double-Entry Ledger Engine**:
   - Complete tax engines (`gstTaxEngine.service.js`, `tdsWithholdingEngine.service.js`, `pricingBreakdown.service.js`, `commission.service.js`), double-entry accounting (`ledger.service.js`), automated sequential GST invoicing (`invoice.service.js`), helper payouts (`payout.service.js`), refund recovery (`refundEngine.service.js`), and reconciliation (`reconciliation.service.js`).
   - Pluggable payment gateways (`RazorpayRouteProvider.js`, `CashfreeSplitProvider.js`) and AES-256-GCM encrypted PAN/bank vault (`cryptoVault.js`).
3. **Technical SEO, CMS & Daily Promotional Popup System**:
   - Database-backed SEO metadata, dynamic Service pages (`/services/[serviceSlug]`), Location & Service-Location matrix pages (`/locations/[locationSlug]`), Blog CMS (`/blog`), dynamic XML sitemap (`/sitemap.xml`), `robots.txt`, and automated SEO health auditor (`seoAudit.service.js`).
   - Admin-configurable `PromotionalPopupAd` model & frontend `DailyPromotionalPopup.js` component supporting featured product/service deals with configurable delay and once-per-day frequency.
4. **Expanded Service Categories & Custom Helper Service Offerings**:
   - Expanded service categories including Carpenter, Cooking, Personal Care, and Others (with dedicated service assets in `webapp/public/images/`).
   - Helpers can define custom `serviceOfferings` (structured pricing menu per sub-service) and SEO-friendly profile slugs (`/helpers/[id]`).

---

## Recent Git Commit History

| Commit | Summary | Key Impact |
|---|---|---|
| `Working Tree` | Marketplace Product Details, Promotional Popup Ads, Expanded Categories & SEO Enhancements | Added `/marketplace/[slug]`, `PromotionalPopupAd` model + `DailyPromotionalPopup.js`, new service category images, helper `serviceOfferings`, and Admin CMS controls |
| `bcc237b` | `added some chnages` | Incremental refinements across backend and frontend |
| `64b8a36` | `added more flows` | Marketplace, seller, wallet, and financial/tax flows |
| `52878c9` | `addded notification` | Real-time & push notification enhancements |
| `3dd002c` | `modify category` | Dynamic category & sub-services expansion |
| `d4c8603` | `added helper verificication flow` | Multi-document KYC & address proof verification |
| `007ba8f` | `added admin app` | Standalone Vite + React 19 Admin Portal (`admin/`) |
| `4220253` | `added helper view page` | Public helper profile (`/helpers/[id]`) |

---

## Active Working Tree Changes (`git status`)

### Backend (`backend/`)
- **`prisma/schema.prisma`**: Added `PromotionalPopupAd`, product `variants` & `highlights`, helper `serviceOfferings` & `slug`, `cartGroupId` & OTP fields on `MarketplaceOrder`, and complete Phase 2 Finance/Tax/Ledger & SEO/CMS models.
- **`src/controllers/marketplace.controller.js`**, **`src/routes/marketplace.routes.js`**, **`src/services/marketplace.service.js`**: Product slug lookup, variant support, multi-seller cart checkout, and promotional popup ad integration.
- **`src/routes/seo.routes.js`**, **`src/services/seo.service.js`**: Endpoints and service methods for `PromotionalPopupAd` and dynamic SEO page configs.
- **`src/services/category.service.js`**, **`src/services/task.service.js`**, **`src/services/user.service.js`**: Support for expanded categories, helper `serviceOfferings`, and slug-based helper lookup.
- **`tests/seo-and-e2e.test.js`**: Updated automated tests covering SEO, CMS, and marketplace flows.

### Webapp (`webapp/`)
- **`app/marketplace/page.js`** & **`app/marketplace/[slug]/`** (Untracked): Full marketplace catalog & dedicated product detail page with variants, reviews, and cart integration.
- **`app/components/ui/DailyPromotionalPopup.js`** (Untracked): Timed promotional popup component driven by `/api/seo/popup-ad`.
- **`app/services/page.js`**, **`app/services/[serviceSlug]/page.js`**, **`app/public/images/service_*.png`**: New service visuals (`service_carpenter.png`, `service_cooking.png`, `service_others.png`, `service_personal_care.png`) and rich service landing pages.
- **`app/helpers/[id]/page.js` & `layout.js`**, **`app/dashboard-tasker/profile/edit/page.js`**: Helper custom `serviceOfferings` editor and interactive service selection on public helper profiles.
- **`app/become-a-seller/page.js`**, **`app/dashboard/create-task/page.js`**, **`app/dashboard/page.js`**, **`app/components/layout/HeaderAfterlogin.js`**: UI and workflow polish across customer, tasker, and seller views.

### Admin Portal (`admin/`)
- **`src/pages/MarketplacePage.jsx`**: Variant & product approval controls, seller KYC management, and order settlement views.
- **`src/pages/SeoCmsDashboardPage.jsx`**: Added Promotional Popup Ad management alongside SEO page configs, blog editor, and SEO audit runner.
- **`src/services/api.js`**: Added API bindings for popup ads and marketplace updates.
