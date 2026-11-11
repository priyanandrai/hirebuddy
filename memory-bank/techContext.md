# HireBuddy — Technical Context

## Technology Stack Overview

### 1. Backend (`backend/`)
| Layer / Tool | Technology / Library | Version | Purpose |
|---|---|---|---|
| **Runtime** | Node.js (ES Modules, `"type": "module"`) | v20+ | Core server runtime |
| **Framework** | Express | `^5.2.1` | REST API routing & middleware |
| **Database** | MariaDB / MySQL | 10.x / 8.x | Relational persistence for 32 Prisma models |
| **ORM** | Prisma Client + `@prisma/adapter-mariadb` | `^7.10.0` | Schema management, migrations, type-safe queries |
| **Search Engine** | `@elastic/elasticsearch` | `^9.5.1` | Geospatial (`geo_point`) & full-text search with DB fallback |
| **Real-time** | Socket.IO | `^4.7.0` | Task chat rooms, live status updates, notifications |
| **Payments** | Razorpay SDK + Custom Gateway Factory | `^2.9.6` | Razorpay Route & Cashfree Split adapters, escrow, webhooks |
| **Security & Vault** | `jsonwebtoken`, `bcrypt`, Node `crypto` | `^9.0.3`, `^6.0.0` | JWT auth, password hashing, AES-256-GCM PAN/Bank encryption |
| **File Uploads** | `multer` | `^2.4.0` | KYC documents, task attachments, marketplace product images |
| **Testing** | Node.js built-in test runner + `fast-check` | `node --test` | Automated unit, property-based, tax/ledger, and SEO E2E tests |

### 2. Main Web Application (`webapp/`)
| Layer / Tool | Technology / Library | Version | Purpose |
|---|---|---|---|
| **Framework** | Next.js (App Router) | `16.1.1` | SSR/SSG SEO pages, dynamic metadata, client dashboards |
| **UI Library** | React & React-DOM | `19.2.3` | Component architecture |
| **Styling** | Tailwind CSS v4 (`@tailwindcss/postcss`) | `^4` | Responsive utility styling |
| **Icons** | `lucide-react` | `^0.562.0` | Vector UI icons |
| **Auth** | `next-auth` + Custom JWT | `^4.24.13` | Google OAuth & phone/OTP session management |
| **Real-time** | `socket.io-client` | `^4.8.4` | WebSocket client |

### 3. Standalone Admin Portal (`admin/`)
| Layer / Tool | Technology / Library | Version | Purpose |
|---|---|---|---|
| **Build Tool** | Vite | `^6.1.0` | Fast SPA bundling & HMR |
| **UI & Routing** | React 19 + `react-router-dom` | `^19.0.0`, `^7.1.5` | Multi-page admin console |
| **Styling & Icons** | Tailwind CSS v4 (`@tailwindcss/vite`) + `lucide-react` | `^4.0.0` | Admin UI components & data tables |

### 4. Mobile Application (`mobile/`)
| Layer / Tool | Technology / Library | Version | Purpose |
|---|---|---|---|
| **Framework** | Expo + React Native | `~51.0.0` / `0.74.5` | Cross-platform iOS/Android mobile app |
| **Real-time** | `socket.io-client` | `^4.8.1` | Real-time task & chat updates |

---

## Environment Variables Configuration

### Backend (`backend/.env`)
```bash
PORT=8080
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# MariaDB / MySQL Connection
DATABASE_URL="mysql://username:password@localhost:3306/hirebuddy"

# Auth & Encryption Secrets
JWT_SECRET="your_strong_jwt_secret_key"
VAULT_ENCRYPTION_KEY="32_byte_hex_or_base64_key_for_pan_and_bank_vault"

# Payment Gateways (Razorpay & Cashfree)
RAZORPAY_KEY_ID="rzp_test_xxxxxxxx"
RAZORPAY_KEY_SECRET="your_razorpay_secret"
RAZORPAY_WEBHOOK_SECRET="your_webhook_secret"

# Elasticsearch (Optional - falls back to MariaDB if offline)
ELASTICSEARCH_URL="http://localhost:9200"
ELASTICSEARCH_API_KEY=""
```

### Frontend (`webapp/.env.local`)
```bash
NEXT_PUBLIC_API_URL="http://localhost:8080"
NEXT_PUBLIC_SOCKET_URL="http://localhost:8080"
NEXT_PUBLIC_SITE_URL="https://hirebuddy.in"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your_nextauth_session_secret"
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"
```

---

## Development, Build & Test Commands

### Backend (`cd backend`)
```bash
npm install
npx prisma generate          # Generate Prisma Client
npx prisma db push           # Or npx prisma migrate deploy
npm run dev                  # Start Express + Socket.IO server on :8080
npm test                     # Run full test suite (Payments/Tax + SEO/E2E)
npm run test:payments        # Run marketplace payment, GST, TDS/TCS, ledger tests
npm run test:seo             # Run SEO CMS, sitemap, and E2E tests
npm run es:create-indices    # Create Elasticsearch indices
npm run es:reindex           # Sync MariaDB records to Elasticsearch
```

### Webapp (`cd webapp`)
```bash
npm install
npm run dev                  # Start Next.js dev server on :3000
npm run build                # Production Next.js build
```

### Admin Portal (`cd admin`)
```bash
npm install
npm run dev                  # Start Vite dev server
npm run build                # Build production bundle to admin/dist
```

### Mobile App (`cd mobile`)
```bash
npm install
npm start                    # Start Expo server
```

---

## Key Technical Conventions
1. **ES Modules Everywhere**: Backend uses `"type": "module"`. Always include `.js` extensions in relative imports.
2. **Integer Paise & Basis Points**: Never use floating point math for tax, commission, or ledger calculations. Use integer paise (`₹1 = 100 paise`) and basis points (`1% = 100 bps`).
3. **Graceful Degradation**: Both Elasticsearch indexing/search and Firebase FCM push notifications are non-blocking so local development and automated tests run smoothly without external cloud dependencies.
