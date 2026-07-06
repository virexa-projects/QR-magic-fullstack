# QRBharat — India's Smartest QR Code Platform (Full-Stack)

A production-grade, highly scalable SaaS platform for creating, customizing, and tracking dynamic QR codes with real-time analytics. Built for high availability, low latency redirection, and role-based workspace management.

This repository is split into two main components:
- **`/frontend`**: Next.js 14 (App Router) client application.
- **`/backend`**: Node.js, Express, MongoDB, and Redis clustered backend server.

---

## 📂 Project Architecture

```
QR-fullstack/
├── frontend/             # Next.js 14 Frontend Application
│   ├── src/
│   │   ├── app/          # App Router pages and client-side providers
│   │   ├── components/   # UI elements (Shadcn), layout wrappers, and RouteGuard
│   │   ├── store/        # Redux Toolkit state (auth, users)
│   │   └── styles/       # Global styles (Tailwind CSS, fonts, theme tokens)
│   ├── package.json
│   └── tsconfig.json
│
├── backend/              # Node.js Clustered REST & Socket API
│   ├── src/
│   │   ├── config/       # Logger, Mongoose, and Redis setups
│   │   ├── models/       # Mongoose schemas (User, QR, Scan, AnalyticsDaily)
│   │   ├── controllers/  # HTTP request entrypoints
│   │   ├── services/     # Business logic layers (Redux/Auth/Scans/Billing)
│   │   ├── middlewares/  # Route Guards (RBAC, Rate Limiters, Quotas)
│   │   ├── routes/       # Express route mappings (/api/v1)
│   │   ├── sockets/      # Live scan update room handlers
│   │   └── cluster.ts    # CPU-threaded clustering server
│   ├── package.json
│   └── Dockerfile
│
└── README.md             # Combined project outline (this file)
```

---

## 🚀 Unified Getting Started

Follow these steps to run the full-stack application locally.

### 1. Setup Database Services
Make sure you have **MongoDB** and **Redis** running locally, or use Docker to launch them:
```bash
docker run -d -p 27017:27017 --name qrbharat-mongo mongo:latest
docker run -d -p 6379:6379 --name qrbharat-redis redis:alpine
```

### 2. Configure Environment Files
Copy the `.env.example` configurations in both projects:

* **Backend Environment (`/backend/.env`)**:
  ```bash
  PORT=5000
  MONGO_URI=mongodb://localhost:27017/qrbharat
  REDIS_URL=redis://localhost:6379
  JWT_SECRET=your_super_secret_jwt_key
  ```

* **Frontend Environment (`/frontend/.env`)**:
  ```bash
  NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
  NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
  ```

### 3. Install & Start Backend
Launch the API and seed databases:
```bash
cd backend
npm install
npm run seed       # Seeds default plans and a default Superadmin profile
npm run dev        # Starts server on http://localhost:5000
```

### 4. Install & Start Frontend
Launch the Next.js development server:
```bash
cd ../frontend
npm install
npm run dev        # Starts client on http://localhost:3000
```

Open [http://localhost:3000](http://localhost:3000) in your browser to access the application.

---

## 🔑 Key Features

### 1. Dynamic QR Redirection
- Dynamic QR codes point to a short-URL redirection handler (`/r/:shortCode`).
- Destinations can be updated instantly from the dashboard database without modifying or reprinting the physical QR graphic.
- Scan tracking processes IP addresses, user-agent browsers, operating systems, and location analytics asynchronously to ensure redirection speeds remain under **100ms**.

### 2. Live Scan Updates (Socket.IO)
- When a user scans a dynamic QR code, the backend automatically publishes a real-time event to the owner's socket room (`user:<userId>`).
- Dashboards update chart lines and scan metrics instantly without needing page refreshes or polling.

### 3. Role-Based Access Control (RBAC)
Enforced in the database, API middleware, and Client UI layers:
* `UserRole.USER` — Can create standard QRs and view their personal dynamic scan listings.
* `UserRole.ADMIN` / `UserRole.SUPERADMIN` — Has access to the billing portals, platform metrics charts, user tables, and administrative endpoints.
