# HireBuddy Admin Portal

A dedicated, modern React + Vite + Tailwind CSS admin control center for HireBuddy platform operations, parallel to `backend` and `webapp`.

---

## 🚀 Quick Start

```bash
# Navigate to admin directory
cd admin

# Install dependencies (already installed)
npm install

# Start Vite dev server on port 3001
npm run dev
```

- **Admin UI**: [http://localhost:3001](http://localhost:3001)
- **Backend API**: [http://localhost:8080/api](http://localhost:8080/api)
- **Customer Webapp**: [http://localhost:3000](http://localhost:3000)

---

## 🔐 Admin Authentication

The admin portal supports **1-Click Quick Demo Access** as well as standard token/credential entry:
- **Default ID Verify Token**: `hirebuddy_admin_secret_2026`
- Matches `ID_VERIFY_TOKEN` in `backend/.env`.

---

## 🛠️ Key Modules & Capabilities

1. **Dashboard (`/`)**
   - KPI metric cards: Total Helpers, Registered Users, Total Tasks, Pending ID Submissions, Platform GMV.
   - Live ID verification queue preview with 1-click review.
   - Recent tasks feed with status badges.

2. **ID Verifications (`/verifications`)**
   - Review pending helper identity proof uploads.
   - Full document preview modal (Aadhaar / Driving License / Voter ID).
   - "Approve & Mark Verified" action.
   - "Reject" modal with feedback notes.

3. **Helper Directory (`/helpers`)**
   - Comprehensive helper partner directory.
   - Filter by verification status (`ALL`, `VERIFIED`, `PENDING`, `UNVERIFIED`) and City (`Meerut`, `Noida`, `Delhi`, etc.).
   - Helper profile inspection modal with contact details, ratings, experience, and registered skills.

4. **User Management (`/users`)**
   - User database covering both Customers (`USER`) and Service Providers (`HELPER`).
   - Search by name, phone, email, or city.
   - Direct counts of tasks posted vs tasks assigned.

5. **Task Management (`/tasks`)**
   - Real-time status pipeline tabs: `ALL`, `REQUESTED`, `OPEN`, `ASSIGNED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`.
   - Category filtering & keyword search.
   - Task detail modal with customer, assigned helper, budget (₹), and payment state.

6. **Service Categories (`/categories`)**
   - Real-time sync with database categories (`/api/tasks/categories`).
   - Sub-services tags and popular category flags.

7. **Platform Analytics (`/analytics`)**
   - Financial GMV & completed volume breakdown.
   - Task fulfillment & conversion rates.
   - Trust index (% verified helpers).
   - Geographic distribution across NCR cities.

8. **Settings & System Health (`/settings`)**
   - Live backend ping test with latency (ms).
   - Admin token tester & LocalStorage persistence.
   - System diagnostics and session sign out.

---

## 📦 Tech Stack
- **Framework**: React 19 + Vite 6
- **Router**: React Router DOM v7
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite`)
- **Icons**: Lucide React
- **Design System**: Dark executive mode (`slate-950` / `emerald-400` accents) with Plus Jakarta Sans typography.
