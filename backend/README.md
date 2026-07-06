# QRBharat Backend

Production-grade, highly scalable backend for the **QRBharat** dynamic QR code SaaS platform. Built on **Node.js**, **Express**, **MongoDB** (Mongoose), **Redis**, and **Socket.IO**, written strictly in **TypeScript**.

Developed to seamlessly integrate with the `qrbharat-nextjs` App Router frontend to deliver dynamic redirections, real-time analytics, and role-based workspace management.

---

## 📂 File Structure

```
src/
├── config/             # Environment, Winston logger, MongoDB Mongoose, and Redis configurations
├── models/             # Mongoose Schemas & Types
│   ├── User.ts         # User profiles, hashed credentials, and role references
│   ├── Plan.ts         # Pricing tiers, scanning limits, and feature permissions
│   ├── Subscription.ts # Active subscription plans & invoice ledgers
│   ├── QRCode.ts       # QR configurations (static vs dynamic, shortCode keys, custom styles)
│   ├── Scan.ts         # Raw log of every single QR scan (raw source of truth)
│   ├── AnalyticsDaily.ts # Pre-aggregated daily rollup scans by device, location, and hour
│   └── RefreshToken.ts # Revocable refresh token ledger with TTL index-based cleanups
├── controllers/        # Express HTTP controller layers (forwards to services, returns ApiResponse)
├── services/           # Decoupled core business logic (auth, qr generation, analytics computation, billing)
├── middlewares/        # Express request processors
│   ├── auth.ts         # JWT validation check
│   ├── rbac.ts         # Role authorization guards (e.g. authorizeRoles)
│   ├── rateLimiter.ts  # Redis-backed distributed rate-limiting
│   ├── planLimit.ts    # Enforces QR creation limits based on user plan quota
│   ├── validate.ts     # Zod-based request validator middleware
│   └── errorHandler.ts # Global centralized JSON error payload formatter
├── routes/             # Versioned Express routes (/api/v1/)
├── sockets/            # Socket.IO handlers, rooms, and Redis adapter clustering integration
├── utils/              # Helper utilities (ApiError, ApiResponse, GeoIP parser, shortCode generator)
├── validators/         # Zod schemas for sanitizing HTTP requests
├── jobs/               # Node-cron jobs (expired plan sweeps, daily aggregator rollups, database seeds)
├── app.ts              # Connects security middlewares (Helmet, CORS, HPP) and api routers
├── server.ts           # Standard single-process entrypoint (DB init, Redis load, start servers)
└── cluster.ts          # Cluster-mode production entrypoint (spawns workers per CPU thread)
```

---

## ⚡ High-Availability & Scalability Architecture

To seamlessly support **1,000+ concurrent redirect requests** and real-time dashboard events, the backend employs:

* **Node.js Clustering (`cluster.ts`)**: Forks one worker process per logical CPU thread. Automatically spawns new worker replacements upon unexpected crashes.
* **Redis Adapter for Socket.IO**: Live scan triggers fan-out across all clustered instances, allowing real-time dashboard updates to synchronize regardless of the worker handling the redirect.
* **Redis-Backed Rate Limiting**: Centralized limits avoid local in-memory limit drift across multiple containerized servers.
* **Pre-Aggregated Daily Rollups (`AnalyticsDaily`)**: Dashboard queries fetch lightweight daily metrics logs rather than scanning millions of raw scan records. Queries are cached in Redis with short TTL limits.
* **Asynchronous Scans**: Redirect targets are resolved instantly. Analytics logging, browser parsing, and DB commits are performed asynchronously to minimize redirection lag.

---

## 🔑 Authentication & Access Control (RBAC)

Supports stateless JWT tokens and server-side blacklisting:
* **Access Tokens**: Short-lived (15 minutes), verify role permissions instantly.
* **Refresh Tokens**: Rotating, long-lived (30 days), stored in MongoDB for session revocation.
* **Roles Enforced**: `user`, `admin`, and `superadmin`. Secured using `authorizeRoles(...)` and owner-specific `authorizeOwnerOrRoles(...)` route handlers.

---

## 🚀 Getting Started

### Prerequisites
* Node.js >= 18.0.0
* MongoDB
* Redis

### Quickstart
1. Set up variables:
   ```bash
   cp .env.example .env
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Seed default plans and a default Superadmin profile:
   ```bash
   npm run seed
   ```
4. Run in development mode (hot-reloading with ts-node):
   ```bash
   npm run dev
   ```

### Production Deployment
Run using clustering:
```bash
npm run build
npm run start:cluster
```
Or run using Docker:
```bash
docker compose up --build
```
