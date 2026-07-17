"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAppSelector } from "@/store";
import { UserRole } from "@/store/slices/authSlice";

// Exact-match routes only accessible if NOT logged in (e.g. login/register).
// If an authenticated user lands here, they get bounced to /dashboard.
const PUBLIC_ONLY_ROUTES = ["/login", "/register"];

// Exact-match routes accessible to everyone, regardless of auth state.
const PUBLIC_ROUTES = ["/", "/about", "/pricing"];

// Prefix-match routes accessible to everyone, regardless of auth state.
// Use this (not PUBLIC_ONLY_ROUTES / PUBLIC_ROUTES) for anything with a
// dynamic segment, like /preview/[shortCode] — exact-match arrays can
// never match a real URL such as /preview/Jnxt2A7L.
//
// IMPORTANT: keep this in sync with SKIP_AUTH_CHECK_PREFIXES in
// Providers.tsx. Because AppInitializer deliberately never dispatches
// fetchCurrentUser() for these prefixes, state.auth.loading never flips
// to false here — so routes in this list must NOT gate their render on
// `loading`, only on `authorized`, or you get an infinite spinner.
const PUBLIC_ROUTE_PREFIXES = ["/preview"];

// Role-based restrictions (Path prefix -> Allowed roles)
const ROLE_PROTECTED_ROUTES: Record<string, UserRole[]> = {
  // Allow Admin and Superadmin for general dashboard, but restrict users
  "/dashboard/codes": [UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.USER],
  "/dashboard": [UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.USER],

  // Admin-only panels
  "/admin": [UserRole.ADMIN, UserRole.SUPERADMIN],
  // "/dashboard/billing": [UserRole.ADMIN, UserRole.SUPERADMIN,],
};

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, loading } = useAppSelector((state) => state.auth);
  const [authorized, setAuthorized] = useState(false);

  const isPublicPrefix = !!pathname && PUBLIC_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  useEffect(() => {
    const path = pathname;

    // Guard: pathname is null during initial hydration
    if (!path) return;

    // 0. Fully public prefix routes (e.g. /preview/[shortCode]) — always
    // authorized, whether the visitor is logged in or not, and doesn't
    // wait on the auth check at all (see note above on why).
    if (isPublicPrefix) {
      setAuthorized(true);
      return;
    }

    // Everything below this line waits on the initial Redux auth check.
    if (loading) return;

    // 1. If it's a public-only route (like /login) and the user IS authenticated, send to dashboard
    if (PUBLIC_ONLY_ROUTES.includes(path) && isAuthenticated) {
      setAuthorized(false);
      router.replace("/dashboard");
      return;
    }

    const isPublic = PUBLIC_ROUTES.includes(path) || PUBLIC_ONLY_ROUTES.includes(path);

    // 2. If it's NOT a public route and the user is NOT authenticated, send to login
    if (!isPublic && !isAuthenticated) {
      setAuthorized(false);
      router.replace(`/login?redirect=${encodeURIComponent(path)}`);
      return;
    }

    // 3. Role-based access control for protected routes
    if (isAuthenticated && user) {
      let hasRoleAccess = true;

      // Sort patterns by length descending to match most specific route first
      const sortedPatterns = Object.keys(ROLE_PROTECTED_ROUTES).sort((a, b) => b.length - a.length);
      const matchedPattern = sortedPatterns.find((pattern) => path.startsWith(pattern));

      if (matchedPattern) {
        const allowedRoles = ROLE_PROTECTED_ROUTES[matchedPattern];
        if (!allowedRoles.includes(user.role)) {
          hasRoleAccess = false;
        }
      }

      if (!hasRoleAccess) {
        setAuthorized(false);
        router.replace("/dashboard"); // Redirect unauthorized roles to dashboard
        return;
      }
    }

    // If we passed all checks, authorize the render
    setAuthorized(true);
  }, [isAuthenticated, loading, pathname, user, router, isPublicPrefix]);

  // Public-prefix routes never wait on `loading` — only on `authorized`,
  // which the effect above sets synchronously on mount.
  const stillWaiting = isPublicPrefix ? !authorized : loading || !authorized;

  if (stillWaiting) {
    // Return null or a subtle loader to prevent flashing protected content
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return <>{children}</>;
}