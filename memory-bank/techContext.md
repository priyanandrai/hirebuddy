# HireBuddy — Technical Context

## Technology Stack Overview

### Backend (Node.js & Express)
| Layer / Tool | Technology / Library | Version | Purpose |
|---|---|---|---|
| **Runtime** | Node.js (ES Modules, `"type": "module"`) | LTS (v20+) | Core runtime environment |
| **Framework** | Express | `^5.2.1` | REST API routes and HTTP middleware |
| **Database** | MariaDB / MySQL | 10.x / 8.x | Persistent relational storage |
| **ORM / Client** | Prisma Client + MariaDB Adapter | `^7.10.0` | Type-safe queries, migrations, adapter mode |
| **Search Engine** | Elasticsearch | `^9.5.1` | Geospatial and full-text search indexing |
| **Real-time** | Socket.IO | `^4.7.0` | Live chat rooms, notifications, typing indicators |
| **Payments** | Razorpay Node SDK | `^2.9.6` | Order creation, payments, refund management |
| **Auth & Security** | `jsonwebtoken`, `bcrypt` | `^9.0.3`, `^6.0.0` | Password hashing & JWT token issuance |
| **Environment** | `dotenv` | `^17.2.3` | Multi-environment config loading |
| **Dev Tooling** | `nodemon` | `^3.1.11` | Hot-reloading development server |

### Frontend (Next.js 16 & React 19)
| Layer / Tool | Technology / Library | Version | Purpose |
|---|---|---|---|
| **Framework** | Next.js (App Router) | `16.1.1` | Server & client component rendering, routing |
| **UI Library** | React & React-DOM | `19.2.3` | Component architecture and state management |
| **Styling** | Tailwind CSS v4 (`@tailwindcss/postcss`) | `^4` | Utility-first responsive dark styling |
| **Icons** | Lucide React | `^0.562.0` | Vector icon library |
| **Client Auth** | NextAuth.js | `^4.24.13` | Google OAuth provider & session provider |
| **Client Sockets**| `socket.io-client` | Compatible | WebSocket connection to backend |
| **Linter** | ESLint + Next.js config | `^9` | Code formatting & static analysis |

---

## Environment Variables Configuration

### Backend (`backend/.env`)
```bash
PORT=8080
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# MariaDB / MySQL Database Connection
DATABASE_URL="mysql://username:password@localhost:3306/hirebuddy"

# JWT Signing Secret
JWT_SECRET="your_strong_jwt_secret_key"

# Razorpay Credentials
RAZORPAY_KEY_ID="rzp_test_xxxxxxxx"
RAZORPAY_KEY_SECRET="your_razorpay_secret"

# Elasticsearch Configuration
ELASTICSEARCH_URL="http://localhost:9200"
ELASTICSEARCH_API_KEY="" # Optional if using API key auth
```

### Frontend (`webapp/.env` or `.env.local`)
```bash
NEXT_PUBLIC_API_URL="http://localhost:8080"
NEXT_PUBLIC_SOCKET_URL="http://localhost:8080"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your_nextauth_session_secret"

# Google OAuth Credentials
GOOGLE_CLIENT_ID="your_google_client_id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your_google_client_secret"
```

---

## Local Development Setup & Commands

### Backend Initialization
```bash
cd backend

# Install dependencies
npm install

# Generate Prisma Client with MariaDB adapter
npx prisma generate

# Apply existing migrations
npx prisma migrate deploy

# (Optional) Seed initial helpers for testing
node scripts/seed-helpers.js

# (Optional) Create Elasticsearch indices & sync DB records
npm run es:create-indices
npm run es:reindex

# Start development server
npm run dev # Runs nodemon on port 8080
```

### Frontend Initialization
```bash
cd webapp

# Install dependencies
npm install

# Start Next.js development server
npm run dev # Runs on http://localhost:3000

# Production build test
npm run build
```

---

## Database Migration & Schema Notes
- **Prisma MariaDB Adapter**: Backend uses `@prisma/adapter-mariadb` initialized via `PrismaMariaDb` connection string wrapper in `src/utils/prisma.js`.
- **Primary Migration History**:
  - `20251229065618_init`: Core user and task setup.
  - `20260101072508_phone_auth`: Phone number OTP tables and fields.
  - `20260101164927_task_flow`: Expanded task states.
  - `20260113170140_add_notifications`: Real-time notification entity.
  - `20260818074155_init_setup`: Expanded payment, review, and chat models.
  - `20260916072349_add_id_verification`: Added `idVerificationStatus`, `idDocumentUrl`, `idVerifiedAt`, `idVerificationNotes`.

---

## Key Technical Constraints & Gotchas
1. **ES Modules (`import`/`export`)**: The backend package specifies `"type": "module"`. All internal file imports must include the explicit `.js` extension (e.g., `import prisma from "./utils/prisma.js"`).
2. **Socket Authentication Token Prefix**: In `socketClient.js`, the token is sent with `Bearer ${token}`. In `socket.config.js`, verify whether `jwt.verify` receives `token.replace(/^Bearer\s+/, '')` or clean token to avoid token validation mismatch.
3. **Database Port & Adapter**: Ensure MariaDB/MySQL is running and reachable on port specified in `DATABASE_URL`.
4. **Elasticsearch Resilience**: Elasticsearch is designed as non-blocking. If ES is offline, backend logs a warning on startup and search routes fall back to SQL database queries without crashing the service.
