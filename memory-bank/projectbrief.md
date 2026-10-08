# HireBuddy — Project Brief

## Executive Summary
**HireBuddy** is a community-driven hyperlocal services platform connecting **Task Posters** (individuals needing immediate or everyday assistance) with **Taskers / Helpers** (verified local community members).

The project is built specifically to address the "missing middle" in daily life services: tasks that are too small for formal agencies (e.g., buying medicine from a local chemist, ironing 10 shirts, minor furniture assembly, elderly clinic escort) but too urgent or localized for traditional gig/freelance marketplaces.

---

## Core Value Proposition
- **Hyperlocal Density**: Focused on neighborhood-level discovery (e.g., Modipuram, Meerut) and proximity-based matching.
- **Trust-First Architecture**: Mandatory phone/identity verification, admin document review, rating history, and transparent reviews.
- **Frictionless Task Life Cycle**: Rapid task posting, one-click helper discovery, direct hiring, real-time coordination via Socket.IO, and integrated Razorpay payments.
- **Fair Economics**: Direct peer pricing, low platform friction, transparent hourly or fixed task rates in INR (paise precision).

---

## Target Audience & Personas

### 1. Task Poster (Customer)
- **Profile**: Busy professionals, elderly citizens, families needing everyday domestic or urgent errands.
- **Needs**: Quick discovery of trustworthy nearby help, clear fixed/hourly pricing, real-time status updates, safe cashless payment.
- **Key Actions**: Post task, search nearby helpers by category/location, direct hire specific helpers, chat in real-time, release payment upon task completion, leave review.

### 2. Tasker (Helper)
- **Profile**: Local skilled or semi-skilled workers, handymen, delivery runners, students seeking neighborhood work.
- **Needs**: Consistent local task feed within reasonable travel distance (e.g., 5-10km), direct client communication, reliable earnings tracking, fair review system.
- **Key Actions**: Complete profile & submit ID verification document, toggle availability, browse open tasks, accept tasks, execute and update status, track wallet/earnings.

### 3. Platform Admin
- **Profile**: Operations team / Community managers.
- **Needs**: Moderation of helper identity documents, dispute handling, quality control.
- **Key Actions**: Review uploaded government/photo IDs, verify or reject helper credentials, manage flagged activity.

---

## Scope & Non-Goals

### In Scope (MVP & Current Foundation)
- Hyperlocal task posting with category, budget, location, and schedule.
- Dual dashboards tailored for Posters (`/dashboard`) and Taskers (`/dashboard-tasker`).
- Helper profiles with skills, hourly rates, availability status, and verification badges.
- Direct hiring modal (`HireButton`) creating instant pre-assigned tasks.
- Hybrid search engine powered by Elasticsearch (geospatial + full-text) with MariaDB/Prisma database fallback.
- Real-time communication via Socket.IO (task rooms, live messaging, typing indicators, notifications).
- Integrated payments via Razorpay (order creation, signature validation, transaction history).
- Bi-directional review and rating system (1-5 stars with automatic average calculation).
- Helper ID verification queue and review interface (`/dashboard/admin/verify-ids`).

### Explicit Non-Goals (What HireBuddy Is NOT)
- **Not a remote freelancer platform**: No Upwork/Fiverr-style bids or multi-month contracts.
- **Not an enterprise agency marketplace**: No agency dispatchers or multi-tier corporate accounts.
- **Not a bloated super-app**: Focused exclusively on real-world local errands and hands-on help.
