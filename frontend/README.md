# QRBharat Frontend

Production-ready frontend for the **QRBharat** dynamic QR code SaaS platform, built on Next.js 14 (App Router), TypeScript, Tailwind CSS, Redux Toolkit, and TanStack Query.

---

## 📂 File Structure

```
src/
├── app/
│   ├── layout.tsx             # Root layout (Metadata, HTML shell, Providers wrapper)
│   ├── providers.tsx          # Client providers ('use client') for Redux, QueryClient, and Toast
│   ├── page.tsx               # Home landing page (/)
│   ├── not-found.tsx          # 404 fallback page
│   ├── login/
│   │   └── page.tsx           # Authentication login page
│   ├── register/
│   │   └── page.tsx           # Authentication registration page
│   └── dashboard/
│       ├── layout.tsx         # Dashboard shell containing sidebar and top header navigation
│       ├── page.tsx           # Dashboard main overview content
│       ├── analytics/
│       │   └── page.tsx       # Live scanning analytics page
│       ├── billing/
│       │   └── page.tsx       # Stripe/Razorpay billing page
│       ├── create/
│       │   └── page.tsx       # Dynamic and Static QR creation flow
│       ├── codes/
│       │   ├── page.tsx       # User's created QR codes listing page
│       │   └── [id]/
│       │       └── page.tsx   # Dynamic detailed analytics page for a single QR code
│       └── users/
│           └── page.tsx       # User management table/dashboard (for Admin/Superadmin)
├── components/
│   ├── auth/
│   │   ├── RouteGuard.tsx     # Handles role-based client-side route protection
│   │   ├── ProtectedRoute.tsx # Route-level wrapper for custom user pages
│   │   └── PublicRoute.tsx    # Restricts authenticated users from entering login/register
│   ├── dashboard/
│   │   ├── DashboardSidebar.tsx # Sidebar navigation (shows items based on user role)
│   │   ├── DashboardLayout.tsx  # Legacy layouts, kept for component backwards compatibility
│   │   ├── DownloadPopover.tsx  # Handles exports (PNG, SVG, PDF)
│   │   └── LabeledInputList.tsx # Dynamic design customizer helpers
│   ├── dashboard-pages/
│   │   ├── OverviewContent.tsx  # Overview page component
│   │   ├── AnalyticsContent.tsx # Analytics aggregate reports
│   │   ├── BillingContent.tsx   # Subscription management
│   │   ├── CodesContent.tsx     # QR list view & actions
│   │   └── QRDetailContent.tsx  # Individual QR metrics & graph reports
│   ├── ui/                    # Shadcn UI base components (inputs, alerts, sidebars, buttons)
│   ├── Navbar.tsx             # Global landing page navigation header
│   ├── HeroSection.tsx        # Main CTA visual hero section
│   ├── featuresSection.tsx    # Features checklist representation
│   ├── QRGenerator.tsx        # Inline landing-page static QR tool
│   ├── PricingSection.tsx     # SaaS pricing tiers pricing grid
│   └── Footer.tsx             # Main bottom footer info links
├── store/
│   ├── index.ts               # Redux configureStore & Typed Hooks (useAppDispatch, useAppSelector)
│   └── slices/
│       └── authSlice.ts       # Auth state, login/logout extraReducers, fetchCurrentUser asyncThunks
├── styles/
│   └── globals.css            # Base Tailwind layers, Space Grotesk/Inter fonts, editorial palette CSS variables
├── hooks/                     # Custom shared React hooks (e.g. useSidebar, useIsMobile)
├── lib/                       # Utility configurations (api client axios instance, mockData, auth constants)
└── types/                     # Shared interface schemas and enums
```

---

## 🔒 Role-Based Access Control (RBAC)

The frontend features dynamic client-side route protection inside the `RouteGuard.tsx` component. It enforces access restrictions based on user roles defined in the `UserRole` enum:

```typescript
export enum UserRole {
  SUPERADMIN = "superadmin",
  ADMIN = "admin",
  USER = "user",
}
```

### Route Protections
Route constraints are mapped in `RouteGuard.tsx`:
* `/dashboard` — Requires `ADMIN` or `SUPERADMIN` permissions.
* `/dashboard/codes` — Accessible to all logged-in roles (`USER`, `ADMIN`, `SUPERADMIN`).
* `/dashboard/billing` — Restructured to prevent standard `USER` accounts from accessing billing/invoices.

### Menu Links Filter
The `DashboardSidebar.tsx` reads the current user session and removes links the user does not have permission to view.

---

## 🚀 Getting Started

### Development
1. Clone the project and set up variables:
   ```bash
   cp .env.example .env
   ```
2. Install package dependencies:
   ```bash
   npm install
   ```
3. Run the hot-reloading development server:
   ```bash
   npm run dev
   ```

### Building for Production
Create the optimized production build:
```bash
npm run build
npm run start
```
