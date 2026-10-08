# HireBuddy — Progress & Roadmap

## Implementation Scorecard

| Module / Subsystem | Backend Status | Frontend Status | Overall Readiness |
|---|---|---|---|
| **Authentication & Authorization** | ✅ Complete (JWT, Bcrypt, OTP, Google Auth) | ✅ Complete (NextAuth + custom JWT storage) | 🟢 95% |
| **User & Helper Profiles** | ✅ Complete (Skills, Rates, Availability, Details) | ✅ Complete (Public `/helpers/[id]`, Dashboards) | 🟢 98% |
| **Helper ID Verification** | ✅ Complete (Submission, States, Admin API) | ✅ Complete (Admin queue UI at `/verify-ids`) | 🟢 95% |
| **Task Management** | ✅ Complete (CRUD, State machine, Geospatial) | ✅ Complete (Create, My Tasks, Tasker Feed) | 🟢 90% |
| **Categories System** | ✅ Complete (Prisma `Category` model, seed script) | ✅ Complete (Dynamic fetch from DB on create-task, hire-buddy, services) | 🟢 100% |
| **Direct Hire Flow** | ✅ Complete (`/api/hire` pre-assignment) | ✅ Complete (`HireButton` modal & flow) | 🟢 95% |
| **Search & Discovery** | ✅ Complete (Elasticsearch + MariaDB Fallback) | ✅ Complete (Category pages `/categories/[slug]`, Live filters) | 🟢 100% |
| **Real-time Chat & Sockets** | ✅ Complete (Socket.IO server, rooms, DB save) | 🟡 Partial (Socket client ready, chat UI pending) | 🟡 70% |
| **Payment Gateway** | ✅ Complete (Razorpay orders, signatures) | 🟡 Partial (Service ready, checkout UI pending) | 🟡 70% |
| **Reviews & Ratings** | ✅ Complete (1-5 star ratings, stats leaderboard) | 🟡 Partial (Service ready, review submission UI pending) | 🟡 75% |
| **Notifications** | ✅ Complete (DB tracking, unread counts, events) | 🟡 Partial (Inbox page exists, real-time push pending) | 🟡 80% |

---

## Detailed Status of Features

### ✅ Completed & Fully Functional
1. **Database & Migrations**:
   - Complete Prisma schema in MariaDB with 7 core models: `User`, `Otp`, `Task`, `Message`, `Review`, `Payment`, `Notification`.
   - Complete relations and indexes supporting cascading deletes and foreign key lookups.
2. **Elasticsearch Geospatial Search**:
   - Multi-match full text search across task title, description, category, and helper skills.
   - Geo-distance plane calculation (`_geo_distance`) within configurable radii (5km–50km).
   - Dynamic reindexing scripts (`scripts/reindex-all.js`, `scripts/create-indices.js`).
3. **Task State Workflow**:
   - `OPEN` → `ASSIGNED` → `IN_PROGRESS` → `COMPLETED` / `CANCELLED`.
   - Task creation with coordinate attributes, budget in paise, and preferred completion dates.
4. **Helper ID Verification**:
   - Status pipeline (`UNVERIFIED` → `PENDING` → `VERIFIED` / `REJECTED`).
   - Admin moderation interface at `/dashboard/admin/verify-ids` with document preview and one-click actions.
5. **Direct Hiring Modal**:
   - Interactive `HireButton.js` enabling instant hiring directly from category listings (`/categories/[slug]`).
6. **Dual Role Dashboards**:
   - Customer Dashboard at `/dashboard` with task status overview and quick actions.
   - Helper Dashboard at `/dashboard-tasker` with today's work, active task counts, and earnings tracking.

---

## 🟡 Partially Implemented / Next in Queue

1. **In-App Task Chat UI**:
   - Backend WebSocket rooms and REST message history endpoints are 100% operational.
   - `socketClient.js` and `message.service.js` are in place.
   - **Next**: Embed a dedicated messaging chat box inside `/dashboard/my-tasks/[id]` and `/dashboard-tasker/my-tasks/[id]`.

2. **Razorpay Checkout Modal**:
   - Backend order creation (`/api/payments/create-order`) and signature verification (`/api/payments/verify`) tested and complete.
   - **Next**: Load the Razorpay Checkout JS SDK on the frontend upon task completion to trigger the UPI/Card payment modal.

3. **Global Socket Provider**:
   - Mount `initializeSocket()` inside `webapp/app/providers.js` or root layout to enable real-time toast alerts across the entire user session.

4. **Review Submission Dialog**:
   - Backend review calculation and leaderboards complete.
   - **Next**: Show a rating & review modal to both parties once a task is marked `COMPLETED`.

---

## Roadmap Milestones

### Phase 1: MVP Foundation & Local Density (Current)
- [x] Multi-category browsing & local helper listing
- [x] Hyperlocal task creation and acceptance
- [x] Elasticsearch integration with geospatial queries
- [x] ID verification and trust badges
- [x] Direct hire workflow
- [ ] Connect chat UI to task detail pages
- [ ] Mount live WebSocket notifications globally

### Phase 2: Transactions & Trust Expansion
- [ ] Razorpay web checkout integration
- [ ] Post-task review modal for customer and helper
- [ ] Map / Places API autocomplete for task location picker
- [ ] Email / SMS notification delivery for offline users
- [ ] Advanced moderation dashboard

### Phase 3: Mobile & Platform Scale
- [ ] React Native mobile application for Taskers (push notifications & live location)
- [ ] Real-time geolocation tracking during active tasks
- [ ] Multi-city expansion beyond initial density clusters
- [ ] Smart matching algorithm based on helper availability and historical ratings
- [ ] Dispute resolution & escrow holding system

---

## Known Issues & Technical Debt

1. **WebSocket Token Bearer Formatting**:
   - In `webapp/app/components/config/socketClient.js`, the token is passed as `Bearer ${token}`.
   - In `backend/src/config/socket.config.js`, `jwt.verify(token, ...)` expects the raw token string without `Bearer `.
   - **Fix**: Update `socket.config.js` to strip `token.replace(/^Bearer\s+/, '')` or pass raw token from `socketClient.js`.

2. **Uncommitted Staged/Unstaged UI Files**:
   - Working tree contains modifications to `webapp/app/page.js` (CustomDropdown integration) and `webapp/app/categories/[slug]/CategoryListingsClient.js` (HelperCard integration), along with new untracked components.
   - These changes need testing and committing to keep `main` clean.

3. **Hardcoded Mock Fallbacks**:
   - Some sections in `/dashboard/page.js` still display mock helper cards when no tasks are loaded. These should seamlessly show empty states or real nearby helpers.
