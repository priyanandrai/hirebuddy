# HireBuddy — Project Brief

## Executive Summary
**HireBuddy** is a community-driven hyperlocal services and local manufacturers marketplace platform connecting:
1. **Task Posters / Customers** (individuals needing immediate or everyday assistance, or buying directly from local manufacturers)
2. **Taskers / Helpers** (verified local skilled/semi-skilled community members)
3. **Manufacturers / Sellers** (verified local producers and artisans in Meerut & surrounding regions selling authentic goods such as sports equipment, scissors/cutlery, gajak/sweets, brassware, textiles, and handloom)
4. **Platform Admins** (operations, KYC moderation, finance/tax governance, and SEO/CMS management)

The project addresses both the "missing middle" in daily life services (tasks too small for formal agencies or too urgent/localized for traditional gig portals) and direct-from-manufacturer hyperlocal commerce with optional helper-powered doorstep delivery.

---

## Core Value Proposition
- **Hyperlocal Density**: Neighborhood-level discovery (Modipuram, Meerut, and expanding UP clusters) with geospatial proximity matching.
- **Trust-First Architecture**: Mandatory phone/OTP verification, KYC & address proof verification for helpers, GST/FSSAI/PAN/MSME verification for sellers, OTP-verified pickup/delivery handoffs, and transparent ratings.
- **Direct-from-Manufacturer Marketplace**: Dedicated Meerut Manufacturers Marketplace (`/marketplace`) with variant support, cart grouping, split commissions, daily NEFT settlements, and optional 2% platform-helper doorstep delivery auto-tasks.
- **CA-Grade Financial, GST, TDS/TCS & Ledger Engine**: Complete Indian tax compliance (`Section 9(5)`, `Section 52 TCS`, `Section 194-O TDS`, `206AA`), double-entry ledger journals, automated invoicing (`HB/COM`, `HB/SVC`, `HB/95`, `HB/CN`), and multi-provider payment routing (`Razorpay Route` & `Cashfree Split`).
- **Built-in Technical SEO & CMS**: Dynamic service-location landing pages (`/services/[serviceSlug]`, `/locations/[locationSlug]`), blog engine (`/blog`), promotional popup ads, JSON-LD structured data, and automated SEO health auditing.

---

## Target Audience & Personas

### 1. Task Poster / Buyer (`USER`)
- **Needs**: Quick discovery of trustworthy nearby helpers, transparent fixed/hourly pricing, real-time coordination, safe escrow-backed payment, and authentic local products.
- **Key Actions**: Post tasks, browse/filter helpers by category/location, direct hire (`HireButton`), purchase local manufacturer goods on `/marketplace`, chat in real-time, pay via Razorpay/Wallet, download GST invoices, and leave reviews.

### 2. Tasker / Helper (`HELPER`)
- **Needs**: Consistent local task feed (including auto-created marketplace delivery tasks), low platform friction (₹5/day or ₹99/month Partner Pass), instant earnings & tax visibility.
- **Key Actions**: Complete profile & service offerings, upload ID/address KYC & PAN/GST tax details, activate Partner Pass subscription, accept & complete tasks, verify delivery OTPs, and receive payouts.

### 3. Manufacturer / Seller (`SELLER`)
- **Needs**: Direct D2C storefront without middlemen, simple order management, flexible self-delivery or platform-helper delivery, and transparent daily settlements.
- **Key Actions**: Register via `/become-a-seller`, submit business KYC (PAN, GSTIN, FSSAI, MSME, bank details), manage product catalog & variants (`/dashboard-seller`), process orders, and track NEFT/Route settlements.

### 4. Platform Admin (`ADMIN`)
- **Needs**: Unified control center (`admin/` React + Vite SPA) to manage users, KYC verifications, marketplace approvals, financial reconciliation, CA tax rule approvals, and SEO/CMS content.
- **Key Actions**: Approve/reject helper IDs and seller KYC/products, configure commission & tax rules, process payouts/refunds/settlements, audit search logs, and manage SEO pages/blogs/promotional popups.

---

## Scope & Non-Goals

### In Scope
- Hyperlocal task lifecycle (`OPEN` → `REQUESTED` → `ASSIGNED` → `IN_PROGRESS` → `COMPLETED` / `CANCELLED`).
- Four role-tailored experiences: Customer Dashboard (`/dashboard`), Tasker Dashboard (`/dashboard-tasker`), Seller Dashboard (`/dashboard-seller`), and standalone Admin Portal (`admin/`).
- Mobile companion app (`mobile/` built with Expo & React Native).
- Meerut Manufacturers Marketplace (`/marketplace`, `/marketplace/[slug]`) with multi-seller cart checkout and helper delivery integration.
- Enterprise financial & tax engine (GST, TCS, TDS, double-entry ledger, payouts, refunds, reconciliation).
- Dynamic SEO & CMS engine (Service/Location matrix pages, Blog, Sitemap, Robots, SEO Auditor, Daily Promotional Popup).

### Explicit Non-Goals
- **Not a remote digital freelance board**: Focused strictly on physical, local services and regional goods.
- **Not an opaque bidding war**: Emphasizes transparent upfront rates, structured service offerings, and direct hiring.
