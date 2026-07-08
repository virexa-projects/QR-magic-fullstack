"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAppSelector } from "@/store";
import { UserRole } from "@/store/slices/authSlice";

// Define your routing rules here
const PUBLIC_ONLY_ROUTES = ["/login", "/register","/preview"]; // Only accessible if NOT logged in
const PUBLIC_ROUTES = ["/", "/about", "/pricing"]; // Accessible to everyone

// Role-based restrictions (Path prefix -> Allowed roles)
const ROLE_PROTECTED_ROUTES: Record<string, UserRole[]> = {
  // Allow Admin and Superadmin for general dashboard, but restrict users
  "/dashboard/codes": [UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.USER],
  "/dashboard": [UserRole.ADMIN, UserRole.SUPERADMIN],
  
  // Admin-only panels
  "/admin": [UserRole.ADMIN, UserRole.SUPERADMIN],
  "/dashboard/billing": [UserRole.ADMIN, UserRole.SUPERADMIN],
};

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, loading } = useAppSelector((state) => state.auth);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    // Wait until the initial Redux auth check finishes
    if (loading) return;

    const path = pathname;

    // Guard: pathname is null during initial hydration
    if (!path) return;

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
      const matchedPattern = sortedPatterns.find(pattern => path.startsWith(pattern));

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
  }, [isAuthenticated, loading, pathname, user, router]);

  // Show a loading state while Redux fetches user or while router is determining authorization
  if (loading || !authorized) {
    // Return null or a subtle loader to prevent flashing protected content
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return <>{children}</>;
}
